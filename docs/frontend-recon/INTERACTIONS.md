# Interaction Inventory

All interactions below were observed in a real browser against the live V5.1.1 build unless marked **source-only**. No credentials were entered, no form was submitted, no exam was started, and no production write was performed.

## Browser session and safety boundary

* Tool: `playwright-cli`, named session `ttrecon`, persistent profile.
* URL: `https://trithuc500.vercel.app/`.
* Allowed: opening public views, switching tabs, opening modals, switching theme, expanding chapter/tree nodes, scrolling, reading DOM/accessibility snapshots.
* Excluded: student/admin login, exam entry or submission, VIP registration submission, admin actions, cloud-sync triggers, data deletion.
* State cleanup: theme mode restored to `system`; pages reloaded between modal checks; no storage keys manually edited during live recon.

## Verified interactions

| # | Interaction | Trigger | Observed result | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Primary tab switch | Click 📚 / 📝 / 🏆 | `state.view` stays `studentHome`; `studentNavTab` changes; full `appRoot` re-render; URL unchanged | snapshots `desktop-curriculum`, `desktop-exam-bank`, `desktop-leaderboard`, `mobile-*` |
| 2 | Brand-box navigation | Click 5.0 / TRITHUC5.0 box | Routes to `curriculum` per source L9963 | source + snapshot presence |
| 3 | Theme: Sáng | Click radio “Sáng” | `data-theme="light"`, `colorScheme: light`, persisted `trithuc_theme_mode_v5=light` | source L34–71; runtime metrics |
| 4 | Theme: Tối | Click radio “Tối” | Dark tokens applied; leaderboard/curriculum remained consistently dark | screenshots 04, 16 |
| 5 | Theme: Hệ thống | Click radio “Hệ thống” | Resolves to `light` in this environment; reverts on OS change via listener L76–89 | runtime metrics |
| 6 | Compact theme switcher | Mobile viewport | Labels hidden below 1280px; icon-only buttons with `title` and `aria-checked` | mobile snapshot L11–14; CSS L1727 |
| 7 | Chapter expand | Click first “▼ Mở chương” | Chapter changes to “▲ Thu gọn”; lesson cards appear with lock/free badges, period counts, math-type counts | screenshot 05/12, `desktop-expanded-chapter.yaml` |
| 8 | Chapter collapse-all | “📂 Mở tất cả chương” / “📁 Thu gọn tất cả” present | Expanded-chapter snapshot shows both controls after expansion | `desktop-expanded-chapter.yaml` L62–64 |
| 9 | Lesson accordion | “▼ Mở Lý thuyết & Đề thi” on lesson card | Source path `toggleLessonCardOpen`; not expanded in this pass to avoid heavy math rendering | source-only |
| 10 | Exam-bank tree expand/collapse | Default tree state; “Mở rộng / Thu gọn toàn bộ cây thư mục” | Subject → grade → chapter → lesson tree visible with counts | desktop/mobile exam-bank snapshots |
| 11 | Exam-bank search | Textbox “🔍 Tìm tên đề, mã đề, trường...” | Present and focusable; no query submitted | snapshots |
| 12 | Exam status filter | Combobox with All / Public / VIP / Attempted | Present; default “Tất cả trạng thái” | snapshots |
| 13 | Grade chips | “Khối 12/11/10”, “Luyện đề”, “Đề công khai” | Filter buttons present; counts changed as cloud data loaded | curriculum snapshots |
| 14 | Semester chips | Tất cả / Học kỳ I / Học kỳ II / Chuyên đề | Present; no filter state applied in this pass | snapshots |
| 15 | Student login modal | Click 🔐 Đăng nhập | Modal with two mode tabs, device ID line, username/password/Gmail, remember checkbox, close/submit | screenshots 06/17, `desktop-student-login.yaml` |
| 16 | Student register mode | “📝 Đăng ký TK & Gói VIP mới” tab present inside modal | Not activated; form would create a registration request | source/snapshot only |
| 17 | Admin login gate | Click ⚙️ Quản trị GV / ⚙️ GV | Replaces app with full-page server-auth login gate; no local hash UI | screenshots 07/18, `desktop-admin-login.yaml` |
| 18 | Admin back action | “← Quay về trang Học sinh” present | Not clicked; reload used to reset | `desktop-admin-login.yaml` L37 |
| 19 | Locked course / VIP modal | Expand chapter, click first “🔒 Khóa VIP” | Registration modal opened with packages, plans, Gmail/device copy, submit button | screenshot 20, `mobile-locked-course.yaml` |
| 20 | Share VIP link | 🔗 Link ĐK present in nav | Not opened to avoid generating/copying share text | source-only |
| 21 | Footer nav | Click targets present | Routes to same three student tabs | snapshots L168–177 (desktop) |
| 22 | Scroll / sticky nav | Scroll 1200px on desktop and mobile | `.v431-navbar` remains at `top: 0`, `position: sticky`, `z-index: 40` | `RUNTIME_METRICS.json` |
| 23 | Horizontal overflow | Measure `scrollWidth` vs `clientWidth` | No overflow at 1440×900 or 390×844 default view | `RUNTIME_METRICS.json` |
| 24 | Full-page capture | Full-page screenshot at desktop/mobile | Captured complete curriculum content and footer | screenshots 08, 15 |

## Console observations

| Level | Message | Interpretation |
| --- | --- | --- |
| Warning | `cdn.tailwindcss.com should not be used in production` | Tailwind CDN is used at runtime; expected in this build, but a production-build concern |
| Error | `GET https://trithuc500.vercel.app/favicon.ico 404` | Missing favicon; cosmetic but visible in DevTools |
| Info | “⚡ Đã nạp 50 đề thi mới từ máy chủ Vercel!” toast | Live exam data loaded asynchronously; caused exam counts to change between captures |

## Interaction mechanics from source

| Behavior | Mechanism | Source |
| --- | --- | --- |
| Navigation state | `state.view`, `state.studentNavTab`, `state.adminTab` | L3255–3257, L3429 |
| Re-render | `renderApp()` replaces `appRoot.innerHTML` | L28317–28351 |
| Scroll preservation | Captures `window.scrollY`, matrix tree/table/PDF scroll, exam panes; restores after render | L28321–28331, L28353–28372 |
| Theme persistence | `localStorage['trithuc_theme_mode_v5']` | L13, L20–32 |
| Theme zero-FOUC | Inline `<script>` before Tailwind/CSS body paint | L10–130 |
| Focus restoration | Specialized for matrix search input only (`setMatrixBuilderSearchV44`) | L28399–28409 |
| Toast | `showToast()` into `#toastBanner` | L2407, source map |
| Modal state | Boolean/id flags in `state`, mounted conditionally in view renderers | L10149–10165 |
| Auth boundary | Admin login branches to server-backed gate; no local credential hash literal | ~L24748, verified gate screenshot |

## Observed UX behaviors worth noting

1. **Navigation is not URL-addressable.** Refresh returns to `studentHome/curriculum`; Back does not step through tabs.
2. **Data counts are eventual.** Exam totals changed from 191 → 238 across captures while the HTML hash stayed constant. The toast explains a Vercel load but there is no persistent “last synced at” indicator in the captured views.
3. **Mobile nav consumes vertical space.** The sticky header measures 141px at 390×844. It stays visible while scrolling, which is useful, but leaves roughly 703px for content.
4. **Theme is robust on public views.** Both desktop leaderboard and mobile curriculum rendered consistently in dark mode; no white/light panels were visible in the captured states.
5. **Modals are non-destructive when merely opened.** Opening login/VIP modals did not write visible state; page reload restored the default view.
6. **Buttons dominate the control surface.** 515 buttons and 196 inputs are present in source templates; the default curriculum DOM already contains 46 buttons at both measured viewports.

## Unverified interactions

The following were identified in source or navigation but not exercised:

* All 9 authenticated admin tabs and their nested actions.
* Student-authenticated account pill, device-security modal, history modal.
* Exam entry gate, answer grid, timer, flag/filter, submit, full-solution review.
* Google Form / cloud / GitHub sync actions, Excel/PDF export, vault unlock, VIP approval.
* Keyboard-only traversal beyond native radio/checkbox/button focusability; no full WCAG audit was performed.
