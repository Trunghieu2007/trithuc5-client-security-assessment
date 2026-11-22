# F-02 admin VIP matrix screenshot — redacted local evidence

One user-supplied screenshot was captured at approximately `2026-11-18T00:56:42Z`
(`07:56 GMT+7`) after the forged local admin session was active. It shows the
admin VIP-permission matrix with per-student package toggles and duration
controls. This supports F-02 `LOCAL_CONFIRMED` client-side admin UI access only;
it does not prove server-side authorization or another user's data was modified.

## File

| Field | Value |
|---|---|
| Published file | `f02-admin-vip-matrix-redacted.png` |
| Source file (local only, not committed) | `clipboard-2026-11-18T00-56-42-973Z-0434cf78.png` |
| Dimensions | 1917 x 1078 |
| Source SHA-256 | `8c5376969918f825122485fcf5ba3ea282eb165f3306c39bdf4f84cb885c7df3` |
| Published SHA-256 | `aa641217b0f66b096d759a35e9b9f5d5acc260f082ea2a8e750f74a8c87e5bfd` |

## Redaction

The source image contained three student identities in the `HỌC SINH / TÀI KHOẢN`
column: real-looking names, class codes, username/password hints, and Gmail
addresses. The whole identity column was covered with an opaque rectangle.

| Field | Value |
|---|---|
| Redaction area (original pixels) | x=820..1100, y=425..965 |
| Preserved | `TẤT CẢ`, `K12`, `K11`, `K10`, `ĐỀ` checkboxes, duration dropdowns, status badges outside the covered area, left-side registration form |

The unredacted source image is **not** committed. No real student identifier,
password hint, or email address is present in the published file.

## Boundaries

- Evidence state: `LOCAL_CONFIRMED` for client-side admin UI after F-02 session forgery.
- No backend authorization is shown; F-02 remains High because the reviewed
  bundle has no server-side admin API.
- No production account was read or modified by capturing or publishing this image.
