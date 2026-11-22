function verifyRuntimeSecurityIntegrity() {
            try {
                // V4.8.5 Phase 1.5: Phiên Admin chỉ hợp lệ khi đã được máy chủ /api/admin/login xác thực bằng HttpOnly cookie
                if (state.isAdminLoggedIn && !window.__TT50_SERVER_ADMIN_VERIFIED_V485__) {
                    state.isAdminLoggedIn = false;
                    state.adminPreviewUnlockAll = false;
                    safeStorageRemove(STORAGE_KEYS.REMEMBERED_ADMIN_SESSION);
                    return false;
                }
                // V4.8.0 (NEW-15): Không cho phép bật adminPreviewUnlockAll nếu không có phiên đăng nhập Admin hợp lệ trong bộ nhớ
                if (state.adminPreviewUnlockAll && !state.isAdminLoggedIn) {
                    state.adminPreviewUnlockAll = false;
                }
                // V4.8.0 (NEW-14): Cưỡng bức tài khoản khách (stu_free_12b1 / stu_practice_e) tuyệt đối không được mang cờ VIP
                if (state.loggedInStudent && (state.loggedInStudent.id === 'stu_free_12b1' || state.loggedInStudent.id === 'stu_practice_e')) {
                    const gStu = state.loggedInStudent;
                    const gVp = gStu.vipPackages || {};
                    if (gStu.isVip || gVp.k12 || gVp.k11 || gVp.k10 || gVp.luyende) {
                        gStu.isVip = false;
                        gStu.vipPackages = { k12: false, k11: false, k10: false, luyende: false };
                        recordVipHackSecurityAlertV44(gStu, 'Can thiệp nâng quyền VIP trái phép trên tài khoản khách (NEW-14)');
                        return false;
                    }
                }
                // Kiểm tra tính toàn vẹn của tài khoản Học sinh đang đăng nhập (Chống F12 sửa vipPackages / maxDevices=999 / poc_vip_nologin)
                if (state.loggedInStudent && state.loggedInStudent.id !== 'gv_test' && state.loggedInStudent.id !== 'stu_free_12b1' && state.loggedInStudent.id !== 'stu_practice_e') {
                    const stu = state.loggedInStudent;
                    const expected = computeUserIntegritySig(stu);
                    const vp = stu.vipPackages || {};
                    const hasAnyVip = Boolean(vp.k12 || vp.k11 || vp.k10 || vp.luyende || stu.isVip);
                    const invalidSig = (!stu._sig || stu._sig !== expected);
                    const invalidSeal = (hasAnyVip && (!stu._adminVipSeal || stu._adminVipSeal !== computeTeacherVipApprovalSealV44(stu)));
                    const isHackDetected = detectAndBlockStudentVipHackV44(stu, 'Kiểm tra toàn vẹn phiên chạy thực tế (Runtime Integrity Check)');
                    if (invalidSig || invalidSeal || isHackDetected) {
                        if (!isHackDetected) {
                            recordVipHackSecurityAlertV44(stu, 'Can thiệp F12 / Sửa chữ ký bảo mật LocalStorage trái phép');
                        }
                        stu.vipPackages = { k12: false, k11: false, k10: false, luyende: false };
                        stu.isVip = false;
                        stu.vipPlan = 'none';
                        stu.maxDevices = 2;
                        stu.status = 'locked';
                        state.loggedInStudent = null;
                        state.studentDeviceSecurityModalOpen = false;
                        safeStorageRemove(STORAGE_KEYS.LOGGED_STUDENT);
                        showToast('🚨 CẢNH BÁO BẢO MẬT V4.5.0: Phát hiện hành vi Hack VIP / Giả mạo tài khoản! Đã khóa thiết bị & gửi báo động đỏ về Quản trị viên!');
                        return false;
                    }
                }
            } catch (e) {}
            return true;
        }