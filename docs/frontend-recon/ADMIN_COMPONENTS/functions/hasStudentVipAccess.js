function hasStudentVipAccess(gradeOrPack) {
            // Chỉ mở toàn bộ khi Giáo viên chủ động bật nút "👁️ Xem thử chế độ Mở khóa toàn bộ"
            if (state.isAdminLoggedIn && state.adminPreviewUnlockAll) return true;
            const stu = state.loggedInStudent;
            if (!stu || stu.status !== 'active') return false;
            // Kiểm tra chữ ký bảo mật chống sửa LocalStorage
            if (!verifyRuntimeSecurityIntegrity()) return false;
            if (!stu._sig || stu._sig !== computeUserIntegritySig(stu)) return false;
            if (Number(stu.maxDevices || 2) > 3) return false;
            if (stu.vipExpiredAt && Number(stu.vipExpiredAt) > 0 && Date.now() > Number(stu.vipExpiredAt)) return false;
            if (!BackendVipAuthServiceV44.hasVerifiedPackageAccess(stu, gradeOrPack, 'hasStudentVipAccess')) return false;
            // Kiểm tra thời hạn gói VIP (nếu đã hết hạn thì tự động khóa lại)
            if (isStudentVipExpired(stu)) return false;

            const vp = stu.vipPackages || {};
            const rawKey = String(gradeOrPack || state.activeGrade || '12').toLowerCase().trim();
            if (rawKey === 'luyende' || rawKey === 'thi_thu' || rawKey === 'thithu') {
                return Boolean(vp.luyende === true);
            }
            if (rawKey === '12' || rawKey === 'k12') {
                return Boolean(vp.k12 === true);
            }
            if (rawKey === '11' || rawKey === 'k11') {
                return Boolean(vp.k11 === true);
            }
            if (rawKey === '10' || rawKey === 'k10') {
                return Boolean(vp.k10 === true);
            }
            return false;
        }