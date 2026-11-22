# Executive summary — TRITHUC5.0 V4.8.0 (current live build)

## Overall posture

The owner redeployed again. Fetch of 2026-11-22T04:48:27Z returned HTTP 200 with
SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`
(9,115,471 bytes, 34,599 lines), a V4.8.0 patch on the previous V4.6.7 live build
(`8ec45ea6…`, 9,051,706 bytes, 33,519 lines).

V4.8.0 fixes a real set of issues: password, seal and backend token are no longer written to
public packets; password-like log details are masked; sensitive keys are no longer mirrored
to cookies / `window.name` / `sessionStorage`; unsigned tombstones are rejected; nonce replay
and 26-hour stale packets are rejected when a nonce is present; the internal cloud bus is
gone; the Gemini key moved to `sessionStorage`; and `X-Frame-Options` plus
`X-Content-Type-Options` headers were added.

**The trust boundary did not move.** The VIP approval seal, admin credential hashes, admin
session salt and exam-vault seed are still bundle literals. The complete local VIP bypass is
still reproducible end-to-end when both `_sig` and the seal are forged offline — executed
against the real extracted V4.8.0 functions.

**Release verdict: blocked.** The patch reduced exposure and closed several paths, but a
client cannot be the authority for its own entitlement or admin identity.

## What V4.8.0 fixed (verified)

| Earlier weakness | V4.8.0 status | Proof |
|---|---|---|
| Password in compact wire format | Fixed — `p: ''` (5546) | `P3-04`, F-01-T13, SC-08 |
| Seal / backend token broadcast | Fixed — `seal: ''`, `bkt: ''`; deserializer ignores inbound values | F-01-T13, `P3-04` |
| Password-like detail reaches Google Form | Fixed for the tested sentinel — mask in `logStudentActivity` (7364) | IV-21/IV-22 |
| Sensitive keys mirrored to cookie / `window.name` / `sessionStorage` | Fixed — sensitive-key filter (2227), `SameSite=Strict` | `P3-02`, IV-24 |
| Unsigned tombstone merge | Fixed — `isVerifiedAdmin` required | `P4-19`, IV-29, F-01-T12/T16 |
| Replay / 26-hour stale packets | Partly fixed — nonce registry (5713) and age check; nonce optional | F-01-T06/T07, `P3-03`, SC-05 |
| Internal cloud bus | Fixed — removed from production | F-01-T14 |
| V4.5 boot auto-seal | Fixed — unsealed VIP records stripped at boot | `P4-14`, IV-10 |
| Plaintext admin remember-me | Fixed — username + `remember` only | `P3-08` |
| `isAdminTester` detector exemption | Fixed — guard now fires | `P4-08`, IV-15 |

These are barriers, not a trust boundary: every remaining signature is reproducible offline
from bundle literals.

## Why the new layer still does not hold

1. **The seal secret is still public.** `computeTeacherVipApprovalSealV44` (15816) uses
   `DEFAULT_VAULT_PASS_HASH_V45` (2054) plus `THAY_TRUNG_MASTER_SEAL_2026`. → NEW-11 (Critical).
2. **Boot no longer seals, but the seal is still forgeable.** Forging both artifacts offline
   restores `hasStudentVipAccess`, `hasVerifiedPackageAccess`,
   `verifyProtectedVipActionV44` and the in-client `bkt44_` token (IV-02b–IV-09, P4-16).
3. **Detection now checks structure, but trusts client-side secrets.** The renamed-account
   keyword bypass is closed; recomputing `_sig` + seal offline reopens it. → NEW-13 residual.
4. **Privileged ids are only partly closed.** `isAdminTester` no longer skips the detector and
   guest VIP flags are detected, but `gv_test` still skips and the runtime block still exempts
   all three ids. → NEW-14 residual.
5. **Admin preview still unlocks all packages** once an offline-forged admin session sets
   `isAdminLoggedIn`. → NEW-15 residual (F-02 chain).
6. **The exam vault is unchanged.** The claim token and XOR seed are literals; 15 exams / 330
   answers were recovered offline. → F-04.
7. **Public identity data still leaves the client.** Password, seal and token are gone, but
   the compact user list still publishes names, classes, Gmail and status. → F-01 residual.

## Confirmed vulnerabilities and evidence levels

| Finding | Severity | Evidence |
|---|---|---|
| NEW-11 seal forgeable from bundled secrets | **Critical** | LOCAL_CONFIRMED (real V4.8.0 functions) |
| F-01 cloud sync publishes user records; signed tombstone still forgeable | High | LOCAL_CONFIRMED; live channel UNVERIFIED |
| F-03 VIP entitlement fully client-side | High | LOCAL_CONFIRMED |
| NEW-13 structural detector trusts bundle secrets | High | LOCAL_CONFIRMED (partial fix) |
| NEW-14 privileged id exemptions | High | LOCAL_CONFIRMED (partial fix) |
| NEW-15 admin preview unlock-all | High | LOCAL_CONFIRMED (partial fix) |
| F-02 admin auth client-side (hashed literals) | Medium | LOCAL_CONFIRMED |
| F-05 device/Gmail lock client-owned | Medium | LOCAL_CONFIRMED (test API gated) |
| NEW-07 cross-tab state replacement | Medium | LOCAL_CONFIRMED (VIP stripped, other fields still copied) |
| NEW-10 admin-tester audit suppression | Medium | LOCAL_CONFIRMED (public guests now logged) |
| NEW-08 activity logs still leave the site via third-party form | Medium | LOCAL_CONFIRMED for masking fix; live delivery UNVERIFIED |
| F-04 exam answers behind gzip/XOR vault, still client-readable | Informational | LOCAL_CONFIRMED (15 exams / 330 answers recovered) |
| NEW-02 unsigned packet injection (downgraded; local BC path) | Low | LOCAL_CONFIRMED |
| F-06 anti-cheat UX-only | Low | LOCAL_CONFIRMED |
| NEW-03 optional nonce / age guard | Low | LOCAL_CONFIRMED (partial fix) |
| NEW-05 Gemini key in sessionStorage | Low | STATIC_CONFIRMED (partial fix) |
| NEW-06 security headers | Informational | STATIC_CONFIRMED (partial fix) |
| NEW-01 / NEW-04 / NEW-09 / NEW-12 / NEW-16 | **Fixed** | see table above |

Full detail and the per-finding PoC map: `FINDINGS.md`. Measured build delta:
`PHASE5_UPDATE.md`. Historical V4.4 analysis: `PHASE4_BYPASS_ANALYSIS.md`.

## Required remediation direction

1. Move VIP entitlement, admin authorization, grading and device registration behind a
   server-authoritative API (F-01, F-02, F-03, F-04, F-05, NEW-10).
2. Authenticate every cloud packet before any state mutation; require a server-issued identity
   for admin claims, not a reproducible client hash (F-01, NEW-02, NEW-03).
3. Remove answer keys and the vault boot token from client payloads; grade server-side (F-04).
4. Remove identity fields from public wire formats and stop copying activity logs to a
   third-party form (NEW-01 residual, NEW-08 residual).
5. Stop mirroring session state into cookies and `window.name` for any sensitive identity
   (NEW-07, NEW-09 residual).
6. Remove all bundle secrets (`DEFAULT_VAULT_PASS_HASH_V45`, admin hashes, master seal,
   `SERVER_AUTH_2026`, cloud admin secret, integrity/admin salts) and rotate them.

Full plan: `REMEDIATION_PLAN.md`.

## Regression coverage (all green on the current build)

| Suite | Checks | Result |
|---|---|---|
| `tests/run_all.js` (ported to V4.8.0) | 40 | 40 pass / 0 fail |
| `tests/phase3_tests.js` (ported to V4.8.0) | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` (ported to V4.8.0) | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 51 | 51 pass / 0 fail |
| `tests/independent_verification.js` | 36 | 36 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 7 pass / 2 expected failures (must pass after remediation) |

An independently written suite re-executed the four highest-priority areas with its own SHA
pin and VM: forging both artifacts restores every access gate with zero server calls; admin
preview and the remaining privileged paths bypass real gates; the exact Google Form /
sensitive-storage field map was checked with a synthetic sentinel; and unsigned tombstones
are now rejected. See [`INDEPENDENT_VERIFICATION.md`](INDEPENDENT_VERIFICATION.md).

## Live-channel status

Read-only verification (`poc/verify_live_readonly.mjs`) previously found zero recent lines on
both public ntfy topics and an incomplete KV chunk set (`s_10`, `s_15` empty), so no snapshot
could be reconstructed. Live content for this build remains `UNVERIFIED`. Real-credential
exposure and production cross-client mutation remain `UNVERIFIED`. No packet was published
during the assessment.

## Boundaries

- No production state modified, no real account touched, no packet published.
- All PoCs are local to the tester's browser; every ACTION PoC ships a restore function.
- Documents pinned to the superseded V4.3.9/V4.4/V4.5 builds were removed from the current tree; git
  history retains them.
