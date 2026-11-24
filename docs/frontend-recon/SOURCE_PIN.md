# Source Pin and Provenance

## Why this file exists

The security assessment in `docs/audit/` is pinned to **V4.8.6**. While starting frontend reconnaissance, a fresh fetch showed the live application had already moved to **V5.4.6**. Mixing the two builds would produce misleading line numbers and component maps, so this recon package uses its own explicit pin.

## Build comparison

| Attribute | Security assessment pin | Frontend recon pin |
| --- | --- | --- |
| Version | V4.8.6 | V5.4.6 |
| SHA-256 | `ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185` | `2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c` |
| Bytes | 9,120,257 | 2,777,970 |
| Lines | 34,677 | 39,205 |
| Title marker | `... (Bảng Thống Kê Nét Cao + BBT Chuẩn SGK + Kho Đề 2 Cột + CV 7991)` | `... (Quản Trị Studio + 3 Chế Độ Sáng/Tối/Hệ Thống + CV 7991)` |
| Use | `docs/audit/`, harnesses, PoCs | `docs/frontend-recon/` only |

## Live build markers

Source line numbers below refer to the **V5.4.6 recon pin**.

| Marker | Line(s) | Meaning |
| --- | --- | --- |
| `<title>` | 6 | V5.4.6 version and feature summary |
| Zero-FOUC theme engine | 10–130 | Inline pre-paint light/dark/system resolution |
| `window.TRITHUC_THEME` | 95–128 | Theme API and switcher renderer |
| Be Vietnam Pro / JetBrains Mono | 7–9 | Google Fonts loaded in `<head>` |
| V5 design system | 1554–1774 | New token layer and reusable V5 components |
| V5.4.6 admin studio | 2177–2401 | Admin shell, sidebar, mobile tabs, data cards |
| `const state = {` | 3255 | Global application state |
| `renderTopNavbar()` | 9945 | Public navigation and theme switcher placement |
| `renderStudentHomeView()` | 10089 | Student home shell and modal mount points |
| `renderApp()` | 28317 | Top-level state → view dispatcher |
| `window.TRITHUC = {` | 28382 | Public imperative API, 386 methods |

## Observed V4.8.6 → V5.4.6 frontend delta

Only frontend-relevant changes are listed; this is **not** a new security assessment.

| Area | V4.8.6 | V5.4.6 |
| --- | --- | --- |
| Title/version | V4.8.6 | V5.4.6 |
| Theme | Legacy CSS variables only | Dedicated 3-mode engine with `data-theme`, `data-theme-mode`, `colorScheme`, zero-FOUC inline bootstrap |
| Fonts | Segoe UI/system stack prominent | Be Vietnam Pro + JetBrains Mono added; Times New Roman retained for print/math |
| Admin workspace | Tabbed admin view | “Teacher Admin Studio” with sticky topbar, grouped left sidebar, mobile pill tabs, hero/subnav/data-card system |
| Version pill | V4.8.6 text in views | `V5.4.6` pill in top nav, admin topbar, footer, document title |
| Component CSS | `v431-*`, `eb-*`, `mat-*` | Adds `v5-*`, `v511-*` families while retaining legacy classes |
| Public nav | 3 student tabs + tools | Same information architecture, now with consolidated theme radiogroup and compact mobile controls |
| Icons | Emoji-heavy already | Still emoji-heavy; inline SVG count rose from 16 to 19, mainly theme icons |

## Fetch and verify

```bash
curl -sS https://trithuc500.vercel.app/ -o live.html
sha256sum live.html
wc -c -l live.html
```

Expected output at recon time:

```text
2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c  live.html
  35796 <bytes-or-lines-order-depends-on-wc-flags> live.html
```

## Export location

The user-designated destination for downloaded components/artifacts is:

```text
C:\Users\Admin\Desktop\Misc\Miscs\WebSource
```

Files written there during this recon:

```text
trithuc500-live-V5.4.6-c4295c99.html
01..20-*.png   (all screenshots, mirrored from the repo)
```

Canonical copies remain in this repository under `docs/frontend-recon/`.

## Caveats

* Public exam and result counts are **live data**, not static build content. Counts changed between captures (191 → 238 total exams; 3 → 16 → 46 public exams) while the HTML hash remained the recon pin. Do not treat those numbers as component inventory.
* Line numbers in `ROUTES.md`, `COMPONENTS.md`, and `DESIGN_MAP.md` are valid only for SHA `c4295c99…`. Re-run `frontend_recon_map_v5.py` if the build changes.


## Re-pin note (2026-11-24)

The site moved from V5.1.1/V5.1.4 to V5.4.6. A new machine-readable source map is
at [`source-map-v5.4.6.json`](source-map-v5.4.6.json). The earlier V5.1.1 map and
the V5.1.4 admin-component extraction remain as historical snapshots; their
screenshots and HTML dumps were captured against that build and were not re-run
against V5.4.6. No redesign work has been started.
