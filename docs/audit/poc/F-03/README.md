# PoC — F-03: VIP entitlement is decided entirely in client-side JavaScript

**Type:** ACTION  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_f03_vip_entitlement.js`](../../../../research/trithuc5/poc/poc_f03_vip_entitlement.js)  
**Cleanup:** `__AERO_F03_RESTORE__()`

## Purpose

Demonstrate the measured F-03 behavior using only synthetic data: the vault is an in-memory map rebuilt from client-owned records.

## Prerequisites

- Own browser and synthetic student fixture.
- No real account or payment transaction.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Start with a non-VIP synthetic record and confirm all gates deny.
2. Forge `_sig` and `_adminVipSeal` using the bundle's own helpers.
3. Re-run boot normalization and register the record in the client vault.
4. Call the three gates and observe them return true.
5. Restore local state.

## Expected behavior

A local write to user fields must never change entitlement. The server should be the only source of VIP status.

## Observed behavior

Local artifact forgery changes entitlement for every measured gate, including protected-action verification and the backend grant token.

## Cleanup

Run `__AERO_F03_RESTORE__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
