# Deep Security Investigation — TRITHUC5.0 V4.3.9 (Phase 3)

Target: `https://trithuc500.vercel.app/`
Repository: `Trunghieu2007/trithuc5-client-security-assessment`
Scope: security research, vulnerability discovery, root-cause analysis, and controlled local validation only. No remediation, production modification, or shared-channel publication.

## 0. Evidence refresh

- Repository fetched from `origin`; no commits existed after `d038d16`, so the previous audit was the starting point.
- Fresh cache-busted GET: `2026-11-17T19:23:58Z`, HTTP 200, 14,226,000 bytes.
- SHA-256: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5` — identical to November 17. No deployed fix is observed.
- Version indicators: `TRITHUC5.0 V4.3.9`, `V9.7pro`, `TRITHUC50_V434/V436/V437`, `V4.2.4/4.2.6/4.2.8`.
- Response headers are substantively unchanged: HSTS and `Access-Control-Allow-Origin: *`; no CSP, frame-options, or content-type protection. See `phase3/fetch.info` and `phase3/target.headers`. The raw HTML is kept locally, not published.

Evidence states in this phase: `STATIC_CONFIRMED`, `LOCAL_CONFIRMED`, `STAGING_CONFIRMED`, `LIVE_CONFIRMED`, `UNVERIFIED`, `NOT_REPRODUCIBLE`, `DUPLICATE`. No local simulation is described as live or cross-user proof.

---

## 1. Executive summary

Phase 3 found **three new issues** and **two meaningful strengthenings** of existing findings, while rejecting two plausible attack hypotheses after testing.

- **NEW-08 (High, `LOCAL_CONFIRMED`):** registration passwords are written into activity-log text and posted to a hardcoded third-party Google Form, in addition to being stored in browser activity logs.
- **NEW-09 (Medium, `LOCAL_CONFIRMED`):** the shared storage helper mirrors security state into `window.name` and a non-`HttpOnly`, non-`Secure` cookie.
- **NEW-10 (Medium, `LOCAL_CONFIRMED`):** mutable user fields such as `isAdminTester` suppress activity logging and trigger history purge, giving client-side audit exemption.
- **NEW-01 strengthened (`DUPLICATE` evidence, `LOCAL_CONFIRMED`):** password-bearing per-user KV records use predictable `u_<slug>_<index>` keys and carry the encoded secret in the URL path.
- **NEW-03 strengthened (`LOCAL_CONFIRMED`):** 24h ntfy SSE/poll windows automatically reapply stale privileged packets on normal pull, not only when an attacker replays manually.
- **Not reproduced:** prototype pollution through tombstone `__proto__` values; cross-VM mutation without explicit packet transfer.

The central root cause is unchanged: there is no trusted backend boundary. Authentication, entitlements, device binding, grading, audit logging, and cloud state are all decided from client-writable data and public channels. No finding is `FIXED`. Release remains blocked for any security-bearing use.

---

## 2. New vulnerabilities discovered

See `NEW_FINDINGS.md` for the full ID/title/root-cause/precondition/reproduction/expected/actual/impact/evidence/severity/limitation record for each item.

| ID | Title | Component | Evidence state | Severity |
|---|---|---|---|---|
| NEW-08 | Registration password disclosed to Google Form and activity logs | Registration, logging, GForm sync | `LOCAL_CONFIRMED` + `STATIC_CONFIRMED` | High |
| NEW-09 | Security state mirrored to cookie and `window.name` | `safeStorageSet` helpers | `LOCAL_CONFIRMED` + `STATIC_CONFIRMED` | Medium |
| NEW-10 | Client-controlled admin-tester flag suppresses logging | `isAdminExamAttempt`, logging | `LOCAL_CONFIRMED` + `STATIC_CONFIRMED` | Medium |

### Root-cause grouping

NEW-08 and NEW-01 share one root cause: sensitive authentication data is copied into general-purpose logging/serialization structures without a redaction boundary. NEW-09 and NEW-07 share a storage-trust root cause. NEW-10 and F-02 share client-side identity trust, but NEW-10 uses a distinct user-object flag rather than the admin session.

---

## 3. Existing findings revalidated

| ID | Phase 3 assessment | Evidence state | Change |
|---|---|---|---|
| F-01 | Still valid; all ingestion paths call the same unauthenticated merger | `LOCAL_CONFIRMED`; live effect `UNVERIFIED` | Strengthened by complete path trace |
| F-02 | Still valid but confined to client UI in the measured artifact | `LOCAL_CONFIRMED`; no server API `STATIC_CONFIRMED` | No change |
| F-03 | Self-keyed entitlement check still accepted | `LOCAL_CONFIRMED` | No change |
| F-04 | 15 exams / 330 answers public; no server grading | `LOCAL_CONFIRMED` + `STATIC_CONFIRMED` | No change |
| F-05 | Device identity still client-writable; token can also come from cookie/`window.name` fallback | `LOCAL_CONFIRMED` | Strengthened by NEW-09 overlap |
| F-06 | UX-only controls | `STATIC_CONFIRMED` | No change |
| NEW-01 | Password in public packets; predictable KV keys now measured | `LOCAL_CONFIRMED`; real packets `UNVERIFIED` | Strengthened by P3-04 (`DUPLICATE` classification) |
| NEW-02 | Unsigned active/VIP injection still accepted | `LOCAL_CONFIRMED` | No change |
| NEW-03 | Stale packets applied; 24h polling makes stale replay automatic | `LOCAL_CONFIRMED` | Strengthened by P3-03 |
| NEW-04 | Global bus remains amplifier, not standalone | `STATIC_CONFIRMED` | No change |
| NEW-05 | User-supplied Gemini key in localStorage; no embedded key found | `STATIC_CONFIRMED` | No change |
| NEW-06 | Missing headers/CORS remain informational | `STATIC_CONFIRMED` | No change |
| NEW-07 | Storage events replace state; sensitive values also mirrored by NEW-09 | `LOCAL_CONFIRMED`; cloud spread `UNVERIFIED` | Strengthened |

---

## 4. Attack surface map

See `ATTACK_SURFACE_MAP.md` for the full A–I table and prioritized queue. Summary:

- Cloud ingestion: ntfy SSE, ntfy poll, KV global snapshot, KV per-user records, BroadcastChannel, storage events, global bus. All state-changing paths converge on `processIncomingCloudPacket` or direct state replacement.
- External services: ntfy.sh, keyvalue.immanuel.co, Google Forms, Gemini API, public CDNs. No app-origin auth/admin/grading API appears in the client.
- Static content: one public HTML bundle; no source map, service worker, manifest, or additional hidden exam asset was found.
- Additional classes: XSS, open redirect, IDOR, prototype pollution, and mass assignment were reviewed. No new confirmed high-severity primitive beyond the listed findings.

---

## 5. Reproducible evidence

Artifacts added in this phase:

- `tests/phase3_harness.js` — additive extractor for Google Form, activity logging, and admin-tester functions.
- `tests/phase3_tests.js` — 8 checks, synthetic identities only, local mock fetch.
- `current.headers` fixture added at `research/trithuc5/current.headers` so the historical suite is self-contained.
- `evidence/phase3-test-results.txt` — `TOTAL 8 PASS 8 FAIL 0`.
- `evidence/test-results.txt` — historical suite re-run: `TOTAL 40 PASS 40 FAIL 0`.
- `evidence/secure-controls-phase3.txt` — post-patch controls: `1 PASS / 8 FAIL`, exit 1 as expected before remediation.
- `phase3/fetch.info`, `phase3/target.headers`, `evidence/source-refs-phase3.txt` — fetch provenance and source references.

Test quality:

- P3-01 uses real extracted functions and a mock `fetch` capture; it does not contact Google.
- P3-03 uses the real `pullCloudSyncMessages` with a mock ntfy response; it proves local acceptance of a stale packet, not production delivery.
- P3-06 and P3-07 are negative controls, not vulnerability claims.
- Historical suites were re-run against the same hash and remain unchanged in intent.

---

## 6. Findings ranked by severity and confidence

| Rank | Finding | Severity | Confidence / evidence state |
|---|---|---|---|
| 1 | F-01 cloud packet authorization/tombstones | Critical | `LOCAL_CONFIRMED`; live `UNVERIFIED` |
| 2 | NEW-01 password in public packets (+ P3-04 KV keys) | Critical if real packets exist; code defect High | `LOCAL_CONFIRMED`; real packets `UNVERIFIED` |
| 3 | NEW-02 unsigned active/VIP injection | Critical | `LOCAL_CONFIRMED`; live `UNVERIFIED` |
| 4 | NEW-08 registration password to GForm/log | High | `LOCAL_CONFIRMED` + `STATIC_CONFIRMED` |
| 5 | F-02 admin auth/session | High | `LOCAL_CONFIRMED` UI-only |
| 6 | F-03 VIP integrity | High | `LOCAL_CONFIRMED` |
| 7 | F-04 answer exposure | High | `LOCAL_CONFIRMED` + `STATIC_CONFIRMED` |
| 8 | F-05 device/Gmail lock | Medium | `LOCAL_CONFIRMED` |
| 9 | NEW-03 replay / 24h windows | Medium | `LOCAL_CONFIRMED` |
| 10 | NEW-07 cross-tab storage trust | Medium | `LOCAL_CONFIRMED`; cloud `UNVERIFIED` |
| 11 | NEW-09 storage mirroring | Medium | `LOCAL_CONFIRMED` |
| 12 | NEW-10 audit suppression | Medium | `LOCAL_CONFIRMED` |
| 13 | F-06 anti-cheat | Low | `STATIC_CONFIRMED` |
| 14 | NEW-05 Gemini key | Low | `STATIC_CONFIRMED` |
| 15 | NEW-04 global bus | Informational amplifier | `STATIC_CONFIRMED` |
| 16 | NEW-06 headers/CORS | Informational | `STATIC_CONFIRMED` |

Confidence is evidence-state based, not derived from theoretical impact. No Critical or High finding rests only on source inspection where a behavioral test exists.

---

## 7. Unverified hypotheses

See `UNVERIFIED_HYPOTHESES.md`. The most important remain:

- Real credentials in live ntfy/KV packets: `UNVERIFIED`.
- Real passwords in Google Form responses: `UNVERIFIED`.
- Cross-origin `window.name` disclosure: `UNVERIFIED`.
- DOM XSS: `UNVERIFIED`; no primitive found.
- Production cross-client mutation: `UNVERIFIED`; local behavior is `LOCAL_CONFIRMED`.

---

## 8. Investigation gaps

- No staging environment was provided, so no `STAGING_CONFIRMED` result exists.
- No real browser automation was used; DOM and navigation behavior is source-level only.
- Live ntfy/KV reads failed earlier (timeout / HTTP 503); no real packet content was examined.
- Server code and deployment configuration were not supplied; absence of a backend boundary is established only from the measured client.
- No owner-authorized inspection of third-party form responses was performed.

---

## 9. Recommended next research steps

1. **Owner-authorized credential containment:** rotate potentially exposed passwords; inspect own ntfy/KV history and Google Form responses for `MK:` patterns. Do not access real user records without approval.
2. **Isolated staging reproduction:** two synthetic client instances + dedicated topic to verify live cross-client delivery and 24h replay under controlled conditions.
3. **Real browser test:** synthetic-only test of `window.name` navigation, multi-tab storage events, and DOM controls.
4. **Server boundary review:** obtain deployment/server source and verify whether any operation is actually authorized server-side.
5. **Post-patch acceptance:** extend `secure_controls.js` with NEW-08/09/10 controls (no password in logs/form payload, no secret in cookie/`window.name`, no client flag audit exemption) and require all controls to pass after remediation.

## Decision

Release should remain **blocked**. The source is unchanged, no issue is `FIXED`, and the post-patch controls still fail on the current build.
