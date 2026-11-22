function renderDoingExamView() {
            const ex = state.selectedExam;
            if (!ex) return renderStudentHomeView();
            const qList = getExamQuestionsList(ex);
            const conf = ex.config || { p1: 12, p2: 4, p3: 6, p4: 0 };
            const limit = Number(ex.maxTabSwitches || 3);
            const isRev = Boolean(state.isReviewMode);
            const revCalc = isRev ? calculateAttemptScore(formatCurrentAnsForScoring(conf), ex.correctAnswers, conf, qList, ex.scoring) : null;
            const stu = state.loggedInStudent || { name: 'Học sinh', class: '12A1', stt: '01', username: 'hs' };

            let answeredCount = 0;
            qList.forEach(q => {
                if (getQuestionAnswerStatus(q).answered) answeredCount++;
            });

            const p1Questions = qList.filter(q => q.part === 1);
            const p2Questions = qList.filter(q => q.part === 2);
            const p3Questions = qList.filter(q => q.part === 3);
            const p4Questions = qList.filter(q => q.part === 4);
            const exSc = normalizeExamScoringV467(ex.scoring);
            const p4TotalPts = p4Questions.reduce((s, q) => s + ((exSc.useIndividualP4Points && Number(q.points) > 0) ? Number(q.points) : exSc.p4Unit), 0);
            const isSidebarOpen = isExamSidebarCurrentlyOpen();
            const isCompact = isCompactExamViewport();

            return `
            <div id="examRoomViewport" class="fixed inset-0 z-50 bg-[#f1f5f9] flex flex-col overflow-hidden">
                <!-- HEADER CHUẨN V9.7PRO -->
                <header class="bg-white border-b border-slate-200 px-2.5 sm:px-6 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-xs z-20">
                    <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button onclick="window.TRITHUC.exitExamRoom()"
                            class="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 transition">
                            ← Thoát
                        </button>
                        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2563eb] text-white font-bold text-base sm:text-xl flex items-center justify-center shrink-0 shadow-xs">
                            Σ
                        </div>
                        <div class="min-w-0 flex-1">
                            <h1 class="text-xs sm:text-base font-bold text-slate-900 truncate m-0">
                                ${escapeHtml(ex.title)}
                            </h1>
                            <p class="text-[11px] sm:text-xs font-medium text-slate-500 truncate m-0">
                                Thí sinh: <b class="text-blue-700">${escapeHtml(stu.name)}</b> (${escapeHtml(stu.class)} • SBD: ${escapeHtml(stu.stt || '01')})
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-wrap">
                        ${window.TRITHUC_THEME ? window.TRITHUC_THEME.renderSwitcherHtml('compact') : ''}
                        <div class="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] sm:text-xs font-bold">
                            <button onclick="window.TRITHUC.setExamDisplayStyle('v97single')"
                                class="px-2 sm:px-2.5 py-1 rounded-lg transition ${state.examDisplayStyle === 'v97single' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                ⚡ Từng câu
                            </button>
                            <button onclick="window.TRITHUC.setExamDisplayStyle('allQuestions')"
                                class="px-2 sm:px-2.5 py-1 rounded-lg transition ${state.examDisplayStyle === 'allQuestions' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}">
                                📄 Toàn đề (${qList.length})
                            </button>
                        </div>

                        <!-- NÚT ẨN / HIỆN BẢNG CÂU HỎI TRÊN MỌI THIẾT BỊ -->
                        <button type="button" id="v97ToggleSidebarHeaderBtn"
                            onclick="window.TRITHUC.toggleExamSidebar()"
                            class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 shadow-2xs ${isSidebarOpen ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'}"
                            title="${isSidebarOpen ? 'Ẩn Bảng Câu Hỏi để mở rộng toàn màn hình đề thi' : 'Hiện Bảng Câu Hỏi để chuyển câu nhanh'}">
                            <span>☰</span>
                            <span>${isSidebarOpen ? 'Ẩn Bảng Câu Hỏi' : 'Bảng Câu Hỏi'}</span>
                            <span id="v97HeaderAnsweredBadge" class="px-1.5 py-0.5 rounded-md text-[10px] font-black ${isSidebarOpen ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'}">${answeredCount}/${qList.length}</span>
                        </button>

                        ${!isRev ? `
                            <div onclick="window.TRITHUC.reEnterExamFullscreen()"
                                class="hidden md:flex px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer items-center gap-1.5 ${(state.tabSwitches > 0 || state.aiSuspicionCount > 0) ? 'bg-red-50 text-red-700 border-red-300 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}"
                                title="Trạng thái giám sát bảo mật & chống AI">
                                <span>🛡️</span>
                                <span class="hidden xl:inline">Bảo mật: BẬT</span>
                                <span>(${state.tabSwitches}/${limit} lỗi${state.aiSuspicionCount > 0 ? ` • ${state.aiSuspicionCount} AI` : ''})</span>
                            </div>
                            <div class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm sm:text-lg flex items-center gap-1">
                                <span>⏱</span>
                                <span id="v97TimerDisplay">${formatTimeClock(state.timeLeft)}</span>
                            </div>
                            <button onclick="window.TRITHUC.openConfirmSubmit()"
                                class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1 transition">
                                <span>✔</span>
                                <span>Nộp Bài</span>
                            </button>
                        ` : `
                            <div class="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs sm:text-sm">
                                🎯 Điểm: ${revCalc.total} / 10
                            </div>
                            <button onclick="window.TRITHUC.openFullSolutionModal()"
                                class="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition">
                                📄 Bảng giải
                            </button>
                        `}
                    </div>
                </header>
                <!-- THANH TIẾN ĐỘ LÀM BÀI TRỰC QUAN V4.5.0 -->
                <div class="w-full h-1.5 bg-slate-200 shrink-0 overflow-hidden" title="Tiến độ hoàn thành: ${answeredCount}/${qList.length} câu">
                    <div class="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-300" style="width:${qList.length > 0 ? Math.round((answeredCount / qList.length) * 100) : 0}%"></div>
                </div>

                <!-- MAIN CONTAINER CHUẨN V9.7PRO (TỐI ƯU HIỂN THỊ TRÊN ĐIỆN THOẠI & MÁY TÍNH) -->
                <div id="v97ExamMainContainer" class="flex-1 max-w-[1420px] w-full mx-auto p-2 sm:p-5 flex flex-row gap-4 overflow-hidden relative min-h-0">
                    <!-- LEFT PANEL: KHUNG CÂU HỎI V9.7PRO (MỞ RỘNG 100% KHI ẨN BẢNG CÂU HỎI) -->
                    <div id="v97LeftQuestionBox" class="exam-doc-font flex-1 min-w-0 min-h-0 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 sm:p-7 flex flex-col overflow-y-auto custom-scrollbar relative">
                        ${(ex.hasWatermark !== false && state.antiAiConfig.watermark !== false) ? `
                        <div class="watermark-layer" id="watermarkLayer">
                            ${Array.from({ length: 24 }).map(() => `<div class="watermark-item">${escapeHtml((ex.watermarkText || state.antiAiConfig.customWatermarkText || ex.title || (state.hideAuthorInfo ? 'HỆ THỐNG TOÁN TRITHUC5.0' : 'LỚP TOÁN THẦY TRUNG • HỆ THỐNG TOÁN TRITHUC5.0')).toUpperCase())} • [${escapeHtml(stu.stt || stu.username.toUpperCase())}] ${escapeHtml(stu.name.toUpperCase())} - ${escapeHtml(stu.class.toUpperCase())}</div>`).join('')}
                        </div>
                        ` : ''}

                        <div class="relative z-10 flex-1 flex flex-col">
                            ${state.examDisplayStyle === 'v97single'
                                ? renderV97SingleQuestionCard(qList, isRev, revCalc)
                                : renderAllQuestionsScrollView(qList, isRev, revCalc)}
                        </div>
                    </div>

                    <!-- LỚP NỀN MỜ TRÊN ĐIỆN THOẠI KHI MỞ BẢNG CÂU HỎI (BẤM RA NGOÀI ĐỂ ẨN NGAY) -->
                    ${isSidebarOpen && isCompact ? `
                        <div id="v97MobileSidebarBackdrop" onclick="window.TRITHUC.toggleExamSidebar(false)"
                            class="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[1px] transition-opacity"
                            title="Chạm vào vùng này để ẩn Bảng câu hỏi"></div>
                    ` : ''}

                    <!-- RIGHT PANEL: BẢNG CÂU HỎI CHIA 3 PHẦN I, II, III (CÓ THỂ ẨN / HIỆN HOÀN TOÀN) -->
                    ${isSidebarOpen ? `
                    <div id="v97RightSidebarPanel" class="${isCompact ? 'fixed inset-y-0 right-0 z-40 w-[310px] sm:w-[350px] max-w-[88vw] rounded-l-2xl shadow-2xl border-l border-slate-300' : 'w-[335px] xl:w-[360px] rounded-xl border border-slate-200 shadow-xs'} shrink-0 bg-white p-3.5 sm:p-5 flex flex-col overflow-y-auto custom-scrollbar">
                        <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div class="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base min-w-0">
                                <span>☰</span>
                                <span class="truncate">Bảng Câu Hỏi (${p4Questions.length > 0 ? '4 Phần' : '3 Phần'})</span>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <span id="v97AnsweredCounter" class="px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] sm:text-xs">
                                    Đã làm: ${answeredCount}/${qList.length}
                                </span>
                                <button type="button" id="v97CloseSidebarBtn" onclick="window.TRITHUC.toggleExamSidebar(false)"
                                    class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs flex items-center gap-1 transition"
                                    title="Ẩn Bảng câu hỏi để xem đề thi rộng toàn màn hình">
                                    <span>✕</span>
                                    <span>Ẩn</span>
                                </button>
                            </div>
                        </div>

                        <div class="flex sm:hidden items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold mt-2">
                            <button type="button" onclick="window.TRITHUC.setExamDisplayStyle('v97single'); if(isCompactExamViewport()) window.TRITHUC.toggleExamSidebar(false);"
                                class="flex-1 py-1 rounded-lg transition ${state.examDisplayStyle === 'v97single' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'}">
                                ⚡ Xem từng câu
                            </button>
                            <button type="button" onclick="window.TRITHUC.setExamDisplayStyle('allQuestions'); if(isCompactExamViewport()) window.TRITHUC.toggleExamSidebar(false);"
                                class="flex-1 py-1 rounded-lg transition ${state.examDisplayStyle === 'allQuestions' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'}">
                                📄 Xem toàn đề
                            </button>
                        </div>

                        <div class="flex items-center justify-between text-xs font-medium text-slate-500 py-2 px-2 my-2 bg-slate-50 rounded-lg">
                            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Chưa làm</div>
                            <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Đã làm</div>
                            <div class="flex items-center gap-1"><span>🚩</span> Xem lại</div>
                        </div>

                        <div class="grid ${isRev ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-1.5 mb-3">
                            ${[
                                { id: 'all', label: 'Tất cả' },
                                ...(isRev ? [{ id: 'wrong', label: '❌ Câu sai' }] : [{ id: 'unanswered', label: 'Chưa làm' }]),
                                ...(isRev ? [{ id: 'correct', label: '✔ Câu đúng' }] : []),
                                { id: 'flagged', label: '🚩 Đánh dấu' }
                            ].map(f => `
                                <button type="button" onclick="window.TRITHUC.setSidebarFilter('${f.id}')"
                                    class="py-1.5 px-2 rounded-md text-xs font-semibold border transition ${state.gridFilter === f.id ? (f.id === 'wrong' ? 'bg-rose-600 text-white border-rose-600' : 'bg-blue-600 text-white border-blue-600') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}">
                                    ${f.label}
                                </button>
                            `).join('')}
                        </div>

                        <!-- 3 PHẦN I, II, III -->
                        <div id="v97RightGridScroll" class="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
                            ${p1Questions.length > 0 ? `
                            <div class="bg-slate-50/80 rounded-xl p-2.5 sm:p-3 border border-slate-200">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold uppercase text-blue-800">
                                        Phần I. Trắc nghiệm 4 lựa chọn
                                    </span>
                                    <span class="text-[11px] font-semibold text-slate-500">${p1Questions.length} câu • ${fmtPtVNV467(exSc.p1Unit)}đ/câu</span>
                                </div>
                                <div id="v97GridPart1" class="grid grid-cols-4 gap-1.5 sm:gap-2">
                                    ${p1Questions.map(q => renderSidebarGridButton(q, isRev, revCalc)).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${p2Questions.length > 0 ? `
                            <div class="bg-slate-50/80 rounded-xl p-2.5 sm:p-3 border border-slate-200">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold uppercase text-purple-800">
                                        Phần II. Đúng / Sai (a, b, c, d)
                                    </span>
                                    <span class="text-[11px] font-semibold text-slate-500">${p2Questions.length} câu • ${fmtPtVNV467(exSc.p2Unit)}đ/câu</span>
                                </div>
                                <div id="v97GridPart2" class="grid grid-cols-2 gap-1.5 sm:gap-2">
                                    ${p2Questions.map(q => renderSidebarGridButton(q, isRev, revCalc)).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${p3Questions.length > 0 ? `
                            <div class="bg-slate-50/80 rounded-xl p-2.5 sm:p-3 border border-slate-200">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold uppercase text-orange-700">
                                        Phần III. Trả lời ngắn
                                    </span>
                                    <span class="text-[11px] font-semibold text-slate-500">${p3Questions.length} câu • ${fmtPtVNV467(exSc.p3Unit)}đ/câu</span>
                                </div>
                                <div id="v97GridPart3" class="grid grid-cols-3 gap-1.5 sm:gap-2">
                                    ${p3Questions.map(q => renderSidebarGridButton(q, isRev, revCalc)).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${p4Questions.length > 0 ? `
                            <div class="bg-emerald-50/70 rounded-xl p-2.5 sm:p-3 border border-emerald-200">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold uppercase text-emerald-800">
                                        Phần IV. Tự luận (TLN)
                                    </span>
                                    <span class="text-[11px] font-semibold text-emerald-700">${p4Questions.length} câu • Tổng ${fmtPtVNV467(p4TotalPts)}đ</span>
                                </div>
                                <div id="v97GridPart4" class="grid grid-cols-3 gap-1.5 sm:gap-2">
                                    ${p4Questions.map(q => renderSidebarGridButton(q, isRev, revCalc)).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        <div class="pt-3 mt-auto border-t border-slate-200 space-y-2">
                            ${!isRev ? `
                                <div class="text-[11px] text-slate-500 font-semibold text-center">
                                    🛡️ Khiên Chống AI 5 Lớp &amp; Full màn hình đang bật
                                </div>
                                <button type="button" onclick="window.TRITHUC.openConfirmSubmit()"
                                    class="w-full py-3 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm uppercase tracking-wider shadow-sm transition">
                                    ✔ Nộp Bài Kiểm Tra
                                </button>
                            ` : `
                                <button type="button" onclick="window.TRITHUC.exitExamRoom()"
                                    class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm uppercase tracking-wider transition">
                                    🏠 Quay Về Trang Chủ
                                </button>
                            `}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- FOOTER PHÒNG THI V9.7PRO -->
                <footer class="bg-white border-t border-slate-200 py-2.5 text-center text-sm font-bold text-slate-500 tracking-wider shrink-0">
                    HỆ THỐNG HỌC &amp; LUYỆN THI TOÁN THPT <span class="text-[#2563eb]">TRITHUC5.0${state.hideAuthorInfo ? '' : ' — THẦY TRƯƠNG QUANG TRUNG'}</span>
                </footer>

                <!-- OVERLAY CẢNH BÁO VI PHẠM QUY CHẾ PHÒNG THI -->
                ${state.showViolationOverlay && !isRev ? `
                    <div class="fixed inset-0 z-[99985] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
                        <div class="bg-white rounded-2xl max-w-md w-full p-7 text-center shadow-2xl border-4 border-red-500 space-y-4">
                            <div class="text-5xl">🚨⚠️</div>
                            <h2 class="text-xl font-bold text-red-600 uppercase m-0">CẢNH BÁO VI PHẠM QUY CHẾ PHÒNG THI!</h2>
                            <p class="text-sm text-slate-700 font-medium leading-relaxed m-0">
                                Hệ thống phát hiện: <b>${escapeHtml(state.lastViolationReason || 'Thoát chế độ Toàn màn hình hoặc chuyển tab')}</b>.<br>
                                Đã ghi nhận: <span class="text-red-600 font-bold text-base">Lần cảnh báo thứ ${state.tabSwitches} / ${limit}</span>.
                            </p>
                            <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-900 font-bold">
                                Nếu vi phạm đủ <b>${limit} lần</b>, hệ thống sẽ <b>TỰ ĐỘNG THU BÀI & CHẤM ĐIỂM NGAY LẬP TỨC</b>!
                            </div>
                            <button type="button" onclick="window.TRITHUC.reEnterExamFullscreen()"
                                class="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg transition">
                                📺 Bật lại Toàn Màn Hình & Tiếp tục làm bài
                            </button>
                        </div>
                    </div>
                ` : ''}

                ${state.showConfirmSubmitModal ? renderConfirmSubmitModal(qList) : ''}
                ${state.showFullSolutionModal ? renderFullSolutionModal(ex, qList) : ''}
            </div>`;
        }