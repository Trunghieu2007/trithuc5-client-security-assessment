# PoC — NEW-07: Cross-tab state replacement still copies non-VIP fields from writable storage

**Type:** DISPLAY  
**Build:** V5.4.6 / SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`  
**Canonical script:** [`research/trithuc5/poc/poc_new05_new07_new10_misc.js`](../../../../research/trithuc5/poc/poc_new05_new07_new10_misc.js)  
**Cleanup:** `__AERO_NEW07_RESTORE__()`

## Purpose

Demonstrate the measured NEW-07 behavior using only synthetic data: v4.

## Prerequisites

- Two simulated tabs sharing a mock storage backend.
- Synthetic user records only.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Change a non-VIP field in one tab's localStorage fixture.
2. Fire the storage event handler in the second tab.
3. Observe the second tab replace its user array.
4. Restore state.

## Expected behavior

Cross-tab sync should merge only server-verified state or ignore local writes for privileged fields.

## Observed behavior

Non-VIP fields propagate; VIP fields are stripped. Sensitive keys are no longer mirrored.

## Cleanup

Run `__AERO_NEW07_RESTORE__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
