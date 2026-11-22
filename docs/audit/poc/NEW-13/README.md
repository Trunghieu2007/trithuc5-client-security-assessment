# PoC — NEW-13: Tamper detector adds a structural invariant but still trusts bundle secrets

**Type:** ACTION  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_f03_vip_entitlement.js`](../../../../research/trithuc5/poc/poc_f03_vip_entitlement.js)  
**Cleanup:** `__AERO_F03_RESTORE__()`

## Purpose

Demonstrate the measured NEW-13 behavior using only synthetic data: v4.

## Prerequisites

- Synthetic renamed account fixture.
- Pinned V4.8.6 source and local VM or browser console.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Create a renamed synthetic user with VIP flags but no signature; confirm detection.
2. Recompute `_sig` and `_adminVipSeal` using bundle literals.
3. Re-run the detector with both artifacts present.
4. Observe the detector no longer flags the record.

## Expected behavior

No attacker-controlled input set should be able to satisfy the integrity invariant.

## Observed behavior

The keyword path is improved, but recomputing both artifacts from bundle literals restores the bypass.

## Cleanup

Run `__AERO_F03_RESTORE__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
