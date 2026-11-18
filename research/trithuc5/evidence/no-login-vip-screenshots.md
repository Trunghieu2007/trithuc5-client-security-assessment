# No-login VIP screenshots — user-supplied local evidence

These two screenshots were supplied by the assessment owner at approximately
`2026-11-18T00:19:42Z` (`07:19 GMT+7`) after running
`poc/no_login_vip_payload.js` in a real Chrome profile on
`https://trithuc500.vercel.app/`.

They are **local-browser evidence only** (`LOCAL_CONFIRMED` for F-03-style
client-side entitlement forgery). They do **not** prove any change on the
production server or another user's client; cross-client effect stays
`UNVERIFIED`.

## Files

| File | What it shows |
|---|---|
| `no-login-vip-unlock-modal.png` | The VIP unlock form with the synthetic account `poc_vip_nologin_074207`, all four package boxes checked, and the lifetime ("Trọn đời") option selected. No login form was used. |
| `no-login-vip-profile.png` | The same synthetic account's profile/device panel after activation: VIP badges on the curriculum tabs, synthetic Gmail address, and a locally generated device identifier. No real password is visible. |

## Provenance

| Field | Value |
|---|---|
| Source path 1 | `C:/Users/Admin/.workbuddy-ai/clipboard-images/clipboard-2026-11-18T00-19-42-862Z-118b819f.png` |
| Source path 2 | `C:/Users/Admin/.workbuddy-ai/clipboard-images/clipboard-2026-11-18T00-19-42-865Z-d4445783.png` |
| Dimensions | 1917 x 1078 (both) |
| Size | 238,706 bytes / 223,620 bytes |
| SHA-256 (unlock modal) | `0a8c81a61d7cb32e16d23f67bccc023e93aa2beb2b73e6bf9edc6992bafe273e` |
| SHA-256 (profile) | `af5889b2b06c15f42c18f6ccca4d5ccacf8b3ff91cd79180f639e07ef0816681` |

## Boundaries

- Username, Gmail address, and device code in the images belong to a synthetic
  PoC account created only in the tester's own browser profile.
- No real user account, real credential, session token, or private key appears.
- The payload performs no ntfy/KV POST and no production write.
- The screenshots support the finding that VIP/entitlement decisions are made
  from mutable client-side state; they are not proof of server-side compromise.
