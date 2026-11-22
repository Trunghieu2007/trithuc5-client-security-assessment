function renderAdminMatrixBuilderTabV44() {
            const mb = state.matrixBuilder;
            const currDb = __VAULT_CURR_DB__ || {};
            const searchQ = (mb.searchQuery || '').trim().toLowerCase();
            const selMap = {};
            (mb.selectedRows || []).forEach(r => { selMap[r.uid] = r; });

            // Tính toán thống kê ma trận (4 mức độ M1, M2, M3, M4 x 4 phần TN, Đ-S, TLN, TL chuẩn V4.6)
            const stats = {
                M1: { TN: 0, 'Đ-S': 0, TLN: 0, TL: 0, total: 0 },
                M2: { TN: 0, 'Đ-S': 0, TLN: 0, TL: 0, total: 0 },
                M3: { TN: 0, 'Đ-S': 0, TLN: 0, TL: 0, total: 0 },
                M4: { TN: 0, 'Đ-S': 0, TLN: 0, TL: 0, total: 0 },
                byType: { TN: 0, 'Đ-S': 0, TLN: 0, TL: 0 },
                grandTotal: 0
            };
            (mb.selectedRows || []).forEach(r => {
                const lv = mapRawLevelToMCode(r.levelCode || r.level);
                const qt = normalizeQTypeV44(r.qType);
                const cnt = Math.max(1, parseInt(r.count, 10) || 1);
                if (stats[lv]) {
                    stats[lv][qt] = (stats[lv][qt] || 0) + cnt;
                    stats[lv].total += cnt;
                }
                stats.byType[qt] = (stats.byType[qt] || 0) + cnt;
                stats.grandTotal += cnt;
            });

            let displayMatrixRows = (mb.selectedRows || []).slice();
            if (mb.matrixFilterType && mb.matrixFilterType !== 'all') {
                displayMatrixRows = displayMatrixRows.filter(r => normalizeQTypeV44(r.qType) === mb.matrixFilterType || mapRawLevelToMCode(r.levelCode) === mb.matrixFilterType);
            }
            if (mb.matrixSortBy === 'level') {
                const ord = { M1: 1, M2: 2, M3: 3, M4: 4 };
                displayMatrixRows.sort((a, b) => (ord[mapRawLevelToMCode(a.levelCode)] || 2) - (ord[mapRawLevelToMCode(b.levelCode)] || 2));
            } else if (mb.matrixSortBy === 'qType') {
                const ord = { 'TN': 1, 'Đ-S': 2, 'TLN': 3, 'TL': 4 };
                displayMatrixRows.sort((a, b) => (ord[normalizeQTypeV44(a.qType)] || 1) - (ord[normalizeQTypeV44(b.qType)] || 1));
            } else if (mb.matrixSortBy === 'code') {
                displayMatrixRows.sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
            }

            // Chỉ lấy các Khối / Bài học đang có dữ liệu Phần E (`les.matrixTree`) gốc của Thầy
            const gradesList = ['12', '11', '10'].filter(g => mb.gradeFilter === 'all' || mb.gradeFilter === g);
            const leftColSpan = mb.wideTreeMode ? 'xl:col-span-12' : 'xl:col-span-7';
            const rightColSpan = mb.wideTreeMode ? 'xl:col-span-12' : 'xl:col-span-5';
            const itemTextSizeCls = mb.largeFontMode ? 'text-[14px] sm:text-[15px] leading-relaxed' : 'text-xs sm:text-[13.5px] leading-snug';

            return `
            <div class="space-y-4">
                <!-- HEADER V5.1.1: LÀM ĐỀ & MA TRẬN PHẦN E -->
                <div class="v511-admin-hero">
                    <div class="space-y-0.5 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="v5-version-pill">Phần E Gốc • V5.1.1</span>
                            <h2 class="text-sm sm:text-base font-extrabold text-slate-900 m-0 tracking-tight">🧭 Làm Đề &amp; Ma Trận Từ Ngân Hàng Phần E</h2>
                        </div>
                        <p class="text-xs text-slate-500 m-0">Chọn dạng toán &amp; câu hỏi chuẩn 3 phần (TN • Đúng/Sai • Trả lời ngắn), xem trước và xuất đề PDF hoặc up thẳng lên hệ thống.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button type="button" onclick="window.TRITHUC.switchAdminTab('cv7991_matrix')"
                            class="v5-nav-btn-secondary px-2.5 py-1.5 text-[11.5px]">
                            📐 Ma Trận CV 7991
                        </button>
                        <button type="button" onclick="window.TRITHUC.switchAdminTab('sync_mock_to_e')"
                            class="v5-nav-btn-secondary px-2.5 py-1.5 text-[11.5px]">
                            🔍 Bóc Tách → Phần E
                        </button>
                        <button type="button" onclick="window.TRITHUC.openMatrixPdfExportModalV44()"
                            class="v5-nav-btn-secondary px-3 py-1.5 text-[11.5px] v5-tabular">
                            📄 Xuất PDF (${stats.grandTotal} câu)
                        </button>
                        <button type="button" onclick="window.TRITHUC.openMatrixBatchExportModalV50()"
                            class="v5-nav-btn-secondary px-3 py-1.5 text-[11.5px] v5-tabular">
                            📦 Bộ ${mb.batchConfig?.examCount || 4} Đề
                        </button>
                        <button type="button" onclick="window.TRITHUC.openMatrixV95SetupModalV44()"
                            class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11.5px] shadow-xs transition">
                            🚀 Up Đề V9.5 PRO
                        </button>
                    </div>
                </div>

                <!-- BỐ CỤC 3 KHỐI CHUẨN ẢNH MINH HỌA (KHỐI 1 MỞ RỘNG TO RÕ, CHIA ĐÚNG 3 PHẦN NHƯ PHẦN E) -->
                <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                    <!-- KHỐI 1: CHỌN DẠNG TOÁN & CÂU HỎI TỪ PHẦN E -->
                    <div class="${leftColSpan} bg-white rounded-3xl border-2 border-blue-200/90 shadow-xs overflow-hidden flex flex-col">
                        <div class="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2.5">
                                <span class="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-2xs">1</span>
                                <h3 class="text-sm sm:text-base font-black text-slate-900 m-0">Chọn dạng toán & câu hỏi (Dữ liệu gốc Phần E)</h3>
                            </div>
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold">
                                    ${mb.selectedRows.length} dạng đã chọn (${stats.grandTotal} câu)
                                </span>
                                <button type="button" onclick="window.TRITHUC.expandOrCollapseAllMatrixTreeV44(true)"
                                    title="Mở rộng tất cả Chương & Bài học"
                                    class="w-8 h-8 rounded-xl bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 font-black text-base flex items-center justify-center transition">+</button>
                                <button type="button" onclick="window.TRITHUC.expandOrCollapseAllMatrixTreeV44(false)"
                                    title="Thu gọn tất cả"
                                    class="w-8 h-8 rounded-xl bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 font-black text-base flex items-center justify-center transition">−</button>
                                <button type="button" onclick="window.TRITHUC.toggleMatrixBuilderLargeFontV44()"
                                    class="px-2.5 py-1.5 rounded-xl border text-xs font-extrabold transition ${mb.largeFontMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'}">
                                    🔤 ${mb.largeFontMode ? 'Chữ To Rõ' : 'Chữ Vừa'}
                                </button>
                                <button type="button" onclick="window.TRITHUC.toggleMatrixBuilderWideModeV44()"
                                    class="px-2.5 py-1.5 rounded-xl border text-xs font-extrabold transition ${mb.wideTreeMode ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}">
                                    ${mb.wideTreeMode ? '⤡ Chia 2 cột chuẩn' : '⤢ Phóng to khung Chọn dạng'}
                                </button>
                            </div>
                        </div>

                        <!-- Thanh tìm kiếm & Bộ lọc TN / Đ-S / TLN / M1 / M2 / M3 / M4 chuẩn ảnh -->
                        <div class="p-4 border-b border-slate-200 space-y-3 bg-white">
                            <div class="relative">
                                <input id="matBuilderSearchInp" type="text" value="${escapeHtml(mb.searchQuery || '')}"
                                    oninput="window.TRITHUC.setMatrixBuilderSearchV44(this.value)"
                                    placeholder="🔍 Tìm tên dạng, mã dạng hoặc nội dung câu hỏi trong Phần E, ví dụ D12_C1_B1, tiệm cận, cực trị..."
                                    class="w-full pl-4 pr-10 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus:bg-white focus:border-blue-600 font-bold text-xs sm:text-sm text-slate-900 outline-none transition" />
                                ${mb.searchQuery ? `
                                    <button type="button" onclick="window.TRITHUC.setMatrixBuilderSearchV44('')"
                                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 font-black text-xs">✕</button>
                                ` : ''}
                            </div>

                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    ${[
                                        { id: 'TN', label: 'TN', title: 'Phần I: Trắc nghiệm 4 lựa chọn' },
                                        { id: 'Đ-S', label: 'Đ-S', title: 'Phần II: Trắc nghiệm Đúng - Sai' },
                                        { id: 'TLN', label: 'TLN', title: 'Phần III: Trả lời ngắn' }
                                    ].map(t => {
                                        const active = mb.qTypeFilter === t.id;
                                        return `
                                        <button type="button" onclick="window.TRITHUC.toggleMatrixBuilderQTypeFilterV44('${t.id}')"
                                            title="${t.title}"
                                            class="px-3 py-1.5 rounded-lg border text-xs font-extrabold transition ${active ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'}">
                                            ${t.label}
                                        </button>`;
                                    }).join('')}

                                    <span class="text-slate-300 mx-0.5">|</span>

                                    ${[
                                        { id: 'M1', label: 'M1', title: 'Mức 1: Nhận biết (NB)' },
                                        { id: 'M2', label: 'M2', title: 'Mức 2: Thông hiểu (TH)' },
                                        { id: 'M3', label: 'M3', title: 'Mức 3: Vận dụng thấp (VDT/VD)' },
                                        { id: 'M4', label: 'M4', title: 'Mức 4: Vận dụng cao (VDC)' }
                                    ].map(lv => {
                                        const active = mb.levelFilter === lv.id;
                                        return `
                                        <button type="button" onclick="window.TRITHUC.toggleMatrixBuilderLevelFilterV44('${lv.id}')"
                                            title="${lv.title}"
                                            class="px-3 py-1.5 rounded-lg border text-xs font-extrabold transition ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'}">
                                            ${lv.label}
                                        </button>`;
                                    }).join('')}

                                    ${(mb.qTypeFilter !== 'all' || mb.levelFilter !== 'all' || mb.gradeFilter !== 'all') ? `
                                        <button type="button" onclick="window.TRITHUC.resetMatrixBuilderFiltersV44()"
                                            class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition">
                                            ✕ Hiện tất cả
                                        </button>
                                    ` : ''}
                                </div>

                                <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                    ${[
                                        { id: 'all', label: 'Tất cả' },
                                        { id: '12', label: 'Lớp 12' },
                                        { id: '11', label: 'Lớp 11' },
                                        { id: '10', label: 'Lớp 10' }
                                    ].map(g => `
                                        <button type="button" onclick="window.TRITHUC.setMatrixBuilderGradeFilterV44('${g.id}')"
                                            class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${mb.gradeFilter === g.id ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                            ${g.label}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- TÍNH NĂNG NHỎ V4.5.6: BẬT/TẮT CHẾ ĐỘ GHÉP CÂU ĐÚNG - SAI LIÊN BÀI (NHẶT TỪNG Ý a, b, c, d TỪ NHIỀU BÀI) -->
                            <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <label class="inline-flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-xl border transition ${mb.dsMixer?.enabled ? 'bg-purple-50 border-purple-400 text-purple-950' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50/40'}">
                                    <input type="checkbox" ${mb.dsMixer?.enabled ? 'checked' : ''}
                                        onchange="window.TRITHUC.toggleDsMixerEnabledV456(this.checked)"
                                        class="w-4 h-4 accent-purple-700 rounded cursor-pointer" />
                                    <span class="text-xs font-black">🧩 Ghép câu Đúng–Sai liên bài (nhặt từng ý a, b, c, d từ từng bài khác nhau)</span>
                                </label>
                                ${mb.dsMixer?.enabled ? `
                                    <span class="text-[11px] font-extrabold text-purple-700">
                                        Đã nhặt <b>${(mb.dsMixer.slots || []).filter(Boolean).length}/4 ý</b> • Bấm <b>🧩 +Nhặt 1 ý</b> hoặc mở <b>👁️ Câu hỏi</b> ở câu Đ-S để chọn riêng ý a/b/c/d
                                    </span>
                                ` : ''}
                            </div>
                            <div class="text-xs text-slate-500 font-semibold">
                                💡 Lớp và Chương chỉ để mở ra xem · Mỗi bài học hiển thị đúng <b>3 phần chuẩn của Phần E (Phần I: Trắc nghiệm • Phần II: Đúng - Sai • Phần III: Trả lời ngắn)</b>. Bấm <b>"👁️ Xem câu hỏi"</b> để xem trực tiếp câu hỏi gốc trong Phần E.
                            </div>
                        </div>

                        <!-- Cây Thư Mục Phần E Gốc (Lớp -> Chương -> Bài -> 3 Phần: TN, Đ-S, TLN -> Từng dạng & câu hỏi Phần E) -->
                        <div id="matrixBuilderTreeScrollV45" class="p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-180px)] min-h-[600px] custom-scrollbar space-y-2.5 bg-white">
                            ${gradesList.map(gKey => {
                                const gData = currDb[gKey];
                                if (!gData) return '';
                                const isGradeOpen = Boolean(searchQ) || Boolean(mb.openGrades[gKey]);
                                const chapters = [];
                                let gradeMatrixTotal = 0;
                                (gData.semesters || []).forEach(sem => {
                                    (sem.chapters || []).forEach(ch => {
                                        const chLessonsWithE = (ch.lessons || []).filter(l => l.matrixTree && ((l.matrixTree.tn?.length || 0) + (l.matrixTree.ds?.length || 0) + (l.matrixTree.sa?.length || 0) > 0));
                                        chLessonsWithE.forEach(l => {
                                            gradeMatrixTotal += (l.matrixTree.tn?.length || 0) + (l.matrixTree.ds?.length || 0) + (l.matrixTree.sa?.length || 0);
                                        });
                                        if (chLessonsWithE.length > 0) {
                                            chapters.push({ ch, chLessonsWithE });
                                        }
                                    });
                                });

                                if (chapters.length === 0) return '';

                                return `
                                <div class="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/30">
                                    <div onclick="window.TRITHUC.toggleMatrixBuilderGradeOpenV44('${gKey}')"
                                        class="px-4 py-3 bg-slate-100/90 hover:bg-blue-50/60 cursor-pointer select-none flex items-center justify-between gap-2 transition">
                                        <div class="flex items-center gap-2.5">
                                            <span class="text-slate-700 font-black text-sm w-4 text-center">${isGradeOpen ? '∨' : '›'}</span>
                                            <span class="font-black text-slate-900 text-sm sm:text-base">Lớp ${escapeHtml(gKey)} (${escapeHtml(gData.gradeName || ('Toán ' + gKey))})</span>
                                        </div>
                                        <span class="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-extrabold text-blue-700">
                                            ${chapters.length} chương • ${gradeMatrixTotal} câu Phần E
                                        </span>
                                    </div>

                                    ${isGradeOpen ? `
                                        <div class="p-2.5 sm:p-3.5 space-y-2.5 bg-white">
                                            ${chapters.map(({ ch, chLessonsWithE }, cIdx) => {
                                                const chapKey = `${gKey}_c${cIdx + 1}`;
                                                const isChapOpen = Boolean(searchQ) || Boolean(mb.openChapters[chapKey]) || Boolean(mb.openChapters[ch.id]);

                                                const filterItemMatch = (it, defaultQt) => {
                                                    const qt = normalizeQTypeV44(it.qType || defaultQt);
                                                    const lv = mapRawLevelToMCode(it.levelCode || it.level);
                                                    if (mb.qTypeFilter !== 'all' && qt !== mb.qTypeFilter) return false;
                                                    if (mb.levelFilter !== 'all' && lv !== mb.levelFilter) return false;
                                                    if (searchQ) {
                                                        const hay = `${it.code || ''} ${it.desc || ''} ${it.subTypeLabel || ''} ${it.question?.q || ''}`.toLowerCase();
                                                        if (!hay.includes(searchQ)) return false;
                                                    }
                                                    return true;
                                                };

                                                const hasMatchingInChap = chLessonsWithE.some(les => {
                                                    const mt = les.matrixTree || {};
                                                    return (mt.tn || []).some(x => filterItemMatch(x, 'TN')) ||
                                                           (mt.ds || []).some(x => filterItemMatch(x, 'Đ-S')) ||
                                                           (mt.sa || []).some(x => filterItemMatch(x, 'TLN'));
                                                });
                                                if (searchQ && !hasMatchingInChap) return '';

                                                return `
                                                <div class="pl-2 sm:pl-3 border-l-2 border-slate-200 space-y-1.5">
                                                    <div onclick="window.TRITHUC.toggleMatrixBuilderChapOpenV44('${chapKey}')"
                                                        class="px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer select-none flex items-center justify-between gap-2 transition">
                                                        <div class="flex items-center gap-2 min-w-0">
                                                            <span class="text-slate-600 font-black text-sm w-4 text-center shrink-0">${isChapOpen ? '∨' : '›'}</span>
                                                            <span class="font-extrabold text-slate-800 text-xs sm:text-sm">${escapeHtml(ch.title)}</span>
                                                        </div>
                                                        <span class="text-[11px] font-bold text-slate-500 shrink-0">${chLessonsWithE.length} bài có Phần E</span>
                                                    </div>

                                                    ${isChapOpen ? `
                                                        <div class="pl-3 sm:pl-5 space-y-2">
                                                            ${chLessonsWithE.map(les => {
                                                                const mt = les.matrixTree || {};
                                                                const tnItems = (mt.tn || []).filter(x => filterItemMatch(x, 'TN'));
                                                                const dsItems = (mt.ds || []).filter(x => filterItemMatch(x, 'Đ-S'));
                                                                const saItems = (mt.sa || []).filter(x => filterItemMatch(x, 'TLN'));
                                                                const totalFiltered = tnItems.length + dsItems.length + saItems.length;
                                                                if (searchQ && totalFiltered === 0) return '';

                                                                const isLesOpen = Boolean(searchQ) || Boolean(mb.openLessons[les.id]);
                                                                const allLesFiltered = [...tnItems, ...dsItems, ...saItems];
                                                                const lesUids = allLesFiltered.map(it => `${les.id}__${it.code}`);
                                                                const lesCheckedCnt = lesUids.filter(u => Boolean(selMap[u])).length;
                                                                const isLesAllChecked = allLesFiltered.length > 0 && lesCheckedCnt === allLesFiltered.length;

                                                                // CHIA ĐÚNG 3 PHẦN CHUẨN CỦA PHẦN E THEO YÊU CẦU CỦA THẦY:
                                                                // 1) Phần I. Trắc nghiệm (TN)
                                                                // 2) Phần II. Đúng - Sai (Đ-S)
                                                                // 3) Phần III. Trả lời ngắn (TLN)
                                                                const subGroups = [
                                                                    { id: 'tn', label: 'Phần I. Trắc nghiệm 4 phương án lựa chọn (TN)', qType: 'TN', badgeCls: 'bg-blue-100 text-blue-800', items: tnItems },
                                                                    { id: 'ds', label: 'Phần II. Trắc nghiệm Đúng – Sai (Đ-S)', qType: 'Đ-S', badgeCls: 'bg-purple-100 text-purple-800', items: dsItems },
                                                                    { id: 'sa', label: 'Phần III. Trắc nghiệm Trả lời ngắn (TLN)', qType: 'TLN', badgeCls: 'bg-amber-100 text-amber-900', items: saItems }
                                                                ].filter(sg => sg.items.length > 0);

                                                                return `
                                                                <div class="border border-slate-200/80 rounded-2xl bg-slate-50/40 overflow-hidden">
                                                                    <div onclick="window.TRITHUC.toggleMatrixBuilderLessonOpenV44('${les.id}')"
                                                                        class="px-3 py-2.5 hover:bg-blue-50/50 cursor-pointer select-none flex items-center justify-between gap-2 transition">
                                                                        <div class="flex items-center gap-2.5 min-w-0">
                                                                            <span class="text-slate-600 font-black text-sm w-4 text-center shrink-0">${isLesOpen ? '∨' : '›'}</span>
                                                                            <input type="checkbox" ${isLesAllChecked ? 'checked' : ''}
                                                                                onclick="event.stopPropagation(); window.TRITHUC.toggleMatrixBuilderLessonCheckV44('${les.id}', this.checked)"
                                                                                class="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0" />
                                                                            <span class="font-extrabold text-slate-900 text-xs sm:text-sm">
                                                                                ${escapeHtml(les.code)} - ${escapeHtml(les.title)}
                                                                            </span>
                                                                        </div>
                                                                        <div class="flex items-center gap-1.5 shrink-0">
                                                                            ${lesCheckedCnt > 0 ? `<span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">Đã chọn ${lesCheckedCnt}</span>` : ''}
                                                                            <span class="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">${totalFiltered} câu Phần E</span>
                                                                        </div>
                                                                    </div>

                                                                    ${isLesOpen ? `
                                                                        <div class="pl-4 sm:pl-6 pr-2.5 pb-3 pt-1.5 space-y-2.5 bg-white border-t border-slate-100">
                                                                            ${subGroups.map(sg => {
                                                                                const sgKey = `${les.id}_${sg.id}`;
                                                                                const isSgOpen = Boolean(searchQ) || Boolean(mb.openGroups[sgKey]);
                                                                                const sgUids = sg.items.map(it => `${les.id}__${it.code}`);
                                                                                const sgCheckedCnt = sgUids.filter(u => Boolean(selMap[u])).length;
                                                                                const isSgAllChecked = sg.items.length > 0 && sgCheckedCnt === sg.items.length;

                                                                                return `
                                                                                <div class="space-y-1.5">
                                                                                    <div onclick="window.TRITHUC.toggleMatrixBuilderGroupOpenV44('${sgKey}')"
                                                                                        class="px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/70 cursor-pointer select-none flex items-center justify-between gap-2">
                                                                                        <div class="flex items-center gap-2">
                                                                                            <span class="text-slate-500 font-black text-xs w-4 text-center">${isSgOpen ? '∨' : '›'}</span>
                                                                                            <input type="checkbox" ${isSgAllChecked ? 'checked' : ''}
                                                                                                onclick="event.stopPropagation(); window.TRITHUC.toggleMatrixBuilderGroupCheckV44('${les.id}', '${sg.id}', this.checked)"
                                                                                                class="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                                                                                            <span class="font-extrabold text-slate-800 text-xs sm:text-[13px]">${escapeHtml(sg.label)}</span>
                                                                                        </div>
                                                                                        <span class="px-2 py-0.5 rounded-md text-[11px] font-extrabold ${sg.badgeCls}">${sg.items.length} câu</span>
                                                                                    </div>

                                                                                    ${isSgOpen ? `
                                                                                        <div class="pl-3 sm:pl-5 space-y-1.5 pt-0.5">
                                                                                            ${sg.items.map(it => {
                                                                                                const uid = `${les.id}__${it.code}`;
                                                                                                const isChecked = Boolean(selMap[uid]);
                                                                                                const isInlinePreview = Boolean(mb.expandedQuestionPreviewUids[uid]);
                                                                                                const lvCode = mapRawLevelToMCode(it.levelCode || it.level);
                                                                                                const qtLabel = sg.qType;
                                                                                                const descTxt = it.desc || it.subTypeLabel || les.title;
                                                                                                const fullLabel = `[${it.code}]-${lvCode}. ${descTxt}`;
                                                                                                const lvBadgeCls = lvCode === 'M1'
                                                                                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                                                                                    : (lvCode === 'M2' ? 'bg-amber-50 text-amber-800 border-amber-200' : (lvCode === 'M3' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'));

                                                                                                return `
                                                                                                <div class="rounded-xl border transition ${isChecked ? 'bg-blue-50/70 border-blue-400 shadow-2xs' : 'bg-white hover:bg-slate-50 border-slate-200/80'}">
                                                                                                    <div title="${escapeHtml(fullLabel)}" class="p-2.5 sm:px-3.5 sm:py-2.5 flex items-start justify-between gap-2.5">
                                                                                                        <label class="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                                                                                                            <input type="checkbox" ${isChecked ? 'checked' : ''}
                                                                                                                onchange="window.TRITHUC.toggleMatrixBuilderItemV44('${les.id}', '${escapeJsAttr(it.code)}', this.checked)"
                                                                                                                class="w-4 h-4 mt-1 accent-blue-600 rounded cursor-pointer shrink-0" />
                                                                                                            <div class="${itemTextSizeCls} text-slate-900 break-words flex-1">
                                                                                                                <span class="font-mono-code font-black text-blue-900">[${escapeHtml(it.code)}]-${lvCode}.</span>
                                                                                                                <span class="font-semibold text-slate-800 ml-1">${preprocessMath(descTxt)}</span>
                                                                                                            </div>
                                                                                                        </label>
                                                                                                        <div class="flex items-center gap-1.5 shrink-0 pt-0.5">
                                                                                                            <span class="px-2 py-0.5 rounded border text-[10px] font-black ${lvBadgeCls}">${lvCode}</span>
                                                                                                            <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-extrabold">${qtLabel}</span>
                                                                                                            ${mb.dsMixer?.enabled && qtLabel === 'Đ-S' ? `
                                                                                                                <button type="button" onclick="window.TRITHUC.pickRandomDsSubFromItemV456('${les.id}', '${escapeJsAttr(it.code)}')"
                                                                                                                    title="Nhặt nhanh 1 ý (a/b/c/d) từ câu Đúng-Sai này vào Xưởng ghép liên bài"
                                                                                                                    class="px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 text-[10.5px] font-black transition">
                                                                                                                    🧩 +Nhặt 1 ý
                                                                                                                </button>
                                                                                                            ` : ''}
                                                                                                            ${(qtLabel === 'TN' || qtLabel === 'TLN') ? `
                                                                                                                <button type="button" onclick="window.TRITHUC.addItemAsEssayToMatrixV46('${les.id}', '${escapeJsAttr(it.code)}')"
                                                                                                                    title="Chuyển đổi câu ${qtLabel} này thành câu Tự luận (1,0đ) và thêm ngay vào Ma trận đề"
                                                                                                                    class="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10.5px] font-black transition">
                                                                                                                    📝 +TL
                                                                                                                </button>
                                                                                                            ` : ''}
                                                                                                            <button type="button" onclick="window.TRITHUC.toggleInlineQuestionPreviewV44('${uid}')"
                                                                                                                title="Mở xem trực tiếp câu hỏi & lời giải trong Phần E"
                                                                                                                class="px-2 py-1 rounded-lg ${isInlinePreview ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-blue-100 text-blue-700'} text-[11px] font-extrabold transition">
                                                                                                                👁️ Câu hỏi
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    ${isInlinePreview && it.question ? `
                                                                                                        <div class="px-3.5 pb-3 pt-2 border-t border-slate-200/80 bg-slate-50/90 text-xs space-y-2 rounded-b-xl">
                                                                                                            <div class="font-bold text-slate-900 leading-relaxed">${preprocessMath(it.question.q || '')}</div>
                                                                                                            ${qtLabel === 'TN' && Array.isArray(it.question.options) ? `
                                                                                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                                                                                    ${it.question.options.map((op, oi) => `
                                                                                                                        <div class="p-2 rounded-lg border ${['A','B','C','D'][oi] === it.question.ans ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950' : 'bg-white border-slate-200'}">
                                                                                                                            <b>${['A','B','C','D'][oi]}.</b> ${preprocessMath(op)}
                                                                                                                        </div>
                                                                                                                    `).join('')}
                                                                                                                </div>
                                                                                                            ` : qtLabel === 'Đ-S' && Array.isArray(it.question.items) ? `
                                                                                                                <div class="space-y-1">
                                                                                                                    ${it.question.items.map((sub, subIdx) => `
                                                                                                                        <div class="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2">
                                                                                                                            <span class="flex-1 min-w-0"><b>${escapeHtml(sub.label)}</b> ${preprocessMath(sub.text)}</span>
                                                                                                                            <div class="flex items-center gap-1.5 shrink-0">
                                                                                                                                <span class="px-2 py-0.5 rounded font-black text-[10px] ${sub.ans ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${sub.ans ? 'Đúng' : 'Sai'}</span>
                                                                                                                                ${mb.dsMixer?.enabled ? `
                                                                                                                                    <button type="button" onclick="window.TRITHUC.pickDsSubItemForMixerV456('${les.id}', '${escapeJsAttr(it.code)}', ${subIdx})"
                                                                                                                                        class="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] transition">
                                                                                                                                        ➕ Nhặt ý này
                                                                                                                                    </button>
                                                                                                                                ` : ''}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    `).join('')}
                                                                                                                </div>
                                                                                                            ` : `
                                                                                                                <div class="font-black text-amber-900">Đáp số Phần E: <code class="px-2 py-0.5 rounded bg-amber-100">${escapeHtml(it.question.ans || '')}</code></div>
                                                                                                            `}
                                                                                                        </div>
                                                                                                    ` : ''}
                                                                                                </div>`;
                                                                                            }).join('')}
                                                                                        </div>
                                                                                    ` : ''}
                                                                                </div>`;
                                                                            }).join('')}
                                                                        </div>
                                                                    ` : ''}
                                                                </div>`;
                                                            }).join('')}
                                                        </div>
                                                    ` : ''}
                                                </div>`;
                                            }).join('')}
                                        </div>
                                    ` : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- CỘT PHẢI: XƯỞNG GHÉP Đ-S LIÊN BÀI (NẾU BẬT) + KHỐI 2 (MA TRẬN ĐỀ) & KHỐI 3 (THỐNG KÊ MA TRẬN) -->
                    <div class="${rightColSpan} space-y-4">
                        ${renderDsMixerPanelV456(mb)}
                        <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
                            <div class="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex items-center gap-2.5">
                                    <span class="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-2xs">2</span>
                                    <h3 class="text-sm sm:text-base font-black text-slate-900 m-0">Ma trận đề</h3>
                                </div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-xs font-extrabold">
                                        ${displayMatrixRows.length} dòng
                                    </span>
                                    <button type="button" onclick="window.TRITHUC.cycleMatrixTableFilterV44()"
                                        class="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition">
                                        ⏳ Lọc${mb.matrixFilterType !== 'all' ? `: ${mb.matrixFilterType}` : ''}
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.cycleMatrixTableSortV44()"
                                        class="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition">
                                        ⇅ Sắp xếp
                                    </button>
                                    ${mb.selectedRows.length > 0 ? `
                                        <button type="button" onclick="window.TRITHUC.clearAllMatrixBuilderRowsV44()"
                                            class="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold transition">
                                            🗑️ Xóa
                                        </button>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="p-3.5 sm:p-4">
                                <div class="border border-slate-200 rounded-2xl overflow-hidden">
                                    <div id="matrixBuilderTableScrollV45" class="max-h-[470px] overflow-y-auto custom-scrollbar">
                                        <table class="w-full text-left border-collapse text-xs">
                                            <thead class="bg-slate-100/90 text-slate-600 font-extrabold sticky top-0 z-10 border-b border-slate-200">
                                                <tr>
                                                    <th class="py-2.5 px-3">Dạng toán &amp; Thao tác câu (Xem / Sửa / Tự luận)</th>
                                                    <th class="py-2.5 px-1.5 text-center w-16">Loại</th>
                                                    <th class="py-2.5 px-1.5 text-center w-16">Mức độ</th>
                                                    <th class="py-2.5 px-1.5 text-center w-24">Số câu</th>
                                                    <th class="py-2.5 px-1.5 text-center w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-100">
                                                ${displayMatrixRows.length === 0 ? `
                                                    <tr>
                                                        <td colspan="5" class="py-16 text-center text-slate-400 font-bold text-xs">
                                                            Chưa chọn dạng toán nào từ Phần E ở khung số 1 bên trái.
                                                        </td>
                                                    </tr>
                                                ` : displayMatrixRows.map((r, rIdx) => {
                                                    const lv = mapRawLevelToMCode(r.levelCode || r.level);
                                                    const qt = normalizeQTypeV44(r.qType);
                                                    const uidEsc = escapeJsAttr(r.uid);
                                                    const isRowPreview = Boolean(mb.expandedMatrixRowUids && mb.expandedMatrixRowUids[r.uid]);
                                                    const isRowEdit = mb.editingMatrixRowUid === r.uid;
                                                    const qObj = (r.sourceItem && r.sourceItem.question) ? r.sourceItem.question : {};
                                                    const qtBadgeCls = qt === 'TL'
                                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                                        : (qt === 'Đ-S' ? 'bg-purple-50 text-purple-800 border-purple-200' : (qt === 'TLN' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-blue-50 text-blue-800 border-blue-200'));
                                                    return `
                                                    <tr class="${isRowEdit ? 'bg-amber-50/70' : (isRowPreview ? 'bg-blue-50/50' : 'hover:bg-blue-50/40')} transition">
                                                        <td class="py-2.5 px-3">
                                                            <div class="font-mono-code font-black text-blue-900 text-[11px] flex items-center gap-1.5 flex-wrap">
                                                                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-sans text-[10px]">#${rIdx + 1}</span>
                                                                <span>[${escapeHtml(r.code)}]-${lv}</span>
                                                                ${r.isCompositeDs ? `<span class="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 font-sans font-black text-[9.5px]">🧩 Đ-S Liên Bài</span>` : ''}
                                                                ${qt === 'TL' ? `<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-sans font-black text-[9.5px]">📝 Tự luận (${Number(r.points || qObj.points || 1).toFixed(1).replace('.', ',')}đ)</span>` : ''}
                                                                ${r.isManualEdited ? `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-sans font-black text-[9.5px]">✓ Đã sửa tay</span>` : ''}
                                                            </div>
                                                            <div class="font-semibold text-slate-800 text-xs leading-snug mt-0.5">${preprocessMath(r.desc || '')}</div>
                                                            <div class="flex items-center gap-1.5 flex-wrap mt-1.5">
                                                                <button type="button" onclick="window.TRITHUC.toggleMatrixRowPreviewV46('${uidEsc}')"
                                                                    class="px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold border transition ${isRowPreview ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'}">
                                                                    👁️ ${isRowPreview ? 'Ẩn câu' : 'Xem câu'}
                                                                </button>
                                                                <button type="button" onclick="window.TRITHUC.openMatrixRowEditorV46('${uidEsc}')"
                                                                    class="px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold border transition ${isRowEdit ? 'bg-amber-600 text-white border-amber-600' : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'}">
                                                                    ✏️ ${isRowEdit ? 'Đóng sửa' : 'Sửa trực tiếp'}
                                                                </button>
                                                                ${(qt === 'TN' || qt === 'TLN') ? `
                                                                    <button type="button" onclick="window.TRITHUC.convertMatrixRowToEssayV46('${uidEsc}')"
                                                                        title="Chuyển câu ${qt} này sang Tự luận bằng thuật toán V4.6.2 và mở sửa ngay"
                                                                        class="px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition">
                                                                        📝 → Tự luận
                                                                    </button>
                                                                ` : ''}
                                                                <button type="button" onclick="window.TRITHUC.swapMatrixBuilderRowQuestionV462('${uidEsc}')"
                                                                    title="Đổi sang câu hỏi khác cùng bài/cùng chương &amp; đúng loại (${qt}) ngay tại dòng này"
                                                                    class="px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 transition">
                                                                    🔄 Đổi câu hỏi
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td class="py-2.5 px-1.5 text-center align-top">
                                                            <span class="inline-block px-2 py-0.5 rounded-md border font-extrabold text-[11px] ${qtBadgeCls}">${qt}</span>
                                                        </td>
                                                        <td class="py-2.5 px-1.5 text-center align-top">
                                                            <button type="button" onclick="window.TRITHUC.cycleMatrixRowLevelV44('${uidEsc}')"
                                                                class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-black text-[11px]">${lv}</button>
                                                        </td>
                                                        <td class="py-2.5 px-1.5 text-center align-top">
                                                            <div class="inline-flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden">
                                                                <button type="button" onclick="window.TRITHUC.stepMatrixRowCountV44('${uidEsc}', -1)"
                                                                    class="px-1.5 py-1 hover:bg-slate-100 font-black text-slate-700">−</button>
                                                                <input type="number" min="1" max="20" value="${r.count || 1}"
                                                                    onchange="window.TRITHUC.setMatrixRowCountV44('${uidEsc}', this.value)"
                                                                    class="w-8 text-center font-black text-xs text-blue-700 outline-none border-x border-slate-200 py-1" />
                                                                <button type="button" onclick="window.TRITHUC.stepMatrixRowCountV44('${uidEsc}', 1)"
                                                                    class="px-1.5 py-1 hover:bg-slate-100 font-black text-slate-700">+</button>
                                                            </div>
                                                        </td>
                                                        <td class="py-2.5 px-1.5 text-center align-top">
                                                            <button type="button" onclick="window.TRITHUC.removeMatrixBuilderRowV44('${uidEsc}')"
                                                                class="w-6 h-6 rounded-lg hover:bg-rose-100 text-rose-600 font-black text-xs">✕</button>
                                                        </td>
                                                    </tr>
                                                    ${isRowPreview ? `
                                                        <tr class="bg-slate-50/90">
                                                            <td colspan="5" class="p-3 border-t border-blue-200/80">
                                                                <div class="bg-white rounded-xl border border-blue-200 p-3 space-y-2 text-xs shadow-2xs">
                                                                    <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                                                                        <span class="font-black text-blue-900">👁️ Nội dung câu hỏi [${escapeHtml(r.code)}] (${qt}${qt === 'TL' ? ` • ${Number(r.points || qObj.points || 1).toFixed(1).replace('.', ',')}đ` : ''})</span>
                                                                        <button type="button" onclick="window.TRITHUC.openMatrixRowEditorV46('${uidEsc}')"
                                                                            class="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-[10.5px]">✏️ Sửa ngay</button>
                                                                    </div>
                                                                    <div class="text-slate-900 font-semibold leading-relaxed">${preprocessMath(stripMatrixCodeForStudentV45(qObj.q || '(Chưa có đề bài)'))}</div>
                                                                    ${qt === 'TN' && Array.isArray(qObj.options) ? `
                                                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                                                            ${qObj.options.map((op, oi) => {
                                                                                const lb = ['A', 'B', 'C', 'D'][oi] || String(oi + 1);
                                                                                const isRight = lb === String(qObj.ans || '').trim().toUpperCase().slice(0, 1);
                                                                                return `<div class="p-2 rounded-lg border ${isRight ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950' : 'bg-slate-50 border-slate-200'}"><b>${lb}.</b> ${preprocessMath(op)}</div>`;
                                                                            }).join('')}
                                                                        </div>
                                                                    ` : qt === 'Đ-S' && Array.isArray(qObj.items) ? `
                                                                        <div class="space-y-1 pt-1">
                                                                            ${qObj.items.map((sub, si) => `
                                                                                <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                                                                                    <span class="flex-1"><b>${escapeHtml(sub.label || ('abcd'[si] + ')'))}</b> ${preprocessMath(sub.text || '')}</span>
                                                                                    <span class="px-2 py-0.5 rounded font-black text-[10px] shrink-0 ${sub.ans ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${sub.ans ? 'Đúng' : 'Sai'}</span>
                                                                                </div>
                                                                            `).join('')}
                                                                        </div>
                                                                    ` : `
                                                                        <div class="p-2 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-950">
                                                                            ${qt === 'TL' ? 'Đáp số / Kết luận:' : 'Đáp án chuẩn:'} <span class="font-black">${preprocessMath(String(qObj.ans || 'Xem hướng dẫn giải'))}</span>
                                                                        </div>
                                                                    `}
                                                                    ${qObj.exp ? `
                                                                        <div class="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-slate-800 leading-relaxed">
                                                                            <div class="font-black text-blue-900 mb-0.5">💡 Lời giải / Hướng dẫn chấm:</div>
                                                                            <div>${preprocessMath(stripMatrixCodeForStudentV45(qObj.exp))}</div>
                                                                        </div>
                                                                    ` : ''}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ` : ''}
                                                    ${isRowEdit ? `
                                                        <tr class="bg-amber-50/80">
                                                            <td colspan="5" class="p-3 border-t border-amber-300">
                                                                <div class="bg-white rounded-xl border-2 border-amber-400 p-3 space-y-2.5 text-xs shadow-sm">
                                                                    <div class="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-amber-100">
                                                                        <span class="font-black text-amber-950">✏️ Sửa trực tiếp câu hỏi [${escapeHtml(r.code)}] (${qt}) — Lưu xong sẽ giữ nguyên 100% khi xuất PDF</span>
                                                                        <div class="flex items-center gap-2">
                                                                            <label class="font-bold text-slate-600">Mức độ:</label>
                                                                            <select id="mtxEditLv_${rIdx}" class="px-2 py-1 rounded-lg border border-slate-300 font-black text-xs bg-white">
                                                                                ${['M1', 'M2', 'M3', 'M4'].map(m => `<option value="${m}" ${lv === m ? 'selected' : ''}>${m}</option>`).join('')}
                                                                            </select>
                                                                            ${qt === 'TL' ? `
                                                                                <label class="font-bold text-slate-600">Điểm:</label>
                                                                                <input id="mtxEditPts_${rIdx}" type="number" step="0.25" min="0.25" max="5" value="${Number(r.points || qObj.points || 1.0)}"
                                                                                    class="w-16 px-2 py-1 rounded-lg border border-amber-300 font-black text-xs text-center bg-amber-50" />
                                                                            ` : ''}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label class="block text-[10.5px] font-black text-slate-700 uppercase mb-1">Đề bài (Hỗ trợ LaTeX $...$ và thẻ hình/BBT):</label>
                                                                        <textarea id="mtxEditStem_${rIdx}" rows="3" class="w-full p-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-medium text-xs leading-relaxed">${escapeHtml(qObj.q || '')}</textarea>
                                                                    </div>
                                                                    ${qt === 'TN' ? `
                                                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                            ${['A', 'B', 'C', 'D'].map((lb, oi) => `
                                                                                <div>
                                                                                    <label class="block text-[10px] font-extrabold text-slate-600 mb-0.5">Phương án ${lb}:</label>
                                                                                    <input id="mtxEditOpt_${rIdx}_${oi}" type="text" value="${escapeHtml((qObj.options && qObj.options[oi]) || '')}"
                                                                                        class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium" />
                                                                                </div>
                                                                            `).join('')}
                                                                        </div>
                                                                        <div class="flex items-center gap-2">
                                                                            <label class="text-[11px] font-black text-emerald-800">Đáp án đúng:</label>
                                                                            <select id="mtxEditAns_${rIdx}" class="px-3 py-1 rounded-lg border border-emerald-400 bg-emerald-50 font-black text-xs text-emerald-900">
                                                                                ${['A', 'B', 'C', 'D'].map(lb => `<option value="${lb}" ${String(qObj.ans || 'A').trim().toUpperCase().slice(0, 1) === lb ? 'selected' : ''}>${lb}</option>`).join('')}
                                                                            </select>
                                                                        </div>
                                                                    ` : qt === 'Đ-S' ? `
                                                                        <div class="space-y-1.5">
                                                                            ${['a)', 'b)', 'c)', 'd)'].map((lb, si) => {
                                                                                const sub = (qObj.items && qObj.items[si]) || { text: '', ans: true };
                                                                                return `
                                                                                <div class="flex items-center gap-2">
                                                                                    <span class="font-black text-purple-800 w-6 shrink-0">${lb}</span>
                                                                                    <input id="mtxEditDsTxt_${rIdx}_${si}" type="text" value="${escapeHtml(sub.text || '')}"
                                                                                        class="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium" />
                                                                                    <select id="mtxEditDsAns_${rIdx}_${si}" class="px-2 py-1.5 rounded-lg border border-slate-300 font-black text-xs bg-white">
                                                                                        <option value="true" ${sub.ans ? 'selected' : ''}>Đúng</option>
                                                                                        <option value="false" ${!sub.ans ? 'selected' : ''}>Sai</option>
                                                                                    </select>
                                                                                </div>`;
                                                                            }).join('')}
                                                                        </div>
                                                                    ` : `
                                                                        <div>
                                                                            <label class="block text-[10.5px] font-black text-slate-700 uppercase mb-1">${qt === 'TL' ? 'Đáp số / Kết luận ngắn:' : 'Đáp án trả lời ngắn:'}</label>
                                                                            <input id="mtxEditAns_${rIdx}" type="text" value="${escapeHtml(String(qObj.ans || ''))}"
                                                                                class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold" />
                                                                        </div>
                                                                    `}
                                                                    <div>
                                                                        <label class="block text-[10.5px] font-black text-slate-700 uppercase mb-1">Lời giải chi tiết / Hướng dẫn chấm:</label>
                                                                        <textarea id="mtxEditExp_${rIdx}" rows="3" class="w-full p-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-medium text-xs leading-relaxed">${escapeHtml(qObj.exp || '')}</textarea>
                                                                    </div>
                                                                    <div class="flex items-center justify-between gap-2 flex-wrap pt-1">
                                                                        <div class="flex items-center gap-2">
                                                                            <button type="button" onclick="window.TRITHUC.saveMatrixRowEditorV46('${uidEsc}', ${rIdx})"
                                                                                class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition">
                                                                                💾 Lưu Chỉnh Sửa
                                                                            </button>
                                                                            <button type="button" onclick="window.TRITHUC.openMatrixRowEditorV46('${uidEsc}')"
                                                                                class="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition">
                                                                                Hủy
                                                                            </button>
                                                                        </div>
                                                                        ${(qt === 'TN' || qt === 'TLN') ? `
                                                                            <button type="button" onclick="window.TRITHUC.convertMatrixRowToEssayV46('${uidEsc}')"
                                                                                class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition">
                                                                                📝 Chuyển Câu Này Sang Tự Luận
                                                                            </button>
                                                                        ` : ''}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ` : ''}
                                                    `;
                                                }).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="text-[11px] text-slate-500 font-semibold mt-2.5 flex items-center justify-between flex-wrap gap-1">
                                    <span>${displayMatrixRows.length === 0 ? 'Chưa chọn dạng nào · chọn từ Phần E hoặc nạp từ Ma trận CV 7991' : `Đã chọn ${displayMatrixRows.length} dòng (${stats.byType.TN} TN · ${stats.byType['Đ-S']} Đ-S · ${stats.byType.TLN} TLN · ${stats.byType.TL} Tự luận) · bấm 👁️ Xem / ✏️ Sửa trực tiếp`}</span>
                                    <span class="font-extrabold text-blue-700">Tổng: ${stats.grandTotal} câu</span>
                                </div>
                            </div>
                        </div>

                        <!-- KHỐI 3: THỐNG KÊ MA TRẬN -->
                        <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
                            <div class="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex items-center gap-2.5">
                                    <span class="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-2xs">3</span>
                                    <h3 class="text-sm sm:text-base font-black text-slate-900 m-0">Thống kê ma trận</h3>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-xs font-extrabold">
                                        ${stats.grandTotal === 0 ? 'Chưa có câu nào' : `${stats.grandTotal} câu đã chọn`}
                                    </span>
                                    <button type="button" onclick="window.TRITHUC.openMatrixPdfExportModalV44()"
                                        class="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold transition">
                                        📊 Xem thống kê
                                    </button>
                                </div>
                            </div>

                            <div class="p-4 space-y-4">
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div class="p-3 rounded-2xl border-2 border-blue-400 bg-blue-50/20 border-t-4 border-t-blue-500">
                                        <div class="flex items-baseline justify-between gap-1">
                                            <span class="text-xs font-bold text-slate-600 truncate">Nhận biết</span>
                                            <span class="text-base sm:text-lg font-black text-blue-600 shrink-0">${stats.M1.total} câu</span>
                                        </div>
                                        <div class="text-[10.5px] font-semibold text-slate-500 mt-1">
                                            TN ${stats.M1.TN} · Đ-S ${stats.M1['Đ-S']} · TLN ${stats.M1.TLN} · TL ${stats.M1.TL}
                                        </div>
                                    </div>
                                    <div class="p-3 rounded-2xl border-2 border-amber-400 bg-amber-50/20 border-t-4 border-t-amber-500">
                                        <div class="flex items-baseline justify-between gap-1">
                                            <span class="text-xs font-bold text-slate-600 truncate">Thông hiểu</span>
                                            <span class="text-base sm:text-lg font-black text-amber-600 shrink-0">${stats.M2.total} câu</span>
                                        </div>
                                        <div class="text-[10.5px] font-semibold text-slate-500 mt-1">
                                            TN ${stats.M2.TN} · Đ-S ${stats.M2['Đ-S']} · TLN ${stats.M2.TLN} · TL ${stats.M2.TL}
                                        </div>
                                    </div>
                                    <div class="p-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50/20 border-t-4 border-t-emerald-500">
                                        <div class="flex items-baseline justify-between gap-1">
                                            <span class="text-xs font-bold text-slate-600 truncate">Vận dụng thấp</span>
                                            <span class="text-base sm:text-lg font-black text-emerald-600 shrink-0">${stats.M3.total} câu</span>
                                        </div>
                                        <div class="text-[10.5px] font-semibold text-slate-500 mt-1">
                                            TN ${stats.M3.TN} · Đ-S ${stats.M3['Đ-S']} · TLN ${stats.M3.TLN} · TL ${stats.M3.TL}
                                        </div>
                                    </div>
                                    <div class="p-3 rounded-2xl border-2 border-pink-400 bg-pink-50/20 border-t-4 border-t-pink-500">
                                        <div class="flex items-baseline justify-between gap-1">
                                            <span class="text-xs font-bold text-slate-600 truncate">Vận dụng cao</span>
                                            <span class="text-base sm:text-lg font-black text-pink-600 shrink-0">${stats.M4.total} câu</span>
                                        </div>
                                        <div class="text-[10.5px] font-semibold text-slate-500 mt-1">
                                            TN ${stats.M4.TN} · Đ-S ${stats.M4['Đ-S']} · TLN ${stats.M4.TLN} · TL ${stats.M4.TL}
                                        </div>
                                    </div>
                                </div>

                                <div class="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                                    <div class="overflow-x-auto">
                                        <table class="w-full text-center border-collapse">
                                            <thead>
                                                <tr class="border-b border-slate-200 font-bold text-slate-700">
                                                    <th colspan="4" class="py-2 px-1 bg-sky-50 border-r border-slate-200">Nhận biết</th>
                                                    <th colspan="4" class="py-2 px-1 bg-amber-50 border-r border-slate-200">Thông hiểu</th>
                                                    <th colspan="4" class="py-2 px-1 bg-emerald-50 border-r border-slate-200">Vận dụng thấp</th>
                                                    <th colspan="4" class="py-2 px-1 bg-pink-50">Vận dụng cao</th>
                                                </tr>
                                                <tr class="border-b border-slate-200 bg-slate-50 text-[10.5px] font-bold text-slate-600">
                                                    <th class="py-1.5 border-r border-slate-200">TN</th><th class="py-1.5 border-r border-slate-200">Đ-S</th><th class="py-1.5 border-r border-slate-200">SA</th><th class="py-1.5 border-r border-slate-200 text-amber-800">TL</th>
                                                    <th class="py-1.5 border-r border-slate-200">TN</th><th class="py-1.5 border-r border-slate-200">Đ-S</th><th class="py-1.5 border-r border-slate-200">SA</th><th class="py-1.5 border-r border-slate-200 text-amber-800">TL</th>
                                                    <th class="py-1.5 border-r border-slate-200">TN</th><th class="py-1.5 border-r border-slate-200">Đ-S</th><th class="py-1.5 border-r border-slate-200">SA</th><th class="py-1.5 border-r border-slate-200 text-amber-800">TL</th>
                                                    <th class="py-1.5 border-r border-slate-200">TN</th><th class="py-1.5 border-r border-slate-200">Đ-S</th><th class="py-1.5 border-r border-slate-200">SA</th><th class="py-1.5 text-amber-800">TL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr class="border-b border-slate-200 font-extrabold text-slate-900 text-sm">
                                                    <td class="py-2 border-r border-slate-200">${stats.M1.TN}</td><td class="py-2 border-r border-slate-200">${stats.M1['Đ-S']}</td><td class="py-2 border-r border-slate-200">${stats.M1.TLN}</td><td class="py-2 border-r border-slate-200 text-amber-700">${stats.M1.TL}</td>
                                                    <td class="py-2 border-r border-slate-200">${stats.M2.TN}</td><td class="py-2 border-r border-slate-200">${stats.M2['Đ-S']}</td><td class="py-2 border-r border-slate-200">${stats.M2.TLN}</td><td class="py-2 border-r border-slate-200 text-amber-700">${stats.M2.TL}</td>
                                                    <td class="py-2 border-r border-slate-200">${stats.M3.TN}</td><td class="py-2 border-r border-slate-200">${stats.M3['Đ-S']}</td><td class="py-2 border-r border-slate-200">${stats.M3.TLN}</td><td class="py-2 border-r border-slate-200 text-amber-700">${stats.M3.TL}</td>
                                                    <td class="py-2 border-r border-slate-200">${stats.M4.TN}</td><td class="py-2 border-r border-slate-200">${stats.M4['Đ-S']}</td><td class="py-2 border-r border-slate-200">${stats.M4.TLN}</td><td class="py-2 text-amber-700">${stats.M4.TL}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div class="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-50/70 text-center py-2 text-xs font-bold text-slate-700 divide-x divide-slate-200">
                                        <div>Trắc nghiệm: <b>${stats.byType.TN} câu</b></div>
                                        <div>Đúng-Sai: <b>${stats.byType['Đ-S']} câu</b></div>
                                        <div>Trả lời ngắn: <b>${stats.byType.TLN} câu</b></div>
                                        <div class="text-amber-800">Tự luận: <b>${stats.byType.TL} câu</b></div>
                                    </div>
                                    <div class="py-2.5 bg-slate-100 text-center font-black text-slate-900 text-sm">
                                        Tổng cộng: ${stats.grandTotal} câu
                                    </div>
                                </div>

                                <!-- ĐẶT TIÊU ĐỀ BÀI THI & CÀI ĐẶT NHANH AN TOÀN (ĐỒNG BỘ CẢ XUẤT PDF & UP ĐỀ V9.5 PRO) -->
                                <div class="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                        <span class="text-xs font-black text-indigo-950 uppercase flex items-center gap-1.5">
                                            <span>📝</span>
                                            <span>Tiêu đề bài thi &amp; Cài đặt nhanh an toàn</span>
                                        </span>
                                        <div class="flex items-center gap-1 flex-wrap">
                                            ${[
                                                { lb: '15p', dur: 15, title: 'Kiểm tra thường xuyên 15 phút' },
                                                { lb: '45p', dur: 45, title: 'Kiểm tra 1 tiết (45 phút)' },
                                                { lb: 'Giữa kỳ', dur: 90, title: 'Đề Kiểm Tra Giữa Học Kỳ (90 phút)' },
                                                { lb: 'Thi thử 90p', dur: 90, title: 'Đề Thi Thử Tốt Nghiệp THPT 2026' }
                                            ].map(pr => `
                                                <button type="button" onclick="window.TRITHUC.applyQuickExamPresetV445('${pr.title}', ${pr.dur})"
                                                    class="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10.5px] font-extrabold transition">
                                                    ⚡ ${pr.lb}
                                                </button>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <input type="text" value="${escapeHtml(mb.v95Setup?.title || mb.pdfConfig?.examTitle || '')}"
                                        oninput="window.TRITHUC.setQuickExamTitleV445(this.value)"
                                        placeholder="Nhập tiêu đề bài thi (VD: Kiểm tra Chương I Toán 12 – Đề số 01)..."
                                        class="w-full px-3 py-2 rounded-xl border border-indigo-300 bg-white font-bold text-xs sm:text-[13px] text-slate-900 outline-none focus:border-blue-600" />
                                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                        <div class="bg-white rounded-xl border border-slate-200 px-2.5 py-1.5">
                                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase">⏱ Thời gian (p)</label>
                                            <input type="number" min="5" max="180" value="${mb.v95Setup?.duration || 90}"
                                                oninput="window.TRITHUC.setQuickExamSettingV445('duration', parseInt(this.value,10)||45)"
                                                class="w-full font-black text-slate-900 text-xs outline-none bg-transparent" />
                                        </div>
                                        <div class="bg-white rounded-xl border border-slate-200 px-2.5 py-1.5">
                                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase">🚨 Lỗi thoát Tab</label>
                                            <input type="number" min="1" max="10" value="${mb.v95Setup?.maxTabSwitches || 3}"
                                                oninput="window.TRITHUC.setQuickExamSettingV445('maxTabSwitches', Math.max(1, parseInt(this.value,10)||3))"
                                                class="w-full font-black text-rose-700 text-xs outline-none bg-transparent" />
                                        </div>
                                        <div class="bg-white rounded-xl border border-slate-200 px-2.5 py-1.5">
                                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase">🔑 Mật khẩu đề</label>
                                            <div class="flex items-center gap-1">
                                                <input id="quickExamPasswordInpV45" type="text" value="${escapeHtml(mb.v95Setup?.password || '')}"
                                                    oninput="window.TRITHUC.setQuickExamSettingV445('password', this.value)"
                                                    placeholder="Trống = Mở"
                                                    class="w-full font-mono-code font-bold text-rose-800 text-xs outline-none bg-transparent min-w-0" />
                                                <button type="button" onclick="window.TRITHUC.generateQuickExamPasswordV45()"
                                                    title="Tạo mật khẩu ngẫu nhiên tức thì" class="text-xs hover:scale-110 transition cursor-pointer">🎲</button>
                                            </div>
                                        </div>
                                        <button type="button" onclick="window.TRITHUC.setQuickExamSettingV445('isPublicFree', !state.matrixBuilder.v95Setup.isPublicFree)"
                                            class="rounded-xl border px-2.5 py-1.5 text-left transition ${mb.v95Setup?.isPublicFree ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}">
                                            <div class="text-[10px] font-extrabold uppercase opacity-80">Quyền làm bài</div>
                                            <div class="font-black text-xs">${mb.v95Setup?.isPublicFree ? '🔓 Công khai' : '🔒 Khóa VIP'}</div>
                                        </button>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-slate-700 pt-0.5">
                                        <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" ${mb.v95Setup?.shuffleQuestions ? 'checked' : ''}
                                                onchange="window.TRITHUC.setQuickExamSettingV445('shuffleQuestions', this.checked)"
                                                class="w-3.5 h-3.5 accent-indigo-600 rounded" />
                                            <span>🔀 Trộn thứ tự câu</span>
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" ${mb.v95Setup?.shuffleOptions ? 'checked' : ''}
                                                onchange="window.TRITHUC.setQuickExamSettingV445('shuffleOptions', this.checked)"
                                                class="w-3.5 h-3.5 accent-indigo-600 rounded" />
                                            <span>🔀 Đảo đáp án A/B/C/D</span>
                                        </label>
                                        <label class="inline-flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" ${mb.v95Setup?.resultVisibility !== 'score_only' ? 'checked' : ''}
                                                onchange="window.TRITHUC.setQuickExamSettingV445('resultVisibility', this.checked ? 'full' : 'score_only')"
                                                class="w-3.5 h-3.5 accent-emerald-600 rounded" />
                                            <span>💡 Hiện đáp án &amp; giải sau nộp</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- V4.6.7: BẢNG SET ĐIỂM THEO CÔNG VĂN 7991 (GỌN, DỄ DÙNG, TÙY CHỈNH TRỰC TIẾP) -->
                                ${(() => {
                                    const sumSc = computeMatrixBuilderScoreSummaryV467(mb.selectedRows, mb.scoringConfig);
                                    const sc = sumSc.sc;
                                    const hasP4 = sumSc.n4 > 0;
                                    const remForP4 = Number((10 - (sumSc.p1Pts + sumSc.p2Pts + sumSc.p3Pts)).toFixed(4));
                                    const pillCls = sumSc.totalQ === 0
                                        ? 'bg-slate-200 text-slate-700'
                                        : (sumSc.isExact10 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white');
                                    const pillTxt = sumSc.totalQ === 0
                                        ? 'Thang 10đ'
                                        : (sumSc.isExact10 ? '✔ Đủ 10,00đ' : `⚠️ ${fmtPtVNV467(sumSc.totalPts, 2)} / 10đ`);
                                    return `
                                    <div class="p-3 rounded-2xl border border-emerald-200/90 bg-white shadow-2xs space-y-2">
                                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="text-xs font-black text-emerald-950 uppercase">⚖️ Set Điểm Theo Công Văn</span>
                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${pillCls}">${pillTxt}</span>
                                            </div>
                                            <div class="flex items-center gap-1 flex-wrap">
                                                <button type="button" onclick="window.TRITHUC.applyMatrixScoringPresetV467('cv7991_4p')"
                                                    title="Áp thang chuẩn CV 7991 (4 phần: P.I 0,25đ • P.II 1,0đ lũy tiến • P.III 0,5đ • P.IV 1,0đ)"
                                                    class="px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold border transition ${sc.preset === 'cv7991_4p' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 hover:bg-emerald-50 text-emerald-900 border-emerald-200'}">
                                                    CV 7991 (4 phần)
                                                </button>
                                                <button type="button" onclick="window.TRITHUC.applyMatrixScoringPresetV467('tn_thpt_3p')"
                                                    title="Áp thang chuẩn TN THPT (3 phần: P.I 0,25đ • P.II 1,0đ lũy tiến • P.III 0,5đ)"
                                                    class="px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold border transition ${sc.preset === 'tn_thpt_3p' ? 'bg-blue-700 text-white border-blue-700' : 'bg-slate-50 hover:bg-blue-50 text-blue-900 border-blue-200'}">
                                                    TN THPT (3 phần)
                                                </button>
                                                ${(hasP4 && !sumSc.isExact10 && remForP4 > 0) ? `
                                                    <button type="button" onclick="window.TRITHUC.autoBalancePart4To10V467()"
                                                        title="Tự chia đều ${fmtPtVNV467(remForP4, 2)}đ còn lại cho ${sumSc.n4} câu Phần IV để tròn đúng 10,00đ"
                                                        class="px-2 py-0.5 rounded-lg text-[10.5px] font-black bg-amber-500 hover:bg-amber-600 text-white transition">
                                                        ⚖️ Cân P.IV đủ 10đ
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </div>

                                        <div class="overflow-x-auto rounded-xl border border-slate-200">
                                            <table class="w-full text-left border-collapse text-[11px]">
                                                <thead>
                                                    <tr class="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-black">
                                                        <th class="py-1.5 px-2.5">Phần thi</th>
                                                        <th class="py-1.5 px-1.5 text-center w-12">Câu</th>
                                                        <th class="py-1.5 px-1.5 text-center w-24">Điểm / câu</th>
                                                        <th class="py-1.5 px-2.5 text-right w-24">Tổng điểm</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-slate-100 text-slate-800">
                                                    <tr>
                                                        <td class="py-1.5 px-2.5 font-extrabold text-blue-800">Phần I. TN 4 lựa chọn</td>
                                                        <td class="py-1.5 px-1.5 text-center font-black">${sumSc.n1}</td>
                                                        <td class="py-1.5 px-1.5 text-center">
                                                            <input type="number" step="0.05" min="0.05" max="5" value="${sc.p1Unit}"
                                                                onchange="window.TRITHUC.setMatrixScoringFieldV467('p1Unit', parseFloat(this.value))"
                                                                class="w-16 px-1.5 py-0.5 rounded-lg border border-blue-200 bg-blue-50/40 text-center font-black text-blue-900 outline-none focus:border-blue-600" />
                                                        </td>
                                                        <td class="py-1.5 px-2.5 text-right font-black text-blue-900">${fmtPtVNV467(sumSc.p1Pts, 2)}đ <span class="text-[9.5px] font-bold text-slate-400">(${sumSc.p1Pct}%)</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td class="py-1.5 px-2.5 font-extrabold text-purple-800">Phần II. Đúng / Sai</td>
                                                        <td class="py-1.5 px-1.5 text-center font-black">${sumSc.n2}</td>
                                                        <td class="py-1.5 px-1.5 text-center">
                                                            <input type="number" step="0.1" min="0.2" max="5" value="${sc.p2Unit}"
                                                                onchange="window.TRITHUC.setMatrixScoringFieldV467('p2Unit', parseFloat(this.value))"
                                                                class="w-16 px-1.5 py-0.5 rounded-lg border border-purple-200 bg-purple-50/40 text-center font-black text-purple-900 outline-none focus:border-purple-600" />
                                                        </td>
                                                        <td class="py-1.5 px-2.5 text-right font-black text-purple-900">${fmtPtVNV467(sumSc.p2Pts, 2)}đ <span class="text-[9.5px] font-bold text-slate-400">(${sumSc.p2Pct}%)</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td class="py-1.5 px-2.5 font-extrabold text-orange-800">Phần III. Trả lời ngắn</td>
                                                        <td class="py-1.5 px-1.5 text-center font-black">${sumSc.n3}</td>
                                                        <td class="py-1.5 px-1.5 text-center">
                                                            <input type="number" step="0.05" min="0.05" max="5" value="${sc.p3Unit}"
                                                                onchange="window.TRITHUC.setMatrixScoringFieldV467('p3Unit', parseFloat(this.value))"
                                                                class="w-16 px-1.5 py-0.5 rounded-lg border border-orange-200 bg-orange-50/40 text-center font-black text-orange-900 outline-none focus:border-orange-600" />
                                                        </td>
                                                        <td class="py-1.5 px-2.5 text-right font-black text-orange-900">${fmtPtVNV467(sumSc.p3Pts, 2)}đ <span class="text-[9.5px] font-bold text-slate-400">(${sumSc.p3Pct}%)</span></td>
                                                    </tr>
                                                    <tr class="${hasP4 ? 'bg-emerald-50/50' : 'opacity-60'}">
                                                        <td class="py-1.5 px-2.5 font-extrabold text-emerald-800">
                                                            Phần IV. Tự luận (TL→TLN)
                                                            ${(hasP4 && sumSc.p4CustomCount > 0 && sc.useIndividualP4Points) ? `<span class="ml-1 text-[9.5px] font-bold text-amber-700">(điểm riêng)</span>` : ''}
                                                        </td>
                                                        <td class="py-1.5 px-1.5 text-center font-black">${sumSc.n4}</td>
                                                        <td class="py-1.5 px-1.5 text-center">
                                                            <div class="inline-flex items-center gap-1">
                                                                <input type="number" step="0.25" min="0.25" max="10" value="${sc.p4Unit}"
                                                                    onchange="window.TRITHUC.setMatrixScoringFieldV467('p4Unit', parseFloat(this.value))"
                                                                    class="w-16 px-1.5 py-0.5 rounded-lg border border-emerald-300 bg-white text-center font-black text-emerald-900 outline-none focus:border-emerald-600" />
                                                                ${hasP4 ? `
                                                                    <button type="button" onclick="window.TRITHUC.applyP4UnitToAllEssayRowsV467()"
                                                                        title="Gán ${fmtPtVNV467(sc.p4Unit)}đ cho toàn bộ ${sumSc.n4} câu Phần IV"
                                                                        class="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[9.5px] font-black transition">
                                                                        Áp tất
                                                                    </button>
                                                                ` : ''}
                                                            </div>
                                                        </td>
                                                        <td class="py-1.5 px-2.5 text-right font-black text-emerald-900">${fmtPtVNV467(sumSc.p4Pts, 2)}đ <span class="text-[9.5px] font-bold text-slate-400">(${sumSc.p4Pct}%)</span></td>
                                                    </tr>
                                                </tbody>
                                                <tfoot>
                                                    <tr class="bg-slate-900 text-white font-black text-[11px]">
                                                        <td class="py-1.5 px-2.5 uppercase">Tổng cộng (${hasP4 ? '4 phần' : '3 phần'})</td>
                                                        <td class="py-1.5 px-1.5 text-center">${sumSc.totalQ}</td>
                                                        <td class="py-1.5 px-1.5 text-center text-[10px] font-bold text-slate-300">Thang 10đ</td>
                                                        <td class="py-1.5 px-2.5 text-right ${sumSc.isExact10 ? 'text-emerald-300' : 'text-amber-300'}">${fmtPtVNV467(sumSc.totalPts, 2)}đ</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div class="flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-bold text-slate-700">
                                            <div class="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                                <span class="px-1.5 text-[10px] font-black text-purple-900">Phần II:</span>
                                                <button type="button" onclick="window.TRITHUC.setMatrixScoringFieldV467('p2Mode', 'progressive')"
                                                    class="px-2 py-0.5 rounded-md text-[10px] font-extrabold transition ${sc.p2Mode !== 'linear' ? 'bg-purple-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                                    Lũy tiến (${fmtPtVNV467(sc.p2Unit * 0.1)}–${fmtPtVNV467(sc.p2Unit * 0.25)}–${fmtPtVNV467(sc.p2Unit * 0.5)}–${fmtPtVNV467(sc.p2Unit)})
                                                </button>
                                                <button type="button" onclick="window.TRITHUC.setMatrixScoringFieldV467('p2Mode', 'linear')"
                                                    class="px-2 py-0.5 rounded-md text-[10px] font-extrabold transition ${sc.p2Mode === 'linear' ? 'bg-purple-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                                    Đều ${fmtPtVNV467(sc.p2Unit / 4)}đ/ý
                                                </button>
                                            </div>
                                            <div class="flex items-center gap-3 flex-wrap">
                                                ${hasP4 ? `
                                                    <label class="inline-flex items-center gap-1 cursor-pointer" title="Ưu tiên giữ điểm riêng nếu Thầy đã chỉnh từng câu Tự luận trong Ma trận">
                                                        <input type="checkbox" ${sc.useIndividualP4Points ? 'checked' : ''}
                                                            onchange="window.TRITHUC.setMatrixScoringFieldV467('useIndividualP4Points', this.checked)"
                                                            class="w-3.5 h-3.5 accent-emerald-600 rounded" />
                                                        <span>Điểm riêng câu TL</span>
                                                    </label>
                                                ` : ''}
                                                <label class="inline-flex items-center gap-1 cursor-pointer" title="Tự quy đổi điểm thi về thang 10,00 khi tổng điểm gốc khác 10">
                                                    <input type="checkbox" ${sc.autoScaleTo10 ? 'checked' : ''}
                                                        onchange="window.TRITHUC.setMatrixScoringFieldV467('autoScaleTo10', this.checked)"
                                                        class="w-3.5 h-3.5 accent-indigo-600 rounded" />
                                                    <span>Quy đổi thang 10</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>`;
                                })()}

                                <!-- ĐỘNG CƠ SINH ĐỀ TƯƠNG TỰ CHUẨN THAM SỐ TRITHUC5.0 + XUẤT NHIỀU ĐỀ TƯƠNG TỰ -->
                                <div class="p-3.5 rounded-2xl border-2 ${mb.autoGenerateVariants ? 'border-emerald-400 bg-emerald-50/70' : 'border-slate-200 bg-slate-50/70'} space-y-2.5 transition">
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label class="flex items-start sm:items-center gap-2.5 cursor-pointer select-none flex-1">
                                            <input type="checkbox" ${mb.autoGenerateVariants ? 'checked' : ''}
                                                onchange="window.TRITHUC.toggleMatrixAutoVariantV443(this.checked)"
                                                class="w-4 h-4 mt-0.5 sm:mt-0 accent-emerald-600 rounded cursor-pointer shrink-0" />
                                            <div class="space-y-0.5">
                                                <div class="text-xs sm:text-[13px] font-black ${mb.autoGenerateVariants ? 'text-emerald-950' : 'text-slate-800'} flex items-center gap-1.5 flex-wrap">
                                                    <span>🧬 Tự sinh câu tương tự (Thuật toán tham số Trithuc5.0 • 0% AI)</span>
                                                    ${mb.autoGenerateVariants ? `<span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">Biến thể #${mb.variantSeed || 1}</span>` : ''}
                                                </div>
                                                <div class="text-[11px] font-semibold text-slate-600">
                                                    Sinh ngược từ nghiệm đẹp, tự vẽ lại Bảng biến thiên &amp; Bảng thống kê động, sinh Đúng–Sai 4 ý mới, bảo toàn mức độ M1–M4 &amp; hậu kiểm 6 lớp.
                                                </div>
                                            </div>
                                        </label>
                                        ${mb.autoGenerateVariants ? `
                                            <button type="button" onclick="window.TRITHUC.regenerateMatrixVariantSeedV443()"
                                                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-2xs transition shrink-0 flex items-center gap-1">
                                                <span>🔄</span>
                                                <span>Đổi bộ số mới</span>
                                            </button>
                                        ` : ''}
                                    </div>

                                    <!-- KHỐI CẤU HÌNH NHANH XUẤT BỘ NHIỀU ĐỀ TƯƠNG TỰ -->
                                    <div class="pt-2.5 border-t border-slate-200/80 space-y-2">
                                        <div class="flex flex-wrap items-center justify-between gap-2">
                                            <span class="text-[11px] font-black text-purple-950 uppercase flex items-center gap-1">
                                                <span>📦</span>
                                                <span>Xuất Bộ Nhiều Đề Tương Tự (Đa Mã Đề Chuẩn Trithuc5.0)</span>
                                            </span>
                                            <div class="flex items-center gap-1">
                                                ${[2, 4, 6, 8].map(n => `
                                                    <button type="button" onclick="window.TRITHUC.setMatrixBatchFieldV50('examCount', ${n})"
                                                        class="px-2 py-0.5 rounded-lg border text-[11px] font-black transition ${(mb.batchConfig?.examCount || 4) === n ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'}">
                                                        ${n} đề
                                                    </button>
                                                `).join('')}
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 text-[11px]">
                                            <div class="sm:col-span-3 bg-white rounded-xl border border-purple-200 px-2.5 py-1.5">
                                                <label class="block text-[9.5px] font-extrabold text-slate-500 uppercase">Số lượng (1–20)</label>
                                                <input id="batchCountInpV50" type="number" min="1" max="20" value="${mb.batchConfig?.examCount || 4}"
                                                    oninput="window.TRITHUC.setMatrixBatchFieldV50('examCount', Math.max(1, Math.min(20, parseInt(this.value,10)||4)), true)"
                                                    class="w-full font-black text-purple-900 text-xs outline-none bg-transparent" />
                                            </div>
                                            <div class="sm:col-span-3 bg-white rounded-xl border border-purple-200 px-2.5 py-1.5">
                                                <label class="block text-[9.5px] font-extrabold text-slate-500 uppercase">Mã đề bắt đầu</label>
                                                <input id="batchStartCodeInpV50" type="number" min="1" max="9999" value="${mb.batchConfig?.startCode || 101}"
                                                    oninput="window.TRITHUC.setMatrixBatchFieldV50('startCode', Math.max(1, parseInt(this.value,10)||101), true)"
                                                    class="w-full font-mono-code font-black text-purple-900 text-xs outline-none bg-transparent" />
                                            </div>
                                            <div class="sm:col-span-6 bg-white rounded-xl border border-purple-200 px-2.5 py-1.5">
                                                <label class="block text-[9.5px] font-extrabold text-slate-500 uppercase">Chế độ sinh bộ đề</label>
                                                <select onchange="window.TRITHUC.setMatrixBatchFieldV50('mode', this.value)"
                                                    class="w-full font-extrabold text-slate-800 text-[11px] outline-none bg-transparent">
                                                    <option value="trithuc_only" ${(mb.batchConfig?.mode || 'trithuc_only') === 'trithuc_only' || mb.batchConfig?.mode === 'imath_only' ? 'selected' : ''}>🧬 Thay số chuẩn Trithuc5.0 (Giữ nguyên thứ tự câu — Mặc định)</option>
                                                    <option value="trithuc_shuffle" ${mb.batchConfig?.mode === 'trithuc_shuffle' || mb.batchConfig?.mode === 'imath_shuffle' ? 'selected' : ''}>🧬🔀 Thay số chuẩn Trithuc5.0 + Đảo thứ tự câu hỏi</option>
                                                    <option value="shuffle_only" ${mb.batchConfig?.mode === 'shuffle_only' ? 'selected' : ''}>🔀 Chỉ đảo thứ tự &amp; phương án (Cùng 1 đề gốc)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <button type="button" onclick="window.TRITHUC.openMatrixPdfExportModalV44()"
                                        class="py-3 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wide shadow-md transition flex items-center justify-center gap-1.5">
                                        <span>📄</span>
                                        <span>1. Xuất 1 Đề PDF</span>
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.openMatrixBatchExportModalV50()"
                                        class="py-3 px-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wide shadow-md transition flex items-center justify-center gap-1.5">
                                        <span>📦</span>
                                        <span>2. Xuất ${mb.batchConfig?.examCount || 4} Đề Tương Tự</span>
                                    </button>
                                    <button type="button" onclick="window.TRITHUC.openMatrixV95SetupModalV44()"
                                        class="py-3 px-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wide shadow-md transition flex items-center justify-center gap-1.5">
                                        <span>🚀</span>
                                        <span>3. Up Đề V9.5 PRO</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }