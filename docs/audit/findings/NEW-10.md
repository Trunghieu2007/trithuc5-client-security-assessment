# NEW-10: Admin-tester identities still suppress audit logging

**Severity:** Medium  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Partially Fixed  
**Evidence state:** LOCAL_CONFIRMED (partial fix)  
**Build pin:** V5.4.6, SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`

## 1. Overview

This finding was verified against the source-hash-pinned V5.4.6 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

## 2. Severity

**Assigned severity:** Medium. **CVSS vector/score:** not scored. Attack prerequisites, complexity, privileges, user interaction, scope and impact are stated qualitatively below rather than converted into an uncalculated numeric score.

- Attack prerequisites: local script execution on the app origin or access to the pinned public bundle; no server credentials.
- Attack complexity: low for the measured paths; the functions execute offline from bundle literals or local state.
- Required privileges: none in the tested client context.
- User interaction: the tester performs the action in their own browser; no victim interaction was tested.
- Scope: browser-local by default; cross-client effects are UNVERIFIED.
- Confidentiality / integrity / availability: see Impact below; no availability impact was measured.

## 3. Status

Confirmed — Partially Fixed. Evidence state: LOCAL_CONFIRMED (partial fix).

## 4. Affected components

- `isAdminExamAttempt` (line 14020)
- `logStudentActivity` (7364)
- `syncActivityLogToGoogleForm` (7339)

## 5. Security boundary

Audit logging must record actions regardless of identity. Test identities should be tagged, not dropped.

## 6. Root cause

The helper still returns true for `isAdminTester` and `gv_test`, causing `logStudentActivity` to return null for those identities. V4.8.6 changed the public guest ID to be logged.

## 7. Evidence

- `IV-23` verifies admin/tester identities produce no form payload while public-exam guests now do.
- `P4-09` records the same partial fix.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Synthetic admin/tester, guest and ordinary user fixtures.
- Mock form dispatcher; no live POST.

## 9. Reproduction steps

1. Invoke activity logging for each identity fixture.
2. Inspect whether a form payload is generated.
3. Compare with the ordinary user control.

## 10. PoC

Audit PoC: `../poc/NEW-10/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new05_new07_new10_misc.js`.  
Type: **DISPLAY**. Cleanup: `value-display only`.

## 11. Expected behavior

Every privileged or test action should produce an audit record with an explicit test tag.

## 12. Actual behavior

Admin/tester and `gv_test` actions are dropped; public guests are now logged.

## 13. Impact

Actions by privileged test identities leave no audit trail in the measured client logging path, reducing detective controls.

## 14. Attack scenario

A tester identity changes exam state; no log entry is generated, so later review cannot distinguish it from no action.

## 15. Remediation

1. Remove identity-based log suppression from `isAdminExamAttempt`.
2. Tag test activity server-side and retain it.
3. Log to an append-only server store rather than a third-party form.

## 16. References

- OWASP ASVS v4.0 V8 Logging
- CWE-778 Insufficient Logging

## 17. Retest criteria

- All identity fixtures must produce audit entries.
- Test entries must be tagged, not omitted.

## 18. Limitations

- Live form delivery was not tested.
