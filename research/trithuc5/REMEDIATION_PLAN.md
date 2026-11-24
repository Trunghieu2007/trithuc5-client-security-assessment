# Remediation plan — TRITHUC5.0 V5.4.6 (current live build)

Priority is ordered by security impact and implementation dependency. Phase 0 contains public exposure; later phases assume the earlier trust boundary exists. No production code was changed during the assessment.

Build identity: SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`, 2,777,970 bytes, 39,205 lines. All line numbers below refer to that build; re-measure after any redeploy. Harnesses pin the hash and refuse to run on a changed source.

## Already fixed / disabled (keep as regressions)

- Admin login is server-side via `/api/admin/login` (31907–31959); client hash literals are empty (2052–2055); session salt is per-window (4166–4170); remembered session cleared at boot (34604–34618). **F-02 fixed.**
- Admin preview no longer bypasses gates without a server-verified session (4185–4195). **NEW-15 fixed.**
- Public keyvalue.immanuel.co writes are disabled (4301).
- Exam answers/questions are server-only; grading via `/api/exams/submit`. **F-04 fixed.**
- Google Form dispatch is disabled (`return false` in `dispatchParamsToGoogleFormUrl`). **NEW-08 fixed.**
- Password, seal and backend token are blank in compact wire format (5601); unsigned tombstones rejected (5769+); nonce/age guards present (5768); internal cloud bus removed; weak-store mirroring fixed; boot auto-seal fixed; password-like log detail masked.

Preserve `F-02-T01/T05`, `P4-11`, `P4-10`, `IV-16`…`IV-20`, `P3-02`, `P3-04`, `F-01-T12/T13/T16`, `P4-14`, `P4-19`, `IV-10`, `IV-24/IV-29` as green secure assertions.

Post-patch acceptance is defined by `tests/secure_controls.js`. On V5.4.6 it reports 7 passes and 2 expected failures (SC-07 unsigned user insertion, SC-09 cross-account signed packet). After remediation all nine must pass and the command must exit 0.

## Phase 0 — Contain public exposure (immediate)

1. **Authenticate `GET /api/results` (NEW-17).** The endpoint (4814–4819) currently returns records without an auth header. Require authentication and row-level authorization; return only the caller's own records or an admin-scoped aggregate with a separate role. Remove direct identifiers from list responses and bound response size.
   - Acceptance: anonymous GET returns 401/403 or zero records; a student sees only their own records; no response includes another student's name, class, school or score.
   - Separately authorize-test `POST /api/results` (4692–4698) in a staging deployment; its trust model is UNVERIFIED here because no write was sent.
2. **Stop publishing identity records to public ntfy topics.** `broadcastTeacherUsersToCloud` and related publishers still emit names, classes, Gmail and status. Authenticate the channel and minimize snapshots to opaque IDs.
   - Acceptance: a new snapshot test asserts no name/class/Gmail/status on the wire; `F-01-T13`, `P3-04`, `SC-08` stay green.
3. **Stop copying activity logs to a third party.** `syncActivityLogToGoogleForm` (7394) still POSTs name, class, score and detail. Remove the form sync or replace with a first-party authenticated endpoint; preserve masking (`IV-21/IV-22`).
4. **Rotate exposed material still in the bundle.** Integrity salt `TRITHUC50_SEC_SALT_2026_V27` (4151), cloud admin secret `THAYTRUNG_SECRET_2026_V436` (5589), backend ticket `SERVER_AUTH_2026` (~15592), master seal `THAY_TRUNG_MASTER_SEAL_2026` (15876), vault boot token `TT50_V45_INTERNAL_BOOT_SEAL` (1967), exam chunk seeds (1496), KV app key, ntfy topic names and any password that may have appeared in an older snapshot. Old admin password hashes are already gone; do not reintroduce them.
   - Acceptance: old values no longer authenticate or decrypt; new secrets exist only server-side.
5. **Make the packet nonce mandatory.** The replay registry (5768) only runs when `data.nonce` is present; require a signed nonce/sequence and reject nonce-less packets.
   - Acceptance: a nonce-less replay no longer passes the residual assertion behind `F-01-T06/T07`.

## Phase 1 — Retire client-minted entitlement and authenticate packets

6. **Never mint approval artifacts client-side.** `computeTeacherVipApprovalSealV44` (15871) still uses a master-seal literal; `BackendVipAuthServiceV44` (15592) still mints `bkt44_` tokens. Seals, tokens and entitlements must be issued by a server the applicant cannot execute code on.
   - Acceptance: `P4-04`, `P4-16`, `IV-02b` and `IV-09` are inverted to secure assertions.
7. **Keep the boot fix.** The normalizer (3575–3643) strips VIP when a signed record has no seal. Verify no later path reintroduces a fallback that promotes local state into entitlement.
   - Acceptance: `P4-14` and `IV-10` remain green.
8. **Authenticate every cloud packet with a server-held key.** The admin signature still uses a bundle literal; a locally signed tombstone still deletes. Replace with server-issued signatures over signed timestamps, mandatory nonce/sequence and a bounded replay cache; validate schema and reject unknown types.
   - Acceptance: `P4-19`, `IV-29`, `IV-32` and `SC-09` become secure assertions; `SC-01`…`SC-06` pass.
9. **Move ntfy behind an authenticated proxy.** Topic names are identifiers, not secrets. Per-user read/write ACLs; no public cross-account reads.
   - Acceptance: `SC-09` passes; a packet for one account cannot mutate another.

## Phase 2 — Establish a real authorization boundary

10. **Server-authoritative entitlement.** Remove `computeUserIntegritySig` as a security control; fetch VIP/package status from the authenticated server on every sensitive action and treat any client cache as untrusted.
    - Acceptance: `F-03-T01/T02`, the F-03 PoC, `P4-16` and `IV-05/IV-06/IV-09` are inverted.
11. **Server-authoritative device registry.** Atomic registration, out-of-band verification for new devices, server-held lock state. `setSimulatedDeviceSlot` (31257) is client-gated only.
    - Acceptance: `F-05-T01`…`T05` are inverted.
12. **Remove answer keys from client payloads.** Delete `__ENC_GZ.exams` (1464), its PRNG-XOR seeds (1496) and the claim token (1967); grade on the server.
    - Acceptance: `F-04-T01` can no longer decode 15 exams / 330 answers.
13. **Stop trusting storage events.** `setupCrossTabUserSync` (34517) strips invalid VIP records but replaces all other user fields from writable localStorage.
    - Acceptance: `A-04-T01/T02` are inverted while VIP stripping remains.
14. **Remove privileged-identity exemptions (NEW-14/NEW-10).** `gv_test` still skips the detector (15924); the runtime block exempts three ids (4172); `isAdminExamAttempt` (14020) still suppresses audit logging for `isAdminTester` / `gv_test`.
    - Acceptance: `P4-08/P4-09`, `IV-11`, `IV-13`, `IV-15`, `IV-23` are inverted.

## Phase 3 — Hardening and correct classification

15. **Finish response headers.** Add a nonce/hash-based CSP and replace wildcard CORS with an explicit allowlist; preserve XFO, nosniff, Referrer-Policy and Permissions-Policy.
    - Acceptance: `A-03-T01` is inverted.
16. **Proxy Gemini calls server-side** so provider keys are never in browser storage.
    - Acceptance: `A-02-T01` is inverted.
17. **Close nonce-less packet injection (NEW-02).** Ignore unsigned local `BroadcastChannel` packets or require server verification before mutation.
    - Acceptance: the NEW-02 PoC can no longer insert a pending user.
18. **Relabel anti-cheat as UX.** Keep `preventDefault`, watermark and blur, but enforce attempt/time/grading server-side (F-06).

## Verification sequence

1. Run against the current V5.4.6 source: `tests/run_all.js` (41/41), `tests/phase3_tests.js` (8/8), `tests/phase4_tests.js` (20/20), `tests/poc_suite_validation.js` (79/79), `tests/independent_verification.js` (36/36), `tests/secure_controls.js` (7 pass, 2 expected failures). Current logs are in `evidence/`.
2. Apply a phase, rebuild, rerun: the tests mapped to that phase must fail, proving the old behavior is gone.
3. Update each test to assert the new secure behavior, then rerun to green.
4. Re-measure the source hash and line references after every deploy; harnesses refuse to run until `EXPECTED_SHA` is deliberately updated.
5. Repeat the full suite in a dedicated staging deployment before production rollout. No test in this repository writes to production.

## Dependency summary

```
Phase 0: /api/results auth -> public channel containment -> third-party logging removal -> secret rotation
        |
Phase 1: server-issued entitlement/packet signatures -> authenticated cloud proxy
        |
Phase 2: server-authoritative identity/device/grading/storage-event validation
        |
Phase 3: CSP/CORS/proxy keys/UX-only anti-cheat
```
