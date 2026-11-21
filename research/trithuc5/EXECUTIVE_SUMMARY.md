# Executive summary — TRITHUC5.0 V4.5 / V4.6.3 (current live build)

## Overall posture

The owner redeployed. Fetch of 2026-11-21T14:32:35Z returned HTTP 200 with
SHA-256 `eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f`
(9,015,050 bytes, 32,900 lines) — a large rewrite from V4.4
(`33be09d7…`, 14,554,401 bytes, 20,224 lines).

V4.5 genuinely fixes two things: the boot normalizer no longer mints an approval seal from
`_sig` alone, and admin remember-me no longer writes a plaintext password. It also hides exam
answers in a gzip + XOR vault and replaces the plaintext vault password with a hash literal.
Every one of those secrets/tokens still ships in the public bundle. **The complete local VIP
bypass is still reproducible end-to-end when both `_sig` and the seal are forged offline** —
verified by executing the real extracted V4.5 functions.

**Release verdict: blocked.** The trust boundary did not move to a server; only the exploit
effort increased.

## What V4.5 fixed (verified)

| V4.4 weakness | V4.5 status | Proof |
|---|---|---|
| Boot normalizer auto-minted `_adminVipSeal` from `_sig` | Fixed — unsealed VIP records are stripped (3612–3619) | `tests/phase4_tests.js` P4-14; `tests/independent_verification.js` IV-02 |
| Admin remember-me stored a plaintext password | Fixed — only username + `remember` are written (30417, 3714) | `tests/phase3_tests.js` P3-08 |
| Global `window.__TRITHUC50_CLOUD_BUS__` | Reduced — closure bus `__INTERNAL_CLOUD_BUS_V45__` (4471–4477) | `tests/run_all.js` F-01-T14 |
| Unsigned cloud packet granted full VIP (V4.3.9) | Fixed — downgraded to `pending`/non-VIP (4633–4649) | `tests/phase4_tests.js` P4-17 |
| Forged `fromAdmin` packet accepted (V4.3.9) | Fixed — rejected outright (4521–4526) | `tests/run_all.js` F-01-T01/T02/T05/T11 |

These are barriers, not complete fixes: every remaining signature is reproducible offline
from bundle literals.

## Why the new layer still does not hold

1. **The seal secret is still public.** `computeTeacherVipApprovalSealV44` (14473) uses
   `DEFAULT_VAULT_PASS_HASH_V45` (line 2054) plus `THAY_TRUNG_MASTER_SEAL_2026`. → NEW-11
   (Critical).
2. **Boot no longer seals, but the seal is still forgeable.** Forging both artifacts offline
   restores `hasStudentVipAccess`, `hasVerifiedPackageAccess`,
   `verifyProtectedVipActionV44` and the in-client `bkt44_` token (IV-02b–IV-09, P4-16).
3. **Detection is a substring filter.** Renaming the account defeats it. → NEW-13 (High).
4. **Privileged ids skip everything.** `gv_test` / `stu_free_12b1` / `stu_practice_e` /
   `isAdminTester` bypass the detector and the runtime integrity check. → NEW-14 (High).
5. **Admin preview unlocks all packages** without any server grant. → NEW-15 (High).
6. **The seal is broadcast** (`serializeCompactUser` 4369–4370) and the password still rides
   in field `p` (4351) → NEW-16 / NEW-01.

## Confirmed vulnerabilities and evidence levels

| Finding | Severity | Evidence |
|---|---|---|
| NEW-11 seal forgeable from bundled secrets | **Critical** | LOCAL_CONFIRMED (real V4.5 functions) |
| F-01 cloud sync publishes user table; tombstone merges without admin check | High | LOCAL_CONFIRMED; live channel UNVERIFIED |
| F-03 VIP entitlement fully client-side | High | LOCAL_CONFIRMED |
| NEW-13 keyword-heuristic tamper detection | High | LOCAL_CONFIRMED |
| NEW-14 privileged id exemptions | High | LOCAL_CONFIRMED |
| NEW-15 admin preview unlock-all | High | LOCAL_CONFIRMED |
| NEW-16 seal/token broadcast in cloud packets | High | STATIC_CONFIRMED |
| NEW-08 password reaches a third-party Google Form | High | LOCAL_CONFIRMED; live delivery UNVERIFIED |
| F-02 admin auth client-side (hashed literals) | Medium | LOCAL_CONFIRMED |
| F-05 device/Gmail lock client-owned | Medium | LOCAL_CONFIRMED |
| NEW-07 cross-tab state replacement | Medium | LOCAL_CONFIRMED |
| NEW-09 secrets mirrored to cookie/window.name | Medium | LOCAL_CONFIRMED |
| NEW-10 admin-tester audit suppression | Medium | LOCAL_CONFIRMED |
| F-04 exam answers behind gzip/XOR vault, still client-readable | Informational | LOCAL_CONFIRMED (15 exams / 330 answers recovered) |
| NEW-01 password in wire format | Informational | STATIC + LOCAL_CONFIRMED |
| NEW-02 unsigned packet injection (downgraded; internal bus only) | Informational | LOCAL_CONFIRMED |
| F-06 anti-cheat UX-only | Low | LOCAL_CONFIRMED |
| NEW-03 signed-stale replay | Low | LOCAL_CONFIRMED |
| NEW-04 internal cloud bus bridge | Informational | STATIC_CONFIRMED |
| NEW-05 Gemini key readable | Low | STATIC_CONFIRMED |
| NEW-06 missing security headers | Informational | STATIC_CONFIRMED |
| NEW-12 boot auto-seal | **Fixed** | P4-14 / IV-02 |

Full detail and the per-finding PoC map: `FINDINGS.md`. Measured build delta:
`PHASE5_UPDATE.md`. Historical V4.4 analysis: `PHASE4_BYPASS_ANALYSIS.md`.

## Required remediation direction

1. Move VIP entitlement, admin authorization, grading and device registration behind a
   server-authoritative API (F-01, F-02, F-03, F-04, F-05, NEW-10).
2. Authenticate every cloud packet before any state mutation, including tombstones
   (F-01, NEW-02, NEW-03).
3. Remove answer keys and the vault boot token from client payloads; grade server-side (F-04).
4. Remove the password from serialization, logs, form payloads and student remember-me
   (NEW-01, NEW-08).
5. Stop mirroring credentials and session state into cookies and `window.name` (NEW-09, NEW-07).
6. Remove all bundle secrets (`DEFAULT_VAULT_PASS_HASH_V45`, admin hashes, master seal,
   `SERVER_AUTH_2026`, cloud admin secret, integrity/admin salts) and rotate them.

Full plan: `REMEDIATION_PLAN.md`.

## Regression coverage (all green on the current build)

| Suite | Checks | Result |
|---|---|---|
| `tests/run_all.js` (ported to V4.5) | 40 | 40 pass / 0 fail |
| `tests/phase3_tests.js` (ported to V4.5) | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` (ported to V4.5) | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 51 | 51 pass / 0 fail |
| `tests/independent_verification.js` | 36 | 36 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 3 pass / 6 expected failures (must pass after remediation) |

An independently written suite re-executed the four highest-priority areas with its own SHA
pin and VM: forging both artifacts restores every access gate with zero server calls; admin
preview and privileged ids bypass real gates; the exact Google Form / weak-store field map was
captured with a synthetic sentinel; and unsigned tombstones still merge. See
[`INDEPENDENT_VERIFICATION.md`](INDEPENDENT_VERIFICATION.md).

## Live-channel status

Read-only verification (`poc/verify_live_readonly.mjs`) found zero recent lines on both public
ntfy topics and an incomplete KV chunk set (`s_10`, `s_15` empty), so no snapshot could be
reconstructed. Real-credential exposure and production cross-client mutation remain
`UNVERIFIED`. No packet was published during the assessment.

## Boundaries

- No production state modified, no real account touched, no packet published.
- All PoCs are local to the tester's browser; every ACTION PoC ships a restore function.
- Documents pinned to the superseded V4.3.9/V4.4 builds were removed from the current tree; git
  history retains them.
