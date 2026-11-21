# Remediation plan — TRITHUC5.0 V4.5 / V4.6.3 (current live build)

Priority is ordered by security impact and implementation dependency. Items in Phase 0 are
containment actions; items later in the plan assume the earlier trust boundary exists.
No production code was changed during the assessment.

Build identity: SHA-256 `eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f`,
9,015,050 bytes, 32,900 lines. All line numbers below refer to that build; re-measure after
any redeploy. The test harnesses pin the hash and refuse to run on a changed source.

What V4.5 already fixed (verified by the ported suites): unsealed VIP records are stripped at
boot (3612–3619); admin remember-me writes only username (30417, 3714); the global cloud bus
was replaced by an internal closure bus (4471–4477); admin sessions without `sig` are rejected
(3718–3730); packets claiming `fromAdmin` without a valid `adminSig` are rejected outright
(4521–4526); unsigned packets are downgraded to pending/non-VIP (4633–4649); the per-user KV
record exceeds the 450-char cap so its write is skipped. Those fixes must be preserved; the
plan below closes what remains.

Post-patch acceptance is defined by `tests/secure_controls.js`. On the V4.5 build it reports
3 passes and 6 expected failures. After remediation all nine must pass and the command must
exit 0. The mapped vulnerability assertions in `tests/run_all.js`, `tests/phase3_tests.js`
and `tests/phase4_tests.js` must be inverted to secure assertions.

## Phase 0 — Contain public exposure (immediate)

1. **Stop publishing and logging passwords.** Remove field `p` from
   `serializeCompactUser` (line 4351), remove the registration password from the activity
   log / captured Google Form payload, and stop writing user-bearing snapshots to public
   ntfy/KV until authentication exists. This covers NEW-01, NEW-08 and the per-user KV path
   (P3-04; the cap skip is not a fix — the data still reaches the public snapshot chunks).
   Student remember-me still persists a plaintext password (`REMEMBERED_STUDENT_CREDS`,
   lines 29655/29731/29765) — remove it too.
   - Acceptance: `SC-08`, `P3-01` and `P3-04` fail after the change; no password appears in
     serialized users, KV records, activity logs, captured form payloads,
     `window.__GFORM_SENT_LOG__`, or remembered credentials. `IV-21`/`IV-22` (sentinel in
     form `detail` and POST pairs) must fail. `P3-08` must become a secure assertion.
2. **Stop mirroring security state into weak stores.** Remove `window.name` and cookie
   writes from `safeStorageSet` (line 2227, helpers 2195/2203) for session, credential, and
   device keys; use `HttpOnly; Secure; SameSite=Strict` cookies issued by the server for
   sessions.
   - Acceptance: `P3-02` and `IV-24` (user table mirrored to all four stores) fail after the
     change. Exact observed thresholds: `window.name` < 3500 chars, cookie < 1800 chars.
3. **Rotate exposed material.** Rotate the bundle literals: admin user/password hashes
   (`DEFAULT_ADMIN_USER_HASHES_V45` / `DEFAULT_ADMIN_PASS_HASH_V45`, lines 2052–2053), vault
   hash (`DEFAULT_VAULT_PASS_HASH_V45`, 2054), integrity salt
   (`TRITHUC50_SEC_SALT_2026_V27`, 4132), admin session salt (`TRITHUC50_ADM_SALT_V27`,
   4145), cloud packet secret (`THAYTRUNG_SECRET_2026_V436`, 4341), backend ticket literal
   (`SERVER_AUTH_2026`, 14201), master seal (`THAY_TRUNG_MASTER_SEAL_2026`, 14478), the
   vault boot token (`TT50_V45_INTERNAL_BOOT_SEAL`, 1968/25698), exam chunk seeds
   (line 1496), the KV app key, and all user passwords that may have been in a published
   snapshot. Retire the old ntfy topics.
   - Acceptance: old values no longer authenticate or decrypt; new values exist only
     server-side.
4. **Remove the internal cloud bus bridge** from the production bundle (`__INTERNAL_CLOUD_BUS_V45__`,
   lines 4471–4477), not just the old `window` global.
   - Acceptance: `F-01-T14` fails after the change. Defense-in-depth, not a standalone
     release blocker.

## Phase 1 — Retire the client-minted VIP seal (NEW-11) and authenticate every packet

5. **Never mint approval artifacts client-side.** The V4.5 seal
   (`computeTeacherVipApprovalSealV44`, line 14473) is computed in the browser from
   `DEFAULT_VAULT_PASS_HASH_V45` (2054) and `THAY_TRUNG_MASTER_SEAL_2026` (14478).
   Anyone can compute a valid seal offline — this is NEW-11 (Critical) and defeats the whole
   anti-hack layer. The same applies to the in-client `bkt44_` token (14198–14202).
   - Fix: seals, tokens and entitlements must be issued by a server the attacker cannot run
     code on. Remove the seal/token functions and all secret literals from the bundle.
   - Acceptance: `P4-03`/`P4-04`, `P4-16` and the independent checks `IV-01`, `IV-02b`,
     `IV-09` (offline reproduction and the full chain with zero KV writes) fail after the
     change; no seal or ticket material exists in the delivered JS.
6. **Keep the V4.5 boot fix.** The normalizer (3553–3621, specifically 3612–3619) now strips
   VIP when a signed record has no seal. Verify no later path reintroduces a fallback that
   promotes local state into entitlement (in particular `registerVerifiedUserRecord`, 14277,
   and the signed-packet re-seal paths 4652–4654 / 4674–4675 / 4693–4695).
   - Acceptance: `P4-14` and `IV-02` remain green as secure assertions (no seal minted from
     `_sig` alone).
7. **Authenticate every cloud packet.** V4.5's admin check (4521–4526) is a start, but the
   signature secret is a bundle literal (P4-20) and unsigned tombstones still merge
   without an admin check (4583–4613, F-01 residual). Replace with server-issued
   signatures over a signed timestamp, nonce/sequence and a bounded replay cache; validate
   schema and reject unknown types.
   - Acceptance: `F-01-T12`/`P4-19`/`IV-29` (unsigned tombstone merge) fail after the
     change; `IV-27` (forged admin rejection) and `IV-28` (signed tombstone) become secure
     assertions; `SC-01`…`SC-06` pass.
8. **Move ntfy/KV behind an authenticated proxy.** Topic names and app keys are
   identifiers, not secrets. Per-user authorization and write ACLs; no public cross-account
   reads.
   - Acceptance: `F-01-T11` fails as written; `SC-09` passes; a packet for one account
     cannot mutate another.

## Phase 2 — Establish a real authorization boundary

9. **Introduce a server that owns identity and state.** Authentication, entitlement,
   device registration, user deletion, and exam grading must be server decisions. The
   shipped client contains no same-origin API calls for any of these.
   - Acceptance: `F-02-T05` and `A-01-T01` can be inverted to assert the new API exists and
     rejects unsigned/self-asserted calls.
10. **Replace client-side admin auth.** The vault (`BackendVipAuthServiceV44`, 14194–14455)
    is an in-client closure `Map` (P4-13) and admin login (30401–30419) compares client-side
    hashes against bundle literals, then writes a session signature computed from another
    literal. Replace with Argon2id/bcrypt password hashes, constant-time checks,
    server-issued short-lived sessions in `HttpOnly; Secure; SameSite=Strict` cookies,
    server-side rate limiting and audit log.
    - Acceptance: `F-02-T01/T04` and `P4-11` (offline session-sig reproduction) fail after
      the change; `SC-01` still passes and the server rejects forged sessions independently
      of the browser.
11. **Server-authoritative entitlement.** Remove `computeUserIntegritySig` (4129) as a
    security control; fetch VIP status and `maxDevices` from the authenticated server.
    - Acceptance: `F-03-T01/T02` and the F-03 PoC fail after the change; client tampering
      has no server effect.
12. **Server-authoritative device registry.** Atomic device registration, out-of-band
    verification for new devices, server-held lock state. Remove `setSimulatedDeviceSlot`
    from production.
    - Acceptance: `F-05-T01/T02/T03/T04/T05` fail after the change.
13. **Remove answer keys from client payloads.** Delete `__ENC_GZ.exams` (line 1464), its
    PRNG-XOR seeds (1496) and the claim token (1968/25698); grade on the server. Hiding
    answers behind a bundle-seeded gzip vault is obfuscation, not protection.
    - Acceptance: `F-04-T01` fails after the change (it currently decodes 15 exams / 330
      answers); no answer entries in client payload.
14. **Stop trusting storage events.** Validate schema and authenticate state before
    replacing `state.users` (`setupCrossTabUserSync`, line 32819; see
    `poc_new05_new07_new10_misc.js`).
    - Acceptance: `A-04-T01` and `A-04-T02` fail after the change.

## Phase 3 — Hardening and correct classification

15. **Add response headers.** CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options:
    nosniff`, and narrow CORS instead of `*`.
    - Acceptance: `A-03-T01` fails after the change.
16. **Proxy Gemini calls server-side** so provider keys are never in browser storage.
    - Acceptance: `A-02-T01` fails after the change.
17. **Close the admin-preview unlock-all backdoor (NEW-15).** The admin preview path
    short-circuits three access gates (lines 5591, 14382, 14459); any forged admin session
    (see item 10) can unlock all locked content via `toggleAdminPreviewUnlockAll`. If the
    preview feature is kept, the unlock must be a server-issued, scoped, time-limited grant.
    - Acceptance: the NEW-15 PoC chain and `IV-16`/`IV-17`/`IV-18` (true from all three
      gates for a pending junk student) fail after the change.
18. **Remove the privileged-identity bypass (NEW-14/NEW-10).** `gv_test` / `isAdminTester`
    ids skip the anti-hack detector (14528) and the runtime integrity check (4164) entirely,
    and the same mutable flag suppresses audit logging (`isAdminExamAttempt`, 12623).
    Tester exemptions must live server-side, not in client id checks. Independent controls
    also confirmed that `stu_free_12b1` / `stu_practice_e` remain forced non-VIP at the
    protected-action gate (14463–14464; IV-11…IV-15).
    - Acceptance: `P4-08`/`P4-09` and `IV-11`/`IV-13` fail after the change.
19. **Relabel anti-cheat as UX.** Keep `preventDefault`, watermark and blur, but remove
    security claims (F-06). Add server-side timing/submission checks only if exam integrity
    is a product requirement.
    - Acceptance: `F-06-T01` remains as documentation of UX controls; no security blocker
      depends on them.

## Verification sequence

1. Run, against the current V4.5 source: `tests/run_all.js` (40/40),
   `tests/phase3_tests.js` (8/8), `tests/phase4_tests.js` (20/20),
   `tests/poc_suite_validation.js` (51/51),
   `tests/independent_verification.js` (36/36), `tests/secure_controls.js` (3 pass, 6 expected
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
Phase 0 (contain secrets)
        |
        v
Phase 1 (retire client-minted seals + signed/authenticated packets)
        |
        v
Phase 2 (server identity / entitlement / devices / answers / storage)
        |
        v
Phase 3 (headers, key proxy, NEW-15/NEW-16 closures, honest anti-cheat labeling)
```
