# TRITHUC5.0 V4.3.9 — client-side security assessment

Authorized, read-only assessment of `https://trithuc500.vercel.app/`. Scope covered all six
existing findings, related code paths, and additional client-side weaknesses. No server was
modified, no account was created, no production packet was sent, and no real user data was
accessed.

## Headline result

All six original findings remain valid. Seven additional issues were identified. The current
release should be blocked as a system that protects accounts, entitlements, or exam results.

| Severity | Finding |
|---|---|
| Critical | F-01 cloud sync authorization / tombstone mutation |
| Critical | F-02 client-side admin authentication and session trust |
| Critical | NEW-01 student passwords serialized into public cloud packets |
| Critical | NEW-02 unauthenticated injection of active/VIP users |
| High | F-03 VIP / integrity checksum with hardcoded salt |
| High | F-04 330 exam answer entries shipped before submission |
| Medium | F-05 device/Gmail lock enforced only in client JavaScript |
| Medium | NEW-03 no replay/expiry/nonce handling |
| Medium | NEW-07 unvalidated cross-tab state replacement |
| Low | F-06 anti-cheat is UX only |
| Low | NEW-04 global cloud bus bridge |
| Low | NEW-05 Gemini key in localStorage |
| Informational | NEW-06 missing security headers |

Full analysis: [`research/trithuc5/INVESTIGATION.md`](research/trithuc5/INVESTIGATION.md).
Severity matrix: [`research/trithuc5/FINDINGS_MATRIX.md`](research/trithuc5/FINDINGS_MATRIX.md).
Leadership brief: [`research/trithuc5/EXECUTIVE_SUMMARY.md`](research/trithuc5/EXECUTIVE_SUMMARY.md).
Fix order: [`research/trithuc5/REMEDIATION_PLAN.md`](research/trithuc5/REMEDIATION_PLAN.md).

## Repository contents

- `research/trithuc5/INVESTIGATION.md` — full findings with root cause, PoC, impact, remediation.
- `research/trithuc5/FINDINGS_MATRIX.md` — status, evidence level, severity, next action.
- `research/trithuc5/REMEDIATION_PLAN.md` — prioritized fixes and acceptance tests.
- `research/trithuc5/EXECUTIVE_SUMMARY.md` — posture, attack chains, release decision.
- `research/trithuc5/REPORT.md` — original Vietnamese report, credential values redacted.
- `research/trithuc5/SOURCE.md` — how to fetch and verify the exact source hash.
- `research/trithuc5/root.headers` — captured response headers.
- `research/trithuc5/poc/` — original executable PoC and sanitized run log.
- `research/trithuc5/tests/` — isolated 35-test regression suite and harness.
- `research/trithuc5/evidence/` — sanitized fixtures, source references, test output.
- `HANDOFF.md` — session handoff and publication record.

The verbatim HTML is **not committed**: the target publishes credential and signing literals
inside it. All reports, logs and fixtures redact those values. Fetch instructions are in
`SOURCE.md`.

## Reproduce

Node.js 22 or newer is required. Fetch the source first as described in `SOURCE.md`, then:

```bash
node research/trithuc5/tests/run_all.js
node research/trithuc5/poc/poc_client.js
```

Expected final lines:

```
TOTAL 35 PASS 35 FAIL 0
POC RESULT: all checks executed locally; no writes to ntfy/KV, no account created.
```

Both commands exit `0`. The harness refuses to run if the source SHA-256 differs from
`fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.

## Boundaries observed

- No brute-force, no DoS, no production writes, no destructive testing.
- No real account accessed and no data belonging to other users retrieved.
- No packet was published to production ntfy topics or Cloud KV.
- Live cross-client exploitation was identified as a stop condition and not executed.
- Read-only ntfy GET timed out and KV read returned HTTP 503, so no live packet content is stored.
- Evidence levels distinguish local reproduction from static-only findings; nothing is marked
  `FIXED` because no verified production change occurred.
