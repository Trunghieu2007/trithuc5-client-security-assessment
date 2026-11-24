# NEW-14: Privileged-id exemptions remain after a partial detector fix

**Severity:** High  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Partially Fixed  
**Evidence state:** LOCAL_CONFIRMED (partial fix + residual)  
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

Confirmed — Partially Fixed. Evidence state: LOCAL_CONFIRMED (partial fix + residual).

## 4. Affected components

- `detectAndBlockStudentVipHackV44` (15869)
- `verifyRuntimeSecurityIntegrity` (4170)
- `isAdminExamAttempt` (13965)

## 5. Security boundary

Tester or guest identities must not be trusted merely because their ID matches a special value. Authorization exemptions must be server-issued and time-bounded.

## 6. Root cause

V4.8.6 removed the `isAdminTester` detector exemption and now detects VIP flags on guest IDs, but `gv_test` still skips the detector and the runtime integrity block still exempts three named IDs.

## 7. Evidence

- `IV-11` and `IV-15` verify `isAdminTester`, `stu_free_12b1` and `stu_practice_e` are now detected.
- `IV-11-gv_test` verifies `gv_test` still skips the detector even with VIP flags.
- `IV-13` verifies junk fields and `maxDevices: 999` are left untouched for the three privileged IDs.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Synthetic fixtures for the privileged IDs and an ordinary control ID.
- Pinned V5.4.6 source.

## 9. Reproduction steps

1. Run the detector and runtime integrity check with identical tampered fields for each ID.
2. Compare `gv_test` with the ordinary control and the two now-fixed guest IDs.
3. Inspect whether audit logging is suppressed by `isAdminExamAttempt`.

## 10. PoC

Audit PoC: `../poc/NEW-14/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new05_new07_new10_misc.js`.  
Type: **DISPLAY**. Cleanup: `value-display only; no local mutation by default`.

## 11. Expected behavior

No ID value should bypass integrity checks. Tester status should be a server-issued, time-limited property.

## 12. Actual behavior

Two exemptions are closed, but `gv_test` still skips the detector, the runtime block still exempts all three IDs, and admin/tester attempts still suppress logs.

## 13. Impact

A user who can set or guess a privileged ID can avoid tamper detection and runtime integrity enforcement for that local client.

## 14. Attack scenario

A local script changes the active user ID to `gv_test`, adds unrealistic device limits, and passes the runtime check that would lock an ordinary user.

## 15. Remediation

1. Remove all ID-prefix or ID-name exemptions from client security checks.
2. Issue tester status from the server with an expiry and purpose limitation.
3. Audit every action regardless of test identity, tagging rather than dropping log rows.

## 16. References

- OWASP Top 10 2021 A01 Broken Access Control
- OWASP ASVS v4.0 V4 Access Control
- CWE-639 Authorization Bypass Through User-Controlled Key

## 17. Retest criteria

- No synthetic ID may skip detector or runtime integrity checks.
- Admin/tester actions must produce audit entries.

## 18. Limitations

- Only the three named privileged IDs and two guest IDs were measured.
- The PoC is DISPLAY by default and does not modify production state.
