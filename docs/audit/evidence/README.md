# Sanitized evidence — docs/audit

**Build:** V4.8.0 / SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`  
**Source pin:** `source-pin.txt`.  
**Collection:** local isolated VM, captured headers and read-only channel checks only.

## Contents

| File | What it proves |
|---|---|
| `source-pin.txt` | Exact build identity and fetch provenance. |
| `response-headers.txt` | HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy, wildcard CORS, absent CSP. |
| `test-results.txt` | Main suite: 40/40 on V4.8.0, including fixed and residual assertions. |
| `phase3-test-results.txt` | 8/8; weak-store mirroring, stale packets and blank wire fields. |
| `phase4-test-results.txt` | 20/20; VIP seal chain, detector exemptions and tombstone behavior. |
| `poc-suite-validation.txt` | 51/51; all canonical PoCs execute safely in a mock browser. |
| `independent-verification.txt` | 36/36; independent pin, extraction and VM for priority findings. |
| `secure-controls-v44.txt` | 7 pass / 2 expected failures before remediation. |
| `live-readonly-check.txt` | Read-only channel check; no usable live snapshot. |
| `packet-fixtures.json` | Synthetic packet shapes; no real credentials or identifiers. |
| `source-refs.txt`, `source-refs-phase3.txt` | Historical function names and measured line ranges. |
| `f02-session-validation.txt`, `f02-admin-*.md` | Redacted historical UI/session evidence. |
| `live-console-observations.md`, `no-login-vip-screenshots.md` | User-supplied historical console/screenshot notes, sanitized. |

## Sanitization rules

- No raw HTML is committed; the build contains credential and signing literals.
- No real username, password, token, private key or production packet body is stored.
- Screenshot-derived notes are redacted; binary screenshots remain only in the historical research folder.
- Live ntfy/KV content remains UNVERIFIED; no live snapshot is included.

## Reproduction

```bash
export TRITHUC_SOURCE=/absolute/path/to/V4.8.0/target.html
node research/trithuc5/tests/run_all.js
node research/trithuc5/tests/phase3_tests.js
node research/trithuc5/tests/phase4_tests.js
node research/trithuc5/tests/poc_suite_validation.js
node research/trithuc5/tests/independent_verification.js
node research/trithuc5/tests/secure_controls.js
```
