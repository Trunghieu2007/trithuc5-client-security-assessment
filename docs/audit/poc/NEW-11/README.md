# PoC — NEW-11: VIP approval seal is derived from bundle-literal secrets

**Type:** DISPLAY  
**Build:** V5.4.6 / SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`  
**Canonical script:** [`research/trithuc5/poc/poc_new11_seal_forgery.js`](../../../../research/trithuc5/poc/poc_new11_seal_forgery.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured NEW-11 behavior using only synthetic data: the master-seal value and vault hash are literals in the shipped bundle.

## Prerequisites

- Pinned V5.4.6 source available for inspection.
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

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
