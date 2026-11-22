async function pullCloudSyncMessages(silent) {
            const now = Date.now();
            if (silent && now - lastCloudPullMs < 4000) return false;
            lastCloudPullMs = now;
            let anyChanged = false;

            const pullFromNtfyEndpoint = async (endpointUrl) => {
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 4000);
                    const resp = await fetch(endpointUrl + '/json?poll=1&since=24h', {
                        method: 'GET',
                        signal: ctrl.signal
                    });
                    clearTimeout(timer);
                    if (resp.ok) {
                        const text = await resp.text();
                        const lines = text.split(/\r?\n/).filter(Boolean);
                        const decodedPackets = [];
                        lines.forEach(line => {
                            try {
                                const outer = JSON.parse(line);
                                const rawMsg = outer && outer.message ? String(outer.message).trim() : '';
                                const decoded = decodeCloudMessageString(rawMsg);
                                if (decoded) decodedPackets.push(decoded);
                            } catch (err) {}
                        });
                        decodedPackets.sort((a, b) => Number(a.ts || 0) - Number(b.ts || 0));
                        decodedPackets.forEach(pkt => {
                            try {
                                if (processIncomingCloudPacket(pkt)) anyChanged = true;
                            } catch (err) {}
                        });
                        state.cloudSyncStatus = '🟢 Tự động đồng bộ Đám mây Đa Máy: Đang hoạt động';
                    }
                } catch (e) {}
            };

            await Promise.all([
                pullFromNtfyEndpoint(CLOUD_SYNC_ENDPOINT),
                pullFromNtfyEndpoint(CLOUD_SYNC_BACKUP_ENDPOINT)
            ]);

            // Kênh 3-res (V4.7.4): Đồng bộ kết quả nộp bài & Phổ điểm của học sinh (gồm cả học sinh làm đề công khai không cần đăng ký)
            try {
                if ((await pullStudentResultsFromCloudV474(false)) > 0) anyChanged = true;
            } catch (e) {}

            // Kênh 3a (V4.6.8): Tải gói Đề thi tùy chỉnh nén Gzip (HTML/JSON/Word/PDF + Ảnh) đa máy
            try {
                if (await pullCustomExamsBundleFromCloudV468(null, !silent)) anyChanged = true;
            } catch (e) {}

            // Kênh 3b: Đọc danh sách Đề thi thử tùy chỉnh bền vững từ Cloud KV
            try {
                const ctrlMk = new AbortController();
                const timerMk = setTimeout(() => ctrlMk.abort(), 3500);
                const respMkMeta = await kvSafeFetchV485(CLOUD_KV_GET_BASE + 'mock_meta_cnt', { method: 'GET', signal: ctrlMk.signal });
                clearTimeout(timerMk);
                if (respMkMeta.ok) {
                    const rawMkMeta = (await respMkMeta.text()).replace(/^"|"$/g, '').trim();
                    const mkCnt = parseInt(rawMkMeta.split('_')[0], 10);
                    if (mkCnt > 0 && mkCnt <= 64) {
                        const mkParts = await Promise.all(Array.from({ length: mkCnt }, async (_, idx) => {
                            try {
                                const r = await kvSafeFetchV485(CLOUD_KV_GET_BASE + `mk_${idx}`);
                                if (!r.ok) return '';
                                return (await r.text()).replace(/^"|"$/g, '').trim();
                            } catch (e) {
                                return '';
                            }
                        }));
                        if (mkParts.every(Boolean)) {
                            const mkJsonStr = fromBase64UrlSafe(mkParts.join(''));
                            if (mkJsonStr) {
                                const mkObj = JSON.parse(mkJsonStr);
                                if (mkObj && mkObj.app === 'TRITHUC50_MOCK_V44' && mkObj.sig === computeMockPayloadSig(mkObj) && Array.isArray(mkObj.specs)) {
                                    if (mergeCloudCustomMockSpecs(mkObj.specs, mkObj.deletedIds || [])) anyChanged = true;
                                }
                            }
                        }
                    }
                }
            } catch (e) {}

            // Kênh 3c: Đọc danh sách Bài học mở khóa VIP bền vững từ Cloud KV (chống trôi sau 24h)
            try {
                const ctrlPl = new AbortController();
                const timerPl = setTimeout(() => ctrlPl.abort(), 3500);
                const respPlMeta = await kvSafeFetchV485(CLOUD_KV_GET_BASE + 'pub_les_cnt', { method: 'GET', signal: ctrlPl.signal });
                clearTimeout(timerPl);
                if (respPlMeta.ok) {
                    const rawPlMeta = (await respPlMeta.text()).replace(/^"|"$/g, '').trim();
                    const plCnt = parseInt(rawPlMeta.split('_')[0], 10);
                    if (plCnt > 0 && plCnt <= 32) {
                        const plParts = await Promise.all(Array.from({ length: plCnt }, async (_, idx) => {
                            try {
                                const r = await kvSafeFetchV485(CLOUD_KV_GET_BASE + `pl_${idx}`);
                                if (!r.ok) return '';
                                return (await r.text()).replace(/^"|"$/g, '').trim();
                            } catch (e) {
                                return '';
                            }
                        }));
                        if (plParts.every(Boolean)) {
                            const plJsonStr = fromBase64UrlSafe(plParts.join(''));
                            if (plJsonStr) {
                                const plObj = JSON.parse(plJsonStr);
                                if (LessonVipVaultV44.verifySignedCloudPayload(plObj)) {
                                    if (LessonVipVaultV44.applyVerifiedCloudLessons(plObj.ids, plObj.ts)) anyChanged = true;
                                }
                            }
                        }
                    }
                }
            } catch (e) {}

            // Kênh 3: Đọc trạng thái phân mảnh từ Cloud KV
            try {
                const ctrlMeta = new AbortController();
                const timerMeta = setTimeout(() => ctrlMeta.abort(), 3500);
                const respMeta = await kvSafeFetchV485(CLOUD_KV_GET_BASE + 'meta_cnt', { method: 'GET', signal: ctrlMeta.signal });
                clearTimeout(timerMeta);
                if (respMeta.ok) {
                    const rawMeta = (await respMeta.text()).replace(/^"|"$/g, '').trim();
                    const cnt = parseInt(rawMeta.split('_')[0], 10);
                    if (cnt > 0 && cnt <= 64) {
                        const parts = await Promise.all(Array.from({ length: cnt }, async (_, idx) => {
                            try {
                                const r = await kvSafeFetchV485(CLOUD_KV_GET_BASE + `s_${idx}`);
                                if (!r.ok) return '';
                                return (await r.text()).replace(/^"|"$/g, '').trim();
                            } catch (e) {
                                return '';
                            }
                        }));
                        if (parts.every(Boolean)) {
                            const fullStr = fromBase64UrlSafe(parts.join(''));
                            if (fullStr) {
                                const decodedSnap = JSON.parse(fullStr);
                                if (processIncomingCloudPacket(decodedSnap)) anyChanged = true;
                            }
                        }
                    }
                }
            } catch (e) {}

            if (!silent) {
                showToast(anyChanged
                    ? '🔄 Đã đồng bộ danh sách tài khoản & yêu cầu đăng ký mới nhất từ Đám mây!'
                    : '✅ Hệ thống Đám mây đã đồng bộ mới nhất trên mọi thiết bị!');
            }
            return anyChanged;
        }