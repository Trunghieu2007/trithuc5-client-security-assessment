# Design Audit

## Scope

Audit of the **publicly reachable V5.1.1 frontend** as captured in 20 screenshots and 11 accessibility snapshots. Authenticated admin/student states were not opened, so findings about those areas are explicitly marked **unverified**.

## Overall assessment

The V5.1.1 build has a coherent, modern design direction: a tokenized three-mode theme, compact information architecture, clear content hierarchy, responsive navigation, and a newly structured admin studio. The public views are visually consistent in both light and dark modes and do not overflow horizontally at the tested breakpoints.

The main problems are structural rather than purely visual: the entire application is a 35,796-line single file with no router or component framework, icons are overwhelmingly emoji-based, Tailwind is loaded from a CDN in production, navigation state is not addressable, and the mobile sticky header consumes a large share of the viewport.

## Strengths

| # | Strength | Evidence |
| --- | --- | --- |
| S1 | **Unified V5 token system.** Background, surface, text, border, accent, semantic, shadow, and radius tokens are defined once and mirrored to legacy variables (L1558–1605). | `DESIGN_MAP.md`, screenshots 01–19 |
| S2 | **Three-mode theme with zero-FOUC.** Inline bootstrap before Tailwind sets `data-theme`, `data-theme-mode`, `colorScheme`, and `dark` class (L10–130). | Runtime metrics, screenshots 04/16 |
| S3 | **Dark mode is genuinely applied on public views.** Desktop leaderboard and mobile curriculum both show dark surfaces, text, tables, and cards. | screenshots 04, 16 |
| S4 | **Clear public IA.** Exactly three student tabs, repeated in top nav and footer, with descriptive labels. | all public snapshots |
| S5 | **Responsive without horizontal overflow.** Measured `scrollWidth == clientWidth` at 1440 and 390. | `RUNTIME_METRICS.json` |
| S6 | **Sticky navigation persists.** Nav stays at `top: 0` after 1200px scroll at both measured sizes. | `RUNTIME_METRICS.json` |
| S7 | **Version and context markers.** `V5.1.1` pills appear in nav, admin topbar, footer, and document title. | screenshots 01, 07, 13 |
| S8 | **Admin studio IA is well structured.** Nine tabs are grouped into three business clusters with badges and mobile pills. | source L24814–24863 |
| S9 | **Reusable V5 primitives exist.** Surface, context strip, stat chip, chapter card, KPI, podium, empty state, footer. | L1796–1896 |
| S10 | **Accessibility affordances present.** Theme switcher is a `radiogroup` with `aria-checked` and `tabindex`; topbar/sidebar use `aria-label`. | snapshots, source |

## Findings

Severity here is **design/UX priority**, not security severity.

| ID | Priority | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| D-01 | High | **No URL routing or deep linking.** Views are `state.view`/`state.adminTab` only; reload resets to default; Back button does not navigate. | L28317–28351, L3255–3257 | Introduce hash or History API routes for the four views and nine admin tabs; preserve tab state on reload. |
| D-02 | High | **Monolithic single-file architecture.** 35,796 lines, 324 functions, 66 render functions, 386 public API methods in one document. | source map | Split into modules: tokens CSS, components, view renderers, state store, API/adapters, theme engine. This is prerequisite for a safe redesign. |
| D-03 | Medium | **Tailwind CDN in production.** Browser emits an explicit production warning; runtime JIT adds cost and FOUC risk. | console log, `cdn.tailwindcss.com` at L131 | Build Tailwind at compile time and ship a static stylesheet; purge unused classes. |
| D-04 | Medium | **Emoji-dominant icon system.** 1,023 emoji-like glyphs vs 19 inline SVGs. Icons change appearance across OS/browser and carry weak semantics. | source map, screenshots | Replace with a single SVG icon set; keep emoji only where intentionally playful. Add `aria-hidden` and text labels. |
| D-05 | Medium | **Mobile sticky header is tall.** 141px of 844px (16.7%) at 390×844; three rows plus tools. | `RUNTIME_METRICS.json`, screenshot 13 | Collapse to a compact title+tab row on scroll; keep theme/admin/share in an overflow menu. |
| D-06 | Medium | **Full `innerHTML` re-render on nearly every action.** Scroll is restored for selected containers but focus is only restored for one matrix search field. | L28317–28376, L28399–28409 | Move to keyed DOM updates or component-local rendering; preserve focus and announcement semantics. |
| D-07 | Low | **Missing favicon.** `/favicon.ico` returns 404. | console error | Add a versioned favicon and link tag. |
| D-08 | Low | **Duplicate `lessonSubTabs` declaration.** L3275 and L3280 create two literals; the second overwrites the first. | source L3275/L3280 | Remove the stale declaration. |
| D-09 | Low | **Data freshness is implied, not explicit.** Exam counts shifted 191 → 238 and public exams 3 → 16 → 46 across captures. | snapshots, `RUNTIME_METRICS.json` | Add a visible “last updated” marker and stable loading skeleton for async exam data. |
| D-10 | Medium | **Theme-label collapse below 1280px.** At mobile, radio labels are hidden; accessible names become long `title` strings like “Tự động theo hệ điều hành (System)”. | CSS L1727, mobile snapshot L11–14 | Keep short visible labels or use `aria-label` distinct from `title`. |
| D-11 | Low | **Admin dark-mode coverage unverified.** Public views are consistent; admin workspace was not authenticated, so V5.1.1 admin classes could not be visually checked in dark mode. | coverage gap | Re-run dark-mode screenshots after an authorized admin test session. |
| D-12 | Low | **Icon-only controls rely on `title`.** Several buttons (🔗, 🏆, compact tools) expose only emoji plus tooltip. | mobile snapshot L15, exam-bank snapshot L166 | Add `aria-label` with a short verb-noun phrase. |

## Theme and visual consistency

| Aspect | Result |
| --- | --- |
| Light mode | Default resolved theme in test environment; surfaces white/very light, text slate, accent blue |
| Dark mode | Tested on leaderboard (1440) and curriculum (390); consistently dark nav, cards, chips, table, footer |
| System mode | Correctly resolves to `light` under test environment and listens for OS changes |
| Color semantics | Success green, warning amber, danger red, accent blue tokens defined for both themes |
| Contrast spot-check | Captured views show readable primary/secondary text; a formal WCAG contrast audit was not performed |
| Tailwind utility classes | Many templates still use fixed `bg-slate-*`, `text-slate-*`, `bg-white`; no contrast failure appeared in tested views, but untested admin tabs remain a risk |

## Responsive behavior

| Breakpoint | Observed behavior |
| --- | --- |
| 1440×900 | Three tabs in segmented row; full theme switcher with labels; two-column exam bank; compact document height |
| 1280×800 | Still desktop tools; theme labels visible at 1280 exactly; no overflow measured separately at this size |
| 768×1024 | Tablet layout: compact tools, tabs full width, chapter cards stack; exam bank tree still visible |
| 390×844 | Brand row with compact icons, tabs full width, login/register buttons full width, grade chips wrap; sticky nav 141px |
| `< 640px` | Mobile-specific CSS active; long chapter headings wrap to 3–4 lines |

## Accessibility notes

Positive:

* `radiogroup` / `radio` semantics for theme switcher.
* `aria-label` on admin topbar selects and sidebar.
* `tabindex` management on theme options.
* Native buttons, checkboxes, text inputs, and selects rather than click-only divs for most controls.

Not verified / needs follow-up:

* Keyboard-only end-to-end traversal.
* Focus visibility after full re-render.
* Color contrast measurement against WCAG AA.
* Modal focus trapping and Escape-to-close behavior.
* Screen-reader announcement for toast and async exam-count updates.

## Prioritized design actions

1. Establish an actual build pipeline and split the single file into modules (D-01, D-02, D-03).
2. Introduce addressable routes and state restoration (D-01).
3. Replace emoji iconography with an SVG icon system and normalize `aria-label` usage (D-04, D-12).
4. Compact the mobile sticky header and add scroll-aware behavior (D-05).
5. Replace full re-render with scoped updates; preserve focus (D-06).
6. Add favicon, dedupe state literals, and expose data-freshness indicators (D-07, D-08, D-09).
7. Re-audit authenticated admin views in both themes (D-11).
