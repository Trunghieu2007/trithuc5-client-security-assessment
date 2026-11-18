# FINDINGS — TRITHUC5.0 V4.4 (current live build)

**Target:** `https://trithuc500.vercel.app/`
**Build:** SHA-256 `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`, 14,554,401 bytes, 20,224 lines, fetched 2026-11-18T09:02:20Z.
**Scope:** client-side only. Every PoC runs in the attacker's own browser. Nothing is published to ntfy.sh / keyvalue.immanuel.co and no real account is touched.

Each finding maps to exactly one runnable PoC in `poc/`. Two PoC types:

| Type | Meaning |
|---|---|
| **DISPLAY** | Read-only evidence. Shows the exposed data or the misconfiguration. No state change, no transmission. |
| **ACTION** | Changes the client mechanism to prove the bypass, then verifies. Every ACTION PoC ships a restore function. |

---

## Severity summary

| Severity | Findings |
|---|---|
| **Critical** | NEW-11, NEW-12 |
| **High** | NEW-13, NEW-14, NEW-15, NEW-16, NEW-08, F-01, F-03 |
| **Medium** | NEW-07, NEW-09, NEW-10, F-02, F-05 |
| **Low / Informational** | NEW-05, NEW-06, F-04, NEW-01, NEW-02, F-06, NEW-03, NEW-04 |

Release verdict: **blocked**. See `EXECUTIVE_SUMMARY.md`.

---

## Critical

### NEW-11 — VIP approval seal uses a client-side secret
`computeTeacherVipApprovalSealV44` (line 10649) derives the "teacher approval" seal from `vaultLockConfig.adminPass` (default literal `THAYTRUNG2026`, line 1786) plus the literal `THAY_TRUNG_MASTER_SEAL_2026`. Every other input is attacker-chosen. The seal is reproducible offline by anyone.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED` — real V4.4 functions, end-to-end.

### NEW-12 — Boot normalizer auto-grants the approval seal
Lines 2663–2666: any record whose `_sig` matches gets a valid `_adminVipSeal` minted **by the app itself**. Forging `_sig` alone is sufficient, and its salt (`TRITHUC50_SEC_SALT_2026_V27`, line 3170) is also a bundle literal.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

---

## High

### F-01 — Cloud sync publishes the user table to public channels
The full user list (compact format, passwords included) is broadcast to two public ntfy topics and a public KV namespace. V4.4 hardened the admin-claim path (unsigned `fromAdmin` packets are rejected, lines 3538–3543) but the tombstone table still merges **without any admin check** (lines 3587–3614) — a forged tombstone from an unauthenticated peer deletes users from other clients' local state.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY), `poc/poc_new02_packet_injection.js` (ACTION — tombstone merge, local only)
- **Evidence state:** `LOCAL_CONFIRMED`; live channel content `UNVERIFIED` (read-only checks found zero recent ntfy lines and an incomplete KV chunk set).

### F-03 — VIP entitlement is decided entirely client-side
`hasStudentVipAccess` (line 4119), `verifyProtectedVipActionV44` (line 10634) and the whole `BackendVipAuthServiceV44` "vault" (lines 10378–10631) read client-owned fields. The vault is an in-client `Map` rebuilt from client data at boot — it is a consistency check, not a trust anchor.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-08 — Password reaches a third-party Google Form
`logStudentActivity` (line 4606) builds entries whose `detail` can carry the student password; `syncActivityLogToGoogleForm` (line 4581) POSTs them to a third-party form endpoint.
- **PoC:** `poc/poc_new08_new09_leakage.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED` for the code path; live form delivery `UNVERIFIED` (user console showed `formResponse` 404).

### NEW-13 — Tamper detection is a keyword heuristic
`detectAndBlockStudentVipHackV44` (line 10702) only matches substrings (`poc_vip|nologin|hack|exploit|bypass|cheat`), `maxDevices` outside 1..3, or an empty name. Any ordinary-looking identity passes.
- **PoC:** `poc/poc_f03_vip_entitlement.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-14 — Privileged ids skip every check
`id === 'gv_test' | 'stu_free_12b1' | 'stu_practice_e'` or `isAdminTester === true` bypasses both the detector (line 10704) and `verifyRuntimeSecurityIntegrity` (line 3202) — even with `maxDevices: 999` and no `_sig`.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY — enumerates privileged records)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-15 — Admin preview unlock-all short-circuits every gate
`state.isAdminLoggedIn && state.adminPreviewUnlockAll` returns `true` from `hasStudentVipAccess` (4121), `hasVerifiedPackageAccess` (10566) and `verifyProtectedVipActionV44` (10635). The admin session signature itself is reproducible offline (salt `TRITHUC50_ADM_SALT_V27`, line 3183).
- **PoC:** `poc/poc_new15_admin_preview.js` (ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-16 — Approval seal and backend token are broadcast
`serializeCompactUser` (lines 3391–3392) puts `_adminVipSeal` and `_backendVipToken` into every cloud packet; `deserializeCompactUser` (3423–3424) re-imports them into client state. The trust artifact is published to a public channel.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY)
- **Evidence state:** `STATIC_CONFIRMED`.

---

## Medium

### F-02 — Admin authentication is client-side
Hardcoded credentials (line 18120), session signature from a bundle-literal salt (line 3183), restore path checks only that self-computed signature (line 2758). V4.4 closed the "missing sig" hole; the signature itself remains forgeable.
- **PoC:** `poc/poc_f02_admin_login.js` (ACTION — forge + action chain)
- **Evidence state:** `LOCAL_CONFIRMED`.

### F-05 — Device lock and Gmail binding are client-owned fields
`verifyAndBindStudentDeviceOnLogin` (line 3044) enforces limits purely from `u.trustedDevices`, `u.maxDevices`, `u.gmail`, `u.status`.
- **PoC:** `poc/poc_f05_device_lock.js` (DISPLAY by default, opt-in ACTION)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-07 — Cross-tab state replacement without validation
The `storage` handler (lines 20165–20190) replaces `state.users` and `state.activityLogs` wholesale from localStorage. Any same-origin script can rewrite every open tab's user table.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY + opt-in local probe)
- **Evidence state:** `LOCAL_CONFIRMED` (cross-VM tab replacement).

### NEW-09 — Secrets mirrored into cookie and `window.name`
`safeStorageSet` (line 1562) copies every stored value into `sessionStorage`, `window.name` (as `__TRITHUC_WN__:` JSON) and a first-party cookie — including the password-bearing user table. `window.name` survives cross-origin navigation.
- **PoC:** `poc/poc_new08_new09_leakage.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED`.

### NEW-10 — Admin-tester flag suppresses audit logging
`isAdminExamAttempt` (line 4608) drops log entries for admin/test identities, and the flag is a mutable user field — the same field NEW-14 shows skips all tamper checks.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY)
- **Evidence state:** `LOCAL_CONFIRMED`.

---

## Low / Informational

### F-04 — Exam answers ship in the bundle
`correctAnswers` plaintext plus XOR-obfuscated `ENC_PAYLOAD` (key `TRUNG_SEC_2026_` + sig, `decryptV97EmbedPayload`, line 4833). Grading is client-side; no server grading endpoint exists.
- **PoC:** `poc/poc_f04_exam_answers.js` (DISPLAY)
- **Evidence state:** `STATIC_CONFIRMED` + `LOCAL_CONFIRMED`.

### NEW-01 — Password in the compact wire format
`serializeCompactUser` (line 3373) keeps the password in field `p` for every user in `state.users`.
- **PoC:** `poc/poc_f01_student_data.js` (DISPLAY)
- **Evidence state:** `STATIC_CONFIRMED` + `LOCAL_CONFIRMED`; real-credential exposure `UNVERIFIED`.

### NEW-02 — Unsigned cloud packet injection
V4.4 downgrade: non-admin packets are forced to `pending`/non-VIP (lines 3637–3653). Residual: the record still lands in every client's local table, and the tombstone merge needs no admin check (see F-01).
- **PoC:** `poc/poc_new02_packet_injection.js` (ACTION, local only)
- **Evidence state:** `LOCAL_CONFIRMED` (downgrade verified; residual insertion verified).

### F-06 — Anti-cheat is UX-only
`preventDefault`, DOM overlays, CSS blur, watermark. Handlers are closure-local, so the reliable bypass is blocking listener registration at `document-start`.
- **PoC:** `poc/poc_f06_anticheat.js` (ACTION — console neutraliser + userscript variant)
- **Evidence state:** `LOCAL_CONFIRMED` (user-tested userscript).

### NEW-03 — No packet-level replay/expiry guard
`processIncomingCloudPacket` has no nonce or message-age check; a validly signed stale packet applies through the 24h poll window. V4.4 rejects unsigned admin claims, which removes the trivial exploit path.
- **PoC:** `tests/phase3_tests.js` P3-03 (regression)
- **Evidence state:** `LOCAL_CONFIRMED` (signed-stale path).

### NEW-04 — Global cloud bus bridge
`window.__TRITHUC50_CLOUD_BUS__` (line 3493) exposes direct packet application. Amplifier only — requires prior script execution.
- **PoC:** `poc/poc_new02_packet_injection.js` (ACTION, local only)
- **Evidence state:** `STATIC_CONFIRMED`.

### NEW-05 — Gemini OCR key readable by any same-origin script
Stored in `localStorage` under `TRUNG_GEMINI_OCR_KEY` (line 1520) and used directly against the Gemini API from the browser. No embedded build-time key found.
- **PoC:** `poc/poc_new05_new07_new10_misc.js` (DISPLAY, values redacted by default)
- **Evidence state:** `STATIC_CONFIRMED`.

### NEW-06 — Missing security headers
`current.headers` / `evidence/response-headers.txt`: no CSP, no `X-Frame-Options`, no `X-Content-Type-Options`, `Access-Control-Allow-Origin: *`.
- **PoC:** `tests/run_all.js` A-03-T01 (static regression)
- **Evidence state:** `STATIC_CONFIRMED`.

---

## What V4.4 actually fixed

| V4.3.9 issue | V4.4 status | Proof |
|---|---|---|
| Admin session accepted without `sig` | **Fixed** — signature now required (line 2758) | `tests/run_all.js` F-02-T02 |
| Unsigned cloud packet granted full VIP | **Fixed** — downgraded to `pending`/non-VIP (3637–3653) | `tests/phase4_tests.js` P4-17 |
| Forged `fromAdmin` packet indistinguishable from real | **Fixed** — rejected outright (3538–3543) | `tests/run_all.js` F-01-T01/T02/T05/T11 |
| Per-user KV key predictable (`u_<slug>_<idx>`) | **Changed** — record now exceeds the 450-char cap, so the write is skipped | `tests/phase3_tests.js` P3-04 |

These are barriers, not fixes: every one is still derived from client-side state.

---

## Regression suites (all green on the current build)

| Suite | Checks | Result |
|---|---|---|
| `tests/run_all.js` (ported to V4.4) | 40 | 40 pass / 0 fail |
| `tests/phase3_tests.js` (ported to V4.4) | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 51 | 51 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 3 pass / 6 expected failures (pass after remediation) |

Run them all:

```bash
export TRITHUC_SOURCE=/absolute/path/to/V4.4/target.html
node research/trithuc5/tests/run_all.js
node research/trithuc5/tests/phase3_tests.js
node research/trithuc5/tests/phase4_tests.js
node research/trithuc5/tests/poc_suite_validation.js
node research/trithuc5/tests/secure_controls.js   # exits 1 until remediation
```

---

## PoC index

| File | Finding(s) | Type | Restore |
|---|---|---|---|
| `poc/poc_f01_student_data.js` | F-01, NEW-01, NEW-16 | DISPLAY | n/a (read-only) |
| `poc/poc_f02_admin_login.js` | F-02 | ACTION | `__AERO_F02_RESTORE__()` |
| `poc/poc_f03_vip_entitlement.js` | F-03, NEW-11, NEW-12, NEW-13, NEW-14 | ACTION | `__AERO_F03_RESTORE__()` |
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
- Historical documents for the superseded V4.3.9 build were removed from the current tree; git history retains them.
