# PoC — NEW-08: Third-party Google Form sync disabled; password masking retained — FIXED

**Type:** DISPLAY  
**Build:** V5.4.6 / SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`  
**Canonical script:** [`research/trithuc5/poc/poc_new08_new09_leakage.js`](../../../../research/trithuc5/poc/poc_new08_new09_leakage.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured NEW-08 behavior using only synthetic data: v5.

## Prerequisites

- Synthetic activity record with a sentinel value.
- Mock form dispatcher that records but does not send.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Create a synthetic activity log entry with a password-like sentinel.
2. Call `logStudentActivity` and inspect the generated form payload.
3. Confirm the sentinel is masked and identity fields remain.

## Expected behavior

No student identity or activity detail should be sent to a third party without explicit authorization and minimization.

## Observed behavior

No Google Form dispatch payload is produced at all; the masked detail remains only in localStorage.

## Cleanup

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
