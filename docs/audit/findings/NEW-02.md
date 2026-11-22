# NEW-02: Unsigned cloud packet injection still inserts a pending local user

**Severity:** Low  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Open  
**Evidence state:** LOCAL_CONFIRMED (downgrade verified; tombstone path fixed)  
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

Confirmed — Open. Evidence state: LOCAL_CONFIRMED (downgrade verified; tombstone path fixed).

## 4. Affected components

- `BroadcastChannel('TRITHUC50_AUTOSYNC_V436')`
- `processIncomingCloudPacket` (5714)

## 5. Security boundary

Local inter-tab messages must not be treated as authenticated cloud state. V4.8.0 removed the internal bus bridge but kept the local BroadcastChannel handler.

## 6. Root cause

The handler feeds raw objects into the packet processor. Non-admin packets are downgraded to pending/non-VIP, and the unsigned tombstone path is fixed, but insertion of a pending user remains possible.

## 7. Evidence

- `P4-19` and `IV-31` verify unsigned packets are downgraded and unsigned tombstones rejected.
- `poc-suite-validation.txt` verifies the rewritten PoC uses the production local BroadcastChannel path and writes nothing to ntfy/KV.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Same-origin script execution in the tester's own browser.
- Synthetic packet fixture.

## 9. Reproduction steps

1. Construct an unsigned packet with a synthetic user.
2. Post it to the local autosync BroadcastChannel.
3. Observe a pending, non-VIP user inserted locally.
4. Run the cleanup function.

## 10. PoC

Audit PoC: `../poc/NEW-02/README.md`.  
Canonical implementation: `research/trithuc5/poc/poc_new02_packet_injection.js`.  
Type: **ACTION**. Cleanup: `__AERO_NEW02_CLEANUP__()`.

## 11. Expected behavior

Unauthenticated local messages must be ignored or require server verification before any state mutation.

## 12. Actual behavior

A pending user record is inserted locally; VIP escalation and unsigned tombstone deletion are blocked.

## 13. Impact

Local-only state pollution and potential UI confusion. No verified production cross-client effect.

## 14. Attack scenario

A browser extension posts a raw packet to the local sync channel; a pending user appears in the tester's own client view.

## 15. Remediation

1. Require a server-issued signature for every packet before mutation.
2. Validate channel messages against a strict schema and reject unknown senders.
3. Preserve the pending/non-VIP downgrade as defense in depth.

## 16. References

- OWASP ASVS v4.0 V4 Access Control
- CWE-20 Improper Input Validation
- CWE-345 Insufficient Verification of Data Authenticity

## 17. Retest criteria

- Unsigned local packets must cause no state mutation.
- Pending insertion must be removed or server-verified.

## 18. Limitations

- No production packet was published and no other client was targeted.
