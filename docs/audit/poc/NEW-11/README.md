# PoC — NEW-11: VIP approval seal is derived from bundle-literal secrets

**Type:** ACTION  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_f03_vip_entitlement.js`](../../../../research/trithuc5/poc/poc_f03_vip_entitlement.js)  
**Cleanup:** `__AERO_F03_RESTORE__()`

## Purpose

Demonstrate the measured NEW-11 behavior using only synthetic data: the master-seal value and vault hash are literals in the shipped bundle.

## Prerequisites

- Pinned V4.8.6 source available for inspection.
- Own browser origin and DevTools Console; no account, no server access.
- Synthetic user fixture only.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Load the app and create a synthetic pending student fixture in the isolated test user table.
2. Use the bundle's own hash/signature helpers to recompute `_sig` and the teacher approval seal from the bundle literals.
3. Set both artifacts on the synthetic record and rerun boot normalization.
4. Call the three VIP gates and inspect the issued backend grant token.
5. Run the documented restore function when finished.

## Expected behavior

A client-computed approval artifact must be rejected. VIP state and backend tokens must be issued only by a server after an authenticated teacher action.

## Observed behavior

`IV-02b`, `IV-03`, `IV-04`, `IV-05`, `IV-06` and `IV-09` observed all three gates returning true and a `bkt44_`-style token issued, with zero KV writes and zero form dispatches.

## Cleanup

Run `__AERO_F03_RESTORE__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
