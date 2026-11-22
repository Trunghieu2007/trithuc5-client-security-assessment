# Frontend Reconnaissance Package — TRITHUC5.0

## Purpose

This package is the **pre-redesign reconnaissance baseline** for `https://trithuc500.vercel.app/`. It maps the entire publicly reachable frontend: architecture, state-driven views, navigation, components, interactions, design system, responsive behavior, and visual evidence. **No redesign or refactor has been started.**

The work was performed as reverse-mapping plus read-only browser inspection. No credentials were submitted, no authentication was bypassed, no forms were submitted, and no production data was modified.

## Build identity

| Item | Value |
| --- | --- |
| Live build discovered during this recon | **V5.1.1** |
| Live HTML SHA-256 | `c4295c9924391721d8a552a6d6723a1b61928d2cee371b75b33af77bbdb62104` |
| Live HTML size | 9,171,146 bytes / 35,796 lines |
| Security-assessment pin | V4.8.6 / `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185` |
| Relationship | The site changed again after the V4.8.6 security assessment. This recon re-pins to the **live V5.1.1** build; security findings remain pinned to V4.8.6 unless explicitly retested. |

See [`SOURCE_PIN.md`](SOURCE_PIN.md) for hashes, provenance, and the export location.

## Critical architecture summary

* **Single-file application**: one HTML document, no framework build step, no URL router.
* **Rendering model**: global `state` object → `renderApp()` → `root.innerHTML = render…()`.
* **View keys**: `studentHome`, `doing`, `result`, `admin`.
* **Sub-navigation**: `state.studentNavTab` (`curriculum`, `examBank`, `leaderboard`) and `state.adminTab` (9 tabs).
* **Theme engine**: zero-FOUC inline script, 3 modes (`light`, `dark`, `system`), persisted as `trithuc_theme_mode_v5`, exposed via `window.TRITHUC_THEME`.
* **Styling**: Tailwind CDN + a large hand-written CSS layer with V5/V4.3.1/V5.1.1 token families.
* **Public API**: `window.TRITHUC` exposes 386 methods; 66 render functions were discovered.

## Package contents

| File | What it covers |
| --- | --- |
| [`SOURCE_PIN.md`](SOURCE_PIN.md) | Build pin, drift from V4.8.6, source export path, hash verification |
| [`ROUTES.md`](ROUTES.md) | Complete state-based route/view inventory, nav entries, auth boundaries, modal inventory |
| [`COMPONENTS.md`](COMPONENTS.md) | Application shell, navigation, UI primitives, data display, feedback, overlays, domain components, state/API |
| [`INTERACTIONS.md`](INTERACTIONS.md) | Browser-verified interactions, scroll/sticky behavior, console observations, safety boundary |
| [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md) | Visual/UX/theme strengths, defects, risks, and prioritized recommendations |
| [`DESIGN_MAP.md`](DESIGN_MAP.md) | Source-token → visual-role → screenshot mapping |
| [`REDESIGN_BLUEPRINT.md`](REDESIGN_BLUEPRINT.md) | Target architecture and phased redesign plan (blueprint only) |
| [`SCREENSHOTS/`](SCREENSHOTS/README.md) | 20 desktop/laptop/tablet/mobile screenshots with state index |
| [`SNAPSHOTS/`](SNAPSHOTS/) | 11 raw accessibility snapshots used as interaction evidence |
| [`source-map-v5.1.1.json`](source-map-v5.1.1.json) | Machine-generated inventory of functions, methods, state keys, storage keys, tokens, and line pins |
| [`RUNTIME_METRICS.json`](RUNTIME_METRICS.json) | Measured viewport, overflow, theme, DOM counts, and sticky-nav behavior |
| [`COVERAGE_REPORT.md`](COVERAGE_REPORT.md) | Coverage matrix, gaps, inaccessible states, source/runtime cross-check |

## Coverage at a glance

* **Viewports**: 1440×900, 1280×800, 768×1024, 390×844.
* **Public views inspected live**: `studentHome/curriculum`, `studentHome/examBank`, `studentHome/leaderboard`, admin login gate, student login modal, locked-course/VIP registration modal, light and dark themes.
* **View/state known from source but not browser-opened**: `doing`, `result`, all 9 authenticated admin workspace tabs, student-authenticated account pills/history/device modals. Reason: they require credentials or would move into transactional/exam state, which is outside the read-only recon boundary.
* **Screenshots**: 20 files in `SCREENSHOTS/`, also exported to `C:\Users\Admin\Desktop\Misc\Miscs\WebSource`.
* **Source artifact**: live HTML exported to `C:\Users\Admin\Desktop\Misc\Miscs\WebSource\trithuc500-live-V5.1.1-c4295c99.html`.

## Reproduction

```bash
curl -sS https://trithuc500.vercel.app/ -o live.html
sha256sum live.html
# Expected recon pin: c4295c9924391721d8a552a6d6723a1b61928d2cee371b75b33af77bbdb62104
```

Browser inspection used a named persistent session and targeted the four viewports above. Snapshots are stored as YAML under `SNAPSHOTS/`.

## Evidence standard

Every visual claim in this package is backed by either (a) a source line pin in the live HTML, (b) a stored accessibility snapshot, or (c) a screenshot with a stable filename. Claims that could not be verified are explicitly marked **unverified** in [`COVERAGE_REPORT.md`](COVERAGE_REPORT.md).
