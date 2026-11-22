function renderResultView() {
            const res = state.lastSubmitResult;
            const ex = state.selectedExam;
            if (!res || !ex) return renderStudentHomeView();
            const qList = getExamQuestionsList(ex);

            const scoreNum = parseFloat(res.score || 0);
            const tierLabel = scoreNum >= 8.5 ? '🌟 Xuất sắc' : (scoreNum >= 7 ? '👏 Khá tốt' : (scoreNum >= 5 ? '✅ Đạt yêu cầu' : '📘 Cần ôn tập thêm'));
            return `
            <div class="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
                <div class="v5-surface-card max-w-xl w-full p-6 sm:p-8 shadow-xl space-y-5">
                    <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div class="flex items-center gap-2">
                            <span class="v5-version-pill">TRITHUC5.0 • V5.0</span>
                            ${ex.showAnswers !== false ? `<span class="v5-stat-chip">${tierLabel}</span>` : ''}
                        </div>
                        ${window.TRITHUC_THEME ? window.TRITHUC_THEME.renderSwitcherHtml('compact') : ''}
                    </div>
                    <div class="text-center space-y-1">
                        <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 m-0 tracking-tight">Kết Quả Bài Kiểm Tra</h2>
                        <div class="text-xs sm:text-sm font-semibold text-slate-600">
                            Thí sinh: <b class="text-slate-900">${escapeHtml(res.name)}</b> • Lớp <b>${escapeHtml(res.class)}</b> • TK: <code class="font-mono-code text-blue-700">${escapeHtml(res.username || '')}</code>
                        </div>
                    </div>
                    ${res.isAdminEphemeral ? `
                        <div class="p-3 rounded-2xl bg-indigo-50 border-2 border-indigo-300 text-xs font-extrabold text-indigo-900">
                            🛡️ <b>Chế độ Quản trị viên làm thử:</b> Hệ thống đã tự động xóa luôn phiên làm bài này, <b>không lưu vào Lịch sử & Bảng vàng</b>.
                        </div>
                    ` : `
                        <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-center gap-2">
                            <span id="studentResultSyncStatusV475" class="text-xs font-extrabold ${state.lastResultSyncOkV475 ? 'text-emerald-700' : 'text-amber-700'}">
                                ${escapeHtml(state.lastResultSyncStatusV475 || '⏳ Đang gửi điểm về bảng Phổ điểm Giáo viên...')}
                            </span>
                            <button type="button" onclick="window.TRITHUC.retrySyncLastResultV475()"
                                class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[11px]">
                                🔄 Gửi lại điểm
                            </button>
                        </div>
                    `}

                    ${ex.showAnswers !== false ? `
                        <div class="bg-blue-50/90 border border-blue-200 rounded-2xl p-5">
                            <div class="text-xs font-bold uppercase tracking-wider text-blue-700">Điểm số đạt được</div>
                            <div class="text-5xl font-black text-red-600 my-2">${res.score} Điểm</div>
                            <div class="flex flex-wrap justify-center gap-2 mt-2 text-xs font-bold text-slate-700">
                                ${(res.calc.p1Total || 0) > 0 ? `<span class="bg-white px-3 py-1 rounded-lg border border-blue-100">Phần I: ${res.calc.p1c}/${res.calc.p1Total} (${res.calc.p1p || (res.calc.p1c * 0.25).toFixed(2)}/${res.calc.p1Max || (res.calc.p1Total * 0.25).toFixed(2)}đ)</span>` : ''}
                                ${(res.calc.p2Total || 0) > 0 ? `<span class="bg-white px-3 py-1 rounded-lg border border-blue-100">Phần II: ${res.calc.p2p}/${res.calc.p2Max || Number(res.calc.p2Total).toFixed(2)}đ</span>` : ''}
                                ${(res.calc.p3Total || 0) > 0 ? `<span class="bg-white px-3 py-1 rounded-lg border border-blue-100">Phần III: ${res.calc.p3c}/${res.calc.p3Total} (${res.calc.p3p || (res.calc.p3c * 0.5).toFixed(2)}/${res.calc.p3Max || (res.calc.p3Total * 0.5).toFixed(2)}đ)</span>` : ''}
                                ${(res.calc.p4Total || 0) > 0 ? `<span class="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 text-emerald-800">Phần IV (TL→TLN): ${res.calc.p4c}/${res.calc.p4Total} (${res.calc.p4p}/${res.calc.p4Max || Number(res.calc.p4Total).toFixed(2)}đ)</span>` : ''}
                            </div>
                            ${res.calc.isScaled ? `
                                <div class="mt-2 text-[11px] font-bold text-indigo-700">
                                    ⚖️ Điểm gốc: ${res.calc.rawTotal} / ${res.calc.maxRaw}đ → Đã quy đổi về thang 10,00 điểm
                                </div>
                            ` : (res.calc.maxRaw && Math.abs(Number(res.calc.maxRaw) - 10) > 0.01 ? `
                                <div class="mt-2 text-[11px] font-bold text-slate-600">
                                    📊 Tổng điểm gốc đề thi: ${res.calc.rawTotal} / ${res.calc.maxRaw} điểm
                                </div>
                            ` : '')}
                        </div>
                    ` : `
                        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-bold text-amber-900">
                            🔒 Giáo viên đã thiết lập ẩn điểm và đáp án cho đề thi này. Bài làm của bạn đã được ghi nhận!
                        </div>
                    `}

                    ${ex.showAnswers !== false && res.calc ? (() => {
                        const wrongItems = [];
                        qList.forEach((q, gIdx) => {
                            const diag = getQuestionReviewDiagnostic(q, res.calc);
                            if (diag && !diag.isCorrect) {
                                wrongItems.push({ q, gIdx, diag });
                            }
                        });
                        if (wrongItems.length === 0) {
                            return `<div class="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-xs font-extrabold text-emerald-800">🌟 Xuất sắc! Bạn đã trả lời đúng tuyệt đối toàn bộ ${qList.length}/${qList.length} câu hỏi!</div>`;
                        }
                        return `
                        <div class="bg-rose-50/90 border border-rose-200 rounded-2xl p-3.5 text-left space-y-2">
                            <div class="text-xs font-extrabold text-rose-800 uppercase flex items-center justify-between">
                                <span>⚠️ Chú thích ${wrongItems.length} câu làm sai / mất điểm cần xem lại:</span>
                                <span class="text-[11px] font-bold text-rose-600">(Bấm vào câu để xem lỗi sai)</span>
                            </div>
                            <div class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                                ${wrongItems.map(item => `
                                    <button type="button" onclick="window.TRITHUC.enterV97ReviewAtQuestion(${item.gIdx})"
                                        class="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-[11px] font-extrabold transition">
                                        ❌ P${item.q.part}•Câu ${item.q.num}
                                    </button>
                                `).join('')}
                            </div>
                        </div>`;
                    })() : ''}

                    <div class="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-xs text-left text-slate-600 space-y-1">
                        <div>🧾 <b>Mã biên nhận:</b> <code class="font-bold text-blue-700">#${escapeHtml(res.id.slice(-6))}</code></div>
                        <div>⏱ <b>Thời gian làm bài:</b> ${formatDuration(res.startTime, res.endTime)}</div>
                        <div>🛡️ <b>Giám sát Phòng thi & AI:</b> ${res.tabSwitches} lỗi thoát màn hình • ${res.aiSuspicionCount || 0} nghi vấn AI</div>
                    </div>

                    <div class="space-y-2.5">
                        ${ex.showAnswers !== false ? `
                            <button onclick="window.TRITHUC.enterV97ReviewMode()"
                                class="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition">
                                🔍 Xem lại bài & Lời giải trên giao diện V9.7pro
                            </button>
                            <button onclick="window.TRITHUC.openFullSolutionModal()"
                                class="w-full py-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-500 font-bold text-sm transition">
                                📄 Xem Toàn Bộ Bảng Đáp Án & Lời Giải Chi Tiết
                            </button>
                        ` : ''}
                        <button onclick="window.TRITHUC.goStudentHome()"
                            class="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition">
                            🏠 Quay Về Trang Chủ
                        </button>
                    </div>
                </div>
                ${state.showFullSolutionModal ? renderFullSolutionModal(ex, qList) : ''}
            </div>`;
        }