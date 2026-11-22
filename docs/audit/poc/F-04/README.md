# PoC — F-04: Exam answers are recoverable from a bundle-seeded client vault

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_f04_exam_answers.js`](../../../../research/trithuc5/poc/poc_f04_exam_answers.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured F-04 behavior using only synthetic data: the vault's claim token and PRNG seeds are in the same bundle as the encrypted data.

## Prerequisites

- Pinned V4.8.6 source.
- Local Node decoder; no live exam attempt.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Locate the embedded compressed chunks and seed values.
2. Reconstruct the vault offline with the bundle's own algorithm.
3. Count exams and answer entries.

## Expected behavior

Answer keys should not be present in client-downloadable artifacts; grading should occur server-side.

## Observed behavior

The full answer set is recoverable offline from the shipped bundle.

## Cleanup

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
