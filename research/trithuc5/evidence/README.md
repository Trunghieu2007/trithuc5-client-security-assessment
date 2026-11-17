# Evidence index — TRITHUC5.0 V4.3.9

All items are local, synthetic, and safe to publish. No real usernames, passwords, session
tokens, private keys, or production packet contents are stored here.

## Source identity
- `current.html` is fetched locally via `SOURCE.md`; it is **not** committed. The former
  `research/trithuc5/index.html` exists only in historical commit `4675ab1`.
  - Bytes: 14,226,000
  - Lines: 15,912
  - SHA-256: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`
- `current.headers`: HTTP response headers captured with the copy. Contains
  `Access-Control-Allow-Origin: *`, HSTS, and no CSP / X-Frame-Options / X-Content-Type-Options.
- The test harness refuses to run if the source hash differs. Re-measure line numbers after any
  redeploy.

## Test output
- `test-results.txt`: final run of `tests/run_all.js`, 40 checks, 40 pass, 0 fail.
- `secure-controls-before-patch.txt`: final run of `tests/secure_controls.js`, 1 pass and 8
  expected failures on the current build. All nine must pass after remediation.
- The suite runs real functions extracted from `current.html` in a Node VM with mock
  localStorage/sessionStorage/cookie/window.name, a mock ntfy/KV transport, and synthetic
  users. It makes no production requests.

## Sanitized fixtures
- `packet-fixtures.json`: synthetic packet shapes used by the tests. Values such as
  `synthetic_password` are invented and are not credentials. Signing material and real
  identifiers are intentionally absent.
- `source-refs.txt`: exact function names and line ranges used by the tests.

## Reproduction
From the repository root:

```bash
node research/trithuc5/tests/run_all.js
node research/trithuc5/tests/secure_controls.js
```

Expected on the current build:

```
TOTAL 40 PASS 40 FAIL 0
CURRENT STATE: controls fail as expected before remediation
```

`run_all.js` exits 0. `secure_controls.js` exits 1 until remediation is complete; after a
correct patch it must exit 0 with all nine controls passing.

## Boundaries
- No packet was sent to production ntfy topics or Cloud KV.
- No production account was accessed or modified.
- No live packet content is included: the read-only ntfy GET timed out and the KV read
  returned HTTP 503 during the session.
- All exploitability statements marked `CONFIRMED` were reproduced only in the isolated
  harness.
