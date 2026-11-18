# Evidence index — TRITHUC5.0 V4.4 (post-patch build)

All items are local, synthetic, and safe to publish. No real usernames, passwords, session
tokens, private keys, or production packet contents are stored here.

## Source identity
- **V4.4 build (current live target, Phase 4):**
  - Bytes: 14,554,401
  - Lines: 20,224
  - SHA-256: `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`
  - Fetched: 2026-11-18T09:02:20Z, HTTP 200
  - Headers captured in `phase4-target.headers`. The V4.4 HTML itself is kept local and is
    **not** committed; every harness pins its hash (`EXPECTED_SHA`) and refuses to run if it
    changes.
- `current.html` (the V4.3.9 copy) is fetched locally via `SOURCE.md`; it is **not**
  committed. The former `research/trithuc5/index.html` exists only in historical commit
  `4675ab1`.
- `current.headers`: refreshed HTTP response headers of the V4.4 build. Contains
  `Access-Control-Allow-Origin: *`, HSTS, and no CSP / X-Frame-Options / X-Content-Type-Options.
- Re-measure line numbers after any redeploy.

## Test output (current build, 2026-11-18)
- `test-results.txt`: `tests/run_all.js` ported to V4.4 — 40 checks, 40 pass, 0 fail. Ten
  former V4.3.9 vulnerability assertions were rewritten as V4.4 fix-verification assertions
  (e.g. `F-01-T01` now asserts forged admin packets are rejected).
- `phase3-test-results.txt`: `tests/phase3_tests.js` ported to V4.4 — 8 checks, 8 pass,
  0 fail. `P3-03` now proves unsigned stale admin packets are rejected while a *validly*
  signed stale packet still applies (NEW-03); `P3-04` proves the per-user KV write is
  skipped by the 450-char cap while the password still reaches the public snapshot chunks.
- `phase4-test-results.txt`: `tests/phase4_tests.js` — 20 checks, 20 pass, 0 fail. Real
  V4.4 functions (`computeUserIntegritySig`, `computeTeacherVipApprovalSealV44`,
  `detectAndBlockStudentVipHackV44`, `verifyRuntimeSecurityIntegrity`,
  `BackendVipAuthServiceV44`) plus the shipped boot normalizer, executed in an isolated VM.
- `poc-suite-validation.txt`: `tests/poc_suite_validation.js` — 51 checks, 51 pass, 0 fail.
  Executes every PoC in `poc/` in a mock browser VM and asserts the documented behaviour,
  including that no DISPLAY PoC transmits and that ACTION PoCs write nothing to ntfy/KV.
- `secure-controls-v44.txt`: `tests/secure_controls.js` on V4.4 — 3 pass, 6 expected
  failures (the two signature controls now pass after the V4.4 patch). All nine must pass
  after remediation.
- The suites run real functions extracted from the V4.4 source in a Node VM with mock
  localStorage/sessionStorage/cookie/window.name, a mock ntfy/KV transport, and synthetic
  users. They make no production requests.

## Sanitized fixtures
- `packet-fixtures.json`: synthetic packet shapes used by the tests. Values such as
  `synthetic_password` are invented and are not credentials. Signing material and real
  identifiers are intentionally absent.
- `source-refs.txt` / `source-refs-phase3.txt`: function names and line ranges used by the
  tests (V4.3.9-era references retained for history; current harnesses resolve functions by
  name).
- `live-console-observations.md`: user-supplied live browser console evidence (KV CORS block,
  Google Form 404, extension CSP noise, closure-scope finding).
- `no-login-vip-screenshots.md`, `no-login-vip-unlock-modal.png`, `no-login-vip-profile.png`,
  `f02-session-validation.txt`, `f02-admin-ui-screenshots.md` and the `f02-admin-*.png`
  files, `f02-admin-vip-matrix-redacted.md` / `.png`: user-supplied V4.3.9-era evidence,
  retained as history (identity columns redacted before publication).
- `../phase3/fetch.info` and `../phase3/target.headers`: provenance for the independent
  `2026-11-17T19:23:58Z` fetch. The raw body is not committed.

## Removed artifacts
The old V4.3.9-era PoCs (`poc_client.js`, `no_login_vip_payload.js`,
`f02_admin_session_payload.js`, `v44_vip_bypass_payload.js`, `new02_chrome_payload.js`,
`aero_hook_v3.user.js`, `last_run.log`) and the superseded analysis documents
(`REPORT.md`, `INVESTIGATION.md`, `EVIDENCE_AUDIT.md`, `REVALIDATION.md`,
`ADDITIONAL_FINDINGS.md`, `DEEP_INVESTIGATION.md`, `NEW_FINDINGS.md`,
`ATTACK_SURFACE_MAP.md`, `UNVERIFIED_HYPOTHESES.md`, `TEST_QUALITY.md`,
`FINDINGS_MATRIX.md`) were removed from the current tree; git history retains them. The
current finding set and per-finding PoC mapping live in `../FINDINGS.md`.

## Reproduction
From the repository root:

```bash
# the V4.4 source must be fetched locally and passed explicitly
export TRITHUC_SOURCE=/absolute/path/to/V4.4/target.html
node research/trithuc5/tests/run_all.js            # 40 pass
node research/trithuc5/tests/phase3_tests.js       # 8 pass
node research/trithuc5/tests/phase4_tests.js       # 20 pass
node research/trithuc5/tests/poc_suite_validation.js  # 51 pass
node research/trithuc5/tests/secure_controls.js    # exits 1 until remediation
```

Expected on the current build:

```
TOTAL 40 PASS 40 FAIL 0
TOTAL 8 PASS 8 FAIL 0
TOTAL 20 PASS 20 FAIL 0
TOTAL 51 PASS 51 FAIL 0
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
