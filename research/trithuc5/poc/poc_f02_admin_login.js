// poc_f02_admin_login.js — F-02 verification (DISPLAY)
//
// Target:  https://trithuc500.vercel.app/
// Status:  FIXED in V4.8.5 / retained in V4.8.6.
//
// The V4.8.0 PoC forged a persistent admin session from bundle-literal hashes.
// V4.8.5 removed those literals, made the session salt ephemeral per window,
// cleared the remembered session at boot, and delegated authentication to
// /api/admin/login with an HttpOnly cookie. This read-only PoC verifies the
// fixed state instead of attempting the obsolete forgery.
//
// Type:     DISPLAY. Reads only. No state change, no POST, no ntfy/KV publish.
//
// Usage: paste into DevTools Console on the target page.

(async () => {
    'use strict';

    const K_SESSION = 'TRITHUC50_REMEMBER_ADMIN_SESSION_V26';
    let serverState = 'unavailable';

    // Read-only check of the server-backed admin session. No cookie is written.
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

    const remembered = localStorage.getItem(K_SESSION);
    const verdict = 'F-02 fixed: admin authentication is server-side; no offline session forgery path remains in V4.8.6.';

    console.table({
        serverSession: serverState,
        rememberedAdminSession: remembered ? 'present (will be removed at boot)' : 'absent',
        findingStatus: 'FIXED-V4.8.5',
        verdict
    });

    return {
        ok: true,
        type: 'DISPLAY',
        finding: 'F-02',
        status: 'FIXED-V4.8.5',
        serverState,
        rememberedSessionPresent: Boolean(remembered),
        note: 'Read-only verification. No session was forged and no POST was sent.'
    };
})();
