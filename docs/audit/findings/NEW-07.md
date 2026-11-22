# NEW-07: Cross-tab state replacement still copies non-VIP fields from writable storage

**Severity:** Medium  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Partially Fixed  
**Evidence state:** LOCAL_CONFIRMED (partial fix)  
**Build pin:** V4.8.0, SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`

## 1. Overview

This finding was verified against the source-hash-pinned V4.8.0 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

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

- `setupCrossTabUserSync` (line 34455)
- `safeStorageSet` (2228)
- `localStorage` user table

## 5. Security boundary

State synchronization must not treat writable localStorage as an authoritative source for application state in other tabs.

## 6. Root cause

V4.8.0 strips VIP flags from records whose artifacts do not verify, but the handler still replaces user and activity-log arrays wholesale from localStorage.

## 7. Evidence

- `A-04-T02` verifies non-VIP fields propagate across tabs.
- `IV-24` and `IV-25` verify sensitive keys are no longer mirrored to weak stores.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Two simulated tabs sharing a mock storage backend.
- Synthetic user records only.

## 9. Reproduction steps

1. Change a non-VIP field in one tab's localStorage fixture.
2. Fire the storage event handler in the second tab.
3. Observe the second tab replace its user array.
4. Restore state.

## 10. PoC

Audit PoC: `../poc/NEW-07/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new05_new07_new10_misc.js`.  
Type: **DISPLAY**. Cleanup: `__AERO_NEW07_RESTORE__()`.

## 11. Expected behavior

Cross-tab sync should merge only server-verified state or ignore local writes for privileged fields.

## 12. Actual behavior

Non-VIP fields propagate; VIP fields are stripped. Sensitive keys are no longer mirrored.

## 13. Impact

Local tampering in one tab can influence another tab's view of user and log data. VIP escalation through this path was fixed.

## 14. Attack scenario

A user edits a name or status field in localStorage and sees the change appear in another open tab without a server event.

## 15. Remediation

1. Replace wholesale state replacement with a server-verified diff.
2. Treat localStorage as cache only; validate on read.
3. Keep the V4.8.0 VIP stripping as defense in depth.

## 16. References

- OWASP ASVS v4.0 V4 Access Control
- CWE-602 Client-Side Enforcement of Server-Side Security

## 17. Retest criteria

- Local non-VIP edits must not propagate to other tabs.
- VIP stripping must remain in place.

## 18. Limitations

- The PoC uses a mock storage event, not two live browser windows.
