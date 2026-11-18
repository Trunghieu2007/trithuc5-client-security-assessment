# F-02 admin UI screenshots — user-supplied local evidence

Six screenshots were supplied by the assessment owner at approximately
`2026-11-18T00:29:22Z` (`07:29 GMT+7`) after running
`poc/f02_admin_session_payload.js` in a real Chrome profile on
`https://trithuc500.vercel.app/`.

They show that a forged local session restores the **teacher/admin UI state**
without a login form. This is `LOCAL_CONFIRMED` for F-02 client-side session
trust only. It does **not** prove server-side administrative authorization;
no backend admin API exists in the reviewed source, and no production write
was performed by this evidence step.

## Files

| File | What it shows |
|---|---|
| `f02-admin-exam-bank.png` | Admin exam bank with privileged tabs/actions visible (`Kho Đề & Bài Học (191)`, edit/create/results controls). |
| `f02-admin-lesson-manager.png` | Admin lesson/content management screen with grade tabs and edit controls. |
| `f02-admin-activity-log.png` | Admin activity log. Visible account identifiers are the synthetic `poc_vip_nologin_*` PoC users from earlier local tests. |
| `f02-admin-exam-creator.png` | Admin exam-creation/import interface with AI/watermark controls. |
| `f02-admin-grade-mapper-redacted.png` | Admin grade-mapping/Excel screen. The student identity column was redacted before publication; see below. |
| `f02-admin-site-security.png` | Google Sites export / anti-cheat configuration screen. The admin credential fields are already masked in the screenshot; no plaintext credential is visible. |

## Redaction

`f02-admin-grade-mapper-redacted.png` is derived from the user-supplied source
image `clipboard-2026-11-18T00-29-22-245Z-c134f8d9.png`. The source showed a
student name and a Gmail-style account in the `TÀI KHOẢN & HỌ TÊN` column.
Those rows were covered with an opaque rectangle before publication. The
adjacent exam, score, and action columns remain visible so the screenshot still
supports the finding. The unredacted source image is **not** committed.

| Field | Value |
|---|---|
| Source SHA-256 (unredacted, local only) | `f51b11d1c6d51a006dadf47f8529dd73c4ab7a7239f2d8fc55768875fe88bb5a` |
| Published redacted SHA-256 | `6aa6fec2fa735005a51e4cd488ae972f9e8bd77f8f31fc22485afb416984f87b` |
| Redaction area (original pixels) | x=340..610, y=595..1035 |
| Dimensions | 1917 x 1078 (all six images) |

## Published-file hashes

| File | SHA-256 |
|---|---|
| `f02-admin-exam-bank.png` | `1c25ffb88ae2bc7dcdf71cb2af3cc89bddcdc99a0d5fed5cefaf0e139f536d20` |
| `f02-admin-lesson-manager.png` | `32ae8d2177a03019974ebe509dae5c46f2ff5e7e7f0ebd08589fde9c32ec783b` |
| `f02-admin-activity-log.png` | `3c225e7589c82f1e1f74daa35f255d8391c241ea03b14f070c9c2300c5651ff0` |
| `f02-admin-exam-creator.png` | `87515060de716cf5c3892837b34ec462fdb41ae286c9c842c3719ec9dddb75f6` |
| `f02-admin-grade-mapper-redacted.png` | `6aa6fec2fa735005a51e4cd488ae972f9e8bd77f8f31fc22485afb416984f87b` |
| `f02-admin-site-security.png` | `fcea43fc43b8e0c277f9a0c6408655b22a6c5d83ba689f3be3fcb621160086c7` |

## Boundaries

- The screenshots support client-side admin UI access after a forged local session.
- They do not show a server-authenticated admin action or access to another user's data.
- No real password, session token, or private key appears in the published files.
- The one real-looking student identifier was redacted before publication.
- F-02 severity remains High after revalidation because the reviewed app has no
  backend admin API to call; the impact is local administrative UI/state.
