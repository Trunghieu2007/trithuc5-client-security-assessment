# Executive summary — TRITHUC5.0 V4.3.9 (revalidated)

## Overall posture

A fresh cache-busted fetch on `2026-11-17T19:00:09Z` returned HTTP 200 with the same SHA-256 as
the previous assessment: `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
No fix has been deployed. All six original findings remain valid. Seven additional issues were
revalidated; two were downgraded after closer evidence review.

The core problem is unchanged: authentication, entitlement, device binding, grading, and cloud
state synchronization are all decided from data the client can read or modify. There is no
server-side authorization boundary in the measured bundle.

## Confirmed vulnerabilities and evidence levels

| Finding | Severity | Evidence |
|---|---|---|
| F-01 cloud sync authorization / tombstones | Critical | CONFIRMED local VM; live delivery UNVERIFIED |
| F-02 admin auth / session | High (downgraded from Critical) | CONFIRMED local; no server admin API STATIC_CONFIRMED |
| F-03 VIP / integrity | High | CONFIRMED local |
| F-04 answer exposure | High | CONFIRMED: 15 exams, 330 entries |
| F-05 device/Gmail lock | Medium | CONFIRMED local |
| F-06 anti-cheat | Low | STATIC_CONFIRMED |
| NEW-01 password in public packets | Critical | CONFIRMED source/publication wiring; real packets UNVERIFIED |
| NEW-02 unauthenticated user injection | Critical | CONFIRMED local; live effect UNVERIFIED |
| NEW-03 replay / expiry | Medium | CONFIRMED with narrowed claim |
| NEW-04 global cloud bus | Informational (amplifier) | STATIC_CONFIRMED |
| NEW-05 Gemini key | Low | STATIC_CONFIRMED; no live key found |
| NEW-06 security headers | Informational | STATIC_CONFIRMED |
| NEW-07 cross-tab storage trust | Medium | CONFIRMED local tab/persistence; cloud propagation LIKELY |

## Most serious attack chains

1. **Public packet → cross-client mutation.** A signed-as-admin-looking packet with no signature
   can delete another client's user records and insert an active VIP account. Local VM result is
   `CONFIRMED`; production delivery was not attempted.
2. **Public packet → credential exposure.** The serializer places plaintext passwords in a
   field posted to public ntfy/KV. Code behavior is `CONFIRMED`; presence of real credentials in
   historical packets is `UNVERIFIED`.
3. **Forged session → client teacher UI → broadcast.** F-02 alone grants only client-side admin
   state; combining it with F-01 produces cross-client effects. The chain is `CONFIRMED` locally
   and `UNVERIFIED` live.

## Potential user impact

- Complete exam answer exposure before submission.
- Unauthorized VIP access and device-limit bypass in the attacker's own browser.
- Disruption of other clients' local user lists through forged tombstones.
- Potential password disclosure if historical public snapshots contain real records.
- Teacher UI actions cannot be treated as an administrative audit trail.

## Release blockers

1. Remove the password field from public cloud serialization (NEW-01).
2. Authenticate every cloud packet before any state mutation, including tombstones (F-01, NEW-02).
3. Move admin authentication and privileged operations to a server (F-02).
4. Remove answer keys from client payloads and grade server-side (F-04).
5. Make entitlement and device registration server-authoritative (F-03, F-05).

## Recommended remediation order

Follow `REMEDIATION_PLAN.md`: contain exposed secrets first, establish server authentication and
signed fresh packets second, move entitlement/devices/answers/state to the server third, then
apply headers, provider-key proxying, and honest UX labeling.

## Validation performed

- `tests/run_all.js`: **40 checks, 40 pass, 0 fail**, exit 0.
- `tests/secure_controls.js`: **1 pass, 8 expected failures**, exit 1 on the current build; all
  nine must pass after remediation.
- No production packet injection, destructive testing, real account access, or third-party data.
- No live packet content was retrieved; ntfy GET timed out and KV returned HTTP 503.
- Harness weaknesses and corrected test descriptions are documented in `TEST_QUALITY.md` and
  `EVIDENCE_AUDIT.md`.

## Decision

The release should **remain blocked** as a system that protects accounts, entitlements, or exam
results. No finding is `FIXED`, and the post-patch controls currently fail.
