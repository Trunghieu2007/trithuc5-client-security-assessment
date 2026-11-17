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

## NEW-02 real-Chrome local payload
Added `research/trithuc5/poc/new02_chrome_payload.js`: a DevTools Console snippet to run on the live page with the v3 Tampermonkey hook installed. It creates one synthetic unsigned `LOCAL_POC_NEW02` packet (no `fromAdmin`, no `adminSig`) and applies it via `__AERO_POC__.applyLocal()` → `applyIncomingPacket()` → `processIncomingCloudPacket()`. Verified against hash-pinned source: the non-`STUDENT_REGISTER` type bypasses the pending/no-VIP downgrade, injecting an `active` user with `isVip=true`, `vipPlan='lifetime'`. A `__AERO_NEW02_CLEANUP__()` function removes the synthetic user from `TRITHUC50_USERS_V436_CLEAN`. Syntax checked and validated locally with the harness. Local-only: no ntfy/KV publish, no real user touched; cross-client live effect remains `UNVERIFIED`.

## Read-only live state verification
Added `research/trithuc5/poc/verify_live_readonly.mjs`: a Node read-only checker for the two public ntfy topics and KV snapshot chunks. It performs no POST/write, redacts usernames by default, and never prints password values. A first evidence run recorded zero ntfy lines, `meta_cnt=16`, and a generic incomplete KV snapshot. A 16-way parallel KV fetch caused transient HTTP 503 responses, so the script now reads chunks sequentially with 120 ms spacing and one retry limited to HTTP 503. Final evidence run: both ntfy topics returned `lines=0 decoded=0`; KV returned `meta_cnt=16_1794884925012`; `KV s_10: empty` and `KV s_15: empty`; snapshot reconstruction was skipped. No real user or password was observed. Live cross-client mutation and real credential exposure remain `UNVERIFIED`; no live attack packet was published.
