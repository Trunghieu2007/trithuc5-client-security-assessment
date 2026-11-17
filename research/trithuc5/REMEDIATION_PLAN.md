# Remediation plan — TRITHUC5.0 V4.3.9

Priority is ordered by security impact and implementation dependency. Items in Phase 0 are
containment actions; items later in the plan assume the earlier trust boundary exists.
No production code was changed during the assessment.

Post-patch acceptance is defined by `tests/secure_controls.js`. On the current build it reports
1 pass and 8 expected failures; after remediation all nine must pass and the command must exit 0.
The vulnerability-reproduction suite `tests/run_all.js` must then be updated so its former
vulnerability assertions become secure assertions.

## Phase 0 — Contain public exposure (immediate)

1. **Stop publishing passwords in snapshots.** Remove the password field from
   `serializeCompactUser` (line 2991). Stop writing user-bearing snapshots to public ntfy/KV
   until authentication exists.
   - Acceptance: `SC-08` passes after the change; serialized users contain no password field.
2. **Rotate exposed material.** Rotate the admin credential, both session/integrity salts,
   the cloud packet secret, the KV app key, and all user passwords that may have been in a
   published snapshot. Retire the old ntfy topics.
   - Acceptance: old values no longer authenticate or decrypt; new values exist only server-side.
3. **Remove the global cloud bus bridge** from the production bundle (lines 3088–3093).
   - Acceptance: `F-01-T14` fails after the change. This is defense-in-depth; it is not a
     standalone release blocker.

## Phase 1 — Establish a real authorization boundary

4. **Introduce a server that owns identity and state.** Authentication, entitlement,
   device registration, user deletion, and exam grading must be server decisions. The shipped
   client currently contains no same-origin API calls for any of these.
   - Acceptance: `F-02-T05` and `A-01-T01` can be inverted to assert the new API exists and
     rejects unsigned/self-asserted calls.
5. **Replace client-side admin auth.** Argon2id/bcrypt password hashes, constant-time checks,
   server-issued short-lived sessions in `HttpOnly; Secure; SameSite=Strict` cookies,
   server-side rate limiting and audit log.
   - Acceptance: `F-02-T01/T02/T04` fail after the change; `SC-01` still passes and the server
     rejects forged and missing-signature sessions independently of the browser.
6. **Authenticate every cloud packet.** Server-issued signature verified before *any* state
   mutation, including tombstones. Remove `!data.adminSig` at line 3145. Add signed timestamp,
   nonce/sequence, and a bounded replay cache. Validate schema and reject unknown types.
   - Acceptance: `F-01-T01/T02/T04/T05/T07/T10/T11/T15` fail after the change; `SC-01` …
     `SC-06` pass; `F-01-T03` still passes for a genuinely signed packet.
7. **Move ntfy/KV behind an authenticated proxy.** Topic names and app keys are identifiers,
   not secrets. Per-user authorization and write ACLs; no public cross-account reads.
   - Acceptance: `F-01-T11` fails as written; `SC-09` passes; a packet for one account cannot
     mutate another.

## Phase 2 — Remove client-trusted security decisions

8. **Server-authoritative entitlement.** Remove `computeUserIntegritySig` as a security
   control; fetch VIP status and `maxDevices` from the authenticated server.
   - Acceptance: `F-03-T01/T02` fail after the change; client tampering has no server effect.
9. **Server-authoritative device registry.** Atomic device registration, out-of-band
   verification for new devices, server-held lock state. Remove `setSimulatedDeviceSlot`
   from production.
   - Acceptance: `F-05-T01/T02/T03/T04/T05` fail after the change.
10. **Remove answer keys from client payloads.** Delete `correctAnswers` from
    `__INITIAL_EXAMS_DATA__` and the generator at lines 1098/1267. Grade on the server.
    - Acceptance: `F-04-T01/T03` fail after the change; no answer entries in client payload.
11. **Stop trusting storage events.** Validate schema and authenticate state before replacing
    `state.users` at lines 15861–15877.
    - Acceptance: `A-04-T01` and `A-04-T02` fail after the change.

## Phase 3 — Hardening and correct classification

12. **Add response headers.** CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
    and narrow CORS instead of `*`.
    - Acceptance: `A-03-T01` fails after the change.
13. **Proxy Gemini calls server-side** so provider keys are never in browser storage.
    - Acceptance: `A-02-T01` fails after the change.
14. **Relabel anti-cheat as UX.** Keep `preventDefault`, watermark and blur, but remove
    security claims. Add server-side timing/submission checks only if exam integrity is a
    product requirement.
    - Acceptance: `F-06-T01` remains as documentation of UX controls; no security blocker
      depends on them.

## Verification sequence

1. Run `node research/trithuc5/tests/run_all.js` before changes: 40 pass, 0 fail. Run
   `node research/trithuc5/tests/secure_controls.js`: 1 pass, 8 expected failures.
2. Apply a phase, rebuild, rerun: the tests mapped to that phase must fail, proving the old
   behavior is gone.
3. Update each test to assert the new secure behavior, then rerun to green.
4. Re-measure the source hash and line references after every deploy; the harness will refuse
   to run on a changed source until `EXPECTED_SHA` is deliberately updated.
5. Repeat the full suite in a dedicated staging deployment owned by the project before
   production rollout. No test in this repository contacts production.

## Dependency summary

```
Phase 0 (contain secrets)
        |
        v
Phase 1 (server auth + signed cloud packets)
        |
        v
Phase 2 (server entitlement / devices / answers / storage)
        |
        v
Phase 3 (headers, key proxy, honest anti-cheat labeling)
```
