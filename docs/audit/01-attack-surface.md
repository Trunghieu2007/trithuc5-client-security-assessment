# 01 — Attack surface inventory

**Assessment target:** `https://trithuc500.vercel.app/`
**Build pin:** SHA-256 `be27a5bc429dec25ec31031cf9128680bcc116b6eaa48c75bdb0e37896234028` (V4.8.0, 9,115,471 bytes, 34,599 lines, fetched 2026-11-22T04:48:27Z).
**Method:** static analysis of the pinned client bundle plus read-only observation of response headers. No active scan against third-party services was performed.

## 1. Identification

| Item | Measured value | Evidence |
|---|---|---|
| Hostname | `trithuc500.vercel.app` | Fetch target and HTTP 200 response |
| Hosting / CDN | Vercel | `Server: Vercel`, `X-Vercel-Cache: HIT`, `X-Vercel-Id` in `evidence/response-headers.txt` |
| Application type | Single-file client-side HTML application, no same-origin API calls found | Bundle analysis; `A-01-T01` in `tests/run_all.js` |
| Frontend | Vanilla JavaScript in one HTML document; external libraries bundled inline | Bundle structure; no framework manifest observed |
| Backend framework | Not observed in scope | No same-origin API endpoints identified |
| Authentication provider | None server-side; client-side hash comparison in `loginAdmin()` (line 31852) | Source lines 2052–2054, 4165–4166, 31852+ |
| API architecture | Public ntfy topics, public keyvalue.immanuel.co namespace, optional user-configured GitHub CDN sync | Source constants at 4298–4304; V4.7.3 sync functions |
| Third-party integrations | Google Forms (activity log), Gemini API (OCR), ntfy.sh, keyvalue.immanuel.co, api.github.com (optional) | Bundle literals and PoC fixtures |
| Source maps | None observed | No `.map` reference identified in fetched HTML |
| Auth cookies issued by server | None observed | All cookie writes are client-side `document.cookie` in `safeStorageSet` (2228) |

## 2. Endpoint and channel inventory

| Endpoint / channel | Method | Auth requirement | Function | Input parameters | Data type | Risk notes | Testing status |
|---|---|---|---|---|---|---|---|
| `/` | GET | Public | Main SPA delivery | Query string (app-internal) | HTML / JS | All trust decisions execute in browser | Verified (fetched, hash-pinned) |
| `/exams-cloud.json.gz?v=<bucket>` | GET | Public | Static CDN exam bundle (`pullExamsFromStaticCdnV473`) | `v` cache-buster | Compressed JSON | Public exam content; signature checked client-side only | Static-verified in source; live content not stored |
| `https://ntfy.sh/trithuc50_v436_live_sync_hn` | GET (SSE/poll), POST by clients | Public channel | Cloud state / packets | Packet body `TT50V436:<base64url>` | Compact user/packet data | Public read/write channel; identity fields still published | Static + local harness; live read-only check found no recent lines |
| `https://ntfy.sh/trithuc50_v436_bak_sync_hn` | GET / POST | Public channel | Backup cloud channel | Same as above | Compact user/packet data | Same as primary | Static + local harness |
| `https://keyvalue.immanuel.co/api/KeyVal/GetValue/tt50v436hn/<key>` | GET | Public KV app key | Snapshot / per-user record read | Key name | JSON / base64url | Public namespace; write gate exists but snapshot chunks still published | Static + local harness; live GET previously incomplete |
| `https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/tt50v436hn/<key>` | POST | Public KV app key | Snapshot / per-user record write | Key, value | JSON / base64url | No server-side authorization observed | Static only; no production write performed |
| Google Form `actionUrl` from `googleFormConfig` | POST | Public form | Activity-log sync | `entry.111/222/333/444`, `submit` | Name, class, score, detail | Third-party; password-like detail now masked, other identity fields remain | Local VM interception only; no live POST |
| Gemini API endpoint (client-configured) | POST | User-supplied API key | OCR / exam creation | Prompt, key header | Exam content, key | Key now in `sessionStorage`, still same-origin readable | Static only; no live request |
| `https://api.github.com/repos/<user-configured>/contents/<path>` | GET / PUT | User-supplied token | Optional exam sync to GitHub repo | `repo`, `branch`, `path`, `token` | Compressed exam bundle | Token is user-configured, not embedded; out of scope unless explicitly configured by owner | Static only; no live call |
| `BroadcastChannel('TRITHUC50_AUTOSYNC_V436')` | postMessage / onmessage | Same-origin script | Local cross-tab packet ingestion | Raw packet object | Cloud packet | Local unauthenticated insertion path remains (NEW-02 residual) | Local harness + PoC validation |
| `window.addEventListener('storage')` | Browser event | Same-origin script | Cross-tab state replacement | localStorage keys | User table, activity logs | VIP records now stripped; other fields still copied (NEW-07 residual) | Local VM verified (`A-04-T02`) |
| Admin login UI (`loginAdmin()`) | Client function | Client-side hash check | Admin session minting | username, password | Hashes, session sig | No same-origin auth endpoint | Local harness verified (F-02) |
| Student registration / VIP request | Client function + cloud packet | None | User creation / entitlement request | Compact user fields | Identity, requested packages | Unsigned packets downgraded to pending/non-VIP | Local harness verified (NEW-02) |

## 3. Asset classification

| Group | Assets |
|---|---|
| Public | `/`, static exam CDN file, ntfy topics, KV namespace |
| Authenticated | None server-verified; "admin" and "student" states are client-side |
| Privileged | Admin UI functions gated by `requireAdminAuth()` (client-side only) |
| Administrative | Admin portal, VIP approval, exam manager, device controls — all client-side |
| API | ntfy, KV, optional GitHub contents API, third-party Google Form / Gemini |
| Sensitive | Compact user records, activity logs, exam vault, admin session signature |

## 4. Out-of-scope components

The following were observed but not tested beyond static identification: Vercel platform internals, ntfy.sh service, keyvalue.immanuel.co service, Google Forms, Gemini API, GitHub API, any third-party user accounts or data. No credential, token or private content from those services was accessed.

## 5. Testing status summary

| Area | Status |
|---|---|
| Frontend source pinning | Verified |
| HTTP header capture | Verified |
| Client-side function execution | Verified in isolated VM |
| Local packet / storage paths | Verified with synthetic fixtures |
| Live ntfy / KV content | UNVERIFIED — read-only checks found no usable snapshot |
| Server-side authorization | Not testable — no same-origin backend observed in scope |
