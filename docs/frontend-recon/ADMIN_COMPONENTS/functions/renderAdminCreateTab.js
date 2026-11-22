function renderAdminCreateTab() {
            const cf = state.createForm;
            const lessons = getAllLessonsFlat(cf.grade || '12');
            // V4.8.0 (NEW-05): Chỉ lưu Gemini API key tạm trong sessionStorage (tự xóa khi đóng tab)
            const savedKey = (() => { try { localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY); return sessionStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || ''; } catch(e) { return ''; } })();

            return `
            <div class="v5-surface-card p-5 sm:p-6 space-y-5">
                <div class="border-b border-slate-200 pb-3.5">
                    <h2 class="text-base sm:text-lg font-extrabold text-slate-900 m-0 tracking-tight">➕ Tạo Hoặc Nạp Đề Kiểm Tra Mới Vào Bài Học / Kho Đề</h2>
                    <p class="text-xs text-slate-500 font-semibold m-0 mt-0.5">Hỗ trợ nạp mã nhúng từ <b>V9.7 PRO3</b>, tải file <b>PDF / Word (.docx) + AI Gemini OCR</b> hoặc dán văn bản câu hỏi LaTeX.</p>
                </div>

                <!-- TAB CHỌN MỤC ĐÍCH TẠO ĐỀ: GẮN BÀI HỌC / GẮN MÁC ĐỀ THI THỬ / KHO ĐỀ CHUNG -->
                <div class="space-y-2.5">
                    <label class="block text-xs font-black text-slate-700 uppercase">1. Chọn phân loại & Gắn mác đề thi:</label>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button type="button" onclick="window.TRITHUC.setCreateTargetType('lesson')"
                            class="p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 ${(cf.targetType || 'lesson') === 'lesson' && !cf.isMockExam ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}">
                            <span class="text-2xl">📚</span>
                            <div>
                                <div class="font-black text-xs uppercase">Đề Kiểm Tra Bài Học</div>
                                <div class="text-[11px] font-semibold opacity-80 mt-0.5">Gắn trực tiếp vào từng Bài / Chương</div>
                            </div>
                        </button>
                        <button type="button" onclick="window.TRITHUC.setCreateTargetType('mock')"
                            class="p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 ${cf.targetType === 'mock' || cf.isMockExam ? 'bg-rose-50 border-rose-600 text-rose-950 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}">
                            <span class="text-2xl">🔥</span>
                            <div>
                                <div class="font-black text-xs uppercase text-rose-700">Gắn Mác ĐỀ THI THỬ</div>
                                <div class="text-[11px] font-semibold opacity-85 mt-0.5">Hiển thị ngay ở tab <b>🔥 Đề thi thử</b> & Kho đề</div>
                            </div>
                        </button>
                        <button type="button" onclick="window.TRITHUC.setCreateTargetType('bank')"
                            class="p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 ${cf.targetType === 'bank' && !cf.isMockExam ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}">
                            <span class="text-2xl">📂</span>
                            <div>
                                <div class="font-black text-xs uppercase">Kho Đề Thi Chung</div>
                                <div class="text-[11px] font-semibold opacity-80 mt-0.5">Lưu vào Kho Đề các Trường & Sở GD&ĐT</div>
                            </div>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div class="sm:col-span-6">
                        <label class="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Tên đề kiểm tra / Đề thi thử (*)</label>
                        <input type="text" value="${escapeHtml(cf.title)}"
                            oninput="window.TRITHUC.setCreateField('title', this.value)"
                            placeholder="${cf.isMockExam ? 'VD: Đề Thi Thử Tốt Nghiệp THPT 2026 – Lần 3 (Chuẩn Cấu Trúc Mới)' : 'VD: Bài 3: Đường tiệm cận – Đề số 3 (Nâng cao)'}"
                            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs outline-none focus:border-blue-600" />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Mã đề</label>
                        <input type="text" value="${escapeHtml(cf.code)}"
                            oninput="window.TRITHUC.setCreateField('code', this.value)"
                            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono-code font-bold text-xs text-center" />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Thời gian (phút)</label>
                        <input type="number" value="${cf.duration}"
                            oninput="window.TRITHUC.setCreateField('duration', this.value)"
                            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-center" />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Số lỗi tối đa</label>
                        <input type="number" value="${cf.maxTabSwitches}"
                            oninput="window.TRITHUC.setCreateField('maxTabSwitches', this.value)"
                            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-center" />
                    </div>

                    <div class="sm:col-span-3">
                        <label class="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Khối lớp</label>
                        <select onchange="window.TRITHUC.setCreateGrade(this.value)"
                            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs">
                            <option value="12" ${cf.grade === '12' ? 'selected' : ''}>Toán 12</option>
                            <option value="11" ${cf.grade === '11' ? 'selected' : ''}>Toán 11</option>
                            <option value="10" ${cf.grade === '10' ? 'selected' : ''}>Toán 10</option>
                        </select>
                    </div>
                    <div class="sm:col-span-6">
                        <label class="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                            ${cf.isMockExam ? '🔥 Vị trí lưu Đề thi thử (Tách riêng khỏi bài học)' : 'Gắn vào Bài học (Hoặc chọn Kho đề chung)'}
                        </label>
                        ${cf.isMockExam ? `
                            <div class="w-full px-3 py-2 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-800 font-extrabold text-xs flex items-center gap-1.5">
                                <span>🔥</span>
                                <span>Lưu vào Tab Đề Thi Thử ${escapeHtml(cf.grade || '12')} (Không trùng lặp với đề trong bài học)</span>
                            </div>
                        ` : `
                            <select onchange="window.TRITHUC.setCreateField('lessonId', this.value)"
                                class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs">
                                <option value="" ${!cf.lessonId ? 'selected' : ''}>📂 Chỉ lưu ở Kho Đề Thi Chung (Không gắn bài cụ thể)</option>
                                ${lessons.filter(l => !l.id.includes('-tt-')).map(l => `
                                    <option value="${l.id}" ${cf.lessonId === l.id ? 'selected' : ''}>
                                        [${escapeHtml(l.code)}] ${escapeHtml(l.title)} (${escapeHtml(l.chapterTitle)})
                                    </option>
                                `).join('')}
                            </select>
                        `}
                    </div>
                    <div class="sm:col-span-3">
                        <label class="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Mức độ đề</label>
                        <select onchange="window.TRITHUC.setCreateField('level', this.value)"
                            class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs">
                            <option value="nhanbiet" ${cf.level === 'nhanbiet' || cf.level === 'coban' ? 'selected' : ''}>🟢 Đề số 1: Mức Nhận biết</option>
                            <option value="thonghieu" ${cf.level === 'thonghieu' ? 'selected' : ''}>🔵 Đề số 2: Mức Thông hiểu</option>
                            <option value="vandung" ${cf.level === 'vandung' || cf.level === 'nangcao' ? 'selected' : ''}>🔥 Đề số 3: Mức Vận dụng</option>
                        </select>
                    </div>

                    <!-- CẤU HÌNH CHUYÊN NGHIỆP CHUẨN V9.5 PRO: MẬT KHẨU ĐỀ CÔNG KHAI, ĐẢO CÂU HỎI & GIỚI HẠN LƯỢT THI (BỎ LIÊN KẾT GOOGLE FORM) -->
                    <div class="sm:col-span-12 pt-2.5 border-t border-slate-200/80 bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200 space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <span class="text-xs font-black text-indigo-950 uppercase flex items-center gap-1.5">
                                <span>⚙️</span>
                                <span>Thiết Lập Phòng Thi Chuyên Nghiệp Chuẩn V9.5 PRO (Lưu Trực Tiếp Hệ Thống • Đã Bỏ Liên Kết Google Form)</span>
                            </span>
                            <span class="px-2.5 py-0.5 rounded-full bg-indigo-700 text-white text-[10px] font-extrabold uppercase">V9.5 PRO Engine</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                                <label class="block text-[11px] font-extrabold text-rose-800 uppercase mb-1">🔑 Mật khẩu đề thi (Công khai / VIP)</label>
                                <div class="flex gap-1.5">
                                    <input id="createFormPasswordInpV45" type="text" value="${escapeHtml(cf.password || '')}"
                                        oninput="window.TRITHUC.setCreateField('password', this.value)"
                                        placeholder="Để trống = Không mật khẩu"
                                        class="flex-1 px-3 py-2 rounded-xl border border-rose-300 bg-white font-mono-code font-bold text-xs text-rose-800 outline-none focus:border-rose-600" />
                                    <button type="button" onclick="window.TRITHUC.generateRandomCreatePassword()"
                                        title="Tạo mật khẩu ngẫu nhiên"
                                        class="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs">🎲</button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">🔄 Giới hạn số lượt làm bài</label>
                                <select onchange="window.TRITHUC.setCreateField('maxAttempts', parseInt(this.value, 10) || 0)"
                                    class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs">
                                    <option value="0" ${!cf.maxAttempts ? 'selected' : ''}>♾️ Không giới hạn lượt thi</option>
                                    <option value="1" ${cf.maxAttempts === 1 ? 'selected' : ''}>1️⃣ Chỉ 1 lượt duy nhất</option>
                                    <option value="2" ${cf.maxAttempts === 2 ? 'selected' : ''}>2️⃣ Tối đa 2 lượt làm bài</option>
                                    <option value="3" ${cf.maxAttempts === 3 ? 'selected' : ''}>3️⃣ Tối đa 3 lượt làm bài</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">🔀 Chế độ đảo đề V9.5 PRO</label>
                                <select onchange="window.TRITHUC.setCreateShuffleMode(this.value)"
                                    class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs">
                                    <option value="none" ${!cf.shuffleQuestions && !cf.shuffleOptions ? 'selected' : ''}>Giữ nguyên thứ tự gốc</option>
                                    <option value="questions" ${cf.shuffleQuestions && !cf.shuffleOptions ? 'selected' : ''}>Đảo thứ tự câu hỏi</option>
                                    <option value="both" ${cf.shuffleQuestions && cf.shuffleOptions ? 'selected' : ''}>Đảo cả câu hỏi & đáp án A,B,C,D</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">👁️ Chế độ xem đáp án sau nộp</label>
                                <select onchange="window.TRITHUC.setCreateField('showAnswers', this.value === 'true')"
                                    class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs">
                                    <option value="true" ${cf.showAnswers !== false ? 'selected' : ''}>Hiện Điểm + Đáp án + Lời giải</option>
                                    <option value="false" ${cf.showAnswers === false ? 'selected' : ''}>Chỉ hiện Điểm (Ẩn đáp án & lời giải)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- TÙY CHỌN MỞ KHÓA TRỰC TIẾP KHI TẠO ĐỀ (ĐỀ CÔNG KHAI KHÔNG CẦN MUA VIP) -->
                    <div class="sm:col-span-12 pt-2.5 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-black text-emerald-950 uppercase flex items-center gap-1">
                                <span>🔓</span>
                                <span>Chế độ Mở Khóa Trực Tiếp Khi Tạo Đề:</span>
                            </span>
                            <div class="inline-flex bg-white p-1 rounded-xl border border-emerald-300 shadow-2xs flex-wrap">
                                <button type="button" onclick="window.TRITHUC.setCreatePublicUnlock(true)"
                                    class="px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${cf.isVipOnly === false ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
                                    <span>🔓</span>
                                    <span>Mở Khóa Trực Tiếp (Đề Công Khai • Không Cần Mua VIP)</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.setCreatePublicUnlock(false)"
                                    class="px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${cf.isVipOnly !== false ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}">
                                    <span>🔒</span>
                                    <span>Khóa VIP Theo Gói (Cần Mua VIP)</span>
                                </button>
                            </div>
                        </div>
                        <div class="text-xs font-extrabold ${cf.isVipOnly === false ? 'text-emerald-800' : 'text-amber-800'}">
                            ${cf.isVipOnly === false
                                ? '✓ Đề sẽ CÔNG KHAI 100%: Mọi học sinh vào thi trực tiếp ngay mà KHÔNG cần mua gói VIP!'
                                : '🔒 Đề này yêu cầu học sinh phải có tài khoản đã kích hoạt gói VIP tương ứng.'}
                        </div>
                    </div>

                    <!-- TÙY CHỌN GẮN HOẶC BỎ WATERMARK NGAY TRONG MỤC TẠO ĐỀ -->
                    <div class="sm:col-span-12 pt-2.5 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-black text-slate-700 uppercase">🌊 Tùy chọn Watermark trên đề này:</span>
                            <div class="inline-flex bg-white p-1 rounded-xl border border-slate-300">
                                <button type="button" onclick="window.TRITHUC.setCreateWatermark(true)"
                                    class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${cf.hasWatermark !== false ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}">
                                    ✔ Gắn Watermark V9.7pro
                                </button>
                                <button type="button" onclick="window.TRITHUC.setCreateWatermark(false)"
                                    class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${cf.hasWatermark === false ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}">
                                    🚫 Bỏ Watermark (Không gắn)
                                </button>
                            </div>
                        </div>
                        ${cf.hasWatermark !== false ? `
                            <div class="flex items-center gap-2 flex-1 max-w-md">
                                <input type="text" value="${escapeHtml(cf.watermarkText || '')}"
                                    oninput="window.TRITHUC.setCreateField('watermarkText', this.value)"
                                    placeholder="Chữ Watermark riêng cho đề này (Trống = Tên đề thi)..."
                                    class="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs outline-none focus:border-blue-600" />
                            </div>
                        ` : `
                            <span class="text-xs font-bold text-rose-600">✓ Đề thi này sẽ hiển thị nền trắng hoàn toàn (không gắn chữ chìm Watermark).</span>
                        `}
                    </div>
                </div>

                <!-- THANH CÔNG CỤ SINH NHANH ĐỀ KIỂM TRA GIỮA KỲ, CUỐI KỲ & ĐỀ THI THỬ CHO CẢ 3 KHỐI (12 • 11 • 10) -->
                <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-indigo-50 border-2 border-rose-200 space-y-3.5">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-rose-200/70 pb-3">
                        <div class="space-y-1">
                            <div class="text-xs sm:text-sm font-black text-rose-900 uppercase flex items-center gap-1.5 flex-wrap">
                                <span>🔥</span>
                                <span>Công Cụ Tạo Đề Nhanh Kiểm Tra Giữa Kỳ, Cuối Kỳ & Thi Thử Cho Cả 3 Khối (Toán 12 • 11 • 10)</span>
                            </div>
                            <p class="text-[11px] text-slate-600 font-semibold m-0">
                                Tự động bốc 22 câu hỏi chuẩn cấu trúc Bộ GD&ĐT (12 câu TN + 4 câu Đúng/Sai + 6 câu Trả lời ngắn) kèm hình vẽ và lời giải chi tiết cho cả 3 khối 10, 11, 12.
                            </p>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap shrink-0">
                            <button type="button" onclick="window.TRITHUC.setCreatePublicUnlock(!(state.createForm.isVipOnly === false))"
                                class="px-3.5 py-2 rounded-xl font-black text-xs uppercase shadow-sm transition flex items-center gap-1.5 ${cf.isVipOnly === false ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300' : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300'}">
                                <span>${cf.isVipOnly === false ? '🔓' : '🔒'}</span>
                                <span>${cf.isVipOnly === false ? 'Đã Bật Mở Khóa Trực Tiếp (Công Khai)' : 'Bấm Để Mở Khóa Trực Tiếp (Không Cần VIP)'}</span>
                            </button>
                            <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('current_lesson')"
                                class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase shadow-sm transition flex items-center gap-1.5">
                                <span>🎲</span>
                                <span>Sinh Đề 22 Câu Theo Bài Đang Chọn</span>
                            </button>
                        </div>
                    </div>

                    <!-- BỘ NÚT TẠO ĐỀ NHANH GIỮA KỲ 1, CUỐI KỲ 1, GIỮA KỲ 2, CUỐI KỲ 2 & THI THỬ CHO CẢ 3 KHỐI -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <!-- KHỐI 12 -->
                        <div class="bg-white/90 p-3.5 rounded-2xl border-2 border-blue-200 shadow-2xs space-y-2.5">
                            <div class="flex items-center justify-between gap-2 border-b border-blue-100 pb-1.5">
                                <span class="text-xs font-black text-blue-900 uppercase flex items-center gap-1.5">📘 Khối 12 (Toán 12)</span>
                                <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold">6 Chương • 22 Câu</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1.5">
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('gk1_12')"
                                    class="px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📙</span><span>Giữa Kỳ 1 K12</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk1_12')"
                                    class="px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📘</span><span>Cuối Kỳ 1 K12</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('gk2_12')"
                                    class="px-2.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📙</span><span>Giữa Kỳ 2 K12</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk2_12')"
                                    class="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📗</span><span>Cuối Kỳ 2 K12</span>
                                </button>
                            </div>
                            <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('mock12_full')"
                                class="w-full px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1.5">
                                <span>⚡</span><span>Đề Thi Thử Tốt Nghiệp 12 (Đủ 6 Chương)</span>
                            </button>
                        </div>

                        <!-- KHỐI 11 -->
                        <div class="bg-white/90 p-3.5 rounded-2xl border-2 border-emerald-200 shadow-2xs space-y-2.5">
                            <div class="flex items-center justify-between gap-2 border-b border-emerald-100 pb-1.5">
                                <span class="text-xs font-black text-emerald-900 uppercase flex items-center gap-1.5">📗 Khối 11 (Toán 11)</span>
                                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">9 Chương • 22 Câu</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1.5">
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('gk1_11')"
                                    class="px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📙</span><span>Giữa Kỳ 1 K11</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk1_11')"
                                    class="px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📘</span><span>Cuối Kỳ 1 K11</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('gk2_11')"
                                    class="px-2.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📙</span><span>Giữa Kỳ 2 K11</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk2_11')"
                                    class="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📗</span><span>Cuối Kỳ 2 K11</span>
                                </button>
                            </div>
                            <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('mock11_full')"
                                class="w-full px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1.5">
                                <span>⚡</span><span>Đề Khảo Sát Cả Năm Khối 11 (Đủ 9 Chương)</span>
                            </button>
                        </div>

                        <!-- KHỐI 10 -->
                        <div class="bg-white/90 p-3.5 rounded-2xl border-2 border-purple-200 shadow-2xs space-y-2.5">
                            <div class="flex items-center justify-between gap-2 border-b border-purple-100 pb-1.5">
                                <span class="text-xs font-black text-purple-900 uppercase flex items-center gap-1.5">📙 Khối 10 (Toán 10)</span>
                                <span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">9 Chương • 22 Câu</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1.5">
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('gk1_10')"
                                    class="px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📙</span><span>Giữa Kỳ 1 K10</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk1_10')"
                                    class="px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📘</span><span>Cuối Kỳ 1 K10</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('gk2_10')"
                                    class="px-2.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📙</span><span>Giữa Kỳ 2 K10</span>
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk2_10')"
                                    class="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1">
                                    <span>📗</span><span>Cuối Kỳ 2 K10</span>
                                </button>
                            </div>
                            <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('mock10_full')"
                                class="w-full px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-[11px] uppercase shadow-2xs transition flex items-center justify-center gap-1.5">
                                <span>⚡</span><span>Đề Khảo Sát Cả Năm Khối 10 (Đủ 9 Chương)</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2.5 border-b border-slate-200 pb-2.5">
                    ${[
                        { id: 'v97', label: '⚡ Cách 1: Dán Mã Nhúng / File HTML từ V9.6 PRO (Hỗ Trợ Nhiều Đề)' },
                        { id: 'pdf', label: '📄 Cách 2: Tải File PDF / Word (.docx) + AI Gemini OCR' }
                    ].map(t => `
                        <button type="button" onclick="window.TRITHUC.setCreateSourceTab('${t.id}')"
                            class="px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${(cf.sourceTab === t.id || (t.id === 'v97' && cf.sourceTab !== 'pdf')) ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                            ${t.label}
                        </button>
                    `).join('')}
                </div>

                ${cf.sourceTab === 'v97' ? `
                    <div class="space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2 bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-950">
                            <div>
                                <b>💡 Tương thích 100% V9.6 PRO (Đơn đề &amp; Nhiều đề):</b> Dán mã hoặc chọn file <code>.html / .json / .txt</code> (nhận diện tự động <b>File nhiều đề ALL_EXAMS / ENC_MULTI_PAYLOAD</b>, Slide, Mảng JSON, Văn bản 4 phần gồm <b>Phần IV Tự luận → Trả lời ngắn</b>).
                            </div>
                            <label class="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 font-extrabold cursor-pointer shrink-0">
                                📂 Chọn File .HTML / .JSON / .TXT
                                <input type="file" accept=".html,.htm,.json,.txt" class="hidden" onchange="window.TRITHUC.handleV97FileSelect(event)" />
                            </label>
                        </div>
                        ${cf.v97FileMeta ? `
                            <div class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[10px]">⚡ ĐÃ NẠP SIÊU MƯỢT</span>
                                    <span class="font-extrabold">${escapeHtml(cf.v97FileMeta.name)}</span>
                                    <span class="text-emerald-800">(${cf.v97FileMeta.sizeKB} KB • Giải mã ${cf.v97FileMeta.parseMs}ms • Chống giật lag DOM)</span>
                                </div>
                                <button type="button" onclick="window.TRITHUC.clearV97LoadedFile()"
                                    class="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-[11px]">
                                    ✕ Xóa file
                                </button>
                            </div>
                        ` : ''}
                        <textarea rows="${cf.v97FileMeta ? '2' : '6'}"
                            oninput="window.TRITHUC.onV97PasteInput(this.value)"
                            placeholder="Dán mã HTML nhiều đề (ALL_EXAMS / ENC_MULTI_PAYLOAD), mã nhúng V9.6 / V9.7, JSON hoặc văn bản đề 4 phần vào đây..."
                            class="w-full p-3.5 rounded-2xl border border-slate-300 font-mono-code text-xs outline-none focus:border-blue-600">${escapeHtml(cf.v97RawInput || '')}</textarea>
                        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-2.5">
                            <div id="examCloudSyncBadgeV468" class="font-bold leading-snug break-words">${escapeHtml(state.examCloudSyncStatus || '⚡ Sẵn sàng đồng bộ vĩnh viễn qua Vercel CDN / GitHub (V4.8.6)')}</div>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <button type="button" onclick="window.TRITHUC.syncCustomExamsNow()"
                                    class="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[11px] transition">
                                    ☁️ Đồng bộ ngay
                                </button>
                                <button type="button" onclick="window.TRITHUC.exportCustomExamsBackupGzV469()"
                                    class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition"
                                    title="Xuất file exams-cloud.json.gz để thả thẳng vào thư mục repo Vercel/GitHub (học sinh tải <0.1 giây, không bao giờ 429)">
                                    🚀 Xuất exams-cloud.json.gz
                                </button>
                                <label class="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-[11px] cursor-pointer transition"
                                    title="Khôi phục toàn bộ kho đề từ file exams-cloud.json.gz">
                                    📥 Khôi phục (.gz)
                                    <input type="file" accept=".gz,.json" class="hidden" onchange="window.TRITHUC.importCustomExamsBackupGzV469(event)" />
                                </label>
                                <button type="button" onclick="window.TRITHUC.toggleGitHubSyncConfigPanelV473()"
                                    class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-extrabold text-[11px] transition">
                                    ⚙️ GitHub / Vercel ${getGitHubSyncConfigV473().token ? '🟢' : ''}
                                </button>
                            </div>
                            ${state.showGitHubSyncPanelV473 ? (() => {
                                const gh = getGitHubSyncConfigV473();
                                return `
                                <div class="p-3 rounded-xl bg-white border border-indigo-200 space-y-2 text-[11px]">
                                    <div class="font-extrabold text-indigo-950">⚡ Kết nối đồng bộ vĩnh viễn thẳng lên GitHub → Vercel CDN (Miễn phí, 0 lỗi 429, học sinh mở <0.1 giây):</div>
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input id="ghSyncRepoInpV473" type="text" value="${escapeHtml(gh.repo || '')}" placeholder="owner/repo (VD: thaytrung/trithuc500)"
                                            class="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono-code text-[11px] outline-none focus:border-indigo-500" />
                                        <input id="ghSyncBranchInpV473" type="text" value="${escapeHtml(gh.branch || 'main')}" placeholder="Branch (main)"
                                            class="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono-code text-[11px] outline-none focus:border-indigo-500" />
                                        <input id="ghSyncTokenInpV473" type="password" value="${escapeHtml(gh.token || '')}" placeholder="GitHub Token (ghp_... / github_pat_...)"
                                            class="px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono-code text-[11px] outline-none focus:border-indigo-500" />
                                    </div>
                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                        <span class="text-[10.5px] text-slate-500">Token chỉ lưu trên máy Giáo viên (không gửi sang máy học sinh). Khi lưu đề sẽ tự đẩy <code>exams-cloud.json.gz</code> lên repo!</span>
                                        <button type="button" onclick="window.TRITHUC.saveGitHubSyncConfigV473()"
                                            class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px]">
                                            💾 Lưu & Đẩy lên Vercel ngay
                                        </button>
                                    </div>
                                </div>`;
                            })() : ''}
                        </div>
                    </div>
                ` : ''}

                ${cf.sourceTab === 'matrix_gen' ? `
                    <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 text-xs">
                        <div class="font-black text-indigo-950 uppercase">🎲 Bốc câu hỏi tự động từ Ngân hàng Ma trận Toán 12 (775 Câu hỏi + Hình vẽ minh họa):</div>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('mock12_full')"
                                class="p-3 rounded-xl bg-white hover:bg-rose-50 border-2 border-rose-300 text-left transition">
                                <div class="font-black text-rose-700 uppercase">🔥 Đề Thi Thử Tốt Nghiệp 12 (Tổng hợp 6 Chương)</div>
                                <div class="text-[11px] text-slate-600 mt-0.5">Phân bổ đều Chương I, II, III, IV, V, VI (12 TN + 4 Đ/S + 6 TLN)</div>
                            </button>
                            <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk1_12')"
                                class="p-3 rounded-xl bg-white hover:bg-blue-50 border-2 border-blue-300 text-left transition">
                                <div class="font-black text-blue-800 uppercase">📘 Đề Kiểm Tra Học Kỳ I Khối 12 (Chương I, II, III)</div>
                                <div class="text-[11px] text-slate-600 mt-0.5">Hàm số + Vectơ không gian + Thống kê ghép nhóm (22 câu)</div>
                            </button>
                            <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('hk2_12')"
                                class="p-3 rounded-xl bg-white hover:bg-emerald-50 border-2 border-emerald-300 text-left transition">
                                <div class="font-black text-emerald-800 uppercase">📗 Đề Kiểm Tra Học Kỳ II Khối 12 (Chương IV, V, VI)</div>
                                <div class="text-[11px] text-slate-600 mt-0.5">Nguyên hàm Tích phân + Oxyz + Xác suất có điều kiện (22 câu)</div>
                            </button>
                        </div>
                    </div>
                ` : ''}

                ${cf.sourceTab === 'pdf' ? `
                    <div class="space-y-4">
                        <div class="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-6 text-center">
                            <label class="cursor-pointer inline-flex flex-col items-center">
                                <span class="text-3xl mb-1">📄✨</span>
                                <span class="text-sm font-black text-blue-900">BẤM ĐỂ CHỌN FILE ĐỀ THI PDF (.PDF) HOẶC WORD (.DOCX)</span>
                                <span class="text-xs text-blue-700 font-semibold mt-1">Tự động đọc văn bản, cắt trang đề và trích xuất đáp án 3 phần</span>
                                <input type="file" accept=".pdf,.docx" class="hidden" onchange="window.TRITHUC.handlePdfOrDocxUpload(event)" />
                            </label>
                        </div>

                        <div class="bg-pink-50/70 border border-pink-200 rounded-2xl p-4 space-y-2">
                            <div class="text-xs font-black text-pink-900 uppercase">🤖 Tùy chọn: Dùng Gemini API Key để OCR toàn bộ công thức & tự giải chi tiết</div>
                            <div class="flex flex-wrap gap-2">
                                <input type="password" id="geminiApiKeyInp" value="${escapeHtml(savedKey)}"
                                    placeholder="Dán Gemini API Key (AIzaSy...) vào đây..."
                                    class="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-pink-300 bg-white text-xs font-bold outline-none" />
                                <button type="button" onclick="window.TRITHUC.runGeminiOcrOnUploadedPdf()"
                                    class="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black text-xs uppercase transition">
                                    ✨ Dùng AI Quét & Giải Đề Đang Mở
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}



                        ${Array.isArray(cf.detectedMultiExams) && cf.detectedMultiExams.length > 1 ? (() => {
                            const totalMultiQ = cf.detectedMultiExams.reduce((acc, ex) => acc + (ex.parsed?.questions?.length || 0), 0);
                            return `
                            <div class="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-3 shadow-xs">
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                    <div class="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5 flex-wrap">
                                        <span>📚 PHÁT HIỆN FILE NHIỀU ĐỀ (V9.6 PRO):</span>
                                        <span class="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black">${cf.detectedMultiExams.length} ĐỀ THI • ${totalMultiQ} CÂU</span>
                                    </div>
                                    <span class="text-[11px] font-bold text-emerald-800">Chọn 1 đề để xem/sửa bên dưới hoặc bấm 1 nút xuất toàn bộ vào Kho Đề</span>
                                </div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <select onchange="window.TRITHUC.selectDetectedMultiExamV96(this.value)"
                                        class="flex-1 min-w-[230px] px-3 py-2.5 rounded-xl border-2 border-emerald-400 bg-white text-emerald-950 font-extrabold text-xs outline-none">
                                        ${cf.detectedMultiExams.map((ex, i) => {
                                            const c = ex.parsed?.config || {};
                                            const subTag = `${c.p1 || 0} TN • ${c.p2 || 0} Đ/S • ${c.p3 || 0} TLN${(c.p4 || 0) > 0 ? ` • ${c.p4} TL→TLN` : ''}`;
                                            return `<option value="${i}" ${String(cf.selectedMultiExamIdx) === String(i) ? 'selected' : ''}>${escapeHtml(ex.rawTitle)} (${ex.parsed?.questions?.length || 0} câu: ${subTag})</option>`;
                                        }).join('')}
                                        <option value="ALL_MERGED" ${cf.selectedMultiExamIdx === 'ALL_MERGED' ? 'selected' : ''}>🔀 Gộp tất cả ${cf.detectedMultiExams.length} đề thành 1 đề tổng (${totalMultiQ} câu)</option>
                                    </select>
                                    <button type="button" onclick="window.TRITHUC.saveAllDetectedMultiExamsToBank(true)"
                                        class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase shadow-sm transition flex items-center gap-1.5">
                                        <span>🚀</span>
                                        <span>Xuất Cả ${cf.detectedMultiExams.length} Đề Vào Kho (Công Khai)</span>
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.saveAllDetectedMultiExamsToBank(false)"
                                        class="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase shadow-sm transition flex items-center gap-1.5">
                                        <span>🗂️</span>
                                        <span>Xuất Cả ${cf.detectedMultiExams.length} Đề (${cf.isVipOnly === false ? 'Công Khai' : 'Khóa VIP'})</span>
                                    </button>
                                </div>
                            </div>`;
                        })() : ''}

                ${(() => {
                    const hasQ = Array.isArray(cf.extractedQuestions) && cf.extractedQuestions.length > 0;
                    const n1 = hasQ ? Number(cf.p1Count || 0) : 0;
                    const n2 = hasQ ? Number(cf.p2Count || 0) : 0;
                    const n3 = hasQ ? Number(cf.p3Count || 0) : 0;
                    const n4 = hasQ ? Number(cf.p4Count || 0) : 0;
                    const showP4 = Boolean(n4 > 0 || (cf.fastP4 && cf.fastP4.trim()) || cf.showManualPart4Box);
                    const p4Raw = hasQ ? (cf.extractedQuestions || []).filter(q => q.part === 4).reduce((s, q) => s + (Number(q.points) > 0 ? Number(q.points) : 1.0), 0) : 0;
                    const rawMax = (n1 * 0.25) + (n2 * 1.0) + (n3 * 0.5) + p4Raw;
                    return `
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="text-xs font-black text-slate-700 uppercase">
                            ⚡ Chuỗi Đáp Án Chuẩn ${showP4 ? '4 Phần CV 7991' : '3 Phần'} (Tự động điền khi nạp file hoặc nhập tay):
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${hasQ
                                ? `<span class="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[11px] font-extrabold">📊 Đã nhận: ${cf.extractedQuestions.length} câu (P1:${n1} • P2:${n2} • P3:${n3}${n4 > 0 ? ` • P4:${n4}` : ''}) • Gốc ${rawMax.toFixed(2)}đ → Đủ 10,00đ</span>`
                                : ''}
                            ${!showP4 ? `
                                <button type="button" onclick="window.TRITHUC.toggleManualPart4BoxV96()"
                                    class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold transition">
                                    ➕ Thêm Phần IV (Tự luận → TLN)
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="grid grid-cols-1 ${showP4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-600 mb-1">Phần I (${hasQ ? `${n1} câu TN` : 'Chuỗi ABCD, VD: BCDCD...'})</label>
                            <input type="text" value="${escapeHtml(cf.fastP1)}"
                                oninput="window.TRITHUC.setCreateField('fastP1', this.value)"
                                placeholder="VD: BCDCD..."
                                class="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white font-mono-code font-black text-xs text-blue-700 uppercase tracking-widest" />
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-600 mb-1">Phần II (${hasQ ? `${n2} câu Đ/S` : 'Chuỗi Đ/S, VD: ĐSĐSĐĐSS...'})</label>
                            <input type="text" value="${escapeHtml(cf.fastP2)}"
                                oninput="window.TRITHUC.setCreateField('fastP2', this.value)"
                                placeholder="VD: ĐSĐSĐĐSS..."
                                class="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white font-mono-code font-black text-xs text-purple-700 uppercase tracking-widest" />
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-600 mb-1">Phần III (${hasQ ? `${n3} câu TLN, dấu |` : 'Cách nhau dấu |, VD: -3 | 5 | 2'})</label>
                            <input type="text" value="${escapeHtml(cf.fastP3)}"
                                oninput="window.TRITHUC.setCreateField('fastP3', this.value)"
                                placeholder="VD: -3 | 5 | 2"
                                class="w-full px-3 py-2 rounded-xl border border-orange-300 bg-white font-mono-code font-bold text-xs text-orange-700" />
                        </div>
                        ${showP4 ? `
                        <div>
                            <label class="block text-[11px] font-bold text-emerald-800 mb-1">Phần IV — Tự luận → TLN (${hasQ ? n4 : 'dấu |'} câu)</label>
                            <input type="text" value="${escapeHtml(cf.fastP4 || '')}"
                                oninput="window.TRITHUC.setCreateField('fastP4', this.value)"
                                placeholder="VD: 12 | 3/4 | -5"
                                class="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-white font-mono-code font-bold text-xs text-emerald-800" />
                        </div>
                        ` : ''}
                    </div>
                </div>`;
                })()}

                ${cf.statusMsg ? `
                    <div class="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs font-extrabold text-emerald-900 space-y-3">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>${cf.statusMsg}</div>
                            <div class="flex items-center gap-2 shrink-0 flex-wrap">
                                ${cf.lastPresetMode ? `
                                    <button type="button" onclick="window.TRITHUC.generateAutoExamFromMatrixBank('${cf.lastPresetMode}')"
                                        class="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[11px] transition">
                                        🔄 Đổi 22 câu ngẫu nhiên khác
                                    </button>
                                ` : ''}
                                <button type="button" onclick="window.TRITHUC.saveCreatedExam(true)"
                                    class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase shadow-xs transition">
                                    🔓 Lưu & Mở Khóa Công Khai Ngay
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200">
                    <div class="text-xs font-bold ${cf.isVipOnly === false ? 'text-emerald-700' : 'text-amber-700'}">
                        ${cf.isVipOnly === false
                            ? '🔓 Trạng thái khi lưu: Đề Công Khai (Học sinh làm trực tiếp không cần mua VIP)'
                            : '🔒 Trạng thái khi lưu: Đề Khóa VIP (Cần gói VIP mới làm được)'}
                    </div>
                    <div class="flex flex-wrap items-center gap-2.5">
                        <button type="button" onclick="window.TRITHUC.saveCreatedExam(true)"
                            class="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center gap-1.5">
                            <span>🔓</span>
                            <span>Lưu & Mở Khóa Trực Tiếp (Không Cần VIP)</span>
                        </button>
                        <button type="button" onclick="window.TRITHUC.saveCreatedExam()"
                            class="px-5 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition flex items-center gap-1.5">
                            <span>💾</span>
                            <span>Lưu Đề Thi (${cf.isVipOnly === false ? 'Công Khai' : 'Theo Chế Độ Đang Chọn'})</span>
                        </button>
                    </div>
                </div>
            </div>`;
        }