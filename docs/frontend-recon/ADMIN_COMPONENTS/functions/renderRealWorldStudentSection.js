function renderRealWorldStudentSection() {
            const gKey = state.realWorldGradeFilter || state.activeGrade || '12';
            const rwDb = __VAULT_RW_DB__ || {};
            const allTopics = getRealWorldTopicsForChapter(gKey, 'all');
            const currDb = __VAULT_CURR_DB__ || {};
            const gData = currDb[gKey] || currDb['12'];
            const chapters = [];
            (gData?.semesters || []).forEach(sem => {
                if (sem.id.endsWith('thithu')) return;
                (sem.chapters || []).forEach(ch => chapters.push(ch));
            });

            const chapFilter = state.realWorldChapterFilter || 'all';
            const sq = (state.realWorldSearch || '').trim().toLowerCase();
            const filtered = allTopics.filter(item => {
                if (chapFilter !== 'all' && item.chapterId !== chapFilter) return false;
                if (sq) {
                    return (item.title || '').toLowerCase().includes(sq) ||
                           (item.chapterTitle || '').toLowerCase().includes(sq) ||
                           (item.method || '').toLowerCase().includes(sq);
                }
                return true;
            });

            return `
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-emerald-800 via-teal-800 to-blue-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="space-y-1">
                        <div class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/15 text-emerald-200 text-[11px] font-extrabold uppercase">
                            <span>🌍 Chuyên Đề Trọng Tâm Đề Thi Mới</span>
                        </div>
                        <h2 class="text-lg sm:text-xl font-black uppercase m-0">
                            Kho Toán Thực Tế & Ứng Dụng Liên Môn (Khối 12 • 11 • 10)
                        </h2>
                        <p class="text-xs text-emerald-100 font-semibold m-0">
                            Tổng hợp đầy đủ các dạng bài toán tối ưu chi phí, lợi nhuận, hình học thực tiễn, tốc độ tăng trưởng quần thể, vật lý – kỹ thuật kèm <b>Bài tập mẫu</b> và nút <b>➕ Thêm bài tập tương tự</b> cho từng dạng.
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 flex-wrap">
                        <button type="button" onclick="window.TRITHUC.openAddRealWorldModal('${gKey}', '${chapFilter !== 'all' ? chapFilter : (chapters[0]?.id || '12-c1')}')"
                            class="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-1.5">
                            <span>➕</span>
                            <span>Thêm Dạng Toán Thực Tế Mới</span>
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div class="flex items-center gap-2 flex-wrap">
                        ${['12', '11', '10'].map(g => {
                            const cnt = (rwDb[g] || []).length;
                            const active = gKey === g;
                            return `
                            <button type="button" onclick="window.TRITHUC.setRealWorldGradeFilter('${g}')"
                                class="px-4 py-2 rounded-xl text-xs font-black uppercase transition ${active ? 'bg-emerald-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                                🌍 Toán Thực Tế Khối ${g} (${cnt} chuyên đề)
                            </button>`;
                        }).join('')}
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <select onchange="window.TRITHUC.setRealWorldChapterFilter(this.value)"
                            class="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-700 outline-none">
                            <option value="all" ${chapFilter === 'all' ? 'selected' : ''}>📂 Tất cả các Chương Khối ${escapeHtml(gKey)}</option>
                            ${chapters.map(ch => `
                                <option value="${ch.id}" ${chapFilter === ch.id ? 'selected' : ''}>${escapeHtml(ch.title)}</option>
                            `).join('')}
                        </select>
                        <input type="text" id="rwSearchInp" value="${escapeHtml(state.realWorldSearch || '')}"
                            oninput="window.TRITHUC.setRealWorldSearch(this.value)"
                            placeholder="🔍 Tìm bài toán thực tế (chi phí, cầu, lãi suất...)"
                            class="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold w-60 outline-none focus:border-emerald-600" />
                    </div>
                </div>

                <div class="space-y-4">
                    ${filtered.map((rw, idx) => {
                        const typeKey = `rw_${gKey}_${rw.id || idx}`;
                        return `
                        <div class="bg-white rounded-3xl border-2 border-emerald-200/90 shadow-xs overflow-hidden">
                            <div class="bg-gradient-to-r from-emerald-900 to-teal-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                                <div class="flex items-center gap-2.5 flex-wrap">
                                    <span class="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase">
                                        ${escapeHtml(rw.code || ('TT-' + (idx + 1)))}
                                    </span>
                                    <div>
                                        <div class="text-[10px] font-bold text-emerald-200 uppercase">${escapeHtml(rw.chapterTitle || ('Khối ' + gKey))}</div>
                                        <h3 class="text-sm sm:text-base font-black m-0">${preprocessMath(rw.title)}</h3>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    ${(rw.matrixCodes || []).map(mc => `
                                        <span class="px-2 py-0.5 rounded bg-white/15 text-white font-mono-code text-[10px] font-bold">${escapeHtml(mc)}</span>
                                    `).join('')}
                                    <button type="button" onclick="window.TRITHUC.openEditRealWorldModal('${gKey}', '${rw.id}')"
                                        class="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition">
                                        ✏️ Sửa / Thêm ví dụ
                                    </button>
                                </div>
                            </div>
                            <div class="p-4 sm:p-5 space-y-4 text-xs sm:text-[13.5px] leading-relaxed">
                                <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                                    <div class="font-black text-emerald-950 uppercase text-xs mb-1">📌 Phương pháp thiết lập hàm mục tiêu & Giải nhanh:</div>
                                    <div class="text-slate-800">${preprocessMath(rw.method || '')}</div>
                                </div>
                                <div class="space-y-3">
                                    ${(rw.examples || []).map((exItem, exIdx) => {
                                        const solKey = `${typeKey}_ex_${exIdx}`;
                                        const isSolOpen = state.lessonPracticeRevealed[solKey] !== false;
                                        return `
                                        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                                            <div class="text-slate-900">${preprocessMath(exItem.prob || '')}</div>
                                            <div>
                                                <button type="button" onclick="window.TRITHUC.togglePracticeSolution('${solKey}')"
                                                    class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition">
                                                    ${isSolOpen ? '🔼 Ẩn Các Bước Giải Chi Tiết' : '📖 Xem Các Bước Giải Chi Tiết & Hỏi AI'}
                                                </button>
                                            </div>
                                            ${isSolOpen ? renderSolutionStepsWithAiHelper(exItem.steps, exItem.sol, '', solKey, exItem.prob) : ''}
                                        </div>`;
                                    }).join('')}
                                </div>
                                ${renderInteractiveSimilarExercisesBlock(typeKey, rw, rw.title)}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }