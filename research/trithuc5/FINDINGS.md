# FINDINGS — TRITHUC5.0 V4.8.0 (current live build)

**Target:** `https://trithuc500.vercel.app/`
**Build:** SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`, 9,115,471 bytes, 34,599 lines, fetched 2026-11-22T04:48:27Z.
**Scope:** client-side only. Every PoC runs in the attacker's own browser. Nothing is published to ntfy.sh / keyvalue.immanuel.co and no real account is touched.
**Build delta:** [`PHASE5_UPDATE.md`](PHASE5_UPDATE.md) records the V4.6.7 → V4.8.0 changes. V4.4/V4.5 line numbers are history only.

Each finding maps to exactly one runnable PoC in `poc/`. Two PoC types:

| Type | Meaning |
|---|---|
| **DISPLAY** | Read-only evidence. Shows the exposed data or the misconfiguration. No state change, no transmission. |
| **ACTION** | Changes the client mechanism to prove the bypass, then verifies. Every ACTION PoC ships a restore function. |

---

## Severity summary

| Severity | Findings |
|---|---|
| **Critical** | NEW-11 |
| **High** | F-01, F-03, NEW-13 residual, NEW-14 residual, NEW-15 residual |
| **Medium** | NEW-07 residual, NEW-10, F-02, F-05, NEW-08 residual |
| **Low / Informational** | NEW-06 partial, F-04, NEW-02 residual, F-06, NEW-05 residual |
| **Fixed in V4.8.0** | NEW-01, NEW-03 (nonce/age paths), NEW-04, NEW-08 password masking, NEW-09 mirroring, NEW-16, unsigned F-01 tombstone, V4.5 NEW-12 boot auto-seal, plaintext admin remember-me |

Release verdict: **blocked**. See `EXECUTIVE_SUMMARY.md`. The core entitlement and admin trust boundaries remain entirely client-side and reproducible offline from bundle literals.

---

## Critical

### NEW-11 — VIP approval seal uses a client-side secret
`computeTeacherVipApprovalSealV44` (line 15816) derives the "teacher approval" seal from
`vaultLockConfig.adminPassHash || DEFAULT_VAULT_PASS_HASH_V45` (literal line 2054) plus the
literal `THAY_TRUNG_MASTER_SEAL_2026` (line 15821). Every other input is attacker-chosen.
V4.8.0 still ships the hash literal, so the seal remains reproducible offline.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` — real V4.8.0 functions, end-to-end (`P4-16`, IV-09).

---

## High

### F-01 — Cloud sync publishes user records; unsigned tombstones fixed, signed path forgeable
The compact user list is still broadcast to two public ntfy topics and a public KV namespace.
V4.8.0 blanks password, seal and backend token in `serializeCompactUser` (line 5546; fields
`p`, `seal`, `bkt` are `''`), but identity fields remain public. `processIncomingCloudPacket`
(line 5714) now **requires `isVerifiedAdmin`** for `deletedMap` / `deletedUsernames`, so an
unsigned tombstone is rejected (`P4-19`, IV-29). The admin signature itself is still computed
from a bundle literal, and a validly signed tombstone still deletes locally.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY), `poc/poc_new02_packet_injection.js` (ACTION — local packet path)
- **Evidence state:** `LOCAL_CONFIRMED`; live channel content `UNVERIFIED`.

### F-03 — VIP entitlement is decided entirely client-side
`hasStudentVipAccess` (line 6860), `verifyProtectedVipActionV44` (line 15801) and the whole
`BackendVipAuthServiceV44` "vault" (line 15537) read client-owned fields. The vault is an
in-client `Map` rebuilt from client data — a consistency check, not a trust anchor. V4.8.0
adds a structural signature/seal invariant to the detector, but forging `_sig` **and** the seal
offline from bundle literals still passes every gate (`P4-16`, IV-02b…IV-09).
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-13 — Tamper detection adds a structural invariant but trusts bundle literals
`detectAndBlockStudentVipHackV44` (line 15869) keeps the keyword heuristic and adds a
structural check that rejects VIP flags when `_sig` / `_adminVipSeal` are missing or wrong.
An ordinary-looking renamed account with VIP but no signature is now detected (`P4-02`).
Recomputing both artifacts offline evades the invariant again.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix + residual).

### NEW-14 — Privileged-id exemptions are partially closed
V4.8.0 removes the `isAdminTester` detector exemption and detects VIP flags on
`stu_free_12b1` / `stu_practice_e` (`P4-08`, IV-11). `gv_test` still skips the detector even
when it carries VIP flags, and `verifyRuntimeSecurityIntegrity` (line 4170) still skips the
whole student block for the three privileged ids. `isAdminExamAttempt` (line 13965) still
treats `isAdminTester` / `gv_test` as audit-log exempt.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY — enumerates privileged records)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix + residual).

### NEW-15 — Admin preview unlock-all still short-circuits every gate
V4.8.0 clears `state.adminPreviewUnlockAll` when `isAdminLoggedIn` is false, but an
offline-forged admin session (F-02) sets the logged-in flag, after which
`hasStudentVipAccess` (line 6860), `hasVerifiedPackageAccess` (line 6870) and
`verifyProtectedVipActionV44` (line 15801) all return `true` (`P4-10`, IV-16…IV-18).
- **PoC:** `poc/poc_new15_admin_preview.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix + residual).

---

## Medium

### F-02 — Admin authentication is client-side
V4.8.0 keeps client-side admin hashes (`DEFAULT_ADMIN_USER_HASHES_V45` /
`DEFAULT_ADMIN_PASS_HASH_V45`, lines 2052–2053; `loginAdmin()` at line 31852). The session
signature uses the bundle-literal salt `TRITHUC50_ADM_SALT_V27` (line 4166), and the restore
path (3739–3751) checks only that self-computed signature. Missing/invalid signatures are
rejected, but a valid signature is forgeable offline. The underlying credential hash is
unchanged from the V4.5 build and matches the legacy default by offline candidate check;
the literal is not republished in this report.
- **PoC:** `poc/poc_f02_admin_login.js` (ACTION — forge + action chain)
- **Evidence state:** `LOCAL_CONFIRMED`.

### F-05 — Device lock and Gmail binding are client-owned fields
`verifyAndBindStudentDeviceOnLogin` enforces limits from `u.trustedDevices`, `u.maxDevices`,
`u.gmail` and `u.status`. V4.8.0 gates the test-only `setSimulatedDeviceSlot` API behind
`requireAdminAuth` (line 31202), but the underlying local fields remain writable and the
display PoC still demonstrates the client-only lock.
- **PoC:** `poc/poc_f05_device_lock.js` (DISPLAY by default, opt-in ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-07 — Cross-tab state replacement partially validated
`setupCrossTabUserSync` (line 34455) still replaces `state.users` / `state.activityLogs`
wholesale from localStorage, but V4.8.0 strips VIP flags from records whose `_sig` /
`_adminVipSeal` do not verify. Non-VIP fields still propagate from a writable localStorage
into every open tab (`A-04-T02`).
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY + opt-in local probe)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-10 — Admin-tester flag suppresses audit logging
`isAdminExamAttempt` (line 13965) still returns `true` for `isAdminTester` and `gv_test`,
dropping their log entries. V4.8.0 changes `stu_free_12b1` to return `false`, so public-exam
guests are now logged.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-08 — Activity log still leaves the site via a third-party form
`syncActivityLogToGoogleForm` (line 7339) still POSTs log entries. V4.8.0 masks password-like
`detail` values in `logStudentActivity` (line 7364): the synthetic sentinel no longer reaches
`entry.444` (IV-21/IV-22). Other log fields (name, class, score, detail) still leave the site.
- **PoC:** `poc/poc_new08_new09_leakage.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED` for the masking fix; live form delivery `UNVERIFIED`.

---

## Low / Informational

### F-04 — Exam answers ship in the bundle
V4.8.0 keeps the gzip + PRNG-XOR vault (`var __ENC_GZ` at line 1464; chunk seeds from line
1496) with claim token `TT50_V45_INTERNAL_BOOT_SEAL` (line 1968). The token and exam chunk
seed `0x4F81E3A7` are bundle literals. The isolated decoder recovered **15 exams / 330 answer
entries** offline (`tests/run_all.js` F-04-T01). Grading is client-side; no server grading
endpoint exists.
- **PoC:** `poc/poc_f04_exam_answers.js` (DISPLAY — claims or decodes the vault)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-02 — Unsigned cloud packet injection
V4.8.0 keeps the V4.5 downgrade: non-admin packets are forced to `pending` / non-VIP. The
internal cloud bus was removed (NEW-04), but the local `BroadcastChannel` handler still feeds
raw objects to `processIncomingCloudPacket`; an unauthenticated local script can insert a
pending user record. The unsigned tombstone path is fixed (F-01).
- **PoC:** `poc/poc_new02_packet_injection.js` (ACTION, local only; uses the real BC path)
- **Evidence state:** `LOCAL_CONFIRMED` (downgrade verified; residual insertion verified).

### F-06 — Anti-cheat is UX-only
`preventDefault`, DOM overlays, CSS blur, watermark. Handlers are closure-local, so the
reliable bypass is blocking listener registration at `document-start`.
- **PoC:** `poc/poc_f06_anticheat.js` (ACTION — console neutraliser + userscript variant)
- **Evidence state:** `LOCAL_CONFIRMED` (user-tested userscript).

### NEW-03 — Replay/expiry guard added, but nonce is optional
`processIncomingCloudPacket` (line 5714) now rejects packets older than 26 hours and tracks
`__SEEN_CLOUD_NONCES_V480__` (line 5713) to reject a replayed nonce. A packet without a nonce
is still only idempotent, not replay-protected. The signed-stale path (`P3-03`) is fixed.
- **PoC:** `tests/phase3_tests.js` P3-03, `tests/run_all.js` F-01-T06/T07 (regression)
- **Evidence state:** `LOCAL_CONFIRMED` (partial fix).

### NEW-05 — Gemini OCR key moved to sessionStorage
V4.8.0 removes `TRUNG_GEMINI_OCR_KEY` from `localStorage` at boot and reads it from
`sessionStorage` (line 25287). A same-origin script can still read a key the user has entered;
no build-time key was found.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY, values redacted by default)
- **Evidence state:** `STATIC_CONFIRMED` (partial fix).

### NEW-06 — Security headers partially hardened
`current.headers`: `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` are now
present. There is still no CSP and `Access-Control-Allow-Origin: *` remains.
- **PoC:** `tests/run_all.js` A-03-T01 (static regression)
- **Evidence state:** `STATIC_CONFIRMED` (partial fix).

---

## What V4.8.0 fixed

| Earlier issue | V4.8.0 status | Proof |
|---|---|---|
| Password in compact wire format (NEW-01) | **Fixed** — `p: ''` | `P3-04`, F-01-T13, SC-08 |
| Seal / backend token in wire format (NEW-16) | **Fixed** — `seal: ''`, `bkt: ''`, deserializer ignores inbound values | F-01-T13, `P3-04` |
| Password-like detail reaches Google Form (NEW-08) | **Fixed for the tested sentinel** — regex masks `MK:` / `password:` forms | IV-21/IV-22 |
| Sensitive keys mirrored to cookie / `window.name` / `sessionStorage` (NEW-09) | **Fixed** — sensitive-key filter, `SameSite=Strict` | `P3-02`, IV-24 |
| Unsigned tombstone merge (F-01 residual) | **Fixed** — admin signature required | `P4-19`, IV-29, F-01-T12/T16 |
| Replay / 26-hour stale packets (NEW-03) | **Fixed when nonce is present**; nonce remains optional | F-01-T06/T07, `P3-03`, SC-05 |
| Internal cloud bus (NEW-04) | **Fixed** — removed from production | F-01-T14 |
| Gemini key in `localStorage` (NEW-05) | **Reduced** — moved to `sessionStorage` | static + PoC display |
| V4.5 boot auto-seal (NEW-12) | **Fixed** — unsealed VIP records are stripped at boot | `P4-14`, IV-10 |
| Plaintext admin remember-me | **Fixed** — only username + `remember` are written | `P3-08` |

These are barriers, not complete fixes: the remaining trust artifacts are still derived from client-side state.

---

## Regression suites (all green on the current build)

| Suite | Checks | Result |
|---|---|---|
| `tests/run_all.js` (ported to V4.8.0) | 40 | 40 pass / 0 fail |
| `tests/phase3_tests.js` (ported to V4.8.0) | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` (ported to V4.8.0) | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 51 | 51 pass / 0 fail |
| `tests/independent_verification.js` | 36 | 36 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 7 pass / 2 expected failures (SC-07 unsigned user insertion, SC-09 cross-account signed packet) |

`tests/independent_verification.js` is a separate, independently pinned re-verification of
the four highest-priority areas (NEW-11/12 whole chain, NEW-14/15 gate bypasses, NEW-08/09
field mapping, F-01 tombstone/signature paths) using real extracted V4.8.0 functions and
synthetic fixtures only. Detailed results are in [`INDEPENDENT_VERIFICATION.md`](INDEPENDENT_VERIFICATION.md).

Run them all:

```bash
export TRITHUC_SOURCE=/absolute/path/to/V4.8.0/target.html
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
| `poc/poc_f01_student_data.js` | F-01, NEW-01/16 residual check | DISPLAY | n/a (read-only) |
| `poc/poc_f02_admin_login.js` | F-02 | ACTION | `__AERO_F02_RESTORE__()` |
| `poc/poc_f03_vip_entitlement.js` | F-03, NEW-11, NEW-13 | ACTION | `__AERO_F03_RESTORE__()` |
| `poc/poc_f04_exam_answers.js` | F-04 | DISPLAY | n/a (read-only) |
| `poc/poc_f05_device_lock.js` | F-05 | DISPLAY / opt-in ACTION | `__AERO_F05_RESTORE__()` |
| `poc/poc_f06_anticheat.js` | F-06 | ACTION | `__AERO_F06_STOP__()` |
| `poc/poc_new02_packet_injection.js` | NEW-02, F-01 fixed path, NEW-04 fixed path | ACTION (local) | `__AERO_NEW02_CLEANUP__()` |
| `poc/poc_new05_new07_new10_misc.js` | NEW-05/07/10, NEW-14 | DISPLAY / opt-in ACTION | `__AERO_NEW07_RESTORE__()` |
| `poc/poc_new08_new09_leakage.js` | NEW-08/09 residual + fixed-channel check | DISPLAY | n/a (read-only) |
| `poc/poc_new15_admin_preview.js` | NEW-15 | ACTION | `__AERO_NEW15_RESTORE__()` |
| `poc/verify_live_readonly.mjs` | live channel verification (Node) | DISPLAY | n/a (read-only) |

All PoCs are validated by `tests/poc_suite_validation.js` (51 checks), which executes each file in a mock browser and asserts the documented behaviour, including that no DISPLAY PoC transmits and that every ACTION PoC writes nothing to ntfy/KV.

---

## Boundaries

- No packet was published to any production channel.
- No real account was accessed, modified, or impersonated by default.
- No production state was modified.
- Live channel contents remain `UNVERIFIED` (read-only checks: zero recent ntfy lines, incomplete KV chunk set).
- Historical documents for the superseded V4.3.9/V4.4/V4.5 builds were removed from the current tree; git history retains them.
