# NEW-11: VIP approval seal is derived from bundle-literal secrets

**Severity:** Critical  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Open  
**Evidence state:** LOCAL_CONFIRMED  
**Build pin:** V5.4.6, SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`

## 1. Overview

This finding was verified against the source-hash-pinned V5.4.6 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

## 2. Severity

**Assigned severity:** Critical. **CVSS vector/score:** not scored. Attack prerequisites, complexity, privileges, user interaction, scope and impact are stated qualitatively below rather than converted into an uncalculated numeric score.

- Attack prerequisites: local script execution on the app origin or access to the pinned public bundle; no server credentials.
- Attack complexity: low for the measured paths; the functions execute offline from bundle literals or local state.
- Required privileges: none in the tested client context.
- User interaction: the tester performs the action in their own browser; no victim interaction was tested.
- Scope: browser-local by default; cross-client effects are UNVERIFIED.
- Confidentiality / integrity / availability: see Impact below; no availability impact was measured.

## 3. Status

Confirmed — Open. Evidence state: LOCAL_CONFIRMED.

## 4. Affected components

- `computeTeacherVipApprovalSealV44` (pinned line 15871)
- `computeUserIntegritySig` and the integrity salt literal (line 4151)
- `BackendVipAuthServiceV44` (line 15592)
- VIP gates `hasStudentVipAccess` (6860), `hasVerifiedPackageAccess` (6870), `verifyProtectedVipActionV44` (15801)

## 5. Security boundary

A teacher/admin approval decision must be issued by an authority the applicant cannot execute code on. In this build the approval artifact is computed inside the same browser that requests the entitlement.

## 6. Root cause

The master-seal value and vault hash are literals in the shipped bundle. Every other seal input is attacker-chosen. Recomputing `_sig` and `_adminVipSeal` offline therefore produces artifacts indistinguishable from a real approval.

## 7. Evidence

- Independent suite `IV-01`…`IV-33` executes the real V5.4.6 functions with synthetic records.
- `P4-16` reproduces the complete `_sig` → seal → vault → gate chain with zero KV writes.
- `poc-suite-validation.txt` confirms the ACTION PoC changes only local mechanism state and writes nothing to ntfy/KV.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Pinned V5.4.6 source available for inspection.
- Own browser origin and DevTools Console; no account, no server access.
- Synthetic user fixture only.

## 9. Reproduction steps

1. Load the app and create a synthetic pending student fixture in the isolated test user table.
2. Use the bundle's own hash/signature helpers to recompute `_sig` and the teacher approval seal from the bundle literals.
3. Set both artifacts on the synthetic record and rerun boot normalization.
4. Call the three VIP gates and inspect the issued backend grant token.
5. Run the documented restore function when finished.

## 10. PoC

Audit PoC: `../poc/NEW-11/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_f03_vip_entitlement.js`.  
Type: **ACTION**. Cleanup: `__AERO_F03_RESTORE__()`.

## 11. Expected behavior

A client-computed approval artifact must be rejected. VIP state and backend tokens must be issued only by a server after an authenticated teacher action.

## 12. Actual behavior

`IV-02b`, `IV-03`, `IV-04`, `IV-05`, `IV-06` and `IV-09` observed all three gates returning true and a `bkt44_`-style token issued, with zero KV writes and zero form dispatches.

## 13. Impact

Any user able to run script in the app origin can grant themselves VIP entitlements and protected-package access without a teacher, without a network call, and without touching production state.

## 14. Attack scenario

A student opens the public app, pastes a short console snippet, seals their own local record, and unlocks VIP-only content. Because the grant token is also minted locally, later checks that trust the token pass as well.

## 15. Remediation

1. Delete all client-side seal and backend-token minting functions from the shipped bundle.
2. Issue entitlement, approval seals and grant tokens from an authenticated server; store only opaque, short-lived references in the client.
3. Rotate every bundle-literal signing secret and vault hash after the server boundary exists.
4. Make all VIP gates fail closed when no server-verified grant is present.

## 16. References

- OWASP Top 10 2021 A01 Broken Access Control
- OWASP ASVS v4.0 V2 Authentication and V4 Access Control
- CWE-602 Client-Side Enforcement of Server-Side Security
- CWE-798 Use of Hard-coded Credentials

## 17. Retest criteria

- Recompute `_sig` and the seal offline; the record must remain non-VIP.
- `P4-16` and IV-01…IV-10 must be inverted to secure assertions and pass.
- Confirm granting requires a server request that the tester cannot forge from bundle data.

## 18. Limitations

- No production account was used and no live cross-client grant was attempted.
- Server-side enforcement could not be confirmed because no same-origin entitlement API was observed.
