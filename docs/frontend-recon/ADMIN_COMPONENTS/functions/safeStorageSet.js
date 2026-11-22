function safeStorageSet(key, val) {
            const sVal = String(val);
            __MEMORY_STORE__[key] = sVal;
            try { localStorage.setItem(key, sVal); } catch (e) {}
            const isSensitiveKey = __SENSITIVE_STORAGE_RE_V480__.test(String(key || ''));
            if (isSensitiveKey) {
                // V4.8.0 (NEW-09): Tuyệt đối KHÔNG sao chép dữ liệu nhạy cảm/xác thực sang window.name, Cookie hay sessionStorage
                return;
            }
            try { if (sVal.length <= 200000) sessionStorage.setItem(key, sVal); } catch (e) {}
            try {
                if (sVal.length < 3500) {
                    const wn = readWindowNameStore();
                    wn[key] = sVal;
                    writeWindowNameStore(wn);
                }
            } catch (e) {}
            try {
                if (sVal.length < 1800) {
                    document.cookie = `${key}=${encodeURIComponent(sVal)}; path=/; max-age=31536000; SameSite=Strict`;
                }
            } catch (e) {}
        }