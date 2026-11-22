# NEW-15: Admin preview unlock-all still short-circuits every VIP gate after a forged session

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

- admin preview clear logic (4184–4187)
- `computeAdminSessionSig` (4165)
- `hasStudentVipAccess` (6860)
- `hasVerifiedPackageAccess` (6870)
- `verifyProtectedVipActionV44` (15801)

## 5. Security boundary

A preview mode must be a scoped, server-authorized grant. It must not become a universal entitlement switch when combined with a client-minted session.

## 6. Root cause

V4.8.0 clears the preview flag when `isAdminLoggedIn` is false, but the admin session signature is still reproducible from bundle literals. Once the forged session sets the logged-in flag, the preview flag re-enables all gates.

## 7. Evidence

- `IV-16`…`IV-18` show all three gates returning true for a pending, unsigned, non-VIP junk student.
- `IV-19` shows all three gates deny when preview is off.
- `IV-20` reproduces the admin session signature from bundle data.
- `P4-10` verifies the same production gate behavior.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Synthetic pending student with no VIP fields.
- Own browser origin and DevTools Console.

## 9. Reproduction steps

1. Confirm all gates deny with preview off and no admin session.
2. Forge the admin session locally using the bundle's signature helper.
3. Enable admin preview unlock-all.
4. Re-run the three gates and observe universal allow.
5. Run the restore function.

## 10. PoC

Audit PoC: `../poc/NEW-15/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new15_admin_preview.js`.  
Type: **ACTION**. Cleanup: `__AERO_NEW15_RESTORE__()`.

## 11. Expected behavior

Local session state and preview flags must never bypass entitlement checks.

## 12. Actual behavior

The forged session plus preview flag makes every measured gate return true for a non-VIP, unsigned synthetic user.

## 13. Impact

This is a second, independent path to VIP and package access. It also defeats the remediation value of the V4.8.0 preview-clear change.

## 14. Attack scenario

A user forges an admin session in their own browser, enables preview, and opens protected content without any VIP approval.

## 15. Remediation

1. Remove universal unlock-all behavior from the client.
2. Make preview a server-issued, scoped and time-limited grant tied to an authenticated admin session.
3. Replace client-side admin sessions with `HttpOnly; Secure; SameSite=Strict` server sessions.

## 16. References

- OWASP Top 10 2021 A01 Broken Access Control
- OWASP ASVS v4.0 V2 and V4
- CWE-284 Improper Access Control

## 17. Retest criteria

- Forged session plus preview must leave all gates denying.
- `P4-10` and IV-16…IV-20 must be inverted to secure assertions.

## 18. Limitations

- No real admin account was accessed.
- Server-side preview authorization could not be confirmed.
