function logStudentActivity(actionType, actionLabel, targetTitle, detailStr, scoreStr, stuOverride) {
            const stuCheck = stuOverride || state.loggedInStudent;
            if (isAdminExamAttempt(stuCheck) && actionType !== 'TEST_GFORM') {
                return null;
            }
            const stu = stuCheck || {
                id: 'stu_guest',
                username: 'khach',
                stt: '00',
                name: 'Học sinh Chưa đăng nhập',
                class: 'Tự do'
            };
            const now = Date.now();
            if (!Array.isArray(state.activityLogs)) state.activityLogs = [];
            // Chống ghi trùng lặp thao tác liên tiếp trong 1.5 giây để giữ web siêu nhẹ
            const latest = state.activityLogs[0];
            if (latest && latest.username === stu.username && latest.actionType === actionType && latest.targetTitle === targetTitle && (now - (latest.ts || 0) < 1500)) {
                latest.detail = detailStr || latest.detail;
                latest.score = scoreStr || latest.score;
                latest.timeStr = new Date(now).toLocaleString('vi-VN');
                saveActivityLogsState();
                return latest;
            }
            const entry = {
                id: 'log_' + now + '_' + Math.floor(Math.random() * 1000),
                ts: now,
                timeStr: new Date(now).toLocaleString('vi-VN'),
                userId: stu.id || '',
                username: stu.username || 'hs',
                stt: stu.stt || '',
                name: stu.name || 'Học sinh',
                class: stu.class || '12A1',
                actionType: actionType,
                actionLabel: actionLabel,
                targetTitle: targetTitle || '',
                // V4.8.0 (NEW-08): Che toàn bộ mật khẩu/bí mật trước khi ghi log hoặc gửi về Google Form
                detail: String(detailStr || '').replace(/(?:mật\s*khẩu|password|mk|pass)\s*[:=]\s*[^\s|;,•]+/gi, 'MK: [ĐÃ ẨN]'),
                score: scoreStr || '---',
                durationStr: '---',
                syncedToGForm: false
            };
            const synced = syncActivityLogToGoogleForm(entry);
            entry.syncedToGForm = Boolean(synced);
            state.activityLogs.unshift(entry);
            saveActivityLogsState();
            return entry;
        }