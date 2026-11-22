function renderApp(preserveExamScroll) {
            const root = document.getElementById('appRoot');
            if (!root) return;

            const shouldKeepExamScroll = preserveExamScroll !== false && state.view === 'doing';
            const prevLeftTop = shouldKeepExamScroll ? (document.getElementById('v97LeftQuestionBox')?.scrollTop || 0) : 0;
            const prevRightTop = shouldKeepExamScroll ? (document.getElementById('v97RightGridScroll')?.scrollTop || 0) : 0;
            const prevMainTop = shouldKeepExamScroll ? (document.getElementById('v97ExamMainContainer')?.scrollTop || 0) : 0;

            // Giữ nguyên vị trí cuộn của trang & các khung cuộn trong Quản trị (Cây dạng toán Phần E, Bảng Ma trận, Xem trước PDF)
            const prevWinY = window.scrollY || document.documentElement.scrollTop || 0;
            const prevTreeTop = document.getElementById('matrixBuilderTreeScrollV45')?.scrollTop || 0;
            const prevTableTop = document.getElementById('matrixBuilderTableScrollV45')?.scrollTop || 0;
            const prevPdfTop = document.getElementById('matrixPdfPrintAreaV44')?.scrollTop || 0;
            const prevBatchTop = document.getElementById('matrixBatchPreviewAreaV50')?.scrollTop || 0;

            if (state.view === 'doing') {
                document.body.classList.add('doing-exam');
            } else {
                document.body.classList.remove('doing-exam');
            }
            document.body.classList.toggle('hide-author-mode', Boolean(state.hideAuthorInfo));
            document.title = state.hideAuthorInfo
                ? 'TRITHUC5.0 V5.1.1 — Hệ Thống Học & Thi Toán THPT Trực Tuyến Chuẩn V9.5 PRO'
                : 'LỚP TOÁN THẦY TRUNG • TRITHUC5.0 V5.1.1 — Thầy Trương Quang Trung (Sở GD&ĐT Hà Nội)';

            if (state.view === 'studentHome') {
                root.innerHTML = maskAuthorBranding(renderStudentHomeView());
            } else if (state.view === 'doing') {
                root.innerHTML = maskAuthorBranding(renderDoingExamView());
            } else if (state.view === 'result') {
                root.innerHTML = maskAuthorBranding(renderResultView());
            } else if (state.view === 'admin') {
                root.innerHTML = renderAdminView();
            }

            const restoreScrolls = () => {
                if (shouldKeepExamScroll) {
                    const lBox = document.getElementById('v97LeftQuestionBox');
                    const rBox = document.getElementById('v97RightGridScroll');
                    const mBox = document.getElementById('v97ExamMainContainer');
                    if (lBox && prevLeftTop > 0) lBox.scrollTop = prevLeftTop;
                    if (rBox && prevRightTop > 0) rBox.scrollTop = prevRightTop;
                    if (mBox && prevMainTop > 0) mBox.scrollTop = prevMainTop;
                }
                const treeBox = document.getElementById('matrixBuilderTreeScrollV45');
                const tableBox = document.getElementById('matrixBuilderTableScrollV45');
                const pdfBox = document.getElementById('matrixPdfPrintAreaV44');
                if (treeBox && prevTreeTop > 0) treeBox.scrollTop = prevTreeTop;
                if (tableBox && prevTableTop > 0) tableBox.scrollTop = prevTableTop;
                if (pdfBox && prevPdfTop > 0) pdfBox.scrollTop = prevPdfTop;
                const batchBox = document.getElementById('matrixBatchPreviewAreaV50');
                if (batchBox && prevBatchTop > 0) batchBox.scrollTop = prevBatchTop;
                if (state.view === 'admin' && prevWinY > 0) {
                    try { window.scrollTo({ top: prevWinY, behavior: 'instant' }); } catch (e) { window.scrollTo(0, prevWinY); }
                }
            };
            if (window.TRITHUC_THEME) window.TRITHUC_THEME.syncControls();
            restoreScrolls();
            typesetMath(null, restoreScrolls);
        }