# NEW-03: Replay and age guards are present but the packet nonce is optional

**Severity:** Low  
**CVSS v4.0:** not scored — see `../03-methodology.md`.  
**Confidence:** Confirmed  
**Status:** Partially Fixed  
**Evidence state:** LOCAL_CONFIRMED (partial fix)  
**Build pin:** V5.4.6, SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`

## 1. Overview

This finding was verified against the source-hash-pinned V5.4.6 client build. Evidence comes from captured headers, static source review, or real extracted functions executed in an isolated Node VM with synthetic fixtures. No production state was modified.

## 2. Severity

**Assigned severity:** Low. **CVSS vector/score:** not scored. Attack prerequisites, complexity, privileges, user interaction, scope and impact are stated qualitatively below rather than converted into an uncalculated numeric score.

- Attack prerequisites: local script execution on the app origin or access to the pinned public bundle; no server credentials.
- Attack complexity: low for the measured paths; the functions execute offline from bundle literals or local state.
- Required privileges: none in the tested client context.
- User interaction: the tester performs the action in their own browser; no victim interaction was tested.
- Scope: browser-local by default; cross-client effects are UNVERIFIED.
- Confidentiality / integrity / availability: see Impact below; no availability impact was measured.

## 3. Status

Confirmed — Partially Fixed. Evidence state: LOCAL_CONFIRMED (partial fix).

## 4. Affected components

- `processIncomingCloudPacket` (line 5769)
- `__SEEN_CLOUD_NONCES_V480__` (5713)

## 5. Security boundary

Replay protection must apply to every accepted packet, not only packets that voluntarily include a nonce.

## 6. Root cause

V4.8.6 rejects stale packets and replays when a nonce is present. A packet without a nonce is treated only idempotently, so replay is not fully prevented.

## 7. Evidence

- `F-01-T06` verifies nonce replay is rejected.
- `F-01-T07` verifies packets older than 26 hours are rejected.
- `P3-03` verifies signed-stale packets are rejected.
- `SC-05` asserts replay protection in the acceptance suite.

All evidence files are sanitized and indexed in `../evidence/README.md`. No real credential, real user record or production packet body is stored.

## 8. Reproduction prerequisites

- Synthetic packets with and without nonce.
- Mock packet processor in the VM.

## 9. Reproduction steps

1. Replay a nonced packet and observe rejection.
2. Replay a nonce-less packet and observe only idempotency.
3. Send an old signed packet and observe rejection.

## 10. PoC

Audit PoC: `../poc/NEW-03/README.md`.  
Canonical implementation: `research/trithuc5/tests/phase3_tests.js`.  
Type: **DISPLAY**. Cleanup: `n/a (regression-only)`.

## 11. Expected behavior

Every packet must carry a mandatory server-issued nonce and sequence number.

## 12. Actual behavior

Nonced replay and stale packets are rejected; nonce-less replay remains unprotected.

## 13. Impact

Limited local replay of packets that omit a nonce. This is a defense-in-depth gap rather than a standalone entitlement bypass.

## 14. Attack scenario

A local script resends a nonce-less packet; the client applies it again instead of rejecting it as a replay.

## 15. Remediation

1. Make nonce mandatory and reject packets without one.
2. Add a monotonically increasing sequence number validated server-side.
3. Bound the replay cache and expire it consistently with timestamp validation.

## 16. References

- OWASP ASVS v4.0 V4 Access Control
- CWE-294 Authentication Bypass by Capture-replay

## 17. Retest criteria

- Nonce-less packets must be rejected.
- SC-05 and F-01-T06/T07 must pass as secure assertions.

## 18. Limitations

- No live replay was attempted.
