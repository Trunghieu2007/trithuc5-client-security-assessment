# NEW-05: Gemini OCR key moved to sessionStorage but remains same-origin readable

**Severity:** Low  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Partially Fixed  
**Evidence state:** STATIC_CONFIRMED (partial fix)  
**Build pin:** V4.8.0, SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`

## 1. Overview

This finding was verified against the source-hash-pinned V4.8.0 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

## 2. Severity

**Assigned severity:** Low. **CVSS vector/score:** not scored. Attack prerequisites, complexity, privileges, user interaction, scope and impact are stated qualitatively below rather than converted into an uncalculated numeric score.

- Attack prerequisites: local script execution on the app origin or access to the pinned public bundle; no server credentials.
- Attack complexity: low for the measured paths; the functions execute offline from bundle literals or local state.
- Required privileges: none in the tested client context.
- User interaction: the tester performs the action in their own browser; no victim interaction was tested.
- Scope: browser-local by default; cross-client effects are UNVERIFIED.
- Confidentiality / integrity / availability: see Impact below; no availability impact was measured.

## 3. Status

Confirmed — Partially Fixed. Evidence state: STATIC_CONFIRMED (partial fix).

## 4. Affected components

- Gemini key read path (line 25287)
- `safeStorageSet` sensitive-key filter (2227)

## 5. Security boundary

Provider keys should never be stored in browser-readable state. Calls should be proxied through a server that holds the key.

## 6. Root cause

V4.8.0 removes the key from localStorage and reads it from sessionStorage. Any same-origin script can still read a key the user entered. No build-time key was found.

## 7. Evidence

- Static source review of the sessionStorage read path.
- `poc_new05_new07_new10_misc.js` displays only redacted presence information.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Own browser with a user-entered key fixture.
- No real provider key used or stored.

## 9. Reproduction steps

1. Inspect the key storage key name in source.
2. Run the display PoC; observe redacted presence only.
3. Confirm no build-time key is embedded.

## 10. PoC

Audit PoC: `../poc/NEW-05/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new05_new07_new10_misc.js`.  
Type: **DISPLAY**. Cleanup: `values redacted by default`.

## 11. Expected behavior

The provider key should exist only server-side.

## 12. Actual behavior

The key is removed from localStorage but remains readable from sessionStorage by same-origin script.

## 13. Impact

An XSS or malicious same-origin dependency could read a user-supplied OCR key. No embedded project key was found.

## 14. Attack scenario

A user enters their own Gemini key; a later same-origin script reads it from sessionStorage.

## 15. Remediation

1. Proxy Gemini calls through a server that stores the provider key.
2. Remove client-side key entry and storage entirely.
3. Rotate any key previously entered in a compromised browser.

## 16. References

- OWASP ASVS v4.0 V3 Data Protection
- CWE-522 Insufficiently Protected Credentials

## 17. Retest criteria

- No provider key may be present in localStorage, sessionStorage or client source.
- OCR requests must originate from the server.

## 18. Limitations

- No real key was used and no live provider request was made.
