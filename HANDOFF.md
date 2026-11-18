# HANDOFF

## Exact request
The user pasted `C:\Users\Admin\Desktop\AgentContract.md` with no further instruction. Per the
contract's own read protocol (§ READ PROTOCOL, § 8 intake), pasting the file is activation:
apply it from the first reply, do not summarize it, do not review it. Default action taken:
install it as the workspace operating instruction, resolve its config slots, and verify the
local toolchain so the next real task has a measured baseline.

## Measured facts (observed on this machine, this session)
- Contract SHA-256: `d0d390cbe2b7d8f024583599dada0f8dea4f87a998d4cf0f537090787a703b0a`
  — identical for the Desktop original and the workspace copy `AGENTS.md`.
- Host: Windows 11 build 26300, shell = MINGW64 (Git Bash), workdir `C:/Users/Admin/WorkBuddy AI/2026-11-18-00-50-27`.
- MSVC: Visual Studio 2026 Build Tools v18.11.3, toolset `14.51.36231`,
  `vcvars64.bat` present at
  `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat`.
- Windows SDK 10.0.26100.0 installed (`Include/10.0.26100.0/{ucrt,shared,um,winrt}`,
  `Lib/10.0.26100.0/{ucrt,um}/x64`).
- Python 3.13.14, Node v22.22.2 on PATH.
- gcc/clang/cmake: **not on PATH** (not installed or not exposed) — unknown, not assumed absent.

## Environment gotcha worth keeping
`vcvars64.bat` exits 0 but leaves `WindowsSdkDir` empty because its SDK-detection step calls
`reg.exe`, which this machine's security policy blocks (Program Blacklist). Consequence: a
plain `cl` build fails with `C1083: cannot open include file 'stdio.h'`.
Fix used: `tools/build_probe.cmd` calls vcvars, then appends the SDK ucrt/shared/um include
paths and ucrt/um x64 lib paths to `INCLUDE`/`LIB` manually. Keep this in every build script.

## Files written / changed
- `AGENTS.md` — copy of the contract (workspace root, per Appendix C placement).
- `CLAUDE.md` — symlink → `AGENTS.md`.
- `.cursor/rules/agents.md` — copy of the contract.
- `.workbuddy-ai/config.toml` — resolved §1 config slots + toolchain inventory.
- `tools/probe_env.cpp` — environment probe source.
- `tools/build_probe.cmd` — compile+run script with the SDK-path fix.
- `tools/dump_env.cmd` — dumps vcvars' resulting INCLUDE/LIB.
- `build/probe_env.exe` — built artifact.

## What was built and tested
- Command: `cmd //c "tools\build_probe.cmd"` → exit code 0.
- Output: `compiler: MSVC 1951`, `pointer_bits: 64`, `hardware_concurrency: 12`, `os: windows`.
- First attempt failed (`C1083`, exit 2) before the SDK fix; both states are recorded above.

## Assumptions (not measured)
- `project = unnamed`, `domain = other` — no target artifact was supplied, so nothing else is inferable.
- `target_env = local VM` per the contract default; the actual host is a physical Windows machine.

## Missing
- No artifact / target to work on. Nothing has been analysed because nothing was supplied.

## Next verifiable step
Point the next task at an artifact (binary, repo, or dump) — or give a target name — and the
intake step is: hash the original read-only, identify format/engine version, then triage strings,
imports and structure before any edit.

---

## Session addition — TRITHUC5.0 V4.3.9 client-side assessment (2026-11-18)

### Exact request
Assess `https://trithuc500.vercel.app/` client-side only across six surfaces: admin auth, data
integrity, device/Gmail lock, answer payload, cloud sync, anti-cheat. Per surface: severity,
function name + line, reproducible PoC, real impact, concrete patch. End with a severity table.
Stop and ask if a real account, a public ntfy/KV write, or an attack affecting other users' data
would be needed.

### Measured facts
- Public HTML copy: `research/trithuc5/index.html`, 14,226,000 bytes, 15,912 lines,
  SHA-256 `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
- All line numbers in `research/trithuc5/REPORT.md` refer to that exact copy.
- `node research/trithuc5/poc/poc_client.js` → exit 0. It extracts and executes the real
  `hashStringHex`, `computeUserIntegritySig`, `computeAdminSessionSig`,
  `computeCloudPacketAdminSig`, `decryptV97EmbedPayload` and base64url helpers from the HTML.
- Decoded admin credentials: `[REDACTED]` / `[REDACTED]`. Forged signature values are redacted
  in all published reports; the arithmetic is reproducible from the public source.
- 15 bundled exams expose `correctAnswers` in plaintext on line 1047.
- Cloud constants on lines 2918–2924: ntfy topics `trithuc50_v436_live_sync_hn` /
  `trithuc50_v436_bak_sync_hn`, KV app key `tt50v436hn`.
- ntfy GET `/json?poll=1&since=24h` timed out after 10 s with 0 bytes; KV `GET .../meta_cnt`
  returned HTTP 503. No live packet was observed.

### STOP condition reached
`processIncomingCloudPacket` applies `deletedMap`/`deletedUsernames` at lines 3161–3188 without
checking `isVerifiedAdmin` (computed at line 3145). A forged public packet can therefore delete
users from *other clients'* local state. Live exploitation was NOT executed; no packet was sent
to ntfy or KV. Awaiting explicit user confirmation before any live test.

### Files written
- `research/trithuc5/index.html` (read-only research copy)
- `research/trithuc5/root.headers`
- `research/trithuc5/poc/poc_client.js`
- `research/trithuc5/REPORT.md`

### Build / test
- Build: none.
- Test: `node research/trithuc5/poc/poc_client.js` → exit 0, all assertions passed.
- First PoC run failed with exit 1 (wrong inverse transform and exam-array parser); both were
  fixed in the script. Final run is the authoritative one.

### Behaviour on target
- Static analysis of the published source: completed.
- Dynamic browser testing: not run.
- Live cloud packet injection: not run, blocked by the user's stop condition.

### Next verifiable step
If the user authorises testing that can affect other users' client state: do it in a labelled
lab profile, send exactly one clearly-marked synthetic packet to the public topic, and document
the exact before/after local state. If not authorised, stop at the static finding.

## Publication
All artifacts in this repository were published on 2026-11-18 to
`https://github.com/Trunghieu2007/trithuc5-client-security-assessment` (public, branch `main`).
Commit `4675ab1` contains seven files; a follow-up commit records this handoff note.
Verification: `gh repo view ... --json visibility` returned `PUBLIC`; remote file listing was
read back through the GitHub API and matched local sizes. The initial commit included the
verbatim HTML copy; it was removed in the investigation commit because the target publishes
credential literals inside it. `research/trithuc5/SOURCE.md` now documents how to fetch and
verify the exact hash without republishing those values.

## Evidence-audit addition
A later pass re-fetched the target with cache busting at `2026-11-17T19:00:09Z` (HTTP 200,
14,226,000 bytes, same SHA-256). It added `EVIDENCE_AUDIT.md`, `REVALIDATION.md`,
`TEST_QUALITY.md`, `ADDITIONAL_FINDINGS.md`, a 40-check authoritative suite, and 9 post-patch
secure controls. F-02 was downgraded from Critical to High; NEW-04 from Low to Informational.
No finding is `FIXED`; the release remains blocked.

## Phase 3 — Deep investigation addition
Independent fetch at `2026-11-17T19:23:58Z`: HTTP 200, 14,226,000 bytes, same SHA-256
`fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`; no new commits existed
after `d038d16` before this work. Added `DEEP_INVESTIGATION.md`, `NEW_FINDINGS.md`,
`ATTACK_SURFACE_MAP.md`, `UNVERIFIED_HYPOTHESES.md`, `tests/phase3_harness.js`,
`tests/phase3_tests.js`, and Phase 3 evidence logs. Three new findings were added:
NEW-08 (registration password to Google Form/activity log, High, `LOCAL_CONFIRMED`),
NEW-09 (secret mirroring to cookie/`window.name`, Medium, `LOCAL_CONFIRMED`), and
NEW-10 (client-controlled admin-tester audit suppression, Medium, `LOCAL_CONFIRMED`).
NEW-01 was strengthened by predictable per-user KV keys (`DUPLICATE` classification) and
NEW-03 by automatic 24h replay. Prototype pollution and cross-VM mutation were tested and not
reproduced. Tests: historical 40/40, Phase 3 8/8, secure controls 1 pass/8 expected failures.
No live packet, form submission, real account, or production modification was performed.
Release remains blocked; no finding is `FIXED`.


## Live browser follow-up (user-supplied console + agent-browser inspection)
User console showed Google Form `formResponse` returning 404 and KV `meta_cnt` blocked by CORS, so live form exfiltration to the configured endpoint and live KV reads are not working; code paths remain locally confirmed. Browser inspection found `state` and anti-cheat handlers are closure-local inside a page IIFE (source line 1241), so console overrides of `window.triggerExamViolation` cannot disable them. The only retained local test hook is `poc/aero_hook_v3.user.js` (Tampermonkey/Violentmonkey, `document-start`); the user tested it and confirmed it works. Earlier v2 console/CDP variants were removed. No production write or real account access.

## No-login VIP local payload
Added `research/trithuc5/poc/no_login_vip_payload.js`: a console-only local payload that activates VIP without any login form. It writes a synthetic full-format user (all 4 VIP packages, `vipPlan='lifetime'`, no `_sig`) into `TRITHUC50_USERS_V436_CLEAN` and sets `TRITHUC50_LOGGED_STUDENT_V436`; boot matches `loggedInStudent` by username only (line 2360) and re-signs the user with the bundle's hardcoded salt (line 2322), so no password check is involved. Validated with pinned harness functions: matched user stays `active`, all VIP packages true, `_sig` valid, `isStudentVipExpired` false. Includes a backup/restore function. Local-only; no ntfy/KV write and no real user touched. Cross-client effect remains `UNVERIFIED`.

## NEW-02 real-Chrome local payload
Added `research/trithuc5/poc/new02_chrome_payload.js`: a DevTools Console snippet to run on the live page with the v3 Tampermonkey hook installed. It creates one synthetic unsigned `LOCAL_POC_NEW02` packet (no `fromAdmin`, no `adminSig`) and applies it via `__AERO_POC__.applyLocal()` → `applyIncomingPacket()` → `processIncomingCloudPacket()`. Verified against hash-pinned source: the non-`STUDENT_REGISTER` type bypasses the pending/no-VIP downgrade, injecting an `active` user with `isVip=true`, `vipPlan='lifetime'`. A `__AERO_NEW02_CLEANUP__()` function removes the synthetic user from `TRITHUC50_USERS_V436_CLEAN`. Syntax checked and validated locally with the harness. Local-only: no ntfy/KV publish, no real user touched; cross-client live effect remains `UNVERIFIED`.

## F-02 admin UI VIP matrix screenshot
Added `research/trithuc5/evidence/f02-admin-vip-matrix-redacted.png` and its provenance note `f02-admin-vip-matrix-redacted.md`. The user-supplied 1917x1078 screenshot shows the admin VIP-permission matrix after the forged local session. The student identity column (names, classes, username/password hints, emails) was redacted before publication; the unredacted source is not committed. VIP checkboxes and duration controls remain visible. Evidence supports client-side admin UI state only (`LOCAL_CONFIRMED`), not server authorization. The evidence README index was updated.

## F-02 admin UI screenshots
Added six 1917x1078 user-supplied screenshots under `research/trithuc5/evidence/`: `f02-admin-exam-bank.png`, `f02-admin-lesson-manager.png`, `f02-admin-activity-log.png`, `f02-admin-exam-creator.png`, `f02-admin-grade-mapper-redacted.png`, and `f02-admin-site-security.png`, with provenance/hashes in `f02-admin-ui-screenshots.md`. They show the teacher/admin UI after the forged local session: exam bank, lesson manager, activity log, exam creator, grade mapping, and site-security export. A real-looking student name/email in the grade-mapping image was redacted before publication; the unredacted source is not committed. Evidence supports client-side admin UI state (`LOCAL_CONFIRMED`), not server authorization. The evidence README index was updated.

## F-02 admin session payload
Added `research/trithuc5/poc/f02_admin_session_payload.js`: a console-only local payload that writes `TRITHUC50_REMEMBER_ADMIN_SESSION_V26` with `loggedIn:true`, a fresh timestamp, and **no `sig`**. Boot accepts a missing signature (line 2404), so `state.isAdminLoggedIn` becomes true after reload without a login form. The payload embeds no credential, salt, or signature literal and includes a backup/restore function. Validated with pinned harness functions: no-sig session accepted; expired ts, bad sig, and `loggedIn:false` rejected. Evidence in `evidence/f02-session-validation.txt`. Local UI trust only; no backend admin API exists, and no production change was made.

## User-supplied no-login VIP screenshots
Added two 1917x1078 PNG screenshots to `research/trithuc5/evidence/`: `no-login-vip-unlock-modal.png` and `no-login-vip-profile.png`, plus `no-login-vip-screenshots.md` with provenance, SHA-256 hashes, and scope. They show the synthetic `poc_vip_nologin_074207` account after the no-login VIP payload: all four VIP packages selected with lifetime option in the unlock modal, and VIP tabs/profile state in the account panel. No real credential, session token, or private key appears. Evidence state is `LOCAL_CONFIRMED` for client-side entitlement manipulation; cross-client/server effect remains `UNVERIFIED`. The evidence README index was updated.

## Phase 4 — post-patch (V4.4) VIP bypass analysis
The owner deployed a new build: SHA-256 `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`, 14,554,401 bytes, 20,224 lines, fetched 2026-11-18T09:02:20Z (HTTP 200). It adds an anti-hack layer: `_adminVipSeal` (`computeTeacherVipApprovalSealV44`, line 10649), `BackendVipAuthServiceV44` (lines 10378-10631), `detectAndBlockStudentVipHackV44` (line 10702), `recordVipHackSecurityAlertV44` (line 10658), a rewritten `verifyRuntimeSecurityIntegrity` (line 3187) and a rewritten boot normalizer (lines 2605-2668).

Two V4.3.9 weaknesses were genuinely hardened: the admin session now requires a matching `sig` (line 2758) and unsigned cloud packets are downgraded to pending/non-VIP (lines 3637-3653). The patch nevertheless fails because every new trust decision is client-side. Findings NEW-11 (seal secret `vaultLockConfig.adminPass` default `THAYTRUNG2026` plus literal `THAY_TRUNG_MASTER_SEAL_2026`, both in the bundle — Critical), NEW-12 (boot normalizer auto-grants `_adminVipSeal` to any record with a matching `_sig` — Critical), NEW-13 (detector is a keyword heuristic on poc_vip/nologin/hack/exploit/bypass/cheat — High), NEW-14 (`gv_test`/`stu_free_12b1`/`stu_practice_e`/`isAdminTester` skip both the detector and the runtime integrity check — High), NEW-15 (admin preview unlock-all short-circuits every VIP gate — High), NEW-16 (`seal` and `bkt` are now serialised into every cloud packet — High).

Added `research/trithuc5/tests/phase4_harness.js` (source hash-pinned), `research/trithuc5/tests/phase4_tests.js` (16 checks, 16 pass, 0 fail) and `research/trithuc5/tests/phase4_payload_validation.js` (14 checks, 14 pass, 0 fail — runs the shipped PoC against the real extracted V4.4 functions). Added `research/trithuc5/poc/v44_vip_bypass_payload.js` (local-only Chrome Console payload) and `research/trithuc5/PHASE4_BYPASS_ANALYSIS.md`. Evidence: `evidence/phase4-test-results.txt`, `evidence/phase4-payload-validation.txt`, `phase4-target.headers`. The V4.4 HTML is kept local and not committed, matching the existing redaction policy. No packet was published, no real account touched, no production state modified.

## Consolidation — per-finding PoCs, ported suites, stale-doc cleanup (2026-11-18)

User request: audit the project, delete outdated PoCs/bypasses/docs, and write one PoC per
finding — DISPLAY type (show the exposed data) for data-exposure findings, ACTION type
(change the mechanism, run the action chain, then restore) for mechanisms like local admin
login.

Per-finding PoC set (`research/trithuc5/poc/`, each self-contained with a restore function):

| File | Finding(s) | Type |
|---|---|---|
| `poc_f01_student_data.js` | F-01, NEW-01, NEW-16 | DISPLAY |
| `poc_f02_admin_login.js` | F-02 | ACTION (forge session + 5-step action chain) |
| `poc_f03_vip_entitlement.js` | F-03, NEW-11, NEW-12, NEW-13, NEW-14 | ACTION |
| `poc_f04_exam_answers.js` | F-04 | DISPLAY |
| `poc_f05_device_lock.js` | F-05 | DISPLAY / opt-in ACTION |
| `poc_f06_anticheat.js` | F-06 | ACTION (console neutraliser + userscript variant) |
| `poc_new02_packet_injection.js` | NEW-02, F-01 tombstone, NEW-04 | ACTION (local) |
| `poc_new05_new07_new10_misc.js` | NEW-05, NEW-07, NEW-10, NEW-14 | DISPLAY / opt-in probe |
| `poc_new08_new09_leakage.js` | NEW-08, NEW-09 | DISPLAY |
| `poc_new15_admin_preview.js` | NEW-15 | ACTION |
| `verify_live_readonly.mjs` | live channel check (Node) | DISPLAY |

Removed as outdated (git history retains them): PoCs `poc_client.js`,
`no_login_vip_payload.js`, `f02_admin_session_payload.js`, `v44_vip_bypass_payload.js`,
`new02_chrome_payload.js`, `aero_hook_v3.user.js`, `last_run.log`, plus the superseded
validator `tests/phase4_payload_validation.js` and its evidence log; documents `REPORT.md`,
`INVESTIGATION.md`, `EVIDENCE_AUDIT.md`, `REVALIDATION.md`, `ADDITIONAL_FINDINGS.md`,
`DEEP_INVESTIGATION.md`, `NEW_FINDINGS.md`, `ATTACK_SURFACE_MAP.md`,
`UNVERIFIED_HYPOTHESES.md`, `TEST_QUALITY.md`, `FINDINGS_MATRIX.md`.

Suites ported to the V4.4 source (hash `33be09d7…`): `tests/harness.js`,
`tests/run_all.js` (40/40 — ten V4.3.9 vulnerability assertions rewritten as V4.4
fix-verification assertions), `tests/phase3_tests.js` (8/8 — P3-03/P3-04 rewritten for the
V4.4 behaviour), `tests/phase4_tests.js` (20/20), and new `tests/poc_suite_validation.js`
(51/51) which executes every PoC in a mock browser VM. `tests/secure_controls.js`: 3 pass /
6 expected failures on V4.4. Current logs: `evidence/test-results.txt`,
`evidence/phase3-test-results.txt`, `evidence/phase4-test-results.txt`,
`evidence/poc-suite-validation.txt`, `evidence/secure-controls-v44.txt`;
`current.headers` refreshed from the V4.4 fetch.

Documents: new consolidated `FINDINGS.md` (severity table, per-finding sections with PoC
mapping, V4.4 fix table, PoC index), `EXECUTIVE_SUMMARY.md` rewritten for V4.4,
`REMEDIATION_PLAN.md` rewritten for V4.4 (retires the client-minted seal as the top
priority; stale V4.3.9 line numbers replaced), `evidence/README.md` rewritten. Boundaries
unchanged: no packet published, no real account touched, no production state modified.
Live-channel content `UNVERIFIED`; release remains blocked; no finding is `FIXED`.
