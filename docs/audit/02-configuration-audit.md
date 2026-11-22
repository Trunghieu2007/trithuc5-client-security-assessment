# 02 — Configuration audit

**Source of truth:** `research/trithuc5/current.headers` captured from `https://trithuc500.vercel.app/` on 2026-11-22T05:01:21Z, plus static analysis of the V4.8.0 bundle.
**Scope note:** Only the response headers observed from the target are assessed. TLS chain/cipher details and redirect behavior were not actively tested and are marked UNVERIFIED.

## 1. HTTP security headers

| Header | Observed value | Assessment | Evidence |
|---|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Effective HSTS policy for one year with subdomains. `preload` is absent. No downgrade path was tested. | `current.headers` |
| `Content-Security-Policy` | Absent | **Observation.** No CSP to restrict script sources, inline execution or frame ancestors. In a client-only app this does not by itself prove exploitability, but it removes a containment layer. | `current.headers`; `A-03-T01` |
| `X-Content-Type-Options` | `nosniff` | Effective against MIME sniffing on supporting browsers. New in V4.8.0. | `current.headers` |
| `X-Frame-Options` | `DENY` | Effective framing denial on supporting browsers. New in V4.8.0. CSP `frame-ancestors` still absent. | `current.headers` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Reasonable default; limits referrer leakage on cross-origin downgrade. | `current.headers` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Explicitly disables three powerful features. | `current.headers` |
| `Cache-Control` | `public, max-age=0, must-revalidate` | Appropriate for the main document; no sensitive server response was observed to cache. | `current.headers` |
| `Access-Control-Allow-Origin` | `*` | **Observation.** Wildcard CORS. No credentialed same-origin API was observed, so cross-origin credential theft is not claimed; the setting remains over-broad for any future authenticated API. | `current.headers`; `A-03-T01` |
| `Server` / `X-Vercel-Cache` / `X-Vercel-Id` | Vercel platform headers | Framework fingerprint disclosed; low risk, not a vulnerability by itself. | `current.headers` |

## 2. TLS / HTTPS

| Check | Status | Notes |
|---|---|---|
| HTTPS endpoint available | Verified | All fetches used HTTPS and returned HTTP 200. |
| HTTP → HTTPS redirect | UNVERIFIED | No HTTP request was issued during the assessment. |
| Certificate validity | UNVERIFIED | Certificate chain was not inspected. |
| TLS versions / ciphers | UNVERIFIED | Out of scope for a client-side-only assessment against shared hosting. |
| Mixed content | Not observed in pinned bundle | All observed external integrations use HTTPS. |
| Downgrade exposure | Not tested | HSTS is present with `max-age=31536000; includeSubDomains`. |

## 3. Cookie security

The application sets cookies from JavaScript, not from a server `Set-Cookie` header.

| Property | Observed behavior | Assessment |
|---|---|---|
| `SameSite` | `Strict` in V4.8.0 (was `Lax`) | Improved. Applies to non-sensitive keys only; sensitive keys are excluded entirely by `__SENSITIVE_STORAGE_RE_V480__` (2227). |
| `HttpOnly` | Absent | Expected for JS-set cookies; no server session cookie exists to protect. |
| `Secure` | Absent | Cookie is same-origin and non-sensitive after V4.8.0 filtering; still a hardening gap if cookies are used more broadly. |
| `Path` / `Domain` | `path=/`, no explicit `Domain` | Host-only cookie. |
| Lifecycle | `max-age=31536000` (one year) | Long-lived for non-sensitive mirror values. |
| Sensitive data in cookies | Not observed after V4.8.0 fix | `P3-02`, IV-24 verify sensitive keys no longer mirror. |
| Server session invalidation | Not applicable | No server-issued session observed. |

## 4. CORS

- `Access-Control-Allow-Origin: *` is present on the main document.
- No `Access-Control-Allow-Credentials` header was observed.
- No dynamic origin reflection was observed.
- No same-origin authenticated API response was identified, so no cross-origin sensitive-data-read exploit is claimed.
- Classification: **OBSERVATION**, not CONFIRMED vulnerability.

## 5. Deployment and infrastructure

| Check | Result | Evidence |
|---|---|---|
| Debug mode | Not observed in bundle | Static analysis |
| Verbose errors | Not observed in fetched responses | Header/fetch review |
| Directory listing | Not tested | Out of scope |
| Exposed config / backup files | Not observed among fetched assets | Static analysis |
| Source maps | Not observed | Static analysis |
| Publicly accessible exam bundle | `/exams-cloud.json.gz` is referenced by client sync code | Static-verified; content not stored |
| Public ntfy / KV channels | Present by design | Source constants; live content UNVERIFIED |
| Cache behavior | `must-revalidate` on main document | `current.headers` |
| Reverse proxy misconfiguration | Not observed / not tested | Vercel platform headers only |

## 6. Configuration verdict

| Severity | Issue | Status |
|---|---|---|
| Informational | Missing CSP | OBSERVATION |
| Informational | Wildcard CORS without observed credentialed API | OBSERVATION |
| Informational | JS-set cookies lack `Secure` / `HttpOnly` | OBSERVATION after V4.8.0 sensitive-key filtering |
| Positive | HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy | Verified present |

No configuration-only finding is claimed as an independently exploitable vulnerability in this report.
