# Component Inventory

## Rendering and state architecture

| Concern | Implementation |
| --- | --- |
| Entry point | Single `index.html`-style document; `<div id="appRoot">` at line 2406 is the only view mount point |
| Toast host | `<div id="toastBanner">` at line 2407 |
| Framework | None; vanilla JS template strings and direct `innerHTML` assignment |
| State store | Global `const state = { … }` at line 3255 |
| Public imperative API | `window.TRITHUC = { … }` at line 28382 — 386 methods |
| Theme API | `window.TRITHUC_THEME = { … }` at lines 95–128 — 6 methods |
| Render functions | 66 functions whose name starts with `render` or contains `Render` |
| All functions | 324 in the full source map |
| Re-render strategy | `renderApp()` replaces the whole `appRoot`, then restores selected scroll positions and re-syncs theme controls |
| Forms | 0 `<form>` elements; 196 `<input>`, 53 `<select>`, 515 `<button>` in source templates |
| Tables | 31 `<table>` occurrences in source; 0 in the default curriculum DOM, 1 in leaderboard DOM |
| Inline SVG | 19 `<svg>` occurrences in source; 7 in the default curriculum DOM (mostly theme icons) |

There is no component framework boundary. “Components” below are **source-level render functions and reusable CSS/class contracts**, not framework components.

## 1. Application shell

| Component | Source anchor | Responsibility | Evidence |
| --- | --- | --- | --- |
| `renderApp()` | L28317 | Top-level view dispatcher, body classes, document title, scroll restoration, MathJax trigger | Source pin; runtime view switching |
| `appRoot` | L2406 | Single mount node | All snapshots |
| `toastBanner` | L2407 | Global toast host | Leaderboard snapshot shows “Đã nạp 50 đề…” toast |
| `renderTopNavbar()` | L9945 | Public header, brand, theme switcher, account/admin tools | Desktop/mobile snapshots |
| `v5-footer` | L1890, rendered L10134 | Footer with version, author toggle, duplicate navigation, theme status | All public snapshots |
| `maskAuthorBranding()` | Called at L28344–28348 | Removes author-branded nodes when `hideAuthorInfo` is true | Author pill absent in captured DOM |
| Idle blur / anti-capture overlay | Markup near L2409 | Blurs page after inactivity | Source only |
| `body.doing-exam` toggle | L28333–28337 | Enables exam-mode protections | Source only |

## 2. Navigation components

| Component | Class / state | Notes |
| --- | --- | --- |
| Primary public tab strip | `state.studentNavTab` L9946–9950, `.top-nav-tabs-3` L10001 | Three equal tabs on mobile, segmented pills on desktop |
| Mobile quick tools | `.nav-mobile-tools-v44` L9982 | Theme compact switcher, VIP link, “⚙️ GV” |
| Desktop tools | `.nav-desktop-tools-v44` L10015, L10071, L10078 | Full theme switcher, VIP link, admin portal |
| Admin topbar | `.v511-admin-topbar` L2186 | Sticky, `z-index: 35`, glass blur |
| Admin mobile tabs | `.v511-admin-mobile-tabs` L24916 | Horizontally scrollable pills for 9 tabs |
| Admin sidebar | `.v511-admin-sidebar` L2205 | Sticky grouped navigation, hidden below 1024px unless expanded |
| Sidebar item / badge | `.v511-sidebar-item`, `.v511-sidebar-badge` L2232+ | Active state via `.v511-active` |
| Breadcrumb | L24879 | `› icon label` from active tab metadata |
| Footer nav | L10141–10143 | Duplicate of top-level tabs; useful on long pages |

## 3. Reusable V5 UI primitives

Defined in the V5 design-system block at L1554–1774.

| Class | Visual role | Screenshot evidence |
| --- | --- | --- |
| `.v5-surface-card` | Generic elevated card with border and radius | Curriculum chapter cards |
| `.v5-context-strip` | Toolbar/filter strip with wrapped content | Curriculum grade/semester toolbar |
| `.v5-stat-chip` | Compact metadata pill | Chapter “6 bài học • 15 đề” chip |
| `.v5-chap-card`, `.v5-chap-header`, `.v5-chap-badge`, `.v5-chap-toggle` | Curriculum chapter accordion | 05, 10, 12, 13 screenshots |
| `.v5-kpi-card` | Leaderboard/stat KPI card | 03, 04 screenshots |
| `.v5-podium-card`, `.v5-podium-1/2/3` | Rank podium with colored top border | 03, 04, 19 screenshots |
| `.v5-empty-state`, `.v5-empty-icon` | Empty result placeholder | Source only |
| `.v5-footer` | Footer surface | All public screenshots |
| `.v5-nav-btn-primary`, `.v5-nav-btn-secondary`, `.v5-nav-btn-admin` | Header action buttons | 01, 03, 13 screenshots |
| `.v5-version-pill` | Version marker | Nav, admin topbar, footer |
| `.v5-theme-switcher`, `.v5-theme-btn` | 3-mode radiogroup with icon-only compact variant | 01, 04, 13, 16 screenshots |

## 4. V5.1.1 admin-studio components

Defined at L2177–2401 and used from `renderAdminView()`.

| Class | Visual role |
| --- | --- |
| `.v511-admin-shell` | Full-height admin layout |
| `.v511-admin-topbar` | Sticky topbar with tools |
| `.v511-admin-body` | Flex body, max width 1680px |
| `.v511-admin-sidebar` | Grouped left navigation |
| `.v511-nav-group-label` | Uppercase group label |
| `.v511-sidebar-item` / badge / active | Navigation item states |
| `.v511-admin-main` | Main workspace panel |
| `.v511-admin-hero`, `-success`, `-warning` | Tab-level hero/banner |
| `.v511-data-card`, `.v511-data-card-header` | Generic data container |
| `.v511-subnav-bar` | Secondary tab/action bar |
| `.v511-mini-kpi-grid`, `.v511-mini-kpi` | Compact KPI grid (2 cols, 4 cols at ≥768px) |
| `.v511-exam-row` | Exam row, column layout → row layout at ≥1024px |

These were mapped from source only; the authenticated admin shell was not opened.

## 5. Data-display components

| Component | Renderer / source | Data shown | Verified |
| --- | --- | --- | --- |
| Curriculum chapter tree | `renderCurriculumSection()` L13844 | Semester groups, chapter cards, lesson rows, badges, VIP locks | Yes |
| Lesson card | Inside curriculum renderer | Lesson title, periods, exam count, math-type count, theory/matrix toggles | Yes after expand |
| Exam-bank tree sidebar | `renderExamBankSection()` L15002; `examBankUI.student` L3446 | Subject → grade → chapter → lesson → exam counts | Yes desktop/mobile |
| Exam cards | Same renderer | Exam title, free/VIP badge, question breakdown, duration, code, attempts, “Vào thi” | Yes |
| Status filter | Same renderer | All / public / VIP / attempted | Yes |
| Leaderboard table | `renderLeaderboardSection()` L15050 | Rank, name, class/SBD, exam, score, part breakdown, AI/tab monitor | Yes |
| Podium cards | Same renderer | Top 3 learners | Yes |
| Matrix builder tree/table | `renderAdminMatrixBuilderTabV44()` L17384 | Question-type tree and selected rows | Source only |
| CV 7991 matrix | `renderAdminCv7991MatrixTabV457()` L19089 | Normative matrix and spec/import subtabs | Source only |
| Result report | `renderResultView()` L15969 | Score and answer review | Source only |
| Activity/user tables | `renderAdminUsersTab()` L25201 | Accounts, VIP requests, device/security state | Source only |

## 6. Feedback and status components

| Component | Trigger/state | Notes |
| --- | --- | --- |
| `showToast()` | Async sync, copy, save actions | Leaderboard snapshot captured “Đã nạp 50 đề thi mới từ máy chủ Vercel!” |
| Cloud sync badges | `cloudSyncStatus`, `examCloudSyncStatus`, `updateStudentResultSyncBadgeV475()` | Present in state; status not fully inspected |
| Teacher preview banner | `isAdminLoggedIn` L10106–10129 | Explains whether VIP locks are preview-unlocked |
| VIP / lock badges | Lesson and exam cards | “Khóa VIP”, “Miễn phí”, “🔒”, “🔓” |
| Pending registration banner | `pendingStuCount > 0` L24812, L24952 | Admin-only; source only |
| VIP hack alert banner | `renderAdminVipHackAlertBannerV44()` L24951 | Admin-only; source only |
| Violation overlay | `showViolationOverlay` L3421 | Exam-mode; source only |
| Idle blur | Anti-capture layer | Source only |

## 7. Overlay components

Full modal inventory is in [`ROUTES.md`](ROUTES.md#modal-and-overlay-inventory). Browser-verified overlays:

* **Student login/register modal** — mode tabs, device fingerprint line, username/password/Gmail fields, remember toggle, close and submit actions.
* **Admin login gate** — full-page server-auth gate with username/password, remember checkbox, brute-force lockout copy, back-to-student action. No credentials were entered.
* **Locked course / VIP registration modal** — registration form with grade packages, duration plans, Gmail/device binding copy, and submit action. No submission was made.

## 8. Domain-specific components

| Domain | Components / renderers | Source anchors |
| --- | --- | --- |
| Curriculum | Semester group, chapter accordion, lesson card, worked example, math-type card, practice answers, similar problems | `renderCurriculumSection()` L13844; state L3262–3288 |
| Exam bank | Two-column tree, subject/grade filter, node expand, action menus, exam card | `renderExamBankSection()` L15002; `examBankUI` L3446 |
| Exam taking | Left question pane, right answer grid, timer, flag, filter, anti-cheat, confirm submit, full solution | `renderDoingExamView()` L15281; state L3406–3426 |
| Result | Score summary, part breakdown, review, top-20 modal | `renderResultView()` L15969; `renderExamTop20Modal()` L16121 |
| Matrix builder | Tree filters, wide/large-font toggles, selected rows, PDF export, batch export, scoring config, DS mixer | `matrixBuilder` state L3467–3551 |
| CV 7991 | Matrix/spec/import subtabs, row percentages, lesson cells, Excel import/export | `cv7991` state L3553+ |
| Accounts/device | Device profile, trusted devices, simulated slots, admin manage-device modal, history modal | state L3319–3334, L10735, L10823, L26124 |
| Security/vault | Vault lock config, unlock modal, admin session state, anti-AI config | state L3395–3404, L3435–3444 |
| Sharing | Registration share URL config, generated link/message | L3346–3351, `renderShareVipLinkModal()` L10169 |

## 9. State and API surface

* `state` starts at L3255 with `view: 'studentHome'`, `studentNavTab: 'curriculum'`, `adminTab: 'matrix_builder'`.
* Notable nested state groups: `examBankUI`, `matrixBuilder`, `cv7991`, `mockToESync`, `perfConfig`, `antiAiConfig`, `deviceSecurityPolicy`, `vaultLockConfig`, `shareLinkConfig`, `googleFormConfig`.
* Source smell: `lessonSubTabs` is declared twice (L3275 and L3280) with slightly different comments; the second literal overwrites the first.
* `window.TRITHUC` includes theme wrappers (`setThemeMode`, `cycleThemeMode`, `getThemeMode`), navigation (`goStudentHome`, `switchStudentNav`, `openAdminPortal`, `switchAdminTab`), exam flows, modal openers, cloud sync, device security, VIP, and admin data actions.
* The full method list is generated into the appendix below and in `source-map-v5.1.1.json`.

## Appendix A — Complete render function list (source-derived)

Count: **66**.

| `renderInteractiveSimilarExercisesBlock` | `renderChapterRealWorldSection` | `renderRealWorldStudentSection` | `renderEditRealWorldModal` |
| --- | --- | --- | --- |
| `renderTopNavbar` | `renderStudentHomeView` | `renderShareVipLinkModal` | `renderStudentLoginModal` |
| `renderDeviceBlockedSecurityModal` | `renderStudentDeviceSecurityModal` | `renderAdminManageDeviceModal` | `renderSolutionStepsWithAiHelper` |
| `renderMatrixQuestionInteractiveItem` | `renderTypeExerciseInteractiveCard` | `reRenderLessonCardInPlaceV446` | `renderWorkedExamplesBlockV446` |
| `renderTypeExercisesListBlock` | `renderMatrixTreeForLesson` | `renderLessonStructuredContent` | `renderSingleLessonCardHtml` |
| `renderCurriculumSection` | `renderExamBankExplorerV458` | `renderExamBankSection` | `renderLeaderboardSection` |
| `renderEntryGateModal` | `renderDoingExamView` | `renderSidebarGridButton` | `renderV97SingleQuestionCard` |
| `renderQuestionAnswerControls` | `renderAllQuestionsScrollView` | `renderConfirmSubmitModal` | `renderResultView` |
| `renderFullSolutionModal` | `renderExamTop20Modal` | `renderAdminVipHackAlertBannerV44` | `renderDsMixerPanelV456` |
| `renderAdminMatrixBuilderTabV44` | `renderAdminCv7991MatrixTabV457` | `renderAdminSyncMockToSectionETabV44` | `renderSinglePrintableExamBodyV50` |
| `renderBatchCombinedAnswerTableHtmlV50` | `renderMatrixBatchExportModalV50` | `renderMatrixPdfOfficialHeaderHtmlV45` | `renderMatrixPdfExportModalV44` |
| `renderMatrixV95SetupModalV44` | `renderQuickExamPasswordModalV44` | `renderVaultEncryptionCenterCardV44` | `renderVaultSecurityModalV44` |
| `renderMatrixItemSampleModalV44` | `renderMockQuestionPreviewModalV44` | `renderAdminView` | `renderAdminLessonsTab` |
| `renderAdminEditLessonModal` | `renderAdminUsersTab` | `renderAdminAccountActivityAndOptimizationPanel` | `renderStudentHistoryDetailModal` |
| `renderAdminExamsTab` | `renderAdminExamCardHtml` | `renderAdminExamsGroupedByChapterHtml` | `renderAdminCreateTab` |
| `renderGFormQuickConfigCard` | `renderAdminResultsTab` | `renderAdminGSitesTab` | `renderAdminAnswerConfigModal` |
| `renderAdminEditMetaModal` | `renderApp` |

## Appendix B — Complete `window.TRITHUC` method list (source-derived)

Count: **386**.

| `setThemeMode` | `cycleThemeMode` | `getThemeMode` | `toggleAdminHeaderCollapsedV44` |
| --- | --- | --- | --- |
| `setMatrixBuilderSearchV44` | `setMatrixBuilderGradeFilterV44` | `toggleMatrixBuilderQTypeFilterV44` | `toggleMatrixBuilderLevelFilterV44` |
| `resetMatrixBuilderFiltersV44` | `toggleMatrixBuilderLargeFontV44` | `toggleMatrixBuilderWideModeV44` | `expandOrCollapseAllMatrixTreeV44` |
| `toggleMatrixBuilderGradeOpenV44` | `toggleMatrixBuilderChapOpenV44` | `toggleMatrixBuilderLessonOpenV44` | `toggleMatrixBuilderGroupOpenV44` |
| `toggleInlineQuestionPreviewV44` | `toggleMatrixBuilderItemV44` | `toggleMatrixBuilderLessonCheckV44` | `toggleMatrixBuilderGroupCheckV44` |
| `closeMatrixItemSampleModalV44` | `setMatrixRowCountV44` | `stepMatrixRowCountV44` | `promptMatrixRowCountV44` |
| `cycleMatrixRowLevelV44` | `removeMatrixBuilderRowV44` | `clearAllMatrixBuilderRowsV44` | `toggleMatrixRowPreviewV46` |
| `openMatrixRowEditorV46` | `saveMatrixRowEditorV46` | `convertMatrixRowToEssayV46` | `swapMatrixBuilderRowQuestionV462` |
| `addItemAsEssayToMatrixV46` | `cycleMatrixTableFilterV44` | `cycleMatrixTableSortV44` | `setQuickExamTitleV445` |
| `applyQuickExamPresetV445` | `setQuickExamSettingV445` | `applyMatrixScoringPresetV467` | `setMatrixScoringFieldV467` |
| `applyP4UnitToAllEssayRowsV467` | `autoBalancePart4To10V467` | `generateQuickExamPasswordV45` | `generateV95SetupPasswordV45` |
| `clearV95SetupPasswordV45` | `generateV95SetupCodeV45` | `applyOfficialPdfPresetV45` | `toggleExamBankSidebarV458` |
| `setExamBankUiFieldV458` | `selectExamBankNodeV458` | `toggleExamBankNodeExpandV458` | `toggleAllExamBankNodesV458` |
| `setExamBankSearchV458` | `toggleExamActionMenuV458` | `toggleExamFolderMenuV458` | `toggleExamVisibilityV458` |
| `quickCreateFromExamBankNodeV458` | `toggleExamBankFolderUnlockV458` | `setCv7991SubTabV457` | `setCv7991ConfigV457` |
| `setCv7991PreMidPctV457` | `toggleCv7991RowEnabledV457` | `setCv7991RowPctV457` | `setCv7991RowCellV457` |
| `setCv7991LessonCellV461` | `toggleCv7991ChapterLessonsV461` | `toggleAllCv7991LessonsV461` | `toggleMatrixBatchShuffleOrderV461` |
| `setCv7991RowTextV457` | `autoDistributeCv7991PctV457` | `autoRebalanceCv7991MatrixV457` | `printOrDownloadCv7991DocV457` |
| `exportCv7991ExcelV457` | `downloadCv7991TemplateExcelV457` | `fillSampleCv7991PasteV457` | `parseAndApplyCv7991TableRowsV457` |
| `importCv7991FromPasteV457` | `generateExamFromCv7991MatrixV457` | `toggleDsMixerEnabledV456` | `setDsMixerFieldV456` |
| `pickDsSubItemForMixerV456` | `pickRandomDsSubFromItemV456` | `removeDsMixerSlotV456` | `clearDsMixerSlotsV456` |
| `shuffleDsMixerSlotsV456` | `autoFillDsMixerFromGradeV456` | `commitDsMixerToMatrixV456` | `toggleMatrixAutoVariantV443` |
| `regenerateMatrixVariantSeedV443` | `openMatrixPdfExportModalV44` | `closeMatrixPdfExportModalV44` | `setMatrixBatchFieldV50` |
| `openMatrixBatchExportModalV50` | `closeMatrixBatchExportModalV50` | `setMatrixBatchPreviewIdxV50` | `regenerateMatrixBatchExamsV50` |
| `regenerateSingleBatchExamV50` | `regenerateSingleQuestionInBatchV55` | `buildBatchMergedHtmlDocV50` | `buildSingleBatchExamHtmlDocV464` |
| `triggerPrintSingleBatchExamPdfV464` | `triggerPrintBatchAnswerTablePdfV464` | `downloadBatchSeparateHtmlFilesV464` | `triggerPrintBatchPdfV50` |
| `downloadBatchPrintableHtmlV50` | `exportBatchAnswerKeyExcelV50` | `publishBatchExamsToSystemV50` | `setMatrixPdfFieldV44` |
| `triggerPrintMatrixPdfNowV44` | `downloadMatrixPrintableHtmlFileV44` | `openMatrixV95SetupModalV44` | `closeMatrixV95SetupModalV44` |
| `setV95SetupFieldV44` | `setV95SetupGradeV44` | `publishMatrixExamToSystemV44` | `generateRandomCreatePassword` |
| `setCreateShuffleMode` | `selectMockExamForExtractionV44` | `triggerManualMockExtractionV44` | `toggleShowSkippedVariantsV44` |
| `forcePromoteVariantToNewV44` | `setMockSyncFilterV44` | `overrideMockItemTargetLessonV44` | `overrideMockItemLevelV44` |
| `overrideMockItemDescV44` | `previewMockQuestionItemV44` | `closeMockQuestionPreviewModalV44` | `syncSingleMockQuestionToSectionEV44` |
| `syncAllExtractedNewTypesToSectionEV44` | `toggleMockQuickPasteBoxV44` | `setMockQuickPasteTextV44` | `parseAndExtractNewMockExamV44` |
| `openQuickExamPasswordModal` | `closeQuickExamPasswordModal` | `saveQuickExamPasswordV44` | `dismissAllVipHackAlertsV44` |
| `blacklistHackerDeviceV44` | `simulateStudentVipHackTestV44` | `openVaultSecurityModal` | `closeVaultSecurityModal` |
| `unlockDataVaultWithPassV44` | `lockDataVaultNowV44` | `changeVaultAdminPasswordModalV44` | `changeVaultAdminPasswordInlineV44` |
| `goStudentHome` | `switchStudentNav` | `selectGrade` | `setSemesterFilter` |
| `openOuterLuyenDe12V464` | `openExamBankMock12V464` | `setBankCategoryFilter` | `onSearchChange` |
| `toggleChapterOpen` | `openChapterTab` | `setRealWorldGradeFilter` | `setRealWorldChapterFilter` |
| `setRealWorldSearch` | `showMoreSimilarProblem` | `generateSimilarForExercise` | `hideSimilarProblems` |
| `toggleAddCustomSimilarForm` | `saveCustomSimilarProblem` | `openAddRealWorldModal` | `openEditRealWorldModal` |
| `closeEditRealWorldModal` | `saveRealWorldModal` | `togglePartARecall` | `togglePartAMastered` |
| `setStudyFontSize` | `selectWorkedExample` | `toggleWorkedExampleSol` | `toggleMathTypeCard` |
| `toggleAllMathTypes` | `toggleLessonCardOpen` | `toggleMatrixTreeBranch` | `setMatrixFilter` |
| `setMatrixLevelFilter` | `startCustomMatrixExam` | `toggleMatrixItemCheck` | `toggleMatrixCategoryCheck` |
| `toggleAllMatrixItemsInLesson` | `toggleAllChapters` | `toggleAdminChapterOpen` | `toggleAllAdminChapters` |
| `toggleAdminLessonChapterOpen` | `toggleAllAdminLessonChapters` | `toggleChapterQuickUnlock` | `toggleLessonVipUnlock` |
| `toggleLessonTheory` | `quickCreateMockExam` | `setAdminExamSearch` | `openExamLeaderboardModal` |
| `closeExamLeaderboardModal` | `setLessonSubTab` | `openLessonExamSection` | `onClickLessonLock` |
| `toggleAdminPreviewUnlockAll` | `openShareVipLinkModal` | `closeShareVipLinkModal` | `updateShareLinkConfig` |
| `copyShareVipUrlOnly` | `copyShareVipFullMessage` | `testOpenVipRegistrationFromLink` | `syncRegDraftFromDom` |
| `updateRegDraftField` | `openAdminUsersApprovalDirectly` | `setRegDurationPlan` | `openLockedCourseModal` |
| `toggleRegPackage` | `submitStudentVipUpgradeRequest` | `selectLessonPracticeAns` | `toggleAiStepExplain` |
| `togglePracticeSolution` | `checkLessonPracticeShort` | `openStudentLoginModal` | `switchStudentAuthMode` |
| `closeStudentLoginModal` | `submitStudentRegistration` | `toggleStudentRememberMe` | `clearSavedStudentCreds` |
| `quickLoginRememberedStudent` | `submitStudentLogin` | `logoutStudent` | `setSimulatedDeviceSlot` |
| `openStudentDeviceSecurityModal` | `closeStudentDeviceSecurityModal` | `closeDeviceBlockedModal` | `submitStudentDeviceResetRequest` |
| `updateDeviceSecurityPolicy` | `openAdminManageDeviceModal` | `closeAdminManageDeviceModal` | `adminSaveStudentGmail` |
| `adminSetStudentMaxDevices` | `adminResetStudentDevices` | `adminApproveDeviceResetRequest` | `adminRemoveSingleDevice` |
| `adminClearDeviceViolations` | `openEntryModal` | `closeEntryModal` | `setEntryPassword` |
| `startExamNow` | `adminTestExamDirect` | `reEnterExamFullscreen` | `dismissIdleBlurBanner` |
| `setExamDisplayStyle` | `switchSingleAtQuestion` | `toggleExamSidebar` | `setSidebarFilter` |
| `jumpToQuestion` | `prevQuestion` | `nextQuestion` | `toggleFlagQuestion` |
| `clearQuestionAnswer` | `selectAnswerP1` | `selectAnswerP2` | `inputAnswerP3` |
| `inputAnswerP4` | `openConfirmSubmit` | `closeConfirmSubmit` | `confirmFinalSubmit` |
| `exitExamRoom` | `enterV97ReviewMode` | `enterV97ReviewAtQuestion` | `reviewHistoricalAttempt` |
| `openFullSolutionModal` | `closeFullSolutionModal` | `handleContentImageClick` | `closeLightbox` |
| `zoomLightbox` | `downloadSelfHtmlFile` | `openAdminPortal` | `toggleAdminRememberMe` |
| `clearSavedAdminCreds` | `logoutAdmin` | `saveAdminCredentials` | `toggleAntiAiField` |
| `switchAdminTab` | `setAdminGradeFilter` | `setAdminResultFilter` | `setAdminResultGradeFilterV45` |
| `setAdminResultSourceFilterV45` | `setAdminResultLessonFilterV45` | `setAdminResultStudentSearchV45` | `resetAdminResultFiltersV45` |
| `setAdminResultSubTabV45` | `setAdminResultCompareAxisV45` | `setAdminResultSortByV45` | `focusSingleExamResultV45` |
| `exportFilteredResultsToExcelV45` | `setAdminUserClassFilter` | `setAdminUserStatusFilter` | `setCustomWatermarkText` |
| `approveStudentAccount` | `approveStudentWithVip` | `toggleStudentVipPackage` | `toggleStudentMasterVip` |
| `setStudentVipDuration` | `loginAsStudentForTesting` | `grantVipAllActiveStudents` | `approveAllPendingStudents` |
| `rejectStudentAccount` | `addSingleStudentAccount` | `setAdminLessonGradeFilter` | `openEditLessonModal` |
| `openAddNewLessonModal` | `closeEditLessonModal` | `saveEditedLesson` | `addBulkStudentAccounts` |
| `toggleLockStudentAccount` | `deleteStudentAccount` | `quickAddStudentOneRow` | `quickGenerateSampleStudent` |
| `toggleSelectSingleUser` | `toggleSelectAllFilteredUsers` | `quickDeleteSelectedUsers` | `quickDeleteAllPendingUsers` |
| `quickDeleteFilteredUsers` | `wipeAllStudentAccountsNow` | `syncCloudUsersNow` | `checkStudentCloudApprovalNow` |
| `undoLastDeletedUsers` | `exportStudentAccountsExcel` | `quickAttachExamToLesson` | `viewExamResultsInAdmin` |
| `deleteExamById` | `deleteHistoryRecord` | `openAdminAnswerModal` | `closeAdminAnswerModal` |
| `updateAdminFastP1` | `updateAdminFastP2` | `updateAdminFastP3` | `updateAdminFastP4` |
| `openAdminMetaModal` | `closeAdminMetaModal` | `saveAdminMetaModal` | `toggleExamPublicUnlock` |
| `setCreatePublicUnlock` | `setCreateField` | `setCreateGrade` | `setCreateTargetType` |
| `setCreateWatermark` | `setCreateSourceTab` | `_applyParsedExamToCreateFormV96` | `clearV97LoadedFile` |
| `loadMoreExamBankCardsV469` | `toggleGitHubSyncConfigPanelV473` | `_processV97RawContentV468` | `onV97PasteInput` |
| `toggleManualPart4BoxV96` | `selectDetectedMultiExamV96` | `saveAllDetectedMultiExamsToBank` | `handleV97FileSelect` |
| `generateAutoExamFromMatrixBank` | `saveCreatedExam` | `exportHistoryToExcel` | `importGoogleFormExcel` |
| `setEmbedTargetExam` | `copyStandaloneHtmlForGSites` | `downloadStandaloneHtmlFile` | `retypesetAll` |
| `toggleHideAuthorInfo` | `updateGFormFieldSilent` | `extractGFormEntriesNow` | `LoadDemoGFormTemplate` |
| `autoParseGFormUrl` | `saveGFormSettings` | `clearGFormSettings` | `testSendGoogleForm` |
| `resendSingleAttemptToGForm` | `syncAllHistoryToGoogleForm` | `setAdminUsersSubView` | `onAccountGFormUrlInput` |
| `saveAccountGFormConfig` | `testSendSampleLogToGForm` | `syncSingleLogToGForm` | `syncAllUnsentLogsToGForm` |
| `togglePerfSetting` | `pruneAndOptimizeBrowserStorage` | `setAdminActivityFilter` | `clearOldActivityLogs` |
| `openStudentHistoryModal` | `closeStudentHistoryModal` | `setStudentHistoryModalTab` | `exportActivityLogsToExcel` |
| `exportSingleStudentHistoryExcel` | `importGoogleFormActivityExcel` |

## Appendix A — Complete render function list (source-derived)

Count: **66**.

| `renderInteractiveSimilarExercisesBlock` | `renderChapterRealWorldSection` | `renderRealWorldStudentSection` | `renderEditRealWorldModal` |
| --- | --- | --- | --- |
| `renderTopNavbar` | `renderStudentHomeView` | `renderShareVipLinkModal` | `renderStudentLoginModal` |
| `renderDeviceBlockedSecurityModal` | `renderStudentDeviceSecurityModal` | `renderAdminManageDeviceModal` | `renderSolutionStepsWithAiHelper` |
| `renderMatrixQuestionInteractiveItem` | `renderTypeExerciseInteractiveCard` | `reRenderLessonCardInPlaceV446` | `renderWorkedExamplesBlockV446` |
| `renderTypeExercisesListBlock` | `renderMatrixTreeForLesson` | `renderLessonStructuredContent` | `renderSingleLessonCardHtml` |
| `renderCurriculumSection` | `renderExamBankExplorerV458` | `renderExamBankSection` | `renderLeaderboardSection` |
| `renderEntryGateModal` | `renderDoingExamView` | `renderSidebarGridButton` | `renderV97SingleQuestionCard` |
| `renderQuestionAnswerControls` | `renderAllQuestionsScrollView` | `renderConfirmSubmitModal` | `renderResultView` |
| `renderFullSolutionModal` | `renderExamTop20Modal` | `renderAdminVipHackAlertBannerV44` | `renderDsMixerPanelV456` |
| `renderAdminMatrixBuilderTabV44` | `renderAdminCv7991MatrixTabV457` | `renderAdminSyncMockToSectionETabV44` | `renderSinglePrintableExamBodyV50` |
| `renderBatchCombinedAnswerTableHtmlV50` | `renderMatrixBatchExportModalV50` | `renderMatrixPdfOfficialHeaderHtmlV45` | `renderMatrixPdfExportModalV44` |
| `renderMatrixV95SetupModalV44` | `renderQuickExamPasswordModalV44` | `renderVaultEncryptionCenterCardV44` | `renderVaultSecurityModalV44` |
| `renderMatrixItemSampleModalV44` | `renderMockQuestionPreviewModalV44` | `renderAdminView` | `renderAdminLessonsTab` |
| `renderAdminEditLessonModal` | `renderAdminUsersTab` | `renderAdminAccountActivityAndOptimizationPanel` | `renderStudentHistoryDetailModal` |
| `renderAdminExamsTab` | `renderAdminExamCardHtml` | `renderAdminExamsGroupedByChapterHtml` | `renderAdminCreateTab` |
| `renderGFormQuickConfigCard` | `renderAdminResultsTab` | `renderAdminGSitesTab` | `renderAdminAnswerConfigModal` |
| `renderAdminEditMetaModal` | `renderApp` |

## Appendix B — Complete `window.TRITHUC` method list (source-derived)

Count: **386**.

| `setThemeMode` | `cycleThemeMode` | `getThemeMode` | `toggleAdminHeaderCollapsedV44` |
| --- | --- | --- | --- |
| `setMatrixBuilderSearchV44` | `setMatrixBuilderGradeFilterV44` | `toggleMatrixBuilderQTypeFilterV44` | `toggleMatrixBuilderLevelFilterV44` |
| `resetMatrixBuilderFiltersV44` | `toggleMatrixBuilderLargeFontV44` | `toggleMatrixBuilderWideModeV44` | `expandOrCollapseAllMatrixTreeV44` |
| `toggleMatrixBuilderGradeOpenV44` | `toggleMatrixBuilderChapOpenV44` | `toggleMatrixBuilderLessonOpenV44` | `toggleMatrixBuilderGroupOpenV44` |
| `toggleInlineQuestionPreviewV44` | `toggleMatrixBuilderItemV44` | `toggleMatrixBuilderLessonCheckV44` | `toggleMatrixBuilderGroupCheckV44` |
| `closeMatrixItemSampleModalV44` | `setMatrixRowCountV44` | `stepMatrixRowCountV44` | `promptMatrixRowCountV44` |
| `cycleMatrixRowLevelV44` | `removeMatrixBuilderRowV44` | `clearAllMatrixBuilderRowsV44` | `toggleMatrixRowPreviewV46` |
| `openMatrixRowEditorV46` | `saveMatrixRowEditorV46` | `convertMatrixRowToEssayV46` | `swapMatrixBuilderRowQuestionV462` |
| `addItemAsEssayToMatrixV46` | `cycleMatrixTableFilterV44` | `cycleMatrixTableSortV44` | `setQuickExamTitleV445` |
| `applyQuickExamPresetV445` | `setQuickExamSettingV445` | `applyMatrixScoringPresetV467` | `setMatrixScoringFieldV467` |
| `applyP4UnitToAllEssayRowsV467` | `autoBalancePart4To10V467` | `generateQuickExamPasswordV45` | `generateV95SetupPasswordV45` |
| `clearV95SetupPasswordV45` | `generateV95SetupCodeV45` | `applyOfficialPdfPresetV45` | `toggleExamBankSidebarV458` |
| `setExamBankUiFieldV458` | `selectExamBankNodeV458` | `toggleExamBankNodeExpandV458` | `toggleAllExamBankNodesV458` |
| `setExamBankSearchV458` | `toggleExamActionMenuV458` | `toggleExamFolderMenuV458` | `toggleExamVisibilityV458` |
| `quickCreateFromExamBankNodeV458` | `toggleExamBankFolderUnlockV458` | `setCv7991SubTabV457` | `setCv7991ConfigV457` |
| `setCv7991PreMidPctV457` | `toggleCv7991RowEnabledV457` | `setCv7991RowPctV457` | `setCv7991RowCellV457` |
| `setCv7991LessonCellV461` | `toggleCv7991ChapterLessonsV461` | `toggleAllCv7991LessonsV461` | `toggleMatrixBatchShuffleOrderV461` |
| `setCv7991RowTextV457` | `autoDistributeCv7991PctV457` | `autoRebalanceCv7991MatrixV457` | `printOrDownloadCv7991DocV457` |
| `exportCv7991ExcelV457` | `downloadCv7991TemplateExcelV457` | `fillSampleCv7991PasteV457` | `parseAndApplyCv7991TableRowsV457` |
| `importCv7991FromPasteV457` | `generateExamFromCv7991MatrixV457` | `toggleDsMixerEnabledV456` | `setDsMixerFieldV456` |
| `pickDsSubItemForMixerV456` | `pickRandomDsSubFromItemV456` | `removeDsMixerSlotV456` | `clearDsMixerSlotsV456` |
| `shuffleDsMixerSlotsV456` | `autoFillDsMixerFromGradeV456` | `commitDsMixerToMatrixV456` | `toggleMatrixAutoVariantV443` |
| `regenerateMatrixVariantSeedV443` | `openMatrixPdfExportModalV44` | `closeMatrixPdfExportModalV44` | `setMatrixBatchFieldV50` |
| `openMatrixBatchExportModalV50` | `closeMatrixBatchExportModalV50` | `setMatrixBatchPreviewIdxV50` | `regenerateMatrixBatchExamsV50` |
| `regenerateSingleBatchExamV50` | `regenerateSingleQuestionInBatchV55` | `buildBatchMergedHtmlDocV50` | `buildSingleBatchExamHtmlDocV464` |
| `triggerPrintSingleBatchExamPdfV464` | `triggerPrintBatchAnswerTablePdfV464` | `downloadBatchSeparateHtmlFilesV464` | `triggerPrintBatchPdfV50` |
| `downloadBatchPrintableHtmlV50` | `exportBatchAnswerKeyExcelV50` | `publishBatchExamsToSystemV50` | `setMatrixPdfFieldV44` |
| `triggerPrintMatrixPdfNowV44` | `downloadMatrixPrintableHtmlFileV44` | `openMatrixV95SetupModalV44` | `closeMatrixV95SetupModalV44` |
| `setV95SetupFieldV44` | `setV95SetupGradeV44` | `publishMatrixExamToSystemV44` | `generateRandomCreatePassword` |
| `setCreateShuffleMode` | `selectMockExamForExtractionV44` | `triggerManualMockExtractionV44` | `toggleShowSkippedVariantsV44` |
| `forcePromoteVariantToNewV44` | `setMockSyncFilterV44` | `overrideMockItemTargetLessonV44` | `overrideMockItemLevelV44` |
| `overrideMockItemDescV44` | `previewMockQuestionItemV44` | `closeMockQuestionPreviewModalV44` | `syncSingleMockQuestionToSectionEV44` |
| `syncAllExtractedNewTypesToSectionEV44` | `toggleMockQuickPasteBoxV44` | `setMockQuickPasteTextV44` | `parseAndExtractNewMockExamV44` |
| `openQuickExamPasswordModal` | `closeQuickExamPasswordModal` | `saveQuickExamPasswordV44` | `dismissAllVipHackAlertsV44` |
| `blacklistHackerDeviceV44` | `simulateStudentVipHackTestV44` | `openVaultSecurityModal` | `closeVaultSecurityModal` |
| `unlockDataVaultWithPassV44` | `lockDataVaultNowV44` | `changeVaultAdminPasswordModalV44` | `changeVaultAdminPasswordInlineV44` |
| `goStudentHome` | `switchStudentNav` | `selectGrade` | `setSemesterFilter` |
| `openOuterLuyenDe12V464` | `openExamBankMock12V464` | `setBankCategoryFilter` | `onSearchChange` |
| `toggleChapterOpen` | `openChapterTab` | `setRealWorldGradeFilter` | `setRealWorldChapterFilter` |
| `setRealWorldSearch` | `showMoreSimilarProblem` | `generateSimilarForExercise` | `hideSimilarProblems` |
| `toggleAddCustomSimilarForm` | `saveCustomSimilarProblem` | `openAddRealWorldModal` | `openEditRealWorldModal` |
| `closeEditRealWorldModal` | `saveRealWorldModal` | `togglePartARecall` | `togglePartAMastered` |
| `setStudyFontSize` | `selectWorkedExample` | `toggleWorkedExampleSol` | `toggleMathTypeCard` |
| `toggleAllMathTypes` | `toggleLessonCardOpen` | `toggleMatrixTreeBranch` | `setMatrixFilter` |
| `setMatrixLevelFilter` | `startCustomMatrixExam` | `toggleMatrixItemCheck` | `toggleMatrixCategoryCheck` |
| `toggleAllMatrixItemsInLesson` | `toggleAllChapters` | `toggleAdminChapterOpen` | `toggleAllAdminChapters` |
| `toggleAdminLessonChapterOpen` | `toggleAllAdminLessonChapters` | `toggleChapterQuickUnlock` | `toggleLessonVipUnlock` |
| `toggleLessonTheory` | `quickCreateMockExam` | `setAdminExamSearch` | `openExamLeaderboardModal` |
| `closeExamLeaderboardModal` | `setLessonSubTab` | `openLessonExamSection` | `onClickLessonLock` |
| `toggleAdminPreviewUnlockAll` | `openShareVipLinkModal` | `closeShareVipLinkModal` | `updateShareLinkConfig` |
| `copyShareVipUrlOnly` | `copyShareVipFullMessage` | `testOpenVipRegistrationFromLink` | `syncRegDraftFromDom` |
| `updateRegDraftField` | `openAdminUsersApprovalDirectly` | `setRegDurationPlan` | `openLockedCourseModal` |
| `toggleRegPackage` | `submitStudentVipUpgradeRequest` | `selectLessonPracticeAns` | `toggleAiStepExplain` |
| `togglePracticeSolution` | `checkLessonPracticeShort` | `openStudentLoginModal` | `switchStudentAuthMode` |
| `closeStudentLoginModal` | `submitStudentRegistration` | `toggleStudentRememberMe` | `clearSavedStudentCreds` |
| `quickLoginRememberedStudent` | `submitStudentLogin` | `logoutStudent` | `setSimulatedDeviceSlot` |
| `openStudentDeviceSecurityModal` | `closeStudentDeviceSecurityModal` | `closeDeviceBlockedModal` | `submitStudentDeviceResetRequest` |
| `updateDeviceSecurityPolicy` | `openAdminManageDeviceModal` | `closeAdminManageDeviceModal` | `adminSaveStudentGmail` |
| `adminSetStudentMaxDevices` | `adminResetStudentDevices` | `adminApproveDeviceResetRequest` | `adminRemoveSingleDevice` |
| `adminClearDeviceViolations` | `openEntryModal` | `closeEntryModal` | `setEntryPassword` |
| `startExamNow` | `adminTestExamDirect` | `reEnterExamFullscreen` | `dismissIdleBlurBanner` |
| `setExamDisplayStyle` | `switchSingleAtQuestion` | `toggleExamSidebar` | `setSidebarFilter` |
| `jumpToQuestion` | `prevQuestion` | `nextQuestion` | `toggleFlagQuestion` |
| `clearQuestionAnswer` | `selectAnswerP1` | `selectAnswerP2` | `inputAnswerP3` |
| `inputAnswerP4` | `openConfirmSubmit` | `closeConfirmSubmit` | `confirmFinalSubmit` |
| `exitExamRoom` | `enterV97ReviewMode` | `enterV97ReviewAtQuestion` | `reviewHistoricalAttempt` |
| `openFullSolutionModal` | `closeFullSolutionModal` | `handleContentImageClick` | `closeLightbox` |
| `zoomLightbox` | `downloadSelfHtmlFile` | `openAdminPortal` | `toggleAdminRememberMe` |
| `clearSavedAdminCreds` | `logoutAdmin` | `saveAdminCredentials` | `toggleAntiAiField` |
| `switchAdminTab` | `setAdminGradeFilter` | `setAdminResultFilter` | `setAdminResultGradeFilterV45` |
| `setAdminResultSourceFilterV45` | `setAdminResultLessonFilterV45` | `setAdminResultStudentSearchV45` | `resetAdminResultFiltersV45` |
| `setAdminResultSubTabV45` | `setAdminResultCompareAxisV45` | `setAdminResultSortByV45` | `focusSingleExamResultV45` |
| `exportFilteredResultsToExcelV45` | `setAdminUserClassFilter` | `setAdminUserStatusFilter` | `setCustomWatermarkText` |
| `approveStudentAccount` | `approveStudentWithVip` | `toggleStudentVipPackage` | `toggleStudentMasterVip` |
| `setStudentVipDuration` | `loginAsStudentForTesting` | `grantVipAllActiveStudents` | `approveAllPendingStudents` |
| `rejectStudentAccount` | `addSingleStudentAccount` | `setAdminLessonGradeFilter` | `openEditLessonModal` |
| `openAddNewLessonModal` | `closeEditLessonModal` | `saveEditedLesson` | `addBulkStudentAccounts` |
| `toggleLockStudentAccount` | `deleteStudentAccount` | `quickAddStudentOneRow` | `quickGenerateSampleStudent` |
| `toggleSelectSingleUser` | `toggleSelectAllFilteredUsers` | `quickDeleteSelectedUsers` | `quickDeleteAllPendingUsers` |
| `quickDeleteFilteredUsers` | `wipeAllStudentAccountsNow` | `syncCloudUsersNow` | `checkStudentCloudApprovalNow` |
| `undoLastDeletedUsers` | `exportStudentAccountsExcel` | `quickAttachExamToLesson` | `viewExamResultsInAdmin` |
| `deleteExamById` | `deleteHistoryRecord` | `openAdminAnswerModal` | `closeAdminAnswerModal` |
| `updateAdminFastP1` | `updateAdminFastP2` | `updateAdminFastP3` | `updateAdminFastP4` |
| `openAdminMetaModal` | `closeAdminMetaModal` | `saveAdminMetaModal` | `toggleExamPublicUnlock` |
| `setCreatePublicUnlock` | `setCreateField` | `setCreateGrade` | `setCreateTargetType` |
| `setCreateWatermark` | `setCreateSourceTab` | `_applyParsedExamToCreateFormV96` | `clearV97LoadedFile` |
| `loadMoreExamBankCardsV469` | `toggleGitHubSyncConfigPanelV473` | `_processV97RawContentV468` | `onV97PasteInput` |
| `toggleManualPart4BoxV96` | `selectDetectedMultiExamV96` | `saveAllDetectedMultiExamsToBank` | `handleV97FileSelect` |
| `generateAutoExamFromMatrixBank` | `saveCreatedExam` | `exportHistoryToExcel` | `importGoogleFormExcel` |
| `setEmbedTargetExam` | `copyStandaloneHtmlForGSites` | `downloadStandaloneHtmlFile` | `retypesetAll` |
| `toggleHideAuthorInfo` | `updateGFormFieldSilent` | `extractGFormEntriesNow` | `LoadDemoGFormTemplate` |
| `autoParseGFormUrl` | `saveGFormSettings` | `clearGFormSettings` | `testSendGoogleForm` |
| `resendSingleAttemptToGForm` | `syncAllHistoryToGoogleForm` | `setAdminUsersSubView` | `onAccountGFormUrlInput` |
| `saveAccountGFormConfig` | `testSendSampleLogToGForm` | `syncSingleLogToGForm` | `syncAllUnsentLogsToGForm` |
| `togglePerfSetting` | `pruneAndOptimizeBrowserStorage` | `setAdminActivityFilter` | `clearOldActivityLogs` |
| `openStudentHistoryModal` | `closeStudentHistoryModal` | `setStudentHistoryModalTab` | `exportActivityLogsToExcel` |
| `exportSingleStudentHistoryExcel` | `importGoogleFormActivityExcel` |

## Appendix C — Storage keys referenced by the build

- `trithuc_partA_mastered_v446`
- `trithuc_study_font_v446`
- `TRITHUC50_CLEAN_STUCK_PUB_EXAMS_V44`
- `TRITHUC50_PUBLIC_EXAMS_TS`
- `TRITHUC50_REALWORLD_OVERRIDES_V439`
- `TRITHUC50_MIGRATED_CLEAN_V436`
- `TRITHUC50_NEW_REG_ALERT`
- `TRITHUC50_HIDE_AUTHOR_TS`
- `TRITHUC50_CUSTOM_EXAMS_V23`
- `TRITHUC50_EXAM_OVERRIDES_V26`
- `TRITHUC50_LESSON_OVERRIDES_V439_PROF_SVG`
- `TRITHUC50_PUBLIC_LESSONS_V44`
- `TRITHUC50_DELETED_EXAMS_V23`
- `TRITHUC50_HISTORY_V436`
- `TRITHUC50_USERS_V436_CLEAN`
- `TRITHUC50_DELETED_USERS_V436`
- `TRITHUC50_LOGGED_STUDENT_V436`
- `TRITHUC50_REMEMBER_STU_CREDS_V436`
- `TRITHUC50_ADMIN_CREDS_V23`
- `TRITHUC50_REMEMBER_ADMIN_SESSION_V26`
- `TRITHUC50_REMEMBER_ADMIN_CREDS_V26`
- `TRITHUC50_GFORM_CONFIG_V23`
- `TRITHUC50_PUBLIC_SITE_URL_V23`
- `TRUNG_GEMINI_OCR_KEY`
- `TRITHUC50_DEVICE_HW_TOKEN_V26`
- `TRITHUC50_DEVICE_SEC_POLICY_V26`
- `TRITHUC50_ACTIVITY_LOGS_V27`
- `TRITHUC50_PERF_CONFIG_V27`
- `TRITHUC50_HIDE_AUTHOR_V26`
- `trithuc_theme_mode_v5`
