# 03 — Methodology

## 1. Assessment model

This assessment is **client-side only** against an owner-authorized target. The objective was to identify and verify security boundaries that the shipped browser application claims to enforce, without touching production state or third-party accounts.

**Target:** `https://trithuc500.vercel.app/`
**Pinned build:** SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185` (V4.8.6), 9,120,257 bytes / 34,677 lines.
**Assessment period:** 2026-11-18 → 2026-11-22, with the final re-pin on 2026-11-22.

## 2. Evidence rules

- A value is recorded only when measured from the pinned bundle, captured response headers, or executed harness output.
- Unknown or untested items are explicitly marked `UNVERIFIED`, `Not tested` or `Not applicable`.
- No endpoint, parameter, CVSS score, screenshot or log line is invented.
- Synthetic fixtures only: usernames, passwords, session tokens and packet bodies are invented test values.
- No real credential, real user record or production packet content is stored in this repository.
- Live ntfy / KV content was read-only and produced no usable snapshot; it remains `UNVERIFIED`.

## 3. Phases performed

| Phase | Activity | Artifact |
|---|---|---|
| 1 — Reconnaissance | Fetch target, hash pin, stack identification, inline-source and endpoint mapping | `01-attack-surface.md` |
| 2 — Configuration | Header review, cookie/CORS/TLS/deployment assessment | `02-configuration-audit.md` |
| 3 — Application assessment | Auth, authorization, client trust, data exposure, exam vault, packet/tombstone paths | `04-findings-summary.md`, `findings/*.md` |
| 4 — Validation | Each hypothesis executed in isolated VM with real extracted functions | `06-retest-results.md`, `evidence/` |
| 5 — PoC | One safe PoC per finding; DISPLAY vs ACTION taxonomy | `poc/` |
| 6 — Severity | Qualitative severity from measured exploitability and impact; CVSS not scored | Per-finding reports |
| 7 — Documentation | This `docs/audit` tree | All files |
| 8 — Roadmap | Root-cause remediation ordered P0–P3 | `05-remediation-roadmap.md` |
| 9 — Retest | Re-ran all suites on V4.8.6 after re-pin | `06-retest-results.md` |

## 4. Isolated execution environment

The harnesses in `research/trithuc5/tests/` do the following:

1. Read the fetched HTML and refuse to run unless SHA-256 matches `EXPECTED_SHA`.
2. Extract **real functions** from the bundle by name or measured line range, e.g. `processIncomingCloudPacket` (5714), `serializeCompactUser` (5546), `computeTeacherVipApprovalSealV44` (15816), `safeStorageSet` (2228).
3. Execute them in a Node `vm` context with mock `localStorage`, `sessionStorage`, `document.cookie`, `window.name`, `BroadcastChannel`, ntfy/KV transport and Google Form dispatcher.
4. Feed synthetic users and packets only.
5. Assert both fixed paths and residual paths.

No harness contacts production. The PoC validation VM additionally checks that DISPLAY PoCs transmit nothing and that ACTION PoCs write nothing to ntfy/KV.

## 5. Finding classification

| Classification | Meaning |
|---|---|
| **CONFIRMED** | Direct, reproducible evidence from extracted functions or captured configuration. |
| **LIKELY** | Significant supporting evidence but exploitability not fully executed. Not used for release-blocking claims here. |
| **OBSERVATION** | Hygiene/configuration/design issue without proven impact, e.g. missing CSP. |
| **FALSE POSITIVE** | Checked and determined not to be a vulnerability. None recorded in this assessment. |

## 6. Severity approach

Severity is assigned from measured factors: attacker prerequisites, whether a trust boundary exists, reproducibility offline, affected data, and realistic business impact. CVSS v4.0 vectors/scores are **not assigned** in this report because no authoritative CVSS calculator was run; inventing values would violate the evidence rules. Per-finding reports state `CVSS: not scored — see 03-methodology.md`.

The dominant context is: the application makes entitlement, admin and grading decisions in the client, and all signing secrets ship in the bundle. That is why NEW-11/F-03 remain Critical/High even though no server was compromised.

## 7. Boundaries observed

- No destructive testing, DoS, stress test, brute-force, spam or mass exploitation.
- No real account accessed, no production write, no persistence, no privilege takeover of any third party.
- No personal data downloaded or stored.
- No exploit used to reach cloud metadata, internal networks or another user's session.
- No third-party service tested beyond static identification.

## 8. Limitations

- Server-side implementation details cannot be verified from the client. The client contracts of `/api/admin/login` and `/api/results` were observed; one read-only GET to `/api/results` was performed and no server write was sent.
- Live cross-client exploitation was deliberately not executed.
- TLS chain/ciphers, HTTP→HTTPS redirect and directory listing were not tested.
- Some findings rely on static source evidence plus local execution; they are labelled accordingly.
- Any redeploy invalidates line numbers and the hash pin; re-measure before reuse.
