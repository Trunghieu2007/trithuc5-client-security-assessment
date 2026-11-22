function renderAdminCv7991MatrixTabV457() {
            ensureCv7991InitializedV457();
            const cv = state.cv7991;
            const rows = cv.rows || [];
            const sum = computeCv7991SummaryV457(rows, cv.formatMode);
            const profile = getCv7991ProfileV457(cv.formatMode);
            const activeRows = rows.filter(r => r.enabled);
            const isFinalExam = (cv.examPreset === 'ck1' || cv.examPreset === 'ck2');
            const pctOk = Math.abs(sum.totalTargetPct - 100) < 0.1;

            const numCell = (rowId, field, val, bgCls) => `
                <td class="p-1 border-r border-slate-200 ${bgCls || ''}">
                    <input type="number" min="0" max="20" value="${val || 0}"
                        onchange="window.TRITHUC.setCv7991RowCellV457('${rowId}', '${field}', this.value)"
                        class="w-10 text-center font-black text-xs rounded-md py-1 border border-indigo-200 bg-white focus:border-blue-600 outline-none ${val > 0 ? 'text-blue-900' : 'text-slate-300'}" />
                </td>`;
            const lessonNumCell = (rowId, lessonId, field, val, bgCls) => `
                <td class="p-1 border-r border-slate-200/80 ${bgCls || ''}">
                    <input type="number" min="0" max="20" value="${val || 0}"
                        onchange="window.TRITHUC.setCv7991LessonCellV461('${escapeJsAttr(rowId)}', '${escapeJsAttr(lessonId)}', '${field}', this.value)"
                        class="w-9 text-center font-bold text-[11.5px] rounded-md py-0.5 border border-slate-200 bg-white focus:border-indigo-600 outline-none ${val > 0 ? 'text-indigo-800 border-indigo-300 bg-indigo-50/40' : 'text-slate-300'}" />
                </td>`;

            return `
            <div class="space-y-4">
                <!-- HEADER PHÁP LÝ CHUẨN BỘ GDĐT — V5.1.1 -->
                <div class="v511-admin-hero flex-col items-stretch space-y-3">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="space-y-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="v5-version-pill">CV 7991/BGDĐT-GDTrH • 17/12/2024</span>
                                <span class="v5-stat-chip">TT 22/2021 • CV 6569</span>
                            </div>
                            <h2 class="text-sm sm:text-base font-extrabold text-slate-900 m-0 tracking-tight">📐 Thiết Kế Ma Trận &amp; Bản Đặc Tả CV 7991 → Tự Động Sinh Đề</h2>
                            <p class="text-xs text-slate-500 m-0">
                                Phân bổ <b>% Chương</b> theo số tiết chuẩn <b>40% Biết – 30% Hiểu – 30% Vận dụng</b>, hoặc <b>Nhập ma trận Excel/Word</b> để tự động sinh đề &amp; xuất bộ nhiều mã đề.
                            </p>
                        </div>
                        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button type="button" onclick="window.TRITHUC.printOrDownloadCv7991DocV457(true)"
                                class="v5-nav-btn-secondary px-3 py-1.5 text-[11.5px]">
                                🖨️ In Ma Trận + Đặc Tả
                            </button>
                            <button type="button" onclick="window.TRITHUC.exportCv7991ExcelV457()"
                                class="v5-nav-btn-secondary px-3 py-1.5 text-[11.5px]">
                                📊 Xuất Excel (.xlsx)
                            </button>
                            <button type="button" onclick="window.TRITHUC.generateExamFromCv7991MatrixV457('pdf')"
                                class="v5-nav-btn-primary px-3.5 py-1.5 text-[11.5px]">
                                ⚡ Tự Sinh Đề Từ Ma Trận
                            </button>
                        </div>
                    </div>

                    <!-- THANH CHỌN KHỐI – KỲ THI – CẤU TRÚC ĐIỂM CV 7991 -->
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-white/10 p-3 rounded-2xl border border-white/15 text-xs">
                        <div class="md:col-span-3 space-y-1">
                            <label class="block text-[10px] font-black text-blue-200 uppercase">1. Chọn Khối Lớp</label>
                            <div class="grid grid-cols-3 gap-1">
                                ${['12', '11', '10'].map(g => `
                                    <button type="button" onclick="window.TRITHUC.setCv7991ConfigV457('grade', '${g}')"
                                        class="py-1.5 rounded-xl font-black text-xs transition ${cv.grade === g ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'bg-white/10 text-white hover:bg-white/20'}">
                                        Toán ${g}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="md:col-span-4 space-y-1">
                            <label class="block text-[10px] font-black text-blue-200 uppercase">2. Kỳ Thi Định Kì (Tự chia % Chương chuẩn)</label>
                            <select onchange="window.TRITHUC.setCv7991ConfigV457('examPreset', this.value)"
                                class="w-full px-3 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs outline-none">
                                <option value="gk1" ${cv.examPreset === 'gk1' ? 'selected' : ''}>📌 Giữa học kì I (Nửa đầu HK1 theo số tiết)</option>
                                <option value="ck1" ${cv.examPreset === 'ck1' ? 'selected' : ''}>🎯 Cuối học kì I (Trước GK ${cv.preMidPct}% + Sau GK ${100 - cv.preMidPct}%)</option>
                                <option value="gk2" ${cv.examPreset === 'gk2' ? 'selected' : ''}>📌 Giữa học kì II (Nửa đầu HK2 theo số tiết)</option>
                                <option value="ck2" ${cv.examPreset === 'ck2' ? 'selected' : ''}>🎯 Cuối học kì II (Trước GK ${cv.preMidPct}% + Sau GK ${100 - cv.preMidPct}%)</option>
                                <option value="tnthpt" ${cv.examPreset === 'tnthpt' ? 'selected' : ''}>🏆 Thi thử TN THPT 2026 (Cả năm 6 chương)</option>
                                <option value="custom" ${cv.examPreset === 'custom' ? 'selected' : ''}>✏️ Tự chọn chương tùy ý</option>
                            </select>
                        </div>
                        <div class="md:col-span-5 space-y-1">
                            <label class="block text-[10px] font-black text-blue-200 uppercase">3. Cấu Trúc Tỉ Lệ Điểm (Công văn 7991)</label>
                            <select onchange="window.TRITHUC.setCv7991ConfigV457('formatMode', this.value)"
                                class="w-full px-3 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs outline-none">
                                <option value="cv7991_standard" ${cv.formatMode === 'cv7991_standard' ? 'selected' : ''}>📋 Chuẩn Phụ lục CV 7991: 30% TN (3đ) + 20% Đ-S (2đ) + 20% TLN (2đ) + 30% TL (3đ)</option>
                                <option value="tnkq_100" ${cv.formatMode === 'tnkq_100' ? 'selected' : ''}>⚡ 100% TNKQ (Chuẩn TN THPT): 30% TN (3đ) + 40% Đ-S (4đ) + 30% TLN (3đ) + 0% TL</option>
                                <option value="cv7991_no_sa" ${cv.formatMode === 'cv7991_no_sa' ? 'selected' : ''}>📑 CV 7991 (Ghi chú 3): 30% TN (3đ) + 40% Đ-S (4đ) + 0% TLN + 30% TL (3đ)</option>
                            </select>
                        </div>
                    </div>

                    <!-- CHẾ ĐỘ CON & KIỂM TOÁN 40-30-30 -->
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${[
                                { id: 'matrix', label: '📊 1. Set % Chương & Ma Trận (Phụ lục 1)' },
                                { id: 'spec', label: '📑 2. Bản Đặc Tả & Năng Lực (Phụ lục 2)' },
                                { id: 'import', label: '📥 3. Nhập Ma Trận Có Sẵn (Excel / Word / Dán bảng)' }
                            ].map(st => `
                                <button type="button" onclick="window.TRITHUC.setCv7991SubTabV457('${st.id}')"
                                    class="px-3 py-1.5 rounded-xl text-xs font-black transition ${cv.activeSubTab === st.id ? 'bg-white text-indigo-950 shadow-sm' : 'bg-white/10 text-blue-100 hover:bg-white/20'}">
                                    ${st.label}
                                </button>
                            `).join('')}
                        </div>
                        <div class="flex items-center gap-2 text-[11px] font-black flex-wrap">
                            <span class="px-2.5 py-1 rounded-xl ${sum.isCompliant ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50' : 'bg-rose-500/30 text-rose-100 border border-rose-300/50'}">
                                ${sum.isCompliant ? '✅ ĐẠT CHUẨN CV 7991 (10,0đ • 40–30–30)' : `⚠️ ${sum.issues.length} lưu ý cần cân lại`}
                            </span>
                            <span class="px-2.5 py-1 rounded-xl bg-white/10">Biết ${sum.pctB}% • Hiểu ${sum.pctH}% • VD ${sum.pctV}%</span>
                        </div>
                    </div>
                </div>

                ${!sum.isCompliant ? `
                    <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                        <div class="space-y-0.5 font-bold">
                            ${sum.issues.map(ms => `<div>⚠️ ${escapeHtml(ms)}</div>`).join('')}
                        </div>
                        <button type="button" onclick="window.TRITHUC.autoRebalanceCv7991MatrixV457()"
                            class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shrink-0 transition">
                            🎯 Tự cân chuẩn 10,0đ (40–30–30)
                        </button>
                    </div>
                ` : ''}

                ${cv.activeSubTab === 'matrix' ? `
                    <!-- PHẦN A: TƯ DUY SET % CHƯƠNG THEO KỲ THI & PHÂN PHỐI SỐ TIẾT -->
                    <div class="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="text-sm font-black text-slate-900 uppercase m-0">⚖️ Bước 1: Thiết Lập Tỉ Trọng % Điểm Từng Chương (${escapeHtml(getCv7991PresetTitleV457(cv.examPreset, cv.grade))})</h3>
                                <p class="text-[11px] font-semibold text-slate-500 m-0 mt-0.5">
                                    ${isFinalExam
                                        ? `Đề Cuối kì chuẩn CV 7991 &amp; CV 6569: Kiến thức <b>Trước Giữa kì (${cv.preMidPct}%)</b> + Kiến thức <b>Sau Giữa kì (${100 - cv.preMidPct}%)</b>, chia tỉ lệ thuận theo số tiết từng chương.`
                                        : `Đề Giữa kì / Chuyên đề: Tỉ lệ % điểm mỗi chương chia theo số tiết phân phối chương trình CT GDPT 2018 (tổng 100% = 10,0 điểm).`}
                                </p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                ${isFinalExam ? `
                                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-extrabold text-indigo-950">
                                        <span>Trước GK: <b>${cv.preMidPct}%</b></span>
                                        <input type="range" min="20" max="40" step="5" value="${cv.preMidPct}"
                                            oninput="window.TRITHUC.setCv7991PreMidPctV457(this.value)"
                                            class="w-20 accent-indigo-600 cursor-pointer" />
                                        <span>Sau GK: <b>${100 - cv.preMidPct}%</b></span>
                                    </div>
                                ` : ''}
                                <span class="px-2.5 py-1 rounded-xl text-xs font-black ${pctOk ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                                    Tổng % set: ${sum.totalTargetPct}%
                                </span>
                                <button type="button" onclick="window.TRITHUC.autoDistributeCv7991PctV457()"
                                    class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold text-xs transition">
                                    ⚖️ Chia % theo số tiết
                                </button>
                                <button type="button" onclick="window.TRITHUC.autoRebalanceCv7991MatrixV457()"
                                    class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-2xs transition">
                                    🎯 Tự phân bổ Ma trận 40–30–30
                                </button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            ${rows.map((r, rIdx) => {
                                const rs = sum.rowStats[rIdx] || { rPts: 0 };
                                const actualPct = sum.totalPts > 0 ? ((rs.rPts / sum.totalPts) * 100).toFixed(1) : '0.0';
                                const phaseTag = r.phase === 'pre_mid'
                                    ? '<span class="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[9.5px] font-black">Trước GK</span>'
                                    : '<span class="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9.5px] font-black">Sau GK</span>';
                                return `
                                <div class="p-3 rounded-2xl border-2 transition ${r.enabled ? 'border-blue-300 bg-blue-50/35' : 'border-slate-200 bg-slate-50/70 opacity-65'} space-y-2">
                                    <div class="flex items-start justify-between gap-2">
                                        <label class="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
                                            <input type="checkbox" ${r.enabled ? 'checked' : ''}
                                                onchange="window.TRITHUC.toggleCv7991RowEnabledV457('${r.id}', this.checked)"
                                                class="w-4 h-4 mt-0.5 accent-blue-600 rounded cursor-pointer shrink-0" />
                                            <div class="min-w-0">
                                                <div class="text-xs font-black text-slate-900 leading-snug">${escapeHtml(r.chapterTitle)}</div>
                                                <div class="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] font-bold text-slate-500">
                                                    <span class="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">${r.semester.toUpperCase()}</span>
                                                    ${phaseTag}
                                                    <span>⏱ ${r.periods} tiết</span>
                                                    <span>• Kho: ${r.bankCounts.tn} TN / ${r.bankCounts.ds} ĐS / ${r.bankCounts.sa} TLN</span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                    ${r.enabled ? `
                                        <div class="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/60 text-xs">
                                            <div class="flex items-center gap-1.5">
                                                <span class="text-[11px] font-bold text-slate-600">% mục tiêu:</span>
                                                <input type="number" min="0" max="100" step="5" value="${r.targetPct}"
                                                    onchange="window.TRITHUC.setCv7991RowPctV457('${r.id}', this.value)"
                                                    class="w-14 px-1.5 py-0.5 rounded-lg border border-blue-300 bg-white font-black text-center text-blue-900 outline-none" />
                                                <span class="font-black text-blue-800">%</span>
                                            </div>
                                            <div class="text-[11px] font-extrabold text-emerald-800">
                                                Thực tế: <b>${rs.rPts.toFixed(2).replace('.', ',')}đ (${actualPct}%)</b>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- PHẦN B: BẢNG MA TRẬN CHUẨN PHỤ LỤC 1 CV 7991 (CHỈNH TRỰC TIẾP TỪNG Ô) -->
                    <div class="bg-white rounded-3xl border-2 border-indigo-200 shadow-xs overflow-hidden">
                        <div class="px-4 py-3 bg-indigo-50/80 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="text-sm font-black text-indigo-950 uppercase m-0">📋 Bước 2: Bảng Ma Trận Đề Kiểm Tra Định Kì (Phụ Lục 1 – CV 7991/BGDĐT-GDTrH)</h3>
                                <p class="text-[11px] font-semibold text-indigo-800/80 m-0 mt-0.5">
                                    Sửa trực tiếp số câu ở từng ô. Riêng cột <b>Đúng – Sai</b> nhập <b>số ý (0,25đ/ý; cứ 4 ý = 1 câu hoàn chỉnh)</b> để chia linh hoạt Biết / Hiểu / Vận dụng chuẩn Công văn 7991.
                                </p>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button type="button" onclick="window.TRITHUC.toggleAllCv7991LessonsV461(true)"
                                    class="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-extrabold text-indigo-800 transition">
                                    📂 Hiện rõ tất cả bài
                                </button>
                                <button type="button" onclick="window.TRITHUC.toggleAllCv7991LessonsV461(false)"
                                    class="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-extrabold text-slate-600 transition">
                                    📁 Thu gọn theo chương
                                </button>
                                <span class="px-3 py-1 rounded-full bg-white border border-indigo-200 text-xs font-black text-indigo-900">
                                    ${activeRows.length} chương • ${sum.totTN} TN + ${(sum.totDS / 4).toFixed(1).replace('.0', '')} Đ-S (${sum.totDS} ý) + ${sum.totSA} TLN + ${sum.totTL} TL = ${sum.totalPts.toFixed(1).replace('.', ',')}đ
                                </span>
                            </div>
                        </div>
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-center border-collapse text-xs min-w-[1020px]">
                                <thead>
                                    <tr class="bg-slate-100 border-b border-slate-300 text-slate-800 font-black">
                                        <th rowspan="3" class="p-2 border-r border-slate-300 w-9">TT</th>
                                        <th rowspan="3" class="p-2 border-r border-slate-300 text-left w-56">Chủ đề / Chương</th>
                                        <th colspan="9" class="py-1.5 border-r border-slate-300 bg-blue-50 text-blue-950">TNKQ (${(sum.ptsTN + sum.ptsDS + sum.ptsSA).toFixed(1).replace('.', ',')}đ • ${(sum.pctTN + sum.pctDS + sum.pctSA).toFixed(0)}%)</th>
                                        <th colspan="3" class="py-1.5 border-r border-slate-300 bg-amber-50 text-amber-950">Tự luận (${sum.ptsTL.toFixed(1).replace('.', ',')}đ • ${sum.pctTL.toFixed(0)}%)</th>
                                        <th colspan="3" class="py-1.5 border-r border-slate-300 bg-emerald-50 text-emerald-950">Tổng câu/ý</th>
                                        <th rowspan="3" class="p-2 bg-slate-100 w-20">Tỉ lệ % điểm</th>
                                    </tr>
                                    <tr class="bg-slate-50 border-b border-slate-300 text-[11px] font-extrabold text-slate-700">
                                        <th colspan="3" class="py-1 border-r border-slate-300 bg-sky-50">Nhiều lựa chọn (0,25đ)</th>
                                        <th colspan="3" class="py-1 border-r border-slate-300 bg-purple-50">Đúng – Sai (ý • 0,25đ)</th>
                                        <th colspan="3" class="py-1 border-r border-slate-300 bg-teal-50">Trả lời ngắn (0,5đ)</th>
                                        <th colspan="3" class="py-1 border-r border-slate-300 bg-amber-50/70">Tự luận (1,0đ)</th>
                                        <th rowspan="2" class="px-1.5 border-r border-slate-200 bg-emerald-50/60">Biết</th>
                                        <th rowspan="2" class="px-1.5 border-r border-slate-200 bg-emerald-50/60">Hiểu</th>
                                        <th rowspan="2" class="px-1.5 border-r border-slate-300 bg-emerald-50/60">VD</th>
                                    </tr>
                                    <tr class="bg-slate-50 border-b-2 border-slate-300 text-[10.5px] font-bold text-slate-600">
                                        <th class="py-1 border-r border-slate-200">Biết</th><th class="py-1 border-r border-slate-200">Hiểu</th><th class="py-1 border-r border-slate-300">VD</th>
                                        <th class="py-1 border-r border-slate-200">Biết</th><th class="py-1 border-r border-slate-200">Hiểu</th><th class="py-1 border-r border-slate-300">VD</th>
                                        <th class="py-1 border-r border-slate-200">Biết</th><th class="py-1 border-r border-slate-200">Hiểu</th><th class="py-1 border-r border-slate-300">VD</th>
                                        <th class="py-1 border-r border-slate-200">Biết</th><th class="py-1 border-r border-slate-200">Hiểu</th><th class="py-1 border-r border-slate-300">VD</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-200">
                                    ${activeRows.length === 0 ? `
                                        <tr><td colspan="18" class="py-10 text-slate-400 font-bold">Hãy tích chọn ít nhất 1 chương ở Bước 1 phía trên.</td></tr>
                                    ` : activeRows.map((r, idx) => {
                                        const rIdx = rows.indexOf(r);
                                        const rs = sum.rowStats[rIdx] || { rB: 0, rH: 0, rV: 0, rPts: 0 };
                                        const rPct = sum.totalPts > 0 ? ((rs.rPts / sum.totalPts) * 100).toFixed(1) : '0.0';
                                        const lesList = Array.isArray(r.lessons) ? r.lessons : [];
                                        const showLes = r.expandedLessons !== false && lesList.length > 0;
                                        return `
                                        <tr class="bg-indigo-50/55 hover:bg-indigo-50/80 border-t-2 border-indigo-200/80">
                                            <td class="p-2 border-r border-slate-200 font-black text-indigo-900">${idx + 1}</td>
                                            <td class="p-2 border-r border-slate-200 text-left">
                                                <div class="flex items-start justify-between gap-1.5">
                                                    <div class="font-black text-slate-900 leading-snug">${escapeHtml(r.chapterTitle)}</div>
                                                    ${lesList.length > 0 ? `
                                                        <button type="button" onclick="window.TRITHUC.toggleCv7991ChapterLessonsV461('${escapeJsAttr(r.id)}')"
                                                            class="shrink-0 px-1.5 py-0.5 rounded-md bg-white hover:bg-indigo-100 border border-indigo-200 text-[10px] font-black text-indigo-800 transition">
                                                            ${showLes ? `▾ Ẩn ${lesList.length} bài` : `▸ Hiện ${lesList.length} bài`}
                                                        </button>
                                                    ` : ''}
                                                </div>
                                                <div class="text-[10px] text-indigo-700/80 font-bold mt-0.5">Kho E chương: ${r.bankCounts?.tn || 0} TN • ${r.bankCounts?.ds || 0} Đ-S • ${r.bankCounts?.sa || 0} TLN</div>
                                            </td>
                                            ${numCell(r.id, 'tnB', r.tnB, 'bg-sky-50/45')}
                                            ${numCell(r.id, 'tnH', r.tnH, 'bg-sky-50/45')}
                                            ${numCell(r.id, 'tnV', r.tnV, 'bg-sky-50/45 border-r-slate-300')}
                                            ${numCell(r.id, 'dsB', r.dsB, 'bg-purple-50/45')}
                                            ${numCell(r.id, 'dsH', r.dsH, 'bg-purple-50/45')}
                                            ${numCell(r.id, 'dsV', r.dsV, 'bg-purple-50/45 border-r-slate-300')}
                                            ${numCell(r.id, 'saB', r.saB, 'bg-teal-50/45')}
                                            ${numCell(r.id, 'saH', r.saH, 'bg-teal-50/45')}
                                            ${numCell(r.id, 'saV', r.saV, 'bg-teal-50/45 border-r-slate-300')}
                                            ${numCell(r.id, 'tlB', r.tlB, 'bg-amber-50/45')}
                                            ${numCell(r.id, 'tlH', r.tlH, 'bg-amber-50/45')}
                                            ${numCell(r.id, 'tlV', r.tlV, 'bg-amber-50/45 border-r-slate-300')}
                                            <td class="p-1.5 border-r border-slate-200 font-black text-sky-900 bg-emerald-50/40">${rs.rB}</td>
                                            <td class="p-1.5 border-r border-slate-200 font-black text-amber-900 bg-emerald-50/40">${rs.rH}</td>
                                            <td class="p-1.5 border-r border-slate-300 font-black text-rose-900 bg-emerald-50/40">${rs.rV}</td>
                                            <td class="p-1.5 font-black text-indigo-900">${rPct}%<div class="text-[10px] font-bold text-slate-600">(${rs.rPts.toFixed(2).replace('.', ',')}đ)</div></td>
                                        </tr>
                                        ${showLes ? lesList.map((lesRow, li) => {
                                            const lB = (lesRow.tnB || 0) + (lesRow.dsB || 0) + (lesRow.saB || 0) + (lesRow.tlB || 0);
                                            const lH = (lesRow.tnH || 0) + (lesRow.dsH || 0) + (lesRow.saH || 0) + (lesRow.tlH || 0);
                                            const lV = (lesRow.tnV || 0) + (lesRow.dsV || 0) + (lesRow.saV || 0) + (lesRow.tlV || 0);
                                            const lPts = ((lesRow.tnB || 0) + (lesRow.tnH || 0) + (lesRow.tnV || 0)) * profile.pt.tn
                                                + ((lesRow.dsB || 0) + (lesRow.dsH || 0) + (lesRow.dsV || 0)) * profile.pt.ds
                                                + ((lesRow.saB || 0) + (lesRow.saH || 0) + (lesRow.saV || 0)) * profile.pt.sa
                                                + ((lesRow.tlB || 0) + (lesRow.tlH || 0) + (lesRow.tlV || 0)) * profile.pt.tl;
                                            const lTot = lB + lH + lV;
                                            return `
                                            <tr class="${lTot > 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/35">
                                                <td class="p-1.5 border-r border-slate-200 text-[10.5px] font-bold text-slate-400">${idx + 1}.${li + 1}</td>
                                                <td class="py-1.5 pl-4 pr-2 border-r border-slate-200 text-left">
                                                    <div class="text-[11.5px] ${lTot > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'} leading-snug">
                                                        <span class="text-indigo-700 font-black">${escapeHtml(lesRow.code)}:</span> ${escapeHtml(lesRow.title)}
                                                    </div>
                                                    <div class="text-[9.5px] text-slate-400 font-semibold mt-0.5">
                                                        Kho E: <span class="text-sky-700 font-bold">${lesRow.bankCounts?.tn || 0} TN</span> • <span class="text-purple-700 font-bold">${lesRow.bankCounts?.ds || 0} Đ-S</span> • <span class="text-teal-700 font-bold">${lesRow.bankCounts?.sa || 0} TLN</span>
                                                    </div>
                                                </td>
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'tnB', lesRow.tnB, 'bg-sky-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'tnH', lesRow.tnH, 'bg-sky-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'tnV', lesRow.tnV, 'bg-sky-50/15 border-r-slate-300')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'dsB', lesRow.dsB, 'bg-purple-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'dsH', lesRow.dsH, 'bg-purple-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'dsV', lesRow.dsV, 'bg-purple-50/15 border-r-slate-300')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'saB', lesRow.saB, 'bg-teal-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'saH', lesRow.saH, 'bg-teal-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'saV', lesRow.saV, 'bg-teal-50/15 border-r-slate-300')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'tlB', lesRow.tlB, 'bg-amber-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'tlH', lesRow.tlH, 'bg-amber-50/15')}
                                                ${lessonNumCell(r.id, lesRow.lessonId, 'tlV', lesRow.tlV, 'bg-amber-50/15 border-r-slate-300')}
                                                <td class="p-1 border-r border-slate-200 text-[11px] font-bold ${lB > 0 ? 'text-sky-800' : 'text-slate-300'}">${lB}</td>
                                                <td class="p-1 border-r border-slate-200 text-[11px] font-bold ${lH > 0 ? 'text-amber-800' : 'text-slate-300'}">${lH}</td>
                                                <td class="p-1 border-r border-slate-300 text-[11px] font-bold ${lV > 0 ? 'text-rose-800' : 'text-slate-300'}">${lV}</td>
                                                <td class="p-1 text-[10.5px] font-bold ${lPts > 0 ? 'text-slate-700' : 'text-slate-300'}">${lPts.toFixed(2).replace('.', ',')}đ</td>
                                            </tr>`;
                                        }).join('') : ''}`;
                                    }).join('')}
                                </tbody>
                                <tfoot class="border-t-2 border-slate-300 font-black text-xs">
                                    <tr class="bg-slate-50">
                                        <td colspan="2" class="p-2 border-r border-slate-300 text-right uppercase">Tổng số câu / ý</td>
                                        <td class="p-1.5 border-r border-slate-200">${sum.tnB}</td><td class="p-1.5 border-r border-slate-200">${sum.tnH}</td><td class="p-1.5 border-r border-slate-300">${sum.tnV}</td>
                                        <td class="p-1.5 border-r border-slate-200">${sum.dsB}</td><td class="p-1.5 border-r border-slate-200">${sum.dsH}</td><td class="p-1.5 border-r border-slate-300">${sum.dsV}</td>
                                        <td class="p-1.5 border-r border-slate-200">${sum.saB}</td><td class="p-1.5 border-r border-slate-200">${sum.saH}</td><td class="p-1.5 border-r border-slate-300">${sum.saV}</td>
                                        <td class="p-1.5 border-r border-slate-200">${sum.tlB}</td><td class="p-1.5 border-r border-slate-200">${sum.tlH}</td><td class="p-1.5 border-r border-slate-300">${sum.tlV}</td>
                                        <td class="p-1.5 border-r border-slate-200 text-sky-800">${sum.totB}</td>
                                        <td class="p-1.5 border-r border-slate-200 text-amber-800">${sum.totH}</td>
                                        <td class="p-1.5 border-r border-slate-300 text-rose-800">${sum.totV}</td>
                                        <td class="p-1.5">${sum.totTN + Math.round(sum.totDS / 4) + sum.totSA + sum.totTL} câu</td>
                                    </tr>
                                    <tr class="bg-white">
                                        <td colspan="2" class="p-2 border-r border-slate-300 text-right uppercase">Tổng số điểm</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300 text-sky-900">${sum.ptsTN.toFixed(2).replace('.', ',')}đ (${sum.totTN} câu)</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300 text-purple-900">${sum.ptsDS.toFixed(2).replace('.', ',')}đ (${(sum.totDS / 4).toFixed(1).replace('.0', '')} câu)</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300 text-teal-900">${sum.ptsSA.toFixed(2).replace('.', ',')}đ (${sum.totSA} câu)</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300 text-amber-900">${sum.ptsTL.toFixed(2).replace('.', ',')}đ (${sum.totTL} câu)</td>
                                        <td class="p-1.5 border-r border-slate-200 text-sky-900">${sum.ptsB.toFixed(1).replace('.', ',')}</td>
                                        <td class="p-1.5 border-r border-slate-200 text-amber-900">${sum.ptsH.toFixed(1).replace('.', ',')}</td>
                                        <td class="p-1.5 border-r border-slate-300 text-rose-900">${sum.ptsV.toFixed(1).replace('.', ',')}</td>
                                        <td class="p-1.5 ${Math.abs(sum.totalPts - 10) < 0.05 ? 'text-emerald-700' : 'text-rose-700'} text-sm">${sum.totalPts.toFixed(1).replace('.', ',')}đ</td>
                                    </tr>
                                    <tr class="bg-indigo-50/70">
                                        <td colspan="2" class="p-2 border-r border-slate-300 text-right uppercase">Tỉ lệ % (CV 7991)</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300">${sum.pctTN}%</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300">${sum.pctDS}%</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300">${sum.pctSA}%</td>
                                        <td colspan="3" class="p-1.5 border-r border-slate-300">${sum.pctTL}%</td>
                                        <td class="p-1.5 border-r border-slate-200">${sum.pctB}%</td>
                                        <td class="p-1.5 border-r border-slate-200">${sum.pctH}%</td>
                                        <td class="p-1.5 border-r border-slate-300">${sum.pctV}%</td>
                                        <td class="p-1.5 text-indigo-900">100%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- PHẦN C: HÀNH ĐỘNG SINH ĐỀ TỰ ĐỘNG TỪ MA TRẬN CV 7991 -->
                    <div class="bg-gradient-to-r from-emerald-50 via-white to-blue-50 rounded-3xl border-2 border-emerald-300 p-4 space-y-3 shadow-xs">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <div class="space-y-1">
                                <h3 class="text-sm font-black text-emerald-950 uppercase m-0">🚀 Bước 3: Tự Động Sinh Đề Thi Từ Ma Trận CV 7991 Này</h3>
                                <div class="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
                                    <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" ${cv.allowCrossChapterDs ? 'checked' : ''}
                                            onchange="window.TRITHUC.setCv7991ConfigV457('allowCrossChapterDs', this.checked)"
                                            class="w-4 h-4 accent-purple-700 rounded cursor-pointer" />
                                        <span>🧩 Tự ghép câu Đúng–Sai liên chương/liên bài (khi ý Đ-S trải qua nhiều chương)</span>
                                    </label>
                                    <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" ${cv.autoParametric ? 'checked' : ''}
                                            onchange="window.TRITHUC.setCv7991ConfigV457('autoParametric', this.checked)"
                                            class="w-4 h-4 accent-emerald-600 rounded cursor-pointer" />
                                        <span>🧬 Bật sinh số liệu mới tham số Trithuc5.0</span>
                                    </label>
                                    <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input type="checkbox" ${cv.shuffleBatchOrder ? 'checked' : ''}
                                            onchange="window.TRITHUC.setCv7991ConfigV457('shuffleBatchOrder', this.checked)"
                                            class="w-4 h-4 accent-amber-600 rounded cursor-pointer" />
                                        <span>🔀 Đảo thứ tự câu giữa các mã đề <span class="text-slate-500 font-semibold">(Tắt = Giữ nguyên thứ tự ma trận)</span></span>
                                    </label>
                                </div>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                <button type="button" onclick="window.TRITHUC.generateExamFromCv7991MatrixV457('tab1')"
                                    class="px-3.5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase shadow-sm transition">
                                    🧭 Nạp Sang Tab 1 Xem &amp; Tinh Chỉnh
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateExamFromCv7991MatrixV457('pdf')"
                                    class="px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase shadow-sm transition">
                                    📄 Sinh Đề &amp; Xuất PDF Ngay
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateExamFromCv7991MatrixV457('batch')"
                                    class="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs uppercase shadow-sm transition">
                                    📦 Sinh Bộ ${state.matrixBuilder?.batchConfig?.examCount || 4} Mã Đề Tương Tự
                                </button>
                                <button type="button" onclick="window.TRITHUC.generateExamFromCv7991MatrixV457('v95')"
                                    class="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase shadow-sm transition">
                                    🚀 Sinh &amp; Up Đề Online (V9.5 PRO)
                                </button>
                            </div>
                        </div>
                        ${cv.lastGenReport ? `
                            <div class="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                                <span>✅ ${escapeHtml(cv.lastGenReport)}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : cv.activeSubTab === 'spec' ? `
                    <!-- TAB CON 2: BẢN ĐẶC TẢ CHUẨN PHỤ LỤC 2 CV 7991 -->
                    <div class="bg-white rounded-3xl border-2 border-indigo-200 shadow-xs overflow-hidden">
                        <div class="px-4 py-3 bg-indigo-50/80 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 class="text-sm font-black text-indigo-950 uppercase m-0">📑 Bản Đặc Tả Đề Kiểm Tra Định Kì (Phụ Lục 2 – Công văn 7991/BGDĐT-GDTrH)</h3>
                                <p class="text-[11px] font-semibold text-indigo-800/80 m-0 mt-0.5">
                                    Tự động đồng bộ từ Ma trận. Thầy có thể chỉnh sửa trực tiếp <b>Yêu cầu cần đạt</b> và <b>Mã năng lực toán học</b> (TD, GQ, MH, GT, CC) trước khi xuất PDF/Excel.
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="window.TRITHUC.printOrDownloadCv7991DocV457(false)"
                                    class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition">
                                    💾 Tải Hồ Sơ (.HTML)
                                </button>
                                <button type="button" onclick="window.TRITHUC.printOrDownloadCv7991DocV457(true)"
                                    class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition">
                                    🖨️ In Bản Đặc Tả (PDF)
                                </button>
                            </div>
                        </div>
                        <div class="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase">Đơn vị quản lí (Sở GD&amp;ĐT)</label>
                                <input type="text" value="${escapeHtml(cv.schoolHeader || '')}" oninput="window.TRITHUC.setCv7991ConfigV457('schoolHeader', this.value, true)"
                                    class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs outline-none" />
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase">Trường / Tổ chuyên môn</label>
                                <input type="text" value="${escapeHtml(cv.schoolSubHeader || '')}" oninput="window.TRITHUC.setCv7991ConfigV457('schoolSubHeader', this.value, true)"
                                    class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs outline-none" />
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase">Thời gian làm bài (phút)</label>
                                <input type="number" min="15" max="180" value="${cv.duration || 90}" oninput="window.TRITHUC.setCv7991ConfigV457('duration', parseInt(this.value,10)||90, true)"
                                    class="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-black text-xs outline-none" />
                            </div>
                        </div>
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse text-xs min-w-[960px]">
                                <thead>
                                    <tr class="bg-slate-100 border-b border-slate-300 font-black text-slate-800 text-center">
                                        <th class="p-2 border-r border-slate-300 w-10">TT</th>
                                        <th class="p-2 border-r border-slate-300 text-left w-52">Chủ đề / Chương &amp; Nội dung</th>
                                        <th class="p-2 border-r border-slate-300 text-left">Yêu cầu cần đạt (Biết – Hiểu – Vận dụng)</th>
                                        <th class="p-2 border-r border-slate-300 w-36">Mã Năng Lực (Ghi chú 6)</th>
                                        <th class="p-2 w-44">Phân bổ câu hỏi / ý</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-200">
                                    ${activeRows.map((r, idx) => `
                                        <tr class="align-top hover:bg-slate-50/70">
                                            <td class="p-2.5 border-r border-slate-200 text-center font-black text-slate-500">${idx + 1}</td>
                                            <td class="p-2.5 border-r border-slate-200 space-y-1">
                                                <div class="font-black text-slate-900">${escapeHtml(r.chapterTitle)}</div>
                                                <div class="text-[11px] font-semibold text-slate-600">${escapeHtml(r.contentSummary)}</div>
                                            </td>
                                            <td class="p-2.5 border-r border-slate-200 space-y-1.5">
                                                <div>
                                                    <span class="text-[10px] font-black text-sky-800 uppercase">Biết:</span>
                                                    <textarea rows="2" onchange="window.TRITHUC.setCv7991RowTextV457('${r.id}', 'yccdB', this.value)"
                                                        class="w-full mt-0.5 p-1.5 rounded-lg border border-slate-200 text-[11.5px] font-medium outline-none focus:border-blue-500">${escapeHtml(r.yccdB)}</textarea>
                                                </div>
                                                <div>
                                                    <span class="text-[10px] font-black text-amber-800 uppercase">Hiểu:</span>
                                                    <textarea rows="2" onchange="window.TRITHUC.setCv7991RowTextV457('${r.id}', 'yccdH', this.value)"
                                                        class="w-full mt-0.5 p-1.5 rounded-lg border border-slate-200 text-[11.5px] font-medium outline-none focus:border-blue-500">${escapeHtml(r.yccdH)}</textarea>
                                                </div>
                                                <div>
                                                    <span class="text-[10px] font-black text-rose-800 uppercase">Vận dụng:</span>
                                                    <textarea rows="2" onchange="window.TRITHUC.setCv7991RowTextV457('${r.id}', 'yccdV', this.value)"
                                                        class="w-full mt-0.5 p-1.5 rounded-lg border border-slate-200 text-[11.5px] font-medium outline-none focus:border-blue-500">${escapeHtml(r.yccdV)}</textarea>
                                                </div>
                                            </td>
                                            <td class="p-2.5 border-r border-slate-200 space-y-1.5 text-[11px]">
                                                ${[['Biết', 'nlB'], ['Hiểu', 'nlH'], ['Vận dụng', 'nlV']].map(([lb, fk]) => `
                                                    <div class="flex items-center justify-between gap-1">
                                                        <span class="font-bold text-slate-600">${lb}:</span>
                                                        <select onchange="window.TRITHUC.setCv7991RowTextV457('${r.id}', '${fk}', this.value)"
                                                            class="px-1.5 py-0.5 rounded-lg border border-slate-300 bg-white font-black text-indigo-900 text-[11px]">
                                                            ${['TD', 'GQ', 'MH', 'GT', 'CC'].map(nl => `<option value="${nl}" ${r[fk] === nl ? 'selected' : ''}>${nl}</option>`).join('')}
                                                        </select>
                                                    </div>
                                                `).join('')}
                                            </td>
                                            <td class="p-2.5 text-[11px] font-bold space-y-1">
                                                ${(r.tnB + r.tnH + r.tnV) > 0 ? `<div class="px-2 py-1 rounded bg-sky-50 text-sky-900">TN: ${r.tnB}B • ${r.tnH}H • ${r.tnV}VD</div>` : ''}
                                                ${(r.dsB + r.dsH + r.dsV) > 0 ? `<div class="px-2 py-1 rounded bg-purple-50 text-purple-900">Đ-S: ${r.dsB}B • ${r.dsH}H • ${r.dsV}VD (ý)</div>` : ''}
                                                ${(r.saB + r.saH + r.saV) > 0 ? `<div class="px-2 py-1 rounded bg-teal-50 text-teal-900">TLN: ${r.saB}B • ${r.saH}H • ${r.saV}VD</div>` : ''}
                                                ${(r.tlB + r.tlH + r.tlV) > 0 ? `<div class="px-2 py-1 rounded bg-amber-50 text-amber-900">TL: ${r.tlB}B • ${r.tlH}H • ${r.tlV}VD</div>` : ''}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : `
                    <!-- TAB CON 3: NHẬP MA TRẬN CÓ SẴN (EXCEL / CSV / WORD .DOCX / DÁN BẢNG) -> TỰ SINH ĐỀ -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div class="lg:col-span-5 bg-white rounded-3xl border-2 border-blue-200 p-5 space-y-4 shadow-xs">
                            <div>
                                <h3 class="text-sm font-black text-blue-950 uppercase m-0">📂 Cách 1: Tải Lên File Ma Trận (.xlsx / .csv / .docx)</h3>
                                <p class="text-xs font-semibold text-slate-600 mt-1">
                                    Hỗ trợ đọc trực tiếp file Excel ma trận chuẩn CV 7991 của nhà trường/tổ chuyên môn hoặc file Word (.docx) chứa bảng ma trận.
                                </p>
                            </div>
                            <div class="p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/40 text-center space-y-3">
                                <input id="cv7991ImportFileInp" type="file" accept=".xlsx,.xls,.csv,.docx"
                                    onchange="window.TRITHUC.handleCv7991MatrixFileUploadV457(this)"
                                    class="block w-full text-xs font-bold text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-700 file:text-white hover:file:bg-blue-800 cursor-pointer" />
                                <div class="text-[11px] font-semibold text-slate-500">
                                    Tự động nhận diện tên Chương (Chương I–IX / từ khóa) và 12 cột số câu (TN B/H/VD, Đ-S ý B/H/VD, TLN B/H/VD, TL B/H/VD).
                                </div>
                            </div>
                            <div class="pt-2 border-t border-slate-200 space-y-2">
                                <div class="text-xs font-black text-slate-800">📥 Chưa có file mẫu? Tải file Excel Mẫu chuẩn CV 7991:</div>
                                <button type="button" onclick="window.TRITHUC.downloadCv7991TemplateExcelV457()"
                                    class="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase shadow-2xs transition">
                                    📊 Tải File Excel Mẫu Ma Trận CV 7991 (Toán ${cv.grade})
                                </button>
                            </div>
                        </div>

                        <div class="lg:col-span-7 bg-white rounded-3xl border-2 border-indigo-200 p-5 space-y-3 shadow-xs">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 class="text-sm font-black text-indigo-950 uppercase m-0">📋 Cách 2: Dán Nhanh Bảng Ma Trận Từ Excel / Word</h3>
                                    <p class="text-[11px] font-semibold text-slate-500 mt-0.5">
                                        Bôi đen các dòng Chương trong Excel hoặc Word rồi Ctrl+C → Ctrl+V vào ô dưới (hỗ trợ cả bảng 12 cột CV 7991 hoặc bảng gọn 4 cột: <code>Chương | TN | Đ-S(ý) | TLN | TL</code>).
                                    </p>
                                </div>
                                <button type="button" onclick="window.TRITHUC.fillSampleCv7991PasteV457()"
                                    class="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-extrabold text-[11px] transition">
                                    ✨ Điền mẫu thử
                                </button>
                            </div>
                            <textarea id="cv7991PasteTextareaV457" rows="7"
                                oninput="window.TRITHUC.setCv7991ConfigV457('pasteRawText', this.value, true)"
                                placeholder="Ví dụ (mỗi dòng 1 chương, cách nhau bằng Tab hoặc dấu |):&#10;Chương I: Ứng dụng đạo hàm | 4 | 1 | 0 | 2 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 1&#10;Chương II: Vectơ Oxyz | 4 | 1 | 0 | 2 | 1 | 1 | 1 | 0 | 1 | 0 | 1 | 1&#10;Chương III: Mẫu số liệu ghép nhóm | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0"
                                class="w-full p-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 font-mono-code text-xs text-slate-800 outline-none">${escapeHtml(cv.pasteRawText || '')}</textarea>
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <button type="button" onclick="window.TRITHUC.importCv7991FromPasteV457(false)"
                                    class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase transition">
                                    📥 Nạp Vào Bảng Ma Trận CV 7991
                                </button>
                                <button type="button" onclick="window.TRITHUC.importCv7991FromPasteV457(true)"
                                    class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase shadow-sm transition">
                                    ⚡ Nạp Ma Trận &amp; Tự Sinh Đề PDF Luôn
                                </button>
                            </div>
                            ${cv.lastImportReport ? `
                                <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-950">
                                    ${escapeHtml(cv.lastImportReport)}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `}
            </div>`;
        }