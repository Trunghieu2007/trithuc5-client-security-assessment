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
| NEW-11 | V4.4 VIP approval seal uses a client-side secret | No | New in Phase 4 | LOCAL_CONFIRMED (real V4.4 functions, end-to-end) | Critical | Move VIP entitlement to a server-authoritative API; remove seal secrets from the bundle |
| NEW-12 | Boot normalizer auto-grants the approval seal to forged records | No | New in Phase 4 | LOCAL_CONFIRMED | Critical | Never mint approval artifacts client-side; require a server-issued, server-validated grant |
| NEW-13 | V4.4 tamper detection is a keyword heuristic | No | New in Phase 4 | LOCAL_CONFIRMED | High | Replace substring heuristics with structural invariants checked against server-advertised state |
| NEW-14 | Privileged id exemption bypasses detector and runtime integrity check | No | New in Phase 4 | LOCAL_CONFIRMED | High | Remove blanket id exemptions; scope them to a server-verified admin session |
| NEW-15 | Admin preview "unlock all" bypasses every VIP package gate | No | New in Phase 4 | LOCAL_CONFIRMED | High | Gate preview mode server-side; do not short-circuit entitlement checks from client flags |
| NEW-16 | Cloud packets now carry `_adminVipSeal` and `_backendVipToken` | No | New in Phase 4 | STATIC_CONFIRMED | High | Strip approval artifacts from cloud serialisation; treat public topics as untrusted |

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
- **Phase 4 (post-patch build, SHA-256 `33be09d7…`).** The owner deployed a new build with a
  dedicated anti-hack layer (`_adminVipSeal`, `BackendVipAuthServiceV44`,
  `detectAndBlockStudentVipHackV44`, rewritten boot normalizer). Two V4.3.9 weaknesses were
  genuinely hardened: the admin session now requires a matching `sig` (line 2758) and unsigned
  cloud packets are downgraded to `pending`/non-VIP (lines 3637-3653). However the patch is
  entirely client-side: NEW-11 through NEW-16 show the approval seal is computable from bundled
  literals, the boot normalizer mints the seal itself, the detector is a keyword heuristic,
  privileged ids skip all checks, admin preview short-circuits every gate, and the approval
  artifact is now broadcast in every cloud packet. A complete local VIP bypass was verified
  end-to-end (`phase4_payload_validation.js`, 14/14). See `PHASE4_BYPASS_ANALYSIS.md`.
- **F-02 (V4.4).** The "session without `sig` is accepted" path is closed. The session
  signature salt `TRITHUC50_ADM_SALT_V27` remains a bundle literal, so the signature is still
  reproducible offline — hardened, not fixed.

## Status notes

- No finding is `FIXED`. The source hash changed between phases: the current live build is
  SHA-256 `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868` (V4.4,
  14,554,401 bytes), fetched 2026-11-18T09:02:20Z. The Phase 4 harness pins this hash and
  fails loudly if the build changes again.
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
| NEW-11 | P4-03, P4-11, P4-12 |
| NEW-12 | P4-14, P4-16 |
| NEW-13 | P4-01, P4-02, P4-16 |
| NEW-14 | P4-08, P4-09 |
| NEW-15 | P4-10, P4-11 |
| NEW-16 | source read: `serializeCompactUser` lines 3391-3392 |
| Harness integrity | H-01 |
| Post-patch controls | SC-01 … SC-09 |
| Phase 3 negative controls | P3-06, P3-07 |

Historical suite: **40 checks, 40 pass, 0 fail**, exit 0 (`evidence/test-results.txt`).
Phase 3 suite: **8 checks, 8 pass, 0 fail**, exit 0 (`evidence/phase3-test-results.txt`).
Post-patch controls on the current build: **1 pass, 8 expected failures**, exit 1
(`evidence/secure-controls-before-patch.txt`, `evidence/secure-controls-phase3.txt`). All nine must pass after remediation.
