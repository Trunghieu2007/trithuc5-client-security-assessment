# PoC — F-01: Cloud sync publishes identity records; signed tombstone path remains offline-forgeable

**Type:** DISPLAY  
**Build:** V5.4.6 / SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`  
**Canonical script:** [`research/trithuc5/poc/poc_f01_student_data.js`](../../../../research/trithuc5/poc/poc_f01_student_data.js)  
**Cleanup:** `n/a (read-only)`

## Purpose

Demonstrate the measured F-01 behavior using only synthetic data: compact user records are broadcast to public channels.

## Prerequisites

- Pinned V5.4.6 source.
- Mock ntfy/KV transport in the isolated VM; no live channel write.
- Synthetic user and packet fixtures.

## Environment and test data

Use the local VM harness or a dedicated browser profile on the tester's own origin. All data is synthetic. No real account, credential, token or production packet is used.

## Steps

1. Run the DISPLAY PoC against the local fixture and inspect the compact record.
2. Confirm sensitive fields are blank and identity fields remain.
3. Replay the tombstone cases: unsigned rejected, offline-signed accepted.
4. Verify no packet was sent to a production channel.

## Expected behavior

No student identity field should be visible to anonymous channel readers. Only a server-authorized writer should be able to tombstone or restore a record.

## Observed behavior

Identity fields remain in the compact wire format. Unsigned tombstones are rejected, but a signature computed from the bundle literal is accepted and merges locally.

## Cleanup

Run `n/a (read-only)` if the canonical PoC is an ACTION PoC. DISPLAY and regression-only PoCs make no durable local change.

## Safety

- No production write, no ntfy/KV publish, no real login, no third-party form submission.
- No automatic expansion beyond the documented verification.
- No secret or personal data in this folder.

## Evidence

See `expected.txt`, `observed.txt`, and the sanitized suite logs in `../../evidence/README.md`.
