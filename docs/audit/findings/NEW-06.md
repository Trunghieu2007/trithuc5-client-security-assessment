# NEW-06: Response headers are partially hardened; CSP and narrow CORS remain absent

**Severity:** Informational  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Partially Fixed  
**Evidence state:** STATIC_CONFIRMED  
**Build pin:** V4.8.0, SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`

## 1. Overview

This finding was verified against the source-hash-pinned V4.8.0 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

## 2. Severity

**Assigned severity:** Informational. **CVSS vector/score:** not scored. Attack prerequisites, complexity, privileges, user interaction, scope and impact are stated qualitatively below rather than converted into an uncalculated numeric score.

- Attack prerequisites: local script execution on the app origin or access to the pinned public bundle; no server credentials.
- Attack complexity: low for the measured paths; the functions execute offline from bundle literals or local state.
- Required privileges: none in the tested client context.
- User interaction: the tester performs the action in their own browser; no victim interaction was tested.
- Scope: browser-local by default; cross-client effects are UNVERIFIED.
- Confidentiality / integrity / availability: see Impact below; no availability impact was measured.

## 3. Status

Confirmed — Partially Fixed. Evidence state: STATIC_CONFIRMED.

## 4. Affected components

- `current.headers` / `response-headers.txt`
- `A-03-T01` header regression check

## 5. Security boundary

Headers are a containment layer, not proof of an exploitable vulnerability. Missing CSP is an observation unless a concrete injection path is demonstrated.

## 6. Root cause

V4.8.0 added `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`, but no CSP is present and `Access-Control-Allow-Origin: *` remains.

## 7. Evidence

- `A-03-T01` asserts XFO and nosniff are present, CSP is absent, and CORS is wildcard.
- `response-headers.txt` contains the captured header values.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Captured response headers from the pinned build.

## 9. Reproduction steps

1. Inspect the captured header file.
2. Run the static regression check and compare observed values.

## 10. PoC

Audit PoC: `../poc/NEW-06/README.md`.  
Canonical implementation: `research/trithuc5/tests/run_all.js`.  
Type: **DISPLAY**. Cleanup: `n/a (static regression)`.

## 11. Expected behavior

A restrictive CSP and narrow CORS should accompany the existing HSTS, XFO and nosniff headers.

## 12. Actual behavior

HSTS, XFO, nosniff, Referrer-Policy and Permissions-Policy are present; CSP is absent and CORS is wildcard.

## 13. Impact

Reduced containment against injected script and over-broad cross-origin access. No configuration-only exploit is claimed.

## 14. Attack scenario

If a future script-injection flaw appears, the missing CSP removes a containment layer that could have limited impact.

## 15. Remediation

1. Add a nonce- or hash-based CSP that permits the required inline bootstrap.
2. Replace wildcard CORS with an explicit allowlist; do not combine wildcard with credentials.
3. Preserve the V4.8.0 XFO and nosniff headers.

## 16. References

- OWASP Secure Headers Project
- OWASP ASVS v4.0 V14 Configuration
- CWE-1021 Improper Restriction of Rendered UI Layers

## 17. Retest criteria

- A CSP must be present and enforced.
- CORS must not use a wildcard for any credentialed path.

## 18. Limitations

- TLS chain, ciphers and HTTP→HTTPS redirect were not tested.
- Missing headers are not claimed as an independently exploitable vulnerability.
