# V4.5 / V4.6.3 update — measured against the live build

**Target:** `https://trithuc500.vercel.app/`
**Fetched:** 2026-11-21T14:32:35Z
**Build:** SHA-256 `eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f`,
9,015,050 bytes, 32,900 lines (`research/trithuc5/phase5/target.html`, kept local).
**Response headers:** `phase5-target.headers` (copied to `current.headers`); still no CSP,
`X-Frame-Options` or `X-Content-Type-Options`, `Access-Control-Allow-Origin: *`.

This is a large rewrite (V4.5 UI polish plus a V4.6.3 “closed vault” data layer), not a small
patch. All numbers below were measured from the pinned source and executed in the isolated
harnesses; no live channel write, no real account and no production state was used.

---

## What actually changed

| Area | V4.4 | V4.5 / V4.6.3 | Security effect |
|---|---|---|---|
| Boot VIP seal | `_sig` match auto-minted `_adminVipSeal` (2663–2666) | Lines 3612–3619 strip all VIP flags when a signed record has no seal | **NEW-12 fixed** |
| Vault password | plaintext `THAYTRUNG2026` default | `DEFAULT_VAULT_PASS_HASH_V45 = 'h45_44e3396f901a954c_24f662274f7844f4'` (2054), used at 14477 | Secret obfuscated, still a bundle literal — **NEW-11 persists** |
| Admin creds | plaintext remember-me | salted hashes (2052–2053, 30401–30408); remember-me writes only username (30417, 3714) | **Plaintext admin remember-me fixed**; session sig still client-side |
| Exam data | `window.__INITIAL_EXAMS_DATA__` plaintext | `var __ENC_GZ` blob (line 1464), PRNG-XOR chunks + gzip, claim token `TT50_V45_INTERNAL_BOOT_SEAL` (1968, 25698) | **F-04 persists**: seed `0x4F81E3A7` and token are literals; decoder recovered 15 exams / 330 answers offline (`run_all.js` F-04-T01) |
| Cloud bus | `window.__TRITHUC50_CLOUD_BUS__` | `__INTERNAL_CLOUD_BUS_V45__` closure bus (4471–4477) | Direct global entry point removed — **NEW-04 scope reduced**, not a server boundary |
| Packet/tombstone | unsigned admin rejected; unsigned tombstone merged | Same: check 4521–4526, tombstone 4583–4613 | **F-01 residual persists** |
| Device / Gmail / form / cookie | client-owned | unchanged (`safeStorageSet` 2227, `logStudentActivity` 6093, `syncActivityLogToGoogleForm` 6068) | F-02/F-05/NEW-07/08/09/10/14/15/16 persist |
| Lesson gate | `isFreeLesson` | now calls `LessonVipVaultV44` (5231, 5584) | Harnesses now extract the real vault IIFE |

---

## Executed verification (V4.5 pinned source)

| Track | Result |
|---|---|
| `_sig` → seal → real gates | `_sig` alone no longer yields a seal (P4-14, IV-02). Forging **both** offline from bundle literals restores `hasStudentVipAccess`, `hasVerifiedPackageAccess`, `verifyProtectedVipActionV44` and the in-client `bkt44_` token (P4-16, IV-02b–IV-07, IV-09). |
| Privileged / preview gates | Three exempt ids still skip the detector and the full runtime block; admin preview still returns true from all three gates. `stu_free_12b1` / `stu_practice_e` remain forced non-VIP at the protected-action gate (IV-11…IV-19). |
| Google Form / cookie / `window.name` | `logStudentActivity` still builds `name`, `classInfo`, `score`, `detail`; the password sentinel reaches `detail` and `entry.140683976`. `safeStorageSet` still mirrors to `sessionStorage`, `window.name` (<3500 chars) and a `SameSite=Lax` cookie (<1800 chars). Admin remember-me now stores username only. |
| Tombstone / signature | Forged `adminSig` rejected; validly signed tombstone deletes; **unsigned tombstone still merges**; signed restore stays blocked; unsigned VIP packet downgraded; signed admin packet grants VIP with seal and `_sig`. |
| Exam answers | gzip vault decoded locally from the bundle: 15 exams, 330 answer entries (F-04-T01). |

**Suite state on V4.5:** `run_all.js` 40/40, `phase3_tests.js` 8/8, `phase4_tests.js` 20/20,
`poc_suite_validation.js` 51/51, `independent_verification.js` 36/36,
`secure_controls.js` 3 pass / 6 expected failures. Raw logs are in `evidence/`.

---

## Harness changes

* All four pinned harnesses (`harness.js`, `phase3_harness.js` via base, `phase4_harness.js`,
  `independent_verification.js`) now check SHA-256 `eff11902…` and refuse other sources.
* Bound line ranges were replaced where practical: cloud constants 4262–4268, admin session
  restore 3718–3730, boot normalizer 3553–3621, vault hash literals 2030–2054, closure-vault
  variables 1993–2005.
* Real `BackendVipAuthServiceV44` and `LessonVipVaultV44` IIFEs are extracted as declarations,
  with declaration-before-assignment ordering to avoid TDZ errors.
* Static tests that depended on old line slices now search the pinned source or extract by
  declaration name (`F-06-T01`, `A-04-T01`).
* `poc_f03_vip_entitlement.js` uses the V4.5 hash literal for the seal;
  `poc_f04_exam_answers.js` now claims/decodes the V4.5 gzip vault;
  bus PoCs fall back from `__INTERNAL_CLOUD_BUS_V45__` to the legacy global in mocks.

---

## Boundaries

Local, isolated, non-destructive. No packet published to ntfy.sh or keyvalue.immanuel.co,
no real credential accessed, no production state modified. Live-channel content remains
`UNVERIFIED`; release remains **blocked**; only NEW-12 and the plaintext admin remember-me
issue are confirmed fixed in this build.
