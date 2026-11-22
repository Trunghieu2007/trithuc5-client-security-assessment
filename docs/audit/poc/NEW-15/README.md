# PoC — NEW-15: Admin preview unlock-all still short-circuits every VIP gate after a forged session

**Type:** ACTION  
**Build:** V4.8.0 / SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`  
**Canonical script:** [`research/trithuc5/poc/poc_new15_admin_preview.js`](../../../../research/trithuc5/poc/poc_new15_admin_preview.js)  
**Cleanup:** `__AERO_NEW15_RESTORE__()`

## Purpose

Demonstrate the measured NEW-15 behavior using only synthetic data: v4.

## Prerequisites

- Synthetic pending student with no VIP fields.
- Own browser origin and DevTools Console.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Confirm all gates deny with preview off and no admin session.
2. Forge the admin session locally using the bundle's signature helper.
3. Enable admin preview unlock-all.
4. Re-run the three gates and observe universal allow.
5. Run the restore function.

## Expected behavior

Local session state and preview flags must never bypass entitlement checks.

## Observed behavior

The forged session plus preview flag makes every measured gate return true for a non-VIP, unsigned synthetic user.

## Cleanup

Run `__AERO_NEW15_RESTORE__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
