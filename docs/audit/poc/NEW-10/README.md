# PoC — NEW-10: Admin-tester identities still suppress audit logging

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_new05_new07_new10_misc.js`](../../../../research/trithuc5/poc/poc_new05_new07_new10_misc.js)  
**Cleanup:** `value-display only`

## Purpose

Demonstrate the measured NEW-10 behavior using only synthetic data: the helper still returns true for `isAdminTester` and `gv_test`, causing `logStudentActivity` to return null for those identities.

## Prerequisites

- Synthetic admin/tester, guest and ordinary user fixtures.
- Mock form dispatcher; no live POST.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Invoke activity logging for each identity fixture.
2. Inspect whether a form payload is generated.
3. Compare with the ordinary user control.

## Expected behavior

Every privileged or test action should produce an audit record with an explicit test tag.

## Observed behavior

Admin/tester and `gv_test` actions are dropped; public guests are now logged.

## Cleanup

Run `value-display only` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
