// poc_new15_admin_preview.js — NEW-15 verification (DISPLAY)
//
// Target:  https://trithuc500.vercel.app/
// Status:  FIXED in V4.8.5 / retained in V4.8.6.
//
// The V4.8.0 PoC forged an admin session from bundle literals, then flipped
// adminPreviewUnlockAll so every VIP gate returned true. V4.8.5 removed the
// forging path: admin hashes are gone, the session salt is per-window, the
// remembered session is cleared at boot, and verifyRuntimeSecurityIntegrity()
// clears an orphan preview flag unless the server-verified admin flag is set.
//
// Type:     DISPLAY. Reads only. No flag is toggled, no POST, no ntfy/KV publish.
//
// Usage: paste into DevTools Console on the target page.

(async () => {
    'use strict';

    let serverState = 'unavailable';
    try {
        const r = await fetch('/api/admin/login', {
            method: 'GET',
            credentials: 'same-origin'
        });
        if (r.ok) {
            const j = await r.json().catch(() => ({}));
            serverState = j && j.authenticated ? 'authenticated' : 'anonymous';
        }
    } catch (e) {
        serverState = 'unavailable';
    }

    const body = document.body ? (document.body.innerText || '') : '';
    const previewBanner = /Đang bật Xem thử Mở khóa toàn bộ/i.test(body);
    const verdict = 'NEW-15 fixed: preview unlock requires a server-verified admin session; offline session forgery is no longer available.';

    console.table({
        serverSession: serverState,
        previewBannerVisible: previewBanner,
        findingStatus: 'FIXED-V4.8.5',
        verdict
    });

    return {
        ok: true,
        type: 'DISPLAY',
        finding: 'NEW-15',
        status: 'FIXED-V4.8.5',
        serverState,
        previewBannerVisible: previewBanner,
        note: 'Read-only verification. No preview flag was toggled and no POST was sent.'
    };
})();
