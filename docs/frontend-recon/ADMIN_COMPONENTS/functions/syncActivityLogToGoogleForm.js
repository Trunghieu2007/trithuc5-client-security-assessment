function syncActivityLogToGoogleForm(logEntry) {
            if (state.perfConfig && state.perfConfig.autoOffloadGForm === false) return false;
            const cfg = state.googleFormConfig || {};
            const actionUrl = normalizeGFormActionUrl(cfg.actionUrl || cfg.rawInputUrl || cfg.rawPrefillUrl || '');
            if (!actionUrl || !actionUrl.includes('docs.google.com/forms')) return false;
            try {
                const compactDetail = `[${logEntry.actionLabel || logEntry.actionType}] ${logEntry.targetTitle || ''} | ${logEntry.detail || ''} | Lúc: ${logEntry.timeStr || ''}`;
                const res = postToGoogleFormEndpoint(cfg, {
                    name: `[${logEntry.username || logEntry.stt || 'HS'}] ${logEntry.name || 'Học sinh'}`,
                    classInfo: `${logEntry.class || '---'} (SBD: ${logEntry.stt || '---'})`,
                    score: `${logEntry.score || logEntry.actionType || '---'}`,
                    detail: compactDetail
                });
                if (res && res.ok) {
                    logEntry.syncedToGForm = true;
                    if (!state.gformSyncStats) state.gformSyncStats = { sentCount: 0, queuedCount: 0, lastSyncTime: 'Vừa xong' };
                    state.gformSyncStats.lastSyncTime = 'Vừa xong (' + new Date().toLocaleTimeString('vi-VN') + ')';
                    return true;
                }
                return false;
            } catch (e) {
                return false;
            }
        }