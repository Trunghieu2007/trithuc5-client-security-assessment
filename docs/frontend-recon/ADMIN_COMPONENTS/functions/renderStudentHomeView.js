function renderStudentHomeView() {
            if (state.studentNavTab === 'realWorld') {
                state.studentNavTab = 'curriculum';
            }
            let bodyHtml = '';
            if (state.studentNavTab === 'curriculum') {
                bodyHtml = renderCurriculumSection();
            } else if (state.studentNavTab === 'examBank') {
                bodyHtml = renderExamBankSection();
            } else {
                bodyHtml = renderLeaderboardSection();
            }

            return `
            <div class="min-h-screen flex flex-col bg-[#f1f5f9]">
                ${renderTopNavbar()}

                ${state.isAdminLoggedIn ? `
                    <div class="bg-indigo-950 text-white px-4 py-1.5 border-b border-indigo-800">
                        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div class="flex items-center gap-2 font-bold">
                                <span class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase text-[10px]">Chế độ Giáo viên</span>
                                <span>${state.adminPreviewUnlockAll ? '🔓 Đang bật Xem thử Mở khóa toàn bộ' : '🔒 Đang hiển thị khóa VIP đúng theo quyền Học sinh'}</span>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button type="button" onclick="window.TRITHUC.toggleHideAuthorInfo()"
                                    class="px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition ${state.hideAuthorInfo ? 'bg-rose-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'}">
                                    ${state.hideAuthorInfo ? '👁️ Hiện tác giả' : '🙈 Ẩn tác giả'}
                                </button>
                                <button type="button" onclick="window.TRITHUC.toggleAdminPreviewUnlockAll()"
                                    class="px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition ${state.adminPreviewUnlockAll ? 'bg-amber-400 text-slate-950' : 'bg-white/15 hover:bg-white/25 text-white'}">
                                    ${state.adminPreviewUnlockAll ? '🔒 Xem theo Khóa HS' : '🔓 Mở khóa thử (GV)'}
                                </button>
                                <button type="button" onclick="window.TRITHUC.openAdminPortal()"
                                    class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] transition">
                                    ⚙️ Về Quản Trị GV
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <main class="max-w-7xl w-full mx-auto px-3 sm:px-5 py-4 flex-1">
                    ${bodyHtml}
                </main>
                <footer class="v5-footer">
                    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                            <span class="v5-version-pill">TRITHUC5.0 • V5.1.1</span>
                            <span class="font-semibold text-slate-600">Hệ thống Học &amp; Thi Toán THPT Trực Tuyến${state.hideAuthorInfo ? '' : ' — Tác giả: <b class="text-slate-900">Thầy Trương Quang Trung</b>'}</span>
                        </div>
                        <div class="flex items-center gap-3 flex-wrap justify-center">
                            <button type="button" onclick="window.TRITHUC.switchStudentNav('curriculum')" class="font-semibold text-slate-500 hover:text-blue-700 transition">Chương &amp; Bài học</button>
                            <button type="button" onclick="window.TRITHUC.switchStudentNav('examBank')" class="font-semibold text-slate-500 hover:text-blue-700 transition">Kho Đề Thi</button>
                            <button type="button" onclick="window.TRITHUC.switchStudentNav('leaderboard')" class="font-semibold text-slate-500 hover:text-blue-700 transition">Bảng Vàng</button>
                            <span class="text-slate-400">•</span>
                            <span class="text-[11px] font-semibold text-slate-500">Giao diện: <b data-v5-theme-status class="text-slate-700">Hệ thống</b></span>
                        </div>
                    </div>
                </footer>
                ${state.showStudentLoginModal ? renderStudentLoginModal() : ''}
                ${state.showShareVipLinkModal ? renderShareVipLinkModal() : ''}
                ${state.pendingExam ? renderEntryGateModal() : ''}
                ${state.leaderboardModalExamId ? renderExamTop20Modal() : ''}
                ${state.editingLessonModalId ? renderAdminEditLessonModal() : ''}
                ${state.editingRealWorldModal ? renderEditRealWorldModal() : ''}
                ${state.deviceBlockedModalInfo ? renderDeviceBlockedSecurityModal() : ''}
                ${state.studentDeviceSecurityModalOpen ? renderStudentDeviceSecurityModal() : ''}
                ${state.adminManageDeviceUserId ? renderAdminManageDeviceModal() : ''}
                ${state.viewingStudentHistoryId ? renderStudentHistoryDetailModal() : ''}
                ${state.showVaultUnlockModal ? renderVaultSecurityModalV44() : ''}
                ${state.quickPasswordExamId ? renderQuickExamPasswordModalV44() : ''}
                ${state.matrixBuilder?.previewItemModal ? renderMatrixItemSampleModalV44() : ''}
                ${state.matrixBuilder?.showPdfExportModal ? renderMatrixPdfExportModalV44() : ''}
                ${state.matrixBuilder?.showBatchExportModal ? renderMatrixBatchExportModalV50() : ''}
                ${state.matrixBuilder?.showV95SetupModal ? renderMatrixV95SetupModalV44() : ''}
                ${state.mockToESync?.previewQuestionItem ? renderMockQuestionPreviewModalV44() : ''}
            </div>`;
        }