# 04 — Findings summary

**Build:** V4.8.6 / SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185`  
**Assessment period:** 2026-11-18 → 2026-11-22, final re-pin 2026-11-22.  
**Active/residual findings:** 16.  
**Release decision:** blocked. The measured trust boundary remains in the browser.

## Findings by severity

| Severity | Count |
|---|---:|
| Critical | 1 |
| High | 5 |
| Medium | 4 |
| Low | 5 |
| Informational | 1 |

## Active and residual findings

| ID | Title | Severity | Confidence | Status |
|---|---|---|---|---|
| NEW-11 | VIP approval seal is derived from bundle-literal secrets | Critical | Confirmed | Open |
| F-01 | Cloud sync publishes identity records; signed tombstone path remains offline-forgeable | High | Confirmed | Partially Fixed |
| F-03 | VIP entitlement is decided entirely in client-side JavaScript | High | Confirmed | Open |
| NEW-13 | Tamper detector adds a structural invariant but still trusts bundle secrets | High | Confirmed | Partially Fixed |
| NEW-14 | Privileged-id exemptions remain after a partial detector fix | High | Confirmed | Partially Fixed |
| F-05 | Device lock and Gmail binding are enforced from client-owned fields | Medium | Confirmed | Partially Fixed |
| NEW-07 | Cross-tab state replacement still copies non-VIP fields from writable storage | Medium | Confirmed | Partially Fixed |
| NEW-10 | Admin-tester identities still suppress audit logging | Medium | Confirmed | Partially Fixed |
| NEW-08 | Activity logs still reach a third-party Google Form; password masking is fixed | Medium | Confirmed | Partially Fixed |
| F-04 | Exam answers are recoverable from a bundle-seeded client vault | Low | Confirmed | Open |
| NEW-02 | Unsigned cloud packet injection still inserts a pending local user | Low | Confirmed | Open |
| F-06 | Anti-cheat controls are UX-only | Low | Confirmed | Open |
| NEW-03 | Replay and age guards are present but the packet nonce is optional | Low | Confirmed | Partially Fixed |
| NEW-05 | Gemini OCR key moved to sessionStorage but remains same-origin readable | Low | Confirmed | Partially Fixed |
| NEW-06 | Response headers are partially hardened; CSP and narrow CORS remain absent | Informational | Confirmed | Partially Fixed |
| NEW-17 | Unauthenticated results API exposes student result records | High | Confirmed | Open |

Confidence uses the taxonomy in `03-methodology.md`: **Confirmed** means directly reproduced or measured. No Likely or False Positive item is used for a release-blocking claim here.

## Fixed and verified in V4.8.6

| Earlier issue | Measured status | Regression proof |
|---|---|---|
| NEW-01 password in compact wire format | Fixed — `p: ''` | `F-01-T13`, `P3-04`, `SC-08` |
| NEW-04 internal cloud bus bridge | Fixed — removed from production | `F-01-T14` |
| NEW-09 sensitive weak-store mirroring | Fixed — sensitive-key filter and `SameSite=Strict` | `P3-02`, `IV-24` |
| NEW-12 boot auto-seal | Fixed — unsealed VIP records stripped at boot | `P4-14`, `IV-10` |
| NEW-16 seal / backend token broadcast | Fixed — blanked on write and ignored on read | `F-01-T13`, `P3-04` |
| Unsigned F-01 tombstone merge | Fixed — admin signature required | `P4-19`, `IV-29`, `F-01-T12/T16` |
| F-02 client admin session forgery | Fixed in V4.8.5 — server login, ephemeral salt, remembered session cleared | `F-02-T01/T05`, `P4-11`, `IV-20` |
| NEW-15 offline admin-preview bypass | Fixed in V4.8.5 — preview flag cleared without server-verified session | `P4-10`, `IV-16`-`IV-19` |
| Public keyvalue.immanuel.co user sync | Disabled in V4.8.5 — `CLOUD_KV_DISABLED_V485 = true` | `P3-04`, static source assertion |

These are preserved as regression assertions in the current suites. They are barriers, not a complete trust boundary.

## Validation matrix

| Suite | Checks | Result |
|---|---:|---|
| `tests/run_all.js` | 41 | 41 pass / 0 fail |
| `tests/phase3_tests.js` | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 60 | 60 pass / 0 fail |
| `tests/independent_verification.js` | 36 | 36 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 7 pass / 2 expected failures before remediation |

Detailed execution results are in `06-retest-results.md`; sanitized logs are in `evidence/`.
