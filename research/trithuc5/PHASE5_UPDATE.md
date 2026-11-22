# V4.6.7 → V4.8.0 update — measured against the live build

**Target:** `https://trithuc500.vercel.app/`
**Fetched:** 2026-11-22T04:48:27Z
**Build:** SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`,
9,115,471 bytes, 34,599 lines (`research/trithuc5/phase5/target.html`, kept local).
**Response headers:** `phase5-target.headers` (copied to `current.headers`). `X-Frame-Options:
DENY` and `X-Content-Type-Options: nosniff` are newly present. Still no CSP and
`Access-Control-Allow-Origin: *`.

This is a targeted security patch on top of V4.6.7 plus V4.7.x sync/exam features. All numbers
below were measured from the pinned source and executed in the isolated harnesses; no live
channel write, no real account and no production state was used.

---

## What actually changed

| Area | V4.6.7 (previous live) | V4.8.0 | Security effect |
|---|---|---|---|
| Title / size | V4.6.7, 9,051,706 bytes, 33,519 lines | V4.8.0, 9,115,471 bytes, 34,599 lines | New pin required |
| Compact wire password | `p: sanitizePlainInput(u.password, 40)` | `p: ''` (5546) | **NEW-01 fixed** |
| Wire seal / token | `seal`, `bkt` copied from user | both `''`; deserializer ignores inbound values (5578) | **NEW-16 fixed** |
| Google Form detail | password verbatim in `detail` | `logStudentActivity` masks `mật khẩu|password|mk|pass` forms (7364) | **NEW-08 password path fixed** |
| Sensitive storage mirrors | all keys mirrored to `sessionStorage`, `window.name`, cookie | `__SENSITIVE_STORAGE_RE_V480__` (2227) blocks sensitive keys; cookie `SameSite=Strict` | **NEW-09 fixed** |
| Tombstone merge | unsigned `deletedMap`/`deletedUsernames` merged | `isVerifiedAdmin` required (5714+) | **F-01 unsigned residual fixed** |
| Replay / age | no guard | 26-hour age check + `__SEEN_CLOUD_NONCES_V480__` (5713, 5714+) | **NEW-03 partially fixed** (nonce optional) |
| Internal cloud bus | `__INTERNAL_CLOUD_BUS_V45__` closure | removed from production (5674) | **NEW-04 fixed**; local BC path remains |
| Gemini key | `localStorage` | removed at boot; read from `sessionStorage` (25287) | **NEW-05 reduced**, same-origin read remains |
| Admin preview | flag could be set without a session | cleared when `!isAdminLoggedIn` (4184–4187) | **NEW-15 partial** — offline-forged session still works |
| Guest / tester detector | `isAdminTester` and guest ids skip guard | `isAdminTester` exemption removed; guest VIP flags detected (15869) | **NEW-14 partial** — `gv_test` still exempt |
| Structural invariant | keyword heuristic only | `_sig` / seal consistency added to detector | **NEW-13 partial** — forgeable offline |
| Exam vault | gzip + XOR, seed `0x4F81E3A7` | unchanged | **F-04 persists** — 15 exams / 330 answers |
| Admin / VIP seals | bundle hash literals | unchanged | **F-02 / F-03 / NEW-11 persist** |
| Security headers | no XFO / nosniff | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` | **NEW-06 partial** |

---

## Executed verification (V4.8.0 pinned source)

| Track | Result |
|---|---|
| `_sig` → seal → real gates | `_sig` alone still insufficient (P4-14, IV-02). Forging **both** offline from bundle literals restores `hasStudentVipAccess`, `hasVerifiedPackageAccess`, `verifyProtectedVipActionV44` and the in-client `bkt44_` token (P4-16, IV-02b–IV-07, IV-09). |
| Privileged / preview gates | `isAdminTester` no longer suppresses the detector; guest VIP flags are detected; `gv_test` still skips the detector. Admin preview flag is cleared without a session, but a forged admin session re-enables all three gates (P4-08, P4-10, IV-11…IV-19). |
| Google Form / cookie / `window.name` | Password-like detail is masked before the form POST (IV-21/IV-22). Sensitive storage keys are no longer mirrored to `sessionStorage`, `window.name` or cookie; non-sensitive values still mirror with `SameSite=Strict` (P3-02, IV-24). |
| Tombstone / signature | Forged `adminSig` rejected; unsigned tombstone rejected (new); validly signed tombstone deletes; signed restore stays blocked; unsigned VIP packet downgraded; signed admin packet grants VIP with seal and `_sig` (P4-19, IV-27…IV-32). |
| Wire exposure | `p`, `seal`, `bkt` are blank in the serializer and absent from snapshot JSON (F-01-T13, P3-04, SC-08). Identity fields remain public. |
| Replay / bus | Nonce replay rejected; packets older than 26 hours rejected; internal bus removed; local `BroadcastChannel` path remains (F-01-T06/T07/T14). |
| Exam answers | gzip vault decoded locally from the bundle: 15 exams, 330 answer entries (F-04-T01). |

**Suite state on V4.8.0:** `run_all.js` 40/40, `phase3_tests.js` 8/8, `phase4_tests.js` 20/20,
`poc_suite_validation.js` 51/51, `independent_verification.js` 36/36,
`secure_controls.js` 7 pass / 2 expected failures (SC-07 unsigned user insertion, SC-09
cross-account signed packet). Raw logs are in `evidence/`.

---

## Harness changes

* All four pinned harnesses (`harness.js`, `phase3_harness.js` via base, `phase4_harness.js`,
  `independent_verification.js`) now check SHA-256 `be27a5bc…` and refuse other sources.
* Bound line ranges updated: cloud constants 4262–4268 → 4298–4304, admin session restore
  3718–3730 → 3739–3751, boot normalizer 3553–3621 → 3574–3642. Vault hash literals 2030–2054
  and closure-vault variables 1993–2005 are unchanged.
* Two new V4.8.0 lexical dependencies are extracted into each VM: `__SENSITIVE_STORAGE_RE_V480__`
  (2227) and `__SEEN_CLOUD_NONCES_V480__` (5713). Without them the real functions throw
  `ReferenceError`.
* Tests that asserted vulnerable behavior for fixed findings were rewritten as FIX/partial-FIX
  assertions rather than deleted; the residual paths are still asserted where they survive.
* `poc_new02_packet_injection.js` now uses the production `BroadcastChannel`
  (`TRITHUC50_AUTOSYNC_V436`) because the internal bus was removed; the PoC validation VM
  gained a matching `BroadcastChannel` mock.

---

## Boundaries

Local, isolated, non-destructive. No packet published to ntfy.sh or keyvalue.immanuel.co,
no real credential accessed, no production state modified. Live-channel content remains
`UNVERIFIED`; release remains **blocked**. Core F-02/F-03/NEW-11 and F-04 are not fixed by
this patch.
