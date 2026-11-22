# PoC — NEW-08: Activity logs still reach a third-party Google Form; password masking is fixed

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_new08_new09_leakage.js`](../../../../research/trithuc5/poc/poc_new08_new09_leakage.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured NEW-08 behavior using only synthetic data: the form sync path remains.

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

Password-like detail is masked; name, class, score and other detail values are still present in the wire payload.

## Cleanup

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
