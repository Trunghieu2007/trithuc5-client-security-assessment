# TRITHUC5.0 — client-side security assessment (V4.4 post-patch build)

Authorized, client-side-only assessment of `https://trithuc500.vercel.app/`. No server was
modified, no account was created, no production packet was sent, and no real user data was
accessed.

**Build under test:** SHA-256
`33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`, 14,554,401 bytes,
20,224 lines, fetched 2026-11-18. The V4.4 anti-hack layer (`_adminVipSeal`,
`BackendVipAuthServiceV44`, `detectAndBlockStudentVipHackV44`) is analyzed in
[`PHASE4_BYPASS_ANALYSIS.md`](research/trithuc5/PHASE4_BYPASS_ANALYSIS.md).

## Headline result

The V4.4 patch genuinely hardened two V4.3.9 holes (admin sessions now require a
signature; unsigned cloud packets are downgraded), but every new trust decision is still
made in the browser, so the VIP bypass remains fully reproducible offline. The release
should remain **blocked** as a system that protects accounts, entitlements, or exam results.

| Severity | Finding |
|---|---|
| Critical | NEW-11 VIP approval seal computed from bundle-literal secrets |
| Critical | NEW-12 boot normalizer auto-grants the seal from a forgeable `_sig` |
| High | F-01 cloud sync publishes the user table; tombstones merge without an admin check |
| High | F-03 VIP entitlement decided entirely client-side |
| High | NEW-08 registration password reaches a third-party Google Form |
| High | NEW-13 tamper detector is a keyword heuristic |
| High | NEW-14 privileged ids skip the detector and runtime integrity check |
| High | NEW-15 admin preview unlock-all short-circuits every gate |
| High | NEW-16 approval seal/backend token broadcast in every cloud packet |
| Medium | F-02 admin authentication is client-side (sig forgeable offline) |
| Medium | F-05 device/Gmail lock enforced only in client JavaScript |
| Medium | NEW-07 unvalidated cross-tab state replacement |
| Medium | NEW-09 secrets mirrored into cookie and `window.name` |
| Medium | NEW-10 admin-tester flag suppresses audit logging |
| Low | F-04 exam answer keys ship in the bundle |
| Low | NEW-01 password in the compact wire format |
| Low | NEW-02 unsigned packet injection (V4.4: downgraded, residual insertion remains) |
| Low | F-06 anti-cheat is UX only |
| Informational | NEW-03 no packet-level replay/expiry guard (signed path) |
| Informational | NEW-04 global cloud bus bridge |
| Informational | NEW-05 Gemini key in localStorage |
| Informational | NEW-06 missing security headers |

Live-channel content is `UNVERIFIED`; nothing is marked `FIXED`.

Full analysis: [`research/trithuc5/FINDINGS.md`](research/trithuc5/FINDINGS.md).
Leadership brief: [`research/trithuc5/EXECUTIVE_SUMMARY.md`](research/trithuc5/EXECUTIVE_SUMMARY.md).
Fix order: [`research/trithuc5/REMEDIATION_PLAN.md`](research/trithuc5/REMEDIATION_PLAN.md).

## One PoC per finding

Each finding maps to exactly one runnable PoC in `research/trithuc5/poc/`. Two types:
**DISPLAY** PoCs show the exposed data read-only; **ACTION** PoCs change the client
mechanism (e.g. forge a session and run an action chain), verify the bypass, and ship a
restore function. The mapping, types, and restore-function names are in the PoC index of
[`research/trithuc5/FINDINGS.md`](research/trithuc5/FINDINGS.md).

## Repository contents

- `research/trithuc5/FINDINGS.md` — current finding set with per-finding PoC mapping.
- `research/trithuc5/PHASE4_BYPASS_ANALYSIS.md` — how the V4.4 anti-hack layer fails.
- `research/trithuc5/EXECUTIVE_SUMMARY.md` — posture, attack chains, release decision.
- `research/trithuc5/REMEDIATION_PLAN.md` — prioritized fixes and acceptance tests.
- `research/trithuc5/SOURCE.md` — how to fetch and verify the exact source hash.
- `research/trithuc5/root.headers`, `current.headers`, `phase4-target.headers` — captured response headers.
- `research/trithuc5/poc/` — one per-finding PoC per the table above, plus a read-only live-channel verifier.
- `research/trithuc5/tests/` — source-hash-pinned harnesses and regression suites.
- `research/trithuc5/evidence/` — sanitized fixtures, source references, test output, redacted screenshots.
- `HANDOFF.md` — session handoff and publication record.

The verbatim HTML is **not committed**: the target publishes credential and signing
literals inside it. All reports, logs and fixtures redact those values. Superseded
V4.3.9-era documents and PoCs were removed from the tree; git history retains them.

## Reproduce

Node.js 22 or newer is required. Fetch the V4.4 source first as described in `SOURCE.md`,
then run the suites against it:

```bash
export TRITHUC_SOURCE=/absolute/path/to/V4.4/target.html
node research/trithuc5/tests/run_all.js               # 40 pass
node research/trithuc5/tests/phase3_tests.js          # 8 pass
node research/trithuc5/tests/phase4_tests.js          # 20 pass
node research/trithuc5/tests/poc_suite_validation.js  # 51 pass
node research/trithuc5/tests/secure_controls.js       # 3 pass / 6 expected failures
```

Expected final lines:

```
TOTAL 40 PASS 40 FAIL 0
TOTAL 8 PASS 8 FAIL 0
TOTAL 20 PASS 20 FAIL 0
TOTAL 51 PASS 51 FAIL 0
CURRENT STATE: controls fail as expected before remediation
```

Every harness is pinned to the build SHA-256 and refuses to run if the source differs.
`secure_controls.js` exits `1` until remediation is complete; all other suites exit `0`.
Current outputs are stored in `research/trithuc5/evidence/`.

## Boundaries observed

- No brute-force, no DoS, no production writes, no destructive testing.
- No real account accessed and no data belonging to other users retrieved.
- No packet was published to production ntfy topics or Cloud KV.
- Live cross-client exploitation was identified as a stop condition and not executed.
- Read-only ntfy GET found no recent lines and the KV read returned an incomplete chunk
  set, so no live packet content is stored.
- Evidence levels distinguish local reproduction from static-only findings; nothing is
  marked `FIXED` because no verified production change occurred.
