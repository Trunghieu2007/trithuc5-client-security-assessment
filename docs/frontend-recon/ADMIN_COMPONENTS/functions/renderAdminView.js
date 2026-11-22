function renderAdminView() {
            if (!state.isAdminLoggedIn) {
                const isLockedOut = state.adminLoginLockUntil && Date.now() < state.adminLoginLockUntil;
                const waitSec = isLockedOut ? Math.ceil((state.adminLoginLockUntil - Date.now()) / 1000) : 0;
                return `
                <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                    <div class="v5-surface-card max-w-md w-full p-7 sm:p-8 shadow-xl space-y-4">
                        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span class="v5-version-pill">TRITHUC5.0 • V5.0</span>
                            ${window.TRITHUC_THEME ? window.TRITHUC_THEME.renderSwitcherHtml('compact') : ''}
                        </div>
                        <div class="text-center">
                            <div class="w-14 h-14 rounded-2xl bg-blue-700 text-white flex items-center justify-center text-2xl mx-auto shadow-md mb-3">🛡️</div>
                            <h2 class="text-xl font-black text-slate-900 uppercase m-0">Đăng Nhập Quản Trị Giáo Viên</h2>
                            <p class="text-xs font-bold text-slate-500 mt-1 m-0">Hệ thống TRITHUC5.0 — Bảo mật Đa Tầng Chống Brute-Force</p>
                        </div>

                        ${isLockedOut ? `
                            <div class="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-xs font-extrabold text-red-800 text-center">
                                ⛔ Hệ thống tạm khóa đăng nhập trong <b>${waitSec} giây</b> do nhập sai quá 5 lần liên tiếp!
                            </div>
                        ` : ''}

                        <div class="space-y-3 pt-2">
                            <div>
                                <label class="block text-xs font-extrabold text-slate-700 uppercase mb-1">Tài khoản Quản trị (Username) <span class="text-red-500">*</span></label>
                                <input id="adminUserInput" type="text" value="${escapeHtml(state.savedAdminCreds?.username || '')}" placeholder="Nhập tài khoản quản trị..." autocomplete="username"
                                    onkeydown="if(event.key==='Enter') window.TRITHUC.loginAdmin()"
                                    class="w-full p-3.5 rounded-xl bg-slate-100 border-2 border-slate-200 font-bold text-sm outline-none focus:bg-white focus:border-blue-600" />
                            </div>
                            <div>
                                <label class="block text-xs font-extrabold text-slate-700 uppercase mb-1">Mật khẩu Quản trị (Password) <span class="text-red-500">*</span></label>
                                <input id="adminPassInput" type="password" value="${escapeHtml(state.savedAdminCreds?.password || '')}" placeholder="Nhập mật khẩu quản trị..." autocomplete="current-password"
                                    onkeydown="if(event.key==='Enter') window.TRITHUC.loginAdmin()"
                                    class="w-full p-3.5 rounded-xl bg-slate-100 border-2 border-slate-200 font-bold text-sm outline-none focus:bg-white focus:border-blue-600" />
                            </div>
                            <div class="flex items-center justify-between pt-0.5">
                                <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input id="adminRememberMeChk" type="checkbox" ${state.adminRememberMe !== false ? 'checked' : ''}
                                        onchange="window.TRITHUC.toggleAdminRememberMe(this.checked)"
                                        class="w-4 h-4 accent-blue-700 rounded cursor-pointer" />
                                    <span class="text-xs font-extrabold text-slate-700">Ghi nhớ đăng nhập Quản trị</span>
                                </label>
                                ${state.savedAdminCreds && state.savedAdminCreds.username ? `
                                    <button type="button" onclick="window.TRITHUC.clearSavedAdminCreds()"
                                        class="text-[11px] font-extrabold text-rose-600 hover:underline">
                                        Xóa ghi nhớ
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <button onclick="window.TRITHUC.loginAdmin()"
                            class="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition">
                            🔓 Đăng Nhập Hệ Thống Quản Trị
                        </button>
                        <button onclick="window.TRITHUC.goStudentHome()"
                            class="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">
                            ← Quay về trang Học sinh
                        </button>
                    </div>
                </div>`;
            }

            const pendingStuCount = state.users.filter(u => u.status === 'pending' || u.vipRequestPending).length;
            const hackAlertCnt = (state.vipHackAlerts || []).filter(a => !a.dismissed).length;
            const admTabs = [
                { id: 'matrix_builder', icon: '🧭', label: '1. Làm Đề & Ma Trận (Từ Phần E)' },
                { id: 'cv7991_matrix', icon: '📐', label: '1B. Ma Trận CV 7991 & Tự Sinh Đề' },
                { id: 'sync_mock_to_e', icon: '🔍', label: '2. Bóc Tách Dạng Mới → Phần E' },
                { id: 'exams', icon: '📋', label: `Kho Đề & Bài Học (${state.exams.length})` },
                { id: 'lessons', icon: '✏️', label: 'Quản Lý & Sửa Bài Học' },
                { id: 'users', icon: '👥', label: `Tài Khoản & Duyệt VIP (${state.users.length})${pendingStuCount > 0 ? ` • 🔔 ${pendingStuCount}` : ''}${hackAlertCnt > 0 ? ` • 🚨 ${hackAlertCnt} Hack VIP` : ''}` },
                { id: 'create', icon: '➕', label: 'Tạo / Nạp Đề (Chuẩn V9.6 PRO)' },
                { id: 'results', icon: '📊', label: `Phổ Điểm & Excel (${state.history.length})` },
                { id: 'gsites', icon: '🔐', label: 'Mã Hóa Kho Đề & Bảo Mật (Mục 5)' }
            ];

            let tabBody = '';
            if (state.adminTab === 'matrix_builder') tabBody = renderAdminMatrixBuilderTabV44();
            else if (state.adminTab === 'cv7991_matrix') tabBody = renderAdminCv7991MatrixTabV457();
            else if (state.adminTab === 'sync_mock_to_e') tabBody = renderAdminSyncMockToSectionETabV44();
            else if (state.adminTab === 'exams') tabBody = renderAdminExamsTab();
            else if (state.adminTab === 'lessons') tabBody = renderAdminLessonsTab();
            else if (state.adminTab === 'realworld') tabBody = renderRealWorldStudentSection();
            else if (state.adminTab === 'users') tabBody = renderAdminUsersTab();
            else if (state.adminTab === 'create') tabBody = renderAdminCreateTab();
            else if (state.adminTab === 'results') tabBody = renderAdminResultsTab();
            else tabBody = renderAdminGSitesTab();

            const admSidebarGroups = [
                {
                    title: 'Soạn Đề & Ma Trận',
                    items: [
                        { id: 'matrix_builder', icon: '🧭', label: '1. Làm Đề & Ma Trận (E)', badge: '' },
                        { id: 'cv7991_matrix', icon: '📐', label: '1B. Ma Trận CV 7991', badge: 'BGD' },
                        { id: 'sync_mock_to_e', icon: '🔍', label: '2. Bóc Tách Dạng → E', badge: '' }
                    ]
                },
                {
                    title: 'Học Liệu & Kho Đề',
                    items: [
                        { id: 'exams', icon: '📋', label: 'Kho Đề & Bài Học', badge: String(state.exams.length) },
                        { id: 'lessons', icon: '✏️', label: 'Quản Lý & Sửa Bài Học', badge: '' },
                        { id: 'create', icon: '➕', label: 'Tạo / Nạp Đề V9.6', badge: '' }
                    ]
                },
                {
                    title: 'Học Sinh & Hệ Thống',
                    items: [
                        { id: 'users', icon: '👥', label: 'Tài Khoản & Duyệt VIP', badge: pendingStuCount > 0 ? ('🔔 ' + pendingStuCount) : String(state.users.length) },
                        { id: 'results', icon: '📊', label: 'Phổ Điểm & Excel', badge: String(state.history.length) },
                        { id: 'gsites', icon: '🔐', label: 'Mã Hóa & Bảo Mật', badge: '' }
                    ]
                }
            ];
            const activeTabMeta = admTabs.find(t => t.id === state.adminTab) || admTabs[0];

            return `
            <div class="v511-admin-shell">
                <header class="v511-admin-topbar">
                    <div class="max-w-[1680px] mx-auto flex items-center justify-between gap-2 flex-wrap">
                        <div class="flex items-center gap-2 flex-wrap min-w-0">
                            <button type="button" onclick="window.TRITHUC.toggleAdminHeaderCollapsedV44()"
                                title="${state.adminHeaderCollapsed ? 'Mở thanh điều hướng bên trái' : 'Thu gọn thanh điều hướng để mở rộng không gian làm việc'}"
                                class="hidden lg:inline-flex v5-nav-btn-secondary px-2.5 py-1.5 text-xs items-center gap-1">
                                <span>${state.adminHeaderCollapsed ? '☰ Hiện Menu' : '◧ Thu gọn'}</span>
                            </button>
                            <div class="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0">🎓</div>
                            <span class="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">QUẢN TRỊ GV</span>
                            <span class="v5-version-pill">V5.1.1</span>
                            <span class="hidden xl:inline text-xs font-semibold text-slate-500">› ${activeTabMeta.icon} ${escapeHtml(activeTabMeta.label)}</span>
                            <select onchange="window.TRITHUC.switchAdminTab(this.value)"
                                aria-label="Chọn mục quản trị"
                                class="lg:hidden px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs outline-none cursor-pointer">
                                ${admTabs.map(t => `<option value="${t.id}" ${state.adminTab === t.id ? 'selected' : ''}>${t.icon} ${escapeHtml(t.label)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${window.TRITHUC_THEME ? window.TRITHUC_THEME.renderSwitcherHtml('compact') : ''}
                            <button type="button" onclick="window.TRITHUC.openVaultSecurityModal()"
                                title="Mã hóa Kho đề thi & Dữ liệu bài học"
                                class="v5-nav-btn-secondary px-2.5 py-1.5 text-[11px] flex items-center gap-1">
                                <span>${state.vaultLockConfig?.isLocked !== false ? '🔐' : '🔓'}</span>
                                <span class="hidden sm:inline">${state.vaultLockConfig?.isLocked !== false ? 'Khóa Admin' : 'Đã Mở'}</span>
                            </button>
                            <button type="button" onclick="window.TRITHUC.toggleHideAuthorInfo()"
                                class="v5-nav-btn-secondary px-2.5 py-1.5 text-[11px] flex items-center gap-1">
                                <span>${state.hideAuthorInfo ? '👁️ Hiện tác giả' : '🙈 Ẩn tác giả'}</span>
                            </button>
                            <button type="button" onclick="window.TRITHUC.openShareVipLinkModal()"
                                class="v5-nav-btn-secondary px-2.5 py-1.5 text-[11px] flex items-center gap-1">
                                <span>🔗</span>
                                <span class="hidden md:inline">Link ĐK VIP</span>
                            </button>
                            <button type="button" onclick="window.TRITHUC.goStudentHome()"
                                class="v5-nav-btn-primary px-2.5 py-1.5 text-[11px] flex items-center gap-1">
                                <span>👁️ Trang HS</span>
                            </button>
                            <button type="button" onclick="window.TRITHUC.logoutAdmin()"
                                class="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold transition">
                                🔒 Thoát
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Thanh tab cuộn ngang cho Mobile / Tablet (< 1024px) -->
                <div class="v511-admin-mobile-tabs">
                    ${admTabs.map(t => `
                        <button type="button" onclick="window.TRITHUC.switchAdminTab('${t.id}')"
                            class="v511-mobile-pill ${state.adminTab === t.id ? 'v511-active' : ''}">
                            ${t.icon} ${escapeHtml(t.label)}
                        </button>
                    `).join('')}
                </div>

                <div class="v511-admin-body">
                    <!-- Thanh Sidebar trái phân nhóm 3 cụm nghiệp vụ cho Desktop -->
                    <aside class="v511-admin-sidebar custom-scrollbar ${state.adminHeaderCollapsed ? 'v511-collapsed' : ''}" aria-label="Điều hướng Quản trị Giáo viên">
                        ${admSidebarGroups.map(grp => `
                            <div class="space-y-1">
                                <div class="v511-nav-group-label">${grp.title}</div>
                                ${grp.items.map(it => `
                                    <button type="button" onclick="window.TRITHUC.switchAdminTab('${it.id}')"
                                        class="v511-sidebar-item ${state.adminTab === it.id ? 'v511-active' : ''}">
                                        <span class="flex items-center gap-2 min-w-0">
                                            <span class="shrink-0">${it.icon}</span>
                                            <span class="truncate">${escapeHtml(it.label)}</span>
                                        </span>
                                        ${it.badge ? `<span class="v511-sidebar-badge">${it.badge}</span>` : ''}
                                    </button>
                                `).join('')}
                            </div>
                        `).join('')}
                        ${hackAlertCnt > 0 ? `
                            <div class="mt-auto p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800">
                                🚨 ${hackAlertCnt} cảnh báo Hack VIP cần kiểm tra
                            </div>
                        ` : ''}
                    </aside>

                    <main class="v511-admin-main">
                        ${renderAdminVipHackAlertBannerV44()}
                        ${pendingStuCount > 0 && state.adminTab !== 'users' ? `
                            <div class="v511-admin-hero v511-admin-hero-warning">
                                <div class="flex items-center gap-3 min-w-0">
                                    <span class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center text-base font-black shrink-0">🔔</span>
                                    <div class="min-w-0">
                                        <div class="text-xs sm:text-sm font-extrabold text-slate-900">Có ${pendingStuCount} học sinh đang chờ duyệt tài khoản / gói VIP</div>
                                        <div class="text-xs text-slate-600 font-medium">Yêu cầu đã sẵn sàng trong mục Tài Khoản &amp; Duyệt VIP.</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <button type="button" onclick="window.TRITHUC.openAdminUsersApprovalDirectly()"
                                        class="v5-nav-btn-primary px-3.5 py-2 text-xs">
                                        👥 Xem &amp; Duyệt (${pendingStuCount})
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.approveAllPendingStudents()"
                                        class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition">
                                        ✔ Duyệt Tất Cả
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                        ${tabBody}
                    </main>
                </div>

                ${state.editingAnswerExamId ? renderAdminAnswerConfigModal() : ''}
                ${state.editingMetaExamId ? renderAdminEditMetaModal() : ''}
                ${state.editingLessonModalId ? renderAdminEditLessonModal() : ''}
                ${state.adminManageDeviceUserId ? renderAdminManageDeviceModal() : ''}
                ${state.deviceBlockedModalInfo ? renderDeviceBlockedSecurityModal() : ''}
                ${state.editingRealWorldModal ? renderEditRealWorldModal() : ''}
                ${state.showShareVipLinkModal ? renderShareVipLinkModal() : ''}
                ${state.viewingStudentHistoryId ? renderStudentHistoryDetailModal() : ''}
                ${state.showVaultUnlockModal ? renderVaultSecurityModalV44() : ''}
                ${state.quickPasswordExamId ? renderQuickExamPasswordModalV44() : ''}
                ${state.matrixBuilder?.previewItemModal ? renderMatrixItemSampleModalV44() : ''}
                ${state.matrixBuilder?.showPdfExportModal ? renderMatrixPdfExportModalV44() : ''}
                ${state.matrixBuilder?.showBatchExportModal ? renderMatrixBatchExportModalV50() : ''}
                ${state.matrixBuilder?.showV95SetupModal ? renderMatrixV95SetupModalV44() : ''}
                ${state.mockToESync?.previewQuestionItem ? renderMockQuestionPreviewModalV44() : ''}
            </div>`;
        }