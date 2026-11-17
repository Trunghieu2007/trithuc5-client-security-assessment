# Additional attack-surface review — TRITHUC5.0 V4.3.9

Source: fresh cache-busted fetch, SHA-256 `fe6fef993c24a4a8bbe3839004a31a47e3392cf6598efd5290303901ecd792b5`.
Only issues with a traced input → security-sensitive operation are recorded. Generic code smells are
listed as `UNVERIFIED` and are **not** counted as vulnerabilities.

## Reviewed surfaces

| Surface | Observation | Evidence level | Finding |
|---|---|---|---|
| `innerHTML` / `outerHTML` | 13 `innerHTML` assignments plus `outerHTML` replacements for lesson cards (lines 12259–12265, 12554, 12574). `showToast` writes raw text through `maskAuthorBranding` (lines 1630–1634). | `STATIC_CONFIRMED` for sinks | No confirmed XSS. User-controlled fields from registration and cloud deserialization pass through `sanitizePlainInput`, which removes `< > " '`. No script-execution primitive was demonstrated. |
| Dynamic script execution | No `eval`, `new Function`, `document.write`, `srcdoc`, or script injection from user data found in the shipped page. | `STATIC_CONFIRMED` | No issue. |
| `postMessage` | No global `window.addEventListener('message')` handler. Only `BroadcastChannel.onmessage` (line 15892) and ntfy SSE `onmessage` (line 3373). | `STATIC_CONFIRMED` | Covered by F-01 and NEW-07; no separate origin-check finding. |
| URL parameters / hash | `URLSearchParams` reads `vip`, `register`, `pkg`, `plan` (lines 2492–2496) to choose UI/package defaults. No assignment of a parameter to `location.href`, `location.replace`, or `window.open` found. | `STATIC_CONFIRMED` | No open redirect confirmed. UI-only parameter trust, `Informational`. |
| Iframes | A hidden iframe named `trithuc_gf_sink_iframe` is created for Google Form POST responses (lines 4168–4179). `src` is not user-controlled; no `srcdoc`. | `STATIC_CONFIRMED` | No issue confirmed. |
| Source maps | No `sourceMappingURL` reference in the HTML. | `STATIC_CONFIRMED` | No source-map exposure. |
| Third-party integrations | Tailwind, MathJax, SheetJS, PDF.js, Mammoth loaded from public CDNs without SRI attributes in the HTML; Google Forms and Gemini endpoints are called directly. | `STATIC_CONFIRMED` | Supply-chain hardening opportunity only; no compromise demonstrated. `Informational`. |
| Storage-event trust | `storage` handler replaces `state.users` from JSON without validation (lines 15859–15877). | `CONFIRMED` in VM via `A-04-T02` | NEW-07. |
| State persistence race | `saveUsersState` writes localStorage and may rebroadcast when admin (lines 3475–3494). No locking or version check around multi-tab writes. | `LIKELY` for real concurrent tabs; `CONFIRMED` for last-write-wins in harness | Amplified NEW-07; not a separate finding. |
| Prototype-sensitive object handling | Packet `deletedMap` keys are written into `state.deletedUsersMap` (lines 3161–3168). A numeric assignment to `__proto__` does not create an own property in V8; no pollution effect demonstrated. | `UNVERIFIED` | Not reported as a vulnerability. |
| CORS / cache | `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=0, must-revalidate` on the public HTML. | `STATIC_CONFIRMED` | NEW-06, Informational. |
| Authentication/logout transitions | Logout clears local session keys and sets `state.isAdminLoggedIn=false` (lines 14047–14052). No server session exists to invalidate. | `CONFIRMED` / `STATIC_CONFIRMED` | Part of F-02, not separate. |
| Client-side authorization checks | `requireAdminAuth` only checks `state.isAdminLoggedIn` (lines 2945–2952). | `STATIC_CONFIRMED` | Part of F-02. |

## Conclusion

No additional confirmed high-severity attack path was found beyond F-01–F-05 and NEW-01/02/03/07.
The most plausible untested path is a DOM XSS through a field that bypasses
`sanitizePlainInput`; the current review did not identify one, so it remains `UNVERIFIED` and is
not included in the severity table.
