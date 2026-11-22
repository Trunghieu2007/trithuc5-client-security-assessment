# PoC — F-05: Device lock and Gmail binding are enforced from client-owned fields

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_f05_device_lock.js`](../../../../research/trithuc5/poc/poc_f05_device_lock.js)  
**Cleanup:** `__AERO_F05_RESTORE__()`

## Purpose

Demonstrate the measured F-05 behavior using only synthetic data: the limit check reads client-writable user fields.

## Prerequisites

- Synthetic student fixture.
- Local VM or browser console.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Display the local device fields and observed limit decision.
2. Optionally run the opt-in local action to change `maxDevices`.
3. Re-run the binding check and observe the altered decision.
4. Restore state.

## Expected behavior

Device slots and bindings must be registered by a server with out-of-band verification for new devices.

## Observed behavior

The display PoC shows the decision derives entirely from local fields; the opt-in action changes the decision locally.

## Cleanup

Run `__AERO_F05_RESTORE__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
