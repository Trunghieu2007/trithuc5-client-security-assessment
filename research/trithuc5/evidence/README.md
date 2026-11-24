# Evidence index — TRITHUC5.0 V5.4.6 (current live build)

All items are local, synthetic, and safe to publish. No real usernames, passwords, session tokens, private keys, or production packet contents are stored here.

## Source identity

- **V5.4.6 build (current live target):**
  - Bytes: 2,777,970
  - Lines: 39,205
  - SHA-256: `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`
  - Fetched: 2026-11-24T12:14:00Z, HTTP 200
  - Headers captured in `phase5-target.headers` and copied to `current.headers` and `response-headers.txt`. HSTS, XFO `DENY`, `nosniff`, Referrer-Policy and Permissions-Policy are present; CSP is absent and CORS remains `*`.
  - The V5.4.6 HTML itself is kept local (`research/trithuc5/phase5/target.html`) and is **not** committed; every harness pins its hash (`EXPECTED_SHA`) and refuses to run if it changes.
- Superseded builds (V4.3.9 `fe6fef99…`, V4.4 `33be09d7…`, V4.5 `eff11902…`, V4.6.7 `8ec45ea6…`, V4.8.0 `be27a5bc…`) are history only; their line numbers must not be reused for this build.
- Re-measure line numbers after any redeploy.

## Test output (current build, 2026-11-22)

- `test-results.txt`: `tests/run_all.js` — 41 checks, 41 pass, 0 fail. In addition to the prior fixed/residual checks, `F-02-T01/T05` verify the server admin fix and `A-05-T01` records that the results API call has no auth header. `F-04-T01` still decodes 15 exams / 330 answers.
- `phase3-test-results.txt`: `tests/phase3_tests.js` — 8 checks, 8 pass, 0 fail. `P3-04` now asserts public KV writes are disabled and no captured write contains the password sentinel.
- `phase4-test-results.txt`: `tests/phase4_tests.js` — 20 checks, 20 pass, 0 fail. `P4-10` and `P4-11` are inverted to fix assertions for NEW-15 and F-02; `P4-16` still proves the full VIP chain.
- `poc-suite-validation.txt`: `tests/poc_suite_validation.js` — 95 checks, 95 pass, 0 fail. Executes every PoC in a mock browser VM, including the two fix-verification DISPLAY PoCs and the new read-only NEW-17 PoC.
- `independent-verification.txt`: `tests/independent_verification.js` — 36 checks, 36 pass, 0 fail. Independent SHA pin, extraction and VM. Verify the VIP chain, NEW-14 residual, F-02/NEW-15 fixes, Google Form masking and tombstone behavior.
- `secure-controls-v44.txt`: `tests/secure_controls.js` — 7 pass, 2 expected failures (SC-07 unsigned user insertion, SC-09 cross-account signed packet). All nine must pass after remediation.
- The suites run real functions extracted from the V5.4.6 source in a Node VM with mock storage, cookie, KV and transport. They make no production requests.

## Live read-only probe

- `live-readonly-check.txt`: historical ntfy/KV check plus the V5.4.6 `GET /api/results` metadata probe. The results request was unauthenticated, returned HTTP 200 with two records, and only status, count and field names were retained. No values were printed or stored. This confirms NEW-17.
- `response-headers.txt`: exact V5.4.6 response headers.

## Sanitized fixtures and historical evidence

- `packet-fixtures.json`: synthetic packet shapes used by the tests. Values such as `synthetic_password` are invented and are not credentials.
- `source-refs.txt`: complete measured V5.4.6 line map. `source-refs-phase3.txt` remains historical.
- `f02-session-validation.txt`, `f02-admin-ui-screenshots.md`, `f02-admin-*.png`, `f02-admin-vip-matrix-redacted.md/.png`, `no-login-vip-*.png/.md` and `live-console-observations.md`: user-supplied historical evidence. Files describing the old F-02/NEW-15 bypass are explicitly marked superseded and must not be used to claim a current bypass.
- `../phase3/fetch.info` and `../phase3/target.headers`: provenance for the independent 2026-11-17 fetch. The raw body is not committed.

## Removed artifacts

Old V4.3.9/V4.4/V4.5-era PoCs and superseded analysis documents were removed from the current tree; git history retains them. The current finding set and per-finding PoC mapping live in `../FINDINGS.md`.

## Reproduction

From the repository root:

```bash
# the V5.4.6 source must be fetched locally and passed explicitly
export TRITHUC_SOURCE=/absolute/path/to/V5.4.6/target.html
node research/trithuc5/tests/run_all.js                  # 41 pass
node research/trithuc5/tests/phase3_tests.js             # 8 pass
node research/trithuc5/tests/phase4_tests.js             # 20 pass
node research/trithuc5/tests/poc_suite_validation.js     # 60 pass
node research/trithuc5/tests/independent_verification.js # 36 pass
node research/trithuc5/tests/secure_controls.js          # exits 1 until remediation
```

Expected on the current build:

```
TOTAL 41 PASS 41 FAIL 0
TOTAL 8 PASS 8 FAIL 0
TOTAL 20 PASS 20 FAIL 0
TOTAL 60 PASS 60 FAIL 0
TOTAL 36 PASS 36 FAIL 0
TOTAL 9 PASS 7 FAIL 2
CURRENT STATE: controls fail as expected before remediation
```

## Boundaries

- No packet was sent to production ntfy topics or Cloud KV.
- No production account was accessed or modified.
- The only new production request was one unauthenticated read-only GET to `/api/results`; no values were retained.
- Live ntfy content remains UNVERIFIED; no usable snapshot was found.
- All exploitability statements marked `CONFIRMED` were reproduced only in the isolated harness or by the documented read-only endpoint probe.

## V5.4.6 re-pin (2026-11-24)

- Source SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`,
  2,777,970 bytes, 39,205 lines.
- Suites: main 41/41, phase3 8/8, phase4 20/20, PoC validation 99/99,
  independent 36/36; secure controls 7 pass / 2 expected-fail (SC-07, SC-09).
- Genuine V5.4.x fixes: Google Form dispatch disabled; exam answers/questions removed
  from bundle (191 shells, 0 answers); grading moved to `/api/exams/submit`;
  `isValidTeacherVipSealV522` added with legacy-seal migration.
- NEW-17 remains: read-only GET `/api/results` returned HTTP 200, 89 records, with
  name/class/username/score fields. Only status, count and field names were retained.

## PoC refresh (2026-11-24)

- `poc_f03_vip_entitlement.js` updated to the V5.4.2 canonical seal master literal.
- `poc_new11_seal_forgery.js` added: DISPLAY-only, recomputes a synthetic canonical
  seal from bundle material and confirms the validator is shipped client-side.
- `poc_f04_exam_answers.js` rewritten as FIX verification: 191 exam shells,
  zero bundled answers/questions, server fetch/submit present.
- `poc_new08_new09_leakage.js` rewritten so NEW-08 reports `FIXED-V5.4.6`.
- Validator now injects pinned source into the script DOM mock and exposes a
  Node gzip bridge for the browser-only DISPLAY PoC.
- Result: 95 checks, 95 pass, 0 fail. No PoC performs a network write.

## Admin offline logger PoC (2026-11-24)

- `poc/poc_admin_offline_log.js` (ACTION) installs a local admin mock, hooks 35+
  admin-relevant `window.TRITHUC` methods, records calls/results/errors into
  `localStorage.__AERO_ADMIN_OFFLINE_LOG__`, and replaces `fetch` with a local
  stub so no request leaves the browser. It then calls `loginAdmin()` with the
  stubbed credentials and `openAdminPortal()`, so the admin control panel opens
  automatically; set `AUTO_OPEN_ADMIN = false` to install hooks only.
- V4.5+ freezes `window.TRITHUC`; the PoC clones that API into a mutable facade
  and swaps the global binding instead of assigning to read-only properties.
  Restore puts the original frozen object back. The validator freezes its mock
  API so this path is regression-tested.
- Lifecycle: `__AERO_ADMIN_LOG_DUMP__()`, `__AERO_ADMIN_LOG_CLEAR__()`,
  `__AERO_ADMIN_LOG_RESTORE__()` (then F5). The log is retained after restore.
- Validated by 20 dedicated checks; PoC suite now 99/99. The mock admin login
  grants no real authority and no production state is changed.
