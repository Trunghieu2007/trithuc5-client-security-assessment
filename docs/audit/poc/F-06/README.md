# PoC — F-06: Anti-cheat controls are UX-only

**Type:** ACTION  
**Build:** V4.8.0 / SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`  
**Canonical script:** [`research/trithuc5/poc/poc_f06_anticheat.js`](../../../../research/trithuc5/poc/poc_f06_anticheat.js)  
**Cleanup:** `__AERO_F06_STOP__()`

## Purpose

Demonstrate the measured F-06 behavior using only synthetic data: handlers are registered in closure scope and rely on default browser behavior.

## Prerequisites

- Own browser, test page, synthetic exam state.
- No real exam or grade involved.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Apply the document-start neutraliser before app scripts register handlers.
2. Observe that blur/overlay and copy-block handlers do not engage.
3. Stop the neutraliser with the documented function.

## Expected behavior

Exam restrictions should be server-enforced and not depend on client event handlers.

## Observed behavior

Client-side anti-cheat can be neutralised locally while the app still renders content.

## Cleanup

Run `__AERO_F06_STOP__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
