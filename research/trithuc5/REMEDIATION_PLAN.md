# Remediation plan — TRITHUC5.0 V4.8.0 (current live build)

Priority is ordered by security impact and implementation dependency. Items in Phase 0 are
containment actions; items later in the plan assume the earlier trust boundary exists.
No production code was changed during the assessment.

Build identity: SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`,
9,115,471 bytes, 34,599 lines. All line numbers below refer to that build; re-measure after
any redeploy. The test harnesses pin the hash and refuse to run on a changed source.

What V4.8.0 already fixed (verified by the ported suites): password / seal / backend token
blanked in `serializeCompactUser` (5546) and inbound seal/token ignored (5578); password-like
log detail masked (7364); sensitive storage keys excluded from `window.name` / cookie /
`sessionStorage` (2227) with `SameSite=Strict`; unsigned tombstone rejected (5714+); nonce
replay and 26-hour stale packets rejected (5713, 5714+); internal bus removed (5674); Gemini
key moved to `sessionStorage` (25287); `X-Frame-Options: DENY` and
`X-Content-Type-Options: nosniff` added; `isAdminTester` detector exemption removed (15869).
Those fixes must be preserved; the plan below closes what remains.

Post-patch acceptance is defined by `tests/secure_controls.js`. On V4.8.0 it reports 7 passes
and 2 expected failures (SC-07 unsigned user insertion, SC-09 cross-account signed packet).
After remediation all nine must pass and the command must exit 0. The vulnerability-mapping
assertions in `run_all.js`, `phase3_tests.js` and `phase4_tests.js` are already split into
FIX and residual assertions; residual cases must be inverted to secure assertions.

## Phase 0 — Contain public exposure (immediate)

1. **Stop publishing identity records.** Public ntfy/KV still carry compact user records
   (names, classes, Gmail, status) even though `p`, `seal` and `bkt` are blank. Authenticate
   ntfy/KV before publishing any user-derived snapshot. Preserve the verified blank-field
   behavior (`F-01-T13`, `P3-04`, `SC-08`).
2. **Stop copying activity logs to a third party.** `syncActivityLogToGoogleForm` (7339)
   still POSTs name, class, score and detail. The password sentinel is masked (IV-21/IV-22)
   but the channel remains. Remove the form sync or redact identity fields.
3. **Rotate exposed material.** Rotate bundle literals: admin user/password hashes
   (2052–2053), vault hash (2054), integrity salt `TRITHUC50_SEC_SALT_2026_V27` (4153), admin
   session salt `TRITHUC50_ADM_SALT_V27` (4166), cloud admin secret
   `THAYTRUNG_SECRET_2026_V436` (5542), backend ticket `SERVER_AUTH_2026` (15544), master seal
   `THAY_TRUNG_MASTER_SEAL_2026` (15821), vault boot token `TT50_V45_INTERNAL_BOOT_SEAL`
   (1968), exam chunk seeds (1496), KV app key, and user passwords that may have been in a
   published snapshot. Retire the old ntfy topics.
   - Acceptance: old values no longer authenticate or decrypt; new values exist only
     server-side.
4. **Make nonce mandatory.** The replay registry (5713) only runs when `data.nonce` is
   present; reject packets without a nonce and require a signed sequence number.
   - Acceptance: a nonce-less replay no longer passes `F-01-T06` residual assertion.

## Phase 1 — Retire the client-minted VIP seal (NEW-11) and authenticate every packet

5. **Never mint approval artifacts client-side.** `computeTeacherVipApprovalSealV44` (15816)
   uses `DEFAULT_VAULT_PASS_HASH_V45` (2054) and `THAY_TRUNG_MASTER_SEAL_2026` (15821).
   Forging offline defeats the whole anti-hack layer. The same applies to the `bkt44_` token
   inside `BackendVipAuthServiceV44` (15537).
   - Fix: seals, tokens and entitlements must be issued by a server the attacker cannot run
     code on. Remove the seal/token functions and all secret literals from the bundle.
   - Acceptance: `P4-03`/`P4-04`, `P4-16`, IV-01, IV-02b and IV-09 (offline reproduction and
     full chain with zero KV writes) fail after the change.
6. **Keep the boot fix.** The normalizer (3574–3642) strips VIP when a signed record has no
   seal. Verify no later path reintroduces a fallback that promotes local state into
   entitlement (signed-packet re-seal paths in `processIncomingCloudPacket`, 5714+).
   - Acceptance: `P4-14` and IV-10 remain green as secure assertions.
7. **Authenticate every cloud packet with a server-held key.** The current admin signature
   secret is a bundle literal (P4-20); a validly signed tombstone still deletes locally.
   Replace with server-issued signatures over a signed timestamp, mandatory nonce/sequence
   and a bounded replay cache; validate schema and reject unknown types.
   - Acceptance: `P4-19`, IV-29 and the signed-tombstone path become secure assertions;
     `SC-01`…`SC-06` and `SC-09` pass.
8. **Move ntfy/KV behind an authenticated proxy.** Topic names and app keys are identifiers,
   not secrets. Per-user authorization and write ACLs; no public cross-account reads.
   - Acceptance: `SC-09` passes; a packet for one account cannot mutate another.

## Phase 2 — Establish a real authorization boundary

9. **Introduce a server that owns identity and state.** Authentication, entitlement,
   device registration, user deletion and exam grading must be server decisions. The shipped
   client contains no same-origin API calls for any of these.
   - Acceptance: `F-02-T05` and `A-01-T01` can be inverted to assert the new API exists and
     rejects unsigned/self-asserted calls.
10. **Replace client-side admin auth.** `loginAdmin()` (31852) compares client-side hashes
    (2052–2053) and writes a session signature from a literal (4166). Replace with
    Argon2id/bcrypt hashes, constant-time checks, server-issued short-lived sessions in
    `HttpOnly; Secure; SameSite=Strict` cookies, server-side rate limiting and audit log.
    - Acceptance: `F-02-T01/T04` and `P4-11` (offline session-sig reproduction) fail after
      the change.
11. **Server-authoritative entitlement.** Remove `computeUserIntegritySig` as a security
    control; fetch VIP status and `maxDevices` from the authenticated server.
    - Acceptance: `F-03-T01/T02`, the F-03 PoC and the NEW-13 residual assertion fail after
      the change.
12. **Server-authoritative device registry.** Atomic device registration, out-of-band
    verification for new devices, server-held lock state. `setSimulatedDeviceSlot` (31202)
    is now gated by `requireAdminAuth`, but that gate is still client-side.
    - Acceptance: `F-05-T01/T02/T03/T04/T05` fail after the change.
13. **Remove answer keys from client payloads.** Delete `__ENC_GZ.exams` (1464), its PRNG-XOR
    seeds (1496) and the claim token (1968); grade on the server.
    - Acceptance: `F-04-T01` fails after the change (it currently decodes 15 exams / 330
      answers).
14. **Stop trusting storage events.** `setupCrossTabUserSync` (34455) now strips invalid VIP
    records but still replaces all other user fields from writable localStorage.
    - Acceptance: `A-04-T01` and `A-04-T02` fail after the change.

## Phase 3 — Hardening and correct classification

15. **Finish response headers.** CSP and narrow CORS are still missing; preserve the new
    `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
    - Acceptance: `A-03-T01` fails after the change.
16. **Proxy Gemini calls server-side** so provider keys are never in browser storage.
    - Acceptance: `A-02-T01` fails after the change.
17. **Close the admin-preview unlock-all backdoor (NEW-15 residual).** The flag is cleared
    without a session (4184–4187), but a forged session re-enables all three gates
    (`hasStudentVipAccess` 6860, `hasVerifiedPackageAccess` 6870,
    `verifyProtectedVipActionV44` 15801). Make the unlock a server-issued, scoped, time-limited
    grant.
    - Acceptance: the NEW-15 PoC chain and IV-16…IV-18 fail after the change.
18. **Remove the remaining privileged-identity bypasses (NEW-14/NEW-10).** `gv_test` still
    skips the detector (15869) and the runtime block still exempts the three privileged ids
    (4170); `isAdminExamAttempt` (13965) still suppresses audit logging for `isAdminTester` /
    `gv_test`. Tester exemptions must live server-side.
    - Acceptance: `P4-08`/`P4-09` residual assertions and IV-11/IV-13 fail after the change.
19. **Relabel anti-cheat as UX.** Keep `preventDefault`, watermark and blur, but remove
    security claims (F-06).

## Verification sequence

1. Run, against the current V4.8.0 source: `tests/run_all.js` (40/40), `tests/phase3_tests.js`
   (8/8), `tests/phase4_tests.js` (20/20), `tests/poc_suite_validation.js` (51/51),
   `tests/independent_verification.js` (36/36), `tests/secure_controls.js` (7 pass, 2 expected
   failures). Current logs are in `evidence/`.
2. Apply a phase, rebuild, rerun: the tests mapped to that phase must fail, proving the old
   behavior is gone.
3. Update each test to assert the new secure behavior, then rerun to green.
4. Re-measure the source hash and line references after every deploy; the harness will
   refuse to run on a changed source until `EXPECTED_SHA` is deliberately updated.
5. Repeat the full suite in a dedicated staging deployment owned by the project before
   production rollout. No test in this repository contacts production.

## Dependency summary

```
Phase 0 (contain identity exposure + rotate literals)
        |
        v
Phase 1 (retire client-minted seals + server-authenticated packets)
        |
        v
Phase 2 (server identity / entitlement / devices / answers / storage)
        |
        v
Phase 3 (headers, key proxy, NEW-15/NEW-14 closures, honest anti-cheat labeling)
```
