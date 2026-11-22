# 06 — Retest results

**Retest target:** V4.8.6 build SHA-256 `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185` (fetched 2026-11-22T10:36:26Z).  
**Previous reference build:** V4.6.7, SHA-256 `8ec45ea6…`.  
**Method:** source-hash-pinned extraction of real V4.8.6 functions, isolated Node VM with synthetic fixtures, captured headers, and read-only channel checks. No production state was changed.

## 1. What was retested

All current findings were re-executed or re-measured after the V4.8.6 redeploy. The retest followed the original hypothesis for each finding, then inverted the assertion where the behavior had been fixed. This preserves both the fix and the residual path as regression evidence.

## 2. Status per finding

| Finding | Previous behavior | V4.8.6 retest status | Evidence |
|---|---|---|---|
| NEW-11 | Seal forgeable | Not Fixed | `IV-01`…`IV-10`, `P4-16` |
| F-01 | Public identity; unsigned tombstone merge | Partially Fixed — unsigned tombstone rejected; identity and signed path remain | `F-01-T12/T13/T16`, `P4-19`, `IV-29`…`IV-32` |
| F-03 | VIP fully client-side | Not Fixed | `IV-05`, `IV-06`, `IV-09` |
| NEW-13 | Keyword detector bypass | Partially Fixed — unsigned records detected; recomputed artifacts still bypass | `P4-02`, `IV-08`, `IV-09` |
| NEW-14 | ID exemptions | Partially Fixed — `isAdminTester`/guest VIP detected; `gv_test` and runtime exemptions remain | `P4-08`, `IV-11`, `IV-13`, `IV-15` |
| NEW-15 | Preview unlock-all | Fixed in V4.8.5 — orphan flag cleared; server-verified session required | `P4-10`, `IV-16`-`IV-20`, `F-02-T01` |
| F-02 | Client admin auth | Fixed in V4.8.5 — server API, ephemeral salt, no hash literals | `F-02-T01/T05`, `P4-11`, `IV-20` |
| F-05 | Client device lock | Partially Fixed — test setter client-gated; fields remain writable | `F-05-T01`…`T05` |
| NEW-07 | Cross-tab replacement | Partially Fixed — VIP stripped; other fields copied | `A-04-T02`, `IV-24` |
| NEW-08 | Form leakage | Partially Fixed — password-like detail masked; identity fields remain | `IV-21`, `IV-22` |
| NEW-10 | Tester audit suppression | Partially Fixed — public guests logged; admin/tester still dropped | `IV-23`, `P4-09` |
| F-04 | Exam answers in bundle | Not Fixed | `F-04-T01` (15 exams / 330 answers) |
| NEW-02 | Unsigned packet injection | Partially Fixed — downgrade and tombstone fix; pending insertion remains | `IV-31`, PoC suite |
| F-06 | UX-only anti-cheat | Not Fixed | PoC suite, historical browser test |
| NEW-03 | No replay protection | Partially Fixed — nonced replay/stale rejected; nonce optional | `F-01-T06/T07`, `P3-03`, `SC-05` |
| NEW-05 | Key in localStorage | Partially Fixed — moved to sessionStorage | static review, PoC display |
| NEW-06 | Weak headers | Partially Fixed — XFO/nosniff/referrer/permissions present; CSP absent, CORS wildcard | `A-03-T01`, `response-headers.txt` |
| NEW-17 | Results API | New in V4.8.6 — unauthenticated GET returned result records | `live-readonly-check.txt`, `A-05-T01`, PoC suite |

## 3. Verified fixed items preserved as regressions

| Earlier issue | Retest status | Proof |
|---|---|---|
| NEW-01 password in wire format | Fixed | `F-01-T13`, `P3-04`, `SC-08` |
| NEW-04 internal cloud bus | Fixed | `F-01-T14` |
| NEW-09 weak-store mirroring | Fixed | `P3-02`, `IV-24` |
| NEW-12 boot auto-seal | Fixed | `P4-14`, `IV-10` |
| NEW-16 seal/backend token broadcast | Fixed | `F-01-T13`, `P3-04` |

| F-02 client admin session forgery | Fixed in V4.8.5 | `F-02-T01/T05`, `P4-11`, `IV-20` |
| NEW-15 offline admin-preview bypass | Fixed in V4.8.5 | `P4-10`, `IV-16`-`IV-19` |
| Public keyvalue.immanuel.co writes | Disabled in V4.8.5 | `P3-04`, static source assertion |
## 4. Suite results

| Suite | Checks | Result on V4.8.6 |
|---|---:|---|
| `tests/run_all.js` | 41 | 41 pass / 0 fail |
| `tests/phase3_tests.js` | 8 | 8 pass / 0 fail |
| `tests/phase4_tests.js` | 20 | 20 pass / 0 fail |
| `tests/poc_suite_validation.js` | 60 | 60 pass / 0 fail |
| `tests/independent_verification.js` | 36 | 36 pass / 0 fail |
| `tests/secure_controls.js` | 9 | 7 pass / 2 expected failures |

The expected failures are SC-07 (unsigned local user insertion) and SC-09 (cross-account signed packet). Both must pass after remediation.

## 5. Regression and alternate-flow checks

- V4.8.6 preserved the unsigned-tombstone rejection in both merge and deletion-replay flows (`F-01-T12`, `F-01-T16`, `IV-29`).
- Sensitive keys remained excluded from cookie, `window.name` and `sessionStorage` mirrors (`P3-02`, `IV-24`).
- Nonced replay and stale packets remained rejected; the nonce-less path is the only remaining gap (`F-01-T06/T07`).
- Boot normalization still strips unsigned VIP records; forging both artifacts is required to bypass (`P4-14`, `IV-10`, `IV-09`).
- No new vulnerability was observed in the measured fixed paths during this retest.

## 6. Unable to verify

- Live ntfy/KV content: read-only checks found no usable snapshot; UNVERIFIED.
- Real cross-client mutation: deliberately not executed.
- Server-side authorization: the client contract of `/api/admin/login` and `/api/results` was observed; server-side cookie flags, rate limits and POST authorization were not directly tested.
- TLS chain/ciphers and HTTP→HTTPS redirect: not tested.

## 7. Retest conclusion

V4.8.6 is a meaningful but incomplete patch. F-02 and NEW-15 are now Fixed because the old offline admin path was removed and verified; several other paths remain Partially Fixed. A new server-side exposure, NEW-17, was confirmed by one read-only GET. The release-blocking conclusion is unchanged because the approval seal, entitlement gates and exam answers remain derivable from client-shipped data, and result records are readable without authentication. Status labels follow `03-methodology.md`; no fix is marked Fixed on code review alone.
