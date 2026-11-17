# Unverified hypotheses — Phase 3

These are deliberately **not** counted as findings. Each needs evidence that was not obtainable under read-only, synthetic-only constraints.

| # | Hypothesis | Why it is still `UNVERIFIED` | Evidence needed | Safe next step |
|---|---|---|---|---|
| UH-01 | Real user passwords are present in public ntfy/KV packets or per-user KV records. | Live packet reads previously timed out / returned HTTP 503; no historical topic content was inspected. | Owner-authorized inspection of topic/KV history with synthetic canaries first. | Ask the owner to rotate credentials and inspect their own channel; do not read real user data here. |
| UH-02 | The configured Google Form has collected password-bearing registration responses. | No request was sent to the live form and no form response was accessed. | Owner-authorized form response export / access-log review. | Remove password from the log string immediately; owner checks retention. |
| UH-03 | `window.name` data leaks to a different origin after same-tab navigation. | No real browser navigation test was run. | Chromium/Firefox test with synthetic value and attacker-controlled destination. | Use a local synthetic page, never a live third party. |
| UH-04 | DOM XSS exists through a field that bypasses `sanitizePlainInput`. | 13 `innerHTML` sinks were found, but no script-execution primitive was demonstrated. Sanitization removes `< > " '`. | Browser DOM test with synthetic payloads across all user-controlled fields. | Keep as `UNVERIFIED`; do not inflate severity. |
| UH-05 | Cross-client mutation occurs on production clients when a packet is published. | Local VMs accept the packet; no production publish was performed because it would affect other users' state. | Isolated staging with two real client instances and a dedicated topic. | Obtain explicit staging authorization before publishing any packet. |
| UH-06 | NEW-07 propagates through cloud sync to other accounts. | Storage-event replacement and persistence are `LOCAL_CONFIRMED`; the admin-flag + successful publish sequence was not run live. | Two-account staging with independent authenticated identities. | Do not use production accounts. |
| UH-07 | Real browser multi-tab races cause last-write-wins loss beyond the harness model. | Mock storage has no real event ordering or quota behavior. | Browser automation with concurrent tabs and synthetic users. | Local browser profile only. |
| UH-08 | Missing security headers are exploitable for clickjacking or script execution. | Headers are absent (`STATIC_CONFIRMED`), but no exploit was demonstrated. | Proof-of-concept frame/XSS test in an isolated browser. | Keep Informational unless a primitive is shown. |
| UH-09 | A server-side API exists outside the measured bundle and enforces some boundaries. | No app-origin API calls appear in the client; server code was not provided. | Owner-provided deployment manifest or server source review. | Do not brute-force endpoints. |
| UH-10 | CDNs without SRI are compromised for this deployment. | Missing SRI is `STATIC_CONFIRMED`; compromise is not. | Subresource integrity verification / CDN audit by owner. | Informational only. |

## Explicitly tested and not reproduced

- Prototype pollution through object-valued `__proto__` in `deletedMap`: `NOT_REPRODUCIBLE` (numeric timestamp comparison rejects the object value).
- Cross-VM mutation without an explicit packet transfer: `NOT_REPRODUCIBLE`.
- Server-side admin action from a forged client session: `NOT_REPRODUCIBLE` in the measured client because no such action exists.

## Out-of-scope / not attempted

- No real account creation, login, credential reuse, or access to private student records.
- No packet publication to shared production ntfy/KV channels.
- No destructive, brute-force, denial-of-service, or high-volume requests.
- No modification of production code or data.
