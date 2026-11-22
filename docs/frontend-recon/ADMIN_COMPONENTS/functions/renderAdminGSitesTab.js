function renderAdminGSitesTab() {
            const gf = state.googleFormConfig;
            const ai = state.antiAiConfig;

            return `
            <div class="space-y-5">
                <div class="v511-admin-hero v511-admin-hero-success flex-col items-start space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="v5-version-pill">Mục 5 • V5.1.1</span>
                        <h2 class="text-base sm:text-lg font-extrabold text-slate-900 m-0 tracking-tight">🌐 Xuất Bản Google Sites &amp; Khiên Bảo Mật Chống AI 5 Lớp</h2>
                    </div>
                    <p class="text-xs text-slate-600 m-0">
                        Đóng gói tự động toàn bộ Tài khoản Học sinh, kho đề thi đã mã hóa, Khiên Chống AI 5 Lớp và cấu hình bảo mật vào một tệp HTML duy nhất.
                    </p>
                </div>

                <!-- KHIÊN BẢO MẬT CHỐNG AI 5 LỚP V9.7PRO -->
                <div class="v5-surface-card p-5 sm:p-6 space-y-4">
                    <div class="flex items-center justify-between flex-wrap gap-2 border-b border-purple-100 pb-3">
                        <h3 class="text-sm sm:text-base font-black text-purple-900 uppercase m-0">🤖 Cấu Hình Khiên Chống Dùng AI Giải Bài (5 Lớp Bảo Vệ V9.7pro)</h3>
                        <span class="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold">Đang kích hoạt toàn hệ thống</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <label class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 cursor-pointer">
                            <input type="checkbox" ${ai.promptTrap ? 'checked' : ''} onchange="window.TRITHUC.toggleAntiAiField('promptTrap', this.checked)" class="w-4 h-4 mt-0.5" />
                            <div>
                                <div class="font-extrabold text-purple-900">🕸️ Lớp 1: Bẫy Prompt Ẩn (AI Poisoning / Honeypot)</div>
                                <div class="text-slate-600 mt-0.5">Chèn dữ liệu bẫy vô hình vào giữa đề bài. Mắt học sinh không thấy nhưng nếu dùng tiện ích quét hoặc copy vào ChatGPT/Gemini, AI sẽ giải sai hoàn toàn.</div>
                            </div>
                        </label>
                        <label class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 cursor-pointer">
                            <input type="checkbox" ${ai.extensionDetector ? 'checked' : ''} onchange="window.TRITHUC.toggleAntiAiField('extensionDetector', this.checked)" class="w-4 h-4 mt-0.5" />
                            <div>
                                <div class="font-extrabold text-purple-900">📡 Lớp 2: Radar Quét & Chặn Tiện Ích AI Trình Duyệt</div>
                                <div class="text-slate-600 mt-0.5">Tự động phát hiện và khóa màn hình khi học sinh bật Sidebar AI (Monica, Sider, Gauthmath, QuestionAI, Copilot, Google Dịch...).</div>
                            </div>
                        </label>
                        <label class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 cursor-pointer">
                            <input type="checkbox" ${ai.cameraOcrGrid ? 'checked' : ''} onchange="window.TRITHUC.toggleAntiAiField('cameraOcrGrid', this.checked)" class="w-4 h-4 mt-0.5" />
                            <div>
                                <div class="font-extrabold text-purple-900">📷 Lớp 3: Lưới Quang Học Chống Chụp Google Lens / Photomath</div>
                                <div class="text-slate-600 mt-0.5">Phủ lưới giao thoa quang học + Watermark định danh tên học sinh bay động ngang qua công thức Toán để làm nhiễu camera chụp OCR.</div>
                            </div>
                        </label>
                        <label class="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 cursor-pointer">
                            <input type="checkbox" ${ai.idleBlur ? 'checked' : ''} onchange="window.TRITHUC.toggleAntiAiField('idleBlur', this.checked)" class="w-4 h-4 mt-0.5" />
                            <div>
                                <div class="font-extrabold text-purple-900">👁️ Lớp 4: Tự Động Làm Mờ Đề Khi Ngưng Thao Tác >35 Giây</div>
                                <div class="text-slate-600 mt-0.5">Nếu học sinh ngưng di chuột/chạm màn hình quá 35 giây (nghi cầm điện thoại phụ gõ/chụp gửi AI), màn hình đề thi tự động làm mờ ngay.</div>
                            </div>
                        </label>
                    </div>
                    <div class="pt-2 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <label class="flex items-center gap-2 font-extrabold text-purple-900 cursor-pointer">
                            <input type="checkbox" ${ai.watermark !== false ? 'checked' : ''} onchange="window.TRITHUC.toggleAntiAiField('watermark', this.checked)" class="w-4 h-4" />
                            <span>🌊 Hiển thị Chế độ Watermark Chìm Mượt Chuẩn V9.7pro (24 lớp xoay -28° phủ toàn màn hình)</span>
                        </label>
                        <div class="flex items-center gap-2 flex-1 max-w-md">
                            <input type="text" value="${escapeHtml(ai.customWatermarkText || '')}"
                                oninput="window.TRITHUC.setCustomWatermarkText(this.value)"
                                placeholder="Chữ Watermark tùy chỉnh (Mặc định: Tên Đề Thi + Tên HS)..."
                                class="flex-1 px-3 py-1.5 rounded-xl border border-purple-300 bg-white font-bold text-xs outline-none" />
                        </div>
                    </div>
                </div>

                <!-- XUẤT MÃ GOOGLE SITES -->
                <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
                    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-100">
                        <div class="flex-1">
                            <label class="block text-xs font-black text-slate-600 uppercase mb-2">Chọn chế độ hiển thị khi học sinh mở trên Google Sites:</label>
                            <select onchange="window.TRITHUC.setEmbedTargetExam(this.value)"
                                class="w-full p-3 rounded-2xl border-2 border-emerald-500 bg-slate-50 font-extrabold text-xs sm:text-sm text-slate-900 outline-none">
                                <option value="" ${!state.embedTargetExamId ? 'selected' : ''}>
                                    🌟 Nhúng TOÀN BỘ WEBSITE TRITHUC5.0 (Học sinh đăng nhập TK & chọn đề)
                                </option>
                                ${state.exams.map(ex => `
                                    <option value="${ex.id}" ${String(state.embedTargetExamId) === String(ex.id) ? 'selected' : ''}>
                                        🎯 Mở thẳng đề: [${escapeHtml(ex.code || '')}] ${escapeHtml(ex.title)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="flex flex-wrap gap-2.5 shrink-0">
                            <button onclick="window.TRITHUC.copyStandaloneHtmlForGSites()"
                                class="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition">
                                📋 Copy Mã HTML Nhúng Google Sites (1-Click)
                            </button>
                            <button onclick="window.TRITHUC.downloadStandaloneHtmlFile()"
                                class="px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition">
                                💾 Tải File Website (.HTML)
                            </button>
                        </div>
                    </div>

                    <!-- Đổi tài khoản & mật khẩu Quản trị Giáo viên + Chế độ Ẩn/Hiện Tác Giả -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-b border-slate-100 pb-5">
                        <div class="space-y-2">
                            <h4 class="text-xs font-black text-slate-800 uppercase m-0">🔑 Đổi Tài Khoản &amp; Mật Khẩu Quản Trị Giáo Viên:</h4>
                            <div class="flex gap-2">
                                <input id="admNewUserInp" type="text" value="${escapeHtml(state.adminCreds.username)}" placeholder="Tài khoản GV mới" class="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold" />
                                <input id="admNewPassInp" type="password" value="${escapeHtml(state.adminCreds.password)}" placeholder="Mật khẩu GV mới" class="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold" />
                                <button onclick="window.TRITHUC.saveAdminCredentials()" class="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs">Lưu TK GV</button>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <h4 class="text-xs font-black text-slate-800 uppercase m-0">👤 Chế Độ Hiển Thị Thông Tin Tác Giả Trên Web:</h4>
                            <div class="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                                <div class="text-xs text-slate-700 font-semibold">
                                    Trạng thái hiện tại: <b class="${state.hideAuthorInfo ? 'text-rose-600' : 'text-emerald-700'}">${state.hideAuthorInfo ? '🙈 Đang ẩn tên tác giả' : '👁️ Đang hiển thị tên tác giả'}</b>
                                </div>
                                <button type="button" onclick="window.TRITHUC.toggleHideAuthorInfo()"
                                    class="px-4 py-2 rounded-xl font-black text-xs transition ${state.hideAuthorInfo ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}">
                                    ${state.hideAuthorInfo ? '👁️ Bật Hiện Tác Giả' : '🙈 Bấm Để Ẩn Tác Giả'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                ${renderVaultEncryptionCenterCardV44()}
            </div>`;
        }