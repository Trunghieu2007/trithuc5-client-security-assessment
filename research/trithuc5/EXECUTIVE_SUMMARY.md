# Executive summary — TRITHUC5.0 V4.3.9

## Overall posture

The application is a single static HTML bundle with no server-side authorization boundary for
the security features it advertises. Authentication, entitlement, device binding, exam grading,
and cloud state synchronization are all decided from data the user can read or modify.
The measured source is unchanged from the earlier assessment (SHA-256 `fe6fef99…d792b5`), so
none of the six original findings has been remediated.

## Confirmed vulnerabilities

All six original findings remain valid:

- **F-01 Critical** — public cloud packets are accepted for privileged mutation; missing or
  invalid signatures are tolerated; tombstones are applied without authorization.
- **F-02 Critical** — admin credentials and session salt are in the client; forged or
  unsigned sessions are accepted locally.
- **F-03 High** — VIP and device-limit fields are protected by a client-computed checksum with
  a hardcoded salt.
- **F-04 High** — 15 exams ship 330 answer entries in plaintext before submission.
- **F-05 Medium** — device/Gmail locking is enforced only by client JavaScript over writable
  localStorage.
- **F-06 Low** — anti-cheat is `preventDefault`, DOM nodes, and CSS; it is correctly treated
  as UX, not as a security control.

Seven additional issues were identified: password broadcast in public packets (Critical),
unauthenticated injection of active/VIP users (Critical), no replay or expiry handling
(Medium), a global packet-application bridge (Low), client-held Gemini key (Low), missing
security headers (Informational), and unvalidated cross-tab state replacement (Medium).

## Most serious attack chains

1. **Public packet → cross-client mutation.** A packet with `fromAdmin:true` and no signature
   can delete a victim's local user records and insert an attacker-chosen active VIP account
   on every client. Reproduced in the isolated harness; deliberately not sent to production.
2. **Public packet → credential exposure.** The shipped serializer puts each student's
   password in a field that is Base64URL-encoded and posted to public ntfy/KV. Code behavior
   is confirmed; whether real passwords exist on the live topic is unverified because the
   read-only observation timed out and KV returned HTTP 503.
3. **Forged session → broadcast admin state.** A client-signed session unlocks the teacher UI;
   local VIP changes can then be broadcast as an admin snapshot. No backend rejects any step.

## Potential user impact

- Loss of exam integrity: every answer is available before the exam starts.
- Unauthorized access to paid content in the attacker's own browser.
- Account disruption on other clients through forged tombstones.
- Potential password disclosure if historical public snapshots contain real records.
- Teacher UI actions cannot be trusted as an administrative audit trail.

## Release blockers

The current build should **not** be released as a system that protects accounts, entitlements,
or exam results. Release blockers are:

1. Password field in public cloud packets (NEW-01).
2. Unauthenticated cloud state mutation and tombstone deletion (F-01, NEW-02).
3. Client-side admin authentication (F-02).
4. Answer keys shipped to every client (F-04).
5. No server-side entitlement or device registry (F-03, F-05).

## Recommended remediation order

Follow `REMEDIATION_PLAN.md` in order:

1. Contain: remove the password field, rotate exposed material, remove the global cloud bus.
2. Establish server authentication and signed, fresh cloud packets verified before all mutations.
3. Move entitlement, devices, user records, and grading to the server.
4. Add response headers, proxy provider keys, and relabel anti-cheat as UX.

## Validation performed

- Current source re-fetched with cache busting; hash matched the prior assessment.
- 35 deterministic local tests executed with real functions extracted from the source,
  synthetic users, and mock ntfy/KV. Result: **35 pass, 0 fail**, exit code 0.
- No production packet injection, no destructive testing, no real account access, and no
  modification of production user data.
- Static-only conclusions are explicitly labeled; no live packet content is included.

The five most urgent actions are the release blockers listed above. Until their regression
tests flip from pass to fail and server-side behavior is verified in staging, the assessment
classifies this release as **blocked**.
