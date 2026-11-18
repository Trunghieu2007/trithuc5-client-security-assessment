# PHASE 4 — POST-PATCH VIP BYPASS ANALYSIS (TRITHUC5.0 V4.4)

**Target:** `https://trithuc500.vercel.app/`
**Repository:** `https://github.com/Trunghieu2007/trithuc5-client-security-assessment`
**Date of analysis:** 2026-11-18
**Scope:** client-side only, read-only against production. No account creation, no packet publication, no production writes.

---

## 1. Evidence refresh

| Item | Value |
|---|---|
| Retrieval time (UTC) | 2026-11-18T09:02:20Z |
| HTTP status | 200 |
| Response size | 14,554,401 bytes (previous build: 14,226,000) |
| Response SHA-256 | `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868` |
| Previous build SHA-256 | `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5` |
| Line count | 20,224 (previous: 15,912) |
| Headers evidence | `research/trithuc5/phase4-target.headers` |

**The target changed.** The owner deployed a new build ("V4.4") that adds a dedicated anti-hack layer. The raw HTML is kept local only and is **not** published in the repository, consistent with the existing redaction policy.

### What the patch added

| New component | Location | Purpose |
|---|---|---|
| `_adminVipSeal` | line 10649 (`computeTeacherVipApprovalSealV44`) | "teacher approval" signature over VIP fields |
| `BackendVipAuthServiceV44` | lines 10378–10631 | In-client "vault" (`Map`) + `hasVerifiedPackageAccess()` |
| `detectAndBlockStudentVipHackV44` | line 10702 | Heuristic blocklist of tampered accounts |
| `recordVipHackSecurityAlertV44` | line 10658 | Admin-visible alert + activity log |
| `verifyRuntimeSecurityIntegrity` | line 3187 | Runtime re-verification of the logged-in student |
| Boot normalizer rewrite | lines 2605–2668 | Revokes VIP on bad `_sig`, auto-signs on good `_sig` |

---

## 2. Executive summary

**The V4.4 patch raises the bar but does not close the hole.** Every trust decision the new layer makes is derived from secrets that are published inside the same bundle it ships in, and the shipped boot normalizer *itself* mints the approval seal for any record whose `_sig` matches.

Result: **a complete VIP bypass is achieved with a local-only `localStorage` write**, verified end-to-end against the real deployed functions.

| | |
|---|---|
| Bypass status | **Confirmed** (local, end-to-end against real V4.4 functions) |
| Attack complexity | Low — one `localStorage` write + reload |
| Server involvement | None — no backend authorizes VIP entitlement |
| Impact | Full VIP (all four packages, lifetime plan) on the attacker's own browser |
| Cross-client impact | Not exercised; publishing was out of scope and was not performed |

---

## 3. Root cause — why the seal does not bind

The new approval seal is supposed to prove "a teacher granted this VIP". It does not:

```js
// line 10649-10656 — real source
function computeTeacherVipApprovalSealV44(u) {
    const vp = u.vipPackages || {};
    const maxD = Math.max(1, Math.min(3, Number(u.maxDevices || 2)));
    const admSecret = state.vaultLockConfig?.adminPass || 'THAYTRUNG2026';
    const raw = `TT50_VIP_SEAL_V44|${username}|${name}|${class}|${vpFlags}|MAXD:${maxD}|${admSecret}|THAY_TRUNG_MASTER_SEAL_2026`;
    return 'vseal44_' + hashStringHex(raw);
}
```

Every input is either attacker-chosen or published:

| Input | Where it comes from | Attacker control |
|---|---|---|
| `username`, `name`, `class` | the record being written | Full |
| `vpFlags` | the record being written | Full |
| `MAXD` | clamped to 1..3 | Full (pick 2) |
| `admSecret` | `state.vaultLockConfig.adminPass`, default `'THAYTRUNG2026'` (line 1786) | Known default; also readable from `localStorage` |
| `THAY_TRUNG_MASTER_SEAL_2026` | literal in the bundle (line 10654) | Known |
| `hashStringHex` | 8-char FNV-style hash (line 2909) | Known |

The same is true of `_sig`:

```js
// line 3170 — real source
const raw = `${id}|${username}|${status}|${vpFlags}|${vipPlan}|${vipExpiresAt}|${gmail}|${maxDevices}|TRITHUC50_SEC_SALT_2026_V27`;
```

The salt is a bundle literal. `computeUserIntegritySig` is fully reproducible offline. **P4-11, P4-12, P4-03 confirm this.**

### The seal is not even needed

The shipped boot normalizer *grants* the seal itself:

```js
// lines 2663-2666 — real source
if (!u._sig) {
    ...
    u._sig = computeUserIntegritySig(u);
} else if (u._sig === computeUserIntegritySig(u) && !u._adminVipSeal && (u.vipPackages.k12 || ... )) {
    u._adminVipSeal = computeTeacherVipApprovalSealV44(u);   // <-- app mints the seal
}
```

So the correct `_sig` alone is sufficient; the app signs the seal on the attacker's behalf. **P4-14 and P4-16 confirm this end-to-end.**

### The blocklist is a keyword filter

```js
// line 10720 — real source
if (/(poc_vip|nologin|hack|exploit|bypass|cheat)/i.test(`${uName} ${fullName} ${gmail}`)) { ... return true; }
if (maxD > 3 || maxD < 1 || isNaN(maxD)) { ... return true; }
if (hasAnyVip && (!uName || !fullName || fullName === '()')) { ... return true; }
```

Rename the account to anything ordinary, keep `maxDevices = 2`, and give it a non-empty name — all three signals disappear. **P4-02, P4-16 confirm.**

---

## 4. Findings

### NEW-11 — V4.4 VIP approval seal is forgeable (client-side secret)

| Field | Value |
|---|---|
| Severity | **Critical** |
| Evidence state | `LOCAL_CONFIRMED` (real V4.4 functions, end-to-end) |
| Component | `computeTeacherVipApprovalSealV44` (line 10649), `vaultLockConfig.adminPass` (line 1786) |
| Root cause | Approval secret and master salt are literals in the public bundle |
| Impact | Anyone can mint a valid teacher-approval seal for any account and any VIP package set |
| Preconditions | Load the public page. No account, no network, no admin |

**Reproduction (verified):**

```js
const seal = computeTeacherVipApprovalSealV44(user);   // reproduce offline, salt known
// -> 'vseal44_8A45C26B' for the synthetic record in the PoC
```

### NEW-12 — Boot normalizer auto-grants the approval seal to forged records

| Field | Value |
|---|---|
| Severity | **Critical** |
| Evidence state | `LOCAL_CONFIRMED` |
| Component | boot normalizer, lines 2663–2666 |
| Root cause | Client signs the "teacher approval" artifact on behalf of whoever supplies a valid `_sig` |
| Impact | Removes the need to forge the seal separately; `_sig` alone is the whole attack |
| Preconditions | Same as NEW-11 |

**Reproduction (verified):** write `vipPackages` all-true + forged `_sig` → after boot the record has a valid `_adminVipSeal`, stays `active`, and `hasVerifiedPackageAccess()` returns `true` for `k12` and `luyende`.

### NEW-13 — V4.4 tamper detection is a keyword heuristic, trivially evaded

| Field | Value |
|---|---|
| Severity | High |
| Evidence state | `LOCAL_CONFIRMED` |
| Component | `detectAndBlockStudentVipHackV44` (line 10702) |
| Root cause | Detection keys on substrings (`poc_vip`, `nologin`, `hack`, `exploit`, `bypass`, `cheat`) rather than on structural invariants |
| Impact | Any ordinary-looking username/name/gmail passes; detection provides false assurance |
| Preconditions | Same as NEW-11 |

**Reproduction (verified):** `detectAndBlockStudentVipHackV44(user)` returns `false` for a record whose username is `nguyenvan000000`, name `Nguyen Van 000000`, gmail `nguyenvan000000@example.edu.vn`, `maxDevices: 2`.

### NEW-14 — Privileged id exemption bypasses both the detector and the runtime integrity check

| Field | Value |
|---|---|
| Severity | High |
| Evidence state | `LOCAL_CONFIRMED` |
| Component | `detectAndBlockStudentVipHackV44` (line 10704), `verifyRuntimeSecurityIntegrity` (line 3202) |
| Root cause | `id === 'gv_test'`, `'stu_free_12b1'`, `'stu_practice_e'`, or `isAdminTester === true` skip the checks entirely |
| Impact | A record carrying one of those ids is never validated, even with `maxDevices: 999` and no `_sig` |
| Preconditions | Same as NEW-11 |

**Reproduction (verified):** `verifyRuntimeSecurityIntegrity()` returns `true` for a student with `id: 'gv_test'`, `maxDevices: 999`, no `_sig`, no seal — and does not clear `state.loggedInStudent`.

### NEW-15 — Admin preview "unlock all" bypasses every VIP package check

| Field | Value |
|---|---|
| Severity | High |
| Evidence state | `LOCAL_CONFIRMED` |
| Component | `hasStudentVipAccess` (line 4121), `hasVerifiedPackageAccess` (line 10566), `verifyProtectedVipActionV44` (line 10635) |
| Root cause | `state.isAdminLoggedIn && state.adminPreviewUnlockAll` short-circuits all three gates to `true` |
| Impact | Any account, VIP or not, gets full package access while the two flags are set |
| Preconditions | Admin session + preview flag |

`state.isAdminLoggedIn` is restored at boot from `TRITHUC50_REMEMBER_ADMIN_SESSION`, and the session signature is computed from the bundled salt `TRITHUC50_ADM_SALT_V27` (line 3183) — reproducible offline (**P4-11**). The flag itself lives in `state`, toggled by `window.TRITHUC.toggleAdminPreviewUnlockAll()`.

### NEW-16 — Cloud packets now carry the approval seal and backend token

| Field | Value |
|---|---|
| Severity | High |
| Evidence state | `STATIC_CONFIRMED` |
| Component | `serializeCompactUser` (line 3391–3392), `deserializeCompactUser` (line 3423–3424) |
| Root cause | `_adminVipSeal` and `_backendVipToken` are serialised into every cloud snapshot and read back into client state |
| Impact | The approval artifact that is supposed to be a server-side trust anchor is published to a public ntfy topic and a public KV namespace, and re-imported into client state on every device |
| Preconditions | Read-only access to the public channel |

```js
// line 3391-3392
seal: u._adminVipSeal || '',
bkt:  u._backendVipToken || '',
```

Combined with NEW-11 this means the seal is not merely forgeable — it is *broadcast*.

---

## 5. What the patch did fix

The V4.4 build genuinely improved on V4.3.9 in two respects, and the evidence reflects that:

| Previous issue | V4.4 status |
|---|---|
| Admin session accepted without `sig` (boot line 2404) | **Fixed** — line 2758 now requires a matching `sig`. The sig is still offline-reproducible (salt in bundle), so it is a barrier, not a control. |
| Unsigned cloud packet could inject a full VIP user | **Fixed** — `processIncomingCloudPacket` now downgrades non-admin packets to `pending` / non-VIP (lines 3637–3653) |

Both are recorded as *hardened but still client-side*, and the underlying class of defect is unchanged.

---

## 6. Attack chain (verified end-to-end)

```
1. Fetch public bundle                       → hash primitives + salts recovered
2. Choose ordinary-looking identity         → evades keyword blocklist (NEW-13)
3. maxDevices = 2                           → passes 1..3 rule
4. Write vipPackages = all true             → desired entitlement
5. Compute _sig offline (salt is literal)   → passes integrity check (NEW-11)
6. Write record to TRITHUC50_USERS_V436_CLEAN
7. Write TRITHUC50_LOGGED_STUDENT_V436       → boot matches by username only
8. Reload
9. Boot normalizer auto-grants _adminVipSeal (NEW-12)
10. registerVerifiedUserRecord() populates the in-client vault
11. hasVerifiedPackageAccess() → true for k12 / k11 / k10 / luyende
```

Validation artefact: `research/trithuc5/tests/poc_suite_validation.js` — executes every PoC
in `poc/` (including `poc/poc_f03_vip_entitlement.js`, which supersedes the original
`v44_vip_bypass_payload.js`) in a mock browser VM against the documented behaviour.

---

## 7. Test suite

`research/trithuc5/tests/phase4_tests.js` — **16/16 pass**.

| ID | Assertion |
|---|---|
| P4-01 | Baseline: V4.4 detector does reject the original `maxDevices: 999` PoC shape |
| P4-02 | Renaming evades the keyword blacklist |
| P4-03 | Seal secret is client-side and reproducible |
| P4-04 | Forged seal + forged `_sig` → full package access |
| P4-05 | Negative control: unsealed account denied |
| P4-06 | Negative control: post-registration tampering reverted by the vault |
| P4-07 | Seal does not bind the expiry timestamp |
| P4-08 | `gv_test` / `isAdminTester` skip the detector entirely |
| P4-09 | Runtime integrity check skips privileged ids |
| P4-10 | Admin preview unlock-all bypasses every package check |
| P4-11 | Admin session signature reproducible offline |
| P4-12 | Integrity-sig salt is a bundle literal |
| P4-13 | The "backend" vault is an in-client `Map` rebuilt from client data |
| P4-14 | Real boot normalizer auto-grants the seal |
| P4-15 | Negative control: bad `_sig` → downgrade |
| P4-16 | End-to-end: renamed synthetic user survives boot as full VIP |

Evidence files:
- `research/trithuc5/evidence/phase4-test-results.txt`
- `research/trithuc5/evidence/phase4-payload-validation.txt`

The Phase 3 suite (`run_all.js`, 40/40) and the Phase 3 suite (`phase3_tests.js`, 8/8) were **not modified**. Historical evidence is preserved.

---

## 8. Remediation

The patch cannot be fixed by adding more client-side signatures. The seal, the `_sig`, and the "backend vault" are all inside the client the attacker controls.

### Required (server-side trust anchor)

1. **Move VIP entitlement to a server.** The client must ask an authoritative API "does account X have package P?", authenticated with the user's session, and the server must answer. No entitlement may be inferred from a client-side record.
2. **Stop shipping the admin credential, or any seal secret, in the bundle.** `vaultLockConfig.adminPass` defaulting to a literal means every derived signature is public.
3. **Remove `seal` / `bkt` from cloud packets** (`serializeCompactUser`, line 3391). Publishing the approval artifact to a public topic destroys its value entirely.

### Short-term client hardening (raises cost, does not close)

4. Bind the seal to a server-issued nonce that the server validates, not to fields the client controls.
5. Replace the keyword heuristic in `detectAndBlockStudentVipHackV44` with structural invariants (e.g. `maxDevices` outside the server-advertised allowance, `updatedAt` in the future, records not present in any server-issued list).
6. Remove the `gv_test` / `stu_free_12b1` / `stu_practice_e` / `isAdminTester` blanket exemptions from both the detector and `verifyRuntimeSecurityIntegrity`, or scope them to a server-verified admin session only.
7. Bind the seal to `vipExpiresAt` so expiry cannot be extended independently of approval (NEW-12 / P4-07).

### Operational

8. Rotate the admin credential that is embedded in the bundle (`state.adminCreds` and the `vaultLockConfig.adminPass` default). Treat it as compromised and publicly known.

---

## 9. Evidence states and limitations

| Item | State | Note |
|---|---|---|
| NEW-11 … NEW-14 | `LOCAL_CONFIRMED` | Real V4.4 functions extracted from the deployed bundle, executed in an isolated VM with synthetic data |
| NEW-15 | `LOCAL_CONFIRMED` | Flag combination verified against real gate functions |
| NEW-16 | `STATIC_CONFIRMED` | Serializer/deserializer read directly from the deployed source |
| Cross-client effect of a published packet | `UNVERIFIED` | Not exercised; publication is out of scope and was not performed |
| Real user data in the public channel | `UNVERIFIED` | The read-only checker reported zero recent ntfy lines and an incomplete KV chunk set |
| Server-side authorization | `NOT_APPLICABLE` | No backend endpoint was found that authorizes VIP entitlement, so there is nothing to test against |

**Limitations of this work**

- Everything is client-side. There is no server-side truth to violate, so "bypass" here means "the client grants entitlement it should not grant" — which is exactly the defect class that was reported in Phases 1–3.
- The V4.4 build was analysed once, from a single cache-busted fetch. If the owner ships another revision, the line numbers and hashes in this document will no longer match and the harness will fail loudly rather than silently (the source hash is pinned in `phase4_harness.js`).
- No production state was modified. No real account was accessed. No packet was published.

---

## 9b. Independent re-verification (2026-11-19)

A second, independently written suite (`tests/independent_verification.js`, its own SHA pin,
extraction and VM; 35 checks, 35 pass) executed the full chain again and resolved three
questions that static reading alone could not:

- `_sig` → boot minted `_adminVipSeal` → vault `bkt44_` token → runtime integrity → all three
  access gates returned `true` with **zero KV writes** (IV-01…IV-07). Recomputing sig and
  seal offline after tampering restored access (IV-09).
- Gate-by-gate: privileged ids skip the detector; the three named ids skip the entire runtime
  integrity block; admin preview independently returns `true` from all three gates for a
  pending junk student (IV-11…IV-19). The two `stu_free`/`stu_practice` ids remain forced
  non-VIP at the protected-action gate — a scope correction to the earlier wording.
- F-01: forged admin packets are rejected, validly signed tombstones delete, **unsigned
  tombstones still merge**, and the later signed restore stays blocked (IV-27…IV-30).

Exact sensitive-field mapping for NEW-08/09 and the full result table are in
[`INDEPENDENT_VERIFICATION.md`](INDEPENDENT_VERIFICATION.md).

---

## 10. Repository state

| Path | Purpose |
|---|---|
| `research/trithuc5/tests/phase4_harness.js` | Isolated VM harness for V4.4, source hash-pinned |
| `research/trithuc5/tests/phase4_tests.js` | 20 regression checks (bypass + negative controls) |
| `research/trithuc5/tests/poc_suite_validation.js` | Executes every per-finding PoC in `poc/` in a mock browser VM |
| `research/trithuc5/tests/independent_verification.js` | Independent 35-check execution of the four priority areas |
| `research/trithuc5/INDEPENDENT_VERIFICATION.md` | Detailed results, gate scope and sensitive-field map |
| `research/trithuc5/poc/poc_f03_vip_entitlement.js` | ACTION PoC for F-03/NEW-11/12/13/14 (supersedes `v44_vip_bypass_payload.js`, removed) |
| `research/trithuc5/evidence/phase4-test-results.txt` | Suite output |
| `research/trithuc5/evidence/poc-suite-validation.txt` | PoC validation output |
| `research/trithuc5/evidence/independent-verification.txt` | Independent verification output |
| `research/trithuc5/phase4-target.headers` | Response headers of the V4.4 build |

Raw V4.4 HTML is intentionally **not** committed, matching the existing redaction policy.
