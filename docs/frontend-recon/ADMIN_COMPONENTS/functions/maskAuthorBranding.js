function maskAuthorBranding(rawStr) {
            let s = String(rawStr == null ? '' : rawStr);
            if (!state || !state.hideAuthorInfo || !s) return s;
            if (!__AUTHOR_BRAND_FAST_RE_V463__.test(s)) return s;
            return s
                .replace(/[•\-–—|]*\s*LỚP TOÁN(?: ONLINE)? THẦY TRUNG\s*[•\-–—|]*/gi, ' ')
                .replace(/LỚP TOÁN(?: ONLINE)? THẦY TRUNG/gi, 'HỆ THỐNG TOÁN TRITHUC5.0')
                .replace(/TOÁN THẦY TRUNG/gi, 'TOÁN TRITHUC5.0')
                .replace(/[•\-–—|]*\s*Tác giả:\s*(?:<b>)?\s*Thầy Trương Quang Trung\s*(?:<\/b>)?/gi, '')
                .replace(/của Thầy Trương Quang Trung/gi, 'của Hệ thống TRITHUC5.0')
                .replace(/từ Thầy Trương Quang Trung/gi, 'từ Hệ thống TRITHUC5.0')
                .replace(/\(\s*(?:<b>)?\s*Thầy Trương Quang Trung\s*(?:<\/b>)?\s*\)/gi, '')
                .replace(/Thầy Trương Quang Trung\s*[•\-–—]\s*Sở Giáo dục và Đào tạo Hà Nội/gi, 'Hệ thống Học & Thi Toán THPT TRITHUC5.0')
                .replace(/Thầy Trương Quang Trung\s*[•\-–—]\s*Sở GD&ĐT Hà Nội/gi, 'Hệ thống Học & Thi Toán THPT TRITHUC5.0')
                .replace(/[•\-–—|]+\s*THẦY TRƯƠNG QUANG TRUNG/gi, '')
                .replace(/[•\-–—|]+\s*THẦY TRUNG/gi, '')
                .replace(/Thầy Trương Quang Trung/gi, 'Ban Chuyên Môn TRITHUC5.0')
                .replace(/Ghi chú gửi Thầy Trung/gi, 'Ghi chú gửi Quản trị viên')
                .replace(/Cho Thầy Trung/gi, 'Cho Quản Trị Viên')
                .replace(/của Thầy Trung/gi, 'của Hệ thống')
                .replace(/về Thầy Trung/gi, 'về Quản trị hệ thống')
                .replace(/liên hệ trực tiếp Thầy Trung/gi, 'liên hệ Quản trị viên')
                .replace(/xin\s*<b>\s*Thầy Trung/gi, 'xin <b>Quản trị viên')
                .replace(/gửi Thầy Trung/gi, 'gửi Quản trị viên')
                .replace(/chờ Thầy Trung/gi, 'chờ Quản trị viên')
                .replace(/Thầy Trung/gi, 'Giáo viên');
        }