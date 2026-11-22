# Coverage Report

## Purpose

This report closes the reconnaissance task by stating what was mapped from source, what was verified in a browser, what was intentionally not inspected, and where source and runtime disagree or drifted.

## Artifact counts

| Artifact | Count |
| --- | --- |
| Pinned live HTML | 1 (`c4295c99…`, V5.1.1) |
| Generated source map | 1 (`source-map-v5.1.1.json`) |
| Findings / component categories | 9 major inventory sections + 3 generated appendices |
| Render functions inventoried | 66 |
| All functions inventoried | 324 |
| `window.TRITHUC` methods inventoried | 386 |
| `window.TRITHUC_THEME` methods inventoried | 6 |
| Storage keys inventoried | 30 |
| Accessibility snapshots archived | 11 |
| Screenshots captured | 20 |
| Runtime metric records | 2 measured viewports |

## Coverage matrix — views and states

| View / state | Source mapped | Browser opened | Viewports | Theme states | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `studentHome/curriculum` | Yes | Yes | 1440, 1280, 768, 390 | light, dark | 01, 05, 08, 09, 10, 12, 13, 15, 16; snapshots | Covered |
| `studentHome/examBank` | Yes | Yes | 1440, 768, 390 | light | 02, 11, 14; snapshots | Covered |
| `studentHome/leaderboard` | Yes | Yes | 1440, 390 | light, dark | 03, 04, 19; snapshot | Covered |
| Admin login gate | Yes | Yes | 1440, 390 | light | 07, 18; snapshot | Covered |
| Student login modal | Yes | Yes | 1440, 390 | light | 06, 17; snapshot | Covered |
| VIP registration / locked-course modal | Yes | Yes | 390 | light | 20; snapshot | Covered |
| Theme switcher (3 modes) | Yes | Yes | 1440, 390 | all | runtime metrics, 04, 16 | Covered |
| Sticky nav and overflow | Yes | Yes | 1440, 390 | light | `RUNTIME_METRICS.json` | Covered |
| Chapter accordion | Yes | Yes | 1440, 768, 390 | light | 05, 12, 20; snapshots | Covered |
| `doing` | Yes | No | — | — | source L15281 | Source-only |
| `result` | Yes | No | — | — | source L15969 | Source-only |
| Authenticated admin workspace (9 tabs) | Yes | No | — | — | source L24814–24863 | Source-only |
| Student-authenticated states | Yes | No | — | — | source state L3319–3334 | Source-only |
| 18 modal renderers | Yes | 3 opened | — | — | `ROUTES.md` modal table | Partial |
| Exam submission / anti-cheat flows | Yes | No | — | — | source L3406–3426 | Source-only |
| Cloud/GitHub/Google Form sync | Partial | No | — | — | source map function names | Source-only |

## Coverage matrix — components

| Component class | Source mapped | Runtime observed | Notes |
| --- | --- | --- | --- |
| Application shell (`appRoot`, `toastBanner`, `renderApp`) | Yes | Indirect | Toast observed in leaderboard snapshot |
| Top navigation | Yes | Yes | All 3 tabs + tools |
| Footer navigation | Yes | Yes | Present in all public views |
| Theme switcher | Yes | Yes | Modes switched and measured |
| V5 primitives | Yes | Mostly | Empty state not encountered in public data |
| Curriculum chapter/lesson cards | Yes | Yes | Expanded state captured |
| Exam bank tree/cards | Yes | Yes | Desktop/tablet/mobile |
| Leaderboard KPI/podium/table | Yes | Yes | Desktop/mobile |
| Admin shell/sidebar/data cards | Yes | No | Auth boundary |
| Matrix builder / CV7991 | Yes | No | Auth boundary |
| Exam-taking components | Yes | No | Would alter exam state |
| Result components | Yes | No | Requires submission |
| Account/device/VIP modals | Yes | Partial | Device/history modals not opened |
| Vault/security modal | Yes | No | Auth boundary |
| Toast/banners | Yes | Partial | Sync toast observed; admin banners not |

## Route cross-check

The task required cross-checking routes against router config, navigation entries, and page components.

| Cross-check | Result |
| --- | --- |
| Router config | None exists; `renderApp()` dispatch is authoritative |
| Top nav entries vs `studentNavTab` values | 3/3 match (`curriculum`, `examBank`, `leaderboard`) |
| Footer entries vs `studentNavTab` values | 3/3 match |
| Admin tab definitions vs dispatch branches | 9/9 match; `realworld` is an extra dispatch branch not in visible tab list; `gsites` is the fallback branch |
| View assignments vs `renderApp()` branches | 4/4 match (`studentHome`, `doing`, `result`, `admin`) |
| Modal mount flags vs renderer functions | 18 mapped from `renderStudentHomeView()` mount block; 3 browser-verified |
| URL params vs routing | No route usage; params are for share links and device/WebGL signals |

## Runtime cross-check

| Check | Source expectation | Runtime result |
| --- | --- | --- |
| Default view | `view: 'studentHome'`, `studentNavTab: 'curriculum'` L3255–3257 | Confirmed |
| Version marker | V5.1.1 in title and pills | Confirmed |
| Theme default | `system` persisted value / resolved `light` in test environment | Confirmed |
| Top nav position | Sticky class in V5 nav CSS | `position: sticky`, `top: 0` after scroll |
| Horizontal overflow | Responsive rules present | None at 1440/390 |
| Admin auth | Server-backed login gate | Confirmed; no local hash form |
| Tailwind warning | CDN script present L131 | Console warning observed |
| Favicon | No valid favicon link observed | 404 observed |

## Source/runtime differences and drift

1. **Build drift.** The security assessment pin V4.8.6 (`ffe94aea…`) is not the live build. This recon uses V5.1.1 (`c4295c99…`). All line references in this package are V5.1.1-specific.
2. **Dynamic exam counts.** Exam totals changed across captures: 191 → 238 total; public exams 3 → 16 → 46. The HTML hash did not change. Cause: live/cloud data loading, evidenced by the “Đã nạp 50 đề thi mới…” toast. Not a layout defect.
3. **Theme accessible names differ by viewport.** Desktop radios expose short names (`Sáng`, `Tối`, `Hệ thống`); mobile exposes `title` strings (`Chế độ Sáng (Light)`, etc.) because labels are hidden at <1280px. Recorded in `DESIGN_AUDIT.md` D-10.
4. **Admin mobile label differs.** Desktop uses “⚙️ Quản trị GV”; mobile uses “⚙️ GV”. Both route to the same gate.
5. **Screenshot 20 was recaptured.** Initial attempt clicked the grade chip and produced a duplicate of the baseline. It was replaced by opening the 🔒 Khóa VIP lesson action after expanding chapter I.
6. **Console error is cosmetic.** Favicon 404 does not affect layout or function.

## Uninspected / inaccessible components

Reason codes:

* `AUTH` — requires real student or admin credentials; no bypass performed.
* `WRITE` — would submit a form, create a record, start an exam, or trigger sync.
* `NDESTRUCT` — admin deletion/approval/wipe actions.
* `OUT_OF_SCOPE` — redesign work intentionally deferred.

| Component / state | Reason |
| --- | --- |
| 9 authenticated admin workspace tabs | AUTH |
| Vault unlock / vault password actions | AUTH |
| User approval, VIP grant, account deletion | AUTH / NDESTRUCT |
| Student account pill, history, device security modal | AUTH |
| Exam entry gate, timer, answer grid, submit, full solution | WRITE |
| VIP registration submission | WRITE |
| Google Form / cloud / GitHub push actions | WRITE |
| PDF/Excel exports | WRITE (file generation) or AUTH |
| Full keyboard/screen-reader audit | OUT_OF_SCOPE (recon depth limitation) |
| Actual redesign implementation | OUT_OF_SCOPE |

## Coverage gaps to close next

1. With explicit authorization and test credentials, capture all 9 admin tabs at 1440 and 390 in both light and dark themes.
2. Capture an authenticated student home state (account pill, VIP badge, history, device modal).
3. Capture exam entry gate in a non-destructive fixture environment; do not use production data.
4. Run a structured keyboard/screen-reader pass on nav, theme switcher, and modals.
5. Re-run source hash after any deployment; regenerate `source-map-v5.1.1.json` and this package if it changes.

## Completion status of the recon task

| Task | Status | Artifacts |
| --- | --- | --- |
| Map frontend source architecture from pinned HTML | Completed | `source-map-v5.1.1.json`, `COMPONENTS.md`, `DESIGN_MAP.md` |
| Discover complete route and view inventory | Completed | `ROUTES.md` |
| Run live browser reconnaissance and capture screenshots | Completed for public surface | 20 screenshots, 11 snapshots, `RUNTIME_METRICS.json` |
| Write frontend recon documentation package | Completed | README + 7 core docs + screenshot index |
| Verify artifacts and prepare commit | Pending verification | This report + git status check |
