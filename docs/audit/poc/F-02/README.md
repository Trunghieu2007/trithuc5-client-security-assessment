# PoC — F-02: Admin authentication is delegated to a server session

**Type:** DISPLAY  
**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Canonical script:** [`research/trithuc5/poc/poc_f02_admin_login.js`](../../../../research/trithuc5/poc/poc_f02_admin_login.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured F-02 behavior using only synthetic data: v4.

## Prerequisites

- Pinned V4.8.6 source.
- No real admin credential is used or stored in this report.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Write a synthetic remembered admin session with a signature computed in the same VM.
2. Invoke the extracted restore block and observe the transient login state.
3. Run the runtime integrity gate without the server-verified flag and observe logout.
4. Confirm the source contains the server API, empty hash literals and ephemeral salt.

## Expected behavior

Admin login must require a server-authenticated credential and a server-issued session that the client cannot mint.

## Observed behavior

The locally forged session does not survive the runtime gate; admin login requires the server API, and the old bundle salt and password hash are absent.

## Cleanup

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
