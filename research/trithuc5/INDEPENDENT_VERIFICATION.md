# Independent verification — V4.8.0 (2026-11-22)

Execution-based re-verification of the current build, written separately from the original
Phase 4 suite. It uses its own SHA pin, its own extraction code and its own VM environment:
`tests/independent_verification.js` (36 checks, 36 pass, 0 fail; output in
`evidence/independent-verification.txt`). Every check calls **real functions extracted from
the V4.8.0 bundle** with synthetic data. No network request, no real account, no credential
literal from production. Superseded V4.3.9/V4.4/V4.5 documents and line numbers are not used.

Source: SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028`
(9,115,471 bytes, 34,599 lines).

## 1. NEW-11 — `_sig` → seal → real access gates (IV-01…IV-10)

The complete chain was executed end-to-end, not inferred from source:

1. `computeUserIntegritySig` — recomputed offline from the bundle salt
   (`TRITHUC50_SEC_SALT_2026_V27`, line 4153); two runs on identical fields produce the
   same `v27_…` value.
2. Boot normalizer (3574–3642) — with a matching `_sig`, VIP flags and no seal, the record is
   stripped and never minted a seal (`IV-02`, P4-14). The V4.5 auto-seal fix is preserved.
3. The seal is still forgeable offline: `computeTeacherVipApprovalSealV44` (15816) uses
   `DEFAULT_VAULT_PASS_HASH_V45` (2054) and `THAY_TRUNG_MASTER_SEAL_2026` (15821). Setting
   both `_adminVipSeal` and `_sig` before boot restores the record (`IV-02b`).
4. `BackendVipAuthServiceV44.registerVerifiedUserRecord` (15537) — the client-owned `Map`
   accepts the self-sealed record as VIP and issues `_backendVipToken` (`bkt44_…`) via
   `computeBackendGrantToken` with literal `SERVER_AUTH_2026` (15544) (`IV-03`).
5. `verifyRuntimeSecurityIntegrity` (4170) accepts the record (`IV-04`);
   `hasStudentVipAccess` (6860), `hasVerifiedPackageAccess` (6870) and
   `verifyProtectedVipActionV44` (15801) all return `true` (`IV-05`, `IV-06`).
6. The whole chain made **zero KV writes and zero Google Form dispatches** (`IV-07`): the
   "backend" vault is rebuilt from client data on every boot.

Controls: tampering after sealing without recomputing sig/seal is blocked (`IV-08`), and an
unsigned VIP record is stripped by boot (`IV-10`). Recomputing **both** artifacts offline —
both secrets are bundle literals — restores all three gates (`IV-09`). NEW-12 remains fixed;
NEW-11 remains Critical.

## 2. NEW-14/NEW-15 — which gates are actually bypassed (IV-11…IV-20)

V4.8.0 partially closes the exemptions; the residual behavior was executed with identical
tampered records and controls on ordinary ids:

- `detectAndBlockStudentVipHackV44` (15869) now returns `true` for `isAdminTester` and for
  VIP-flagged guest ids `stu_free_12b1` / `stu_practice_e` (`IV-11`, `IV-15`). `gv_test` still
  returns `false` even with VIP flags (`IV-11-gv_test`).
- `verifyRuntimeSecurityIntegrity` (4170) still skips its **entire student block** for the
  three named ids — with junk fields it returns `true` and leaves `maxDevices: 999` untouched
  (`IV-13`); the ordinary-id control is locked and force-logged-out (`IV-14`).
- Admin preview is cleared without a session (4184–4187), but with a forged admin session
  `isAdminLoggedIn && adminPreviewUnlockAll` still makes **all three** gates return `true`
  for a pending, unsigned, non-VIP junk student (`IV-16`…`IV-18`). With preview off, all
  three deny (`IV-19`). The precondition is forgeable: `computeAdminSessionSig` (4165) is
  reproducible from the bundle salt (`IV-20`). `isAdminExamAttempt` (13965) still drops
  admin/tester activity logs; public-exam guests are now logged (`IV-23`).
- `gv_test` and guest ids are still forced non-VIP at the protected-action gate; they are
  detector/runtime exemptions, not blanket VIP grants.

## 3. NEW-08/NEW-09 — exact sensitive-field map (IV-21…IV-26, synthetic sentinel only)

A synthetic user with password `SYNTHETIC_SENTINEL_PW` was used. No real credential was
accessed or published, and the form POST was intercepted in the VM (zero network calls).

**Google Form path** — `logStudentActivity` (7364) masks `mật khẩu|password|mk|pass` values
before the entry is built, then `syncActivityLogToGoogleForm` (7339) POSTs it. The real wire
payload is still exactly:

| Wire field | Source value (observed) |
|---|---|
| `name` | `[${username}] ${name}` → `[formprobe] Form Probe` |
| `classInfo` | `${class} (SBD: ${stt})` → `12A1 (SBD: 01)` |
| `score` | `${score || actionType}` (default log score is `---`) |
| `detail` | `[${actionLabel}] ${targetTitle} | ${detail} | Lúc: ${timeStr}`, with password-like values replaced by `MK: [ĐÃ ẨN]` |
| POST pairs | `entry.111`, `entry.222`, `entry.333`, `entry.444`, `submit` (codes are configurable) |

The synthetic sentinel is masked in the `detail` value and the fourth POST pair (`IV-21`,
`IV-22`). Other identity fields still leave the site. Admin/tester identities return `null`
and produce no form payload (`IV-23`).

**Weak-store mirrors** — `safeStorageSet` (2228) still writes to `localStorage` first, but
`__SENSITIVE_STORAGE_RE_V480__` (2227) blocks keys matching
`USER|STUDENT|ADMIN|CRED|GEMINI|TOKEN|PASS|GH_SYNC|SESSION` from the other stores. Non-sensitive
values still mirror to `sessionStorage`, `window.name` (`< 3500` chars) and a `SameSite=Strict`
cookie (`< 1800` chars) (`IV-24`, `IV-25`). The password-bearing user table remains in
`localStorage` only; no session/cookie/`window.name` mirror was observed (`IV-24`).
Admin and student remember-me no longer store plaintext passwords in this build.

## 4. F-01 — tombstone, signature and authorization on V4.8.0 (IV-27…IV-33)

| Scenario (synthetic fixture) | Observed result |
|---|---|
| `fromAdmin: true` + invalid `adminSig` + tombstone | Packet rejected; **no** tombstone or user mutation |
| `fromAdmin: true` + validly signed tombstone (sig computed offline via `computeCloudPacketAdminSig`) | Tombstone merges; local user removed |
| Unsigned tombstone (no `fromAdmin`, no sig) | **Rejected** in V4.8.0 — `isVerifiedAdmin` required (IV-29) |
| Later validly signed restore for a tombstoned user | Blocked by `isUserDeletedByTombstone` (IV-30) |
| Unsigned packet carrying VIP flags | Downgraded to `pending` / non-VIP (IV-31) |
| Validly signed admin packet carrying VIP flags | User inserted as `active` with seal and `_sig` (IV-32) |

No KV write occurred in any scenario (`IV-33`). Caveat: the admin packet secret
(`THAYTRUNG_SECRET_2026_V436`, line 5542) is itself a bundle literal, so "validly signed"
does not establish teacher authority — it only distinguishes two offline-computable packet
shapes. The unsigned-tombstone residual is fixed; the authenticated-looking path stays High
because the key is public.

## Boundaries

All fixtures are synthetic. No packet was published, no real login was used, no form was
submitted to a live endpoint, no production state was modified. Live-channel contents
remain `UNVERIFIED`; release remains blocked. Vulnerabilities marked `LOCAL_CONFIRMED` were
reproduced with extracted V4.8.0 functions in the isolated VM.
