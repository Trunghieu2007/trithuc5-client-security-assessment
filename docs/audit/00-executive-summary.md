# 00 — Executive summary

**Target:** `https://trithuc500.vercel.app/`  
**Owner authorization:** client-side-only assessment; no production write.  
**Assessment period:** 2026-11-18 → 2026-11-22; final source re-pin 2026-11-22.  
**Build under test:** V4.8.0, SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`, 9,115,471 bytes / 34,599 lines, fetched 2026-11-22T04:48:27Z.  
**Overall risk:** High. Release remains blocked for any use case that depends on account identity, entitlement or exam results.

## Scope

The assessment covered the public single-file client application, its response headers, and the client-side functions that implement admin login, VIP entitlement, cloud synchronization, device binding, activity logging and exam vault access. Vercel internals, ntfy.sh, keyvalue.immanuel.co, Google Forms, Gemini and GitHub API services were not actively tested. Live channel content is UNVERIFIED.

## Findings at a glance

| Severity | Count | Representative finding |
|---|---:|---|
| Critical | 1 | NEW-11 — client-computable VIP approval seal |
| High | 5 | F-01, F-03, NEW-13, NEW-14, NEW-15 |
| Medium | 5 | F-02, F-05, NEW-07, NEW-08, NEW-10 |
| Low | 5 | F-04, NEW-02, NEW-03, NEW-05, F-06 |
| Informational | 1 | NEW-06 — partial header hardening |

Total active/residual findings: **17**. Five earlier issues are verified fixed in V4.8.0 and are preserved as regression assertions; see `04-findings-summary.md`.

## Key risks

1. The teacher approval seal, integrity signature, admin session signature and exam vault seed are all derived from data shipped to the browser. The full VIP chain was executed offline against real extracted functions with zero server calls (`IV-01`…`IV-10`, `P4-16`).
2. V4.8.0 fixed genuine exposure paths — password, seal and backend token are blanked in public packets; sensitive keys no longer mirror to weak stores; unsigned tombstones are rejected — but identity records still leave the client through public channels.
3. Admin preview plus a client-minted session re-enables every VIP gate, providing a second independent entitlement bypass (NEW-15).
4. Exam answers are recoverable from the shipped gzip/XOR vault: 15 exams and 330 answer entries were decoded locally (F-04).

## Business impact

Any user can grant themselves VIP entitlements in their own browser, obtain answer keys, and reach local admin functionality without a server-side audit trail. Public sync channels still carry student identity fields. The measured app should not be treated as protecting paid access, privileged roles, or exam integrity.

## Recommended priorities

- **P0 / immediate:** stop publishing identity records, stop third-party form logging, rotate bundle-literal secrets and retire old topics.
- **P1 / urgent:** remove client-minted approval seals and authenticate every cloud packet with a server-held key.
- **P2 / planned:** move admin authentication, entitlement, device registration and grading to a server-authoritative API.
- **P3 / hygiene:** add CSP, narrow CORS, proxy provider keys and relabel anti-cheat as UX.

Full owner responsibilities, dependencies and verification methods are in `05-remediation-roadmap.md`.

## Confidence and limitations

All release-blocking findings are Confirmed by executed local evidence or measured headers. No production account was used, no packet was published, and no live cross-client effect was attempted. Server-side enforcement could not be confirmed because no same-origin backend was observed. CVSS v4.0 scores are intentionally not assigned; see `03-methodology.md`.
