# PoC — NEW-02: Unsigned cloud packet injection still inserts a pending local user

**Type:** ACTION  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_new02_packet_injection.js`](../../../../research/trithuc5/poc/poc_new02_packet_injection.js)  
**Cleanup:** `__AERO_NEW02_CLEANUP__()`

## Purpose

Demonstrate the measured NEW-02 behavior using only synthetic data: the handler feeds raw objects into the packet processor.

## Prerequisites

- Same-origin script execution in the tester's own browser.
- Synthetic packet fixture.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Construct an unsigned packet with a synthetic user.
2. Post it to the local autosync BroadcastChannel.
3. Observe a pending, non-VIP user inserted locally.
4. Run the cleanup function.

## Expected behavior

Unauthenticated local messages must be ignored or require server verification before any state mutation.

## Observed behavior

A pending user record is inserted locally; VIP escalation and unsigned tombstone deletion are blocked.

## Cleanup

Run `__AERO_NEW02_CLEANUP__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
