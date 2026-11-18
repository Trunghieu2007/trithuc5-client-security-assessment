# Independent verification — V4.4 (2026-11-19)

Execution-based re-verification of the current build, written separately from the original
Phase 4 suite. It uses its own SHA pin, its own extraction code and its own VM environment:
`tests/independent_verification.js` (35 checks, 35 pass, 0 fail; output in
`evidence/independent-verification.txt`). Every check calls **real functions extracted from
the V4.4 bundle** with synthetic data. No network request, no real account, no credential
literal from production. V4.3.9 documents/line numbers are deliberately not used.

Source: SHA-256 `33be09d79b1e8089867a7db379a1dc6b9932aed178c9f9dde2e968e74d06b868`.

## 1. NEW-11/NEW-12 — `_sig` → `_adminVipSeal` → real access gates (IV-01…IV-10)

The complete chain was executed end-to-end, not inferred from source:

1. `computeUserIntegritySig` (3167–3180) — recomputed offline from the bundle salt at line
   3170; two runs on identical fields produce the same `v27_…` value.
2. Boot normalizer (2605–2668) — with a matching `_sig`, VIP flags and no existing seal,
   lines 2664–2665 **mint `_adminVipSeal` by the app itself**.
3. `BackendVipAuthServiceV44.registerVerifiedUserRecord` (10461–10507) — the client-owned
   `Map` accepts the self-sealed record as VIP and issues `_backendVipToken` (`bkt44_…`)
   via `computeBackendGrantToken` (10382–10387, literal `SERVER_AUTH_2026`).
4. `verifyRuntimeSecurityIntegrity` (3187–3228) — accepts the record (`IV-04`).
5. `hasStudentVipAccess` (4119+), `hasVerifiedPackageAccess` (10565+) and
   `verifyProtectedVipActionV44` (10634+) — all return `true` (`IV-05`, `IV-06`).
6. The whole chain made **zero KV writes and zero Google Form dispatches** (`IV-07`): the
   "backend" vault is rebuilt from client data on every boot.

Controls: tampering after sealing without recomputing the sig is blocked (`IV-08`), and an
unsigned VIP record is stripped by boot before a seal is minted (`IV-10`). But recomputing
**both** sig and seal offline — both secrets are bundle literals — restores all three gates
(`IV-09`). This is the top-priority remediation item: the patch added a second client-side
signature, not a trust boundary.

## 2. NEW-14/NEW-15 — which gates are actually bypassed (IV-11…IV-20)

The exceptions were executed against identical tampered records (`maxDevices: 999`, missing
`_sig`, empty name), with controls on ordinary ids:

- `detectAndBlockStudentVipHackV44` (10704) returns `false` for `gv_test`,
  `stu_free_12b1`, `stu_practice_e` and for `isAdminTester === true`; the ordinary id with
  the same fields is detected (`IV-11`…`IV-12`, `IV-15`).
- `verifyRuntimeSecurityIntegrity` (3202) skips its **entire student block** for the three
  named ids — with junk fields it returns `true` and leaves `maxDevices: 999` untouched
  (`IV-13`); the ordinary-id control is locked and force-logged-out (`IV-14`).
- Scope correction: `stu_free_12b1` / `stu_practice_e` are forced non-VIP in
  `verifyAndEnforceClientUserObject` (10513–10521) and rejected by
  `verifyProtectedVipActionV44` (10639). They are detector/runtime exemptions, not blanket
  VIP grants. `gv_test` is additionally accepted by `verifyAndEnforceClientUserObject`
  when `state.isAdminLoggedIn` (10512).
- Admin preview: with `isAdminLoggedIn && adminPreviewUnlockAll`, **all three** gates
  independently return `true` for a pending, unsigned, non-VIP junk student —
  `hasStudentVipAccess` (4121), `hasVerifiedPackageAccess` (10566),
  `verifyProtectedVipActionV44` (10635) (`IV-16`…`IV-18`). With preview off, all three deny
  (`IV-19`). The precondition itself is forgeable: `computeAdminSessionSig` (3182–3185) is
  reproducible from the bundle salt (`IV-20`). `isAdminExamAttempt` (9258–9269) also drops
  the corresponding activity log (`IV-20`).

## 3. NEW-08/NEW-09 — exact sensitive-field map (IV-21…IV-26, synthetic sentinel only)

A synthetic user with password `SYNTHETIC_SENTINEL_PW` was used. No real credential was
accessed or published, and the form POST was intercepted in the VM (zero network calls).

**Google Form path** — `logStudentActivity` (4606–4651) → `syncActivityLogToGoogleForm`
(4581–4604) → `postToGoogleFormEndpoint` (4687–4761). The real wire payload is exactly:

| Wire field | Source value (observed) |
|---|---|
| `name` | `[${username}] ${name}` → `[formprobe] Form Probe` |
| `classInfo` | `${class} (SBD: ${stt})` → `12A1 (SBD: 01)` |
| `score` | `${score || actionType}` (default log score is `---`) |
| `detail` | `[${actionLabel}] ${targetTitle} | ${detail} | Lúc: ${timeStr}` |
| POST pairs | `entry.111`, `entry.222`, `entry.333`, `entry.444`, `submit` (codes are configurable) |

The registration caller supplies `detail` containing `MK: ${password}`; the sentinel was
observed verbatim in the `detail` value and in the fourth POST pair (`IV-21`, `IV-22`).
The whole activity entry (`userId`, `username`, `stt`, `name`, `class`, `actionType`,
`actionLabel`, `targetTitle`, `detail`, `score`, `timeStr`) is also persisted via
`saveActivityLogsState` (4029–4037). Admin/tester identities return `null` and produce no
form payload (`IV-23`).

**Weak-store mirrors** — `safeStorageSet` (1562–1579) writes every value to `localStorage`
and `sessionStorage` with no size cap; to `window.name` as `__TRITHUC_WN__:` JSON when
`value.length < 3500`; and to a `SameSite=Lax`, non-`HttpOnly` cookie with one-year
`max-age` when `value.length < 1800` (`IV-24`, `IV-25`). The password-bearing user table is
mirrored into all four stores; the exact thresholds were confirmed at 100/2000/4000 chars.

## 4. F-01 — tombstone, signature and authorization on V4.4 (IV-27…IV-33)

| Scenario (synthetic fixture) | Observed result |
|---|---|
| `fromAdmin: true` + invalid `adminSig` + tombstone | Packet rejected at 3538–3543; **no** tombstone or user mutation |
| `fromAdmin: true` + validly signed tombstone (sig computed offline via `computeCloudPacketAdminSig`, 3357–3365) | Tombstone merges; local user removed |
| Unsigned tombstone (no `fromAdmin`, no sig) | **Still merges with no admin check** (3587–3614) — F-01 residual |
| Later validly signed restore for a tombstoned user | Blocked at 3628–3629 |
| Unsigned packet carrying VIP flags | V4.4 fix holds: downgraded to `pending` / non-VIP (3637–3653) |
| Validly signed admin packet carrying VIP flags | User inserted as `active` with seal and `_sig` (3656–3660) |

No KV write occurred in any scenario (`IV-33`). Caveat: the admin packet secret
(`THAYTRUNG_SECRET_2026_V436`, line 3363) is itself a bundle literal, so "validly signed"
does not establish teacher authority — it only distinguishes two offline-computable packet
shapes. The residual unsigned-tombstone path therefore stays High, not downgraded.

## Boundaries

All fixtures are synthetic. No packet was published, no real login was used, no form was
submitted to a live endpoint, no production state was modified. Live-channel contents
remain `UNVERIFIED`; release remains blocked; no finding is `FIXED`.
