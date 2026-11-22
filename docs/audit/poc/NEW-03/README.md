# PoC — NEW-03: Replay and age guards are present but the packet nonce is optional

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/tests/phase3_tests.js`](../../../../research/trithuc5/tests/phase3_tests.js)  
**Cleanup:** `n/a (regression-only)`

## Purpose

Demonstrate the measured NEW-03 behavior using only synthetic data: v4.

## Prerequisites

- Synthetic packets with and without nonce.
- Mock packet processor in the VM.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Replay a nonced packet and observe rejection.
2. Replay a nonce-less packet and observe only idempotency.
3. Send an old signed packet and observe rejection.

## Expected behavior

Every packet must carry a mandatory server-issued nonce and sequence number.

## Observed behavior

Nonced replay and stale packets are rejected; nonce-less replay remains unprotected.

## Cleanup

Run `n/a (regression-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
