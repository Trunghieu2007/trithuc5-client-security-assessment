# Attack surface map — TRITHUC5.0 V4.3.9 Phase 3

Source: fresh read-only fetch at `2026-11-17T19:23:58Z`, HTTP 200, SHA-256 `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
Only publicly observable behavior and the hash-pinned client source were examined. No production state was changed.

## Evidence states used here

`STATIC_CONFIRMED` = directly in source; `LOCAL_CONFIRMED` = reproduced in the isolated harness; `STAGING_CONFIRMED` = isolated staging; `LIVE_CONFIRMED` = safely demonstrated on target; `UNVERIFIED` = plausible but not proven; `NOT_REPRODUCIBLE` = tested and not observed; `DUPLICATE` = covered by another finding.

## Surface review

| Area | What was traced | Result | Evidence state |
|---|---|---|---|
| A. Cloud sync | ntfy primary/backup publish and poll, SSE, KV global snapshot chunks, KV per-user records, BroadcastChannel, storage events, cloud bus bridge, `processIncomingCloudPacket`. | Missing/invalid signatures still drive merge and tombstones. 24h SSE/poll windows automatically reapply stale packets. KV per-user keys are predictable and carry serialized passwords. No ingestion path performs independent authorization. | `LOCAL_CONFIRMED` for local effects; live delivery `UNVERIFIED`; P3-04 is `DUPLICATE` of NEW-01. |
| B. Authentication / authorization | Admin session forge/restore, `requireAdminAuth`, login/logout, absence of app-origin API calls. | Privilege is UI state in the attacker's browser. No backend admin operation exists in the measured client. Cross-user effect requires cloud sync. | `LOCAL_CONFIRMED` for forged UI; no server boundary `STATIC_CONFIRMED`. |
| C. Registration / passwords / sessions | Registration handler, `serializeCompactUser`, activity logging, Google Form sync, remembered credentials, logout. | Passwords reach public cloud packets, per-user KV keys, activity logs, a third-party Google Form, and plaintext remember-me storage. | `LOCAL_CONFIRMED` for NEW-08, NEW-01/P3-04; `STATIC_CONFIRMED` for remember-me. |
| D. VIP / entitlement | `computeUserIntegritySig`, `verifyRuntimeSecurityIntegrity`, `isStudentVipExpired`, `requireAdminAuth`. | Self-keyed checksum and client-only decisions. Device token is also read through the multi-store fallback. | `LOCAL_CONFIRMED`; `STATIC_CONFIRMED` for absence of backend entitlement API. |
| E. Exam / content | `window.__INITIAL_EXAMS_DATA__`, `decryptV97EmbedPayload`, `calculateAttemptScore`, static asset inventory. | 15 exams / 330 answer entries are public. XOR inverse works with public key material. No server grading endpoint. No additional hidden asset or source map found. | `LOCAL_CONFIRMED` for answer/XOR; `STATIC_CONFIRMED` for grading and assets. |
| F. Device / Gmail | `getHardwareDeviceProfile`, `verifyAndBindStudentDeviceOnLogin`, simulation slots, Gmail regex. | Device identity is derived from writable local state and simulation controls remain in production. No trusted registry exists. | `LOCAL_CONFIRMED` for F-05; `STATIC_CONFIRMED` for token fallback via cookie/`window.name`. |
| G. Cross-tab / storage / messaging | `setupCrossTabUserSync`, BroadcastChannel, `safeStorageSet` multi-store mirror, cloud bus. | Storage events replace user state without validation. Sensitive values are mirrored to cookie and `window.name`. Global bus exposes packet application to page scripts. | `LOCAL_CONFIRMED` for state replacement and mirror; `STATIC_CONFIRMED` for bus. |
| H. API / deployment / configuration | Embedded URLs, fetch calls, response headers, static assets, source maps, service worker, manifest. | No app-origin auth/admin/grading API. External endpoints: ntfy.sh, keyvalue.immanuel.co, Google Forms, Gemini, CDNs. Headers lack CSP, frame, and content-type protections; CORS is `*`. No source map, manifest, or service worker reference. | `STATIC_CONFIRMED`. |
| I. Additional attack classes | Prototype pollution via tombstones, XSS sinks, open redirects, IDOR, mass assignment, storage races, clickjacking, information disclosure. | No new high-severity primitive. Prototype pollution and cross-VM mutation were explicitly tested and not reproduced. XSS remains unverified because no script-execution primitive was identified. IDOR is not applicable in the absence of server-side account objects. | `NOT_REPRODUCIBLE` for tested negatives; `UNVERIFIED` for XSS. |

## Confirmed data flows to sensitive sinks

1. `password` → `serializeCompactUser.p` → ntfy POST body and KV global/per-user chunks (NEW-01, P3-04).
2. `password` → registration `targetTitle` → activity log → Google Form `entry.444444` and localStorage (NEW-08).
3. `safeStorageSet` → localStorage + sessionStorage + `window.name` + cookie (NEW-09).
4. Public packet → `processIncomingCloudPacket` → tombstone/user merge → `localStorage` + `renderApp` (F-01, NEW-02, NEW-03).
5. `isAdminTester` → `isAdminExamAttempt` → log suppression + history purge (NEW-10).

## Prioritized investigation queue

| Priority | Area | Question | Evidence needed | Current status |
|---|---|---|---|---|
| P0 | Cloud sync | Are there additional unauthorized state transitions beyond tombstone/user merge? | Exhaustive packet field/type matrix in local/staging harness | Partial: all observed ingestion paths call the same unauthenticated processor; no separate mutation path found. |
| P0 | Authentication | Are privileged operations server-authorized? | Backend verification or server API evidence | `STATIC_CONFIRMED` none in measured client; server outside scope unavailable. |
| P0 | Password exposure | Are real credentials actually published? | Owner-authorized synthetic-account packet inspection on isolated staging | Synthetic behavior `LOCAL_CONFIRMED`; real packet content `UNVERIFIED`. |
| P1 | Account isolation | Can one authenticated account access another? | Two-account staging test with independent identities | Not applicable to measured client; no server accounts exist. Cross-client local effects are `LOCAL_CONFIRMED` only. |
| P1 | Exam system | Is grading enforced server-side? | Request/response analysis of a submission | `STATIC_CONFIRMED` no grading endpoint; no live submission performed. |
| P1 | Entitlements | Can client state unlock backend-protected resources? | Controlled staging test against a protected resource | No backend resource observed; client unlock `LOCAL_CONFIRMED`. |
| P2 | Cross-tab | Are there additional unvalidated message paths? | Browser harness for storage/BroadcastChannel ordering | Storage replacement `LOCAL_CONFIRMED`; real browser timing `UNVERIFIED`. |
| P2 | Deployment | Are there further configuration exposures? | Read-only inspection of static responses and assets | Headers and assets reviewed; no source map/service worker/manifest found. |

## Investigation gaps

- No real browser automation, so DOM-only controls and `window.name` navigation behavior remain `UNVERIFIED`.
- No live ntfy/KV packet retrieval succeeded in earlier phases; live content remains `UNVERIFIED`.
- No staging environment was supplied, so `STAGING_CONFIRMED` and `LIVE_CONFIRMED` states were not achievable.
- Server-side code is outside the measured artifact; its absence cannot be proven beyond the client source.
