function renderCurriculumSection() {
            const currDb = __VAULT_CURR_DB__ || {};
            const gradeData = currDb[state.activeGrade] || currDb['12'];
            const q = state.searchQuery.trim().toLowerCase();
            const hasVipGrade = hasStudentVipAccess(state.activeGrade);
            const hasVipMock = hasStudentVipAccess('luyende');

            const mockExamsForGrade = state.exams.filter(ex =>
                ex.visible !== false &&
                isGrade12MockExamV464(ex)
            );
            const publicExamsForGrade = state.exams.filter(ex =>
                ex.visible !== false &&
                (ex.grade || '12') === state.activeGrade &&
                !isExamVipRequired(ex)
            );

            const allChapIds = [];
            (gradeData?.semesters || []).forEach(sem => {
                if (sem.id.endsWith('thithu')) return;
                if (state.semesterFilter !== 'all' && !sem.id.endsWith(state.semesterFilter)) return;
                (sem.chapters || []).forEach(ch => allChapIds.push(ch.id));
            });
            const anyChapOpen = allChapIds.some(cid => Boolean(state.expandedChapters[cid]));
            const allChapOpen = allChapIds.length > 0 && allChapIds.every(cid => Boolean(state.expandedChapters[cid]));

            return `
            <div class="space-y-3.5">
                <!-- THANH CÔNG CỤ CHỌN KHỐI, HỌC KỲ, ĐÓNG/MỞ CHƯƠNG & TÌM KIẾM (CHUẨN V4.3.9 GỌN ĐẸP TRÊN MỌI THIẾT BỊ) -->
                <div class="v431-curr-toolbar">
                    <!-- Cụm 1: Chọn Khối 12 • 11 • 10 & Luyện đề + Nút Mở/Thu gọn tất cả chương -->
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-wrap">
                        <div class="v431-grade-grid">
                            ${[
                                { id: '12', icon: '📘', label: 'Khối 12', kind: 'grade' },
                                { id: '11', icon: '📗', label: 'Khối 11', kind: 'grade' },
                                { id: '10', icon: '📙', label: 'Khối 10', kind: 'grade' },
                                { id: 'thithu', icon: '🔥', label: `Luyện đề (${mockExamsForGrade.length})`, kind: 'mock' },
                                { id: 'congkhai', icon: '🔓', label: `Đề công khai (${publicExamsForGrade.length})`, kind: 'public' }
                            ].map(item => {
                                if (item.kind === 'mock') {
                                    const activeMock = state.semesterFilter === 'thithu';
                                    return `
                                    <button type="button" onclick="window.TRITHUC.openOuterLuyenDe12V464()"
                                        title="Kho Đề Thi Thử TN THPT Lớp 12 (Đồng bộ với Tab Thi thử Lớp 12 trong Kho Đề)"
                                        class="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition flex items-center justify-center gap-1 ${activeMock ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}">
                                        <span>${item.icon}</span>
                                        <span>${item.label}</span>
                                        <span class="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-full ${hasVipMock ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'}">${hasVipMock ? 'VIP' : '🔒'}</span>
                                    </button>`;
                                }
                                if (item.kind === 'public') {
                                    const activePub = state.semesterFilter === 'congkhai';
                                    return `
                                    <button type="button" onclick="window.TRITHUC.setSemesterFilter('congkhai')"
                                        class="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition flex items-center justify-center gap-1 ${activePub ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'}">
                                        <span>${item.icon}</span>
                                        <span>${item.label}</span>
                                        <span class="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">FREE</span>
                                    </button>`;
                                }
                                const g = item.id;
                                const active = state.activeGrade === g && state.semesterFilter !== 'thithu' && state.semesterFilter !== 'congkhai';
                                const unlocked = hasStudentVipAccess(g);
                                return `
                                <button type="button" onclick="window.TRITHUC.selectGrade('${g}')"
                                    class="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition flex items-center justify-center gap-1 ${active ? 'bg-[#1e40af] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                                    <span class="hidden sm:inline">${item.icon}</span>
                                    <span>${item.label}</span>
                                    <span class="text-[9.5px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full ${unlocked ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'}">${unlocked ? 'VIP' : '🔒'}</span>
                                </button>`;
                            }).join('')}
                        </div>

                        ${state.semesterFilter !== 'thithu' ? `
                            <div class="flex items-center gap-1.5">
                                ${!allChapOpen ? `
                                    <button type="button" onclick="window.TRITHUC.toggleAllChapters(true)"
                                        class="flex-1 sm:flex-initial justify-center px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold border transition flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                                        <span>📂 Mở tất cả chương</span>
                                    </button>
                                ` : ''}
                                ${anyChapOpen ? `
                                    <button type="button" onclick="window.TRITHUC.toggleAllChapters(false)"
                                        class="flex-1 sm:flex-initial justify-center px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold border transition flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100">
                                        <span>📁 Thu gọn tất cả</span>
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Cụm 2: Lọc Học kỳ (4 nút gọn trên 1 hàng) & Ô tìm kiếm -->
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full xl:w-auto">
                        <div class="v431-sem-grid text-[11px] sm:text-xs font-bold">
                            ${[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'hk1', label: 'Học kỳ I' },
                                { id: 'hk2', label: 'Học kỳ II' },
                                { id: 'cd', label: 'Chuyên đề' }
                            ].map(s => `
                                <button type="button" onclick="window.TRITHUC.setSemesterFilter('${s.id}')"
                                    class="px-2 sm:px-2.5 py-1 rounded-lg text-center whitespace-nowrap transition ${state.semesterFilter === s.id ? 'bg-white text-blue-800 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}">
                                    ${s.label}
                                </button>
                            `).join('')}
                        </div>
                        <div class="relative w-full sm:w-56">
                            <input type="text" id="currSearchInput" value="${escapeHtml(state.searchQuery)}"
                                oninput="window.TRITHUC.onSearchChange(this.value, 'currSearchInput')"
                                placeholder="🔍 Tìm bài học, dạng toán, mã đề..."
                                class="w-full pl-3 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-600 bg-slate-50/70" />
                        </div>
                    </div>
                </div>

                ${state.semesterFilter === 'congkhai' ? `
                    <div class="bg-white rounded-3xl border border-emerald-200 shadow-xs overflow-hidden">
                        <div class="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <div class="text-[11px] font-extrabold uppercase tracking-widest text-emerald-100">Tổng hợp lối tắt miễn phí • Các đề vẫn giữ nguyên vị trí gốc</div>
                                <h3 class="text-base sm:text-lg font-black uppercase m-0 mt-0.5">
                                    🔓 Kho Đề Mở Công Khai Toán ${escapeHtml(state.activeGrade)} (${publicExamsForGrade.length} Đề Không Cần VIP)
                                </h3>
                            </div>
                        </div>
                        <div class="p-4 sm:p-5">
                            ${publicExamsForGrade.length === 0 ? `
                                <div class="p-8 text-center text-slate-400 font-bold text-sm">
                                    Hiện chưa có đề nào được mở công khai cho Khối ${escapeHtml(state.activeGrade)}.
                                </div>
                            ` : `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    ${publicExamsForGrade.filter(ex => !q || (ex.title || '').toLowerCase().includes(q) || (ex.code || '').toLowerCase().includes(q)).map(ex => {
                                        const conf = ex.config || { p1: 12, p2: 4, p3: 6 };
                                        const totalQ = (conf.p1 || 0) + (conf.p2 || 0) + (conf.p3 || 0) + (conf.p4 || 0);
                                        const attCnt = state.history.filter(h => String(h.examId) === String(ex.id)).length;
                                        const isMockEx = Boolean(ex.isMockExam || ex.category === 'thi_thu');
                                        const lesInfo = ex.lessonId ? findLessonById(ex.lessonId) : null;
                                        const originLabel = isMockEx ? '🔥 Mục Luyện đề' : (lesInfo?.lesson ? `📘 ${lesInfo.lesson.code}: ${lesInfo.lesson.title}` : '📚 Kho đề chung');
                                        return `
                                        <div class="flex flex-col justify-between p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 hover:bg-white hover:border-emerald-500 transition shadow-2xs">
                                            <div>
                                                <div class="flex items-center justify-between gap-2 mb-2">
                                                    <div class="flex items-center gap-1.5 flex-wrap">
                                                        <span class="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white font-mono-code text-[11px] font-extrabold">
                                                            Mã ${escapeHtml(ex.code || '1201')}
                                                        </span>
                                                        <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase">
                                                            🔓 Công Khai
                                                        </span>
                                                    </div>
                                                    <span class="text-xs font-extrabold text-emerald-700">⏱ ${ex.duration || 45} phút</span>
                                                </div>
                                                <h4 class="text-sm sm:text-[15px] font-extrabold text-slate-900 leading-snug m-0 mb-1">
                                                    ${escapeHtml(ex.title)}
                                                </h4>
                                                <div class="text-[11px] font-bold text-slate-500 mb-2.5 truncate">
                                                    Vị trí gốc: ${escapeHtml(originLabel)}
                                                </div>
                                            </div>
                                            <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-emerald-200/70">
                                                <span class="text-xs font-bold text-slate-600">
                                                    📋 ${totalQ} câu (${conf.p1} TN • ${conf.p2} Đ/S • ${conf.p3} TLN${(conf.p4 || 0) > 0 ? ` • ${conf.p4} TL` : ''}) • 👥 ${attCnt} lượt thi
                                                </span>
                                                <div class="flex items-center gap-1.5 shrink-0">
                                                    ${state.isAdminLoggedIn ? `
                                                        <button type="button" onclick="window.TRITHUC.toggleExamPublicUnlock('${ex.id}')"
                                                            class="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition"
                                                            title="Đề đang mở công khai (Bấm để khóa VIP lại ngay — đề vẫn giữ nguyên vị trí gốc)">
                                                            🔒 Khóa đề
                                                        </button>
                                                    ` : ''}
                                                    <button type="button" onclick="window.TRITHUC.openExamLeaderboardModal('${ex.id}')"
                                                        class="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-extrabold transition">
                                                        🏆
                                                    </button>
                                                    <button type="button" onclick="window.TRITHUC.openEntryModal('${ex.id}')"
                                                        class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs flex items-center gap-1 transition">
                                                        <span>▶️</span>
                                                        <span>Vào Thi</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                ` : state.semesterFilter === 'thithu' ? `
                    <div class="bg-white rounded-3xl border border-rose-200 shadow-xs overflow-hidden">
                        <div class="bg-gradient-to-r from-rose-700 to-red-800 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <div class="text-[11px] font-extrabold uppercase tracking-widest text-rose-200">Khu vực Luyện đề Thi thử Lớp 12 • Liên kết Kho Đề</div>
                                <h3 class="text-base sm:text-lg font-black uppercase m-0 mt-0.5">
                                    🔥 Kho Đề Thi Thử Tốt Nghiệp THPT – Lớp 12 (${mockExamsForGrade.length} Đề)
                                </h3>
                            </div>
                            <div class="flex items-center gap-2 shrink-0 flex-wrap">
                                <button type="button" onclick="window.TRITHUC.openExamBankMock12V464()"
                                    title="Mở thẳng Tab Thi thử TN THPT – Lớp 12 trong Kho Đề (phân nhóm theo trường & bộ đề)"
                                    class="px-3.5 py-2 rounded-xl bg-white text-rose-800 hover:bg-rose-50 text-xs font-black shadow-2xs transition">
                                    📝 Mở trong Kho Đề (Thi thử 12)
                                </button>
                                ${!hasVipMock ? `
                                    <button type="button" onclick="window.TRITHUC.openLockedCourseModal('luyende', 'Đăng ký mở khóa Gói Luyện Đề Thi Thử VIP')"
                                        class="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition">
                                        🔒 Mở khóa Gói Luyện Đề VIP
                                    </button>
                                ` : ''}
                                <button type="button" onclick="window.TRITHUC.quickCreateMockExam('12')"
                                    class="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-extrabold transition">
                                    + Thêm đề thi thử 12
                                </button>
                            </div>
                        </div>
                        <div class="p-4 sm:p-5">
                            ${mockExamsForGrade.length === 0 ? `
                                <div class="p-8 text-center text-slate-400 font-bold text-sm">
                                    Chưa có đề thi thử nào cho Khối ${escapeHtml(state.activeGrade)}.
                                </div>
                            ` : `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    ${mockExamsForGrade.filter(ex => !q || (ex.title || '').toLowerCase().includes(q) || (ex.code || '').toLowerCase().includes(q)).map(ex => {
                                        const conf = ex.config || { p1: 12, p2: 4, p3: 6 };
                                        const totalQ = (conf.p1 || 0) + (conf.p2 || 0) + (conf.p3 || 0) + (conf.p4 || 0);
                                        const attCnt = state.history.filter(h => String(h.examId) === String(ex.id)).length;
                                        const isPublicMock = !isExamVipRequired(ex);
                                        const lockedMock = !isPublicMock && !hasVipMock;
                                        return `
                                        <div class="flex flex-col justify-between p-4 rounded-2xl border-2 ${isPublicMock ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-500' : 'border-rose-200/80 bg-rose-50/30 hover:border-rose-400'} hover:bg-white transition shadow-2xs">
                                            <div>
                                                <div class="flex items-center justify-between gap-2 mb-2">
                                                    <div class="flex items-center gap-1.5 flex-wrap">
                                                        <span class="px-2.5 py-0.5 rounded-md ${isPublicMock ? 'bg-emerald-700' : 'bg-rose-700'} text-white font-mono-code text-[11px] font-extrabold">
                                                            Mã ${escapeHtml(ex.code || 'TT12')}
                                                        </span>
                                                        <span class="px-2 py-0.5 rounded-md ${isPublicMock ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'} text-[10px] font-black uppercase">
                                                            ${isPublicMock ? '🔓 Mở Công Khai (Không cần VIP)' : (lockedMock ? '🔒 Gói Luyện Đề VIP' : '🔓 Đã mở khóa VIP')}
                                                        </span>
                                                    </div>
                                                    <span class="text-xs font-extrabold text-rose-700">⏱ ${ex.duration || 90} phút</span>
                                                </div>
                                                <h4 class="text-sm sm:text-[15px] font-extrabold text-slate-900 leading-snug m-0 mb-2.5">
                                                    ${escapeHtml(ex.title)}
                                                </h4>
                                            </div>
                                            <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-rose-200/60">
                                                <span class="text-xs font-bold text-slate-600">
                                                    📋 ${totalQ} câu (${conf.p1} TN • ${conf.p2} Đ/S • ${conf.p3} TLN${(conf.p4 || 0) > 0 ? ` • ${conf.p4} TL` : ''}) • 👥 ${attCnt} lượt thi
                                                </span>
                                                <div class="flex items-center gap-1.5 shrink-0">
                                                    ${state.isAdminLoggedIn ? `
                                                        <button type="button" onclick="window.TRITHUC.toggleExamPublicUnlock('${ex.id}')"
                                                            class="px-2.5 py-1.5 rounded-xl ${isPublicMock ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-emerald-100'} text-xs font-extrabold transition"
                                                            title="${isPublicMock ? 'Đang mở công khai (Bấm để khóa VIP)' : 'Bấm để mở công khai không cần VIP'}">
                                                            ${isPublicMock ? '🔓 Công khai' : '🔒 Mở khóa'}
                                                        </button>
                                                    ` : ''}
                                                    <button type="button" onclick="window.TRITHUC.openExamLeaderboardModal('${ex.id}')"
                                                        class="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-extrabold transition">
                                                        🏆
                                                    </button>
                                                    ${lockedMock ? `
                                                        <button type="button" onclick="window.TRITHUC.openLockedCourseModal('luyende', 'Đề thi thử ${escapeJsAttr(ex.title)} thuộc gói Luyện đề VIP')"
                                                            class="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-xs flex items-center gap-1 transition">
                                                            <span>🔒</span>
                                                            <span>Mở khóa VIP</span>
                                                        </button>
                                                    ` : `
                                                        <button type="button" onclick="window.TRITHUC.openEntryModal('${ex.id}')"
                                                            class="px-4 py-1.5 rounded-xl ${isPublicMock ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white text-xs font-extrabold shadow-xs flex items-center gap-1 transition">
                                                            <span>▶️</span>
                                                            <span>${isPublicMock ? 'Vào Thi (Công khai)' : 'Vào Thi Thử'}</span>
                                                        </button>
                                                    `}
                                                </div>
                                            </div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                ` : `
                    <!-- DANH SÁCH CHƯƠNG & BÀI HỌC GỌN ĐẸP CHUẨN ẢNH 1 (KHÔNG CÓ BANNER RƯỜM RÀ) -->
                    <div class="space-y-4">
                        ${(gradeData?.semesters || []).map(sem => {
                            if (sem.id.endsWith('thithu')) return '';
                            if (state.semesterFilter !== 'all' && !sem.id.endsWith(state.semesterFilter)) return '';

                            const chaptersHtml = (sem.chapters || []).map(chap => {
                                let chapExamTotal = 0;
                                const matchingLessons = [];

                                (chap.lessons || []).forEach(lesson => {
                                    const lessonExams = getLessonExamsForLesson(lesson);
                                    chapExamTotal += lessonExams.length;

                                    const matchSearch = !q ||
                                        lesson.title.toLowerCase().includes(q) ||
                                        lesson.code.toLowerCase().includes(q) ||
                                        chap.title.toLowerCase().includes(q) ||
                                        lessonExams.some(ex => (ex.title || '').toLowerCase().includes(q) || (ex.code || '').toLowerCase().includes(q));
                                    if (matchSearch) {
                                        matchingLessons.push({ lesson, lessonExams });
                                    }
                                });

                                if (matchingLessons.length === 0) return '';

                                const isChapOpen = Boolean(q) || Boolean(state.expandedChapters[chap.id]);
                                const lessonsHtml = isChapOpen
                                    ? matchingLessons.map(({ lesson, lessonExams }) => renderSingleLessonCardHtml(lesson, lessonExams, state.activeGrade)).join('')
                                    : '';

                                return `
                                <div class="v5-chap-card">
                                    <div onclick="window.TRITHUC.toggleChapterOpen('${chap.id}')"
                                        class="v5-chap-header ${isChapOpen ? 'v5-chap-header-open' : ''}">
                                        <div class="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                                            <span class="text-base shrink-0 mt-0.5 sm:mt-0">${isChapOpen ? '📂' : '📁'}</span>
                                            <h3 class="text-xs sm:text-sm font-extrabold uppercase tracking-tight m-0 leading-snug break-words">
                                                ${escapeHtml(chap.title)}
                                            </h3>
                                        </div>
                                        <div class="flex items-center gap-2 shrink-0 flex-wrap" onclick="event.stopPropagation()">
                                            <span class="v5-chap-badge v5-tabular">
                                                ${matchingLessons.length} bài học • ${chapExamTotal} đề
                                            </span>
                                            <button type="button" onclick="window.TRITHUC.toggleChapterOpen('${chap.id}')"
                                                class="v5-chap-toggle">
                                                ${isChapOpen ? '▲ Thu gọn' : '▼ Mở chương'}
                                            </button>
                                        </div>
                                    </div>
                                    ${isChapOpen ? `
                                        <div class="divide-y divide-slate-200/70">${lessonsHtml}</div>
                                    ` : ''}
                                </div>`;
                            }).join('');

                            if (!chaptersHtml.trim()) return '';
                            return `
                            <div class="space-y-3">
                                <div class="flex items-center gap-2 px-1">
                                    <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                                    <h2 class="text-xs font-black uppercase tracking-widest text-slate-500 m-0">${escapeHtml(sem.title)}</h2>
                                </div>
                                ${chaptersHtml}
                            </div>`;
                        }).join('')}
                    </div>
                `}
            </div>`;
        }