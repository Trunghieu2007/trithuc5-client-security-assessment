function renderAdminResultsTab() {
            const data = getResultsCatalogAndFilteredDataV45();
            const list = data.filteredAttempts;
            const subTab = state.adminResultSubTab || 'overview';
            const compareAxis = state.adminResultCompareAxis || 'exam';

            let gioi = 0, kha = 0, tb = 0, yeu = 0, sum = 0;
            let maxScore = list.length > 0 ? -1 : 0;
            let minScore = list.length > 0 ? 11 : 0;
            const uniqueStudentsSet = new Set();
            const bins = [
                { label: '< 1', min: 0, max: 1, count: 0, color: 'bg-red-500' },
                { label: '1–2', min: 1, max: 2, count: 0, color: 'bg-red-500' },
                { label: '2–3', min: 2, max: 3, count: 0, color: 'bg-red-400' },
                { label: '3–4', min: 3, max: 4, count: 0, color: 'bg-orange-400' },
                { label: '4–5', min: 4, max: 5, count: 0, color: 'bg-orange-400' },
                { label: '5–6', min: 5, max: 6, count: 0, color: 'bg-amber-400' },
                { label: '6–7', min: 6, max: 7, count: 0, color: 'bg-sky-400' },
                { label: '7–8', min: 7, max: 8, count: 0, color: 'bg-blue-500' },
                { label: '8–9', min: 8, max: 9, count: 0, color: 'bg-emerald-500' },
                { label: '9–10', min: 9, max: 10.01, count: 0, color: 'bg-emerald-600' }
            ];
            const scoresArr = [];
            list.forEach(h => {
                const s = h.score;
                scoresArr.push(s);
                uniqueStudentsSet.add(h.stuKey);
                sum += s;
                if (s > maxScore) maxScore = s;
                if (s < minScore) minScore = s;
                if (s >= 8.0) gioi++;
                else if (s >= 6.5) kha++;
                else if (s >= 5.0) tb++;
                else yeu++;
                const bIdx = s >= 10 ? 9 : Math.max(0, Math.min(9, Math.floor(s)));
                bins[bIdx].count++;
            });
            scoresArr.sort((a, b) => a - b);
            const avg = list.length > 0 ? (sum / list.length).toFixed(2) : '0.00';
            const median = list.length === 0 ? '0.00' : (list.length % 2 === 1 ? scoresArr[(list.length - 1) / 2] : (scoresArr[list.length / 2 - 1] + scoresArr[list.length / 2]) / 2).toFixed(2);
            const passRate = list.length > 0 ? (((gioi + kha + tb) / list.length) * 100).toFixed(1) : '0.0';
            const maxBin = Math.max(1, ...bins.map(b => b.count));

            const groupMap = {};
            list.forEach(h => {
                const key = h.examId || ('title:' + h.examTitle);
                if (!groupMap[key]) {
                    groupMap[key] = {
                        examId: h.examId,
                        examCode: h.examCode,
                        examTitle: h.examTitle,
                        lessonId: h.lessonId,
                        lessonLabel: h.lessonLabel,
                        grade: h.grade,
                        sourceType: h.sourceType,
                        attempts: 0,
                        stuSet: new Set(),
                        sum: 0,
                        max: -1,
                        min: 11,
                        passCnt: 0,
                        gioiCnt: 0,
                        warnCnt: 0
                    };
                }
                const g = groupMap[key];
                g.attempts++;
                g.stuSet.add(h.stuKey);
                g.sum += h.score;
                if (h.score > g.max) g.max = h.score;
                if (h.score < g.min) g.min = h.score;
                if (h.score >= 5.0) g.passCnt++;
                if (h.score >= 8.0) g.gioiCnt++;
                if (h.tabSwitches > 0 || h.aiSuspicionCount > 0) g.warnCnt++;
            });
            const groupedExamStats = Object.values(groupMap).sort((a, b) => b.attempts - a.attempts);

            const compareColsMap = {};
            const stuRowsMap = {};
            list.forEach(h => {
                const colKey = compareAxis === 'lesson'
                    ? (h.lessonId || (h.sourceType === 'mock' ? `mock_${h.grade}` : `bank_${h.grade}`))
                    : (h.examId || `exam_${h.examTitle}`);
                if (!compareColsMap[colKey]) {
                    compareColsMap[colKey] = {
                        key: colKey,
                        shortLabel: compareAxis === 'lesson'
                            ? (h.lessonId && data.lessonMetaMap[h.lessonId] ? `${data.lessonMetaMap[h.lessonId].code} (L${h.grade})` : (h.sourceType === 'mock' ? `Thi thử L${h.grade}` : `Kho chung L${h.grade}`))
                            : (h.examCode ? `Đề ${h.examCode}` : h.examTitle.slice(0, 22)),
                        fullLabel: compareAxis === 'lesson' ? h.lessonLabel : `${h.examTitle} (${h.lessonLabel})`,
                        examId: h.examId,
                        lessonId: h.lessonId
                    };
                }
                if (!stuRowsMap[h.stuKey]) {
                    stuRowsMap[h.stuKey] = {
                        stuKey: h.stuKey,
                        name: h.name,
                        cls: h.cls,
                        username: h.username,
                        cells: {},
                        chronological: []
                    };
                }
                const sr = stuRowsMap[h.stuKey];
                sr.chronological.push({ score: h.score, time: h.endTime || 0 });
                if (!sr.cells[colKey]) {
                    sr.cells[colKey] = { best: h.score, latest: h.score, latestTime: h.endTime || 0, count: 1, bestAttemptId: h.id };
                } else {
                    const c = sr.cells[colKey];
                    c.count++;
                    if (h.score >= c.best) {
                        c.best = h.score;
                        c.bestAttemptId = h.id;
                    }
                    if ((h.endTime || 0) >= c.latestTime) {
                        c.latest = h.score;
                        c.latestTime = h.endTime || 0;
                    }
                }
            });
            const compareCols = Object.values(compareColsMap);
            const compareRows = Object.values(stuRowsMap).map(sr => {
                const cellVals = Object.values(sr.cells).map(c => c.best);
                const avgStu = cellVals.length > 0 ? cellVals.reduce((a, b) => a + b, 0) / cellVals.length : 0;
                sr.chronological.sort((a, b) => a.time - b.time);
                let trend = null;
                if (sr.chronological.length >= 2) {
                    const lastScore = sr.chronological[sr.chronological.length - 1].score;
                    const prevScores = sr.chronological.slice(0, -1).map(x => x.score);
                    const prevAvg = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;
                    trend = +(lastScore - prevAvg).toFixed(2);
                }
                return { ...sr, doneCount: cellVals.length, avg: avgStu, trend };
            }).sort((a, b) => b.avg - a.avg);

            const scoreBadgeCls = (s) => {
                if (s >= 8.0) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
                if (s >= 6.5) return 'bg-blue-100 text-blue-900 border-blue-300';
                if (s >= 5.0) return 'bg-amber-100 text-amber-900 border-amber-300';
                return 'bg-rose-100 text-rose-800 border-rose-300';
            };

            const hasActiveFilter = state.adminResultGradeFilter !== 'all' || state.adminResultSourceFilter !== 'all' || state.adminResultLessonFilter !== 'all' || state.adminResultExamFilter !== 'all' || Boolean((state.adminResultStudentSearch || '').trim());

            return `
            <div class="space-y-4">
                <div class="v5-surface-card p-4 sm:p-5 space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div>
                            <h3 class="text-sm sm:text-base font-extrabold text-slate-900 m-0 flex items-center gap-2 tracking-tight">
                                <span>📊</span>
                                <span>Phổ Điểm &amp; So Sánh Kết Quả Học Sinh</span>
                            </h3>
                            <p class="text-xs font-medium text-slate-500 m-0 mt-0.5 v5-tabular">
                                Liên kết ${data.lessonsInScope.length} bài học • ${state.exams.length} đề thi • ${data.allHistoryCount} tổng lượt nộp.
                            </p>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <label class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-extrabold cursor-pointer transition">
                                📥 Nhập Excel/CSV Điểm
                                <input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange="window.TRITHUC.importGoogleFormExcel(event)" />
                            </label>
                            <button type="button" onclick="window.TRITHUC.exportFilteredResultsToExcelV45('attempts')"
                                class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition">
                                📤 Xuất Excel Chi Tiết
                            </button>
                            <button type="button" onclick="window.TRITHUC.syncStudentResultsNowV474()"
                                class="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-xs transition">
                                🔄 Tải điểm HS mới nhất
                            </button>
                            <button type="button" onclick="window.TRITHUC.exportFilteredResultsToExcelV45('compare')"
                                class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition">
                                📈 Xuất Excel So Sánh HS
                            </button>
                        </div>
                    </div>

                    <div class="v511-mini-kpi-grid">
                        <div class="v511-mini-kpi">
                            <div class="text-[11px] font-semibold text-slate-500">Lượt nộp đang lọc</div>
                            <div class="text-lg font-extrabold text-slate-900 v5-tabular">${list.length} <span class="text-[11px] font-semibold text-slate-400">(${uniqueStudentsSet.size} HS)</span></div>
                        </div>
                        <div class="v511-mini-kpi">
                            <div class="text-[11px] font-semibold text-slate-500">Điểm Trung bình</div>
                            <div class="text-lg font-extrabold text-blue-700 v5-tabular">${avg} <span class="text-[11px] font-semibold text-slate-400">/ 10</span></div>
                        </div>
                        <div class="v511-mini-kpi">
                            <div class="text-[11px] font-semibold text-slate-500">Trung vị (Median)</div>
                            <div class="text-lg font-extrabold text-slate-900 v5-tabular">${median}</div>
                        </div>
                        <div class="v511-mini-kpi">
                            <div class="text-[11px] font-semibold text-slate-500">Tỉ lệ Đạt (≥ 5.0)</div>
                            <div class="text-lg font-extrabold text-emerald-600 v5-tabular">${passRate}%</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 text-xs">
                        <div class="lg:col-span-2">
                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">1. Khối lớp</label>
                            <select onchange="window.TRITHUC.setAdminResultGradeFilterV45(this.value)"
                                class="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-600">
                                <option value="all" ${state.adminResultGradeFilter === 'all' ? 'selected' : ''}>Tất cả các khối</option>
                                <option value="12" ${state.adminResultGradeFilter === '12' ? 'selected' : ''}>Toán Lớp 12</option>
                                <option value="11" ${state.adminResultGradeFilter === '11' ? 'selected' : ''}>Toán Lớp 11</option>
                                <option value="10" ${state.adminResultGradeFilter === '10' ? 'selected' : ''}>Toán Lớp 10</option>
                            </select>
                        </div>
                        <div class="lg:col-span-2">
                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">2. Nguồn bài / đề</label>
                            <select onchange="window.TRITHUC.setAdminResultSourceFilterV45(this.value)"
                                class="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-600">
                                <option value="all" ${state.adminResultSourceFilter === 'all' ? 'selected' : ''}>Tất cả nguồn</option>
                                <option value="lesson" ${state.adminResultSourceFilter === 'lesson' ? 'selected' : ''}>📚 Đề theo Bài học</option>
                                <option value="mock" ${state.adminResultSourceFilter === 'mock' ? 'selected' : ''}>🔥 Đề Thi thử THPT</option>
                                <option value="bank" ${state.adminResultSourceFilter === 'bank' ? 'selected' : ''}>📝 Kho đề chung</option>
                            </select>
                        </div>
                        <div class="lg:col-span-3">
                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">3. Liên kết Bài học</label>
                            <select onchange="window.TRITHUC.setAdminResultLessonFilterV45(this.value)"
                                class="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-600">
                                <option value="all" ${state.adminResultLessonFilter === 'all' ? 'selected' : ''}>📚 Tất cả bài học (${data.lessonsInScope.length})</option>
                                ${data.lessonsInScope.map(l => {
                                    const cnt = data.attemptsByLesson[l.id] || 0;
                                    return `<option value="${l.id}" ${state.adminResultLessonFilter === l.id ? 'selected' : ''}>${escapeHtml(l.label)}${cnt > 0 ? ` (${cnt} lượt)` : ''}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div class="lg:col-span-3">
                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">4. Đề kiểm tra cụ thể</label>
                            <select onchange="window.TRITHUC.setAdminResultFilter(this.value)"
                                class="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 outline-none focus:border-blue-600">
                                <option value="all" ${state.adminResultExamFilter === 'all' ? 'selected' : ''}>📝 Tất cả đề trong bộ lọc (${data.examsInScope.length} đề)</option>
                                ${data.examsInScope.map(ex => {
                                    const cnt = data.attemptsByExam[ex.id] || 0;
                                    return `<option value="${ex.id}" ${String(state.adminResultExamFilter) === String(ex.id) ? 'selected' : ''}>[${escapeHtml(ex.code || 'Đề')}] ${escapeHtml(ex.title)}${cnt > 0 ? ` (${cnt} lượt)` : ''}</option>`;
                                }).join('')}
                            </select>
                        </div>
                        <div class="lg:col-span-2">
                            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">5. Tìm HS / Lớp</label>
                            <div class="relative">
                                <input id="adminResultSearchInpV45" type="text" value="${escapeHtml(state.adminResultStudentSearch || '')}"
                                    oninput="window.TRITHUC.setAdminResultStudentSearchV45(this.value)"
                                    placeholder="Tên HS, lớp, TK..."
                                    class="w-full px-2.5 py-2 pr-7 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none focus:border-blue-600" />
                                ${hasActiveFilter ? `
                                    <button type="button" onclick="window.TRITHUC.resetAdminResultFiltersV45()"
                                        title="Xóa toàn bộ bộ lọc"
                                        class="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-700 font-black text-xs">✕</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div class="inline-flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
                            <button type="button" onclick="window.TRITHUC.setAdminResultSubTabV45('overview')"
                                class="px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${subTab === 'overview' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                📊 1. Phổ Điểm &amp; Thống Kê Theo Bài/Đề
                            </button>
                            <button type="button" onclick="window.TRITHUC.setAdminResultSubTabV45('compare')"
                                class="px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${subTab === 'compare' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                📈 2. Bảng So Sánh Học Sinh (${compareRows.length} HS × ${compareCols.length} ${compareAxis === 'lesson' ? 'bài' : 'đề'})
                            </button>
                            <button type="button" onclick="window.TRITHUC.setAdminResultSubTabV45('attempts')"
                                class="px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${subTab === 'attempts' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                📋 3. Chi Tiết Từng Lượt Nộp (${list.length})
                            </button>
                        </div>
                        ${hasActiveFilter ? `
                            <button type="button" onclick="window.TRITHUC.resetAdminResultFiltersV45()"
                                class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition">
                                ↺ Đặt lại bộ lọc
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
                    <div class="bg-white p-3 rounded-2xl border border-slate-200">
                        <div class="text-[10px] font-black text-slate-400 uppercase">Lượt nộp</div>
                        <div class="text-lg font-black text-slate-900 mt-0.5">${list.length}</div>
                    </div>
                    <div class="bg-white p-3 rounded-2xl border border-slate-200">
                        <div class="text-[10px] font-black text-slate-400 uppercase">Số HS làm</div>
                        <div class="text-lg font-black text-indigo-700 mt-0.5">${uniqueStudentsSet.size}</div>
                    </div>
                    <div class="bg-white p-3 rounded-2xl border border-slate-200">
                        <div class="text-[10px] font-black text-slate-400 uppercase">Điểm TB / Trung vị</div>
                        <div class="text-sm sm:text-base font-black text-blue-700 mt-1">${avg} / ${median}</div>
                    </div>
                    <div class="bg-white p-3 rounded-2xl border border-slate-200">
                        <div class="text-[10px] font-black text-slate-400 uppercase">Cao nhất / Thấp nhất</div>
                        <div class="text-sm sm:text-base font-black text-slate-800 mt-1">${list.length ? `${maxScore.toFixed(2)} / ${minScore.toFixed(2)}` : '—'}</div>
                    </div>
                    <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                        <div class="text-[10px] font-black text-emerald-800 uppercase">Giỏi (≥ 8.0)</div>
                        <div class="text-lg font-black text-emerald-700 mt-0.5">${gioi}</div>
                    </div>
                    <div class="bg-blue-50 p-3 rounded-2xl border border-blue-200">
                        <div class="text-[10px] font-black text-blue-800 uppercase">Khá (6.5–7.9)</div>
                        <div class="text-lg font-black text-blue-700 mt-0.5">${kha}</div>
                    </div>
                    <div class="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                        <div class="text-[10px] font-black text-amber-800 uppercase">TB (5.0–6.4)</div>
                        <div class="text-lg font-black text-amber-700 mt-0.5">${tb} <span class="text-[10px]">(${passRate}% Đạt)</span></div>
                    </div>
                    <div class="bg-rose-50 p-3 rounded-2xl border border-rose-200">
                        <div class="text-[10px] font-black text-rose-800 uppercase">Yếu (&lt; 5.0)</div>
                        <div class="text-lg font-black text-rose-600 mt-0.5">${yeu}</div>
                    </div>
                </div>

                ${subTab === 'overview' ? `
                    <div class="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <h4 class="text-xs sm:text-sm font-black text-slate-900 uppercase m-0">📊 Biểu Đồ Phổ Điểm 10 Mức (Thang điểm 10)</h4>
                            <span class="text-[11px] font-bold text-slate-500">Tổng mẫu phân tích: <b>${list.length} lượt nộp</b> • Tỷ lệ Đạt (≥5.0): <b class="text-emerald-700">${passRate}%</b></span>
                        </div>
                        <div class="grid grid-cols-10 gap-1.5 sm:gap-2.5 items-end h-44 pt-6 px-2 border-b border-slate-200">
                            ${bins.map(b => {
                                const pctH = list.length > 0 ? Math.max(b.count > 0 ? 10 : 2, Math.round((b.count / maxBin) * 100)) : 3;
                                const pctShare = list.length > 0 ? ((b.count / list.length) * 100).toFixed(0) : 0;
                                return `
                                <div class="flex flex-col items-center justify-end h-full gap-1">
                                    <div class="text-[10px] font-black ${b.count > 0 ? 'text-slate-800' : 'text-slate-300'}">${b.count > 0 ? `${b.count} (${pctShare}%)` : '0'}</div>
                                    <div class="w-full max-w-[44px] rounded-t-lg transition-all ${b.count > 0 ? b.color : 'bg-slate-100'}" style="height:${pctH}%;"></div>
                                    <div class="text-[10.5px] font-extrabold text-slate-600 pt-1">${b.label}</div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>

                    <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        <div class="px-4 sm:px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                            <h4 class="text-xs sm:text-sm font-black text-slate-900 uppercase m-0">📚 Tổng Hợp Kết Quả Liên Kết Theo Từng Bài Học &amp; Đề Thi (${groupedExamStats.length} đề có dữ liệu)</h4>
                            <span class="text-[11px] font-semibold text-slate-500">Bấm "🔎 Xem chi tiết" để lọc nhanh danh sách học sinh của đề đó</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                                        <th class="p-3">Bài học / Phân loại</th>
                                        <th class="p-3">Đề kiểm tra</th>
                                        <th class="p-3 text-center">Số HS / Lượt</th>
                                        <th class="p-3 text-center">Điểm TB</th>
                                        <th class="p-3 text-center">Cao nhất / Thấp nhất</th>
                                        <th class="p-3 text-center">Tỷ lệ Đạt / Giỏi</th>
                                        <th class="p-3 text-center">Cảnh báo AI/Tab</th>
                                        <th class="p-3 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${groupedExamStats.length === 0 ? `
                                        <tr><td colspan="8" class="p-8 text-center text-slate-400 font-bold">Chưa có lượt làm bài nào khớp với bộ lọc hiện tại.</td></tr>
                                    ` : groupedExamStats.map(g => {
                                        const gAvg = (g.sum / g.attempts).toFixed(2);
                                        const gPass = ((g.passCnt / g.attempts) * 100).toFixed(0);
                                        const gGioi = ((g.gioiCnt / g.attempts) * 100).toFixed(0);
                                        const srcBadge = g.sourceType === 'mock'
                                            ? '<span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold text-[10px]">🔥 Thi thử</span>'
                                            : (g.sourceType === 'lesson' ? '<span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[10px]">📚 Bài học</span>' : '<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-extrabold text-[10px]">📝 Kho chung</span>');
                                        return `
                                        <tr class="hover:bg-blue-50/30 transition">
                                            <td class="p-3">
                                                <div class="flex items-center gap-1.5 flex-wrap">${srcBadge}<span class="font-bold text-slate-700">${escapeHtml(g.lessonLabel)}</span></div>
                                            </td>
                                            <td class="p-3 font-extrabold text-slate-900">
                                                ${g.examCode ? `<span class="font-mono-code text-blue-700 mr-1">[${escapeHtml(g.examCode)}]</span>` : ''}${escapeHtml(g.examTitle)}
                                            </td>
                                            <td class="p-3 text-center font-bold text-slate-700">${g.stuSet.size} HS / ${g.attempts} lượt</td>
                                            <td class="p-3 text-center">
                                                <span class="px-2.5 py-0.5 rounded-lg border font-black ${scoreBadgeCls(parseFloat(gAvg))}">${gAvg}</span>
                                            </td>
                                            <td class="p-3 text-center font-mono-code text-slate-700">${g.max.toFixed(2)} / ${g.min.toFixed(2)}</td>
                                            <td class="p-3 text-center font-bold">
                                                <span class="text-emerald-700">${gPass}% Đạt</span> · <span class="text-blue-700">${gGioi}% Giỏi</span>
                                            </td>
                                            <td class="p-3 text-center">
                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${g.warnCnt > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                                                    ${g.warnCnt > 0 ? `⚠️ ${g.warnCnt} lượt` : '🛡️ 0'}
                                                </span>
                                            </td>
                                            <td class="p-3 text-right">
                                                ${g.examId ? `
                                                    <button type="button" onclick="window.TRITHUC.focusSingleExamResultV45('${escapeJsAttr(g.examId)}')"
                                                        class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] transition">
                                                        🔎 Xem chi tiết
                                                    </button>
                                                ` : ''}
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : subTab === 'compare' ? `
                    <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        <div class="px-4 sm:px-5 py-3.5 bg-indigo-50/70 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h4 class="text-xs sm:text-sm font-black text-indigo-950 uppercase m-0">📈 Ma Trận So Sánh Điểm Học Sinh Theo ${compareAxis === 'lesson' ? 'Từng Bài Học' : 'Từng Đề Thi'}</h4>
                                <p class="text-[11px] font-semibold text-slate-600 m-0 mt-0.5">Mỗi ô hiển thị <b>điểm cao nhất</b> của học sinh ở bài/đề tương ứng (kèm số lần làm). Bấm vào điểm để xem lại bài làm chi tiết.</p>
                            </div>
                            <div class="inline-flex bg-white p-1 rounded-xl border border-indigo-200 gap-1">
                                <button type="button" onclick="window.TRITHUC.setAdminResultCompareAxisV45('exam')"
                                    class="px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${compareAxis === 'exam' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
                                    📝 So sánh theo từng Đề thi
                                </button>
                                <button type="button" onclick="window.TRITHUC.setAdminResultCompareAxisV45('lesson')"
                                    class="px-3 py-1 rounded-lg text-[11px] font-extrabold transition ${compareAxis === 'lesson' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
                                    📚 So sánh theo từng Bài học
                                </button>
                            </div>
                        </div>
                        <div class="overflow-x-auto custom-scrollbar">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold text-[10.5px]">
                                        <th class="p-3 sticky left-0 bg-slate-100 z-10 min-w-[190px] border-r border-slate-200">Học sinh / Lớp</th>
                                        ${compareCols.map(c => `
                                            <th class="p-2.5 text-center min-w-[96px] border-r border-slate-200" title="${escapeHtml(c.fullLabel)}">
                                                <div class="truncate max-w-[130px] mx-auto">${escapeHtml(c.shortLabel)}</div>
                                            </th>
                                        `).join('')}
                                        <th class="p-2.5 text-center bg-blue-50 text-blue-900 min-w-[78px] border-r border-slate-200">Số bài</th>
                                        <th class="p-2.5 text-center bg-blue-50 text-blue-900 min-w-[82px] border-r border-slate-200">ĐTB chung</th>
                                        <th class="p-2.5 text-center bg-indigo-50 text-indigo-900 min-w-[92px]">Tiến bộ</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${compareRows.length === 0 ? `
                                        <tr><td colspan="${compareCols.length + 4}" class="p-10 text-center text-slate-400 font-bold">Chưa có dữ liệu làm bài để so sánh giữa các học sinh.</td></tr>
                                    ` : compareRows.map((r, rIdx) => `
                                        <tr class="hover:bg-slate-50 transition">
                                            <td class="p-3 sticky left-0 bg-white z-10 border-r border-slate-200">
                                                <div class="font-extrabold text-slate-900"><span class="text-slate-400 mr-1">#${rIdx + 1}</span>${escapeHtml(r.name)}</div>
                                                <div class="text-[10.5px] font-semibold text-slate-500">${escapeHtml(r.cls)}${r.username ? ` • TK: ${escapeHtml(r.username)}` : ''}</div>
                                            </td>
                                            ${compareCols.map(c => {
                                                const cell = r.cells[c.key];
                                                if (!cell) return `<td class="p-2 text-center text-slate-300 font-bold border-r border-slate-100">—</td>`;
                                                return `
                                                <td class="p-2 text-center border-r border-slate-100">
                                                    <button type="button" onclick="window.TRITHUC.reviewHistoricalAttempt('${cell.bestAttemptId}')"
                                                        title="Bấm xem lại bài làm tốt nhất (${cell.count} lượt nộp)"
                                                        class="px-2 py-0.5 rounded-lg border font-black text-xs hover:scale-105 transition ${scoreBadgeCls(cell.best)}">
                                                        ${cell.best.toFixed(2)}
                                                    </button>
                                                    ${cell.count > 1 ? `<div class="text-[9.5px] font-bold text-slate-400 mt-0.5">${cell.count} lần</div>` : ''}
                                                </td>`;
                                            }).join('')}
                                            <td class="p-2.5 text-center font-extrabold text-slate-700 bg-blue-50/30 border-r border-slate-100">${r.doneCount}/${compareCols.length}</td>
                                            <td class="p-2.5 text-center bg-blue-50/40 border-r border-slate-100">
                                                <span class="px-2.5 py-0.5 rounded-lg border font-black ${scoreBadgeCls(r.avg)}">${r.avg.toFixed(2)}</span>
                                            </td>
                                            <td class="p-2.5 text-center font-black text-xs bg-indigo-50/20">
                                                ${r.trend === null
                                                    ? '<span class="text-slate-400 font-semibold">—</span>'
                                                    : (r.trend > 0
                                                        ? `<span class="text-emerald-700">▲ +${r.trend.toFixed(2)}</span>`
                                                        : (r.trend < 0
                                                            ? `<span class="text-rose-600">▼ ${r.trend.toFixed(2)}</span>`
                                                            : '<span class="text-slate-500">▬ 0.00</span>'))}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : `
                    <div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        <div class="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span class="font-black text-slate-800 uppercase">📋 Danh sách chi tiết từng lượt nộp (${list.length} lượt)</span>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] font-bold text-slate-500">Sắp xếp:</span>
                                <select onchange="window.TRITHUC.setAdminResultSortByV45(this.value)"
                                    class="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs outline-none">
                                    <option value="score_desc" ${state.adminResultSortBy === 'score_desc' ? 'selected' : ''}>Điểm cao → thấp</option>
                                    <option value="score_asc" ${state.adminResultSortBy === 'score_asc' ? 'selected' : ''}>Điểm thấp → cao</option>
                                    <option value="time_desc" ${state.adminResultSortBy === 'time_desc' ? 'selected' : ''}>Nộp mới nhất</option>
                                    <option value="name_asc" ${state.adminResultSortBy === 'name_asc' ? 'selected' : ''}>Tên học sinh (A→Z)</option>
                                </select>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                                        <th class="p-3">Hạng</th>
                                        <th class="p-3">Học sinh &amp; Tài khoản</th>
                                        <th class="p-3">Bài học liên kết &amp; Đề thi</th>
                                        <th class="p-3 text-center">Chi tiết 3 phần</th>
                                        <th class="p-3 text-center">Giám sát AI / Tab</th>
                                        <th class="p-3 text-center">Điểm số</th>
                                        <th class="p-3 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${list.length === 0 ? `
                                        <tr><td colspan="7" class="p-8 text-center text-slate-400 font-bold">Chưa có dữ liệu nộp bài trong bộ lọc này.</td></tr>
                                    ` : list.map((h, i) => {
                                        const totalErr = h.tabSwitches + h.aiSuspicionCount;
                                        return `
                                        <tr class="hover:bg-slate-50">
                                            <td class="p-3 font-black text-slate-500">#${i + 1}</td>
                                            <td class="p-3">
                                                <div class="font-extrabold text-slate-900">${escapeHtml(h.name)}</div>
                                                <div class="text-[10.5px] text-slate-500 font-semibold">${escapeHtml(h.cls)} • TK: ${escapeHtml(h.username || '---')}</div>
                                            </td>
                                            <td class="p-3">
                                                <div class="text-[10.5px] font-bold text-blue-700">${escapeHtml(h.lessonLabel)}</div>
                                                <div class="font-bold text-slate-800">${escapeHtml(h.examTitle)}</div>
                                            </td>
                                            <td class="p-3 text-center font-mono-code text-[11px] text-slate-600">${escapeHtml(h.detail)}</td>
                                            <td class="p-3 text-center">
                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${totalErr > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
                                                    ${totalErr > 0 ? `⚠️ ${h.tabSwitches} lỗi • ${h.aiSuspicionCount} AI` : '🛡️ An toàn'}
                                                </span>
                                            </td>
                                            <td class="p-3 text-center">
                                                <span class="px-2.5 py-0.5 rounded-lg border font-black text-sm ${scoreBadgeCls(h.score)}">${h.score.toFixed(2)}</span>
                                            </td>
                                            <td class="p-3 text-right space-x-1 whitespace-nowrap">
                                                <button onclick="window.TRITHUC.resendSingleAttemptToGForm('${h.id}')"
                                                    title="Gửi lại kết quả về Google Form"
                                                    class="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold">
                                                    📤 Form
                                                </button>
                                                <button onclick="window.TRITHUC.reviewHistoricalAttempt('${h.id}')"
                                                    class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold">
                                                    🔍 Xem bài
                                                </button>
                                                <button onclick="window.TRITHUC.deleteHistoryRecord('${h.id}')"
                                                    class="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold">
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `}
            </div>`;
        }