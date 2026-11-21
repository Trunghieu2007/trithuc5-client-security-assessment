# FINDINGS — TRITHUC5.0 V4.5 / V4.6.3 (current live build)

**Target:** `https://trithuc500.vercel.app/`
**Build:** SHA-256 `eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f`, 9,015,050 bytes, 32,900 lines, fetched 2026-11-21T14:32:35Z.
**Scope:** client-side only. Every PoC runs in the attacker's own browser. Nothing is published to ntfy.sh / keyvalue.immanuel.co and no real account is touched.
**Build delta:** [`PHASE5_UPDATE.md`](PHASE5_UPDATE.md) records the measured V4.5 changes. V4.4 line numbers are history only.

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
| **High** | NEW-13, NEW-14, NEW-15, NEW-16, NEW-08, F-01, F-03 |
| **Medium** | NEW-07, NEW-09, NEW-10, F-02, F-05 |
| **Low / Informational** | NEW-05, NEW-06, F-04, NEW-01, NEW-02, F-06, NEW-03, NEW-04 |
| **Fixed in V4.5** | NEW-12 (boot auto-seal), plaintext admin remember-me |

Release verdict: **blocked**. See `EXECUTIVE_SUMMARY.md`.

---

## Critical

### NEW-11 — VIP approval seal uses a client-side secret
`computeTeacherVipApprovalSealV44` (line 14473) derives the "teacher approval" seal from
`vaultLockConfig.adminPassHash || DEFAULT_VAULT_PASS_HASH_V45` (literal at line 2054) plus the
literal `THAY_TRUNG_MASTER_SEAL_2026`. Every other input is attacker-chosen. V4.5 replaced the
old plaintext password with a hash literal, but the secret is still shipped in the bundle, so
the seal remains reproducible offline.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` — real V4.5 functions, end-to-end.

---

## High

### F-01 — Cloud sync publishes the user table to public channels
The full user list (compact format, passwords included) is broadcast to two public ntfy topics and a public KV namespace. V4.5 keeps the V4.4 admin-claim check (unsigned `fromAdmin` packets rejected, lines 4521–4526) but the tombstone table still merges **without any admin check** (lines 4583–4613) — a forged tombstone from an unauthenticated peer deletes users from other clients' local state.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY), `poc/poc_new02_packet_injection.js` (ACTION — tombstone merge, local only)
- **Evidence state:** `LOCAL_CONFIRMED`; live channel content `UNVERIFIED` (read-only checks found zero recent ntfy lines and an incomplete KV chunk set).

### F-03 — VIP entitlement is decided entirely client-side
`hasStudentVipAccess` (line 5589), `verifyProtectedVipActionV44` (line 14458) and the whole
`BackendVipAuthServiceV44` "vault" (lines 14194–14455) read client-owned fields. The vault is
an in-client `Map` (line 14196) rebuilt from client data at boot — it is a consistency check,
not a trust anchor. V4.5 removed boot auto-sealing, but forging `_sig` **and** the seal offline
still passes every gate (`P4-16`, IV-02b…IV-09).
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-08 — Password reaches a third-party Google Form
`logStudentActivity` (line 6093) builds entries whose `detail` can carry the student password; `syncActivityLogToGoogleForm` (line 6068) POSTs them to a third-party form endpoint. The V4.5 independent run observed the synthetic password sentinel verbatim in `detail` and the fourth POST pair (`entry.140683976` in the shipped config at line 2407).
- **PoC:** `poc/poc_new08_new09_leakage.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED` for the code path; live form delivery `UNVERIFIED`.

### NEW-13 — Tamper detection is a keyword heuristic
`detectAndBlockStudentVipHackV44` (line 14526) only matches substrings (`poc_vip|nologin|hack|exploit|bypass|cheat`), `maxDevices` outside 1..3, or an empty name. Any ordinary-looking identity passes.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-14 — Privileged ids skip every check
`id === 'gv_test' | 'stu_free_12b1' | 'stu_practice_e'` skips the detector (line 14528)
and the whole student block of `verifyRuntimeSecurityIntegrity` (line 4164) — even with
`maxDevices: 999` and no `_sig`; `isAdminTester === true` skips the detector and audit
logging. Independently executed controls (`INDEPENDENT_VERIFICATION.md`, IV-11…IV-15) show
the two `stu_free`/`stu_practice` ids are still forced non-VIP at the protected-action gate
(14463–14464): they are detector/runtime exemptions, not blanket VIP grants.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY — enumerates privileged records)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-15 — Admin preview unlock-all short-circuits every gate
`state.isAdminLoggedIn && state.adminPreviewUnlockAll` returns `true` from
`hasStudentVipAccess` (line 5591), `hasVerifiedPackageAccess` (line 14382) and
`verifyProtectedVipActionV44` (line 14459). The admin session signature itself is
reproducible offline (salt `TRITHUC50_ADM_SALT_V27`, line 4145).
- **PoC:** `poc/poc_new15_admin_preview.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-16 — Approval seal and backend token are broadcast
`serializeCompactUser` (lines 4369–4370) puts `_adminVipSeal` and `_backendVipToken` into every cloud packet; `deserializeCompactUser` (line 4375) re-imports them into client state. The trust artifact is published to a public channel.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY)
- **Evidence state:** `STATIC_CONFIRMED`.

---

## Medium

### F-02 — Admin authentication is client-side
V4.5 hashes admin user/password client-side against bundle literals
(`DEFAULT_ADMIN_USER_HASHES_V45` / `DEFAULT_ADMIN_PASS_HASH_V45`, lines 2052–2053; comparison at
30401–30408). The session signature is still derived from the bundle-literal salt
`TRITHUC50_ADM_SALT_V27` (line 4145), and the restore path checks only that self-computed
signature (3718–3730). Missing-signature sessions are rejected, but a signature is forgeable.
- **PoC:** `poc/poc_f02_admin_login.js` (ACTION — forge + action chain)
- **Evidence state:** `LOCAL_CONFIRMED`.

### F-05 — Device lock and Gmail binding are client-owned fields
`verifyAndBindStudentDeviceOnLogin` enforces limits purely from `u.trustedDevices`, `u.maxDevices`, `u.gmail`, `u.status`.
- **PoC:** `poc/poc_f05_device_lock.js` (DISPLAY by default, opt-in ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-07 — Cross-tab state replacement without validation
`setupCrossTabUserSync` (line 32819) replaces `state.users` and `state.activityLogs` wholesale from localStorage. Any same-origin script can rewrite every open tab's user table.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY + opt-in local probe)
- **Evidence state:** `LOCAL_CONFIRMED` (cross-VM tab replacement).

### NEW-09 — Secrets mirrored into cookie and `window.name`
`safeStorageSet` (line 2227) copies every stored value into `sessionStorage`, `window.name` (as `__TRITHUC_WN__:` JSON, line 2205) and a first-party cookie — including the password-bearing user table. `window.name` survives cross-origin navigation; the cookie is `SameSite=Lax`.
- **PoC:** `poc/poc_new08_new09_leakage.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-10 — Admin-tester flag suppresses audit logging
`isAdminExamAttempt` (line 12623) drops log entries for admin/test identities, and the flag is a mutable user field — the same field NEW-14 shows skips all tamper checks.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED`.

---

## Low / Informational

### F-04 — Exam answers ship in the bundle
V4.5 hides them in a gzip + PRNG-XOR vault (`var __ENC_GZ` at line 1464; decoder 1463–1505) with a claim token `TT50_V45_INTERNAL_BOOT_SEAL` (lines 1968, 25698). Both the token and the exam chunk seed `0x4F81E3A7` are bundle literals. The isolated decoder recovered **15 exams / 330 answer entries** offline (`tests/run_all.js` F-04-T01). Grading is client-side; no server grading endpoint exists.
- **PoC:** `poc/poc_f04_exam_answers.js` (DISPLAY — claims or decodes the vault)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-01 — Password in the compact wire format
`serializeCompactUser` (line 4351) keeps the password in field `p` for every user in `state.users`. V4.5's 450-char per-user KV gate still skips a typical single-user record, but passwords remain in the public snapshot chunks and in `state.users`.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY)
- **Evidence state:** `STATIC_CONFIRMED` + `LOCAL_CONFIRMED`; real-credential exposure `UNVERIFIED`.

### NEW-02 — Unsigned cloud packet injection
V4.5 keeps the V4.4 downgrade: non-admin packets are forced to `pending`/non-VIP (lines 4633–4649). Residual: the record still lands in every client's local table, and the tombstone merge needs no admin check (see F-01). The global `window.__TRITHUC50_CLOUD_BUS__` entry point was replaced by a closure bus `__INTERNAL_CLOUD_BUS_V45__` (4471–4477), reducing NEW-04's reach.
- **PoC:** `poc/poc_new02_packet_injection.js` (ACTION, local only)
- **Evidence state:** `LOCAL_CONFIRMED` (downgrade verified; residual insertion verified).

### F-06 — Anti-cheat is UX-only
`preventDefault`, DOM overlays, CSS blur, watermark. Handlers are closure-local, so the reliable bypass is blocking listener registration at `document-start`.
- **PoC:** `poc/poc_f06_anticheat.js` (ACTION — console neutraliser + userscript variant)
- **Evidence state:** `LOCAL_CONFIRMED` (user-tested userscript).

### NEW-03 — No packet-level replay/expiry guard
`processIncomingCloudPacket` has no nonce or message-age check; a validly signed stale packet applies through the 24h poll window. Unsigned admin claims are rejected, which removes the trivial exploit path.
- **PoC:** `tests/phase3_tests.js` P3-03 (regression)
- **Evidence state:** `LOCAL_CONFIRMED` (signed-stale path).

### NEW-04 — Global cloud bus bridge
V4.5 removed the `window.__TRITHUC50_CLOUD_BUS__` global. The closure bus `__INTERNAL_CLOUD_BUS_V45__` (line 4471) still exposes `applyIncomingPacket` inside the app, but it is no longer reachable as a one-line console call. Amplifier only — requires prior script execution.
- **PoC:** `poc/poc_new02_packet_injection.js` (ACTION, local only; falls back to the legacy global in mocks)
- **Evidence state:** `STATIC_CONFIRMED`.

### NEW-05 — Gemini OCR key readable by any same-origin script
Stored in `localStorage` under `TRUNG_GEMINI_OCR_KEY` (line 2185) and used directly against the Gemini API from the browser. No embedded build-time key found.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY, values redacted by default)
- **Evidence state:** `STATIC_CONFIRMED`.

### NEW-06 — Missing security headers
`current.headers` / `evidence/response-headers.txt`: no CSP, no `X-Frame-Options`, no `X-Content-Type-Options`, `Access-Control-Allow-Origin: *`.
- **PoC:** `tests/run_all.js` A-03-T01 (static regression)
- **Evidence state:** `STATIC_CONFIRMED`.

---

## What V4.5 actually fixed

| V4.4 issue | V4.5 status | Proof |
|---|---|---|
| Boot normalizer auto-minted `_adminVipSeal` from `_sig` | **Fixed** — unsealed VIP records are stripped (3612–3619) | `tests/phase4_tests.js` P4-14, `tests/independent_verification.js` IV-02 |
| Admin remember-me wrote a plaintext password | **Fixed** — only username + `remember` are written (30417, 3714) | `tests/phase3_tests.js` P3-08 |
| Global `window.__TRITHUC50_CLOUD_BUS__` | **Reduced** — replaced by an internal closure bus (4471–4477) | `tests/run_all.js` F-01-T14 |
| Unsigned cloud packet granted full VIP (V4.3.9) | **Fixed** — downgraded to `pending`/non-VIP (4633–4649) | `tests/phase4_tests.js` P4-17 |
| Forged `fromAdmin` packet indistinguishable from real (V4.3.9) | **Fixed** — rejected outright (4521–4526) | `tests/run_all.js` F-01-T01/T02/T05/T11 |

These are barriers, not complete fixes: the remaining trust artifacts are still derived from client-side state.

---

## Regression suites (all green on the current build)

| Suite | Checks | Result |
|---|---|---|
| `tests/run_all.js` (ported to V4.5) | 40 | 40 pass / 0 fail |
| `tests/phase3_tests.js` (ported to V4.5) | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` (ported to V4.5) | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 51 | 51 pass / 0 fail |
| `tests/independent_verification.js` | 36 | 36 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 3 pass / 6 expected failures (pass after remediation) |

`tests/independent_verification.js` is a separate, independently pinned re-verification of
the four highest-priority areas (NEW-11/12 whole chain, NEW-14/15 gate bypasses, NEW-08/09
field mapping, F-01 tombstone/signature paths) using real extracted V4.5 functions and
synthetic fixtures only. Detailed results are in [`INDEPENDENT_VERIFICATION.md`](INDEPENDENT_VERIFICATION.md).

Run them all:

```bash
export TRITHUC_SOURCE=/absolute/path/to/V4.5/target.html
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
| `poc/poc_f01_student_data.js` | F-01, NEW-01, NEW-16 | DISPLAY | n/a (read-only) |
| `poc/poc_f02_admin_login.js` | F-02 | ACTION | `__AERO_F02_RESTORE__()` |
| `poc/poc_f03_vip_entitlement.js` | F-03, NEW-11, NEW-13, NEW-14 | ACTION | `__AERO_F03_RESTORE__()` |
| `poc/poc_f04_exam_answers.js` | F-04 | DISPLAY | n/a (read-only) |
| `poc/poc_f05_device_lock.js` | F-05 | DISPLAY / opt-in ACTION | `__AERO_F05_RESTORE__()` |
| `poc/poc_f06_anticheat.js` | F-06 | ACTION | `__AERO_F06_STOP__()` |
| `poc/poc_new02_packet_injection.js` | NEW-02, F-01 tombstone, NEW-04 | ACTION (local) | `__AERO_NEW02_CLEANUP__()` |
| `poc/poc_new05_new07_new10_misc.js` | NEW-05, NEW-07, NEW-10, NEW-14 | DISPLAY / opt-in ACTION | `__AERO_NEW07_RESTORE__()` |
| `poc/poc_new08_new09_leakage.js` | NEW-08, NEW-09 | DISPLAY | n/a (read-only) |
| `poc/poc_new15_admin_preview.js` | NEW-15 | ACTION | `__AERO_NEW15_RESTORE__()` |
| `poc/verify_live_readonly.mjs` | live channel verification (Node) | DISPLAY | n/a (read-only) |

All PoCs are validated by `tests/poc_suite_validation.js` (51 checks), which executes each file in a mock browser and asserts the documented behaviour, including that no DISPLAY PoC transmits and that every ACTION PoC writes nothing to ntfy/KV.

---

## Boundaries

- No packet was published to any production channel.
- No real account was accessed, modified, or impersonated by default.
- No production state was modified.
- Live channel contents remain `UNVERIFIED` (read-only checks: zero recent ntfy lines, incomplete KV chunk set).
- Historical documents for the superseded V4.3.9/V4.4 builds were removed from the current tree; git history retains them.
