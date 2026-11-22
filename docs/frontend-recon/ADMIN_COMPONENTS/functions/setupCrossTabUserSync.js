const setupCrossTabUserSync = () => {
            window.addEventListener('storage', (e) => {
                if (!e || !e.key) return;
                if (e.key === STORAGE_KEYS.USERS || e.key === 'TRITHUC50_NEW_REG_ALERT' || e.key === STORAGE_KEYS.ACTIVITY_LOGS) {
                    try {
                        const rawU = safeStorageGet(STORAGE_KEYS.USERS);
                        if (rawU) {
                            const parsedU = JSON.parse(rawU);
                            if (Array.isArray(parsedU)) {
                                // V4.8.0 (NEW-07): Xác thực chữ ký & seal từng tài khoản trước khi đồng bộ giữa các tab, tước quyền VIP nếu giả mạo
                                state.users = parsedU.filter(u => u && typeof u === 'object' && u.username).map(u => {
                                    const vp = u.vipPackages || {};
                                    const hasVip = Boolean(vp.k12 || vp.k11 || vp.k10 || vp.luyende || u.isVip);
                                    if (hasVip) {
                                        const okSig = u._sig && u._sig === computeUserIntegritySig(u);
                                        const okSeal = u._adminVipSeal && u._adminVipSeal === computeTeacherVipApprovalSealV44(u);
                                        if (!okSig || !okSeal) {
                                            u.vipPackages = { k12: false, k11: false, k10: false, luyende: false };
                                            u.isVip = false;
                                            u.vipPlan = 'none';
                                        }
                                    }
                                    return u;
                                });
                            }
                        }
                        const rawL = safeStorageGet(STORAGE_KEYS.ACTIVITY_LOGS);
                        if (rawL) {
                            const parsedL = JSON.parse(rawL);
                            if (Array.isArray(parsedL)) state.activityLogs = parsedL;
                        }
                        if (e.key === 'TRITHUC50_NEW_REG_ALERT' && e.newValue === '1') {
                            state.hasNewPendingRegistration = true;
                            if (state.view === 'admin') {
                                showToast('🔔 Vừa có học sinh mới đăng ký tài khoản chờ Thầy duyệt!');
                            }
                        }
                        renderApp(true);
                    } catch (err) {}
                }
            });
        }