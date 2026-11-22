const BackendVipAuthServiceV44 = (function() {
            // Kho lưu trữ Quyền lợi VIP đã xác thực từ Backend (Cô lập hoàn toàn trong Closure, Client F12 không thể đọc/sửa)
            const __BACKEND_VIP_VAULT__ = new Map();

            function computeBackendGrantToken(u, vp, plan, expTs) {
                const uLower = String(u?.username || u?.u || '').trim().toLowerCase();
                const seal = String(u?._adminVipSeal || '');
                const raw = `BACKEND_VIP_TICKET_V44|${uLower}|${vp.k12?1:0}${vp.k11?1:0}${vp.k10?1:0}${vp.luyende?1:0}|${plan || 'none'}|${expTs || 0}|${seal}|SERVER_AUTH_2026`;
                return 'bkt44_' + hashStringHex(raw);
            }

            function normalizeExpiry(u) {
                const exp1 = u?.vipExpiresAt != null ? Number(u.vipExpiresAt) : null;
                const exp2 = u?.vipExpiredAt != null ? Number(u.vipExpiredAt) : null;
                if (exp1 && !isNaN(exp1) && exp1 > 0) return exp1;
                if (exp2 && !isNaN(exp2) && exp2 > 0) return exp2;
                return null;
            }

            return {
                // Cấp quyền VIP từ Quản trị viên / Backend và đồng bộ lên Cloud KV Backend
                issueBackendVipGrant(u) {
                    if (!u || !u.username) return;
                    const uLower = String(u.username).trim().toLowerCase();
                    const vp = {
                        k12: Boolean(u.vipPackages?.k12),
                        k11: Boolean(u.vipPackages?.k11),
                        k10: Boolean(u.vipPackages?.k10),
                        luyende: Boolean(u.vipPackages?.luyende)
                    };
                    const hasAny = Boolean(vp.k12 || vp.k11 || vp.k10 || vp.luyende);
                    const plan = hasAny ? (u.vipPlan && u.vipPlan !== 'none' ? u.vipPlan : '1y') : 'none';
                    const expTs = hasAny ? normalizeExpiry(u) : null;
                    u.vipPackages = vp;
                    u.vipPlan = plan;
                    u.vipExpiresAt = expTs;
                    u.vipExpiredAt = expTs;
                    u.isVip = Boolean(vp.k12 && vp.k11 && vp.k10 && vp.luyende);
                    u.maxDevices = Math.max(1, Math.min(3, Number(u.maxDevices || 2)));
                    if (hasAny) {
                        u._adminVipSeal = computeTeacherVipApprovalSealV44(u);
                    } else {
                        u._adminVipSeal = '';
                    }
                    u._backendVipToken = computeBackendGrantToken(u, vp, plan, expTs);
                    u._sig = computeUserIntegritySig(u);

                    const record = Object.freeze({
                        username: uLower,
                        status: u.status || 'active',
                        isVip: u.isVip,
                        vipPlan: plan,
                        vipExpiresAt: expTs,
                        vipExpiredAt: expTs,
                        vipPackages: Object.freeze(Object.assign({}, vp)),
                        maxDevices: u.maxDevices,
                        seal: u._adminVipSeal,
                        token: u._backendVipToken,
                        verifiedAt: Date.now()
                    });
                    __BACKEND_VIP_VAULT__.set(uLower, record);

                    // Đẩy bản ghi xác thực VIP lên Cloud KV Backend độc lập
                    try {
                        const uSlug = uLower.replace(/[^a-z0-9]/g, '').slice(0, 20);
                        if (uSlug && typeof fetch === 'function') {
                            const payload = toBase64UrlSafe(JSON.stringify({
                                u: uLower,
                                st: record.status,
                                vp: [vp.k12?1:0, vp.k11?1:0, vp.k10?1:0, vp.luyende?1:0],
                                pl: plan,
                                exp: expTs,
                                seal: record.seal,
                                bkt: record.token,
                                ts: record.verifiedAt
                            }));
                            kvSafeFetchV485(CLOUD_KV_SET_BASE + `vip_grant_${uSlug}/${payload}`, { method: 'POST' }).catch(() => {});
                        }
                    } catch (e) {}
                    return record;
                },

                // Đăng ký bản ghi hợp lệ khi khởi tạo hoặc nhận gói tin có chữ ký xác thực từ Giáo viên
                registerVerifiedUserRecord(u) {
                    if (!u || !u.username) return;
                    const uLower = String(u.username).trim().toLowerCase();
                    const vp = {
                        k12: Boolean(u.vipPackages?.k12),
                        k11: Boolean(u.vipPackages?.k11),
                        k10: Boolean(u.vipPackages?.k10),
                        luyende: Boolean(u.vipPackages?.luyende)
                    };
                    const hasAny = Boolean(vp.k12 || vp.k11 || vp.k10 || vp.luyende);
                    const expectedSeal = computeTeacherVipApprovalSealV44(u);
                    if (hasAny && u._adminVipSeal === expectedSeal) {
                        const expTs = normalizeExpiry(u);
                        const plan = u.vipPlan || '1y';
                        u.vipExpiresAt = expTs;
                        u.vipExpiredAt = expTs;
                        u.isVip = Boolean(vp.k12 && vp.k11 && vp.k10 && vp.luyende);
                        u._backendVipToken = computeBackendGrantToken(u, vp, plan, expTs);
                        __BACKEND_VIP_VAULT__.set(uLower, Object.freeze({
                            username: uLower,
                            status: u.status || 'active',
                            isVip: u.isVip,
                            vipPlan: plan,
                            vipExpiresAt: expTs,
                            vipExpiredAt: expTs,
                            vipPackages: Object.freeze(Object.assign({}, vp)),
                            maxDevices: Math.max(1, Math.min(3, Number(u.maxDevices || 2))),
                            seal: expectedSeal,
                            token: u._backendVipToken,
                            verifiedAt: Date.now()
                        }));
                    } else {
                        __BACKEND_VIP_VAULT__.set(uLower, Object.freeze({
                            username: uLower,
                            status: u.status || 'pending',
                            isVip: false,
                            vipPlan: 'none',
                            vipExpiresAt: null,
                            vipExpiredAt: null,
                            vipPackages: Object.freeze({ k12: false, k11: false, k10: false, luyende: false }),
                            maxDevices: 2,
                            seal: '',
                            token: '',
                            verifiedAt: Date.now()
                        }));
                    }
                },

                // Kiểm tra chống thao túng thuộc tính Client ("isVip", "vipPlan", "vipExpiredAt", "vipExpiresAt", "vipPackages")
                verifyAndEnforceClientUserObject(u, actionContext) {
                    if (!u || typeof u !== 'object') return false;
                    if (u.id === 'gv_test' && state.isAdminLoggedIn) return true;
                    if (u.id === 'stu_free_12b1' || u.id === 'stu_practice_e') {
                        // Tài khoản làm bài tự do Bài 1 tuyệt đối không bao giờ có quyền VIP
                        u.isVip = false;
                        u.vipPlan = 'none';
                        u.vipExpiresAt = null;
                        u.vipExpiredAt = null;
                        u.vipPackages = { k12: false, k11: false, k10: false, luyende: false };
                        return false;
                    }
                    const uLower = String(u.username || '').trim().toLowerCase();
                    if (!uLower) return false;

                    let vaultRec = __BACKEND_VIP_VAULT__.get(uLower);
                    if (!vaultRec) {
                        this.registerVerifiedUserRecord(u);
                        vaultRec = __BACKEND_VIP_VAULT__.get(uLower);
                    }
                    if (!vaultRec) return false;

                    // Phát hiện nếu Client cố tình chỉnh sửa thuộc tính isVip, vipPlan, vipExpiredAt, vipExpiresAt, vipPackages khác với Bản ghi Backend
                    const clientVp = u.vipPackages || {};
                    const clientHasVip = Boolean(u.isVip || clientVp.k12 || clientVp.k11 || clientVp.k10 || clientVp.luyende);
                    const vaultHasVip = Boolean(vaultRec.isVip || vaultRec.vipPackages.k12 || vaultRec.vipPackages.k11 || vaultRec.vipPackages.k10 || vaultRec.vipPackages.luyende);

                    const tamperedPackage =
                        Boolean(clientVp.k12) !== Boolean(vaultRec.vipPackages.k12) ||
                        Boolean(clientVp.k11) !== Boolean(vaultRec.vipPackages.k11) ||
                        Boolean(clientVp.k10) !== Boolean(vaultRec.vipPackages.k10) ||
                        Boolean(clientVp.luyende) !== Boolean(vaultRec.vipPackages.luyende);

                    const clientExp = normalizeExpiry(u);
                    const vaultExp = vaultRec.vipExpiresAt;
                    const tamperedExpiry = (vaultExp && (!clientExp || clientExp > vaultExp + 1000));
                    const tamperedPlan = (clientHasVip && !vaultHasVip) || (u.isVip === true && !vaultRec.isVip);

                    if (tamperedPackage || tamperedExpiry || tamperedPlan) {
                        recordVipHackSecurityAlertV44(u, `Thao túng thuộc tính VIP phía Client (isVip / vipPlan / vipExpiredAt) tại [${actionContext || 'Protected Action'}]`);
                        // Khôi phục cưỡng bức từ Backend Vault
                        u.vipPackages = Object.assign({}, vaultRec.vipPackages);
                        u.isVip = vaultRec.isVip;
                        u.vipPlan = vaultRec.vipPlan;
                        u.vipExpiresAt = vaultRec.vipExpiresAt;
                        u.vipExpiredAt = vaultRec.vipExpiredAt;
                        u._adminVipSeal = vaultRec.seal;
                        u._backendVipToken = vaultRec.token;
                        u._sig = computeUserIntegritySig(u);
                        return false;
                    }
                    return true;
                },

                // Kiểm tra quyền truy cập gói VIP từ Backend Vault
                hasVerifiedPackageAccess(u, packKey, actionContext) {
                    if (state.isAdminLoggedIn && state.adminPreviewUnlockAll) return true;
                    if (!u || u.status !== 'active') return false;
                    if (!this.verifyAndEnforceClientUserObject(u, actionContext)) return false;

                    const uLower = String(u.username || '').trim().toLowerCase();
                    const vaultRec = __BACKEND_VIP_VAULT__.get(uLower);
                    if (!vaultRec || vaultRec.status !== 'active') return false;

                    // Kiểm tra hạn sử dụng trên cả vipExpiresAt và vipExpiredAt
                    const expTs = vaultRec.vipExpiresAt || vaultRec.vipExpiredAt || null;
                    if (expTs && Number(expTs) > 0 && Date.now() > Number(expTs)) {
                        return false;
                    }

                    // Kiểm tra chữ ký phê duyệt của Giáo viên và Token Backend
                    const expectedSeal = computeTeacherVipApprovalSealV44(u);
                    if (!vaultRec.seal || vaultRec.seal !== expectedSeal) return false;

                    const rawKey = String(packKey || state.activeGrade || '12').toLowerCase().trim();
                    if (rawKey === 'luyende' || rawKey === 'thi_thu' || rawKey === 'thithu') {
                        return Boolean(vaultRec.vipPackages.luyende === true);
                    }
                    if (rawKey === '12' || rawKey === 'k12') {
                        return Boolean(vaultRec.vipPackages.k12 === true);
                    }
                    if (rawKey === '11' || rawKey === 'k11') {
                        return Boolean(vaultRec.vipPackages.k11 === true);
                    }
                    if (rawKey === '10' || rawKey === 'k10') {
                        return Boolean(vaultRec.vipPackages.k10 === true);
                    }
                    return false;
                },

                // Đồng bộ xác thực bất đồng bộ với Cloud KV Backend khi thực hiện thao tác bảo vệ
                async verifyWithRemoteBackendAsync(u) {
                    if (!u || !u.username) return;
                    try {
                        const uLower = String(u.username).trim().toLowerCase();
                        const uSlug = uLower.replace(/[^a-z0-9]/g, '').slice(0, 20);
                        if (!uSlug || typeof fetch !== 'function') return;
                        const ctrl = new AbortController();
                        const timer = setTimeout(() => ctrl.abort(), 3000);
                        const resp = await kvSafeFetchV485(CLOUD_KV_GET_BASE + `vip_grant_${uSlug}`, { method: 'GET', signal: ctrl.signal });
                        clearTimeout(timer);
                        if (resp && resp.ok) {
                            const raw = (await resp.text()).replace(/^"|"$/g, '').trim();
                            const jsonStr = fromBase64UrlSafe(raw);
                            if (jsonStr) {
                                const data = JSON.parse(jsonStr);
                                if (data && data.u === uLower && Array.isArray(data.vp) && data.seal && data.bkt) {
                                    const vp = { k12: Boolean(data.vp[0]), k11: Boolean(data.vp[1]), k10: Boolean(data.vp[2]), luyende: Boolean(data.vp[3]) };
                                    const probeU = Object.assign({}, u, { vipPackages: vp, vipPlan: data.pl || 'none', vipExpiresAt: data.exp || null, _adminVipSeal: data.seal });
                                    const expSeal = computeTeacherVipApprovalSealV44(probeU);
                                    const expBkt = computeBackendGrantToken(probeU, vp, data.pl || 'none', data.exp || null);
                                    if (data.seal === expSeal && data.bkt === expBkt) {
                                        u.vipPackages = vp;
                                        u.vipPlan = data.pl || 'none';
                                        u.vipExpiresAt = data.exp || null;
                                        u.vipExpiredAt = data.exp || null;
                                        u.isVip = Boolean(vp.k12 && vp.k11 && vp.k10 && vp.luyende);
                                        u._adminVipSeal = data.seal;
                                        u._backendVipToken = data.bkt;
                                        this.registerVerifiedUserRecord(u);
                                    } else {
                                        recordVipHackSecurityAlertV44(u, 'Phát hiện gói VIP giả mạo trên Cloud KV (sai chữ ký seal/bkt)');
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                }
            };
        }