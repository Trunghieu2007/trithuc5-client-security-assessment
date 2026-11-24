# NEW-08: Third-party Google Form sync disabled; password masking retained — FIXED

**Severity:** Medium  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Fixed  
**Evidence state:** LOCAL_CONFIRMED for masking fix; live delivery UNVERIFIED  
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

Confirmed — Fixed. Evidence state: LOCAL_CONFIRMED for masking fix; live delivery UNVERIFIED.

## 4. Affected components

- `logStudentActivity` (line 7419)
- `syncActivityLogToGoogleForm` (7339)
- Google Form `entry.111`…`entry.444` fields

## 5. Security boundary

Activity telemetry must not disclose student identity to an unrelated third party without a documented data-processing basis.

## 6. Root cause

V5.4.6 returns `false` immediately from `dispatchParamsToGoogleFormUrl` with the marker `V5.4.6: Đã gỡ bỏ hoàn toàn Google Form`. `logStudentActivity` still writes a masked local entry but `syncedToGForm` is always false.

## 7. Evidence

- `IV-21` verifies the synthetic sentinel is masked in `detail` and the fourth POST pair.
- `IV-22` verifies no other sensitive field mapping was introduced.
- `poc-suite-validation.txt` verifies the DISPLAY PoC transmits nothing.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Synthetic activity record with a sentinel value.
- Mock form dispatcher that records but does not send.

## 9. Reproduction steps

1. Create a synthetic activity log entry with a password-like sentinel.
2. Call `logStudentActivity` and inspect the generated form payload.
3. Confirm the sentinel is masked and identity fields remain.

## 10. PoC

Audit PoC: `../poc/NEW-08/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new08_new09_leakage.js`.  
Type: **DISPLAY**. Cleanup: `n/a (read-only)`.

## 11. Expected behavior

No student identity or activity detail should be sent to a third party without explicit authorization and minimization.

## 12. Actual behavior

No Google Form dispatch payload is produced at all; the masked detail remains only in localStorage.

## 13. Impact

The third-party disclosure path is closed in V5.4.6. Activity records remain local and are synced through the first-party results API.

## 14. Attack scenario

A student performs a graded action; the app posts their name, class and score to a Google Form controlled outside the project.

## 15. Remediation

1. Remove the form sync or replace it with a first-party authenticated logging endpoint.
2. Minimize fields; do not send names, classes or raw detail to third parties.
3. Keep the masking fix as defense in depth.

## 16. References

- OWASP ASVS v4.0 V3 Data Protection and V8 Logging
- CWE-200 Exposure of Sensitive Information

## 17. Retest criteria

- No third-party POST should contain student identity fields.
- Masking must remain even if the channel is replaced.

## 18. Limitations

- Live form delivery was not executed; only local interception was used.
