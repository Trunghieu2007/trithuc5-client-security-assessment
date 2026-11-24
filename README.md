# TRITHUC5.0 — client-side security assessment (V5.4.6 current build)

Authorized assessment of `https://trithuc500.vercel.app/`. No server was modified, no account was created, no production packet was sent, and no real user data was retained. The only new production request was one unauthenticated, read-only GET to `/api/results`; only status, record count and field names were kept.

**Build under test:** SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c`, 2,777,970 bytes, 39,205 lines, fetched 2026-11-24T12:14:00Z. The measured V4.8.6 → V5.4.6 delta is documented in [`research/trithuc5/PHASE5_UPDATE.md`](research/trithuc5/PHASE5_UPDATE.md).

**Frontend recon note:** a later fetch found the live site at **V5.1.1** (`c4295c9924391721d8a552a6d6723a1b61928d2cee371b75b33af77bbdb62104`) and then **V5.1.4**. Both builds have their own recon baseline at [`docs/frontend-recon/`](docs/frontend-recon/), including a full admin-component extraction (9 admin tabs, 28 screenshots, 34 render function sources) obtained with a local-only admin mock. Security findings below remain pinned to V5.4.6 and have not been retested against V5.1.1/V5.1.4.

## Headline result

V4.8.5/V5.4.6 fixed real issues: admin login is server-side, the admin/vault hash literals are gone, the admin session salt is per-window, remembered admin sessions are cleared at boot, public keyvalue.immanuel.co writes are disabled, password/seal/backend-token fields are blanked in remaining wire formats, password-like log details are masked, sensitive keys no longer mirror to weak stores, unsigned tombstones are rejected, and headers were hardened further.

The core entitlement trust boundary still did not move. The approval seal, integrity signature and exam vault seed remain client-derivable, and a full VIP bypass is still reproducible offline by forging `_sig` and the seal. A new `GET /api/results` returned student result records without authentication. Release should remain **blocked** as a system that protects accounts, entitlements, exam integrity, or result privacy.

| Severity | Finding |
|---|---|
| Critical | NEW-11 VIP approval seal computed from bundle-literal material |
| High | F-01 cloud sync still publishes identity records over public ntfy; signed admin path still offline-forgeable |
| High | F-03 VIP entitlement decided entirely client-side |
| High | NEW-13 structural detector still trusts bundle-literal sig/seal |
| High | NEW-14 `gv_test` / runtime exemptions remain |
| High | NEW-17 unauthenticated `GET /api/results` exposes student result records — **new** |
| Medium | F-05 device/Gmail lock enforced only in client JavaScript |
| Medium | NEW-07 cross-tab state replacement still copies non-VIP fields |
| Medium | NEW-08 activity logs still reach a third-party Google Form (password masking fixed) |
| Medium | NEW-10 admin-tester flag still suppresses audit logging |
| Low | F-04 exam answers hidden in a bundle-seeded gzip/XOR vault (15 exams / 330 answers recovered offline) |
| Low | NEW-02 unsigned packet injection still inserts a pending local user; tombstone path fixed |
| Low | F-06 anti-cheat is UX only |
| Low | NEW-03 nonce/age guard present but nonce optional |
| Low | NEW-05 Gemini key moved to `sessionStorage` |
| Informational | NEW-06 CSP/CORS still weak; XFO/nosniff/referrer/permissions headers present |
| Fixed | F-02 client admin session forgery; NEW-15 offline admin-preview bypass; NEW-01; NEW-04; NEW-09; NEW-12; NEW-16; unsigned F-01 tombstone; public KV writes |

## Formal audit package (`docs/audit/`)

A structured, evidence-first package is available at [`docs/audit/`](docs/audit/):

- [`00-executive-summary.md`](docs/audit/00-executive-summary.md) — scope, risk, counts, key risks and priorities.
- [`01-attack-surface.md`](docs/audit/01-attack-surface.md) — measured stack, channels and asset classification.
- [`02-configuration-audit.md`](docs/audit/02-configuration-audit.md) — headers, TLS, cookies, CORS and deployment observations.
- [`03-methodology.md`](docs/audit/03-methodology.md) — evidence rules, classification and boundaries.
- [`04-findings-summary.md`](docs/audit/04-findings-summary.md) and [`findings/`](docs/audit/findings/) — 18-section reports per finding.
- [`poc/`](docs/audit/poc/) — one folder per finding with expected/observed behavior.
- [`05-remediation-roadmap.md`](docs/audit/05-remediation-roadmap.md) — P0–P3 ownership, verification and dependencies.
- [`06-retest-results.md`](docs/audit/06-retest-results.md) — V5.4.6 retest status and regression evidence.
- [`evidence/`](docs/audit/evidence/) — sanitized logs, source pin and reproduction commands.

## Formal audit package (`docs/audit/`)

A structured, evidence-first package is available at [`docs/audit/`](docs/audit/):

- [`00-executive-summary.md`](docs/audit/00-executive-summary.md) — scope, risk, counts, key risks and priorities.
- [`01-attack-surface.md`](docs/audit/01-attack-surface.md) — measured stack, channels and asset classification.
- [`02-configuration-audit.md`](docs/audit/02-configuration-audit.md) — headers, TLS, cookies, CORS and deployment observations.
- [`03-methodology.md`](docs/audit/03-methodology.md) — evidence rules, classification and boundaries.
- [`04-findings-summary.md`](docs/audit/04-findings-summary.md) and [`findings/`](docs/audit/findings/) — 18-section reports per finding.
- [`poc/`](docs/audit/poc/) — one folder per active/residual finding with expected/observed behavior.
- [`05-remediation-roadmap.md`](docs/audit/05-remediation-roadmap.md) — P0–P3 ownership, verification and dependencies.
- [`06-retest-results.md`](docs/audit/06-retest-results.md) — V5.4.6 retest status and regression evidence.
- [`evidence/`](docs/audit/evidence/) — sanitized logs, source pin and reproduction commands.

## Frontend reconnaissance package (`docs/frontend-recon/`)

Separate from the V5.4.6 security assessment, a read-only frontend baseline of the live **V5.1.1** build is available at [`docs/frontend-recon/`](docs/frontend-recon/):

- [`README.md`](docs/frontend-recon/README.md) — scope, build pin, artifact index, safety boundary.
- [`SOURCE_PIN.md`](docs/frontend-recon/SOURCE_PIN.md) — V5.4.6 vs V5.1.1 pins and observed frontend delta.
- [`ROUTES.md`](docs/frontend-recon/ROUTES.md) — state-based view router, 4 views, 3 student tabs, 9 admin tabs, 18 modals.
- [`COMPONENTS.md`](docs/frontend-recon/COMPONENTS.md) — 66 render functions, 386 public API methods, 30 storage keys.
- [`INTERACTIONS.md`](docs/frontend-recon/INTERACTIONS.md) — browser-verified interactions and console observations.
- [`DESIGN_AUDIT.md`](docs/frontend-recon/DESIGN_AUDIT.md) and [`REDESIGN_BLUEPRINT.md`](docs/frontend-recon/REDESIGN_BLUEPRINT.md) — design findings and pre-redesign plan.
- [`SCREENSHOTS/`](docs/frontend-recon/SCREENSHOTS/README.md) — 20 screenshots across 1440/1280/768/390 viewports.
- [`COVERAGE_REPORT.md`](docs/frontend-recon/COVERAGE_REPORT.md) — covered states, gaps, and source/runtime cross-checks.

No redesign or refactor has been started; this package is the pre-redesign baseline.

## Formal audit package (`docs/audit/`)

A structured, evidence-first package is available at [`docs/audit/`](docs/audit/):

- [`00-executive-summary.md`](docs/audit/00-executive-summary.md) — scope, risk, counts, key risks and priorities.
- [`01-attack-surface.md`](docs/audit/01-attack-surface.md) — measured stack, channels and asset classification.
- [`02-configuration-audit.md`](docs/audit/02-configuration-audit.md) — headers, TLS, cookies, CORS and deployment observations.
- [`03-methodology.md`](docs/audit/03-methodology.md) — evidence rules, classification and boundaries.
- [`04-findings-summary.md`](docs/audit/04-findings-summary.md) and [`findings/`](docs/audit/findings/) — 18-section reports per finding.
- [`poc/`](docs/audit/poc/) — one folder per active/residual finding with expected/observed behavior.
- [`05-remediation-roadmap.md`](docs/audit/05-remediation-roadmap.md) — P0–P3 ownership, verification and dependencies.
- [`06-retest-results.md`](docs/audit/06-retest-results.md) — V4.8.6 retest status and regression evidence.
- [`evidence/`](docs/audit/evidence/) — sanitized logs, source pin and reproduction commands.

Live-channel content is `UNVERIFIED`. Full detail: [`research/trithuc5/FINDINGS.md`](research/trithuc5/FINDINGS.md).
Independent execution-based verification (2026-11-22): [`research/trithuc5/INDEPENDENT_VERIFICATION.md`](research/trithuc5/INDEPENDENT_VERIFICATION.md).
Leadership brief: [`research/trithuc5/EXECUTIVE_SUMMARY.md`](research/trithuc5/EXECUTIVE_SUMMARY.md).
Fix order: [`research/trithuc5/REMEDIATION_PLAN.md`](research/trithuc5/REMEDIATION_PLAN.md).

`FINDINGS.md`, `PHASE5_UPDATE.md`, `INDEPENDENT_VERIFICATION.md` and `REMEDIATION_PLAN.md` are the canonical V5.4.6 documents. `PHASE4_BYPASS_ANALYSIS.md` is historical V4.4 analysis. Older V4.3.9/V4.4/V4.5/V4.8.0 documents were removed from the current tree; git history retains them.

## One PoC per finding

Each finding maps to exactly one runnable PoC in `research/trithuc5/poc/`. Two types: **DISPLAY** PoCs show exposed data, misconfiguration, verified fixes, or the read-only NEW-17 probe; **ACTION** PoCs change the client mechanism, verify, and ship a restore function. The mapping, types, and restore names are in the PoC index of [`research/trithuc5/FINDINGS.md`](research/trithuc5/FINDINGS.md).

## Repository contents

- `docs/audit/` — formal V5.4.6 audit package with per-finding reports, PoC folders and sanitized evidence.
- `docs/frontend-recon/` — separate V5.1.1 pre-redesign frontend baseline (routes, components, screenshots, design audit).
- `docs/audit/` — formal audit package with per-finding reports, PoC folders and sanitized evidence.
- `research/trithuc5/FINDINGS.md` — current finding set with per-finding PoC mapping.
- `research/trithuc5/PHASE5_UPDATE.md` — measured V4.8.6 → V5.4.6 changes and re-verification.
- `research/trithuc5/PHASE4_BYPASS_ANALYSIS.md` — historical V4.4 anti-hack analysis.
- `research/trithuc5/INDEPENDENT_VERIFICATION.md` — independent 36-check execution and exact gate / sensitive-field maps.
- `research/trithuc5/EXECUTIVE_SUMMARY.md` — posture, attack chains, release decision.
- `research/trithuc5/REMEDIATION_PLAN.md` — prioritized fixes and acceptance tests.
- `research/trithuc5/SOURCE.md` — how to fetch and verify the exact source hash.
- `research/trithuc5/current.headers`, `phase5-target.headers` — captured response headers.
- `research/trithuc5/poc/` — one per-finding PoC, plus a read-only live-channel verifier.
- `research/trithuc5/tests/` — source-hash-pinned harnesses and regression suites.
- `research/trithuc5/evidence/` — sanitized fixtures, source references, test output, redacted screenshots.
- `HANDOFF.md` — session handoff and publication record.

The verbatim HTML is **not committed**: the target publishes signing literals inside it. All reports, logs and fixtures redact credential values. Superseded documents and PoCs are either removed or explicitly marked historical.

## Reproduce

Node.js 22 or newer is required. Fetch the V5.4.6 source first as described in `SOURCE.md`, then run the suites against it:

```bash
export TRITHUC_SOURCE=/absolute/path/to/V5.4.6/target.html
node research/trithuc5/tests/run_all.js                  # 41 pass
node research/trithuc5/tests/phase3_tests.js             # 8 pass
node research/trithuc5/tests/phase4_tests.js             # 20 pass
node research/trithuc5/tests/poc_suite_validation.js     # 60 pass
node research/trithuc5/tests/independent_verification.js # 36 pass
node research/trithuc5/tests/secure_controls.js          # 7 pass / 2 expected failures
```

Expected final lines:

```
TOTAL 41 PASS 41 FAIL 0
TOTAL 8 PASS 8 FAIL 0
TOTAL 20 PASS 20 FAIL 0
TOTAL 60 PASS 60 FAIL 0
TOTAL 36 PASS 36 FAIL 0
TOTAL 9 PASS 7 FAIL 2
CURRENT STATE: controls fail as expected before remediation
```

Every harness is pinned to the build SHA-256 and refuses to run if the source differs. `secure_controls.js` exits `1` until remediation is complete; all other suites exit `0`. Current outputs are stored in `research/trithuc5/evidence/`.

## Boundaries observed

- No brute-force, no DoS, no production writes, no destructive testing.
- No real account accessed and no data belonging to other users retrieved.
- No packet was published to production ntfy topics or Cloud KV.
- One unauthenticated read-only GET to `/api/results`; values were not retained.
- Live cross-client exploitation was identified as a stop condition and not executed.
- Read-only ntfy GET found no recent lines and the KV read returned an incomplete chunk set, so no live packet content is stored.
- Evidence levels distinguish local reproduction from static-only findings; fixed findings are marked `FIXED`, residual paths remain `LOCAL_CONFIRMED` / `STATIC_CONFIRMED`.


## V5.4.6 retest

- Confirmed fixed: F-04 (exam answers/questions removed; grading via `/api/exams/submit`),
  NEW-08 (Google Form dispatch disabled), F-02, NEW-15.
- Still open: NEW-11 (client-shipped `TT50_CANONICAL_MASTER_V522` seal literal),
  F-03/NEW-13 (client-owned entitlement), F-01 (public ntfy identity records),
  NEW-17 (unauthenticated `GET /api/results`, HTTP 200 / 89 records on 2026-11-24).
- Suites: main 41/41, phase3 8/8, phase4 20/20, PoC 99/99, independent 36/36;
  secure controls 7 pass / 2 expected-fail.
