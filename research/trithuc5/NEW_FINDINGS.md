# Phase 3 new findings — TRITHUC5.0 V4.3.9

Source hash: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
Fresh fetch: `2026-11-17T19:23:58Z`, HTTP 200, 14,226,000 bytes. Raw HTML is kept locally only.

Evidence states for this phase: `STATIC_CONFIRMED`, `LOCAL_CONFIRMED`, `STAGING_CONFIRMED`, `LIVE_CONFIRMED`, `UNVERIFIED`, `NOT_REPRODUCIBLE`, `DUPLICATE`.
A local VM result is never treated as live or cross-user proof.

---

## NEW-08 — Registration password is written to audit logs and posted to a Google Form

| Field | Value |
|---|---|
| ID | NEW-08 (test P3-01) |
| Title | Plaintext registration password is embedded in activity-log text and sent to a third-party Google Form |
| Affected component | Registration handler, `logStudentActivity`, `syncActivityLogToGoogleForm`, `postToGoogleFormEndpoint`, `saveActivityLogsState` |
| Root cause | The registration log string at source line 13298 interpolates the chosen password as `MK: ${p}`. `syncActivityLogToGoogleForm` copies `targetTitle` into `compactDetail` (lines 4094–4106), and `postToGoogleFormEndpoint` places that detail into the configured Google Form `entry.…` value (lines 4225–4261). The same entry is persisted by `saveActivityLogsState` (lines 3547–3555). |
| Preconditions | A synthetic user completes registration. The shipped default Google Form config has `autoSyncActivity: true` and an active `actionUrl` (lines 1510–1521). No admin privileges are needed. |
| Reproduction steps | 1. Use `tests/phase3_tests.js` P3-01 with `TRITHUC_SOURCE` set to the hash-pinned HTML. 2. Call `logStudentActivity('REGISTER_ACCOUNT', …, '[REGISTER_ACCOUNT] TK: synthetic_user \| MK: synthetic_password \| …', …, user)`. 3. Inspect the captured local `fetch` body, `window.__GFORM_SENT_LOG__`, and `STORAGE_KEYS.ACTIVITY_LOGS`. |
| Expected | Authentication secrets never appear in audit text, browser storage, or third-party form payloads. |
| Actual | The synthetic password appears in all three local artifacts. No network request was sent: `fetch` was mocked. |
| Security impact | Ordinary registration can disclose a plaintext password to a third-party form and leave it in browser storage. If real users have registered, their passwords may be present in form responses and logs. Password reuse would extend the impact. |
| Evidence files / source refs | `evidence/phase3-test-results.txt` (P3-01); `tests/phase3_tests.js`; `tests/phase3_harness.js`; source lines 13295–13303, 4094–4106, 4225–4261, 3547–3555 |
| Evidence state | `LOCAL_CONFIRMED` for the behavior with real extracted functions; `STATIC_CONFIRMED` for the source wiring. Live form receipt is `UNVERIFIED`. |
| Severity and justification | **High.** Plaintext credential egress on a normal user action, enabled by default in the shipped configuration. Not Critical because live form content and real-user registration packets were not inspected. |
| Limitations | No live Google Form request was made; no real account or real form response was accessed. The form ID is redacted in reports. |
| Recommended next investigation | With owner authorization, inspect whether the configured form has collected password-bearing responses; determine retention and access scope. Do not query real user records without explicit approval. |

---

## NEW-09 — Security state is mirrored into non-HttpOnly cookies and `window.name`

| Field | Value |
|---|---|
| ID | NEW-09 (test P3-02) |
| Title | `safeStorageSet` copies sensitive client state into script-readable cookie and `window.name` stores |
| Affected component | `safeStorageGet`, `safeStorageSet`, `safeStorageRemove`, `readWindowNameStore`, `writeWindowNameStore` |
| Root cause | `safeStorageSet` writes every value shorter than 3500 characters into `window.name` and every value shorter than 1800 characters into `document.cookie` with `path=/; max-age=31536000; SameSite=Lax` (lines 1342–1359). The cookie is not marked `HttpOnly` or `Secure`. The same helper stores admin session records, remembered student/admin credentials, and the device hardware token. |
| Preconditions | Any normal call to `safeStorageSet`, including login, remember-me, device binding, and session restore. |
| Reproduction steps | 1. Run P3-02. 2. Call `safeStorageSet('P3_SECRET_KEY', 'phase3_synthetic_secret')`. 3. Observe the value in `document.cookie` and in `window.name`. 4. Verify the source cookie line contains `SameSite=Lax` but not `HttpOnly` or `Secure`. |
| Expected | Session and credential material is confined to a storage channel with appropriate script and transport protections. |
| Actual | The value is replicated to two additional script-readable channels. |
| Security impact | Any script running on the page can read credentials/session data from more places than expected. `window.name` persists across same-tab navigation, so a later page in the same tab may be able to read the stored JSON. Cookies are attached to same-host requests. This widens the blast radius of any script-execution issue and weakens logout/invalidation. |
| Evidence files / source refs | `evidence/phase3-test-results.txt` (P3-02); source lines 1310–1322, 1325–1373, 14010–14013, 13308–13309, 2613–2618 |
| Evidence state | `LOCAL_CONFIRMED` for the mirror behavior; `STATIC_CONFIRMED` for storage keys and cookie flags. Cross-origin disclosure through `window.name` navigation is `UNVERIFIED`. |
| Severity and justification | **Medium.** No standalone script execution was found, so this is not a direct account-takeover primitive. It materially amplifies credential and session exposure once any script or local-storage issue exists. |
| Limitations | No real browser navigation test was performed. `SameSite=Lax` limits some cross-site use. No live cookie value was read. |
| Recommended next investigation | Test in a real browser whether `window.name` survives navigation to an attacker-controlled origin and whether any sensitive values remain after logout. Do this only with synthetic accounts. |

---

## NEW-10 — Client-controlled “admin tester” identity suppresses audit logging

| Field | Value |
|---|---|
| ID | NEW-10 (test P3-05) |
| Title | Mutable user fields are sufficient to be treated as an admin exam tester and skip logging |
| Affected component | `isAdminExamAttempt`, `logStudentActivity`, `exitExamRoom`, `purgeAdminTestHistoryRecords` |
| Root cause | `isAdminExamAttempt` returns true when `state.isAdminLoggedIn` is true or when the user object has `isAdminTester`, `id === 'gv_test'`, username `thaytrung`/`thaytrung_test`, or class `GV-TOAN` (lines 8729–8740). These are client-controlled fields. `logStudentActivity` returns `null` for such users (line 4121), and `exitExamRoom` purges their history (lines 13853–13860). |
| Preconditions | Control of the local user object through writable storage, simulated state, or an injected cloud packet. No server-authenticated test role exists. |
| Reproduction steps | 1. Run P3-05. 2. Set a synthetic user's `isAdminTester` to true. 3. Call `logStudentActivity`. 4. Observe `null`, no activity log entry, and no captured Google Form request. |
| Expected | Only a server-authenticated test identity may suppress audit records. |
| Actual | Any synthetic user with the flag is silently exempt. |
| Security impact | Audit integrity is weakened: actions can be excluded from both local activity logs and the configured Google Form. This is a client-side governance bypass, not server-side privilege escalation. |
| Evidence files / source refs | `evidence/phase3-test-results.txt` (P3-05); source lines 8729–8740, 4119–4123, 13847–13861 |
| Evidence state | `LOCAL_CONFIRMED` for log suppression; `STATIC_CONFIRMED` for history purge wiring. |
| Severity and justification | **Medium.** It defeats a monitoring control but does not by itself expose protected data or change server state. |
| Limitations | The activity log is client-generated and no server audit log was found. No real user action was logged or suppressed. |
| Recommended next investigation | Confirm whether the Google Form is treated as an audit record by the owner; if so, move audit emission to a server endpoint with authenticated identities. |

---

## P3-04 — Predictable per-user KV keys amplify NEW-01 (`DUPLICATE`)

- **Finding relationship:** `DUPLICATE` of NEW-01, not a separate vulnerability.
- **New evidence:** `pushCloudSyncPacket` writes a serialized single user to keys derived as `u_<username-lowercase-non-alphanumeric>_<chunk>` (lines 3348–3363). Test P3-04 confirms a synthetic password is present in the Base64URL chunk carried in the KV URL path.
- **Why it matters:** The key name is predictable from a username, and the secret is encoded in the URL path, not only in a request body. This increases exposure if public KV history is readable.
- **Evidence state:** `LOCAL_CONFIRMED` for key construction and payload content; real KV content `UNVERIFIED`.
- **Severity:** Not assigned separately; retain NEW-01 High/Critical assessment depending on real packet verification.

## P3-03 — Automatic 24h replay strengthens NEW-03 (existing finding)

- **Finding relationship:** Strengthens NEW-03; not a separate finding.
- **New evidence:** `setupRealtimeCloudStream` opens `/sse?since=24h` and `pullCloudSyncMessages` polls `/json?poll=1&since=24h`. Test P3-03 shows a packet with `ts:1` is applied automatically through the poll path on a normal pull.
- **Evidence state:** `LOCAL_CONFIRMED` for stale packet application; `STATIC_CONFIRMED` for the 24h windows.
- **Impact change:** No severity change. The replay window is concrete and automatic rather than merely attacker-triggered.

## Negative controls

| Control | Result | Evidence state |
|---|---|---|
| Object-valued `__proto__` tombstone does not pollute the tombstone map or delete an unrelated user | Not reproduced | `NOT_REPRODUCIBLE` |
| One VM environment does not mutate another without explicit packet transfer | Not reproduced | `NOT_REPRODUCIBLE` for cross-client impact |
| DOM XSS or other script-execution primitive | None identified in this pass | `UNVERIFIED` |
