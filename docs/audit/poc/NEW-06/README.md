# PoC — NEW-06: Response headers are partially hardened; CSP and narrow CORS remain absent

**Type:** DISPLAY  
**Build:** V5.4.6 / SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`  
**Canonical script:** [`research/trithuc5/tests/run_all.js`](../../../../research/trithuc5/tests/run_all.js)  
**Cleanup:** `n/a (static regression)`

## Purpose

Demonstrate the measured NEW-06 behavior using only synthetic data: v4.

## Prerequisites

- Captured response headers from the pinned build.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Inspect the captured header file.
2. Run the static regression check and compare observed values.

## Expected behavior

A restrictive CSP and narrow CORS should accompany the existing HSTS, XFO and nosniff headers.

## Observed behavior

HSTS, XFO, nosniff, Referrer-Policy and Permissions-Policy are present; CSP is absent and CORS is wildcard.

## Cleanup

Run `n/a (static regression)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
