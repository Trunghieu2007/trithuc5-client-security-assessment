# Findings matrix — TRITHUC5.0 V4.3.9

Source SHA-256: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
Evidence levels: `CONFIRMED`, `STATIC_CONFIRMED`, `LIKELY`, `UNVERIFIED`, `FIXED`.

| ID | Component | Existing finding | Current status | Evidence level | Severity | Next action |
|---|---|---|---|---|---|---|
| F-01 | Cloud sync / ntfy / KV | Yes | Valid, expanded | CONFIRMED | Critical | Authenticate every packet before any mutation; remove `!adminSig`; add nonce/expiry |
| F-02 | Admin auth / session | Yes | Valid | CONFIRMED + STATIC_CONFIRMED | Critical | Move auth and privilege checks to server; rotate exposed material |
| F-03 | VIP / integrity / entitlement | Yes | Valid | CONFIRMED | High | Make server authoritative for entitlement; remove `_sig` as security control |
| F-04 | Exam answer exposure | Yes | Valid, quantified | CONFIRMED | High | Remove `correctAnswers` from client payload; server-side grading |
| F-05 | Device / Gmail lock | Yes | Valid | CONFIRMED | Medium | Server-side device registry; remove simulation controls |
| F-06 | Anti-cheat / DOM | Yes | Valid but Low | STATIC_CONFIRMED | Low | Relabel as UX; add server-side timing and grading if integrity matters |
| NEW-01 | Password in cloud packets | No | New | CONFIRMED (code), UNVERIFIED (live packets) | Critical | Remove `p` field; rotate passwords that may have been broadcast |
| NEW-02 | Unauthenticated user injection | No | New | CONFIRMED | Critical | Authenticate user-bearing packets; ignore `type` as trust signal |
| NEW-03 | Replay / expiry / nonce | No | New | CONFIRMED | Medium | Signed timestamp + nonce + bounded replay cache |
| NEW-04 | Global cloud bus bridge | No | New | STATIC_CONFIRMED | Low | Remove from production bundle |
| NEW-05 | Gemini key in localStorage | No | New | STATIC_CONFIRMED | Low | Proxy through server; no embedded live key found |
| NEW-06 | Missing security headers | No | New | STATIC_CONFIRMED | Informational | Add CSP, frame and content-type headers; narrow CORS |
| NEW-07 | Cross-tab storage trust | No | New | STATIC_CONFIRMED | Medium | Validate state; stop replacing security state from storage events |

## Status notes

- No finding is `FIXED`; the source hash is unchanged from the previous assessment.
- F-01, F-02, F-03, F-04 and F-05 were reproduced dynamically in the isolated harness.
- F-06 and NEW-04/05/06/07 are source-established only; no dynamic browser test was run.
- Live ntfy/KV observation failed (GET timeout, KV HTTP 503), so no real packet content or real
  user data appears in the evidence set.

## Test coverage map

| Finding | Tests |
|---|---|
| F-01 | F-01-T01 … F-01-T14 |
| F-02 | F-02-T01 … F-02-T05 |
| F-03 | F-03-T01 … F-03-T03 |
| F-04 | F-04-T01 … F-04-T03 |
| F-05 | F-05-T01 … F-05-T05 |
| F-06 | F-06-T01 |
| NEW-01 | F-01-T13 |
| NEW-02 | F-01-T02, F-01-T04, F-01-T11 |
| NEW-03 | F-01-T06, F-01-T07 |
| NEW-04 | F-01-T14 |
| NEW-05 | A-02-T01 |
| NEW-06 | A-03-T01 |
| NEW-07 | A-04-T01 |

Final suite result: 35 tests, 35 pass, 0 fail. See `evidence/test-results.txt`.
