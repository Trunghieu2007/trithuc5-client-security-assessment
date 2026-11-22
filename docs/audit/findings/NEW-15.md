# NEW-15: Admin preview unlock-all is gated by a server-verified admin session

**Severity:** Informational  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Fixed  
**Evidence state:** FIXED-V4.8.5 / VERIFIED-V4.8.6  
**Build pin:** V4.8.6, SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`

## 1. Overview

This finding was verified against the source-hash-pinned V4.8.6 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

## 2. Severity

**Assigned severity:** Informational. **CVSS vector/score:** not scored. Attack prerequisites, complexity, privileges, user interaction, scope and impact are stated qualitatively below rather than converted into an uncalculated numeric score.

- Attack prerequisites: local script execution on the app origin or access to the pinned public bundle; no server credentials.
- Attack complexity: low for the measured paths; the functions execute offline from bundle literals or local state.
- Required privileges: none in the tested client context.
- User interaction: the tester performs the action in their own browser; no victim interaction was tested.
- Scope: browser-local by default; cross-client effects are UNVERIFIED.
- Confidentiality / integrity / availability: see Impact below; no availability impact was measured.

## 3. Status

Confirmed — Fixed. Evidence state: FIXED-V4.8.5 / VERIFIED-V4.8.6.

## 4. Affected components

- admin preview clear logic (4185-4195)
- `computeAdminSessionSig` (4166-4170, per-window ephemeral salt)
- `loginAdmin()` server API (31907-31959)
- VIP gates `hasStudentVipAccess` (6915), `hasVerifiedPackageAccess` (15779), `verifyProtectedVipActionV44` (15856)

## 5. Security boundary

A preview mode must be a scoped, server-authorized grant. It must not become a universal entitlement switch when combined with a client-minted session.

## 6. Root cause

V4.8.0 relied on a bundle-literal admin session salt. V4.8.5 made that salt ephemeral per window, removed the admin password hashes, cleared the remembered session at boot, and required the server-verified flag set only after /api/admin/login succeeds.

## 7. Evidence

- `IV-16`-`IV-18` now show an orphan preview flag being cleared and all three gates denying.
- `IV-19` confirms that a server-verified admin session still unlocks by design.
- `P4-10` inverts the old residual assertion into a fix assertion.
- `F-02-T01` and `F-02-T05` confirm the remembered-session and server-login paths.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Pinned V4.8.6 source.
- Synthetic pending student with no VIP fields.
- No real admin account is used.

## 9. Reproduction steps

1. Set the preview flag with no admin session and run the runtime integrity check.
2. Call all three VIP gates and confirm they deny.
3. Set a server-verified admin session in the isolated VM and confirm the intended preview behavior.
4. Run the DISPLAY PoC in a browser and confirm it performs no POST or flag toggle.

## 10. PoC

Audit PoC: `../poc/NEW-15/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new15_admin_preview.js`.  
Type: **DISPLAY**. Cleanup: `n/a (read-only)`.

## 11. Expected behavior

Local preview flags must never bypass entitlement checks without an authenticated, server-verified admin session.

## 12. Actual behavior

The orphan flag is cleared and all three gates deny without a server-verified session. With one, the unlock is an intended admin capability, not a bypass.

## 13. Impact

The independent offline admin-preview bypass present in V4.8.0 is removed. Residual risk is limited to intentional actions inside an already authenticated admin browser.

## 14. Attack scenario

A user without server admin credentials enables the preview toggle from the console; the VIP gates continue to deny because no server-verified session exists.

## 15. Remediation

1. Keep `P4-10` and `IV-16`-`IV-20` as permanent regression assertions.
2. Make preview a scoped, time-limited, server-issued grant instead of a universal unlock.
3. Audit preview use server-side so it cannot be used as an unobserved entitlement path.

## 16. References

- OWASP Top 10 2021 A01 Broken Access Control
- OWASP ASVS v4.0 V2 and V4
- CWE-284 Improper Access Control

## 17. Retest criteria

- Offline session forgery plus preview must leave all gates denying.
- The DISPLAY PoC must send no POST and toggle no flag.

## 18. Limitations

- Server-side audit of legitimate preview actions was not observable from the client.
- No real admin account was accessed.
