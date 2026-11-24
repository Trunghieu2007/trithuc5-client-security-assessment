# V4.8.6 → V5.4.6 update — measured against the live build

**Target:** `https://trithuc500.vercel.app/`  
**Fetched:** 2026-11-24T12:14:00Z  
**Build:** SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`, 2,777,970 bytes, 39,205 lines (`research/trithuc5/phase5/target.html`, kept local).  
**Previous pin:** V4.8.0, SHA-256 `be27a5bc…`, 9,115,471 bytes, 34,599 lines.  
**Response headers:** `phase5-target.headers` (copied to `current.headers` and `evidence/response-headers.txt`). HSTS, XFO `DENY`, `nosniff`, Referrer-Policy and Permissions-Policy are present. Still no CSP and `Access-Control-Allow-Origin: *`.

## Security-relevant delta

| Area | V4.8.0 | V4.8.5 / V5.4.6 | Security effect |
|---|---|---|---|
| Admin authentication | Client-side hash comparison and bundle-literal session salt | Server `/api/admin/login` with HttpOnly cookie; GET restores session; DELETE logs out; ephemeral per-window session salt; client hash literals emptied | F-02 and NEW-15 fixed; offline admin impersonation path removed |
| Remembered admin session | Self-signed session restored from localStorage | Removed at boot; integrity gate requires server-verified flag | Forged session no longer survives |
| Public keyvalue.immanuel.co | Active user/result KV reads and writes | `CLOUD_KV_DISABLED_V485 = true`, calls short-circuit | Removes a public KV write surface; does not affect public ntfy topics |
| Student results | ntfy + KV only | New `POST /api/results` and unauthenticated `GET /api/results` | NEW-17: read exposure confirmed with one read-only GET; POST auth UNVERIFIED |
| Header set | HSTS, XFO, nosniff, wildcard CORS | Adds Referrer-Policy and Permissions-Policy; still no CSP | Partial hardening only |
| VIP approval seal | Vault hash literal present | Vault hash literal emptied, but master-seal literal and client-controllable inputs remain | NEW-11 residual; seal still reproducible offline |
| Exam vault / grading | `__ENC_GZ` gzip/XOR, 15 exams / 330 answers | Unchanged | F-04 unchanged |
| Cloud packet verifier | Nonce/age guards, unsigned tombstone rejection | Unchanged | Residual forgeable signature and optional nonce remain |

## Re-verified suite state

| Suite | V4.8.0 | V5.4.6 |
|---|---|---|
| `tests/run_all.js` | 40/40 | **41/41** |
| `tests/phase3_tests.js` | 8/8 | **8/8** |
| `tests/phase4_tests.js` | 20/20 | **20/20** |
| `tests/poc_suite_validation.js` | 51/51 | **99/99** |
| `tests/independent_verification.js` | 36/36 | **36/36** |
| `tests/secure_controls.js` | 7 pass / 2 expected failures | **7 pass / 2 expected failures** |

New/changed assertions:

- `F-02-T01/T05`, `P4-11`, `IV-20` now assert the server-login fix rather than client-side forgery.
- `P4-10`, `IV-16`…`IV-19` now assert that an orphan preview flag is cleared and gates deny without a server-verified session.
- P3-04 now asserts that public KV writes are disabled and no captured write contains the password sentinel.
- `A-01-T01` now records that the admin boundary is server-side while entitlement and grading remain client-side.
- `A-05-T01` and the new PoC check cover the results API's missing client-side auth header.
- F-02 and NEW-15 PoCs are now DISPLAY verifications of the fixes; `poc_new17_results_api.js` performs one read-only GET and prints metadata only.

## Harness changes

All harnesses (`harness.js`, `phase4_harness.js`, `independent_verification.js`) pin the new SHA and refuse any other source. V5.4.6 line dependencies:

- hash functions and emptied literals: 2030–2055
- closure-vault variables: 1993–2005
- sensitive-storage regex: 2228
- boot normalizer: 3575–3643
- remembered admin session restore: 3740–3752
- public cloud constants: 4295–4299
- cloud nonce registry: 5768

## Verification boundary

No production write was performed. The only new production request was one unauthenticated `GET /api/results`; only status, record count and field names were retained. Live ntfy content remains `UNVERIFIED`. All other checks used hash-pinned source extraction in an isolated Node VM with synthetic fixtures.


---

# V4.8.6 → V5.4.6 (2026-11-24 re-pin)

**Fetched:** 2026-11-24T12:14:00Z  
**Build:** SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`, 2,777,970 bytes, 39,205 lines.  
**Previous pin:** V4.8.6, SHA-256 `ffe94aea…`, 9,120,257 bytes, 34,677 lines.

## Security-relevant delta

| Area | V4.8.6 | V5.4.6 | Security effect |
|---|---|---|---|
| Exam vault | 15 exams / 330 answers in bundle | 191 shells / 0 answers / 0 questions | Offline answer extraction closed |
| Grading | client-side `calculateAttemptScore` | `POST /api/exams/submit` authoritative | Score no longer purely client-controlled |
| Questions | embedded | `/api/exams/fetch?id=` | Requires server session |
| Google Form | active dispatch | `return false` at `dispatchParamsToGoogleFormUrl` | Third-party leak closed |
| VIP seal | `adminPassHash`-derived | `TT50_CANONICAL_MASTER_V522` literal + `isValidTeacherVipSealV522` | Still bundle-literal forgeable |
| Admin session | V4.8.5 server login | unchanged | F-02 remains Fixed |
| Results API | unauthenticated GET | unauthenticated GET | NEW-17 remains Open |

## Harness line pins changed

| Constant | V4.8.6 | V5.4.6 |
|---|---:|---:|
| Cloud constants | 4295–4299 | 7051–7055 |
| Vault closure vars | 1993–2005 | 3814–3826 |
| Hash functions / empty literals | 2030–2055 | 4679–4704 |
| Sensitive regex | 2228 | 4878 |
| Nonce registry | 5768 | 8818 |
| Memory store | 2195 | 4845 |
| Admin session restore | 3740–3752 | 6485–6497 |
| Boot normalizer | 3575–3643 | 6314–6383 |

New dependencies added to VM harnesses: `isValidTeacherVipSealV522`,
`requestBackgroundRenderV521`, `isUserTypingInModalOrInputV521`,
`pushSystemUserPacketToVercelApiV521`.

## Suites

main 41/41, phase3 8/8, phase4 20/20, PoC 99/99, independent 36/36.
`secure_controls.js` keeps its baseline 7 pass / 2 expected-fail (SC-07, SC-09).
