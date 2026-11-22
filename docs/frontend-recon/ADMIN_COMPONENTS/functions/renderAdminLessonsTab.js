function renderAdminLessonsTab() {
            const currDb = __VAULT_CURR_DB__ || {};
            const gKey = state.adminLessonGradeFilter || '12';
            const gData = currDb[gKey] || currDb['12'];
            const allLesChapIds = [];
            (gData?.semesters || []).filter(s => !s.id.endsWith('thithu')).forEach(s => {
                (s.chapters || []).forEach(c => allLesChapIds.push(c.id));
            });
            const anyLesChapOpen = allLesChapIds.some(cid => Boolean(state.adminLessonExpandedChapters?.[cid]));
            const allLesChapOpen = allLesChapIds.length > 0 && allLesChapIds.every(cid => Boolean(state.adminLessonExpandedChapters?.[cid]));

            return `
            <div class="space-y-4">
                <div class="v511-admin-hero">
                    <div class="min-w-0">
                        <h2 class="text-base sm:text-lg font-extrabold text-slate-900 m-0 tracking-tight">✏️ Quản Lý &amp; Chỉnh Sửa Nội Dung Bài Học</h2>
                        <p class="hidden sm:block text-xs text-slate-500 font-semibold m-0 mt-0.5">
                            Thầy có thể sửa trực tiếp tiêu đề bài học, số tiết phân phối, nội dung Lý thuyết (LaTeX/HTML), các Dạng toán tự luận và Bài tập rèn luyện 3 phần, hoặc thêm bài học mới vào chương.
                        </p>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                        ${['12', '11', '10'].map(g => `
                            <button type="button" onclick="window.TRITHUC.setAdminLessonGradeFilter('${g}')"
                                class="px-4 py-2 rounded-xl text-xs font-black uppercase transition ${gKey === g ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                                📘 Khối ${g}
                            </button>
                        `).join('')}
                        ${!allLesChapOpen ? `
                            <button type="button" onclick="window.TRITHUC.toggleAllAdminLessonChapters('${gKey}', true)"
                                class="px-3 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                                <span>📂 Mở tất cả chương</span>
                            </button>
                        ` : ''}
                        ${anyLesChapOpen ? `
                            <button type="button" onclick="window.TRITHUC.toggleAllAdminLessonChapters('${gKey}', false)"
                                class="px-3 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100">
                                <span>📁 Thu gọn tất cả</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="space-y-4">
                    ${(gData?.semesters || []).filter(s => !s.id.endsWith('thithu')).map(sem => `
                        <div class="space-y-3">
                            <h3 class="text-xs font-black uppercase tracking-widest text-slate-500 px-1 m-0">${escapeHtml(sem.title)}</h3>
                            ${(sem.chapters || []).map(chap => {
                                const cLessons = chap.lessons || [];
                                const cOpenLesCnt = cLessons.filter(l => isFreeLesson(l.id)).length;
                                const cAllOpen = cLessons.length > 0 && cOpenLesCnt === cLessons.length;
                                const isLesChapOpen = Boolean(state.adminLessonExpandedChapters?.[chap.id]);
                                return `
                                <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                                    <div onclick="window.TRITHUC.toggleAdminLessonChapterOpen('${chap.id}')"
                                        class="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <span class="text-xs font-black">${isLesChapOpen ? '▼' : '▶'}</span>
                                            <span class="text-xs sm:text-sm font-black uppercase">${escapeHtml(chap.title)}</span>
                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${cAllOpen ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40' : 'bg-white/10 text-slate-200 border border-white/20'}">
                                                ${cOpenLesCnt}/${cLessons.length} bài mở
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2 flex-wrap" onclick="event.stopPropagation()">
                                            <button type="button" onclick="window.TRITHUC.toggleChapterQuickUnlock('${gKey}', '${chap.id}', ${cAllOpen ? 'false' : 'true'})"
                                                class="px-3 py-1 rounded-xl text-xs font-extrabold transition ${cAllOpen ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}"
                                                title="${cAllOpen ? 'Khóa VIP toàn bộ bài học và đề của chương này' : 'Mở khóa công khai nhanh toàn bộ bài học và đề của chương này'}">
                                                ${cAllOpen ? '🔒 Khóa VIP cả chương' : '🔓 Mở khóa nhanh cả chương'}
                                            </button>
                                            <button type="button" onclick="window.TRITHUC.openAddNewLessonModal('${gKey}', '${chap.id}')"
                                                class="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition">
                                                ➕ Thêm bài học mới vào chương này
                                            </button>
                                        </div>
                                    </div>
                                    ${isLesChapOpen ? `<div class="divide-y divide-slate-100">` : ''}${isLesChapOpen ? `
                                        ${(chap.lessons || []).map(les => {
                                            const lExams = state.exams.filter(ex => !ex.isMockExam && ex.category !== 'thi_thu' && (ex.lessonId === les.id || (Array.isArray(ex.linkedLessons) && ex.linkedLessons.includes(les.id))));
                                            const dtCnt = Array.isArray(les.mathTypes) ? les.mathTypes.length : 0;
                                            const pCnt = (les.practice?.p1?.length || 0) + (les.practice?.p2?.length || 0) + (les.practice?.p3?.length || 0);
                                            return `
                                            <div class="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                                                <div>
                                                    <div class="flex items-center gap-2 flex-wrap">
                                                        <span class="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-extrabold text-xs">${escapeHtml(les.code)}</span>
                                                        <span class="font-extrabold text-slate-900 text-sm">${escapeHtml(les.title)}</span>
                                                        ${isFreeLesson(les.id)
                                                            ? `<span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase">${les.id === '12-b1' ? '🔓 Bài mẫu mặc định' : '🔓 Đang Mở Công Khai'}</span>`
                                                            : `<span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">🔒 Khóa VIP</span>`}
                                                    </div>
                                                    <div class="text-xs text-slate-500 font-semibold mt-1">
                                                        ⏱ Phân phối: <b>${les.periods} tiết</b> • 🧭 <b>${dtCnt} dạng toán</b> • ✍️ <b>${pCnt} câu BT rèn luyện</b> • 📝 <b>${lExams.length} đề chuẩn 22 câu</b>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-2 flex-wrap shrink-0">
                                                    ${les.id === '12-b1' ? `
                                                        <span class="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                                                            🔓 Luôn mở mẫu
                                                        </span>
                                                    ` : `
                                                        <button type="button" onclick="window.TRITHUC.toggleLessonVipUnlock('${les.id}')"
                                                            class="px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition ${isFreeLesson(les.id)
                                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'}"
                                                            title="${isFreeLesson(les.id) ? 'Bài học đang mở công khai (Không cần VIP). Bấm để khóa VIP lại' : 'Bấm để mở khóa công khai bài học này cho học sinh (Có chữ ký bảo mật)'}">
                                                            ${isFreeLesson(les.id) ? '🔓 Đang Mở VIP (Bấm để Khóa)' : '🔒 Mở khóa VIP'}
                                                        </button>
                                                    `}
                                                    <button type="button" onclick="window.TRITHUC.openEditLessonModal('${les.id}')"
                                                        class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-2xs transition">
                                                        ✏️ Sửa bài học
                                                    </button>
                                                    <button type="button" onclick="window.TRITHUC.quickAttachExamToLesson('${gKey}', '${les.id}')"
                                                        class="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-extrabold transition">
                                                        + Thêm đề
                                                    </button>
                                                </div>
                                            </div>`;
                                        }).join('')}
                                    ` : ''}${isLesChapOpen ? `</div>` : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }