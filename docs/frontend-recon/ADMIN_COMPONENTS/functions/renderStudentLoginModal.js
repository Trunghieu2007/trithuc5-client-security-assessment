function renderStudentLoginModal() {
            const targetEx = state.loginTargetExamId ? state.exams.find(x => String(x.id) === String(state.loginTargetExamId)) : null;
            const mode = state.studentAuthMode || 'login'; // 'login' | 'register' | 'vip_upgrade'
            const stu = state.loggedInStudent;
            const rp = state.regPackages || { k12: true, k11: false, k10: false, luyende: false };
            const curPlan = state.regDurationPlan || '1y';

            const durationSelectorHtml = `
                <div class="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2">
                    <label class="block text-[11px] font-black text-purple-950 uppercase">⏳ Chọn Gói Thời Gian Đăng Ký VIP (3 tháng • 6 tháng • 1 năm • Trọn đời):</label>
                    <div class="grid grid-cols-2 gap-2 text-xs font-extrabold">
                        ${Object.values(VIP_DURATION_PLANS).map(pl => {
                            const active = curPlan === pl.id;
                            return `
                            <button type="button" onclick="window.TRITHUC.setRegDurationPlan('${pl.id}')"
                                class="p-2.5 rounded-xl border-2 text-left transition flex items-center justify-between gap-1.5 ${active ? 'bg-purple-700 text-white border-purple-700 shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'}">
                                <span>${escapeHtml(pl.shortLabel)}</span>
                                <span class="text-[10px] ${active ? 'text-purple-100' : 'text-slate-400'}">${pl.days > 0 ? pl.days + ' ngày' : 'Vĩnh viễn'}</span>
                            </button>`;
                        }).join('')}
                    </div>
                </div>
            `;

            return `
            <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onclick="if(event.target===this) window.TRITHUC.closeStudentLoginModal()">
                <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[94vh] overflow-y-auto">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl ${mode === 'register' ? 'bg-emerald-600' : (mode === 'vip_upgrade' ? 'bg-amber-500' : 'bg-blue-600')} text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                                ${mode === 'register' ? '📝' : (mode === 'vip_upgrade' ? '👑' : '🔐')}
                            </div>
                            <div>
                                <span class="text-[11px] font-extrabold uppercase ${mode === 'register' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : (mode === 'vip_upgrade' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-blue-700 bg-blue-50 border-blue-200')} px-2.5 py-0.5 rounded-full border">
                                    ${mode === 'register' ? 'Đăng ký tài khoản & Chọn gói VIP' : (mode === 'vip_upgrade' ? 'Mở khóa / Gia hạn Gói VIP' : 'Xác thực Học sinh')}
                                </span>
                                <h3 class="text-lg font-black text-slate-900 mt-1 m-0">
                                    ${mode === 'register' ? 'Đăng Ký Tài Khoản Học Sinh VIP' : (mode === 'vip_upgrade' ? 'Đăng Ký Mở Khóa & Gia Hạn VIP' : 'Đăng Nhập Tài Khoản Học Sinh')}
                                </h3>
                            </div>
                        </div>
                        <button onclick="window.TRITHUC.closeStudentLoginModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm">✕</button>
                    </div>

                    ${state.lockedPromptContext ? `
                        <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 font-semibold flex items-start gap-2.5">
                            <span class="text-lg shrink-0">🔒</span>
                            <div>
                                <div class="font-black uppercase text-amber-900">Thông báo Mở khóa Gói học Trả phí VIP:</div>
                                <div class="mt-0.5">${escapeHtml(state.lockedPromptContext)}</div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Chuyển đổi chế độ -->
                    ${stu && mode === 'vip_upgrade' ? '' : `
                        <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button type="button" onclick="window.TRITHUC.switchStudentAuthMode('login')"
                                class="py-2 rounded-xl text-xs font-extrabold transition ${mode === 'login' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                                🔐 Đăng nhập TK đã có
                            </button>
                            <button type="button" onclick="window.TRITHUC.switchStudentAuthMode('register')"
                                class="py-2 rounded-xl text-xs font-extrabold transition ${mode === 'register' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                                📝 Đăng ký TK & Gói VIP mới
                            </button>
                        </div>
                    `}

                    ${targetEx ? `
                        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-950">
                            🎯 Đề đang chọn: <b>${escapeHtml(targetEx.title)}</b> (👑 Yêu cầu Gói VIP)
                        </div>
                    ` : ''}

                    ${state.studentRegSuccessMsg ? `
                        <div class="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3.5 text-xs text-emerald-950 font-semibold space-y-2">
                            <div class="font-black text-emerald-800 uppercase">✅ Đã Chuyển Yêu Cầu Đăng Ký Về Mục Giáo Viên Để Duyệt!</div>
                            <div>${state.studentRegSuccessMsg}</div>
                            <div class="pt-1 flex flex-wrap items-center gap-2">
                                <button type="button" onclick="window.TRITHUC.openAdminUsersApprovalDirectly()"
                                    class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow-2xs flex items-center gap-1 transition">
                                    <span>⚙️</span>
                                    <span>Mở Mục Giáo Viên Để Duyệt Ngay</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.closeStudentLoginModal()"
                                    class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-2xs transition">
                                    <span>📘</span>
                                    <span>Vào Học Lý Thuyết Miễn Phí Ngay</span>
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    ${mode === 'vip_upgrade' && stu ? `
                        <div class="space-y-3">
                            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                                <div class="space-y-1">
                                    <div>👤 Học sinh: <b>${escapeHtml(stu.name)}</b> • Lớp: <b>${escapeHtml(stu.class)}</b> (TK: <code class="text-blue-700 font-bold">${escapeHtml(stu.username)}</code>)</div>
                                    <div>Thời hạn hiện tại: ${formatVipExpiryBadge(stu)}</div>
                                </div>
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <button type="button" onclick="window.TRITHUC.checkStudentCloudApprovalNow()"
                                        class="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs transition">
                                        <span>🔄</span>
                                        <span>Kiểm tra duyệt tự động</span>
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.logoutStudent()"
                                        class="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[11px] flex items-center gap-1 shadow-2xs transition">
                                        <span>🚪</span>
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </div>

                            ${(stu.status === 'pending' || stu.vipRequestPending) ? `
                                <div class="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 flex items-center justify-between gap-2 flex-wrap">
                                    <div class="space-y-0.5">
                                        <div class="font-black text-amber-900 uppercase flex items-center gap-1.5">
                                            <span class="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                            <span>⏳ Hồ sơ đăng ký đã chuyển về máy Giáo viên chờ duyệt!</span>
                                        </div>
                                        <div class="text-[11px] text-amber-800 font-semibold">
                                            Ngay khi Giáo viên bấm <b>Duyệt</b> trên máy của Giáo viên, tài khoản trên máy của em sẽ <b>tự động mở khóa VIP</b> (không cần nhập mã hay bấm link).
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                                <label class="block text-[11px] font-black text-amber-950 uppercase">👑 1. Tích chọn Khối & Khóa học VIP muốn mở khóa (Cô lập từng gói):</label>
                                <div class="grid grid-cols-2 gap-2 text-xs font-extrabold">
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.k12 ? 'border-blue-600 text-blue-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.k12 ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('k12', this.checked)" class="w-4 h-4 accent-blue-600" />
                                        <span>📘 Khối 12 (Toán 12)</span>
                                    </label>
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.k11 ? 'border-blue-600 text-blue-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.k11 ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('k11', this.checked)" class="w-4 h-4 accent-blue-600" />
                                        <span>📗 Khối 11 (Toán 11)</span>
                                    </label>
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.k10 ? 'border-blue-600 text-blue-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.k10 ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('k10', this.checked)" class="w-4 h-4 accent-blue-600" />
                                        <span>📙 Khối 10 (Toán 10)</span>
                                    </label>
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.luyende ? 'border-rose-600 text-rose-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.luyende ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('luyende', this.checked)" class="w-4 h-4 accent-rose-600" />
                                        <span>🔥 Luyện đề Thi thử</span>
                                    </label>
                                </div>
                            </div>

                            ${durationSelectorHtml}

                            <div>
                                <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Ghi chú gửi Thầy Trung (SĐT / Xác nhận học phí)</label>
                                <input id="vipUpgradeNoteInp" type="text" value="${escapeHtml(state.regDraft?.upgradeNote || stu.phone || '')}"
                                    oninput="window.TRITHUC.updateRegDraftField('upgradeNote', this.value)"
                                    placeholder="VD: Em đăng ký gói 6 tháng Khối 12, nhờ Thầy duyệt giúp em ạ!"
                                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-semibold text-xs text-slate-900 focus:bg-white focus:border-amber-500 outline-none" />
                            </div>

                            <div class="flex items-center gap-2.5 pt-1">
                                <button type="button" onclick="window.TRITHUC.closeStudentLoginModal()"
                                    class="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition">
                                    Đóng
                                </button>
                                <button type="button" onclick="window.TRITHUC.submitStudentVipUpgradeRequest()"
                                    class="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-lg transition">
                                    📨 Gửi Yêu Cầu Mở Khóa & Thời Hạn VIP
                                </button>
                            </div>
                        </div>
                    ` : mode === 'login' ? `
                        <div class="space-y-3">
                            ${state.savedStudentCreds && state.savedStudentCreds.username ? `
                                <div class="p-3 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-2">
                                    <div class="text-xs text-blue-950">
                                        <div class="font-extrabold">⚡ Tài khoản đã ghi nhớ trên thiết bị:</div>
                                        <div class="font-bold text-blue-700 mt-0.5">${escapeHtml(state.savedStudentCreds.name || state.savedStudentCreds.username)} (${escapeHtml(state.savedStudentCreds.username)}${state.savedStudentCreds.class ? ' • ' + escapeHtml(state.savedStudentCreds.class) : ''})</div>
                                    </div>
                                    <button type="button" onclick="window.TRITHUC.quickLoginRememberedStudent()"
                                        class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shrink-0 shadow-xs transition">
                                        Vào ngay →
                                    </button>
                                </div>
                            ` : ''}
                            <!-- Banner Bảo mật Khóa Thiết Bị & Định danh Gmail -->
                            ${(() => {
                                const dev = getHardwareDeviceProfile();
                                return `
                                <div class="p-3 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-1.5 text-xs">
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="font-black text-amber-400 uppercase flex items-center gap-1">🛡️ Bảo Mật Chống Chia Sẻ Tài Khoản (Tối Đa ${state.deviceSecurityPolicy?.defaultMaxDevices || 2} Thiết Bị)</span>
                                        <code class="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">${escapeHtml(dev.deviceId)}</code>
                                    </div>
                                    <div class="text-[11px] text-slate-300">
                                        Thiết bị hiện tại: <b class="text-white">${escapeHtml(dev.deviceName)}</b>. Mỗi tài khoản được gắn cố định với <b>01 Gmail cá nhân</b> và chỉ học được trên tối đa <b>02 thiết bị</b> (VD: 1 Máy tính + 1 Điện thoại). Thiết bị thứ 3 đăng nhập sẽ bị chặn tự động!
                                    </div>
                                    ${(state.isAdminLoggedIn || (state.simulatedDeviceSlot && state.simulatedDeviceSlot !== 'real')) ? `
                                    <div class="pt-1 border-t border-slate-700/80 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                                        <span class="text-amber-300 font-bold">🧪 Chế độ GV Kiểm thử Đa Thiết bị:</span>
                                        <button type="button" onclick="window.TRITHUC.setSimulatedDeviceSlot('real')"
                                            class="px-2 py-0.5 rounded font-extrabold transition ${(!state.simulatedDeviceSlot || state.simulatedDeviceSlot === 'real') ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                                            💻 Máy hiện tại (#1)
                                        </button>
                                        <button type="button" onclick="window.TRITHUC.setSimulatedDeviceSlot('sim_dev2')"
                                            class="px-2 py-0.5 rounded font-extrabold transition ${state.simulatedDeviceSlot === 'sim_dev2' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                                            📱 Điện thoại cá nhân (#2)
                                        </button>
                                        <button type="button" onclick="window.TRITHUC.setSimulatedDeviceSlot('sim_dev3_intruder')"
                                            class="px-2 py-0.5 rounded font-extrabold transition ${state.simulatedDeviceSlot === 'sim_dev3_intruder' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                                            🚫 Thiết bị lạ thứ #3 (Test chặn)
                                        </button>
                                    </div>
                                    ` : ''}
                                </div>`;
                            })()}
                            <div>
                                <label class="block text-xs font-extrabold text-slate-700 uppercase mb-1">Tài khoản Học sinh (Username) <span class="text-red-500">*</span></label>
                                <input id="stuLoginUserInp" type="text" value="${escapeHtml(state.savedStudentCreds?.username || '')}" placeholder="Nhập tài khoản học sinh (VD: hs12a1)..." autocomplete="username"
                                    onkeydown="if(event.key==='Enter') window.TRITHUC.submitStudentLogin()"
                                    class="w-full px-4 py-2.5 rounded-xl bg-slate-100 border-2 border-slate-200 font-bold text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none" />
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label class="block text-xs font-extrabold text-slate-700 uppercase mb-1">Mật khẩu <span class="text-red-500">*</span></label>
                                    <input id="stuLoginPassInp" type="password" value="${escapeHtml(state.savedStudentCreds?.password || '')}" placeholder="Nhập mật khẩu..." autocomplete="current-password"
                                        onkeydown="if(event.key==='Enter') window.TRITHUC.submitStudentLogin()"
                                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border-2 border-slate-200 font-bold text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none" />
                                </div>
                                <div>
                                    <label class="block text-xs font-extrabold text-blue-800 uppercase mb-1">📧 Gmail Định Danh <span class="text-red-500">*</span></label>
                                    <input id="stuLoginGmailInp" type="email" value="${escapeHtml(state.savedStudentCreds?.gmail || '')}" placeholder="VD: em12a1@gmail.com" autocomplete="email"
                                        onkeydown="if(event.key==='Enter') window.TRITHUC.submitStudentLogin()"
                                        class="w-full px-3.5 py-2.5 rounded-xl bg-blue-50/60 border-2 border-blue-200 font-bold text-xs text-slate-900 focus:bg-white focus:border-blue-600 outline-none" />
                                </div>
                            </div>
                            <div class="flex items-center justify-between pt-0.5">
                                <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <input id="stuRememberMeChk" type="checkbox" ${state.stuRememberMe !== false ? 'checked' : ''}
                                        onchange="window.TRITHUC.toggleStudentRememberMe(this.checked)"
                                        class="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                                    <span class="text-xs font-extrabold text-slate-700">Ghi nhớ đăng nhập trên thiết bị này</span>
                                </label>
                                ${state.savedStudentCreds && state.savedStudentCreds.username ? `
                                    <button type="button" onclick="window.TRITHUC.clearSavedStudentCreds()"
                                        class="text-[11px] font-extrabold text-rose-600 hover:underline">
                                        Xóa TK đã lưu
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="text-center text-xs text-slate-500 font-semibold pt-0.5">
                            Chưa có tài khoản? <button type="button" onclick="window.TRITHUC.switchStudentAuthMode('register')" class="text-emerald-700 font-extrabold underline hover:text-emerald-800">📝 Bấm vào đây để Đăng ký TK & Chọn Gói Thời Hạn VIP</button>
                        </div>

                        <div class="flex items-center gap-2.5 pt-1">
                            <button type="button" onclick="window.TRITHUC.closeStudentLoginModal()"
                                class="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition">
                                Đóng
                            </button>
                            <button type="button" onclick="window.TRITHUC.submitStudentLogin()"
                                class="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition">
                                🔓 Đăng Nhập Hệ Thống Học Tập
                            </button>
                        </div>
                    ` : `
                        <div class="space-y-2.5">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Họ và tên học sinh <span class="text-red-500">*</span></label>
                                    <input id="regStuNameInp" type="text" value="${escapeHtml(state.regDraft?.name || '')}"
                                        oninput="window.TRITHUC.updateRegDraftField('name', this.value)"
                                        placeholder="VD: Nguyễn Văn Bình"
                                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none" />
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Lớp <span class="text-red-500">*</span></label>
                                        <input id="regStuClassInp" type="text" value="${escapeHtml(state.regDraft?.class || '12A1')}"
                                            oninput="window.TRITHUC.updateRegDraftField('class', this.value)"
                                            placeholder="12A1"
                                            class="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none" />
                                    </div>
                                    <div>
                                        <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">SBD / STT</label>
                                        <input id="regStuSttInp" type="text" value="${escapeHtml(state.regDraft?.stt || '')}"
                                            oninput="window.TRITHUC.updateRegDraftField('stt', this.value)"
                                            placeholder="08"
                                            class="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Tên đăng nhập <span class="text-red-500">*</span></label>
                                    <input id="regStuUserInp" type="text" value="${escapeHtml(state.regDraft?.username || '')}"
                                        oninput="window.TRITHUC.updateRegDraftField('username', this.value)"
                                        placeholder="VD: binh12a1"
                                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-mono-code font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Mật khẩu <span class="text-red-500">*</span></label>
                                    <input id="regStuPassInp" type="password" value="${escapeHtml(state.regDraft?.password || '')}"
                                        oninput="window.TRITHUC.updateRegDraftField('password', this.value)"
                                        placeholder="Nhập mật khẩu (Mặc định: 123)"
                                        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none" />
                                </div>
                            </div>
                            <div class="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1.5">
                                <div class="flex items-center justify-between gap-2">
                                    <label class="block text-[11px] font-black text-blue-950 uppercase">📧 Địa chỉ Gmail cá nhân định danh (Tự điền nếu để trống)</label>
                                    <span class="px-2 py-0.5 rounded bg-blue-700 text-white font-extrabold text-[9.5px]">Khóa Thiết bị 1/${state.deviceSecurityPolicy?.defaultMaxDevices || 2}</span>
                                </div>
                                <input id="regStuGmailInp" type="email" value="${escapeHtml(state.regDraft?.gmail || '')}"
                                    oninput="window.TRITHUC.updateRegDraftField('gmail', this.value)"
                                    placeholder="VD: nguyenvanbinh12a1@gmail.com (Để trống hệ thống tự tạo)"
                                    class="w-full px-3.5 py-2 rounded-xl bg-white border border-blue-300 font-bold text-xs text-slate-900 focus:border-blue-600 outline-none" />
                                <div class="text-[10.5px] text-blue-800 font-semibold">
                                    🔒 Thiết bị hiện tại (<code>${escapeHtml(getHardwareDeviceProfile().deviceId)}</code> - ${escapeHtml(getHardwareDeviceProfile().shortType)}) sẽ được tự động gắn làm <b>Thiết bị số 1</b>.
                                </div>
                            </div>

                            <!-- TÍCH CHỌN KHỐI MUỐN HỌC (KHỐI 12, 11, 10, LUYỆN ĐỀ) -->
                            <div class="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                                <label class="block text-[11px] font-black text-amber-950 uppercase">🎯 Tích chọn Khối muốn học & Luyện đề (Mở khóa từng gói riêng biệt):</label>
                                <div class="grid grid-cols-2 gap-2 text-xs font-extrabold">
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.k12 ? 'border-blue-600 text-blue-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.k12 ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('k12', this.checked)" class="w-4 h-4 accent-blue-600" />
                                        <span>📘 Khối 12</span>
                                    </label>
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.k11 ? 'border-blue-600 text-blue-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.k11 ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('k11', this.checked)" class="w-4 h-4 accent-blue-600" />
                                        <span>📗 Khối 11</span>
                                    </label>
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.k10 ? 'border-blue-600 text-blue-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.k10 ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('k10', this.checked)" class="w-4 h-4 accent-blue-600" />
                                        <span>📙 Khối 10</span>
                                    </label>
                                    <label class="flex items-center gap-2 p-2 rounded-xl bg-white border ${rp.luyende ? 'border-rose-600 text-rose-900' : 'border-slate-200 text-slate-700'} cursor-pointer">
                                        <input type="checkbox" ${rp.luyende ? 'checked' : ''} onchange="window.TRITHUC.toggleRegPackage('luyende', this.checked)" class="w-4 h-4 accent-rose-600" />
                                        <span>🔥 Luyện đề</span>
                                    </label>
                                </div>
                            </div>

                            ${durationSelectorHtml}

                            <div>
                                <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Số điện thoại / Ghi chú gửi Giáo viên</label>
                                <input id="regStuPhoneInp" type="text" value="${escapeHtml(state.regDraft?.phone || '')}"
                                    oninput="window.TRITHUC.updateRegDraftField('phone', this.value)"
                                    placeholder="VD: 0988xxxxxx - Em đăng ký gói VIP 1 năm Khối 12"
                                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 font-semibold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none" />
                            </div>
                        </div>

                        <div class="flex items-center gap-2.5 pt-1">
                            <button type="button" onclick="window.TRITHUC.closeStudentLoginModal()"
                                class="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition">
                                Đóng
                            </button>
                            <button type="button" onclick="window.TRITHUC.submitStudentRegistration()"
                                class="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transition">
                                📨 Gửi Đăng Ký VIP Về Quản Lý Giáo Viên
                            </button>
                        </div>
                    `}
                </div>
            </div>`;
        }