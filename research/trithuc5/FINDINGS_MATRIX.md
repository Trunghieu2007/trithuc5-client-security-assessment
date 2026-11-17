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
| Harness integrity | H-01 |
| Post-patch controls | SC-01 … SC-09 |

Authoritative suite: **40 checks, 40 pass, 0 fail**, exit 0 (`evidence/test-results.txt`).
Post-patch controls on the current build: **1 pass, 8 expected failures**, exit 1
(`evidence/secure-controls-before-patch.txt`). All nine must pass after remediation.
