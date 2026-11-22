# PoC — NEW-15: Admin preview unlock-all is gated by a server-verified admin session

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_new15_admin_preview.js`](../../../../research/trithuc5/poc/poc_new15_admin_preview.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured NEW-15 behavior using only synthetic data: v4.

## Prerequisites

- Pinned V4.8.6 source.
- Synthetic pending student with no VIP fields.
- No real admin account is used.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Set the preview flag with no admin session and run the runtime integrity check.
2. Call all three VIP gates and confirm they deny.
3. Set a server-verified admin session in the isolated VM and confirm the intended preview behavior.
4. Run the DISPLAY PoC in a browser and confirm it performs no POST or flag toggle.

## Expected behavior

Local preview flags must never bypass entitlement checks without an authenticated, server-verified admin session.

## Observed behavior

The orphan flag is cleared and all three gates deny without a server-verified session. With one, the unlock is an intended admin capability, not a bypass.

## Cleanup

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
