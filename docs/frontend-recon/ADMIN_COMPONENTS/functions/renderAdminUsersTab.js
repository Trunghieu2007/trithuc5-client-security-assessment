function renderAdminUsersTab() {
            const classes = Array.from(new Set(state.users.map(u => u.class))).sort();
            const pendingList = state.users.filter(u => u.status === 'pending' || u.vipRequestPending);
            const activeCount = state.users.filter(u => u.status === 'active').length;
            const vipCount = state.users.filter(u => !isStudentVipExpired(u) && (u.vipPackages?.k12 || u.vipPackages?.k11 || u.vipPackages?.k10 || u.vipPackages?.luyende)).length;
            const subView = state.adminUsersSubView || 'all';
            const gf = state.googleFormConfig || {};
            const hasFormLinked = Boolean(gf.actionUrl && gf.actionUrl.includes('docs.google.com/forms'));
            const kbUsed = getStorageFootprintKB();

            const filtered = state.users.filter(u => {
                if (state.adminUserClassFilter !== 'all' && u.class !== state.adminUserClassFilter) return false;
                if (state.adminUserStatusFilter === 'pending' && !(u.status === 'pending' || u.vipRequestPending)) return false;
                if (state.adminUserStatusFilter === 'vip' && !(!isStudentVipExpired(u) && (u.vipPackages?.k12 || u.vipPackages?.k11 || u.vipPackages?.k10 || u.vipPackages?.luyende))) return false;
                if (state.adminUserStatusFilter === 'expired' && !isStudentVipExpired(u)) return false;
                if (state.adminUserStatusFilter === 'active' && u.status !== 'active') return false;
                if (state.adminUserStatusFilter === 'locked' && u.status !== 'locked') return false;
                return true;
            });

            const showVipSec = subView === 'all' || subView === 'vip' || pendingList.length > 0;
            const showDevSec = subView === 'all' || subView === 'security';
            const showGFormPerfSec = subView === 'all' || subView === 'gform_perf' || subView === 'logs';

            return `
            <div class="space-y-5">
                <!-- THANH ĐIỀU HƯỚNG PHÂN MỤC TÀI KHOẢN & DUYỆT VIP — V5.1.1 -->
                <div class="v511-subnav-bar">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[11px] font-black text-slate-500 uppercase px-2">⚡ Chế độ xem nhanh:</span>
                        ${[
                            { id: 'all', icon: '🌟', label: 'Hiển thị Tất cả (Đầy đủ)', badge: '' },
                            { id: 'vip', icon: '👑', label: `Duyệt VIP & Phân Quyền TK (${state.users.length})`, badge: pendingList.length > 0 ? `🔔 ${pendingList.length} chờ` : '' },
                            { id: 'security', icon: '🛡️', label: 'Khiên Gmail & Khóa 1–2 Thiết Bị', badge: '' },
                            { id: 'gform_perf', icon: '🔗', label: 'Link Google Biểu Mẫu & 5 Cơ Chế Chống Nặng', badge: hasFormLinked ? '🟢 Đã nối Form' : '' },
                            { id: 'logs', icon: '📋', label: `Nhật Ký Hoạt Động (${state.activityLogs.length} bản ghi)`, badge: '' }
                        ].map(item => {
                            const active = subView === item.id;
                            return `
                            <button type="button" onclick="window.TRITHUC.setAdminUsersSubView('${item.id}')"
                                class="px-3 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 ${active ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                                <span>${item.icon}</span>
                                <span>${item.label}</span>
                                ${item.badge ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] font-black ${active ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'}">${item.badge}</span>` : ''}
                            </button>`;
                        }).join('')}
                    </div>
                    <div class="flex items-center gap-2 text-[11px] font-bold text-slate-500 px-2">
                        <span>💾 Bộ nhớ đệm: <b class="text-emerald-700">~${kbUsed} KB</b></span>
                    </div>
                </div>

                ${showDevSec ? `
                <!-- BẢNG ĐIỀU KHIỂN BẢO MẬT ĐỊNH DANH GMAIL & CHỐNG CHIA SẺ TÀI KHOẢN (GIỚI HẠN 1-2 THIẾT BỊ) -->
                ${(() => {
                    const pol = state.deviceSecurityPolicy || { requireGmail: true, defaultMaxDevices: 2, autoLockOnThirdDevice: true };
                    const totalBoundDevs = state.users.reduce((acc, u) => acc + ((u.trustedDevices || []).length), 0);
                    const totalViolUsers = state.users.filter(u => (u.deviceShareViolations || 0) > 0).length;
                    const resetReqUsers = state.users.filter(u => u.deviceChangeRequest && u.deviceChangeRequest.pending);
                    const curDev = getHardwareDeviceProfile();
                    return `
                    <div id="sec-admin-device-security" class="bg-white rounded-3xl border-2 border-blue-200 p-4 sm:p-5 shadow-xs space-y-3">
                        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-2.5 py-0.5 rounded-full bg-blue-700 text-white text-[10px] font-black uppercase">🛡️ Khiên Bảo Mật Tài Khoản & Khóa Thiết Bị V4.2.8</span>
                                    <h4 class="text-sm sm:text-base font-black text-slate-900 uppercase m-0">
                                        Chống Học Sinh Chia Sẻ Tài Khoản Cho Người Khác (Định Danh Gmail + Giới Hạn 1–2 Thiết Bị)
                                    </h4>
                                </div>
                                <p class="text-xs text-slate-600 m-0">
                                    Mỗi tài khoản học sinh bắt buộc gắn cố định với <b>01 Gmail cá nhân</b>, được ký toàn vẹn chống sửa F12 (<code>v27_HMAC</code>) và tự động ghi nhận mã phần cứng (Hardware Fingerprint) của <b>tối đa ${pol.defaultMaxDevices || 2} thiết bị</b> (VD: 01 Máy tính + 01 Điện thoại). Khi bạn khác dùng tài khoản đăng nhập trên <b>thiết bị thứ ${(pol.defaultMaxDevices || 2) + 1}</b>, hệ thống sẽ <b>chặn ngay lập tức</b>, ghi vào Nhật ký hoạt động và báo cáo về Google Biểu mẫu!
                                </p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 shrink-0 text-xs">
                                <span class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold">
                                    📱 Thiết bị đã định danh: <b>${totalBoundDevs} máy</b>
                                </span>
                                <span class="px-3 py-1.5 rounded-xl ${totalViolUsers > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' : 'bg-slate-100 text-slate-700 border border-slate-200'} font-extrabold">
                                    🚨 Phát hiện chia sẻ TK: <b>${totalViolUsers} HS</b>
                                </span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <label class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                                <div>
                                    <div class="font-extrabold text-slate-900">📧 Bắt buộc xác thực Gmail cá nhân</div>
                                    <div class="text-[11px] text-slate-500">Mỗi học sinh 1 Gmail riêng, chống dùng chung Gmail</div>
                                </div>
                                <input type="checkbox" ${pol.requireGmail !== false ? 'checked' : ''}
                                    onchange="window.TRITHUC.updateDeviceSecurityPolicy('requireGmail', this.checked)"
                                    class="w-4 h-4 accent-blue-600 shrink-0" />
                            </label>

                            <div class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                                <div>
                                    <div class="font-extrabold text-slate-900">💻 Số thiết bị tối đa / 1 Tài khoản</div>
                                    <div class="text-[11px] text-slate-500">Áp dụng mặc định cho toàn bộ học sinh</div>
                                </div>
                                <select onchange="window.TRITHUC.updateDeviceSecurityPolicy('defaultMaxDevices', Number(this.value))"
                                    class="px-2.5 py-1.5 rounded-xl bg-white border border-blue-300 font-black text-blue-900 text-xs">
                                    <option value="1" ${Number(pol.defaultMaxDevices) === 1 ? 'selected' : ''}>Chỉ 1 Thiết bị</option>
                                    <option value="2" ${Number(pol.defaultMaxDevices || 2) === 2 ? 'selected' : ''}>Tối đa 2 Thiết bị</option>
                                </select>
                            </div>

                            <label class="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                                <div>
                                    <div class="font-extrabold text-slate-900">🔒 Tự khóa TK nếu cố vào máy thứ 3</div>
                                    <div class="text-[11px] text-slate-500">Tự khóa khi phát hiện ≥ 2 lần đăng nhập máy lạ</div>
                                </div>
                                <input type="checkbox" ${pol.autoLockOnThirdDevice !== false ? 'checked' : ''}
                                    onchange="window.TRITHUC.updateDeviceSecurityPolicy('autoLockOnThirdDevice', this.checked)"
                                    class="w-4 h-4 accent-rose-600 shrink-0" />
                            </label>
                        </div>

                        <!-- BỘ GIẢ LẬP KIỂM THỬ ĐA THIẾT BỊ DÀNH CHO GIÁO VIÊN NGAY TRONG QUẢN LÝ TÀI KHOẢN -->
                        <div class="p-3 rounded-2xl bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase">🧪 Bộ Kiểm Thử Đa Máy Cho Giáo Viên</span>
                                <span class="text-slate-200">Đang giả lập thiết bị: <b class="text-emerald-300">${escapeHtml(curDev.deviceId)}</b> (${escapeHtml(curDev.shortType || curDev.deviceType)})</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-1.5">
                                <button type="button" onclick="window.TRITHUC.setSimulatedDeviceSlot('real')"
                                    class="px-2.5 py-1 rounded-xl font-extrabold text-[11px] transition ${(!state.simulatedDeviceSlot || state.simulatedDeviceSlot === 'real') ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                                    💻 1. Máy tính thật (#1)
                                </button>
                                <button type="button" onclick="window.TRITHUC.setSimulatedDeviceSlot('sim_dev2')"
                                    class="px-2.5 py-1 rounded-xl font-extrabold text-[11px] transition ${state.simulatedDeviceSlot === 'sim_dev2' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                                    📱 2. Điện thoại HS (#2)
                                </button>
                                <button type="button" onclick="window.TRITHUC.setSimulatedDeviceSlot('sim_dev3_intruder')"
                                    class="px-2.5 py-1 rounded-xl font-extrabold text-[11px] transition ${state.simulatedDeviceSlot === 'sim_dev3_intruder' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                                    🚫 3. Máy lạ thứ #3 (Test chặn)
                                </button>
                            </div>
                        </div>

                        ${resetReqUsers.length > 0 ? `
                            <div class="p-3 rounded-2xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div class="font-extrabold text-amber-950">
                                    🔔 Có <b>${resetReqUsers.length} học sinh</b> gửi đơn xin đổi thiết bị mới: ${resetReqUsers.map(x => `<b>${escapeHtml(x.name)} (${escapeHtml(x.class)})</b>`).join(', ')}
                                </div>
                                <div class="flex gap-1.5 flex-wrap">
                                    ${resetReqUsers.map(x => `
                                        <button type="button" onclick="window.TRITHUC.openAdminManageDeviceModal('${x.id}')"
                                            class="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px]">
                                            Xem & Duyệt ${escapeHtml(x.name)}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>`;
                })()}
                ` : ''}

                ${showVipSec ? `
                <!-- KHỐI CHIA SẺ NHANH LINK ĐĂNG KÝ VIP CHO HỌC SINH & BANNER DUYỆT VIP -->
                <div id="sec-admin-vip-accounts" class="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-5 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="space-y-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">Tính năng Mới • Quản lý VIP Chuẩn Quốc Tế</span>
                            <h3 class="text-base sm:text-lg font-black uppercase m-0">
                                🔗 Gửi Link Cho Học Sinh Đăng Ký VIP & Quản Lý Thời Hạn (3 Tháng • 6 Tháng • 1 Năm • Trọn Đời)
                            </h3>
                        </div>
                        <p class="text-xs text-blue-100 m-0 font-semibold">
                            • <b>Phân quyền cô lập chuẩn 100%:</b> Tích chọn <b>Khối 12</b> chỉ mở khóa đúng <b>Khối 12</b> (Khối 11, Khối 10, Luyện đề vẫn khóa chặt).<br>
                            • <b>Tự động kiểm tra hạn sử dụng:</b> Khi hết hạn gói 3 tháng / 6 tháng / 1 năm, hệ thống tự động khóa lại và nhắc học sinh gia hạn.
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 shrink-0">
                        <button type="button" onclick="window.TRITHUC.openShareVipLinkModal()"
                            class="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition">
                            <span>🔗</span>
                            <span>Lấy Link & Tin Nhắn Gửi Học Sinh Đăng Ký VIP</span>
                        </button>
                        ${pendingList.length > 0 ? `
                            <button type="button" onclick="window.TRITHUC.approveAllPendingStudents()"
                                class="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-lg transition">
                                ✔ Duyệt Tất Cả Yêu Cầu (${pendingList.length} HS)
                            </button>
                        ` : ''}
                    </div>
                </div>

                ${pendingList.length > 0 ? `
                    <div id="pendingApprovalBox" class="bg-amber-50 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black">🔔 MỚI (${pendingList.length})</span>
                                <h4 class="text-xs sm:text-sm font-black text-amber-950 uppercase m-0">Danh sách học sinh vừa đăng ký tài khoản / xin mở khóa gói VIP chờ duyệt (${pendingList.length} học sinh):</h4>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button type="button" onclick="window.TRITHUC.approveAllPendingStudents()"
                                    class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition">
                                    ✔ Duyệt Nhanh Tất Cả (${pendingList.length} HS)
                                </button>
                                <button type="button" onclick="window.TRITHUC.quickDeleteAllPendingUsers()"
                                    class="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-2xs transition">
                                    🗑️ Xóa Nhanh Tất Cả Chờ Duyệt
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            ${pendingList.map(u => {
                                const req = u.requestedPackages || {};
                                const reqPlanKey = u.requestedPlan || '1y';
                                const reqPlanObj = VIP_DURATION_PLANS[reqPlanKey] || VIP_DURATION_PLANS['1y'];
                                const reqBadges = [
                                    req.k12 ? '📘 Khối 12' : '',
                                    req.k11 ? '📗 Khối 11' : '',
                                    req.k10 ? '📙 Khối 10' : '',
                                    req.luyende ? '🔥 Luyện đề' : ''
                                ].filter(Boolean).join(' • ') || 'Chưa chọn gói';
                                return `
                                <div class="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div class="min-w-0 space-y-1">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span class="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] uppercase">${u.status === 'pending' ? '🆕 Đăng ký TK mới' : '👑 Xin nâng cấp VIP'}</span>
                                            <span class="font-extrabold text-slate-900 text-sm">${escapeHtml(u.name)}</span>
                                            <span class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">Lớp ${escapeHtml(u.class)}</span>
                                            <span class="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-black text-[10px]">
                                                ⏳ Xin gói: ${escapeHtml(reqPlanObj.shortLabel)}
                                            </span>
                                        </div>
                                        <div class="text-xs text-slate-600">
                                            TK: <code class="font-bold text-blue-700">${escapeHtml(u.username)}</code> • MK: <code class="font-bold">${escapeHtml(u.password)}</code>
                                            ${u.gmail ? ` • 📧 <span class="text-blue-800 font-semibold">${escapeHtml(u.gmail)}</span>` : ''}
                                        </div>
                                        <div class="text-xs font-extrabold text-rose-700">
                                            🎯 Khối xin mở: ${reqBadges}
                                        </div>
                                        <div class="text-[11px] text-slate-500">📞 Ghi chú: ${escapeHtml(u.phone || 'Đăng ký trực tuyến')} • 🕒 ${escapeHtml(u.registeredAt || 'Vừa xong')}</div>
                                    </div>
                                    <div class="flex flex-col gap-1.5 shrink-0">
                                        <button type="button" onclick="window.TRITHUC.approveStudentWithVip('${escapeJsAttr(u.id)}', true)"
                                            class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition">
                                            👑 Duyệt đúng Khối & Gói (${escapeHtml(reqPlanObj.shortLabel)})
                                        </button>
                                        <div class="flex items-center gap-1.5">
                                            <button type="button" onclick="window.TRITHUC.approveStudentWithVip('${escapeJsAttr(u.id)}', false)"
                                                class="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] transition">
                                                ✔ Duyệt Thường
                                            </button>
                                            <button type="button" onclick="window.TRITHUC.rejectStudentAccount('${escapeJsAttr(u.id)}')"
                                                class="px-2.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-black text-[11px] transition"
                                                title="Từ chối & xóa nhanh tài khoản này">
                                                🗑️ Xóa nhanh
                                            </button>
                                        </div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <!-- Cột Trái: Giáo viên cấp tài khoản trực tiếp (Chọn đúng Khối & Thời hạn 3 tháng, 6 tháng, 1 năm, Trọn đời) -->
                    <div class="lg:col-span-4 space-y-4">
                        <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <h3 class="text-sm font-black text-blue-800 uppercase m-0">➕ Cấp Tài Khoản & Set Thời Hạn VIP</h3>
                            <p class="text-xs text-slate-500 m-0">Tích khối nào chỉ mở đúng khối đó và áp dụng hạn sử dụng tự động:</p>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-600 mb-1">Tài khoản (Username) *</label>
                                    <input id="newStuUserInp" type="text" placeholder="VD: hs12a3" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-600 mb-1">Mật khẩu *</label>
                                    <input id="newStuPassInp" type="text" value="123" placeholder="VD: 123" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-600 mb-1">Họ và tên học sinh *</label>
                                <input id="newStuNameInp" type="text" placeholder="VD: Nguyễn Văn An" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold" />
                            </div>
                            <div class="grid grid-cols-3 gap-2">
                                <div class="col-span-2">
                                    <label class="block text-[11px] font-bold text-blue-800 mb-1">📧 Gmail định danh (Tùy chọn / HS tự điền lần đầu)</label>
                                    <input id="newStuGmailInp" type="email" placeholder="VD: nguyenvanan@gmail.com" class="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/40 text-xs font-bold" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-blue-800 mb-1">🛡️ Giới hạn máy</label>
                                    <select id="newStuMaxDevInp" class="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/40 text-xs font-extrabold">
                                        <option value="2" selected>2 thiết bị</option>
                                        <option value="1">1 thiết bị</option>
                                    </select>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-600 mb-1">Lớp *</label>
                                    <input id="newStuClassInp" type="text" value="12A1" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold" />
                                </div>
                                <div>
                                    <label class="block text-[11px] font-bold text-slate-600 mb-1">SBD / STT</label>
                                    <input id="newStuSttInp" type="text" placeholder="VD: 08" class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold" />
                                </div>
                            </div>

                            <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                                <div class="text-[11px] font-black text-amber-950 uppercase">👑 1. Tích chọn Gói VIP (Mở độc lập từng mục):</div>
                                <div class="grid grid-cols-2 gap-1.5 text-xs font-bold">
                                    <label class="flex items-center gap-1.5 cursor-pointer"><input id="newStuVipK12" type="checkbox" checked class="accent-blue-600" /> <span>📘 Khối 12</span></label>
                                    <label class="flex items-center gap-1.5 cursor-pointer"><input id="newStuVipK11" type="checkbox" class="accent-emerald-600" /> <span>📗 Khối 11</span></label>
                                    <label class="flex items-center gap-1.5 cursor-pointer"><input id="newStuVipK10" type="checkbox" class="accent-purple-600" /> <span>📙 Khối 10</span></label>
                                    <label class="flex items-center gap-1.5 cursor-pointer"><input id="newStuVipLD" type="checkbox" class="accent-rose-600" /> <span>🔥 Luyện đề</span></label>
                                </div>

                                <div class="pt-1 border-t border-amber-200/80">
                                    <label class="block text-[11px] font-black text-amber-950 uppercase mb-1">⏳ 2. Set Thời Hạn Gói VIP:</label>
                                    <select id="newStuVipPlanInp" class="w-full p-2 rounded-xl border border-amber-300 bg-white text-xs font-extrabold text-slate-900">
                                        <option value="3m">⏳ Gói 3 tháng (90 ngày)</option>
                                        <option value="6m">⏳ Gói 6 tháng (180 ngày)</option>
                                        <option value="1y" selected>⏳ Gói 1 năm (365 ngày)</option>
                                        <option value="lifetime">♾️ Gói Trọn đời (Vĩnh viễn)</option>
                                    </select>
                                </div>
                            </div>

                            <button type="button" onclick="window.TRITHUC.addSingleStudentAccount()"
                                class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition">
                                ➕ Cấp & Kích Hoạt Tài Khoản Học Sinh
                            </button>
                        </div>

                        <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <h3 class="text-sm font-black text-emerald-800 uppercase m-0">⚡ Nhập Nhanh Danh Sách Cả Lớp</h3>
                            <p class="text-[11px] text-slate-500 m-0">Mỗi dòng: <code>taikhoan,matkhau,Họ tên,Lớp,SBD</code>:</p>
                            <textarea id="bulkStudentsTextarea" rows="3"
                                placeholder="hs08,123,Phạm Minh Đức,12A1,08&#10;hs09,123,Hoàng Bảo Ngọc,12A1,09"
                                class="w-full p-3 rounded-xl border border-slate-300 font-mono-code text-xs outline-none focus:border-emerald-600"></textarea>
                            <div class="flex gap-2">
                                <button type="button" onclick="window.TRITHUC.addBulkStudentAccounts()"
                                    class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase transition">
                                    ⚡ Tạo Hàng Loạt
                                </button>
                                <button type="button" onclick="window.TRITHUC.exportStudentAccountsExcel()"
                                    class="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                                    📤 Xuất Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Cột Phải: Bảng Phân Quyền VIP Cô Lập Từng Khối & Set Thời Hạn + Thêm Nhanh / Xóa Nhanh (v4.3.9) -->
                    <div class="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col space-y-3">
                        <!-- THANH THÊM NHANH & XÓA NHANH TÀI KHOẢN HỌC SINH 1 CHẠM (NÂNG CẤP V4.3.9) -->
                        ${(() => {
                            const selMap = state.selectedAdminUserIds || {};
                            const selectedCount = state.users.filter(u => selMap[u.id]).length;
                            const allFilteredSelected = filtered.length > 0 && filtered.every(u => Boolean(selMap[u.id]));
                            const undoCount = Array.isArray(state.lastDeletedUsersBackup) ? state.lastDeletedUsersBackup.length : 0;
                            return `
                            <div class="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-emerald-50/50 border border-blue-200 space-y-2.5">
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <span class="px-2 py-0.5 rounded-md bg-blue-700 text-white font-black text-[10px] uppercase">⚡ Quản Lý Siêu Tốc & Đồng Bộ Đa Máy V4.3.9</span>
                                        <span class="text-xs font-extrabold text-slate-800">Thêm Nhanh • Xóa Nhanh • Duyệt Từ Xa Không Cần Đăng Nhập Máy HS</span>
                                        <button type="button" onclick="window.TRITHUC.syncCloudUsersNow()"
                                            class="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] shadow-2xs transition">
                                            🔄 Đồng bộ Đám mây
                                        </button>
                                    </div>
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <button type="button" onclick="window.TRITHUC.quickGenerateSampleStudent()"
                                            class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-2xs transition"
                                            title="Tạo ngay 1 tài khoản học sinh mới chỉ với 1 cú nhấp chuột">
                                            ⚡ +1 TK Học Sinh Nhanh
                                        </button>
                                        ${selectedCount > 0 ? `
                                            <button type="button" onclick="window.TRITHUC.quickDeleteSelectedUsers()"
                                                class="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-[11px] shadow-2xs transition">
                                                🗑️ Xóa Nhanh Đã Chọn (${selectedCount})
                                            </button>
                                        ` : ''}
                                        ${pendingList.length > 0 ? `
                                            <button type="button" onclick="window.TRITHUC.quickDeleteAllPendingUsers()"
                                                class="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-black text-[11px] transition">
                                                🗑️ Xóa Nhanh Chờ Duyệt (${pendingList.length})
                                            </button>
                                        ` : ''}
                                        ${filtered.length > 0 ? `
                                            <button type="button" onclick="window.TRITHUC.quickDeleteFilteredUsers()"
                                                class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-[11px] transition"
                                                title="Xóa nhanh toàn bộ tài khoản đang hiển thị trong bộ lọc hiện tại">
                                                🗑️ Xóa Nhanh Đang Lọc (${filtered.length})
                                            </button>
                                        ` : ''}
                                        ${state.users.length > 0 ? `
                                            <button type="button" onclick="window.TRITHUC.wipeAllStudentAccountsNow()"
                                                class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-800 text-white font-black text-[11px] shadow-2xs transition"
                                                title="Xóa sạch toàn bộ dữ liệu đăng ký cũ & danh sách tài khoản về 0">
                                                🧹 Xóa Sạch Toàn Bộ TK (${state.users.length})
                                            </button>
                                        ` : ''}
                                        ${undoCount > 0 ? `
                                            <button type="button" onclick="window.TRITHUC.undoLastDeletedUsers()"
                                                class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow-2xs transition">
                                                ↩️ Hoàn tác xóa (${undoCount} TK)
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                    <input id="quickAddStuNameOrUserInp" type="text"
                                        onkeydown="if(event.key==='Enter') window.TRITHUC.quickAddStudentOneRow()"
                                        placeholder="✍️ Nhập Họ tên HS (VD: Lê Minh Anh) hoặc Tên TK..."
                                        class="sm:col-span-4 px-3 py-2 rounded-xl bg-white border border-blue-300 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none" />
                                    <input id="quickAddStuClassInp" type="text" value="12A1"
                                        onkeydown="if(event.key==='Enter') window.TRITHUC.quickAddStudentOneRow()"
                                        placeholder="Lớp (12A1)"
                                        class="sm:col-span-2 px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none" />
                                    <input id="quickAddStuPassInp" type="text" value="123"
                                        onkeydown="if(event.key==='Enter') window.TRITHUC.quickAddStudentOneRow()"
                                        placeholder="MK (123)"
                                        class="sm:col-span-2 px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none" />
                                    <select id="quickAddStuVipModeInp"
                                        class="sm:col-span-2 px-2 py-2 rounded-xl bg-white border border-amber-300 text-xs font-extrabold text-slate-900 outline-none">
                                        <option value="k12" selected>📘 VIP Khối 12 (1 Năm)</option>
                                        <option value="full">👑 Full VIP 4 Gói</option>
                                        <option value="k11">📗 VIP Khối 11</option>
                                        <option value="k10">📙 VIP Khối 10</option>
                                        <option value="luyende">🔥 VIP Luyện Đề</option>
                                        <option value="normal">🔓 TK Thường</option>
                                    </select>
                                    <button type="button" id="btnQuickAddStudentRow" onclick="window.TRITHUC.quickAddStudentOneRow()"
                                        class="sm:col-span-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-xs flex items-center justify-center gap-1 transition">
                                        <span>➕</span>
                                        <span>Thêm Nhanh</span>
                                    </button>
                                </div>

                            </div>`;
                        })()}

                        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div>
                                <h3 class="text-base font-black text-slate-900 uppercase m-0">👥 Bảng Phân Quyền VIP Từng Khối & Thời Hạn Sử Dụng (${filtered.length})</h3>
                                <p class="text-xs text-slate-500 m-0">
                                    Đang hoạt động: <b class="text-emerald-700">${activeCount}</b> • Có VIP còn hạn: <b class="text-amber-600">${vipCount}</b> • Chờ duyệt: <b class="text-rose-600">${pendingList.length}</b>
                                </p>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button type="button" onclick="window.TRITHUC.grantVipAllActiveStudents('k12', true)"
                                    class="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-[11px] transition"
                                    title="Chỉ mở khóa đúng Khối 12 cho cả lớp (không mở Khối 11, 10, Luyện đề)">
                                    📘 Mở VIP Khối 12 cả lớp
                                </button>
                                <select onchange="window.TRITHUC.setAdminUserStatusFilter(this.value)"
                                    class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50">
                                    <option value="all" ${state.adminUserStatusFilter === 'all' ? 'selected' : ''}>Tất cả (${state.users.length})</option>
                                    <option value="pending" ${state.adminUserStatusFilter === 'pending' ? 'selected' : ''}>🔔 Chờ duyệt / Xin VIP (${pendingList.length})</option>
                                    <option value="vip" ${state.adminUserStatusFilter === 'vip' ? 'selected' : ''}>👑 Đang có VIP còn hạn (${vipCount})</option>
                                    <option value="expired" ${state.adminUserStatusFilter === 'expired' ? 'selected' : ''}>⛔ Đã hết hạn VIP</option>
                                </select>
                                <select onchange="window.TRITHUC.setAdminUserClassFilter(this.value)"
                                    class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50">
                                    <option value="all" ${state.adminUserClassFilter === 'all' ? 'selected' : ''}>Tất cả các lớp</option>
                                    ${classes.map(c => `<option value="${escapeHtml(c)}" ${state.adminUserClassFilter === c ? 'selected' : ''}>Lớp ${escapeHtml(c)}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="overflow-x-auto flex-1">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                                        <th class="p-2 text-center w-8" title="Tích chọn tất cả tài khoản đang hiển thị để xóa nhanh">
                                            <input type="checkbox"
                                                ${filtered.length > 0 && filtered.every(u => Boolean(state.selectedAdminUserIds && state.selectedAdminUserIds[u.id])) ? 'checked' : ''}
                                                onchange="window.TRITHUC.toggleSelectAllFilteredUsers(this.checked)"
                                                class="w-4 h-4 accent-red-600 cursor-pointer" />
                                        </th>
                                        <th class="p-2.5">Học sinh / Tài khoản</th>
                                        <th class="p-2 text-center bg-amber-50/80 text-amber-950" title="Tích mở cả 4 gói">👑 Tất cả</th>
                                        <th class="p-2 text-center bg-blue-50/60 text-blue-950" title="Chỉ mở khóa Toán 12">📘 K12</th>
                                        <th class="p-2 text-center bg-emerald-50/60 text-emerald-950" title="Chỉ mở khóa Toán 11">📗 K11</th>
                                        <th class="p-2 text-center bg-purple-50/60 text-purple-950" title="Chỉ mở khóa Toán 10">📙 K10</th>
                                        <th class="p-2 text-center bg-rose-50/60 text-rose-950" title="Chỉ mở khóa Luyện đề">🔥 Đề</th>
                                        <th class="p-2.5 text-center bg-indigo-50/60 text-indigo-950">⏳ Set Thời Gian VIP</th>
                                        <th class="p-2.5 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${filtered.length === 0 ? `
                                        <tr>
                                            <td colspan="9" class="p-8 text-center">
                                                <div class="max-w-lg mx-auto space-y-2">
                                                    <div class="text-sm font-black text-slate-700">✨ Danh sách tài khoản hiện đang trống (Đã xóa sạch dữ liệu đăng ký cũ)</div>
                                                    <p class="text-xs text-slate-500 m-0">
                                                        Khi học sinh bấm <b>"📝 Đăng ký TK"</b> trên bất kỳ điện thoại hay máy tính nào, yêu cầu sẽ tự động đồng bộ về đây theo thời gian thực để Thầy bấm <b>"👑 Duyệt"</b>. Thầy cũng có thể thêm tài khoản trực tiếp bằng thanh <b>Thêm Nhanh</b> phía trên.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ` : filtered.map(u => {
                                        const isPending = u.status === 'pending';
                                        const isLocked = u.status === 'locked';
                                        const vp = u.vipPackages || { k12: false, k11: false, k10: false, luyende: false };
                                        const req = u.requestedPackages || {};
                                        const allVip = Boolean(vp.k12 && vp.k11 && vp.k10 && vp.luyende);
                                        const anyVip = Boolean(!isStudentVipExpired(u) && (vp.k12 || vp.k11 || vp.k10 || vp.luyende));
                                        const curPlan = u.vipPlan || 'none';
                                        const isRowChecked = Boolean(state.selectedAdminUserIds && state.selectedAdminUserIds[u.id]);
                                        return `
                                        <tr class="${isPending || u.vipRequestPending ? 'bg-amber-50/70' : (isRowChecked ? 'bg-red-50/40' : 'hover:bg-slate-50')}">
                                            <td class="p-2 text-center">
                                                <input type="checkbox" ${isRowChecked ? 'checked' : ''}
                                                    onchange="window.TRITHUC.toggleSelectSingleUser('${escapeJsAttr(u.id)}', this.checked)"
                                                    class="w-4 h-4 accent-red-600 cursor-pointer" title="Tích chọn để xóa nhanh" />
                                            </td>
                                            <td class="p-2.5">
                                                <div class="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                                    <span>${escapeHtml(u.name)}</span>
                                                    <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">${escapeHtml(u.class)}</span>
                                                    ${isPending || u.vipRequestPending ? `<span class="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">⏳ Chờ duyệt</span>` : ''}
                                                    ${anyVip ? `<span class="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">VIP</span>` : `<span class="px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 text-[9px] font-bold">Thường</span>`}
                                                </div>
                                                <div class="text-[11px] text-slate-500">
                                                    TK: <code class="font-bold text-blue-700">${escapeHtml(u.username)}</code> • MK: <code>${escapeHtml(u.password)}</code>
                                                </div>
                                                <div class="text-[11px] text-blue-800 font-semibold flex items-center gap-1.5 flex-wrap mt-0.5">
                                                    <span>📧 ${escapeHtml(u.gmail || 'Chưa gắn Gmail')}</span>
                                                    <button type="button" onclick="window.TRITHUC.openAdminManageDeviceModal('${u.id}')"
                                                        class="px-2 py-0.5 rounded-md ${(u.deviceShareViolations || 0) > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black' : 'bg-cyan-50 text-cyan-900 border border-cyan-200 font-extrabold'} text-[10px] hover:bg-cyan-100 transition"
                                                        title="Bấm để xem hoặc Reset thiết bị cho học sinh này">
                                                        🛡️ Thiết bị: ${(u.trustedDevices || []).length}/${u.maxDevices || 2} máy ${(u.deviceShareViolations || 0) > 0 ? `• ⚠️ ${u.deviceShareViolations} vi phạm` : ''}
                                                    </button>
                                                    ${u.deviceChangeRequest && u.deviceChangeRequest.pending ? `
                                                        <span onclick="window.TRITHUC.openAdminManageDeviceModal('${u.id}')" class="px-1.5 py-0.5 rounded bg-amber-500 text-white font-black text-[9.5px] cursor-pointer">🔔 Xin đổi máy</span>
                                                    ` : ''}
                                                </div>
                                                <div class="mt-1 flex items-center gap-1.5 flex-wrap">
                                                    ${formatVipExpiryBadge(u)}
                                                    ${(() => {
                                                        const uExamCnt = state.history.filter(h => (h.username && h.username.toLowerCase() === u.username.toLowerCase()) || h.name === u.name).length;
                                                        const uLogCnt = (state.activityLogs || []).filter(l => (l.username && l.username.toLowerCase() === u.username.toLowerCase()) || String(l.userId) === String(u.id)).length;
                                                        return `<span onclick="window.TRITHUC.openStudentHistoryModal('${u.id}')" class="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-extrabold cursor-pointer transition" title="Bấm để xem toàn bộ lịch sử làm bài & thao tác của học sinh này">📜 ${uExamCnt} đề thi • ${uLogCnt} thao tác</span>`;
                                                    })()}
                                                </div>
                                                ${u.vipRequestPending ? `
                                                    <div class="text-[10px] font-extrabold text-rose-600 mt-0.5">
                                                        🔔 Xin mở: ${[req.k12 ? 'K12' : '', req.k11 ? 'K11' : '', req.k10 ? 'K10' : '', req.luyende ? 'Luyện đề' : ''].filter(Boolean).join(', ')} (${escapeHtml(VIP_DURATION_PLANS[u.requestedPlan || '1y']?.shortLabel || '1 Năm')})
                                                    </div>
                                                ` : ''}
                                            </td>
                                            <td class="p-2 text-center bg-amber-50/40">
                                                <input type="checkbox" ${allVip ? 'checked' : ''}
                                                    onchange="window.TRITHUC.toggleStudentMasterVip('${u.id}', this.checked)"
                                                    class="w-4 h-4 accent-amber-600 cursor-pointer" title="Tích mở tất cả 4 gói (Khối 12, 11, 10, Luyện đề)" />
                                            </td>
                                            <td class="p-2 text-center bg-blue-50/30">
                                                <input type="checkbox" ${vp.k12 ? 'checked' : ''}
                                                    onchange="window.TRITHUC.toggleStudentVipPackage('${u.id}', 'k12', this.checked)"
                                                    class="w-4 h-4 accent-blue-600 cursor-pointer" title="Chỉ mở khóa VIP Khối 12" />
                                            </td>
                                            <td class="p-2 text-center bg-emerald-50/30">
                                                <input type="checkbox" ${vp.k11 ? 'checked' : ''}
                                                    onchange="window.TRITHUC.toggleStudentVipPackage('${u.id}', 'k11', this.checked)"
                                                    class="w-4 h-4 accent-emerald-600 cursor-pointer" title="Chỉ mở khóa VIP Khối 11" />
                                            </td>
                                            <td class="p-2 text-center bg-purple-50/30">
                                                <input type="checkbox" ${vp.k10 ? 'checked' : ''}
                                                    onchange="window.TRITHUC.toggleStudentVipPackage('${u.id}', 'k10', this.checked)"
                                                    class="w-4 h-4 accent-purple-600 cursor-pointer" title="Chỉ mở khóa VIP Khối 10" />
                                            </td>
                                            <td class="p-2 text-center bg-rose-50/30">
                                                <input type="checkbox" ${vp.luyende ? 'checked' : ''}
                                                    onchange="window.TRITHUC.toggleStudentVipPackage('${u.id}', 'luyende', this.checked)"
                                                    class="w-4 h-4 accent-rose-600 cursor-pointer" title="Chỉ mở khóa VIP Luyện đề" />
                                            </td>
                                            <td class="p-2.5 text-center bg-indigo-50/20">
                                                <select onchange="window.TRITHUC.setStudentVipDuration('${u.id}', this.value)"
                                                    class="px-2 py-1.5 rounded-xl border border-indigo-200 bg-white font-extrabold text-[11px] text-slate-800 outline-none focus:border-indigo-600">
                                                    <option value="none" ${curPlan === 'none' ? 'selected' : ''}>-- Chưa set hạn --</option>
                                                    <option value="3m" ${curPlan === '3m' ? 'selected' : ''}>⏳ 3 Tháng (90 ngày)</option>
                                                    <option value="6m" ${curPlan === '6m' ? 'selected' : ''}>⏳ 6 Tháng (180 ngày)</option>
                                                    <option value="1y" ${curPlan === '1y' ? 'selected' : ''}>⏳ 1 Năm (365 ngày)</option>
                                                    <option value="lifetime" ${curPlan === 'lifetime' ? 'selected' : ''}>♾️ Trọn Đời (Vĩnh viễn)</option>
                                                </select>
                                            </td>
                                            <td class="p-2.5 text-right space-x-1 whitespace-nowrap">
                                                ${isPending || u.vipRequestPending ? `
                                                    <button onclick="window.TRITHUC.approveStudentWithVip('${escapeJsAttr(u.id)}', true)"
                                                        class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px]">
                                                        👑 Duyệt
                                                    </button>
                                                ` : ''}
                                                <button onclick="window.TRITHUC.openStudentHistoryModal('${u.id}')"
                                                    class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[11px] shadow-2xs"
                                                    title="Xem chi tiết lịch sử làm bài, điểm số & nhật ký thao tác của học sinh này">
                                                    📜 Lịch sử
                                                </button>
                                                <button onclick="window.TRITHUC.openAdminManageDeviceModal('${u.id}')"
                                                    class="px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-extrabold text-[11px]"
                                                    title="Quản lý Gmail & Reset thiết bị được phép đăng nhập của học sinh">
                                                    🛡️ Thiết bị
                                                </button>
                                                <button onclick="window.TRITHUC.loginAsStudentForTesting('${u.id}')"
                                                    class="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                                                    title="Xem thử giao diện dưới góc nhìn của học sinh này">
                                                    👁️ Xem thử
                                                </button>
                                                <button onclick="window.TRITHUC.toggleLockStudentAccount('${u.id}')"
                                                    class="px-2 py-1 rounded-lg ${isLocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} font-bold text-[11px]">
                                                    ${isLocked ? 'Mở' : 'Khóa'}
                                                </button>
                                                <button onclick="window.TRITHUC.deleteStudentAccount('${escapeJsAttr(u.id)}')"
                                                    class="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] shadow-2xs transition"
                                                    title="Xóa nhanh tài khoản học sinh này (1 chạm)">
                                                    🗑️ Xóa nhanh
                                                </button>
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- KHỐI TRUNG TÂM LƯU LỊCH SỬ LÀM BÀI & THAO TÁC HỌC SINH (GẮN GOOGLE BIỂU MẪU - TRÁNH NẶNG WEB), 5 CƠ CHẾ CHỐNG NẶNG & BẢNG NHẬT KÝ HOẠT ĐỘNG -->
                ${showGFormPerfSec ? renderAdminAccountActivityAndOptimizationPanel() : ''}
            </div>`;
        }