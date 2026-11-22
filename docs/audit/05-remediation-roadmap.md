# 05 — Remediation roadmap

**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Principle:** fix the root trust boundary, not the individual payload. Client-side checks may remain as UX, but must not be the authority for identity, entitlement, grading or packet validity.

Timelines are suggested sequencing, not measured delivery commitments. Every item lists its verification method so a reviewer can invert the current regression assertion.

## P0 — Immediate containment (0–72 hours)

| Finding ID | Recommended fix | Responsible component | Priority | Verification method | Dependencies | Suggested timeline |
|---|---|---|---|---|---|---|
| F-01 | Stop publishing identity records to public ntfy/KV; minimize snapshots to opaque IDs. | `serializeCompactUser`, cloud sync publishers | P0 | `SC-08`, `F-01-T13`, and a new snapshot test asserting no name/class/Gmail/status. | Authenticated proxy design | 0–48h |
| NEW-17 | Require authentication and row-level authorization on `GET /api/results`; remove direct identifiers from list responses and rate-limit the endpoint. | `/api/results`, result merge path | P0 | Unauthenticated GET must return 401/403 or zero records; student-scoped GET returns only own records. | Identity/role integration | 0–48h |
| NEW-08 | Remove the third-party Google Form sync or replace it with a first-party authenticated endpoint. | `syncActivityLogToGoogleForm` | P0 | Mock dispatcher must record zero third-party POSTs; preserve masking test. | First-party log store | 0–48h |
| NEW-11, NEW-13 | Rotate every bundle-literal signing secret, vault hash, master seal and cloud admin secret; retire old topics. | Bundle literals, deployment secrets | P0 | Old values no longer authenticate or decrypt; new values absent from client source. | Secret inventory | 0–72h |
| NEW-03 | Make nonce mandatory and reject nonce-less packets. | `processIncomingCloudPacket` | P0 | New assertion inverts the nonce-less residual; `SC-05` and `F-01-T06/T07` remain green. | Packet schema decision | 0–72h |

## P1 — Urgent boundary work (1–2 weeks)

| Finding ID | Recommended fix | Responsible component | Priority | Verification method | Dependencies | Suggested timeline |
|---|---|---|---|---|---|---|
| NEW-11 | Delete client-side approval-seal and backend-token minting; issue grants from an authenticated server. | `computeTeacherVipApprovalSealV44`, `BackendVipAuthServiceV44` | P1 | `P4-16` and `IV-01`…`IV-10` inverted: offline forgery must fail. | Server entitlement API | 1–2 weeks |
| F-01 | Authenticate every cloud packet with a server-held key, signed timestamp, mandatory nonce/sequence and bounded replay cache. | `processIncomingCloudPacket` | P1 | `P4-19`, `IV-29`, `IV-32` and `SC-09` inverted to secure assertions. | Server signing service | 1–2 weeks |
| NEW-14 | Remove all ID-name exemptions; make tester status a server-issued, expiring property. | `detectAndBlockStudentVipHackV44`, `verifyRuntimeSecurityIntegrity`, `isAdminExamAttempt` | P1 | `P4-08`, `IV-11`, `IV-13`, `IV-15`, `IV-23` inverted. | Tester identity service | 1–2 weeks |

## P2 — Planned server authority (2–4 weeks)

| Finding ID | Recommended fix | Responsible component | Priority | Verification method | Dependencies | Suggested timeline |
|---|---|---|---|---|---|---|
| F-03 | Fetch VIP/package entitlement from the server on every sensitive action; treat client cache as untrusted. | VIP gates | P2 | `F-03` PoC and `IV-05/IV-06/IV-09` inverted. | Entitlement API from P1 | 2–4 weeks |
| F-05 | Store device registrations server-side; atomic registration and out-of-band verification. | `verifyAndBindStudentDeviceOnLogin`, `setSimulatedDeviceSlot` | P2 | `F-05-T01`…`F-05-T05` inverted. | Identity API | 2–4 weeks |
| F-04 | Remove exam answer keys, seeds and claim token from client assets; grade on the server. | `__ENC_GZ`, grading path | P2 | `F-04-T01` must fail to decode any answer set. | Grading API | 2–4 weeks |
| NEW-07 | Replace wholesale localStorage state replacement with server-verified diffs; validate on read. | `setupCrossTabUserSync` | P2 | `A-04-T02` inverted while VIP stripping remains. | State API | 2–4 weeks |
| NEW-10 | Remove identity-based log suppression; tag rather than drop test activity. | `isAdminExamAttempt`, logging path | P2 | `IV-23` and `P4-09` inverted: all fixtures logged. | First-party log store | 2–4 weeks |

## P3 — Hygiene and long-term improvements

| Finding ID | Recommended fix | Responsible component | Priority | Verification method | Dependencies | Suggested timeline |
|---|---|---|---|---|---|---|
| NEW-06 | Add nonce/hash-based CSP; replace wildcard CORS with an explicit allowlist; preserve XFO and nosniff. | Deployment headers | P3 | `A-03-T01` inverted; header capture shows enforced CSP. | Application script inventory | 1–2 weeks after script changes |
| NEW-05 | Proxy Gemini calls through a server that holds the provider key; remove client key storage. | OCR configuration | P3 | No key in localStorage/sessionStorage/source; requests originate server-side. | Server proxy | 2–3 weeks |
| NEW-02 | Ignore unsigned local BroadcastChannel packets or require server verification before mutation. | Local sync handler | P3 | Rewritten NEW-02 PoC must insert no user record. | P1 packet auth | After P1 |
| F-06 | Relabel anti-cheat as UX only; enforce attempt/time/grading server-side. | UI overlays and grading | P3 | Documentation review plus server-side integrity test. | Grading API | After P2 |

## Completed in V4.8.5 / V4.8.6

F-02 admin authentication is now server-side, NEW-15 offline preview bypass is closed, public keyvalue.immanuel.co writes are disabled, and admin/vault hash literals were removed. Keep the inverted regression assertions in place; do not reopen these items without a new executed bypass.

## Acceptance gate

The repository's `tests/secure_controls.js` currently reports 7 pass / 2 expected failures (SC-07 unsigned user insertion, SC-09 cross-account signed packet). After remediation it must exit 0 with all nine controls passing. Every vulnerability-mapping assertion that currently documents a residual path must be inverted, not deleted, so the fix stays regression-tested.

Re-measure SHA-256 and all line references after each redeploy. The harnesses refuse to run on a changed source until `EXPECTED_SHA` is deliberately updated.
