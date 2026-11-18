# Remediation plan — TRITHUC5.0 V4.4 (post-patch build)

Priority is ordered by security impact and implementation dependency. Items in Phase 0 are
containment actions; items later in the plan assume the earlier trust boundary exists.
No production code was changed during the assessment.

Build identity: SHA-256 `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`,
20,224 lines. All line numbers below refer to that build; re-measure after any redeploy.
The test harnesses pin the hash and refuse to run on a changed source.

What V4.4 already fixed (verified by the ported suites): admin sessions without `sig` are
rejected (line 2758); cloud packets claiming `fromAdmin` without a valid `adminSig` are
rejected outright (3538–3543); unsigned packets are downgraded to pending/non-VIP
(3637–3653); the per-user KV record exceeds the 450-char cap so its write is skipped
(3737–3815). Those fixes must be preserved; the plan below closes what remains.

Post-patch acceptance is defined by `tests/secure_controls.js`. On the V4.4 build it reports
3 passes and 6 expected failures (the two signature controls now pass). After remediation
all nine must pass and the command must exit 0. `tests/run_all.js`, `tests/phase3_tests.js`
and `tests/phase4_tests.js` must be updated so their former vulnerability assertions become
secure assertions.

## Phase 0 — Contain public exposure (immediate)

1. **Stop publishing and logging passwords.** Remove the password field from
   `serializeCompactUser` (line ~3391), remove the registration password from the activity
   log / captured Google Form payload, and stop writing user-bearing snapshots to public
   ntfy/KV until authentication exists. This covers NEW-01, NEW-08 and the per-user KV path
   (P3-04; the cap skip is not a fix — the data still reaches the public snapshot chunks).
   - Acceptance: `SC-08`, `P3-01` and `P3-04` fail after the change; no password appears in
     serialized users, KV records, activity logs, captured form payloads, or
     `window.__GFORM_SENT_LOG__`.
2. **Stop mirroring security state into weak stores.** Remove `window.name` and cookie
   writes from `safeStorageSet` (lines 1562–1594) for session, credential, and device keys;
   use `HttpOnly; Secure; SameSite=Strict` cookies issued by the server for sessions.
   - Acceptance: `P3-02` fails after the change.
3. **Rotate exposed material.** Rotate the admin credential (`THAYTRUNG2026`, line 1786),
   both session/integrity salts (`TRITHUC50_SEC_SALT_2026_V27` line 3170,
   `TRITHUC50_ADM_SALT_V27` line 3183), the cloud packet secret
   (`THAYTRUNG_SECRET_2026_V436` line 3363), the KV app key, and all user passwords that may
   have been in a published snapshot. Retire the old ntfy topics.
   - Acceptance: old values no longer authenticate or decrypt; new values exist only
     server-side.
4. **Remove the global cloud bus bridge** from the production bundle (lines 3493–3500).
   - Acceptance: `F-01-T14` fails after the change. This is defense-in-depth; it is not a
     standalone release blocker.

## Phase 1 — Retire the client-minted VIP seal (NEW-11/NEW-12) and authenticate every packet

5. **Never mint approval artifacts client-side.** The V4.4 seal
   (`computeTeacherVipApprovalSealV44`, line ~10654) is computed in the browser from
   bundle-literal secrets (`THAY_TRUNG_MASTER_SEAL_2026` line 10654,
   `TRITHUC50_ADM_SALT_V27` line 3183). Anyone can compute a valid seal offline — this is
   NEW-11/NEW-12 (Critical) and defeats the whole V4.4 layer.
   - Fix: seals and entitlements must be issued by a server the attacker cannot run code
     on. Remove the seal function and both secret literals from the bundle.
   - Acceptance: `P4-03`/`P4-04` (offline seal reproduction and forged-seal access) fail
     after the change; no seal material exists in the delivered JS.
6. **Remove the boot auto-seal path (NEW-13).** The boot normalizer (lines 2605–2668,
   specifically 2663–2666) mints a seal for any user whose record carries a valid `_sig`
   and VIP flags without a seal. Even with the seal function removed, keep no fallback that
   promotes local state into entitlement.
   - Acceptance: `P4-14` fails after the change.
7. **Authenticate every cloud packet.** V4.4's admin check (3538–3543) is a start, but the
   signature secret is a bundle literal (P4-20) and unsigned tombstones still merge
   without an admin check (3587–3614, F-01 residual). Replace with server-issued
   signatures over a signed timestamp, nonce/sequence and a bounded replay cache; validate
   schema and reject unknown types.
   - Acceptance: `F-01-T12`/`P4-19` (unsigned tombstone merge) fail after the change;
     `SC-01`…`SC-06` pass; `F-01-T03` still passes for a genuinely signed packet.
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
10. **Replace client-side admin auth.** The vault (`BackendVipAuthServiceV44`, 10378–10631)
    is an in-client closure `Map` (NEW-14, P4-13) and the admin login path (18115–18152)
    verifies a signature computed from bundle literals. Replace with Argon2id/bcrypt
    password hashes, constant-time checks, server-issued short-lived sessions in
    `HttpOnly; Secure; SameSite=Strict` cookies, server-side rate limiting and audit log.
    - Acceptance: `F-02-T01/T04` and `P4-11` (offline session-sig reproduction) fail after
      the change; `SC-01` still passes and the server rejects forged sessions
      independently of the browser.
11. **Server-authoritative entitlement.** Remove `computeUserIntegritySig` as a security
    control; fetch VIP status and `maxDevices` from the authenticated server.
    - Acceptance: `F-03-T01/T02` and the F-03 PoC fail after the change; client tampering
      has no server effect.
12. **Server-authoritative device registry.** Atomic device registration, out-of-band
    verification for new devices, server-held lock state. Remove `setSimulatedDeviceSlot`
    from production.
    - Acceptance: `F-05-T01/T02/T03/T04/T05` fail after the change.
13. **Remove answer keys from client payloads.** Delete `correctAnswers` from
    `__INITIAL_EXAMS_DATA__` and the generator. Grade on the server.
    - Acceptance: `F-04-T01/T03` fail after the change; no answer entries in client payload.
14. **Stop trusting storage events.** Validate schema and authenticate state before
    replacing `state.users` (cross-tab sync, ~20165–20190; see `poc_new05_new07_new10_misc.js`).
    - Acceptance: `A-04-T01` and `A-04-T02` fail after the change.

## Phase 3 — Hardening and correct classification

15. **Add response headers.** CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options:
    nosniff`, and narrow CORS instead of `*`.
    - Acceptance: `A-03-T01` fails after the change.
16. **Proxy Gemini calls server-side** so provider keys are never in browser storage.
    - Acceptance: `A-02-T01` fails after the change.
17. **Close the admin-preview unlock-all backdoor (NEW-15).** The admin preview path
    short-circuits three access gates (lines 4121, 10566, 10635); any forged admin session
    (see item 10) can unlock all locked content via `toggleAdminPreviewUnlockAll`. If the
    preview feature is kept, the unlock must be a server-issued, scoped, time-limited grant.
    - Acceptance: the NEW-15 PoC chain fails after the change.
18. **Remove the privileged-identity bypass (NEW-14/NEW-10).** `gv_test` / `isAdminTester` ids
    skip the anti-hack detector and the runtime integrity check entirely (P4-08/P4-09), and
    the same mutable flag suppresses audit logging. Tester exemptions must live server-side,
    not in client id checks.
    - Acceptance: `P4-08`/`P4-09` fail after the change.
19. **Relabel anti-cheat as UX.** Keep `preventDefault`, watermark and blur, but remove
    security claims (F-06). Add server-side timing/submission checks only if exam integrity
    is a product requirement.
    - Acceptance: `F-06-T01` remains as documentation of UX controls; no security blocker
      depends on them.

## Verification sequence

1. Run, against the current V4.4 source: `tests/run_all.js` (40/40),
   `tests/phase3_tests.js` (8/8), `tests/phase4_tests.js` (20/20),
   `tests/poc_suite_validation.js` (51/51), `tests/secure_controls.js` (3 pass, 6 expected
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
