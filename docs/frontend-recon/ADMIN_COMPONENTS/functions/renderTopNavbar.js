function renderTopNavbar() {
            const stuTabs = [
                { id: 'curriculum', icon: '📚', label: 'Chương & Bài học' },
                { id: 'examBank', icon: '📝', label: 'Kho Đề Thi' },
                { id: 'leaderboard', icon: '🏆', label: 'Bảng Vàng & Điểm' }
            ];
            const stu = state.loggedInStudent;
            const vp = stu?.vipPackages || {};
            const isExpired = stu ? isStudentVipExpired(stu) : false;
            const activeTabId = (state.studentNavTab === 'examBank' || state.studentNavTab === 'leaderboard')
                ? state.studentNavTab
                : 'curriculum';

            return `
            <nav class="v431-navbar">
                <div class="v431-nav-inner">
                    <!-- Hàng 1: Thương hiệu + Nút thao tác nhanh trên Mobile/Tablet -->
                    <div class="v431-brand-row">
                        <div class="v431-brand-box" onclick="window.TRITHUC.switchStudentNav('curriculum')">
                            <div class="v431-logo-badge">
                                5.0
                            </div>
                            <div class="leading-tight min-w-0">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="v5-brand-title text-sm sm:text-base uppercase leading-none">TRITHUC5.0</span>
                                    <span class="v5-version-pill">V5.1.1</span>
                                </div>
                                ${state.hideAuthorInfo ? '' : `
                                <div data-author-brand="1" class="author-brand-el mt-0.5 leading-none">
                                    <span class="v5-author-pill inline-block uppercase leading-tight">
                                        LỚP TOÁN THẦY TRUNG
                                    </span>
                                </div>`}
                            </div>
                        </div>

                        <!-- Nút Giao diện, Gửi Link & Quản trị GV trên màn hình nhỏ (< lg) -->
                        <div class="nav-mobile-tools-v44 flex lg:hidden items-center gap-1.5 shrink-0">
                            ${window.TRITHUC_THEME ? window.TRITHUC_THEME.renderSwitcherHtml('compact') : ''}
                            <button type="button" onclick="window.TRITHUC.openShareVipLinkModal()"
                                class="v5-nav-btn-secondary px-2 py-1.5 text-[11px] flex items-center gap-1"
                                title="Gửi Link Đăng ký VIP cho học sinh">
                                <span>🔗</span>
                                <span class="hidden sm:inline">Link ĐK</span>
                            </button>
                            <button type="button" onclick="window.TRITHUC.openAdminPortal()"
                                class="v5-nav-btn-admin px-2.5 py-1.5 text-[11px] flex items-center gap-1 relative"
                                title="Quản trị Giáo viên">
                                <span>⚙️</span>
                                <span>GV</span>
                                ${state.users.filter(u => u.status === 'pending' || u.vipRequestPending).length > 0 ? `<span class="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9.5px] font-black">${state.users.filter(u => u.status === 'pending' || u.vipRequestPending).length}</span>` : ''}
                            </button>
                        </div>
                    </div>

                    <!-- Thanh 3 Tab điều hướng chính: Gọn 1 hàng 3 cột trên điện thoại & Segmented Pill trên máy tính -->
                    <div class="top-nav-tabs-3">
                        ${stuTabs.map(t => {
                            const active = state.view === 'studentHome' && activeTabId === t.id;
                            return `
                            <button type="button" onclick="window.TRITHUC.switchStudentNav('${t.id}')"
                                class="${active ? 'active-nav-tab' : 'inactive-nav-tab'}">
                                <span>${t.icon}</span>
                                <span>${t.label}</span>
                            </button>`;
                        }).join('')}
                    </div>

                    <!-- Cụm Tài khoản Học sinh + Công cụ Giáo viên (Gọn đẹp 1 hàng) -->
                    <div class="flex items-center justify-between lg:justify-end gap-1.5 w-full lg:w-auto shrink-0">
                        <div class="nav-desktop-tools-v44 hidden lg:flex items-center">
                            ${window.TRITHUC_THEME ? window.TRITHUC_THEME.renderSwitcherHtml('default') : ''}
                        </div>
                        ${stu ? `
                            <div class="v5-account-pill flex items-center justify-between sm:justify-end gap-1.5 text-[11px] w-full lg:w-auto flex-wrap">
                                <div class="flex items-center gap-1.5">
                                    <button type="button" onclick="window.TRITHUC.openStudentDeviceSecurityModal()"
                                        title="Bấm để xem Hồ sơ Tài khoản & Thiết bị (${(stu.trustedDevices || []).length || 1}/${stu.maxDevices || 2})"
                                        class="font-bold text-emerald-700 hover:underline flex items-center gap-1 text-left whitespace-nowrap">
                                        <span>👤</span>
                                        <span class="max-w-[120px] sm:max-w-[160px] truncate">${escapeHtml(stu.name)}</span>
                                        <span class="text-slate-500 text-[10px]">(${escapeHtml(stu.class)})</span>
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.openStudentDeviceSecurityModal()"
                                        title="Thiết bị định danh được phép học (${(stu.trustedDevices || []).length || 1}/${stu.maxDevices || 2} thiết bị)"
                                        class="px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[10px] flex items-center gap-0.5 transition">
                                        <span>🛡️</span>
                                        <span>${(stu.trustedDevices || []).length || 1}/${stu.maxDevices || 2}</span>
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.openStudentHistoryModal('${stu.id || stu.username}')"
                                        title="Xem lịch sử làm bài & nhật ký học tập"
                                        class="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[10px] transition">
                                        📜 Lịch sử
                                    </button>
                                </div>
                                <div class="flex items-center gap-1">
                                    <button type="button" onclick="window.TRITHUC.openLockedCourseModal('k12', 'Đăng ký / Gia hạn gói VIP')"
                                        title="Gói VIP đang mở (Bấm để đăng ký / gia hạn)"
                                        class="px-2 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] flex items-center gap-0.5 transition">
                                        <span>👑</span>
                                        <span>VIP</span>
                                        <span class="hidden sm:inline text-[9.5px] ml-0.5">(${['12','11','10'].filter(k => !isExpired && vp['k'+k]).join('•') || 'Khóa'})</span>
                                    </button>
                                    <button type="button" id="btnStudentLogoutTop" onclick="window.TRITHUC.logoutStudent()"
                                        title="Đăng xuất khỏi tài khoản học sinh hiện tại"
                                        class="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] flex items-center gap-1 transition">
                                        <span>🚪</span>
                                        <span>Đăng xuất</span>
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.logoutStudent()" class="hidden">Thoát</button>
                                </div>
                            </div>
                        ` : `
                            <div class="flex items-center gap-1.5 w-full lg:w-auto">
                                <button type="button" onclick="window.TRITHUC.openStudentLoginModal(null, 'login')"
                                    class="v5-nav-btn-primary flex-1 lg:flex-initial justify-center px-3 py-1.5 text-xs flex items-center gap-1">
                                    <span>🔐</span>
                                    <span>Đăng nhập</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.openStudentLoginModal(null, 'register')"
                                    class="v5-nav-btn-secondary flex-1 lg:flex-initial justify-center px-3 py-1.5 text-xs flex items-center gap-1">
                                    <span>📝</span>
                                    <span>Đăng ký</span>
                                </button>
                            </div>
                        `}
                        <button type="button" onclick="window.TRITHUC.openShareVipLinkModal()"
                            class="nav-desktop-tools-v44 hidden lg:flex v5-nav-btn-secondary px-2.5 py-1.5 text-xs items-center gap-1"
                            title="Gửi Link Đăng ký VIP cho học sinh">
                            <span>🔗</span>
                            <span>Link ĐK</span>
                        </button>

                        <button type="button" onclick="window.TRITHUC.openAdminPortal()"
                            class="nav-desktop-tools-v44 hidden lg:flex v5-nav-btn-admin px-3 py-1.5 text-xs items-center gap-1.5">
                            <span>⚙️</span>
                            <span>Quản trị GV</span>
                            ${state.users.filter(u => u.status === 'pending' || u.vipRequestPending).length > 0 ? `<span class="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">🔔 ${state.users.filter(u => u.status === 'pending' || u.vipRequestPending).length}</span>` : ''}
                        </button>
                    </div>
                </div>
            </nav>`;
        }