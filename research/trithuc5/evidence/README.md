# Evidence index — TRITHUC5.0 V4.4 (post-patch build)

All items are local, synthetic, and safe to publish. No real usernames, passwords, session
tokens, private keys, or production packet contents are stored here.

## Source identity
- `current.html` is fetched locally via `SOURCE.md`; it is **not** committed. The former
  `research/trithuc5/index.html` exists only in historical commit `4675ab1`.
  - Bytes: 14,226,000
  - Lines: 15,912
  - SHA-256: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`
- **V4.4 build (current live target, Phase 4):**
  - Bytes: 14,554,401
  - Lines: 20,224
  - SHA-256: `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`
  - Fetched: 2026-11-18T09:02:20Z, HTTP 200
  - Headers captured in `phase4-target.headers`. The V4.4 HTML itself is kept local and is
    **not** committed; `tests/phase4_harness.js` pins its hash and refuses to run if it changes.
- `current.headers`: HTTP response headers captured with the copy. Contains
  `Access-Control-Allow-Origin: *`, HSTS, and no CSP / X-Frame-Options / X-Content-Type-Options.
- The test harness refuses to run if the source hash differs. Re-measure line numbers after any
  redeploy.

## Phase 4 test output
- `phase4-test-results.txt`: run of `tests/phase4_tests.js`, 16 checks, 16 pass, 0 fail.
  Real V4.4 functions (`computeUserIntegritySig`, `computeTeacherVipApprovalSealV44`,
  `detectAndBlockStudentVipHackV44`, `verifyRuntimeSecurityIntegrity`,
  `BackendVipAuthServiceV44`) plus the shipped boot normalizer, executed in an isolated VM.
- `phase4-payload-validation.txt`: run of `tests/phase4_payload_validation.js`, 14 checks,
  14 pass, 0 fail. Executes the shipped PoC file `poc/v44_vip_bypass_payload.js` against the
  real extracted V4.4 functions and confirms the full bypass chain.
- `phase4-target.headers`: HTTP response headers of the V4.4 build.

## Test output (Phases 1-3, unchanged)
- `test-results.txt`: final run of `tests/run_all.js`, 40 checks, 40 pass, 0 fail.
- `phase3-test-results.txt`: Phase 3 run of `tests/phase3_tests.js`, 8 checks, 8 pass, 0 fail.
  It uses real extracted Google Form/logging functions with mock fetch and synthetic users.
- `secure-controls-before-patch.txt` and `secure-controls-phase3.txt`: runs of
  `tests/secure_controls.js`, 1 pass and 8 expected failures on the current build. All nine must
  pass after remediation.
- The suite runs real functions extracted from `current.html` in a Node VM with mock
  localStorage/sessionStorage/cookie/window.name, a mock ntfy/KV transport, and synthetic
  users. It makes no production requests.

## Sanitized fixtures
- `packet-fixtures.json`: synthetic packet shapes used by the tests. Values such as
  `synthetic_password` are invented and are not credentials. Signing material and real
  identifiers are intentionally absent.
- `source-refs.txt`: exact function names and line ranges used by the original tests.
- `source-refs-phase3.txt`: line ranges used by NEW-08/09/10 and Phase 3 negative controls.
- `live-console-observations.md`: user-supplied live browser console evidence (KV CORS block, Google Form 404, extension CSP noise, closure-scope finding).
- `no-login-vip-screenshots.md`, `no-login-vip-unlock-modal.png`, and `no-login-vip-profile.png`: user-supplied local Chrome screenshots of the synthetic no-login VIP PoC. Hashes, provenance, and boundaries are recorded in the Markdown note.
- `f02-session-validation.txt`: local harness validation of F-02 session restore. A session with no `sig` is accepted; expired, bad-signature, and logged-out sessions are rejected. No credential or salt literal is stored.
- `f02-admin-ui-screenshots.md` and six `f02-admin-*.png` files: user-supplied Chrome screenshots of the admin UI after the forged local session. One student identity column was redacted before publication; provenance, hashes, and scope are in the Markdown note.
- `f02-admin-vip-matrix-redacted.md` and `f02-admin-vip-matrix-redacted.png`: additional user-supplied admin VIP-permission screenshot. Student identity column redacted before publication; original source not committed.
- `../poc/aero_hook_v3.user.js` — the only retained local test hook. Install in Tampermonkey/Violentmonkey at `document-start`; user-tested and confirmed working.
- `../phase3/fetch.info` and `../phase3/target.headers`: provenance for the independent
  `2026-11-17T19:23:58Z` fetch. The raw body is not committed.

## Reproduction
From the repository root:

```bash
# current.html must be fetched locally per SOURCE.md and passed explicitly.
export TRITHUC_SOURCE=/absolute/path/to/current.html
node research/trithuc5/tests/run_all.js
node research/trithuc5/tests/phase3_tests.js
node research/trithuc5/tests/secure_controls.js
```

Expected on the current build:

```
TOTAL 40 PASS 40 FAIL 0
TOTAL 8 PASS 8 FAIL 0
CURRENT STATE: controls fail as expected before remediation
```

`run_all.js` and `phase3_tests.js` exit 0. `secure_controls.js` exits 1 until remediation is
complete; after a correct patch it must exit 0 with all nine controls passing.

## Boundaries
- No packet was sent to production ntfy topics or Cloud KV.
- No production account was accessed or modified.
- No live packet content is included: the read-only ntfy GET timed out and the KV read
  returned HTTP 503 during the session.
- All exploitability statements marked `CONFIRMED` were reproduced only in the isolated
  harness.
