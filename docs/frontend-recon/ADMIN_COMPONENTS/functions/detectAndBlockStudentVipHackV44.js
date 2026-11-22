function detectAndBlockStudentVipHackV44(u, contextLabel) {
            if (!u || typeof u !== 'object') return false;
            const vpCheck = u.vipPackages || {};
            const hasAnyVipEarly = Boolean(vpCheck.k12 || vpCheck.k11 || vpCheck.k10 || vpCheck.luyende || u.isVip || (Array.isArray(u.vp) && u.vp.some(Boolean)));
            // V4.8.0 (NEW-14): Tài khoản khách không được miễn kiểm tra nếu bị gắn cờ VIP trái phép!
            if ((u.id === 'stu_free_12b1' || u.id === 'stu_practice_e') && hasAnyVipEarly) {
                recordVipHackSecurityAlertV44(u, `Phát hiện gắn cờ VIP trái phép trên ID khách (${u.id}) tại [${contextLabel}]`);
                return true;
            }
            if (u.id === 'gv_test' || u.id === 'stu_free_12b1' || u.id === 'stu_practice_e') return false;

            const uName = String(u.username || u.u || '').trim();
            const fullName = String(u.name || u.n || '').trim();
            const gmail = String(u.gmail || u.g || '').trim();
            const maxD = Number(u.maxDevices || u.maxD || 2);
            const vp = u.vipPackages || {};
            const hasAnyVip = Boolean(vp.k12 || vp.k11 || vp.k10 || vp.luyende || u.isVip || (Array.isArray(u.vp) && u.vp.some(Boolean)));

            const dev = getHardwareDeviceProfile();
            if (state.blacklistedDeviceIds && state.blacklistedDeviceIds[dev.deviceId]) {
                recordVipHackSecurityAlertV44(u, `Thiết bị nằm trong Danh sách đen (Blacklisted Device: ${dev.deviceId}) cố tình truy cập`);
                return true;
            }

            // Dấu hiệu 1: Chuỗi poc_vip, nologin, hack, exploit, bypass trong Gmail/Username/Name (Đúng y hệt ảnh PoC poc_vip_nologin_074207@gmail.com)
            if (/(poc_vip|nologin|hack|exploit|bypass|cheat)/i.test(`${uName} ${fullName} ${gmail}`)) {
                recordVipHackSecurityAlertV44(u, `Phát hiện tài khoản PoC Hack VIP không đăng nhập (${gmail || uName}) tại [${contextLabel}]`);
                return true;
            }

            // Dấu hiệu 2: Nâng khống số thiết bị cho phép > 3 (ví dụ: 0 / 999 thiết bị như trong ảnh)
            if (maxD > 3 || maxD < 1 || isNaN(maxD)) {
                recordVipHackSecurityAlertV44(u, `Phát hiện sửa giới hạn thiết bị lên ${maxD} máy (Vượt mức tối đa 2-3 thiết bị) tại [${contextLabel}]`);
                return true;
            }

            // Dấu hiệu 3: Có cờ VIP nhưng rỗng Họ tên hoặc rỗng Username (hiển thị "()" như trong ảnh)
            if (hasAnyVip && (!uName || !fullName || fullName === '()')) {
                recordVipHackSecurityAlertV44(u, `Phát hiện kích hoạt VIP khống không có Họ tên / Tài khoản hợp lệ ("()") tại [${contextLabel}]`);
                return true;
            }

            // Dấu hiệu 4 — V4.8.0 (NEW-13): Kiểm tra bất biến cấu trúc & chữ ký (không chỉ dựa vào từ khóa!)
            if (hasAnyVip && typeof computeUserIntegritySig === 'function' && u.username) {
                const expectedSig = computeUserIntegritySig(u);
                const missingOrBadSig = !u._sig || u._sig !== expectedSig;
                const missingOrBadSeal = (typeof computeTeacherVipApprovalSealV44 === 'function') && (!u._adminVipSeal || u._adminVipSeal !== computeTeacherVipApprovalSealV44(u));
                if (missingOrBadSig || missingOrBadSeal) {
                    recordVipHackSecurityAlertV44(u, `Phát hiện sai lệch chữ ký/seal toàn vẹn VIP (Structural Invariant) tại [${contextLabel}]`);
                    return true;
                }
            }

            return false;
        }