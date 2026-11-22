# PoC — NEW-17: Unauthenticated results API exposes student result records

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_new17_results_api.js`](../../../../research/trithuc5/poc/poc_new17_results_api.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured NEW-17 behavior using only synthetic data: v4.

## Prerequisites

- Target reachable over HTTPS.
- Owner-authorized read-only probe; no login, no write, no bulk collection.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Send one unauthenticated GET to /api/results.
2. Record status, top-level keys, record count and record field names only.
3. Run the DISPLAY PoC in a mock browser to confirm it sends GET only.
4. Do not print, store or replicate any record values.

## Expected behavior

An anonymous request should receive 401/403 or a strictly scoped empty result. Student-identifying fields should require an authenticated relationship to the record.

## Observed behavior

An anonymous GET returned 200 with two records. Field names include username, name, class, school, score, examTitle, startTime, endTime, tabSwitches and aiSuspicionCount.

## Cleanup

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
