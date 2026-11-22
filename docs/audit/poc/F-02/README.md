# PoC — F-02: Admin authentication and session signing are client-side

**Type:** ACTION  
**Build:** V4.8.0 / SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`  
**Canonical script:** [`research/trithuc5/poc/poc_f02_admin_login.js`](../../../../research/trithuc5/poc/poc_f02_admin_login.js)  
**Cleanup:** `__AERO_F02_RESTORE__()`

## Purpose

Demonstrate the measured F-02 behavior using only synthetic data: login compares bundle-literal hashes and writes a session signature computed from another bundle literal.

## Prerequisites

- Pinned V4.8.0 source.
- Own browser origin and synthetic admin fixture.
- No real credential is used or stored in this report.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Inspect the client hash comparison path.
2. Reproduce the admin session signature from bundle data.
3. Set the session in local storage and invoke remembered-session restore.
4. Confirm admin-gated UI functions become reachable, then restore state.

## Expected behavior

Admin login must require a server-authenticated credential and a server-issued session that the client cannot mint.

## Observed behavior

A locally computed signature restores admin state and passes the client's own checks.

## Cleanup

Run `__AERO_F02_RESTORE__()` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
