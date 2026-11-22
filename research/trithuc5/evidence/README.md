# Evidence index — TRITHUC5.0 V4.8.0 (current live build)

All items are local, synthetic, and safe to publish. No real usernames, passwords, session
tokens, private keys, or production packet contents are stored here.

## Source identity
- **V4.8.0 build (current live target):**
  - Bytes: 9,115,471
  - Lines: 34,599
  - SHA-256: `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`
  - Fetched: 2026-11-22T04:48:27Z, HTTP 200
  - Headers captured in `phase5-target.headers` and copied to `current.headers`. `X-Frame-Options: DENY`
    and `X-Content-Type-Options: nosniff` are present; CSP is absent and CORS remains `*`.
  - The V4.8.0 HTML itself is kept local (`research/trithuc5/phase5/target.html`) and is **not**
    committed; every harness pins its hash (`EXPECTED_SHA`) and refuses to run if it changes.
- Superseded builds (V4.3.9 `fe6fef99…`, V4.4 `33be09d7…`, V4.5 `eff11902…`, V4.6.7
  `8ec45ea6…`) are history only; their line numbers must not be reused for this build.
- Re-measure line numbers after any redeploy.

## Test output (current build, 2026-11-22)
- `test-results.txt`: `tests/run_all.js` ported to V4.8.0 — 40 checks, 40 pass, 0 fail.
  Fixed-path checks assert blank password/seal/token in the wire format, rejection of stale /
  replayed nonced packets, removal of the internal bus, and partial header hardening.
  Residual checks cover public identity fields, local unsigned user insertion and the forged
  signed-admin path. `F-04-T01` decrypts the V4.8.0 gzip exam vault and recovers 15 exams /
  330 answer entries.
- `phase3-test-results.txt`: `tests/phase3_tests.js` ported to V4.8.0 — 8 checks, 8 pass,
  0 fail. `P3-02` verifies sensitive storage keys no longer reach cookie / `window.name` /
  `sessionStorage`; `P3-03` verifies stale packets are rejected; `P3-04` verifies password /
  seal / token are blanked in all public writes; `P3-08` verifies plaintext admin remember-me
  stays fixed.
- `phase4-test-results.txt`: `tests/phase4_tests.js` ported to V4.8.0 — 20 checks, 20 pass,
  0 fail. `P4-14` verifies the boot auto-seal fix; `P4-16` proves that forging **both** `_sig`
  and the seal offline still grants full VIP; `P4-08` records the partial NEW-14 fix;
  `P4-19` verifies unsigned tombstones are rejected.
- `poc-suite-validation.txt`: `tests/poc_suite_validation.js` — 51 checks, 51 pass, 0 fail.
  Executes every PoC in `poc/` in a mock browser VM and asserts the documented behaviour,
  including that no DISPLAY PoC transmits and that ACTION PoCs write nothing to ntfy/KV.
  The V4.8.0 mock adds `BroadcastChannel` for the rewritten NEW-02 PoC.
- `independent-verification.txt`: `tests/independent_verification.js` — 36 checks, 36 pass,
  0 fail. Independent SHA pin, extraction and VM. Verifies the V4.8.0 `_sig` → offline-forged
  seal → vault → three access-gate chain (NEW-11), the partial NEW-14/15 fixes and residual
  bypasses, masking in the Google Form field map (NEW-08), removal of weak-store mirrors
  (NEW-09), and tombstone/signature behaviour on V4.8.0 (F-01). Full write-up:
  `../INDEPENDENT_VERIFICATION.md`.
- `secure-controls-v44.txt`: `tests/secure_controls.js` on V4.8.0 — 7 pass, 2 expected
  failures (SC-07 unsigned user insertion, SC-09 cross-account signed packet). All nine must
  pass after remediation.
- The suites run real functions extracted from the V4.8.0 source in a Node VM with mock
  localStorage/sessionStorage/cookie/window.name, a mock ntfy/KV transport, and synthetic
  users. They make no production requests.

## Sanitized fixtures
- `packet-fixtures.json`: synthetic packet shapes used by the tests. Values such as
  `synthetic_password` are invented and are not credentials. Signing material and real
  identifiers are intentionally absent.
- `source-refs.txt` / `source-refs-phase3.txt`: historical function names and line ranges;
  current harnesses resolve functions by name or use measured V4.8.0 slices.
- `live-console-observations.md`: user-supplied live browser console evidence (KV CORS block,
  Google Form 404, extension CSP noise, closure-scope finding).
- `no-login-vip-screenshots.md`, `no-login-vip-unlock-modal.png`, `no-login-vip-profile.png`,
  `f02-session-validation.txt`, `f02-admin-ui-screenshots.md` and the `f02-admin-*.png`
  files, `f02-admin-vip-matrix-redacted.md` / `.png`: user-supplied historical evidence,
  retained as history (identity columns redacted before publication).
- `../phase3/fetch.info` and `../phase3/target.headers`: provenance for the independent
  `2026-11-17T19:23:58Z` fetch. The raw body is not committed.

## Removed artifacts
The old V4.3.9/V4.4/V4.5-era PoCs (`poc_client.js`, `no_login_vip_payload.js`,
`f02_admin_session_payload.js`, `v44_vip_bypass_payload.js`, `new02_chrome_payload.js`,
`aero_hook_v3.user.js`, `last_run.log`, `phase4_payload_validation.js`) and the superseded
analysis documents (`REPORT.md`, `INVESTIGATION.md`, `EVIDENCE_AUDIT.md`, `REVALIDATION.md`,
`ADDITIONAL_FINDINGS.md`, `DEEP_INVESTIGATION.md`, `NEW_FINDINGS.md`,
`ATTACK_SURFACE_MAP.md`, `UNVERIFIED_HYPOTHESES.md`, `TEST_QUALITY.md`,
`FINDINGS_MATRIX.md`) were removed from the current tree; git history retains them. The
current finding set and per-finding PoC mapping live in `../FINDINGS.md`.

## Reproduction
From the repository root:

```bash
# the V4.8.0 source must be fetched locally and passed explicitly
export TRITHUC_SOURCE=/absolute/path/to/V4.8.0/target.html
node research/trithuc5/tests/run_all.js                 # 40 pass
node research/trithuc5/tests/phase3_tests.js            # 8 pass
node research/trithuc5/tests/phase4_tests.js            # 20 pass
node research/trithuc5/tests/poc_suite_validation.js    # 51 pass
node research/trithuc5/tests/independent_verification.js # 36 pass
node research/trithuc5/tests/secure_controls.js         # exits 1 until remediation
```

Expected on the current build:

```
TOTAL 40 PASS 40 FAIL 0
TOTAL 8 PASS 8 FAIL 0
TOTAL 20 PASS 20 FAIL 0
TOTAL 51 PASS 51 FAIL 0
TOTAL 36 PASS 36 FAIL 0
TOTAL 9 PASS 7 FAIL 2
CURRENT STATE: controls fail as expected before remediation
```

`secure_controls.js` exits 1 until remediation is complete; after a correct patch it must
exit 0 with all nine controls passing.

## Boundaries
- No packet was sent to production ntfy topics or Cloud KV.
- No production account was accessed or modified.
- No live packet content is included: the read-only ntfy GET timed out and the KV read
  returned HTTP 503 during the session.
- All exploitability statements marked `CONFIRMED` were reproduced only in the isolated
  harness.
