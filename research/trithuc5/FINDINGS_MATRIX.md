# Findings matrix — TRITHUC5.0 V4.3.9 (revalidated)

Source SHA-256: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
Fresh cache-busted fetch: `2026-11-17T19:00:09Z`, HTTP 200, 14,226,000 bytes, hash identical.
Evidence levels: `CONFIRMED`, `STATIC_CONFIRMED`, `LIKELY`, `UNVERIFIED`, `FIXED`.

| ID | Component | Existing finding | Current status | Evidence level | Severity | Next action |
|---|---|---|---|---|---|---|
| F-01 | Cloud sync / ntfy / KV | Yes | Valid, expanded | CONFIRMED (local VM); live delivery UNVERIFIED | Critical | Authenticate every packet before any mutation; remove `!adminSig`; add nonce/expiry |
| F-02 | Admin auth / session | Yes | Valid, downgraded | CONFIRMED + STATIC_CONFIRMED | High | Move auth and privilege checks to server; rotate exposed material |
| F-03 | VIP / integrity / entitlement | Yes | Valid | CONFIRMED | High | Make server authoritative for entitlement; remove `_sig` as security control |
| F-04 | Exam answer exposure | Yes | Valid, quantified | CONFIRMED (count and payload); server grading absent STATIC_CONFIRMED | High | Remove `correctAnswers` from client payload; server-side grading |
| F-05 | Device / Gmail lock | Yes | Valid | CONFIRMED | Medium | Server-side device registry; remove simulation controls |
| F-06 | Anti-cheat / DOM | Yes | Valid but Low | STATIC_CONFIRMED | Low | Relabel as UX; add server-side timing and grading if integrity matters |
| NEW-01 | Password in cloud packets | No | Valid, scope narrowed | CONFIRMED (serialization + publication wiring); live/real passwords UNVERIFIED | Critical | Remove `p` field; rotate passwords that may have been broadcast |
| NEW-02 | Unauthenticated user injection | No | Valid | CONFIRMED (local VM); live cross-client effect UNVERIFIED | Critical | Authenticate user-bearing packets; ignore `type` as trust signal |
| NEW-03 | Replay / expiry / nonce | No | Valid, claim narrowed | CONFIRMED | Medium | Signed timestamp + nonce + bounded replay cache |
| NEW-04 | Global cloud bus bridge | No | Downgraded to amplifier | STATIC_CONFIRMED | Informational | Remove from production bundle after a script-execution issue is addressed |
| NEW-05 | Gemini key in localStorage | No | Valid, scope narrowed | STATIC_CONFIRMED | Low | Proxy through server; no embedded live key found |
| NEW-06 | Missing security headers | No | Valid | STATIC_CONFIRMED | Informational | Add CSP, frame and content-type headers; narrow CORS |
| NEW-07 | Cross-tab storage trust | No | Valid, expanded | CONFIRMED (tab replacement + persistence in VM); cloud propagation LIKELY | Medium | Validate state; stop replacing security state from storage events |
| NEW-08 | Password in activity log / Google Form | No | New in Phase 3 | LOCAL_CONFIRMED + STATIC_CONFIRMED; live form UNVERIFIED | High | Remove password from log strings; review form retention; server-side audit log |
| NEW-09 | Secret mirroring to cookie / window.name | No | New in Phase 3 | LOCAL_CONFIRMED + STATIC_CONFIRMED; cross-origin navigation UNVERIFIED | Medium | Stop mirroring security state; use HttpOnly/Secure cookies where needed |
| NEW-10 | Admin-tester audit suppression | No | New in Phase 3 | LOCAL_CONFIRMED + STATIC_CONFIRMED | Medium | Authenticate test identities server-side; stop trusting mutable user flags |

## Revalidation changes

- **F-02: Critical → High.** Forging the session gives teacher UI state and client-side actions
  in the attacker's own browser. There is no backend administrative API in the measured client,
  so it is not equivalent to a server-side admin compromise. Cross-user effect requires F-01.
- **NEW-04: Low → Informational.** The global bus requires prior script execution and does not
  bypass `processIncomingCloudPacket`. It is an exploit amplifier, not a standalone finding.
- **NEW-03 claim narrowed.** Duplicate identical packets are accepted but do not repeatedly
  mutate state. Demonstrated damage requires a stale privileged packet with `status:'active'`.
- **NEW-01 claim narrowed.** Source-level publication is confirmed; presence of real passwords
  in historical public packets is unverified.
- **NEW-07 expanded.** A-04-T02 confirms cross-VM tab replacement and persistence; propagation
  through cloud sync remains `LIKELY`.
- **Phase 3 additions.** NEW-08, NEW-09 and NEW-10 were added with `LOCAL_CONFIRMED` evidence.
  P3-03 strengthens NEW-03 (24h automatic replay window). P3-04 is classified `DUPLICATE` of
  NEW-01 and adds predictable KV key evidence. P3-06/P3-07 are `NOT_REPRODUCIBLE` negative controls.
  Phase 3 uses the states `LOCAL_CONFIRMED`, `STATIC_CONFIRMED`, `UNVERIFIED`, `NOT_REPRODUCIBLE`
  and `DUPLICATE`; earlier labels in this table remain for historical continuity.

## Status notes

- No finding is `FIXED`; the source hash is unchanged from the previous assessment.
- F-01, F-02, F-03, F-04, F-05 and NEW-07 were reproduced dynamically in the isolated harness.
- F-06, NEW-04, NEW-05 and NEW-06 are source-established only; no dynamic browser test was run.
- Live ntfy/KV observation failed (GET timeout, KV HTTP 503), so no real packet content or real
  user data appears in the evidence set.

## Test coverage map

| Finding | Tests |
|---|---|
| F-01 | F-01-T01 … T14, T15 … T17 |
| F-02 | F-02-T01 … T05 |
| F-03 | F-03-T01 … T03 |
| F-04 | F-04-T01 … T03 |
| F-05 | F-05-T01 … T05 |
| F-06 | F-06-T01 |
| NEW-01 | F-01-T13, SC-08 |
| NEW-02 | F-01-T02, T04, T11, SC-07, SC-09 |
| NEW-03 | F-01-T06, T07, T15, T16, T17, SC-04, SC-05 |
| NEW-04 | F-01-T14 |
| NEW-05 | A-02-T01 |
| NEW-06 | A-03-T01 |
| NEW-07 | A-04-T01, A-04-T02 |
| NEW-08 | P3-01 |
| NEW-09 | P3-02 |
| NEW-10 | P3-05 |
| Harness integrity | H-01 |
| Post-patch controls | SC-01 … SC-09 |
| Phase 3 negative controls | P3-06, P3-07 |

Historical suite: **40 checks, 40 pass, 0 fail**, exit 0 (`evidence/test-results.txt`).
Phase 3 suite: **8 checks, 8 pass, 0 fail**, exit 0 (`evidence/phase3-test-results.txt`).
Post-patch controls on the current build: **1 pass, 8 expected failures**, exit 1
(`evidence/secure-controls-before-patch.txt`, `evidence/secure-controls-phase3.txt`). All nine must pass after remediation.
