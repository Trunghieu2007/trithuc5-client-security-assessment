# 00 — Executive summary

**Target:** `https://trithuc500.vercel.app/`  
**Owner authorization:** client-side-only assessment; no production write.  
**Assessment period:** 2026-11-18 → 2026-11-22; final source re-pin 2026-11-22.  
**Build under test:** V5.4.6, SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`, 2,777,970 bytes / 39,205 lines, fetched 2026-11-24T12:14:00Z.  
**Overall risk:** High. Release remains blocked for any use case that depends on account identity, entitlement or exam results.

## Scope

The assessment covered the public single-file client application, its response headers, and the client-side functions that implement admin login, VIP entitlement, cloud synchronization, device binding, activity logging and exam vault access. Vercel internals, ntfy.sh, keyvalue.immanuel.co, Google Forms, Gemini and GitHub API services were not actively tested. Live channel content is UNVERIFIED.

## Findings at a glance

| Severity | Count | Representative finding |
|---|---:|---|
| Critical | 1 | NEW-11 — client-computable VIP approval seal |
| High | 5 | F-01, F-03, NEW-13, NEW-14, NEW-17 |
| Medium | 4 | F-05, NEW-07, NEW-08, NEW-10 |
| Low | 5 | F-04, NEW-02, NEW-03, NEW-05, F-06 |
| Informational | 1 | NEW-06 — partial header hardening |

Total active/residual findings: **16**. Seven earlier issues are verified fixed or disabled and are preserved as regression assertions; see `04-findings-summary.md`.

## Key risks

1. The teacher approval seal, integrity signature and exam vault seed are still derived from data shipped to the browser. The full VIP chain was executed offline against real extracted functions with zero server calls (`IV-01`…`IV-10`, `P4-16`). The V4.8.5 admin session salt is now per-window and the old admin hashes are gone.
2. V4.8.5/V4.8.6 fixed genuine exposure paths — public KV writes are disabled, password/seal/token are blanked in remaining packets, admin login is server-side, and unsigned tombstones are rejected — but identity records still leave the client through public ntfy channels and a new server results API.
3. A new unauthenticated `GET /api/results` returned student result records in a read-only probe (NEW-17). This is a server-side exposure, not merely a client-side trust issue.
4. Exam answers are recoverable from the shipped gzip/XOR vault: 15 exams and 330 answer entries were decoded locally (F-04).

## Business impact

Any user can grant themselves VIP entitlements in their own browser, obtain answer keys, and reach local admin functionality without a server-side audit trail. Public sync channels still carry student identity fields. The measured app should not be treated as protecting paid access, privileged roles, or exam integrity.

## Recommended priorities

- **P0 / immediate:** authenticate `/api/results`, stop publishing identity records to public topics, stop third-party form logging, rotate bundle-literal secrets and retire old topics.
- **P1 / urgent:** remove client-minted approval seals and authenticate every cloud packet with a server-held key.
- **P2 / planned:** move entitlement, device registration and grading to a server-authoritative API; keep the new admin login contract covered by regressions.
- **P3 / hygiene:** add CSP, narrow CORS, proxy provider keys and relabel anti-cheat as UX.

Full owner responsibilities, dependencies and verification methods are in `05-remediation-roadmap.md`.

## Confidence and limitations

All release-blocking findings are Confirmed by executed local evidence, a read-only endpoint probe, or measured headers. No production account was used, no packet was published, and no live cross-client effect was attempted. The only new server-side request was one unauthenticated GET to `/api/results`; no write was sent. CVSS v4.0 scores are intentionally not assigned; see `03-methodology.md`.
