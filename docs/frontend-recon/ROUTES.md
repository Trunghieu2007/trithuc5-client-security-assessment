# Route and View Inventory

## Routing model

There is **no URL router**. The application is a state machine inside one HTML document:

```js
function renderApp(preserveExamScroll) {
    const root = document.getElementById('appRoot');
    ...
    if (state.view === 'studentHome') {
        root.innerHTML = maskAuthorBranding(renderStudentHomeView());
    } else if (state.view === 'doing') {
        root.innerHTML = maskAuthorBranding(renderDoingExamView());
    } else if (state.view === 'result') {
        root.innerHTML = maskAuthorBranding(renderResultView());
    } else if (state.view === 'admin') {
        root.innerHTML = renderAdminView();
    }
    ...
}
```

Source: `renderApp()` at line 28317, dispatch at 28343–28351.

Consequences:

* All navigation is in-memory via `window.TRITHUC` methods that mutate `state` and call `renderApp()`.
* Browser Back/Forward does not navigate between views.
* Reload resets the view to `studentHome / curriculum` (line 3256–3257), except for persisted preferences such as theme, font size, and mastered-topic flags.
* There are no pathname-based deep links; `URLSearchParams` is used for share links and device/WebGL signals, not routing (source map: `url_param_uses`).

## Top-level views

| View key | Entry / trigger | Parent layout | Auth boundary | Renderer | Main sections | Related states |
| --- | --- | --- | --- | --- | --- | --- |
| `studentHome` | Default boot; footer/nav “Chương & Bài học”, “Kho Đề Thi”, “Bảng Vàng” | `renderTopNavbar()` + `<main>` + `v5-footer` | Public | `renderStudentHomeView()` L10089 | Top nav, optional teacher preview banner, tab body, footer, 16 modal mount points | `studentNavTab`, `showStudentLoginModal`, `pendingExam`, `leaderboardModalExamId`, device/sync modals |
| `doing` | `startExam` / `window.TRITHUC` exam entry methods after entry gate | Full-screen exam shell with `body.doing-exam` | Student login + exam entry password where configured | `renderDoingExamView()` L15281 | Left question box, right answer grid, timer, anti-cheat layer, confirm-submit modal, full-solution modal | `selectedExam`, `ans`, `timeLeft`, `flaggedQuestions`, `showConfirmSubmitModal`, `showFullSolutionModal` |
| `result` | Submit exam | Student result shell | Student session/result context | `renderResultView()` L15969 | Score summary, part breakdown, answer review, export actions | `lastSubmitResult`, `isReviewMode` |
| `admin` | `window.TRITHUC.openAdminPortal()` from nav | `v511-admin-shell` (L2180) with sticky topbar, mobile pill tabs, grouped sidebar, main panel | Server-side `/api/admin/login` gate; no local hash fallback in V5.1.1 | `renderAdminView()` L24748 | Login gate when unauthenticated; otherwise 9-tab workspace | `adminTab`, `isAdminLoggedIn`, `adminHeaderCollapsed`, vault/preview/share modals |

Browser-verified: `studentHome` (all 3 subtabs), `admin` login gate only.
Source-only: `doing`, `result`, authenticated `admin` workspace (intentionally not entered).

## Student navigation (`state.studentNavTab`)

Defined in `renderTopNavbar()` at lines 9946–9950 and dispatched in `renderStudentHomeView()` at lines 10094–10100.

| Tab id | Label | Nav entry | Renderer | Source line | Browser verified | Related |
| --- | --- | --- | --- | --- | --- | --- |
| `curriculum` | 📚 Chương & Bài học | Top nav, brand box, footer | `renderCurriculumSection()` | 13844 | Yes — 1440/1280/768/390 | Grade chips, semester chips, search, chapter cards, lesson cards |
| `examBank` | 📝 Kho Đề Thi | Top nav, footer | `renderExamBankSection()` | 15002 | Yes — 1440/768/390 | Tree sidebar, status filter, exam cards, “Vào thi”, “Mở VIP” |
| `leaderboard` | 🏆 Bảng Vàng & Điểm | Top nav, footer | `renderLeaderboardSection()` | 15050 | Yes — 1440/390 | Podium cards, result table, top-20 modal |
| `realWorld` | (internal legacy tab) | Not in current nav | `renderRealWorldStudentSection()` | 9739 | Source only | Normalized back to `curriculum` at lines 10090–10092 |

`switchStudentNav(tab)` at line 31059 sets `state.studentNavTab`, forces `studentHome`, and re-renders.

## Admin navigation (`state.adminTab`)

Nine tabs defined at lines 24814–24824 and dispatched at 24827–24836. Sidebar groups are defined at 24838–24863.

| Tab id | Label | Renderer | Source line | Sidebar group | Browser state |
| --- | --- | --- | --- | --- | --- |
| `matrix_builder` | 1. Làm Đề & Ma Trận (Từ Phần E) | `renderAdminMatrixBuilderTabV44()` | 17384 | Soạn Đề & Ma Trận | Not opened (auth required) |
| `cv7991_matrix` | 1B. Ma Trận CV 7991 & Tự Sinh Đề | `renderAdminCv7991MatrixTabV457()` | 19089 | Soạn Đề & Ma Trận | Not opened |
| `sync_mock_to_e` | 2. Bóc Tách Dạng Mới → Phần E | `renderAdminSyncMockToSectionETabV44()` | 20600 | Soạn Đề & Ma Trận | Not opened |
| `exams` | Kho Đề & Bài Học | `renderAdminExamsTab()` | 26259 | Học Liệu & Kho Đề | Not opened |
| `lessons` | Quản Lý & Sửa Bài Học | `renderAdminLessonsTab()` | 24996 | Học Liệu & Kho Đề | Not opened |
| `users` | Tài Khoản & Duyệt VIP | `renderAdminUsersTab()` | 25201 | Học Sinh & Hệ Thống | Not opened |
| `create` | Tạo / Nạp Đề (Chuẩn V9.6 PRO) | `renderAdminCreateTab()` | 26426 | Học Liệu & Kho Đề | Not opened |
| `results` | Phổ Điểm & Excel | `renderAdminResultsTab()` | 27312 | Học Sinh & Hệ Thống | Not opened |
| `gsites` | Mã Hóa Kho Đề & Bảo Mật (Mục 5) | `renderAdminGSitesTab()` | 27863 | Học Sinh & Hệ Thống | Default fallback branch |

`switchAdminTab(tab)` at line 33128 sets `state.adminTab = tab`. `openAdminUsersApprovalDirectly()` jumps to `users`. The mobile `<select>` and pill row map to the same nine ids (lines 24880–24884 and 24916–24923).

### Admin workspace chrome

* Sticky topbar `.v511-admin-topbar` (L2186) with collapse toggle, version pill, active-tab breadcrumb, theme switcher, vault lock, author toggle, VIP-link, student-page, and logout controls.
* Mobile/tablet horizontal pill tabs `.v511-admin-mobile-tabs` (L24916).
* Desktop grouped sidebar `.v511-admin-sidebar` (L2205), visible at `min-width: 1024px`.
* Main panel `.v511-admin-main` with alert banner, pending-registration hero, and selected tab body (L24950+).

## Modal and overlay inventory

Mounted from `renderStudentHomeView()` at lines 10149–10165; admin-owned modals are mounted from `renderAdminView()`.

| State flag / condition | Modal renderer | Source line | Trigger example | Browser captured |
| --- | --- | --- | --- | --- |
| `showStudentLoginModal` | `renderStudentLoginModal()` | 10276 | 🔐 Đăng nhập / 📝 Đăng ký | Yes (desktop + mobile) |
| `showShareVipLinkModal` | `renderShareVipLinkModal()` | 10169 | 🔗 Link ĐK | Source only |
| `pendingExam` | `renderEntryGateModal()` | 15162 | ▶ Vào thi | Source only |
| `leaderboardModalExamId` | `renderExamTop20Modal()` | 16121 | 🏆 on an exam card/row | Source only |
| `editingLessonModalId` | `renderAdminEditLessonModal()` | — | Admin lesson edit | Not entered |
| `editingRealWorldModal` | `renderEditRealWorldModal()` | — | Admin real-world edit | Not entered |
| `deviceBlockedModalInfo` | `renderDeviceBlockedSecurityModal()` | 10649 | Third-device block | Source only |
| `studentDeviceSecurityModalOpen` | `renderStudentDeviceSecurityModal()` | 10735 | 👤/🛡️ account pill | Not entered |
| `adminManageDeviceUserId` | `renderAdminManageDeviceModal()` | 10823 | Admin device management | Not entered |
| `viewingStudentHistoryId` | `renderStudentHistoryDetailModal()` | 26124 | 📜 Lịch sử | Not entered |
| `showVaultUnlockModal` | `renderVaultSecurityModalV44()` | 24592 | 🔐 Khóa Admin | Source only |
| `quickPasswordExamId` | `renderQuickExamPasswordModalV44()` | 24448 | Exam quick password | Source only |
| `matrixBuilder.previewItemModal` | `renderMatrixItemSampleModalV44()` | — | Matrix preview | Not entered |
| `matrixBuilder.showPdfExportModal` | `renderMatrixPdfExportModalV44()` | — | PDF export | Not entered |
| `matrixBuilder.showBatchExportModal` | `renderMatrixBatchExportModalV50()` | — | Batch export | Not entered |
| `matrixBuilder.showV95SetupModal` | `renderMatrixV95SetupModalV44()` | — | V95 setup | Not entered |
| `mockToESync.previewQuestionItem` | `renderMockQuestionPreviewModalV44()` | — | Mock extraction preview | Not entered |
| Locked course / VIP registration | `openLockedCourseModal()` path | — | 🔒 Khóa VIP on lesson | Yes (mobile) |
| Admin login gate | Early branch in `renderAdminView()` | ~24748 | ⚙️ Quản trị GV | Yes (desktop + mobile) |

## Navigation entry-point cross-check

| Entry point | Source | Runtime result |
| --- | --- | --- |
| Top nav 3 tabs | `stuTabs` L9946–9950, `switchStudentNav` L31059 | All three switched views without URL change |
| Footer 3 buttons | L10141–10143 | Present in all public-view snapshots |
| Brand box | L9963 | Routes to `curriculum` |
| 🔐/📝 account buttons | L10059–10068 | Opened student login modal |
| ⚙️ Quản trị GV / ⚙️ GV | L10078 / mobile L9990 | Opened server-auth admin gate; no credentials submitted |
| 🔗 Link ĐK | L10071 / L9990 area | Present; not opened in this pass |
| Theme radiogroup | L108–126 / L10016–10017 | All 3 modes switched; `system` restored |
| Grade chips | Curriculum toolbar L~9955 area | Applied filters; locked state observed |
| Exam bank tree | `examBankUI.student` L3446–3454 | Expanded nodes and filtered list observed |
| Search boxes | `onSearchChange`, `setExamBankSearchV458` | Present; typing not submitted in this pass |

## Gaps by design

The following are known but deliberately uninspected:

1. Any state behind a real student account (account pill, history, device binding, VIP entitlement).
2. Any state behind a real admin session (9 workspace tabs, vault, user approval, result export).
3. `doing` / `result` views because entering them creates exam state and may trigger anti-cheat logging or cloud sync.
4. Exam submission, VIP registration submission, password reset, and any write path.
