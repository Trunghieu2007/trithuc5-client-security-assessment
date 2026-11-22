function renderAdminSyncMockToSectionETabV44() {
            const ms = state.mockToESync;
            const allExams = state.exams || [];
            const mockExams = allExams.filter(ex => ex.isMockExam || ex.category === 'thi_thu');
            const otherExams = allExams.filter(ex => !(ex.isMockExam || ex.category === 'thi_thu'));

            // KHÔNG chạy lại toàn bộ bóc tách trên mỗi lần render (giữ nguyên thao tác "Vẫn lấy" và mượt UI)
            const extractedAll = ms.hasActivelyExtracted ? (ms.extractedNewItems || []) : [];
            const skipped = ms.hasActivelyExtracted ? (ms.skippedVariantItems || []) : [];

            const brandNewCnt = extractedAll.filter(x => x.detectStatus === 'brand_new').length;
            const variantCnt = extractedAll.filter(x => x.detectStatus === 'variant').length;
            const stFilter = ms.statusFilter || 'all';
            const extracted = stFilter === 'all'
                ? extractedAll
                : extractedAll.filter(x => (x.detectStatus || 'brand_new') === stFilter);

            const tnNew = extracted.filter(x => x.qType === 'TN');
            const dsNew = extracted.filter(x => x.qType === 'Đ-S');
            const tlnNew = extracted.filter(x => x.qType === 'TLN');

            const __allCat = getFullLessonMetaCatalogV44();
            const lessonOptions = Object.keys(__allCat).map(lid => ({
                id: lid,
                label: `[Lớp ${__allCat[lid].grade || '12'} • ${__allCat[lid].code}] ${__allCat[lid].title}`
            }));

            const renderPartSectionTable = (partTitle, partBadgeCls, partItems) => {
                if (partItems.length === 0) {
                    return `
                    <div class="v511-data-card">
                        <div class="v5-empty-state py-6">
                            <div class="text-xs font-bold text-slate-500">${escapeHtml(partTitle)}: Không có câu hỏi phù hợp bộ lọc hiện tại.</div>
                        </div>
                    </div>`;
                }
                return `
                <div class="v511-data-card">
                    <div class="v511-data-card-header">
                        <div class="flex items-center gap-2.5">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold v5-tabular ${partBadgeCls}">${partItems.length} câu</span>
                            <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 m-0">${escapeHtml(partTitle)}</h4>
                        </div>
                        <span class="text-[11px] text-slate-500 font-semibold">Chuẩn Phần E • TF-IDF k-NN + Đối chiếu liên bài</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="bg-slate-100 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200">
                                <tr>
                                    <th class="py-2.5 px-3.5 w-40">Câu Nguồn &amp; Trạng Thái</th>
                                    <th class="py-2.5 px-3.5">Nội Dung Câu Hỏi Mới Bóc Tách</th>
                                    <th class="py-2.5 px-3.5 w-64">Bài Học Đích &amp; Mức Độ</th>
                                    <th class="py-2.5 px-3.5 w-72">Mã &amp; Tên Dạng Toán Mới (Phần E)</th>
                                    <th class="py-2.5 px-3.5 w-36 text-center">Up Vào Phần E</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200">
                                ${partItems.map(item => `
                                    <tr class="hover:bg-indigo-50/30 transition ${item.alreadyInE ? 'bg-emerald-50/30' : (item.detectStatus === 'variant' ? 'bg-amber-50/20' : '')}">
                                        <td class="py-3 px-3.5 align-top space-y-1.5">
                                            <span class="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 font-mono-code font-black text-[10px]">
                                                ${escapeHtml(item.examCode)} • ${escapeHtml(item.qNumLabel)}
                                            </span>
                                            <div class="flex items-center gap-1 flex-wrap">
                                                <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[10px]">${item.qType}</span>
                                                <span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-black text-[10px]">${item.levelCode}</span>
                                                <span class="px-1.5 py-0.5 rounded ${(item.confidencePct || 80) >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} font-black text-[10px]" title="Độ tin cậy phân loại Lai TF-IDF + Luật">${item.confidencePct || 80}%</span>
                                            </div>
                                            <div>
                                                ${item.detectStatus === 'variant'
                                                    ? `<span class="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px]" title="${escapeHtml(item.matchReason || '')}">⚡ Biến thể (${item.similarityPct}%)</span>`
                                                    : `<span class="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px]" title="${escapeHtml(item.matchReason || '')}">✨ Mới hoàn toàn</span>`}
                                            </div>
                                        </td>
                                        <td class="py-3 px-3.5 align-top">
                                            <div class="font-semibold text-slate-900 text-xs sm:text-[13px] leading-relaxed max-h-24 overflow-y-auto pr-1">
                                                ${preprocessMath(String(item.questionObj?.content || item.questionObj?.q || '').replace(/<div class="img-container">[\s\S]*?<\/div>/gi, ' [📊 Có hình vẽ/BBT] '))}
                                            </div>
                                            <div class="mt-1.5 flex flex-wrap items-center gap-2">
                                                <button type="button" onclick="window.TRITHUC.previewMockQuestionItemV44('${item.itemKey}')"
                                                    class="text-[11px] font-extrabold text-indigo-700 hover:underline">
                                                    👁️ Xem chi tiết &amp; So khớp Phần E
                                                </button>
                                                ${item.matchedExistingCode ? `<span class="text-[10px] font-semibold text-slate-500">Gần nhất: <code>${escapeHtml(item.matchedExistingCode)}</code> (${item.similarityPct}%)</span>` : ''}
                                            </div>
                                        </td>
                                        <td class="py-3 px-3.5 align-top space-y-1.5">
                                            <select onchange="window.TRITHUC.overrideMockItemTargetLessonV44('${item.itemKey}', this.value)"
                                                class="w-full p-2 rounded-xl border border-indigo-200 bg-indigo-50/50 font-extrabold text-xs text-indigo-950 outline-none">
                                                ${lessonOptions.map(lo => `
                                                    <option value="${lo.id}" ${item.lessonId === lo.id ? 'selected' : ''}>${escapeHtml(lo.label)}</option>
                                                `).join('')}
                                            </select>
                                            <div class="flex items-center gap-1.5">
                                                <select onchange="window.TRITHUC.overrideMockItemLevelV44('${item.itemKey}', this.value)"
                                                    class="p-1.5 rounded-lg border border-slate-300 bg-white font-black text-[11px] text-slate-800 outline-none">
                                                    ${['M1', 'M2', 'M3', 'M4'].map(lv => `<option value="${lv}" ${item.levelCode === lv ? 'selected' : ''}>Mức ${lv} (${mapMCodeToRawLevel(lv)})</option>`).join('')}
                                                </select>
                                                <span class="text-[10px] font-bold text-emerald-700 truncate"><code>${item.branchKey}</code></span>
                                            </div>
                                        </td>
                                        <td class="py-3 px-3.5 align-top space-y-1">
                                            <div class="font-mono-code font-black text-blue-800 text-[11px]">[${escapeHtml(item.code)}]-${item.levelCode}</div>
                                            <input type="text" value="${escapeHtml(item.desc)}"
                                                onchange="window.TRITHUC.overrideMockItemDescV44('${item.itemKey}', this.value)"
                                                class="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-900 outline-none focus:border-blue-600" />
                                        </td>
                                        <td class="py-3 px-3.5 align-top text-center">
                                            ${item.alreadyInE ? `
                                                <span class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[11px]">
                                                    ✔ Đã Up Vào Phần E
                                                </span>
                                            ` : `
                                                <button type="button" onclick="window.TRITHUC.syncSingleMockQuestionToSectionEV44('${item.itemKey}')"
                                                    class="w-full px-3 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase shadow-xs transition">
                                                    ➕ Up Vào Phần E
                                                </button>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
            };

            return `
            <div class="space-y-4">
                <!-- HEADER VIỆC 2: CHỦ ĐỘNG BÓC TÁCH DẠNG TOÁN MỚI V4.5.4 PRO -->
                <div class="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md space-y-4">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div class="space-y-1.5">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">Lai TF-IDF 80+ Bài • Đối Chiếu Kép Đề + Giải • V4.6.7</span>
                                <h2 class="text-base sm:text-xl font-black uppercase m-0">🔍 Việc 2: Bóc Tách Câu Hỏi Mới (Dạng Mới) Từ Đề Thi → Up Vào Phần E</h2>
                            </div>
                            <p class="text-xs sm:text-sm text-indigo-100 font-semibold m-0">
                                Phân loại thông minh bằng <b>k-NN TF-IDF trên toàn bộ 3.120 câu Phần E (Lớp 10–11–12)</b> kết hợp bộ luật toán học chuẩn xác, quét trùng <b>liên bài cùng chương</b> và tách rõ 3 nhóm: <b>✨ Mới hoàn toàn</b> • <b>⚡ Biến thể mở rộng</b> • <b>⏭️ Chỉ thay số (lọc bỏ)</b>.
                            </p>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                            <button type="button" onclick="window.TRITHUC.switchAdminTab('matrix_builder')"
                                class="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-black text-xs uppercase transition">
                                ← Về Việc 1: Làm Đề Từ Phần E
                            </button>
                            <button type="button" onclick="window.TRITHUC.toggleMockQuickPasteBoxV44()"
                                class="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase shadow-sm transition">
                                ➕ Up Đề Thi Mới Để Bóc Tách
                            </button>
                        </div>
                    </div>

                    <!-- BẢNG ĐIỀU KHIỂN CHỦ ĐỘNG BÓC TÁCH -->
                    <div class="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                        <div class="flex-1 space-y-1.5">
                            <label class="block text-xs font-black text-amber-300 uppercase">Bước 1: Chọn Đề Thi Đã Up Lên Hệ Thống Cần Bóc Tách Dạng Mới:</label>
                            <select onchange="window.TRITHUC.selectMockExamForExtractionV44(this.value)"
                                class="w-full p-3 rounded-xl bg-white text-slate-900 font-extrabold text-xs sm:text-sm outline-none">
                                ${mockExams.length > 0 ? `
                                    <optgroup label="🔥 Đề Thi Thử / Đề Mới Up (${mockExams.length} đề)">
                                        ${mockExams.map(ex => `
                                            <option value="${ex.id}" ${String(ms.selectedExamId) === String(ex.id) ? 'selected' : ''}>
                                                🔥 [${escapeHtml(ex.code || 'TT12')}] ${escapeHtml(ex.title)} (${(ex.questions || []).length} câu)
                                            </option>
                                        `).join('')}
                                    </optgroup>
                                ` : ''}
                                ${otherExams.length > 0 ? `
                                    <optgroup label="📚 Đề Kiểm Tra Theo Bài / Chương (${otherExams.length} đề)">
                                        ${otherExams.map(ex => `
                                            <option value="${ex.id}" ${String(ms.selectedExamId) === String(ex.id) ? 'selected' : ''}>
                                                📘 [Lớp ${escapeHtml(ex.grade || '12')} • ${escapeHtml(ex.code || 'DE')}] ${escapeHtml(ex.title)} (${(ex.questions || []).length} câu)
                                            </option>
                                        `).join('')}
                                    </optgroup>
                                ` : ''}
                            </select>
                        </div>
                        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
                            <button type="button" onclick="window.TRITHUC.triggerManualMockExtractionV44()"
                                class="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm uppercase shadow-lg transition flex items-center gap-2">
                                <span>🔍</span>
                                <span>Bước 2: Bóc Tách Dạng Mới Từ Đề Này</span>
                            </button>
                            ${ms.hasActivelyExtracted && extractedAll.some(x => !x.alreadyInE) ? `
                                <button type="button" onclick="window.TRITHUC.syncAllExtractedNewTypesToSectionEV44()"
                                    class="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs sm:text-sm uppercase shadow-lg transition flex items-center gap-2">
                                    <span>🚀</span>
                                    <span>Bước 3: Up Toàn Bộ ${extractedAll.filter(x => !x.alreadyInE).length} Dạng Mới Vào Phần E</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                ${ms.showQuickPasteBox ? `
                    <div class="bg-white rounded-3xl border-2 border-indigo-300 p-5 shadow-xs space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-black text-indigo-950 uppercase m-0">📥 Dán Nhanh Đề Thi Mới Để Chủ Động Bóc Tách Dạng Toán Mới</h3>
                            <button type="button" onclick="window.TRITHUC.toggleMockQuickPasteBoxV44()" class="text-xs font-bold text-slate-500 hover:text-slate-800">✕ Đóng</button>
                        </div>
                        <textarea id="mockQuickPasteTextarea" rows="5"
                            oninput="window.TRITHUC.setMockQuickPasteTextV44(this.value)"
                            placeholder="Dán nội dung đề thi mới (văn bản Câu 1: ... A. ... B. ... C. ... D. ... hoặc mã HTML/JSON V9.5 PRO) vào đây..."
                            class="w-full p-3.5 rounded-2xl border border-slate-300 font-mono-code text-xs outline-none focus:border-indigo-600">${escapeHtml(ms.quickPasteRawText || '')}</textarea>
                        <div class="flex justify-end gap-2">
                            <button type="button" onclick="window.TRITHUC.parseAndExtractNewMockExamV44()"
                                class="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs uppercase shadow-xs">
                                🔍 Lưu Đề Thi Mới &amp; Bóc Tách Dạng Toán Mới Ngay
                            </button>
                        </div>
                    </div>
                ` : ''}

                ${ms.lastSyncSummary ? `
                    <div class="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-xs sm:text-sm font-extrabold text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>${ms.lastSyncSummary}</div>
                        <button type="button" onclick="window.TRITHUC.switchAdminTab('matrix_builder')"
                            class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase shrink-0">
                            🧭 Kiểm Tra Ngay Trong Phần E (Tab Làm Đề Ma Trận)
                        </button>
                    </div>
                ` : ''}

                ${!ms.hasActivelyExtracted ? `
                    <div class="bg-white rounded-3xl border-2 border-dashed border-indigo-200 p-10 text-center space-y-3">
                        <div class="text-4xl">🔍 📊 🧠</div>
                        <h3 class="text-base sm:text-lg font-black text-slate-900 uppercase m-0">Chế Độ Chờ Chủ Động Bóc Tách Dạng Toán Mới (V4.5.4 PRO)</h3>
                        <p class="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto font-semibold">
                            Hệ thống <b>không tự động thay đổi dữ liệu Phần E</b> khi chưa có lệnh. Hãy chọn Đề thi ở Bước 1 phía trên và bấm <b>"🔍 Bước 2: Bóc Tách Dạng Mới Từ Đề Này"</b> để quét nhận diện thông minh bằng TF-IDF trên đủ 80 bài học 3 khối 10–11–12.
                        </p>
                    </div>
                ` : `
                    <!-- THANH THỐNG KÊ 3 TRẠNG THÁI & BỘ LỌC 3 PHẦN -->
                    <div class="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2.5">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="text-xs font-black text-slate-800 uppercase mr-1">Lọc trạng thái:</span>
                                ${[
                                    { id: 'all', label: `Tất cả giữ lại (${extractedAll.length})`, cls: 'bg-slate-800 text-white' },
                                    { id: 'brand_new', label: `✨ Mới hoàn toàn (${brandNewCnt})`, cls: 'bg-emerald-600 text-white' },
                                    { id: 'variant', label: `⚡ Biến thể mở rộng (${variantCnt})`, cls: 'bg-amber-500 text-slate-950' }
                                ].map(sf => `
                                    <button type="button" onclick="window.TRITHUC.setMockSyncFilterV44('statusFilter', '${sf.id}')"
                                        class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${stFilter === sf.id ? sf.cls + ' shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                                        ${sf.label}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-extrabold">
                                    ⏭️ Đã lọc bỏ <b>${skipped.length} câu</b> chỉ thay số (&ge;80%)
                                </span>
                                ${skipped.length > 0 ? `
                                    <button type="button" onclick="window.TRITHUC.toggleShowSkippedVariantsV44()"
                                        class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                                        ${ms.showSkippedVariants ? '▲ Ẩn câu thay số' : '▼ Xem câu bị lọc bỏ'}
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                            <span class="text-xs font-black text-slate-800 uppercase">Phân chia 3 phần Phần E:</span>
                            ${[
                                { id: 'all', label: `Tất cả 3 Phần (${extracted.length})` },
                                { id: 'TN', label: `📘 Phần I. TN (${tnNew.length})` },
                                { id: 'Đ-S', label: `🟣 Phần II. Đ-S (${dsNew.length})` },
                                { id: 'TLN', label: `🟠 Phần III. TLN (${tlnNew.length})` }
                            ].map(pt => `
                                <button type="button" onclick="window.TRITHUC.setMockSyncFilterV44('activePartTab', '${pt.id}')"
                                    class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${ms.activePartTab === pt.id ? 'bg-indigo-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                                    ${pt.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    ${ms.showSkippedVariants && skipped.length > 0 ? `
                        <div class="bg-amber-50/70 rounded-3xl border border-amber-300 p-4 space-y-2 text-xs">
                            <div class="font-black text-amber-950 uppercase">⏭️ Danh sách ${skipped.length} câu hỏi bị lọc bỏ do trùng dạng / chỉ thay số (&ge;80%) với Phần E:</div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${skipped.map(sk => `
                                    <div class="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2">
                                        <div class="min-w-0 flex-1" title="${escapeHtml(sk.matchedDesc || '')}">
                                            <div class="truncate"><b>${escapeHtml(sk.qNumLabel)} (${sk.qType}):</b> ${escapeHtml(sk.matchReason || ('Trùng ' + (sk.similarityPct || 80) + '%'))}</div>
                                            <div class="text-[10px] text-slate-500 truncate">Khớp mã <code>${escapeHtml(sk.matchedExistingCode)}</code> (${escapeHtml(sk.matchedLessonCode || sk.lessonCode)})</div>
                                        </div>
                                        <div class="flex items-center gap-1 shrink-0">
                                            <button type="button" onclick="window.TRITHUC.previewMockQuestionItemV44('${sk.itemKey}')"
                                                class="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                                                So sánh
                                            </button>
                                            <button type="button" onclick="window.TRITHUC.forcePromoteVariantToNewV44('${sk.itemKey}')"
                                                class="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px]">
                                                Vẫn lấy
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- HIỂN THỊ 3 PHẦN CHUẨN CẤU TRÚC PHẦN E -->
                    <div class="space-y-4">
                        ${(ms.activePartTab === 'all' || ms.activePartTab === 'TN') ? renderPartSectionTable('Phần I. Câu trắc nghiệm nhiều phương án lựa chọn (Bổ sung vào nhánh TN của Phần E)', 'bg-blue-500 text-white', tnNew) : ''}
                        ${(ms.activePartTab === 'all' || ms.activePartTab === 'Đ-S') ? renderPartSectionTable('Phần II. Câu trắc nghiệm Đúng – Sai (Bổ sung vào nhánh Đ-S của Phần E)', 'bg-purple-500 text-white', dsNew) : ''}
                        ${(ms.activePartTab === 'all' || ms.activePartTab === 'TLN') ? renderPartSectionTable('Phần III. Câu trắc nghiệm Trả lời ngắn (Bổ sung vào nhánh TLN/SA của Phần E)', 'bg-amber-500 text-slate-950', tlnNew) : ''}
                    </div>
                `}
            </div>`;
        }