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
| `Uncaught ReferenceError: unsafeWindow is not defined` when a userscript was pasted into Console | `LIVE_CONFIRMED` | Usage error: `unsafeWindow` exists only under Tampermonkey/Violentmonkey. Console build must use `window`. Fixed in `poc/aero_hook_v2.js`. |
| Violation overlay still visible after `state.showViolationOverlay=false` was set | `LIVE_CONFIRMED` | Root cause refined by browser inspection: `state` and `triggerExamViolation` are closure-local inside the page IIFE starting at source line 1241. Console assignment to `window.triggerExamViolation` does **not** replace the closure binding, and `state` is not reachable via `window.eval`. v2 removed the DOM overlay but could not stop future violation events. v3 uses `@run-at document-start` to block anti-cheat listener registration before the page IIFE runs. |

## Corrected artifacts

- `poc/aero_hook_v2.js` — console-safe build; removes visible overlay but cannot fully disable closure-local checks.
- `poc/aero_hook_v2.user.js` — Tampermonkey build with the same limitation.
- `poc/aero_hook_v3.user.js` — recommended build. Install in Tampermonkey/Violentmonkey at `document-start`; blocks anti-cheat handlers at registration time and exposes the test API. Not pasteable into Console.

## Safety boundary

No ntfy/KV publish was performed. No real account or private record was accessed. All tests remained in the user's own browser profile with synthetic data.
