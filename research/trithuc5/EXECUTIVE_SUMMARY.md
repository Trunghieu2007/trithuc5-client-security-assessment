# Executive summary — TRITHUC5.0 V4.8.6 (current live build)

**Target:** `https://trithuc500.vercel.app/`  
**Owner authorization:** client-side-only assessment; no production write.  
**Assessment period:** 2026-11-18 → 2026-11-22; final source re-pin 2026-11-22.  
**Build under test:** V4.8.6, SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185` (9,120,257 bytes, 34,677 lines), fetched 2026-11-22T10:36:26Z.  
**Overall risk:** High. Release remains blocked for any use case that depends on account identity, entitlement, exam integrity, or result privacy.

## Scope

The assessment covered the public single-file client application, its response headers, the client-side functions implementing admin login, VIP entitlement, cloud synchronization, device binding, activity logging and exam vault access, and one read-only GET to the new same-origin results endpoint. Vercel internals, ntfy.sh, keyvalue.immanuel.co, Google Forms, Gemini and server-side implementation details were not actively tested. Live ntfy content remains UNVERIFIED.

## Verified fixes in V4.8.5 / V4.8.6

| Earlier weakness | Current status | Proof |
|---|---|---|
| F-02 client-side admin auth / offline session forgery | **Fixed** — `/api/admin/login` server session, per-window ephemeral salt, no admin/vault hash literals, remembered session cleared at boot | `F-02-T01/T05`, `P4-11`, `IV-20` |
| NEW-15 offline admin-preview bypass | **Fixed** — orphan preview flag cleared; gates require a server-verified admin session | `P4-10`, `IV-16`…`IV-19` |
| Public keyvalue.immanuel.co user sync | **Disabled** — `CLOUD_KV_DISABLED_V485 = true` | `P3-04`, static assertion |
| Password, seal and backend token in public wire format | **Fixed** — blank fields | F-01-T13, `P3-04`, SC-08 |
| Unsigned tombstone merge | **Fixed** — verified admin signature required | `P4-19`, IV-29, F-01-T12/T16 |
| Weak-store mirroring, internal cloud bus, boot auto-seal | **Fixed** | `P3-02`, F-01-T14, `P4-14`, IV-10 |

These fixes were executed as inverted regression assertions, not accepted from code review alone.

## New in V4.8.6

**NEW-17 — unauthenticated results API (High).** The new `GET /api/results` endpoint returned HTTP 200 to a request with no cookie and no Authorization header. The response contained two records with student-identifying fields (`username`, `name`, `class`, `school`, `score`, `examTitle`, timestamps and anti-cheat counters). Values were not printed, stored or replicated. The corresponding `POST` path was not tested because it would write to production; its authorization model is UNVERIFIED.

## Active findings at a glance

| Severity | Count | Representative finding |
|---|---:|---|
| Critical | 1 | NEW-11 — client-computable VIP approval seal |
| High | 5 | F-01, F-03, NEW-13, NEW-14, NEW-17 |
| Medium | 4 | F-05, NEW-07, NEW-08, NEW-10 |
| Low | 5 | F-04, NEW-02, NEW-03, NEW-05, F-06 |
| Informational | 1 | NEW-06 — partial header hardening |

Total active/residual findings: **16**. Full catalogue: [`FINDINGS.md`](FINDINGS.md).

## Key risks

1. The teacher approval seal, integrity signature and exam vault seed remain derived from data shipped to the browser. The full VIP chain was executed offline against real extracted functions with zero server calls (`IV-01`…`IV-10`, `P4-16`).
2. `GET /api/results` exposes student result records to anonymous readers (NEW-17).
3. Public ntfy topics still carry compact identity records; the public KV path is now disabled, but the admin packet signature is still a bundle literal (F-01).
4. Exam answers are recoverable from the shipped gzip/XOR vault: 15 exams and 330 answer entries were decoded locally (F-04).

## Business impact

Any user able to run script in the app origin can grant themselves VIP entitlements in their own browser and obtain answer keys without a server-side audit trail. Student result records are readable without authentication. Public sync channels still carry identity fields. The app should not be treated as protecting paid access, privileged roles, exam integrity, or result privacy.

## Recommended priorities

- **P0 / immediate:** authenticate `/api/results` with row-level scoping; stop publishing identity records to public topics; stop third-party form logging; rotate bundle-literal secrets and retire old topics.
- **P1 / urgent:** remove client-minted approval seals and authenticate every cloud packet with a server-held key.
- **P2 / planned:** move entitlement, device registration and grading to a server-authoritative API; keep the now-fixed admin login contract covered by regressions.
- **P3 / hygiene:** add CSP, narrow CORS, proxy provider keys and relabel anti-cheat as UX.

Full ownership, dependencies and verification methods: [`REMEDIATION_PLAN.md`](REMEDIATION_PLAN.md).

## Confidence and limitations

All release-blocking findings are Confirmed by executed local evidence, a read-only endpoint probe, or measured headers. No production account was used, no packet was published, and no live cross-client effect was attempted. The only new server-side request was one unauthenticated GET to `/api/results`; no write was sent. Server-side credential verification, cookie flags and POST authorization were not directly tested. CVSS v4.0 scores are intentionally not assigned; see `03-methodology.md` in the formal audit package.
