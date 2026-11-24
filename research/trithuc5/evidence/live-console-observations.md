# Live browser console observations (user-provided, read-only)

Source: Chrome DevTools console output supplied by the user during local testing on
`https://trithuc500.vercel.app/`. No live write was performed by the assessor. URLs/form IDs are
redacted where they identify a real third-party endpoint.

## Observations

| Observation | Evidence state | Impact on prior findings |
|---|---|---|
| `cdn.tailwindcss.com should not be used in production` warning at `(index):64` | `LIVE_CONFIRMED` | Confirms the CDN script pattern already noted as `STATIC_CONFIRMED` in NEW-06. Informational only. |
| `POST https://docs.google.com/forms/d/e/[REDACTED]/formResponse 404 (Not Found)` repeatedly, with stack `logStudentActivity → syncActivityLogToGoogleForm → postToGoogleFormEndpoint → sendTask` | `LIVE_CONFIRMED` | NEW-08: the code path and payload construction are real, but the **hardcoded form endpoint currently returns 404**. Live exfiltration to that specific form is not successful. The code defect and localStorage exposure remain `LOCAL_CONFIRMED`. |
| `Access to fetch at 'https://keyvalue.immanuel.co/api/KeyVal/GetValue/[REDACTED]/meta_cnt' ... blocked by CORS policy: No 'Access-Control-Allow-Origin' header` and `net::ERR_FAILED` | `LIVE_CONFIRMED` | KV snapshot ingestion is blocked by browser CORS from the app origin. This weakens the practical KV cross-client path; the source path remains `STATIC_CONFIRMED` and harness acceptance remains `LOCAL_CONFIRMED`, but live KV delivery is now `UNVERIFIED` with a concrete blocker. |
| `Evaluating a string as JavaScript violates the following Content Security Policy directive ... chrome-extension://[REDACTED]/` from `content.js:1` | `LIVE_CONFIRMED` | Originates from a Chrome extension, not the target application. Not counted as a target vulnerability. |
| `F-06 UX anti-cheat disabled locally` printed after console payload | `LIVE_CONFIRMED` for local console hook | Confirms the UX override executes in a real browser. |
| `Uncaught ReferenceError: unsafeWindow is not defined` when a userscript was pasted into Console | `LIVE_CONFIRMED` | Usage error: `unsafeWindow` exists only under Tampermonkey/Violentmonkey. Console build must use `window`. Superseded by `poc/aero_hook_v3.user.js`. |
| Violation overlay still visible after `state.showViolationOverlay=false` was set | `LIVE_CONFIRMED` | Root cause refined by browser inspection: `state` and `triggerExamViolation` are closure-local inside the page IIFE starting at source line 1241. Console assignment to `window.triggerExamViolation` does **not** replace the closure binding, and `state` is not reachable via `window.eval`. v2 removed the DOM overlay but could not stop future violation events. v3 uses `@run-at document-start` to block anti-cheat listener registration before the page IIFE runs. |

## Retained artifact

- `poc/aero_hook_v3.user.js` — the only retained local test hook. Install in Tampermonkey/Violentmonkey at `document-start`; blocks anti-cheat handlers before the page IIFE registers them and exposes the test API. User-tested and confirmed working. Earlier v2 console/CDP variants were removed from the repository.

## Assessor browser verification — offline admin logger (2026-11-24)

Executed with `playwright-cli` against the live V5.4.6 origin at 1440x900. The PoC file was injected with `page.addScriptTag({ path })`; no production write was sent.

| Check | Observed | Result |
|---|---|---|
| PoC console install | `[AERO-ADMIN] install { hooked: 35, methods: Array(35), offline: true }` | `LIVE_CONFIRMED` |
| Auto-open | `loginAdmin` then `openAdminPortal` logged; `state.view = 'admin'` view rendered | `LIVE_CONFIRMED` |
| Admin UI | Header `QUẢN TRỊ GV V5.4.6`, sidebar tabs `Làm Đề & Ma Trận`, `Kho Đề & Bài Học 191`, `Tài Khoản & Duyệt VIP`, `Phổ Điểm & Excel`, `Mã Hóa & Bảo Mật` | `LIVE_CONFIRMED` |
| Action logging | Clicking `Tài Khoản & Duyệt VIP` appended a `switchAdminTab` call row; 25 total rows after the click | `LIVE_CONFIRMED` |
| Console hygiene | No PoC error; only the pre-existing Tailwind CDN warning and `/favicon.ico` 404 | `LIVE_CONFIRMED` |

Screenshot: [`admin-offline-logger-live.png`](admin-offline-logger-live.png).

## Safety boundary

No ntfy/KV publish was performed. No real account or private record was accessed. All tests remained in the user's own browser profile with synthetic data. The assessor run above used a fresh in-memory browser session and the local fetch stub; the only network responses observed were the page load, the Tailwind CDN, and the favicon 404.
