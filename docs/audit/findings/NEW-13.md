# NEW-13: Tamper detector adds a structural invariant but still trusts bundle secrets

**Severity:** High  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Partially Fixed  
**Evidence state:** LOCAL_CONFIRMED (partial fix + residual)  
**Build pin:** V4.8.0, SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`

## 1. Overview

This finding was verified against the source-hash-pinned V4.8.0 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

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

- `detectAndBlockStudentVipHackV44` (line 15869)
- `computeUserIntegritySig`
- boot normalizer (3574–3642)

## 5. Security boundary

A tamper detector must rely on a secret the attacker cannot reproduce. Structural validation is useful only if the structure is authenticated by a server-held key.

## 6. Root cause

V4.8.0 correctly rejects unsigned or malformed VIP records. However, the signature and approval seal are derived from bundle literals, so an attacker can satisfy the new structural invariant offline.

## 7. Evidence

- `P4-02` verifies an ordinary-looking renamed account with VIP but no signature is now detected.
- `IV-08` verifies tampering after sealing without recomputing artifacts is blocked.
- `IV-09` verifies recomputing both artifacts evades detection again.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Synthetic renamed account fixture.
- Pinned V4.8.0 source and local VM or browser console.

## 9. Reproduction steps

1. Create a renamed synthetic user with VIP flags but no signature; confirm detection.
2. Recompute `_sig` and `_adminVipSeal` using bundle literals.
3. Re-run the detector with both artifacts present.
4. Observe the detector no longer flags the record.

## 10. PoC

Audit PoC: `../poc/NEW-13/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_f03_vip_entitlement.js`.  
Type: **ACTION**. Cleanup: `__AERO_F03_RESTORE__()`.

## 11. Expected behavior

No attacker-controlled input set should be able to satisfy the integrity invariant.

## 12. Actual behavior

The keyword path is improved, but recomputing both artifacts from bundle literals restores the bypass.

## 13. Impact

The detector gives a false sense of integrity. It stops casual edits but not a user who reads the bundle.

## 14. Attack scenario

A user renames an account to avoid a keyword rule, then computes the two artifacts locally. The detector sees a structurally valid record and allows VIP flags.

## 15. Remediation

1. Move integrity secrets to a server and verify them there.
2. Treat detector output as advisory telemetry, not authorization.
3. Preserve the unsigned-record rejection as defense in depth.

## 16. References

- OWASP ASVS v4.0 V4 Access Control
- CWE-807 Reliance on Untrusted Inputs in a Security Decision
- CWE-602 Client-Side Enforcement of Server-Side Security

## 17. Retest criteria

- Recomputed artifacts must still be detected or, preferably, be impossible to compute.
- P4-02 and IV-08/IV-09 must be inverted to secure assertions.

## 18. Limitations

- Heuristic coverage beyond the measured fixtures was not tested.
