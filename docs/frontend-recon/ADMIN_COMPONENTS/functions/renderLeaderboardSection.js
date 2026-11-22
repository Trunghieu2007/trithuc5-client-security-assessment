function renderLeaderboardSection() {
            purgeAdminTestHistoryRecords();
            const sorted = [...state.history].sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
            const total = sorted.length;
            const avg = total > 0 ? (sorted.reduce((s, r) => s + parseFloat(r.score || 0), 0) / total).toFixed(2) : '0.00';
            const maxS = total > 0 ? Math.max(...sorted.map(r => parseFloat(r.score || 0))).toFixed(2) : '0.00';
            const top3 = sorted.slice(0, 3);

            return `
            <div class="space-y-4">
                <div class="v5-context-strip">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h2 class="text-base sm:text-lg font-extrabold text-slate-900 m-0 tracking-tight">🏆 Bảng Vàng Vinh Danh &amp; Tra Cứu Điểm Số</h2>
                            <span class="v5-version-pill">Bảo mật V5.0</span>
                        </div>
                        <p class="text-xs text-slate-500 m-0 mt-1">Xếp hạng kết quả làm bài trực tuyến của học sinh (ẩn bài làm &amp; lời giải công khai để bảo mật ngân hàng đề).</p>
                    </div>
                    ${state.isAdminLoggedIn ? `
                    <button onclick="window.TRITHUC.exportHistoryToExcel('all')"
                        class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition shrink-0">
                        📤 Xuất Bảng Điểm Excel (.xlsx)
                    </button>
                    ` : `
                    <span class="v5-stat-chip shrink-0">🛡️ Chế độ Bảo mật Đề thi V5.0</span>
                    `}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="v5-kpi-card">
                        <div class="text-xs font-semibold text-slate-500">Tổng số lượt nộp bài</div>
                        <div class="text-2xl font-extrabold text-slate-900 v5-tabular">${total} <span class="text-xs font-semibold text-slate-400">lượt</span></div>
                    </div>
                    <div class="v5-kpi-card">
                        <div class="text-xs font-semibold text-slate-500">Điểm trung bình hệ thống</div>
                        <div class="text-2xl font-extrabold text-blue-700 v5-tabular">${avg} <span class="text-xs font-semibold text-slate-400">/ 10</span></div>
                    </div>
                    <div class="v5-kpi-card">
                        <div class="text-xs font-semibold text-slate-500">Điểm cao nhất đạt được</div>
                        <div class="text-2xl font-extrabold text-emerald-600 v5-tabular">${maxS} <span class="text-xs font-semibold text-slate-400">điểm</span></div>
                    </div>
                </div>

                ${top3.length > 0 ? `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    ${top3.map((h, idx) => `
                        <div class="v5-podium-card v5-podium-${idx + 1}">
                            <div class="min-w-0">
                                <div class="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                                    ${idx === 0 ? '🥇 Hạng Nhất' : (idx === 1 ? '🥈 Hạng Nhì' : '🥉 Hạng Ba')}
                                </div>
                                <div class="text-sm font-extrabold text-slate-900 truncate mt-0.5">${escapeHtml(h.name)}</div>
                                <div class="text-[11px] font-semibold text-slate-500 truncate">${escapeHtml(h.class)} • ${escapeHtml(h.examTitle || 'Đề kiểm tra')}</div>
                            </div>
                            <div class="text-xl font-black text-blue-700 v5-tabular shrink-0">${h.score}đ</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div class="v5-surface-card overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wide">
                                    <th class="py-3 px-4">Hạng</th>
                                    <th class="py-3 px-4">Họ và tên học sinh</th>
                                    <th class="py-3 px-4">Lớp / SBD</th>
                                    <th class="py-3 px-4">Đề kiểm tra</th>
                                    <th class="py-3 px-4 text-center">Điểm số</th>
                                    <th class="py-3 px-4 text-center">Chi tiết 3 phần</th>
                                    <th class="py-3 px-4 text-center">Giám sát AI / Tab</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${sorted.length === 0 ? `
                                    <tr>
                                        <td colspan="7">
                                            <div class="v5-empty-state">
                                                <div class="v5-empty-icon">🏆</div>
                                                <div class="text-sm font-bold text-slate-700">Chưa có lượt nộp bài nào trên Bảng vàng</div>
                                                <div class="text-xs text-slate-500">Hoàn thành một đề kiểm tra trong Kho Đề Thi để ghi danh kết quả đầu tiên.</div>
                                            </div>
                                        </td>
                                    </tr>
                                ` : sorted.map((h, i) => {
                                    const ex = state.exams.find(x => String(x.id) === String(h.examId));
                                    const totalErr = (Number(h.tabSwitches) || 0) + (Number(h.aiSuspicionCount) || 0);
                                    return `
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="py-3 px-4 font-extrabold v5-tabular ${i === 0 ? 'text-amber-500 text-sm' : (i === 1 ? 'text-slate-500' : (i === 2 ? 'text-orange-600' : 'text-slate-400'))}">
                                            ${i === 0 ? '🥇 #1' : (i === 1 ? '🥈 #2' : (i === 2 ? '🥉 #3' : '#' + (i + 1)))}
                                        </td>
                                        <td class="py-3 px-4 font-bold text-slate-900">${escapeHtml(h.name)}</td>
                                        <td class="py-3 px-4 font-semibold text-slate-600">${escapeHtml(h.class)} ${h.stt ? `<span class="text-slate-400">(SBD: ${escapeHtml(h.stt)})</span>` : ''}</td>
                                        <td class="py-3 px-4 font-semibold text-slate-700 max-w-[260px] truncate">${escapeHtml(h.examTitle || ex?.title || 'Đề kiểm tra')}</td>
                                        <td class="py-3 px-4 text-center font-black text-blue-700 text-sm v5-tabular">${h.score}</td>
                                        <td class="py-3 px-4 text-center font-mono-code text-[11px] text-slate-600">${escapeHtml(h.detail || '---')}</td>
                                        <td class="py-3 px-4 text-center">
                                            <span class="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${totalErr > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
                                                ${totalErr > 0 ? `⚠️ ${h.tabSwitches || 0} lỗi • ${h.aiSuspicionCount || 0} AI` : '🛡️ An toàn'}
                                            </span>
                                        </td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        }