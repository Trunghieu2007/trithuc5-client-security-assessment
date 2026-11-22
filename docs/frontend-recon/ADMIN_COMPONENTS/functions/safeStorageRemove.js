function safeStorageRemove(key) {
            delete __MEMORY_STORE__[key];
            try { localStorage.removeItem(key); } catch (e) {}
            try { sessionStorage.removeItem(key); } catch (e) {}
            try {
                const wn = readWindowNameStore();
                if (wn[key] !== undefined) {
                    delete wn[key];
                    writeWindowNameStore(wn);
                }
            } catch (e) {}
            try {
                document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
            } catch (e) {}
        }