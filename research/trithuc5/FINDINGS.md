# FINDINGS — TRITHUC5.0 V5.4.6 (current live build)

**Target:** `https://trithuc500.vercel.app/`  
**Build:** SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`, 2,777,970 bytes, 39,205 lines, fetched 2026-11-24T12:14:00Z.  
**Scope:** client-side only, plus one read-only HTTP GET to the new same-origin results endpoint. Every PoC runs in the attacker's own browser. Nothing is published to ntfy.sh, keyvalue.immanuel.co or Google Forms, and no real account is touched.  
**Build delta:** [`PHASE5_UPDATE.md`](PHASE5_UPDATE.md) records the V4.8.6 → V5.4.6 changes. Older line numbers are history only.

Each finding maps to exactly one runnable PoC in `poc/`. Two PoC types:

| Type | Meaning |
|---|---|
| **DISPLAY** | Read-only evidence. Shows exposed data, a misconfiguration, or a verified fix. No state change and no transmission beyond the documented read-only probe. |
| **ACTION** | Changes the client mechanism to prove the bypass, then verifies. Every ACTION PoC ships a restore function. |

---

## Severity summary

| Severity | Findings |
|---|---|
| **Critical** | NEW-11 |
| **High** | F-01, F-03, NEW-13, NEW-14, NEW-17 |
| **Medium** | F-05, NEW-07, NEW-08, NEW-10 |
| **Low / Informational** | NEW-02, F-06, NEW-03, NEW-05, NEW-06 |
| **Fixed / disabled** | F-02, NEW-15, F-04, NEW-08, NEW-01, NEW-03 nonce/age paths, NEW-04, NEW-09, NEW-16, unsigned F-01 tombstone, boot auto-seal, plaintext admin remember-me, public keyvalue.immanuel.co writes |

Release verdict: **blocked**. V5.4.6 fixed admin login, exam grading and Google Form disclosure, but VIP entitlement and tamper detection remain client-authoritative, and `/api/results` is readable without authentication. See [`EXECUTIVE_SUMMARY.md`](EXECUTIVE_SUMMARY.md).

---

## Critical

### NEW-11 — VIP approval seal uses a client-side secret
`computeTeacherVipApprovalSealV44` (line 19551) derives the "teacher approval" seal from
a client-shipped canonical master literal plus the fixed suffix `THAY_TRUNG_MASTER_SEAL_2026`.
V5.4.2 added `isValidTeacherVipSealV522` (line 19561) with legacy-seal migration, but the
canonical secret remains in the public bundle. The seal is still reproducible offline.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` — real V5.4.6 functions, end-to-end (`P4-16`, IV-09).

---

## High

### F-01 — Cloud sync publishes identity records; signed tombstone path remains forgeable
The compact user list is still broadcast to two public ntfy topics. V4.8.5 disabled the
public keyvalue.immanuel.co path (`CLOUD_KV_DISABLED_V485 = true`, line 4301), so the KV
namespace is no longer written by the client. `serializeCompactUser` (line 5601) still blanks
`p`, `seal` and `bkt`, but identity fields remain in the wire format.
`processIncomingCloudPacket` (line 5769) still requires a verified admin signature for
`deletedMap` / `deletedUsernames`; unsigned tombstones are rejected. The admin signature
itself is computed from a bundle literal, so a locally signed tombstone still merges.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY), `poc/poc_new02_packet_injection.js` (ACTION — local packet path)
- **Evidence state:** `LOCAL_CONFIRMED`; live ntfy content `UNVERIFIED`.

### F-03 — VIP entitlement is decided entirely client-side
`hasStudentVipAccess` (line 6915), `verifyProtectedVipActionV44` (line 15856) and
`BackendVipAuthServiceV44` (line 15592) read client-owned fields. The vault is an in-client
`Map` rebuilt from client data — a consistency check, not a trust anchor. Forging `_sig` and
`_adminVipSeal` offline still passes every gate (`P4-16`, IV-02b…IV-09).
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-13 — Tamper detection adds a structural invariant but trusts bundle literals
`detectAndBlockStudentVipHackV44` (line 15924) rejects VIP flags when `_sig` /
`_adminVipSeal` are missing or wrong. An ordinary-looking renamed account with VIP but no
signature is detected (`P4-02`). Recomputing both artifacts offline still evades the invariant.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix + residual).

### NEW-14 — Privileged-id exemptions are partially closed
V4.8.x removed the `isAdminTester` detector exemption and detects VIP flags on
`stu_free_12b1` / `stu_practice_e` (`P4-08`, IV-11). `gv_test` still skips the detector, and
`verifyRuntimeSecurityIntegrity` (line 4172) still skips the whole student block for the three
privileged ids. `isAdminExamAttempt` (line 14020) still exempts `isAdminTester` / `gv_test`.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY — enumerates privileged records)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix + residual).

### NEW-17 — Unauthenticated results API exposes student result records — **NEW**
V5.4.6 added `GET /api/results` (line 4814) and `POST /api/results` (line 4692). The client
sends `credentials: 'same-origin'` but no Authorization header. A single read-only curl GET
without any cookie returned HTTP 200, `Cache-Control: no-store`, `ok=true`, and two records
with fields including `username`, `name`, `class`, `school`, `score`, `examTitle`, `startTime`,
`endTime`, `tabSwitches` and `aiSuspicionCount`. Values were not printed, stored or replicated.
POST authorization is **UNVERIFIED** because no write test was performed.
- **PoC:** `poc/poc_new17_results_api.js` (DISPLAY — one GET, metadata only)
- **Evidence state:** `LOCAL_CONFIRMED` + `READ-ONLY LIVE PROBE`.

---

## Medium

### F-05 — Device lock and Gmail binding are client-owned fields
`verifyAndBindStudentDeviceOnLogin` (line 4028) enforces limits from `u.trustedDevices`,
`u.maxDevices`, `u.gmail` and `u.status`. `setSimulatedDeviceSlot` (line 31257) is gated by
`requireAdminAuth`, but the underlying local fields remain writable and the display PoC still
demonstrates the client-only lock.
- **PoC:** `poc/poc_f05_device_lock.js` (DISPLAY by default, opt-in ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-07 — Cross-tab state replacement partially validated
`setupCrossTabUserSync` (line 34517) replaces `state.users` / `state.activityLogs` wholesale
from localStorage, but V4.8.x strips VIP flags from records whose `_sig` / `_adminVipSeal`
do not verify. Non-VIP fields still propagate from writable localStorage into every open tab.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY + opt-in local probe)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-10 — Admin-tester flag suppresses audit logging
`isAdminExamAttempt` (line 14020) still returns `true` for `isAdminTester` and `gv_test`,
dropping their log entries. `stu_free_12b1` returns `false`, so public-exam guests are logged.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-08 — Activity log still leaves the site via a third-party form
`syncActivityLogToGoogleForm` (line 7394) still POSTs log entries. `logStudentActivity`
(line 7419) masks password-like `detail` values: the synthetic sentinel no longer reaches
`entry.444` (IV-21/IV-22). Other log fields still leave the site.
- **PoC:** `poc/poc_new08_new09_leakage.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED` for the masking fix; live form delivery `UNVERIFIED`.

---

## Low / Informational

### F-04 — Exam answers ship in the bundle
V5.4.6 keeps the gzip + PRNG-XOR vault (`var __ENC_GZ` at line 1464) with claim token
`TT50_V45_INTERNAL_BOOT_SEAL` (line 1967). The token and chunk seed `0x4F81E3A7` are bundle
literals. The isolated decoder recovered **15 exams / 330 answer entries** offline
(`F-04-T01`). Grading remains client-side; no server grading endpoint exists.
- **PoC:** `poc/poc_f04_exam_answers.js` (DISPLAY — claims or decodes the vault)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-02 — Unsigned cloud packet injection
Non-admin packets are still forced to `pending` / non-VIP. The internal cloud bus was removed
(NEW-04), but the local `BroadcastChannel` handler still feeds raw objects to
`processIncomingCloudPacket`; an unauthenticated local script can insert a pending user record.
The unsigned tombstone path is fixed (F-01).
- **PoC:** `poc/poc_new02_packet_injection.js` (ACTION, local only; uses the real BC path)
- **Evidence state:** `LOCAL_CONFIRMED` (downgrade verified; residual insertion verified).

### F-06 — Anti-cheat is UX-only
`preventDefault`, DOM overlays, CSS blur, watermark. Handlers are closure-local, so the
reliable bypass is blocking listener registration at `document-start`.
- **PoC:** `poc/poc_f06_anticheat.js` (ACTION — console neutraliser + userscript variant)
- **Evidence state:** `LOCAL_CONFIRMED` (user-tested userscript).

### NEW-03 — Replay/expiry guard added, but nonce is optional
`processIncomingCloudPacket` rejects packets older than 26 hours and tracks
`__SEEN_CLOUD_NONCES_V480__` (line 5768) to reject a replayed nonce. A packet without a nonce
is still only idempotent, not replay-protected.
- **PoC:** `tests/phase3_tests.js` P3-03, `tests/run_all.js` F-01-T06/T07 (regression)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-05 — Gemini OCR key moved to sessionStorage
`TRUNG_GEMINI_OCR_KEY` is removed from `localStorage` at boot and read from `sessionStorage`
(line 25342). A same-origin script can still read a key the user has entered; no build-time
key was found.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY, values redacted by default)
- **Evidence state:** `STATIC_CONFIRMED` (partial fix).

### NEW-06 — Security headers partially hardened
`current.headers`: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy` are present.
There is still no CSP and `Access-Control-Allow-Origin: *` remains.
- **PoC:** `tests/run_all.js` A-03-T01 (static regression)
- **Evidence state:** `STATIC_CONFIRMED` (partial fix).

---

## What V4.8.5 / V5.4.6 fixed

| Earlier issue | Status | Proof |
|---|---|---|
| Admin auth / session forgery (F-02) | **Fixed** — server `/api/admin/login`, ephemeral salt, no hash literals, remembered session cleared at boot | `F-02-T01/T05`, `P4-11`, `IV-20` |
| Offline admin-preview bypass (NEW-15) | **Fixed** — orphan preview flag cleared; server-verified session required | `P4-10`, `IV-16`…`IV-19` |
| Public keyvalue.immanuel.co writes | **Disabled** — `CLOUD_KV_DISABLED_V485 = true` | `P3-04`, static assertion |
| Password in compact wire format (NEW-01) | **Fixed** — `p: ''` | `P3-04`, F-01-T13, SC-08 |
| Seal / backend token in wire format (NEW-16) | **Fixed** — `seal: ''`, `bkt: ''` | F-01-T13, `P3-04` |
| Password-like detail reaches Google Form (NEW-08) | **Fixed for the tested sentinel** | IV-21/IV-22 |
| Sensitive keys mirrored to weak stores (NEW-09) | **Fixed** | `P3-02`, IV-24 |
| Unsigned tombstone merge (F-01 residual) | **Fixed** | `P4-19`, IV-29, F-01-T12/T16 |
| Replay / 26-hour stale packets (NEW-03) | **Fixed when nonce is present**; nonce remains optional | F-01-T06/T07, `P3-03`, SC-05 |
| Internal cloud bus (NEW-04) | **Fixed** | F-01-T14 |
| V4.5 boot auto-seal (NEW-12) | **Fixed** | `P4-14`, IV-10 |
| Plaintext admin remember-me | **Fixed** | `P3-08` |

These are barriers, not a complete trust boundary.

---

## Regression suites (all current-build results)

| Suite | Checks | Result |
|---|---|---|
| `tests/run_all.js` | 41 | 41 pass / 0 fail |
| `tests/phase3_tests.js` | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 60 | 60 pass / 0 fail |
| `tests/independent_verification.js` | 36 | 36 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 7 pass / 2 expected failures (SC-07, SC-09) |

Run them all:

```bash
export TRITHUC_SOURCE=/absolute/path/to/V5.4.6/target.html
node research/trithuc5/tests/run_all.js
node research/trithuc5/tests/phase3_tests.js
node research/trithuc5/tests/phase4_tests.js
node research/trithuc5/tests/poc_suite_validation.js
node research/trithuc5/tests/independent_verification.js
node research/trithuc5/tests/secure_controls.js   # exits 1 until remediation
```

---

## PoC index

| File | Finding(s) | Type | Restore |
|---|---|---|---|
| `poc/poc_f01_student_data.js` | F-01 | DISPLAY | n/a (read-only) |
| `poc/poc_f02_admin_login.js` | F-02 (fixed verification) | DISPLAY | n/a |
| `poc/poc_f03_vip_entitlement.js` | F-03, NEW-11, NEW-13 | ACTION | `__AERO_F03_RESTORE__()` |
| `poc/poc_f04_exam_answers.js` | F-04 | DISPLAY | n/a (read-only) |
| `poc/poc_f05_device_lock.js` | F-05 | DISPLAY / opt-in ACTION | `__AERO_F05_RESTORE__()` |
| `poc/poc_f06_anticheat.js` | F-06 | ACTION | `__AERO_F06_STOP__()` |
| `poc/poc_new02_packet_injection.js` | NEW-02, F-01 fixed path | ACTION (local) | `__AERO_NEW02_CLEANUP__()` |
| `poc/poc_new05_new07_new10_misc.js` | NEW-05/07/10, NEW-14 | DISPLAY / opt-in ACTION | `__AERO_NEW07_RESTORE__()` |
| `poc/poc_new08_new09_leakage.js` | NEW-08/09 residual + fixed-channel check | DISPLAY | n/a (read-only) |
| `poc/poc_new15_admin_preview.js` | NEW-15 (fixed verification) | DISPLAY | n/a |
| `poc/poc_new17_results_api.js` | NEW-17 | DISPLAY (one GET) | n/a |
| `poc/verify_live_readonly.mjs` | live channel verification (Node) | DISPLAY | n/a (read-only) |

All PoCs are validated by `tests/poc_suite_validation.js` (60 checks), which executes each file in a mock browser and asserts the documented behaviour, including that DISPLAY PoCs make no writes and that every ACTION PoC writes nothing to ntfy/KV.

---

## Boundaries

- No packet was published to any production channel.
- No real account was accessed, modified, or impersonated.
- Only one new production request was made: an unauthenticated, read-only GET to `/api/results`; no values were retained.
- Live ntfy content remains `UNVERIFIED` (read-only checks found no usable recent snapshot).
- Historical documents for superseded V4.3.9/V4.4/V4.5/V4.8.0 builds are retained only where explicitly marked historical; the current tree is pinned to V5.4.6.
