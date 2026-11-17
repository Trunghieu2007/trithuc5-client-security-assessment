# Revalidation — independent challenge of prior conclusions

Source used: read-only cache-busted fetch at `2026-11-17T19:00:09Z`, HTTP 200, 14,226,000 bytes,
SHA-256 `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5` — **identical** to
the previous snapshot. Build title: `TRITHUC5.0 V4.3.9`; version strings present: V4.2.4,
V4.2.6, V4.2.8, V4.3.9, V9.7pro, TRITHUC50_V434/V436/V437. No fix has been deployed.

Evidence labels are applied conservatively. A local VM result is not treated as proof of live
delivery or cross-user impact.

---

## Reassessment of the six original findings

| ID | Prior | Revalidated | Reasoning |
|---|---|---|---|
| F-01 | Critical | Critical, `CONFIRMED` | Same source; unsigned/missing-signature packets still drive privileged merge and tombstone mutation. Cross-client live delivery remains `UNVERIFIED`. |
| F-02 | Critical | High, `CONFIRMED` | Client UI state can be forged, but there is no server-side administrative action to perform. Downgraded from Critical to High because privilege is confined to the attacker's own browser until combined with F-01. |
| F-03 | High | High, `CONFIRMED` | Self-keyed checksum; no backend entitlement check. Impact limited to client UI unless broadcast via F-01. |
| F-04 | High | High, `STATIC_CONFIRMED` + `CONFIRMED` count | 15 exams / 330 answer entries are in the public HTML. Confirmed by parsing the fresh source; no server grading endpoint exists. |
| F-05 | Medium | Medium, `CONFIRMED` | Client-side JavaScript enforcement confirmed; not backend enforcement. |
| F-06 | Low | Low / Informational, `STATIC_CONFIRMED` | UX controls only. Correctly not treated as a high-severity issue. |

No original finding is `FIXED`.

---

## NEW-01 — Password in cloud packets

**Source-level conclusion (`CONFIRMED`)**
- `serializeCompactUser` (lines 2985–3011) emits `p: sanitizePlainInput(u.password || '123', 40)` at line 2991. `sanitizePlainInput` strips a few characters; it does not hash, encrypt, or redact.
- Registration stores the user-chosen plaintext as `password: p` (line 13253). The value is therefore a plaintext password, not a hash or token.
- Publication paths:
  1. `pushCloudSyncPacket` with a single user → `user: serializeCompactUser(singleUserObj)` at line 3293 → POST to two public ntfy topics at lines 3306–3327.
  2. `buildTeacherSnapshotPacket` → `users: state.users.map(serializeCompactUser)` at line 3134 → encoded at line 3304 and posted to ntfy.
  3. The same snapshot is Base64URL-encoded and written in 140-byte chunks to public KV keys `s_<idx>` at lines 3333–3346.
  4. A per-user KV record embeds `serializeCompactUser(singleUserObj)` at line 3356 and writes to `u_<slug>_<idx>` at lines 3358–3363.
  5. `saveUsersState` calls `broadcastTeacherUsersToCloud([])` when `state.isAdminLoggedIn` (line 3494), so an admin UI change republishes the full snapshot.
- No code path removes or transforms `p` before publication. Only `sanitizePlainInput` is applied.

**Separation of claims**
- Source-level serialization and publication wiring: `CONFIRMED`.
- Actual publication of a real password to the live topic: `UNVERIFIED` — no live packet was retrieved (ntfy GET timed out, KV read returned 503).
- Presence of real credentials in historical packets: `UNVERIFIED` — deliberately not queried or exposed.

Severity remains Critical **if real packets exist**; the code defect itself is `CONFIRMED` and must be fixed regardless.

---

## NEW-02 — Unauthenticated active/VIP user injection

**Trace (`CONFIRMED` in harness, source path identical in fresh fetch)**
1. Entry points: SSE `onmessage` (3373–3384), ntfy JSON poll (3407–3421), KV snapshot (3437–3457), BroadcastChannel (15892–15895), and the global cloud bus (3106–3110).
2. `decodeCloudMessageString` (3270–3280) Base64URL-decodes `TT50V436:`/`TT50V437:` messages and JSON-parses them.
3. `processIncomingCloudPacket` (3142–3143) validates only `app`, accepting TRITHUC50_V434/V436/V437. There is no event-type whitelist.
4. `deserializeCompactUser` (3013–3047) trusts caller-supplied `st`, `pl`, `vp`, `maxD`, `exp`, and `devs`.
5. The downgrade at lines 3204–3211 applies **only** when `data.type === 'STUDENT_REGISTER'`. Any other or missing type bypasses it.
6. Merge at lines 3224–3237 accepts a remote active/VIP record when `isVerifiedAdmin` is true, or when the local record was pending and `remoteUpd > localUpd` even if unsigned.
7. Persistence at lines 3241–3265 writes all users to `localStorage` and calls `renderApp(true)`.
8. `saveUsersState` (3475–3494) recomputes `_sig` for injected users and persists them, so later reconciliation preserves rather than removes them.

Tombstones and user insertion do **not** share a reliable authorization boundary: tombstone merge at 3161–3188 is unconditional; user merge is partially gated but bypassable by type selection. Unknown event types are accepted. This remains Critical, `CONFIRMED` locally; live cross-client effect is `UNVERIFIED`.

---

## NEW-03 — Replay and expiration

Reassessed with a narrower claim. Timestamps are client-controlled and are only signed when a valid `adminSig` exists; however a missing signature is accepted as admin at line 3145, so unsigned timestamps are also trusted.

- Duplicate acceptance: `CONFIRMED`. A repeated packet is processed again.
- Repeated state mutation: `NOT CONFIRMED` for equal timestamps — `hideAuthorTs`/`updatedAt` comparisons are strict, so a byte-identical replay produces no second change.
- Stale packet overriding newer state: `CONFIRMED` for the privileged path. `isNowApproved` at line 3226 becomes true for any `status:'active'` admin packet regardless of `updatedAt`, so a stale signed or unsigned-as-admin packet can override a newer local downgrade.
- Replay after legitimate deletion: `NOT CONFIRMED` — `isUserDeletedByTombstone` at line 3200 blocks a user whose `updatedAt` is not newer than the tombstone.
- Replay after legitimate entitlement downgrade: `CONFIRMED` via `isNowApproved` as described above.

Severity remains Medium. The claim is now precise: damage requires a privileged-looking packet, not merely any duplicate.

---

## NEW-04 — Global cloud bus bridge

`window.__TRITHUC50_CLOUD_BUS__.applyIncomingPacket` at lines 3106–3110 is present in the shipped bundle (`STATIC_CONFIRMED`) and can be called by any same-page script. It does not bypass `processIncomingCloudPacket`; it skips only the transport.

No confirmed XSS or other script-execution primitive was found in this pass. Therefore this is **not** an independent vulnerability. It is an exploit amplifier / defense-in-depth weakness: if a separate script-execution issue exists, it turns that into cloud-state mutation. Reclassified as Informational, `STATIC_CONFIRMED`.

---

## NEW-05 — Gemini API key

- No live provider key value is embedded in the source: zero matches for `AIza…` (`STATIC_CONFIRMED`).
- `GEMINI_KEY: 'TRUNG_GEMINI_OCR_KEY'` at line 1300 is a **localStorage key name**, not a credential.
- A user-entered key is read from localStorage at line 13086 and placed in the Google API URL at line 13091; another path writes it at line 14987 and calls the provider at line 15009.
- The key is user-supplied, not application-owned. Its permissions and quota cannot be measured from the client.
- It is exposed to any script on the page because it lives in localStorage.

Reclassified as Low/Informational, `STATIC_CONFIRMED`. The previous wording "client-held Gemini key" was accurate; calling it an application secret was not.

---

## NEW-06 — Security headers

Re-fetched headers show HSTS and `Access-Control-Allow-Origin: *`, plus `Cache-Control: public, max-age=0, must-revalidate`. Absent: CSP, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

No exploit is demonstrated by missing headers alone. The wildcard CORS header does not expose same-origin localStorage to other origins. The HTML is public and must-revalidate; it contains all exam answers by design (F-04), but caching headers are not the root cause. Reclassified Informational, `STATIC_CONFIRMED`.

---

## NEW-07 — Cross-tab storage trust

- `storage` listener at lines 15859–15877 replaces `state.users` from `JSON.parse` of the users key with no schema or authorization check.
- `BroadcastChannel.onmessage` at lines 15892–15895 passes arbitrary same-origin data directly to `processIncomingCloudPacket`.
- Injected state is persisted by `saveUsersState` (3475–3494) and, when `state.isAdminLoggedIn`, rebroadcast through `pushCloudSyncPacket`.
- Therefore malicious local state can affect another tab of the same browser (`STATIC_CONFIRMED`) and persist after reload through localStorage (`STATIC_CONFIRMED`). Propagation to other accounts through cloud sync is `LIKELY`, not independently verified: it requires the local admin flag plus a successful publish, which was not performed against production.

Severity Medium remains appropriate.

---

## Attack-chain corrections

1. **F-02 alone does not grant server admin.** It forges the teacher UI in the attacker's own browser. Real cross-user effect requires combining it with F-01's public publish path. `CONFIRMED` locally, `UNVERIFIED` live.
2. **NEW-04 is not a standalone foothold.** It requires script execution first.
3. **Replay damage requires a privileged-looking packet**, not just a duplicate.
4. **Password exposure impact depends on historical publication**, which was not verified.

These corrections reduce unsupported severity claims without changing the remediation priority.
