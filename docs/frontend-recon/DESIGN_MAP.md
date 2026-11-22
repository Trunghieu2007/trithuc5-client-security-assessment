# Design Map — Source Tokens to Visual Roles

This file maps the V5.1.1 source-level styling contracts to what they produce on screen. Line numbers refer to SHA `c4295c99…`.

## Layer model

| Layer | Source location | Role | Example evidence |
| --- | --- | --- | --- |
| Inline theme bootstrap | L10–130 | Pre-paint resolution of light/dark/system before CSS/body | Screenshot 04/16 |
| Tailwind CDN | L131, L1554 marker | Utility classes used directly in template strings | All screenshots |
| V5 design system | L1554–1774 | New token layer + reusable primitives | Curriculum, leaderboard, nav |
| Legacy responsive/editorial CSS | ~L1400–1553, L1729–2174 | v431-*, eb-*, math, print, exam styling | Exam bank, chapter tree |
| V5.1.1 admin studio | L2177–2401 | Admin shell, sidebar, tabs, data cards | Not browser-verified |
| Template strings | L9739 onward | Compose views and modals from classes/state | All snapshots |

## Core V5 tokens

Defined under `:root` at L1558–1605; dark overrides at L1607+.

| Token family | Light value | Visual role |
| --- | --- | --- |
| `--bg-canvas` | `#f4f6fa` | Page background |
| `--bg-surface` | `#ffffff` | Cards, nav, table surfaces |
| `--bg-elevated` | `#ffffff` | Active theme button / elevated control |
| `--bg-subtle` | `#eef2f7` | Chips, secondary fills |
| `--bg-hover` | `#e5ebf4` | Hover state |
| `--text-primary` | `#0f172a` | Headings and primary text |
| `--text-secondary` | `#334155` | Body text |
| `--text-muted` | `#64748b` | Metadata and secondary labels |
| `--border-subtle` | `#e2e8f0` | Card/chip borders |
| `--border-strong` | `#cbd5e1` | Hover/emphasis borders |
| `--accent` | `#1d4ed8` | Primary action, active tab, chapter accent |
| `--accent-hover` | `#1e40af` | Primary hover |
| `--accent-soft` / `--accent-border` / `--accent-text` | light blue set | Badges, chips, active text |
| `--success*` | green set | Free/open/authorized states |
| `--warning*` | amber set | VIP/pending/gold podium |
| `--danger*` | red set | Logout, locked/danger |
| `--nav-bg` / `--nav-border` | translucent white | Sticky nav glass effect |
| `--chap-header-bg` / `--chap-header-hover` | slate tints | Chapter accordion header |
| `--shadow-xs/sm/md` | layered slate shadows | Depth hierarchy |
| `--radius-sm/md/lg/xl` | 8/12/16/20px | Consistent rounding |

Legacy aliases mapped at L1598–1604:

```text
--primary       → var(--accent)
--primary-dark  → var(--accent-hover)
--bg-color      → var(--bg-canvas)
--surface       → var(--bg-surface)
--text-main     → var(--text-primary)
--border        → var(--border-subtle)
```

## Theme engine map

| Source artifact | Runtime effect |
| --- | --- |
| `STORAGE_KEY = 'trithuc_theme_mode_v5'` L13 | Persists user choice |
| `VALID_MODES` L14 | Restricts to light/dark/system |
| `resolveTheme()` L34–38 | System → OS preference |
| `applyTheme()` L60–72 | Sets `data-theme-mode`, `data-theme`, `colorScheme`, `.dark` |
| `syncSwitcherControls()` L40–58 | `aria-checked`, `tabindex`, active class, status text |
| `renderSwitcherHtml()` L108–127 | Builds radiogroup with Sun/Moon/Monitor SVGs |
| `window.TRITHUC_THEME` L95–128 | `getMode`, `getResolved`, `setMode`, `cycleMode`, `syncControls`, `renderSwitcherHtml` |
| `window.TRITHUC` wrappers L28383–28391 | `setThemeMode`, `cycleThemeMode`, `getThemeMode` |
| `renderApp()` L28374 | Re-syncs controls after every re-render |

## Component-class → screenshot map

| Class family | Source | Visual role | Screenshot(s) |
| --- | --- | --- | --- |
| `.v431-navbar`, `.v431-nav-inner`, `.v431-brand-box` | L1732+ | Sticky public header with brand and tools | 01, 03, 13, 16 |
| `.v5-theme-switcher`, `.v5-theme-btn` | L1688–1727 | 3-mode radiogroup | 01, 04, 13, 16 |
| `.v5-brand-title`, `.v5-version-pill`, `.v5-author-pill` | ~L1730+ | Branding/version/author markers | 01, 13 |
| `.v5-nav-btn-primary/secondary/admin` | ~L1760–1794 | Header action buttons | 01, 03, 13 |
| `.v5-context-strip` | L1803 | Grade/semester/search toolbar | 01, 10, 13 |
| `.v5-stat-chip` | L1815 | Metadata pill in chapter header | 05, 12, 13 |
| `.v5-chap-card/header/badge/toggle` | L1821–1857 | Curriculum chapter accordion | 05, 10, 12, 13 |
| `.v5-kpi-card` | L1859 | Leaderboard summary cards | 03, 04 |
| `.v5-podium-card`, `.v5-podium-1/2/3` | L1867–1877 | Top-3 ranking cards | 03, 04, 19 |
| `.v5-empty-state`, `.v5-empty-icon` | L1879–1888 | Empty placeholders | Source only |
| `.v5-footer` | L1890 | Footer surface | 01, 03, 13 |
| `.v431-curr-toolbar`, `.v431-sem-grid` | L1898–1908 | Legacy curriculum toolbar compatibility | 01, 13 |
| `.eb-*` | L1500+ | Exam-bank tree and cards | 02, 11, 14 |
| `.mat-*` | L17384+ | Matrix-builder tree/table | Admin only |
| `.v511-admin-shell/topbar/body/sidebar` | L2180–2222 | Admin studio shell | Source only |
| `.v511-admin-hero`, `.v511-data-card`, `.v511-subnav-bar` | L2316–2364 | Admin content containers | Source only |
| `.v511-mini-kpi-grid`, `.v511-exam-row` | L2365–2399 | Admin data density controls | Source only |

## Typography map

| Use | Stack | Source |
| --- | --- | --- |
| Primary UI | `"Be Vietnam Pro", "Segoe UI", system-ui, ...` | Google Fonts link L9; runtime body font measured |
| Monospace | `JetBrains Mono` | L9 |
| Math/print | `"Times New Roman", Times, serif` | CSS font-family entries in source map |
| Code / device ID | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | source map |

Visual hierarchy in screenshots: brand `text-sm/base uppercase`, page headings `h2`, chapter titles `h3`, lesson titles `h4`, metadata `text-[10px]`–`text-xs` bold. Emoji glyphs are used inline as pseudo-icons.

## Responsive map

| Rule | Source | Effect |
| --- | --- | --- |
| `@media (max-width: 1279px)` | L1727 | Hide `.v5-theme-label`; icon-only theme buttons |
| `@media (max-width: 767px)` | L~2140 area | Mobile nav and card padding adjustments |
| `@media (min-width: 640px)` | Multiple | Footer and chip row switch to horizontal |
| `@media (min-width: 768px)` | L2370 | `.v511-mini-kpi-grid` 2 → 4 columns |
| `@media (min-width: 1024px)` | L2219, L2312, L2390 | Admin sidebar visible; main padding; exam row becomes horizontal |
| `@media (min-width: 1280px)` | Multiple | Desktop theme labels and full tool labels visible |

Breakpoint utility usage from source map: `sm` 407, `md` 27, `lg` 71, `xl` 10, `2xl` 0. The build relies much more on `sm`/`lg` than on `md`/`xl`.

## Motion and state cues

| Type | Source | Notes |
| --- | --- | --- |
| Keyframes | `floatGuardMove` only | Guard animation |
| Hover transitions | `.v5-chap-card`, `.v5-chap-toggle`, `.v5-theme-btn`, `.v511-exam-row` | 0.15s ease typical |
| Sticky positioning | `.v431-navbar` z-index 40; `.v511-admin-topbar` z-index 35 | Measured nav stays at top on scroll |
| Backdrop blur | Nav and admin topbar | Glass effect |
| Toast | `#toastBanner` | Async sync feedback |

## Source → screenshot traceability

| Claim | Trace |
| --- | --- |
| Three student tabs | Source L9946–9950 → `desktop-curriculum.yaml` L10–18 → screenshot 01 |
| Theme modes | Source L111–115 → `desktop-curriculum.yaml` L20–23 → screenshot 04 |
| Chapter accordion | Source L1821–1857 → `desktop-expanded-chapter.yaml` L75–191 → screenshot 05 |
| Exam-bank two-column layout | Source L15002+ → `desktop-exam-bank.yaml` L52–148 → screenshot 02 |
| Leaderboard KPI/podium/table | Source L15050+ → `desktop-leaderboard.yaml` L47–110 → screenshot 03 |
| Admin login gate | Source ~L24748 → `desktop-admin-login.yaml` → screenshot 07 |
| Mobile compact controls | CSS L1727 → `mobile-curriculum.yaml` L11–35 → screenshot 13 |
| Dark consistency | CSS L1607+ → screenshots 04 and 16 |
