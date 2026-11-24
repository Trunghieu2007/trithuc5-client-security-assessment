# PoC — NEW-05: Gemini OCR key moved to sessionStorage but remains same-origin readable

**Type:** DISPLAY  
**Build:** V5.4.6 / SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`  
**Canonical script:** [`research/trithuc5/poc/poc_new05_new07_new10_misc.js`](../../../../research/trithuc5/poc/poc_new05_new07_new10_misc.js)  
**Cleanup:** `values redacted by default`

## Purpose

Demonstrate the measured NEW-05 behavior using only synthetic data: v4.

## Prerequisites

- Own browser with a user-entered key fixture.
- No real provider key used or stored.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Inspect the key storage key name in source.
2. Run the display PoC; observe redacted presence only.
3. Confirm no build-time key is embedded.

## Expected behavior

The provider key should exist only server-side.

## Observed behavior

The key is removed from localStorage but remains readable from sessionStorage by same-origin script.

## Cleanup

Run `values redacted by default` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
