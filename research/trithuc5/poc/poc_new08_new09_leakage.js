// poc_new08_new09_leakage.js — NEW-08 / NEW-09: credential leakage surfaces
//                                   (DISPLAY ONLY — inspect, do not exfiltrate)
//
// Target:  https://trithuc500.vercel.app/
// Findings:
//   NEW-08 — FIXED in V5.4.6: `dispatchParamsToGoogleFormUrl` returns false
//            immediately. `logStudentActivity` still writes a masked local
//            entry, but no Google Form payload is produced.
//   NEW-09 — `safeStorageSet` (line 1562) mirrors EVERY value it stores into
//            three extra channels: `sessionStorage`, `window.name` (as
//            `__TRITHUC_WN__:` JSON) and a first-party cookie. The user table
//            (which contains passwords) is therefore copied to all of them.
//
// Type:     DISPLAY ONLY. It enumerates the leak surfaces and prints
//           structural evidence. It never transmits anything.
//
// Usage: paste into DevTools Console on the target page.

(() => {
    'use strict';

    console.log('=== NEW-08 / NEW-09 leakage surfaces (DISPLAY ONLY) ===');

    // ---- 1. NEW-09: what is mirrored where? -----------------------------
    const wnRaw = window.name || '';
    let wn = {};
    try {
        if (wnRaw.startsWith('__TRITHUC_WN__:')) wn = JSON.parse(wnRaw.slice(15));
    } catch (e) { wn = {}; }

    const cookies = document.cookie.split(';').map(s => s.trim()).filter(Boolean);

    const SENSITIVE = /USER|ADMIN|CRED|PASS|SESSION|VIP|SEAL|TOKEN|GEMINI|KEY/i;
    const mirrorRows = Object.keys(wn).map(k => ({
        channel: 'window.name',
        key: k,
        length: String(wn[k]).length,
        sensitive: SENSITIVE.test(k)
    }));

    console.log(`[NEW-09] window.name keys: ${Object.keys(wn).length}`);
    console.log(`[NEW-09] document.cookie entries: ${cookies.length}`);
    if (mirrorRows.length) console.table(mirrorRows);

    // Show the raw key list (names only, no values) for the storage layers.
    const lsKeys = [];
    try { for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i)); } catch (e) {}
    const ssKeys = [];
    try { for (let i = 0; i < sessionStorage.length; i++) ssKeys.push(sessionStorage.key(i)); } catch (e) {}

    console.table([
        { layer: 'localStorage', count: lsKeys.length, sensitiveKeys: lsKeys.filter(k => SENSITIVE.test(k)).length },
        { layer: 'sessionStorage', count: ssKeys.length, sensitiveKeys: ssKeys.filter(k => SENSITIVE.test(k)).length },
        { layer: 'window.name', count: Object.keys(wn).length, sensitiveKeys: Object.keys(wn).filter(k => SENSITIVE.test(k)).length },
        { layer: 'document.cookie', count: cookies.length, sensitiveKeys: cookies.filter(c => SENSITIVE.test(c.split('=')[0])).length }
    ]);

    // Does the mirrored set actually contain the user table (with passwords)?
    const userKey = 'TRITHUC50_USERS_V436_CLEAN';
    const lsUsers = (() => { try { return JSON.parse(localStorage.getItem(userKey) || '[]'); } catch (e) { return []; } })();
    const mirroredUsers = (() => { try { return JSON.parse(wn[userKey] || '[]'); } catch (e) { return []; } })();
    const hasPasswordField = (arr) => arr.some(u => u && Object.prototype.hasOwnProperty.call(u, 'password'));

    console.log(`[NEW-09] user table in localStorage: ${lsUsers.length} record(s), password field present: ${hasPasswordField(lsUsers)}`);
    console.log(`[NEW-09] user table mirrored into window.name: ${mirroredUsers.length} record(s), password field present: ${hasPasswordField(mirroredUsers)}`);

    const cookieHasUsers = cookies.some(c => c.startsWith(userKey + '='));
    console.log(`[NEW-09] user table present in document.cookie: ${cookieHasUsers}`);
    if (cookieHasUsers || hasPasswordField(mirroredUsers)) {
        console.warn('[NEW-09] CONFIRMED: the password-bearing user table is copied into a');
        console.warn('         cookie and/or window.name. window.name survives cross-origin');
        console.warn('         navigation, and cookies are sent to the server on every request.');
    }

    // ---- 2. NEW-08: activity-log entries and the Google Form target. -----
    const logsKey = 'TRITHUC50_ACTIVITY_LOGS';
    let logs = [];
    try { logs = JSON.parse(localStorage.getItem(logsKey) || '[]'); } catch (e) { logs = []; }
    if (!Array.isArray(logs)) logs = [];

    console.log(`\n[NEW-08] activity log entries stored locally: ${logs.length}`);
    const logsWithSecret = logs.filter(l => {
        const blob = JSON.stringify(l);
        return /pass|mật khẩu|pwd|123456/i.test(blob);
    });
    console.log(`[NEW-08] entries whose text matches a password-like pattern: ${logsWithSecret.length}`);
    if (logs.length) {
        console.table(logs.slice(0, 15).map(l => ({
            time: l.timeStr || '', user: l.username || '', action: l.actionType || '',
            detail: String(l.detail || '').slice(0, 70),
            syncedToGForm: l.syncedToGForm === true
        })));
    }

    // Where does the log get sent?
    let gformUrl = null;
    for (const k of lsKeys) {
        if (/GFORM|GOOGLE_FORM|FORM_CONFIG/i.test(k)) {
            try {
                const v = JSON.parse(localStorage.getItem(k) || '{}');
                if (v && (v.actionUrl || v.rawInputUrl || v.rawPrefillUrl)) {
                    gformUrl = v.actionUrl || v.rawInputUrl || v.rawPrefillUrl;
                    console.log(`[NEW-08] Google Form config key: ${k}`);
                    break;
                }
            } catch (e) { /* ignore */ }
        }
    }
    console.log(`[NEW-08] configured Google Form endpoint: ${gformUrl || '(not configured on this client)'}`);

    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '');
    const gformDisabled = scripts.some(t => t.includes('V5.4.6: Đã gỡ bỏ hoàn toàn Google Form') && t.includes('return false;'));
    const anySynced = logs.some(l => l.syncedToGForm === true);
    console.log(`[NEW-08] source dispatch disabled: ${gformDisabled}`);
    console.log(`[NEW-08] local log entries marked syncedToGForm: ${logs.filter(l => l.syncedToGForm === true).length}`);
    if (gformDisabled && !anySynced) {
        console.log('[NEW-08] FIXED-V5.4.6: no Google Form payload is produced by the shipped client.');
    } else if (!gformDisabled) {
        console.warn('[NEW-08] still present: dispatch path not disabled in this build.');
    }

    // ---- 3. Summary --------------------------------------------------------
    return {
        new08: {
            activityLogEntries: logs.length,
            entriesWithPasswordPattern: logsWithSecret.length,
            googleFormEndpoint: gformUrl || null,
            gformDispatchDisabled: gformDisabled,
            logEntriesMarkedSynced: logs.filter(l => l.syncedToGForm === true).length,
            verdict: gformDisabled && !anySynced
                ? 'FIXED-V5.4.6 — Google Form dispatch disabled; masked local log only'
                : (gformUrl ? 'CONFIRMED — log details leave the site via a third-party form' : 'no form endpoint configured on this client')
        },
        new09: {
            windowNameKeys: Object.keys(wn).length,
            cookieEntries: cookies.length,
            userTableInLocalStorage: lsUsers.length,
            userTableInWindowName: mirroredUsers.length,
            passwordFieldInLocalStorage: hasPasswordField(lsUsers),
            passwordFieldInWindowName: hasPasswordField(mirroredUsers),
            userTableInCookie: cookieHasUsers,
            verdict: (hasPasswordField(mirroredUsers) || cookieHasUsers)
                ? 'CONFIRMED — the password-bearing table is mirrored to cookie/window.name'
                : 'mirror channels present but the user table was not mirrored at this moment'
        },
        note: 'Display only. Nothing was transmitted. Re-run after performing an action to see fresh log entries.'
    };
})();
