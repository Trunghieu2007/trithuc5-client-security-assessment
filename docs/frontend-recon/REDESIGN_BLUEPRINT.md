# Redesign Blueprint

## Status

**Blueprint only.** No redesign, refactor, or code change has been started. This document defines the target state so that a later redesign can be executed against the reconnaissance baseline in this package.

## Design goals

1. Preserve the existing information architecture: three student tabs and nine admin tabs.
2. Keep the V5 token language and three-mode theme as the visual foundation.
3. Make views addressable, reload-safe, and Back/Forward-friendly.
4. Replace the single-file render model with scoped components and a small state store.
5. Reduce emoji dependence while keeping the friendly tone where appropriate.
6. Improve mobile content area without hiding primary navigation.
7. Make authenticated states auditable before they are redesigned.

## Target architecture

```text
src/
  styles/
    tokens.css          # V5 tokens + dark overrides (single source of truth)
    base.css            # reset, typography, focus rings
    components.css      # v5-* primitives, generated from component styles
    legacy-compat.css   # v431-*/eb-*/mat-* retained during migration
    admin-v511.css      # admin studio classes
  theme/
    theme-engine.js     # extracted from L10–130, no inline script duplication
  core/
    state.js            # single store with subscriptions
    router.js           # hash or History API adapter
    render.js           # mount/root lifecycle, scoped updates
    api.js              # window.TRITHUC replacement surface
  components/
    nav/                # top nav, footer nav, admin sidebar, mobile tabs
    primitives/         # card, chip, badge, button, kpi, empty state, modal
    domain/
      curriculum/
      exam-bank/
      leaderboard/
      exam-taking/
      result/
      admin/
  views/
    StudentHomeView.js
    DoingView.js
    ResultView.js
    AdminView.js
  adapters/
    storage.js          # STORAGE_KEYS, safeStorage, window.name, cookie
    cloud.js            # sync/status actions
    auth.js             # server login/session boundary
```

Migration principle: **extract first, restyle second**. Visual redesign before extraction would multiply risk across 35k lines.

## Routing target

| Current state | Target route |
| --- | --- |
| `studentHome/curriculum` | `/` or `#/curriculum` |
| `studentHome/examBank` | `#/exam-bank` |
| `studentHome/leaderboard` | `#/leaderboard` |
| `doing` | `#/exam/:examId` |
| `result` | `#/result/:attemptId` |
| `admin/matrix_builder` | `#/admin/matrix-builder` |
| other 8 admin tabs | `#/admin/<tab-id>` |
| admin unauthenticated | `#/admin/login` |

Requirements:

* Reload restores view, tab, and selected filters from route + safe local preferences.
* Back/Forward works across student tabs and admin tabs.
* Auth guard redirects to login without revealing workspace content.
* Deep links never expose exam answers or admin data.

## Component system target

### Primitives to formalize

| Primitive | Current classes | Target API |
| --- | --- | --- |
| Surface card | `.v5-surface-card`, `.v511-data-card` | `<Card tone="default|elevated|data">` |
| Chip | `.v5-stat-chip`, `.v511-sidebar-badge` | `<Chip tone="neutral|accent|success|warning|danger">` |
| Button | `.v5-nav-btn-primary/secondary/admin` | `<Button variant="primary|secondary|admin|danger" size="sm|md">` |
| Accordion | `.v5-chap-card/header/toggle` | `<Accordion item>` with controlled open state |
| KPI | `.v5-kpi-card`, `.v511-mini-kpi` | `<Kpi label value trend>` |
| Podium | `.v5-podium-card` | `<Podium rank name detail score>` |
| Empty state | `.v5-empty-state` | `<EmptyState icon title description action>` |
| Modal | 18 conditional renderers | `<Modal open onClose labelledBy>` with focus trap |
| Theme switcher | `.v5-theme-switcher` | `<ThemeSwitcher variant="default|compact">` |
| Tree | `.eb-*` / `.mat-*` | `<Tree nodes selectionPolicy>` |

### Composition rules

* No domain component writes `appRoot.innerHTML`.
* State changes emit events; only subscribed components re-render.
* Domain data is passed as props from view containers.
* Modals are rendered through a single portal host, not appended per view.
* Every icon-only control requires `aria-label`; decorative emoji gets `aria-hidden="true"`.

## Visual redesign direction

### Keep

* Existing blue accent and semantic green/amber/red roles.
* Three-mode theme with OS sync.
* Version pill and compact status chips.
* Two-column exam bank tree on desktop/mobile.
* Admin grouping into Soạn Đề / Học Liệu / Học Sinh & Hệ Thống.

### Change

| Area | Current | Target |
| --- | --- | --- |
| Icons | 1,023 emoji glyphs | One SVG icon set; emoji limited to podium/celebration accents |
| Mobile header | 141px sticky, three rows | 56px title+tab row; tools in an overflow sheet; expand on scroll-up |
| Navigation state | In-memory only | Route-backed with visible breadcrumb |
| Control density | 515 buttons in source | Group primary/secondary actions; use overflow menus in data rows |
| Data freshness | Toast only | “Cập nhật lúc …” timestamp + skeleton during sync |
| Focus | Lost on full re-render | Scoped render + explicit focus management |
| Theme labels | Hidden below 1280px | Short labels or robust `aria-label` on compact controls |
| Admin workspace | Source-only verified | Re-audit all 9 tabs in light/dark at 4 viewports before restyling |

## Phased execution plan

### Phase 0 — Baseline freeze (complete)

* Pin live source and hash.
* Capture screenshots and snapshots.
* Document routes, components, interactions, design audit, and gaps.

### Phase 1 — Build pipeline and extraction

* Add Tailwind build; remove CDN.
* Split CSS into token/base/component/legacy/admin layers.
* Extract theme engine verbatim, preserving behavior and storage key.
* Add favicon; remove duplicate `lessonSubTabs`.

Acceptance: production bundle has no Tailwind CDN warning; theme behavior matches screenshots 04/16; hash-pinned regression snapshots pass.

### Phase 2 — State, router, and render lifecycle

* Introduce store with subscriptions.
* Add hash router for four views and nine admin tabs.
* Replace full `appRoot.innerHTML` with scoped mounts.
* Preserve scroll and focus.

Acceptance: reload restores route/tab; Back/Forward works; focus remains on search input after filter changes.

### Phase 3 — Component extraction

* Extract primitives first, then public domain components, then admin components.
* Keep legacy CSS classes as aliases during migration.
* Route all modal flags through a portal modal manager.

Acceptance: component tree documented; no direct `appRoot.innerHTML` in domain components; modal focus trap verified.

### Phase 4 — Visual polish

* Apply SVG icon set.
* Compact mobile header.
* Normalize data-card/table density.
* Add freshness indicators and skeletons.
* Re-audit dark mode in admin.

Acceptance: redesign screenshots at all four viewports; no horizontal overflow; WCAG AA contrast report for text and controls.

### Phase 5 — Authentication-aware verification

* With explicit authorization and test credentials, open all admin tabs and student-authenticated states.
* Capture light/dark screenshots at 1440/1280/768/390.
* Update `ROUTES.md`, `COMPONENTS.md`, and `COVERAGE_REPORT.md`.

Acceptance: zero “unverified” rows for authenticated views; no production writes from recon sessions.

## Non-goals for the redesign

* Changing exam grading, VIP entitlement logic, or server endpoints.
* “Fixing” security findings from `docs/audit/` as part of a visual redesign.
* Reproducing the admin UI locally via mocks; that is explicitly out of scope for recon and redesign.
* Restoring author branding beyond the existing user toggle.

## Acceptance checklist

- [ ] Every view and admin tab has a stable route.
- [ ] Theme choice survives reload and OS changes correctly.
- [ ] No Tailwind CDN console warning.
- [ ] Favicon returns 200.
- [ ] Mobile header ≤ 72px in collapsed state.
- [ ] No horizontal overflow at 390/768/1280/1440.
- [ ] All icon-only controls have `aria-label`.
- [ ] Modal focus trap and Escape-to-close verified.
- [ ] All authenticated states re-captured in both themes.
- [ ] This recon package remains the immutable pre-redesign baseline.
