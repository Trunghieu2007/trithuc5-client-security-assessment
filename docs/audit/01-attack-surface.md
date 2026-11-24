# 01 — Attack surface inventory

**Assessment target:** `https://trithuc500.vercel.app/`  
**Build pin:** SHA-256 `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c` (V5.4.6, 2,777,970 bytes, 39,205 lines, fetched 2026-11-24T12:14:00Z).  
**Method:** static analysis of the pinned client bundle, response-header capture, source-hash-pinned VM execution, and one read-only GET to the same-origin results API. No active scan against third-party services was performed.

## 1. Identification

| Item | Measured value | Evidence |
|---|---|---|
| Hostname | `trithuc500.vercel.app` | Fetch target and HTTP 200 response |
| Hosting / CDN | Vercel | `Server: Vercel`, `X-Vercel-Cache: HIT`, `X-Vercel-Id` in `evidence/response-headers.txt` |
| Application type | Single-file client-side HTML with two same-origin API routes | Bundle analysis; `A-01-T01`, `A-05-T01` in `tests/run_all.js` |
| Frontend | Vanilla JavaScript in one HTML document; external libraries bundled inline | Bundle structure; no framework manifest observed |
| Backend framework | Not observable; route contract only | `/api/admin/login` and `/api/results` in client source |
| Authentication provider | Server `/api/admin/login` with HttpOnly cookie contract; client flag `__TT50_SERVER_ADMIN_VERIFIED_V485__` | Source lines 31907–31959, 34604–34618, 4172–4223 |
| API architecture | Two same-origin routes, public ntfy topics, disabled public KV path, optional user-configured GitHub CDN | Source constants 4295–4301; sync functions |
| Third-party integrations | Google Forms (activity log), Gemini API (OCR), ntfy.sh, keyvalue.immanuel.co (disabled), api.github.com (optional) | Bundle literals and PoC fixtures |
| Source maps | None observed | No `.map` reference identified in fetched HTML |
| Server cookies | Expected from `/api/admin/login`; not inspected server-side | Client sends `credentials: 'same-origin'` |

## 2. Endpoint and channel inventory

| Endpoint / channel | Method | Auth requirement | Function | Input parameters | Data type | Risk notes | Testing status |
|---|---|---|---|---|---|---|---|
| `/` | GET | Public | Main SPA delivery | Query string (app-internal) | HTML / JS | All trust decisions execute in browser | Verified (fetched, hash-pinned) |
| `/api/admin/login` | POST | Server credential check | Admin login | `username`, `password`, `remember` | JSON | Server-verified flag unlocks admin UI; cookie flags not directly tested | Static contract verified; no real login |
| `/api/admin/login` | GET | Server session cookie | Restore admin session | None | JSON `{ok, authenticated}` | Boot fetches this to set admin flag | Static contract verified |
| `/api/admin/login` | DELETE | Server session cookie | Logout | None | JSON | Clears server session | Static contract verified |
| `/api/results` | POST | **Unverified** | Submit student attempt | `{record: compact}` | JSON | New in V5.4.6; no write test performed | Static only |
| `/api/results` | GET | **None observed** | Pull all result records | None | JSON `{ok, records}` | NEW-17: unauthenticated read returned records | Read-only live probe; values not retained |
| `/exams-cloud.json.gz?v=<bucket>` | GET | Public | Static CDN exam bundle | `v` cache-buster | Compressed JSON | Public exam content; signature checked client-side only | Static-verified; live content not stored |
| `https://ntfy.sh/trithuc50_v436_live_sync_hn` | GET (SSE/poll), POST by clients | Public channel | Cloud state / packets | Packet body `TT50V436:<base64url>` | Compact user/packet data | Public read/write channel; identity fields still published | Static + local harness; live read-only check found no recent lines |
| `https://ntfy.sh/trithuc50_v436_bak_sync_hn` | GET / POST | Public channel | Backup cloud channel | Same as above | Compact user/packet data | Same as primary | Static + local harness |
| `https://keyvalue.immanuel.co/api/KeyVal/...` | GET / POST | Public KV app key | Legacy snapshot / per-user sync | Key, value | JSON / base64url | **Disabled in V4.8.5** (`CLOUD_KV_DISABLED_V485 = true`) | Static verified; no production write |
| Google Form `actionUrl` from `googleFormConfig` | POST | Public form | Activity-log sync | `entry.111/222/333/444`, `submit` | Name, class, score, detail | Third-party; password-like detail masked, other identity fields remain | Local VM interception only; no live POST |
| Gemini API endpoint (client-configured) | POST | User-supplied API key | OCR / exam creation | Prompt, key header | Exam content, key | Key now in `sessionStorage`, still same-origin readable | Static only; no live request |
| `https://api.github.com/repos/<user-configured>/contents/<path>` | GET / PUT | User-supplied token | Optional exam sync to GitHub repo | `repo`, `branch`, `path`, `token` | Compressed exam bundle | Token is user-configured, not embedded; out of scope unless configured by owner | Static only; no live call |
| `BroadcastChannel('TRITHUC50_AUTOSYNC_V436')` | postMessage / onmessage | Same-origin script | Local cross-tab packet ingestion | Raw packet object | Cloud packet | Local unauthenticated insertion path remains (NEW-02 residual) | Local harness + PoC validation |
| `window.addEventListener('storage')` | Browser event | Same-origin script | Cross-tab state replacement | localStorage keys | User table, activity logs | VIP records now stripped; other fields still copied (NEW-07 residual) | Local VM verified (`A-04-T02`) |
| Student registration / VIP request | Client function + cloud packet | None | User creation / entitlement request | Compact user fields | Identity, requested packages | Unsigned packets downgraded to pending/non-VIP | Local harness verified (NEW-02) |

## 3. Asset classification

| Group | Assets |
|---|---|
| Public | `/`, static exam CDN file, ntfy topics, `/api/results` GET, legacy KV namespace (client path disabled) |
| Server-authenticated | `/api/admin/login` session only; entitlement and grading remain client-side |
| Privileged | Admin UI functions gated by server-verified flag plus client `requireAdminAuth()` |
| Administrative | Admin portal, VIP approval, exam manager, device controls — client-side actions after server login |
| API | `/api/admin/login`, `/api/results`, ntfy, disabled KV, optional GitHub contents API, third-party Google Form / Gemini |
| Sensitive | Compact user records, result records, activity logs, exam vault, integrity signature material |

## 4. Out-of-scope components

Observed but not tested beyond static identification: Vercel platform internals, ntfy.sh service, keyvalue.immanuel.co service, Google Forms, Gemini API, GitHub API, server runtime, environment variables, cookie attributes, rate limits and any third-party user accounts. No credential, token or private content from those services was accessed.

## 5. Testing status summary

| Area | Status |
|---|---|
| Frontend source pinning | Verified |
| HTTP header capture | Verified |
| Client-side function execution | Verified in isolated VM |
| Local packet / storage paths | Verified with synthetic fixtures |
| `/api/results` GET authorization | Confirmed missing by one read-only probe; values not retained |
| `/api/results` POST authorization | UNVERIFIED — no write performed |
| Live ntfy / KV content | UNVERIFIED — read-only checks found no usable snapshot |
| Server-side admin implementation | Not directly tested; only client contract observed |
