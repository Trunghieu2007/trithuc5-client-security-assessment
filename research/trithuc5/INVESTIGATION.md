# INVESTIGATION — TRITHUC5.0 V4.3.9 client-side security assessment

**Target:** `https://trithuc500.vercel.app/`
**Source measured:** 14,226,000 bytes, 15,912 lines, SHA-256 `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
**Method:** static tracing of the current published HTML + isolated Node VM harness executing real extracted functions with mock ntfy/KV and synthetic users. No production writes, no real accounts, no third-party data.
**Evidence labels:** `CONFIRMED` = reproduced in harness; `STATIC_CONFIRMED` = directly established from source; `LIKELY` = strong indicators, missing one validation step; `UNVERIFIED` = hypothesis only; `FIXED` = not applicable here.

Credential values, salts, session signatures and private keys are deliberately not reproduced in this document. They remain in the verbatim public HTML copy under `research/trithuc5/index.html`; the reports refer to their source locations instead.

---

## F-01 — Cloud sync authorization and tombstone mutation

- **Title:** Unauthenticated public packets are trusted for privileged state mutation
- **Severity:** Critical
- **Component:** `processIncomingCloudPacket`, `buildTeacherSnapshotPacket`, `pushCloudSyncPacket`, `pullCloudSyncMessages`, ntfy/KV transport
- **Location:** lines 2918–2926, 2975–2983, 3115–3140, 3142–3268, 3282–3367, 3369–3469
- **Root cause:** All signing material is shipped to the client, `fromAdmin` is a client-set boolean, and verification at line 3145 accepts a missing `adminSig`. Tombstone merge at lines 3161–3188 runs before and independently of `isVerifiedAdmin`. There is no nonce, expiry, sequence number, or topic authorization.
- **Preconditions:** Ability to read/write a public ntfy topic (no auth in code) or to execute script in the page. No account required for the packet path.
- **Expected:** Only a server-authenticated admin packet may change `hideAuthorInfo`, user status, entitlements, or tombstones.
- **Actual:** Missing/invalid signature and forged `fromAdmin` are accepted; tombstones are applied even when `fromAdmin` is absent; any packet whose `type` is not exactly `STUDENT_REGISTER` can insert an active VIP user. Replay and expiry are not checked. A forged tombstone permanently blocks later restoration.
- **Evidence:** `CONFIRMED` — `F-01-T01` … `F-01-T14` in `evidence/test-results.txt`.
- **Security impact:** Cross-client state control: deletion of another client's user records, injection of attacker-chosen accounts and entitlements, persistent desynchronization.
- **Exploitability:** High. Single HTTP POST to a public topic, no credentials. Live exploitation was **not** performed because it would affect other users' client state; the stop condition remains in force.
- **Scope/limitations:** The harness proves client-side acceptance. It does not prove that a production client received a given live packet: ntfy GET timed out and KV returned HTTP 503 during observation. No backend boundary exists in the shipped client.
- **Remediation:** Verify a server-issued signature (Ed25519 or HMAC with a server-only secret) before **every** state mutation, including tombstone merge. Remove `!data.adminSig` acceptance. Add timestamp, nonce, and sequence validation. Move ntfy/KV behind an authenticated backend proxy; treat topic names and app keys as public identifiers, not secrets. Make the server authoritative for user records.
- **Regression test:** `F-01-T01` … `F-01-T14`; after a fix, all should fail except the valid-signature case.

### F-01 sub-observations
- `F-01-T06/T07`: no replay or expiry guard; duplicate packets are merely idempotent for equal timestamps.
- `F-01-T09`: malformed tombstone values are skipped without crashing; malformed user entries are skipped.
- `F-01-T11`: no cross-browser isolation — a packet from one synthetic client mutates another.
- `F-01-T12`: forged tombstone survives a later legitimate restore.
- `F-01-T14`: `window.__TRITHUC50_CLOUD_BUS__.applyIncomingPacket` (lines 3088–3093) exposes direct packet application to any script running in the page.

---

## F-02 — Admin authentication and session trust

- **Title:** Admin authentication and session validity are decided entirely in the client
- **Severity:** Critical
- **Component:** `state.adminCreds`, login handler, `computeAdminSessionSig`, session restore
- **Location:** lines 1505–1508, 2385–2411, 2821–2824, 13993–14029
- **Root cause:** Credentials are reversible base64 literals in the bundle. The login handler compares strings locally. Session signatures use a hardcoded salt and a timestamp; restore accepts a missing signature and a 7-day static window. Logout only removes a localStorage key. No backend call authorizes privileged actions.
- **Preconditions:** Load the page. No account, no network privilege, no password guessing.
- **Expected:** Credentials stored server-side with a password hash; server-issued short-lived session; privileged operations independently authorized.
- **Actual:** A forged session with a client-computed signature is accepted; a session with no signature is accepted; invalid and expired signatures are rejected client-side but no server boundary exists. A 60-second lock after five failures is RAM-only and resets on reload.
- **Evidence:** `CONFIRMED` — `F-02-T01` … `F-02-T05`. `STATIC_CONFIRMED` — hardcoded credential literals and alias handling at lines 1505–1508 and 13999–14004.
- **Security impact:** Any visitor can obtain the UI state of a logged-in teacher in their own browser and then use other client-side weaknesses (F-01, F-03) to broadcast changes.
- **Exploitability:** High locally; production administrative impact is limited because there is no backend admin API to call.
- **Scope/limitations:** No production admin action was attempted. The known credential indicators are treated as compromised and are not reproduced here.
- **Remediation:** Move authentication to a server endpoint; Argon2id/bcrypt password hashes; constant-time comparison; `HttpOnly; Secure; SameSite=Strict` cookie or short-lived signed JWT verified server-side; server-side rate limiting and audit logs; rotate all exposed credentials and salts.
- **Regression test:** `F-02-T01` … `F-02-T05`; after a fix, forged/missing-signature sessions must be rejected and a server API must reject unsigned privileged calls.

---

## F-03 — VIP / user integrity / entitlement

- **Title:** Entitlement integrity is a client-computed checksum with a hardcoded salt
- **Severity:** High
- **Component:** `computeUserIntegritySig`, `verifyRuntimeSecurityIntegrity`, `isStudentVipExpired`
- **Location:** lines 2806–2819, 2826–2846, 2859–2866, 3910
- **Root cause:** The signing salt is in the bundle and the verifier recomputes the signature from the same mutable object it is asked to protect. No trusted authority checks VIP or `maxDevices`.
- **Preconditions:** Control of localStorage / in-memory user object in the browser.
- **Expected:** Entitlements cannot be changed by the recipient of the data.
- **Actual:** Tampered VIP flags, `vipPlan='lifetime'` and `maxDevices=999` pass after recomputing `_sig`. A stale signature is detected and VIP is stripped, proving the check exists but is self-keyed.
- **Evidence:** `CONFIRMED` — `F-03-T01` … `F-03-T03`. `STATIC_CONFIRMED` — no entitlement API endpoint in the source.
- **Security impact:** Unlimited client-side access to VIP exams and bypass of device limits. Revenue and access-control impact; no server data is changed.
- **Exploitability:** High, but limited to the attacker's own browser unless combined with F-01 to broadcast the forged user to others.
- **Scope/limitations:** No real customer entitlement was modified.
- **Remediation:** Server owns entitlements and returns them over an authenticated channel. Client must not make access decisions from local objects. Remove `_sig` as a security control; use it only as a corruption detector if needed.
- **Regression test:** `F-03-T01` … `F-03-T03`.

---

## F-04 — Exam answer exposure

- **Title:** All exam answer keys ship in the initial HTML before submission
- **Severity:** High
- **Component:** `window.__INITIAL_EXAMS_DATA__`, `makeMatExam`, `decryptV97EmbedPayload`
- **Location:** line 1047 (15 exams), lines 1098 and 1267, lines 4346–4387
- **Root cause:** Answer keys are part of the content payload delivered to every client. The XOR layer is reversible and its key prefix plus signature input are available in the client.
- **Preconditions:** Load the public page. No login required for the initial data.
- **Expected:** Answers are unavailable until submission or until an authenticated teacher requests them.
- **Actual:** 15 exams contain 330 plain answer entries (180 part 1, 60 part 2, 90 part 3). All are readable before any exam starts. The XOR transform round-trips with synthetic key material. Grading uses a client function (`calculateAttemptScore`) and no server grading endpoint is called.
- **Evidence:** `CONFIRMED` — `F-04-T01` … `F-04-T03`.
- **Security impact:** Complete loss of exam integrity; scores cannot be trusted.
- **Exploitability:** Trivial read-only access. No production restriction was bypassed to obtain the data.
- **Scope/limitations:** No restricted content belonging to other users was accessed. No live `ENC_PAYLOAD` constant exists in the measured build; only the parser is present.
- **Remediation:** Remove `correctAnswers` from all client payloads. Keep keys server-side; return them after submission or to an authenticated teacher. Replace XOR with server-held authenticated encryption if an obfuscated payload is required. Rotate all previously shipped keys.
- **Regression test:** `F-04-T01` … `F-04-T03`.

---

## F-05 — Device / Gmail lock

- **Title:** Device binding is client-enforced and based on writable local identifiers
- **Severity:** Medium
- **Component:** `getHardwareDeviceProfile`, `verifyAndBindStudentDeviceOnLogin`, `setSimulatedDeviceSlot`
- **Location:** lines 2613–2655, 2683–2803, 13430–13440
- **Root cause:** Device ID is derived from values stored in localStorage and can be overwritten; trusted-device list and Gmail association live in the same writable user object; production build includes simulation slots.
- **Preconditions:** Control of browser storage or use of the public UI simulation controls.
- **Expected:** A trusted backend registers devices, enforces the limit atomically, and can revoke a device independently of client state.
- **Actual:** Emptying `trustedDevices` or overwriting a `deviceId` makes any device recognized. The third-device path does return `ok:false` and can set `status='locked'` locally — so this is client-JavaScript enforcement, not merely a hidden UI. Independent clients can each accept their own device without arbitration.
- **Evidence:** `CONFIRMED` — `F-05-T01` … `F-05-T05`.
- **Security impact:** Account sharing and device-limit bypass; only within the client unless propagated through F-01.
- **Exploitability:** High locally; no real user was locked out or modified.
- **Scope/limitations:** True concurrent registration was simulated with two isolated environments, not measured against a real multi-tab backend (none exists).
- **Remediation:** Server-side device registry; out-of-band verification for new devices; atomic registration; remove simulation controls from production builds; derive device identity from an attested token rather than localStorage.
- **Regression test:** `F-05-T01` … `F-05-T05`.

---

## F-06 — Anti-cheat / DOM protection

- **Title:** F12/copy/fullscreen/watermark/blur controls are UX deterrence, not a security boundary
- **Severity:** Low (Informational for confidentiality)
- **Component:** `setupAntiCheatListeners`, `scanAndBlockAIExtensions`, `triggerExamViolation`, watermark DOM, CSS blur
- **Location:** lines 3696–3725, 3784–3945, 9053–9054, CSS around 213–214
- **Root cause:** Handlers use `preventDefault`; markers are DOM nodes and CSS classes. No server-side validation of timing, focus, watermark presence, or answer provenance exists.
- **Preconditions:** Local browser control.
- **Expected:** If presented as a security control, it must protect confidentiality or integrity.
- **Actual:** Handlers and DOM markers are confirmed present. They discourage casual copying but do not protect answer data (already exposed by F-04) and do not affect server-side state.
- **Evidence:** `STATIC_CONFIRMED` — `F-06-T01`. No browser automation was run; no dynamic bypass is claimed as reproduced here.
- **Security impact:** Minimal on its own. Classified Low, not High, because bypassing a UI restriction does not by itself expose protected information.
- **Exploitability:** High as UX annoyance; low as a security issue.
- **Remediation:** Server-authoritative timer/submission/grading and server-rendered per-session watermark. Keep `preventDefault` only as a UX notice and stop describing it as security.
- **Regression test:** `F-06-T01`.

---

## NEW-01 — Student passwords embedded in public cloud packets

- **Title:** `serializeCompactUser` places each student's password in a field broadcast to public channels
- **Severity:** Critical
- **Component:** `serializeCompactUser`, `pushCloudSyncPacket`, KV snapshot writer
- **Location:** line 2991 (`p:` field), lines 3304–3364
- **Root cause:** A password field is included in the compact user object that is Base64URL-encoded and POSTed to public ntfy topics and public KV keys. Base64URL is encoding, not encryption.
- **Preconditions:** A packet containing a real user must have been published at some point. Not verified in this session (no live packets read).
- **Expected:** Authentication secrets never leave a trusted server, and never enter a public broadcast channel.
- **Actual:** Harness confirms the shipped serializer emits `p` and the snapshot JSON contains it verbatim before encoding.
- **Evidence:** `CONFIRMED` for the code behavior — `F-01-T13`. `UNVERIFIED` for the presence of specific real passwords on the live topic.
- **Security impact:** Potential mass credential disclosure if real packets exist on the public topic or KV app. Password reuse would extend impact beyond this app.
- **Exploitability:** Read-only for an attacker; no authentication needed.
- **Scope/limitations:** The harness used only a synthetic password string. No real packet content was retrieved.
- **Remediation:** Remove `p` from `serializeCompactUser` immediately. Store password hashes server-side only. Rotate all user passwords that may have been broadcast. Purge/expire public KV snapshots and topic history under owner control.
- **Regression test:** `F-01-T13`; after a fix, the serialized object must not contain a password field and the test must fail.

---

## NEW-02 — Unauthenticated injection of arbitrary active/VIP users

- **Title:** Non-registration packet type bypasses the only entitlement downgrade path
- **Severity:** Critical
- **Component:** `processIncomingCloudPacket`
- **Location:** lines 3191–3211, 3224–3237
- **Root cause:** The downgrade to `pending`/no VIP applies only when `data.type === 'STUDENT_REGISTER'`. Any other type skips it, while `deserializeCompactUser` accepts caller-supplied `status`, `vipPackages`, `vipPlan` and `updatedAt`.
- **Preconditions:** Ability to publish a packet to the public topic, or local script execution.
- **Expected:** Only authenticated admin packets may create active or entitled users on clients.
- **Actual:** A packet with no `fromAdmin`, no signature, and a type such as `ANY_OTHER_EVENT` inserts an active VIP user into another client's state.
- **Evidence:** `CONFIRMED` — `F-01-T02`, `F-01-T04`, `F-01-T11`.
- **Security impact:** Attacker-chosen accounts and entitlements appear on all clients; can be combined with forged tombstones to remove real users.
- **Exploitability:** High; one public packet. Not executed live.
- **Scope/limitations:** Local harness only.
- **Remediation:** Authenticate every user-bearing packet; ignore type strings as trust signals; validate the schema strictly; never derive entitlement from packet contents.
- **Regression test:** `F-01-T02/T04/T11`.

---

## NEW-03 — No replay, expiry, or nonce handling in cloud packets

- **Title:** Cloud packets have no freshness or uniqueness validation
- **Severity:** Medium
- **Component:** `processIncomingCloudPacket`
- **Location:** lines 3142–3268
- **Root cause:** `ts` is only compared for `hideAuthorTs` and user `updatedAt`; there is no nonce, seen-message set, maximum age, or sequence check.
- **Preconditions:** Capture or construct a packet.
- **Expected:** Expired or previously seen packets are rejected.
- **Actual:** A packet with `ts=1` is applied; a repeated packet is accepted but produces no further change because timestamps are equal.
- **Evidence:** `CONFIRMED` — `F-01-T06`, `F-01-T07`.
- **Security impact:** Enables delayed reapplication of old states and amplifies other packet weaknesses; limited on its own because repeated identical packets are idempotent.
- **Exploitability:** Medium.
- **Remediation:** Signed timestamp plus nonce/sequence; reject outside a short skew; maintain a bounded replay cache.
- **Regression test:** `F-01-T06/T07`.

---

## NEW-04 — Global packet-application bridge

- **Title:** `window.__TRITHUC50_CLOUD_BUS__.applyIncomingPacket` bypasses transport entirely
- **Severity:** Low
- **Component:** Cloud bus bridge
- **Location:** lines 3088–3093
- **Root cause:** A global object exposes direct packet application with no origin or caller check.
- **Preconditions:** Script execution in the page (extension, injected script, or DOM XSS elsewhere).
- **Expected:** Internal packet processing is not callable by arbitrary page scripts.
- **Actual:** The bridge is present in the production source and calls the same unauthenticated processing path.
- **Evidence:** `STATIC_CONFIRMED` — `F-01-T14`.
- **Security impact:** Turns any script-execution primitive into a cloud-state mutation primitive.
- **Remediation:** Remove the bridge from production or gate it behind a build flag unavailable to shipped bundles.
- **Regression test:** `F-01-T14`.

---

## NEW-05 — Gemini API key handled in client storage

- **Title:** A user-supplied Gemini API key is stored in localStorage and used in direct browser requests
- **Severity:** Low
- **Component:** Gemini OCR integration
- **Location:** line 1300 (`GEMINI_KEY` storage key), lines 13086–13091, 14987, 15009
- **Root cause:** The key is read from and written to localStorage and placed in a URL query parameter to Google.
- **Preconditions:** A teacher has entered a key into the UI.
- **Expected:** Sensitive provider keys are proxied server-side and not exposed to page scripts.
- **Actual:** No embedded live key value was found (`AIza…` count 0); the design still exposes any key the user enters to any script on the page.
- **Evidence:** `STATIC_CONFIRMED` — `A-02-T01`. Not a hardcoded application secret.
- **Security impact:** Provider-key theft and quota abuse if page script is compromised.
- **Exploitability:** Low; requires script execution or local access.
- **Remediation:** Proxy Gemini calls through a server that holds the key; restrict key permissions and referrers.
- **Regression test:** `A-02-T01`.

---

## NEW-06 — Missing protective response headers

- **Title:** Static hosting response lacks CSP, frame and content-type protections
- **Severity:** Informational
- **Component:** Vercel static response
- **Location:** `current.headers`
- **Root cause:** Deployment configuration only sets HSTS and a permissive `Access-Control-Allow-Origin: *`.
- **Preconditions:** Observe public response headers.
- **Expected:** Defense-in-depth headers appropriate for an app handling educational records.
- **Actual:** No `Content-Security-Policy`, `X-Frame-Options`, or `X-Content-Type-Options`.
- **Evidence:** `STATIC_CONFIRMED` — `A-03-T01`.
- **Security impact:** No standalone exploit shown; increases impact of any future XSS or clickjacking issue.
- **Remediation:** Add a restrictive CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and replace wildcard CORS with explicit origins if cross-origin access is actually required.
- **Regression test:** `A-03-T01`.

---

## NEW-07 — Cross-tab storage sync trusts writable localStorage

- **Title:** Storage events replace `state.users` and logs without validation
- **Severity:** Medium
- **Component:** `setupCrossTabUserSync`
- **Location:** lines 15861–15877
- **Root cause:** Any same-origin script that can write the users key can replace the whole in-memory user list in another tab; no origin, schema, signature, or trust check is applied to the event.
- **Preconditions:** Same-origin script execution or storage access.
- **Expected:** Cross-tab synchronization validates data and does not grant authority.
- **Actual:** `state.users = parsedU` after a plain `JSON.parse`.
- **Evidence:** `STATIC_CONFIRMED` — `A-04-T01`.
- **Security impact:** Amplifies F-02/F-03/F-05 from one tab to all tabs.
- **Remediation:** Use a single authoritative state source; validate schema; authenticate updates; avoid replacing security-sensitive state from storage events.
- **Regression test:** `A-04-T01`.

---

## Relationships and attack chains

1. **Public packet → cross-client mutation (CONFIRMED locally).** Read or craft a packet; set `fromAdmin:true` with no signature; include tombstone and an active VIP user. Every client accepts it (F-01, NEW-02, NEW-03). Prerequisite for live effect: post to the public topic — deliberately not done.
2. **Packet disclosure → credential reuse (LIKELY).** If real packets exist publicly, `p` may expose passwords (NEW-01). Prerequisite: real packet content on the topic/KV; not verified in this session.
3. **Client admin forgery → broadcast (CONFIRMED locally).** Forge a session (F-02), set VIP locally (F-03), then publish a snapshot (F-01). No backend rejects any step.
4. **Answer exposure + entitlement bypass (CONFIRMED locally).** Read 330 answer entries (F-04), unlock exams via self-signed VIP (F-03). No server grading boundary exists.

## Release decision

Do not ship the current build as a security-bearing assessment system. All six original findings remain valid; no `FIXED` status exists. Seven additional issues were identified. The release should be blocked until the five actions in `REMEDIATION_PLAN.md` are implemented and their regression tests flip from pass to fail.
