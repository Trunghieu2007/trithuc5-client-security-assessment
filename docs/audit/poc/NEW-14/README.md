# PoC — NEW-14: Privileged-id exemptions remain after a partial detector fix

**Type:** DISPLAY  
**Build:** V4.8.0 / SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`  
**Canonical script:** [`research/trithuc5/poc/poc_new05_new07_new10_misc.js`](../../../../research/trithuc5/poc/poc_new05_new07_new10_misc.js)  
**Cleanup:** `value-display only; no local mutation by default`

## Purpose

Demonstrate the measured NEW-14 behavior using only synthetic data: v4.

## Prerequisites

- Synthetic fixtures for the privileged IDs and an ordinary control ID.
- Pinned V4.8.0 source.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Run the detector and runtime integrity check with identical tampered fields for each ID.
2. Compare `gv_test` with the ordinary control and the two now-fixed guest IDs.
3. Inspect whether audit logging is suppressed by `isAdminExamAttempt`.

## Expected behavior

No ID value should bypass integrity checks. Tester status should be a server-issued, time-limited property.

## Observed behavior

Two exemptions are closed, but `gv_test` still skips the detector, the runtime block still exempts all three IDs, and admin/tester attempts still suppress logs.

## Cleanup

Run `value-display only; no local mutation by default` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
