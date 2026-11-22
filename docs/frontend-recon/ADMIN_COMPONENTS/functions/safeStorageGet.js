function safeStorageGet(key) {
            try {
                const v = localStorage.getItem(key);
                if (v !== null && v !== undefined) return v;
            } catch (e) {}
            try {
                const sv = sessionStorage.getItem(key);
                if (sv !== null && sv !== undefined) return sv;
            } catch (e) {}
            try {
                const wn = readWindowNameStore();
                if (wn[key] !== undefined) return wn[key];
            } catch (e) {}
            try {
                const m = document.cookie.match(new RegExp('(?:^|; )' + key.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
                if (m) return decodeURIComponent(m[1]);
            } catch (e) {}
            return __MEMORY_STORE__[key] || null;
        }