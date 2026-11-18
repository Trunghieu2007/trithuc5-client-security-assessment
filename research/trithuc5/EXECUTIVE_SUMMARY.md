# Executive summary — TRITHUC5.0 V4.4 (post-patch)

## Overall posture

The owner deployed a new build. Fetch of 2026-11-18T09:02:20Z returned HTTP 200 with
SHA-256 `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`
(14,554,401 bytes, 20,224 lines) — a different build from the previous assessment
(`fe6fef99…`, 14,226,000 bytes).

The V4.4 patch adds a dedicated anti-hack layer (`_adminVipSeal`, `BackendVipAuthServiceV44`,
`detectAndBlockStudentVipHackV44`, a rewritten boot normalizer and runtime integrity check).
It genuinely fixes two V4.3.9 weaknesses, but the entire layer is client-side: every new trust
decision is derived from secrets that ship in the same public bundle. **A complete local VIP
bypass was verified end-to-end against the real deployed functions** — one `localStorage`
write plus a reload.

**Release verdict: blocked.** The defect class is unchanged; only the exploit effort changed.

## What V4.4 fixed (verified)

| V4.3.9 weakness | V4.4 status | Proof |
|---|---|---|
| Admin session accepted without a signature | Fixed — signature required (line 2758) | `tests/run_all.js` F-02-T02 |
| Unsigned cloud packet granted full VIP | Fixed — downgraded to `pending`/non-VIP (lines 3637–3653) | `tests/phase4_tests.js` P4-17 |
| Forged `fromAdmin` packet accepted | Fixed — rejected outright (lines 3538–3543) | `tests/run_all.js` F-01-T01/T02/T05/T11 |
| Predictable per-user KV key (`u_<slug>_<idx>`) | Changed — record now exceeds the 450-char cap, so the write is skipped | `tests/phase3_tests.js` P3-04 |

These are barriers, not fixes: the signatures they check are reproducible offline from
bundle literals.

## Why the new layer does not hold

1. **The seal secret is public.** `computeTeacherVipApprovalSealV44` uses
   `vaultLockConfig.adminPass` (default literal `THAYTRUNG2026`) plus the literal
   `THAY_TRUNG_MASTER_SEAL_2026`. → NEW-11 (Critical).
2. **The app mints the seal itself.** The boot normalizer (lines 2663–2666) grants a valid
   `_adminVipSeal` to any record with a matching `_sig`, whose salt is also a bundle literal.
   → NEW-12 (Critical).
3. **Detection is a substring filter.** Renaming the account defeats it. → NEW-13 (High).
4. **Privileged ids skip everything.** `gv_test` / `stu_free_12b1` / `stu_practice_e` /
   `isAdminTester` bypass the detector and the runtime integrity check. → NEW-14 (High).
5. **Admin preview unlocks all packages** without any server grant. → NEW-15 (High).
6. **The seal is broadcast.** `serializeCompactUser` puts it in every cloud packet
   (NEW-16, High), and the password still rides in field `p` (NEW-01).

## Confirmed vulnerabilities and evidence levels

| Finding | Severity | Evidence |
|---|---|---|
| NEW-11 seal forgeable from bundled secrets | **Critical** | LOCAL_CONFIRMED (real V4.4 functions) |
| NEW-12 boot auto-grants the seal | **Critical** | LOCAL_CONFIRMED (boot normalizer, end-to-end) |
| F-01 cloud sync publishes user table; tombstone merges without admin check | High | LOCAL_CONFIRMED; live channel UNVERIFIED |
| F-03 VIP entitlement fully client-side | High | LOCAL_CONFIRMED |
| NEW-13 keyword-heuristic tamper detection | High | LOCAL_CONFIRMED |
| NEW-14 privileged id exemptions | High | LOCAL_CONFIRMED |
| NEW-15 admin preview unlock-all | High | LOCAL_CONFIRMED |
| NEW-16 seal/token broadcast in cloud packets | High | STATIC_CONFIRMED |
| NEW-08 password reaches a third-party Google Form | High | LOCAL_CONFIRMED; live delivery UNVERIFIED |
| F-02 admin auth client-side (hardened) | Medium | LOCAL_CONFIRMED |
| F-05 device/Gmail lock client-owned | Medium | LOCAL_CONFIRMED |
| NEW-07 cross-tab state replacement | Medium | LOCAL_CONFIRMED |
| NEW-09 secrets mirrored to cookie/window.name | Medium | LOCAL_CONFIRMED |
| NEW-10 admin-tester audit suppression | Medium | LOCAL_CONFIRMED |
| F-04 exam answer exposure | Informational | STATIC + LOCAL_CONFIRMED |
| NEW-01 password in wire format | Informational | STATIC + LOCAL_CONFIRMED |
| NEW-02 unsigned packet injection (downgraded by V4.4) | Informational | LOCAL_CONFIRMED |
| F-06 anti-cheat UX-only | Low | LOCAL_CONFIRMED |
| NEW-03 signed-stale replay | Low | LOCAL_CONFIRMED |
| NEW-04 global cloud bus | Informational | STATIC_CONFIRMED |
| NEW-05 Gemini key readable | Low | STATIC_CONFIRMED |
| NEW-06 missing security headers | Informational | STATIC_CONFIRMED |

## Required remediation direction

1. Move VIP entitlement, admin authorization, grading and device registration behind a
   server-authoritative API (F-01, F-02, F-03, F-04, F-05, NEW-10).
2. Authenticate every cloud packet before any state mutation, including tombstones
   (F-01, NEW-02, NEW-03).
3. Remove answer keys from client payloads and grade server-side (F-04).
4. Remove the password from serialization, logs and form payloads (NEW-01, NEW-08).
5. Stop mirroring credentials and session state into cookies and `window.name` (NEW-09, NEW-07).
6. Remove seal secrets and the admin credential from the bundle; rotate both (NEW-11, F-02).

Full plan: `REMEDIATION_PLAN.md`. Finding detail and the per-finding PoC map: `FINDINGS.md`.
V4.4 bypass analysis: `PHASE4_BYPASS_ANALYSIS.md`.

## Regression coverage (all green on the current build)

| Suite | Checks | Result |
|---|---|---|
| `tests/run_all.js` (ported to V4.4) | 40 | 40 pass / 0 fail |
| `tests/phase3_tests.js` (ported to V4.4) | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 51 | 51 pass / 0 fail |
| `tests/independent_verification.js` | 35 | 35 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 3 pass / 6 expected failures (must pass after remediation) |

An independently written suite re-executed the four highest-priority areas with its own SHA
pin and VM: the whole `_sig` → boot seal → access-gate chain works with zero server calls;
admin preview and privileged ids bypass real gates; the exact Google Form / weak-store field
map was captured with a synthetic sentinel; and unsigned tombstones still merge. See
[`INDEPENDENT_VERIFICATION.md`](INDEPENDENT_VERIFICATION.md).

## Live-channel status

Read-only verification (`poc/verify_live_readonly.mjs`) found zero recent lines on both public
ntfy topics and an incomplete KV chunk set (`s_10`, `s_15` empty), so no snapshot could be
reconstructed. Real-credential exposure and production cross-client mutation remain
`UNVERIFIED`. No packet was published during the assessment.

## Boundaries

- No production state modified, no real account touched, no packet published.
- All PoCs are local to the tester's browser; every ACTION PoC ships a restore function.
- Documents pinned to the superseded V4.3.9 build were removed from the current tree; git
  history retains them.
