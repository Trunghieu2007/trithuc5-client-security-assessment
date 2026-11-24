# NEW-17: Unauthenticated results API exposes student result records

**Severity:** High  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Open  
**Evidence state:** LOCAL_CONFIRMED + READ-ONLY LIVE PROBE  
**Build pin:** V5.4.6, SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`

## 1. Overview

This finding was verified against the source-hash-pinned V5.4.6 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

## 2. Severity

**Assigned severity:** High. **CVSS vector/score:** not scored. Attack prerequisites, complexity, privileges, user interaction, scope and impact are stated qualitatively below rather than converted into an uncalculated numeric score.

- Attack prerequisites: local script execution on the app origin or access to the pinned public bundle; no server credentials.
- Attack complexity: low for the measured paths; the functions execute offline from bundle literals or local state.
- Required privileges: none in the tested client context.
- User interaction: the tester performs the action in their own browser; no victim interaction was tested.
- Scope: browser-local by default; cross-client effects are UNVERIFIED.
- Confidentiality / integrity / availability: see Impact below; no availability impact was measured.

## 3. Status

Confirmed — Open. Evidence state: LOCAL_CONFIRMED + READ-ONLY LIVE PROBE.

## 4. Affected components

- `GET /api/results` pull path (4814-4819)
- `POST /api/results` submission path (4692-4698)
- client result merge `mergeIncomingStudentAttemptV474`

## 5. Security boundary

Result records must be readable only by the owner, the responsible teacher, or an authorized admin. A public web client must not expose a full result table to anonymous readers.

## 6. Root cause

V4.8.6 introduced a same-origin results API. The client calls GET with `credentials` but no Authorization header. A read-only curl request without any cookie or token returned HTTP 200 with a JSON body containing student result records.

## 7. Evidence

- `evidence/live-readonly-check.txt` records HTTP 200, `Cache-Control: no-store`, `ok=true`, `records=list(2)`, and the exact field names without values.
- `A-05-T01` statically confirms the client sends no auth header on results calls.
- `poc_new17_results_api.js` is validated by `poc-suite-validation.txt` as a DISPLAY PoC that sends one GET and no POST.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Target reachable over HTTPS.
- Owner-authorized read-only probe; no login, no write, no bulk collection.

## 9. Reproduction steps

1. Send one unauthenticated GET to /api/results.
2. Record status, top-level keys, record count and record field names only.
3. Run the DISPLAY PoC in a mock browser to confirm it sends GET only.
4. Do not print, store or replicate any record values.

## 10. PoC

Audit PoC: `../poc/NEW-17/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new17_results_api.js`.  
Type: **DISPLAY**. Cleanup: `n/a (read-only)`.

## 11. Expected behavior

An anonymous request should receive 401/403 or a strictly scoped empty result. Student-identifying fields should require an authenticated relationship to the record.

## 12. Actual behavior

An anonymous GET returned 200 with two records. Field names include username, name, class, school, score, examTitle, startTime, endTime, tabSwitches and aiSuspicionCount.

## 13. Impact

Student names, classes, schools and scores are exposed to any unauthenticated visitor who can reach the endpoint. If the endpoint is enumerable or grows, bulk collection becomes feasible. The POST trust model is UNVERIFIED because no write test was performed.

## 14. Attack scenario

A visitor opens the public site, switches to the results endpoint and reads all submitted records without authenticating. No client-side restriction prevents this because the data arrives directly from the server.

## 15. Remediation

1. Require authentication and row-level authorization on GET /api/results.
2. Return only the caller's own records, or an admin-scoped aggregate with a separate privileged role.
3. Remove direct identifiers from list responses; use opaque IDs and server-side joins for authorized detail views.
4. Add rate limiting, audit logging and a bounded response size; separately authorize-test POST before treating it as trusted.

## 16. References

- OWASP Top 10 2021 A01 Broken Access Control
- OWASP Top 10 2021 A02 Cryptographic Failures
- OWASP ASVS v4.0 V4 Access Control and V8 Data Protection
- CWE-200 Exposure of Sensitive Information
- CWE-306 Missing Authentication for Critical Function

## 17. Retest criteria

- Anonymous GET /api/results must return 401/403 or zero records.
- An authenticated student must receive only their own records.
- No response may include another student's name, class, school or score.

## 18. Limitations

- Only one unauthenticated GET was performed; values were not retained.
- POST authorization and bulk enumeration were not tested because they require production writes or broad collection.
