# Independent verification — V4.5 / V4.6.3 (2026-11-21)

Execution-based re-verification of the current build, written separately from the original
Phase 4 suite. It uses its own SHA pin, its own extraction code and its own VM environment:
`tests/independent_verification.js` (36 checks, 36 pass, 0 fail; output in
`evidence/independent-verification.txt`). Every check calls **real functions extracted from
the V4.5 bundle** with synthetic data. No network request, no real account, no credential
literal from production. Superseded V4.3.9/V4.4 documents and line numbers are not used.

Source: SHA-256 `eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f`
(9,015,050 bytes, 32,900 lines).

## 1. NEW-11 — `_sig` → seal → real access gates (IV-01…IV-10)

The complete chain was executed end-to-end, not inferred from source:

1. `computeUserIntegritySig` (4129–4142) — recomputed offline from the bundle salt at line
   4132; two runs on identical fields produce the same `v27_…` value.
2. Boot normalizer (3553–3621) — **V4.5 fixed the V4.4 auto-seal path**: with a matching
   `_sig`, VIP flags and no seal, lines 3612–3619 strip the VIP flags and never mint a seal
   (`IV-02`, P4-14).
3. The seal is still forgeable offline: `computeTeacherVipApprovalSealV44` (14473–14480)
   uses `DEFAULT_VAULT_PASS_HASH_V45` (line 2054) and `THAY_TRUNG_MASTER_SEAL_2026`.
   Setting both `_adminVipSeal` and `_sig` before boot restores the record (`IV-02b`).
4. `BackendVipAuthServiceV44.registerVerifiedUserRecord` (14277) — the client-owned `Map`
   (14196) accepts the self-sealed record as VIP and issues `_backendVipToken` (`bkt44_…`)
   via `computeBackendGrantToken` (14198–14202, literal `SERVER_AUTH_2026`) (`IV-03`).
5. `verifyRuntimeSecurityIntegrity` (4149) accepts the record (`IV-04`);
   `hasStudentVipAccess` (5589), `hasVerifiedPackageAccess` (14381) and
   `verifyProtectedVipActionV44` (14458) all return `true` (`IV-05`, `IV-06`).
6. The whole chain made **zero KV writes and zero Google Form dispatches** (`IV-07`): the
   "backend" vault is rebuilt from client data on every boot.

Controls: tampering after sealing without recomputing sig/seal is blocked (`IV-08`), and an
unsigned VIP record is stripped by boot (`IV-10`). Recomputing **both** artifacts offline —
both secrets are bundle literals — restores all three gates (`IV-09`). The V4.5 patch removed
one shortcut but did not create a trust boundary: NEW-12 is fixed, NEW-11 remains Critical.

## 2. NEW-14/NEW-15 — which gates are actually bypassed (IV-11…IV-20)

The exceptions were executed against identical tampered records (`maxDevices: 999`, missing
`_sig`, empty name), with controls on ordinary ids:

- `detectAndBlockStudentVipHackV44` (14526) returns `false` for `gv_test`,
  `stu_free_12b1`, `stu_practice_e` and for `isAdminTester === true` (14528); the ordinary id
  with the same fields is detected (`IV-11`…`IV-12`, `IV-15`).
- `verifyRuntimeSecurityIntegrity` (4164) skips its **entire student block** for the three
  named ids — with junk fields it returns `true` and leaves `maxDevices: 999` untouched
  (`IV-13`); the ordinary-id control is locked and force-logged-out (`IV-14`).
- Scope correction: `stu_free_12b1` / `stu_practice_e` are forced non-VIP in the protected
  action path (14463–14464). They are detector/runtime exemptions, not blanket VIP grants
  (`IV-11`…`IV-15`).
- Admin preview: with `isAdminLoggedIn && adminPreviewUnlockAll`, **all three** gates
  independently return `true` for a pending, unsigned, non-VIP junk student —
  `hasStudentVipAccess` (5591), `hasVerifiedPackageAccess` (14382) and
  `verifyProtectedVipActionV44` (14459) (`IV-16`…`IV-18`). With preview off, all three deny
  (`IV-19`). The precondition itself is forgeable: `computeAdminSessionSig` (4144–4147) is
  reproducible from the bundle salt (`IV-20`). `isAdminExamAttempt` (12623) also drops the
  corresponding activity log (`IV-20`).

## 3. NEW-08/NEW-09 — exact sensitive-field map (IV-21…IV-26, synthetic sentinel only)

A synthetic user with password `SYNTHETIC_SENTINEL_PW` was used. No real credential was
accessed or published, and the form POST was intercepted in the VM (zero network calls).

**Google Form path** — `logStudentActivity` (6093–6137) → `syncActivityLogToGoogleForm`
(6068–6091) → `postToGoogleFormEndpoint` (6174). The real wire payload is exactly:

| Wire field | Source value (observed) |
|---|---|
| `name` | `[${username}] ${name}` → `[formprobe] Form Probe` |
| `classInfo` | `${class} (SBD: ${stt})` → `12A1 (SBD: 01)` |
| `score` | `${score || actionType}` (default log score is `---`) |
| `detail` | `[${actionLabel}] ${targetTitle} | ${detail} | Lúc: ${timeStr}` |
| POST pairs | `entry.111`, `entry.222`, `entry.333`, `entry.444`, `submit` (codes are configurable; V4.5 defaults at line 2404–2407) |

The registration caller supplies `detail` containing the password; the sentinel was observed
verbatim in the `detail` value and in the fourth POST pair (`IV-21`, `IV-22`). The whole
activity entry (`userId`, `username`, `stt`, `name`, `class`, `actionType`, `actionLabel`,
`targetTitle`, `detail`, `score`, `timeStr`) is also persisted via `saveActivityLogsState`
(line 5150). Admin/tester identities return `null` and produce no form payload (`IV-23`).

**Weak-store mirrors** — `safeStorageSet` (2227) writes every value to `localStorage` and
`sessionStorage` with no size cap; to `window.name` as `__TRITHUC_WN__:` JSON when
`value.length < 3500`; and to a `SameSite=Lax`, non-`HttpOnly` cookie with one-year `max-age`
when `value.length < 1800` (`IV-24`, `IV-25`). The password-bearing user table is mirrored
into all four stores; the exact thresholds were confirmed at 100/2000/4000 chars.
V4.5 fixed the *admin* remember-me plaintext write, but student remember-me still stores a
plaintext password (`REMEMBERED_STUDENT_CREDS`, lines 29655/29731/29765).

## 4. F-01 — tombstone, signature and authorization on V4.5 (IV-27…IV-33)

| Scenario (synthetic fixture) | Observed result |
|---|---|
| `fromAdmin: true` + invalid `adminSig` + tombstone | Packet rejected at 4521–4526; **no** tombstone or user mutation |
| `fromAdmin: true` + validly signed tombstone (sig computed offline via `computeCloudPacketAdminSig`, 4333–4343) | Tombstone merges; local user removed |
| Unsigned tombstone (no `fromAdmin`, no sig) | **Still merges with no admin check** (4583–4613) — F-01 residual |
| Later validly signed restore for a tombstoned user | Blocked by `isUserDeletedByTombstone` (4414) |
| Unsigned packet carrying VIP flags | V4.5 fix holds: downgraded to `pending` / non-VIP (4633–4649) |
| Validly signed admin packet carrying VIP flags | User inserted as `active` with seal and `_sig` (4652–4654, 4674–4678) |

No KV write occurred in any scenario (`IV-33`). Caveat: the admin packet secret
(`THAYTRUNG_SECRET_2026_V436`, line 4341) is itself a bundle literal, so "validly signed"
does not establish teacher authority — it only distinguishes two offline-computable packet
shapes. The residual unsigned-tombstone path therefore stays High, not downgraded.

## Boundaries

All fixtures are synthetic. No packet was published, no real login was used, no form was
submitted to a live endpoint, no production state was modified. Live-channel contents
remain `UNVERIFIED`; release remains blocked. Only NEW-12 and plaintext admin remember-me
are confirmed fixed in this build.
