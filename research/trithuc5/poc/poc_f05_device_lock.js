// poc_f05_device_lock.js — F-05: device / Gmail binding restrictions
//                          (DISPLAY + LOCAL ACTION — inspect then optionally unlock)
//
// Target:  https://trithuc500.vercel.app/
// Finding:  F-05 — the device limit and the Gmail binding are enforced purely
//           client-side, from fields the client owns:
//             - `u.trustedDevices`   (array of bound devices)
//             - `u.maxDevices`       (the limit itself, capped at 3 by the
//                                    V4.5 normalizer)
//             - `u.gmail`            (the identity binding)
//             - `u.status`           ('locked' when auto-locked)
//           The enforcement path is `verifyAndBindStudentDeviceOnLogin`
//           (line 3044), which reads those fields directly.
//
// Type:     DISPLAY by default — it shows the current binding state and the
//           device fingerprint. The unlock action is opt-in and LOCAL only.
//
// SCOPE / SAFETY:
//   - Reads local state and the current device profile. No network writes.
//   - The unlock only clears LOCAL fields in your own browser. It does not
//     unlock the account on any server (there is no server account store).
//   - `__AERO_F05_RESTORE__()` reverts everything.
//
// Usage: paste into DevTools Console on the target page.

(() => {
    'use strict';

    const K_USERS = 'TRITHUC50_USERS_V436_CLEAN';
    const K_BACKUP = 'TRITHUC50_AERO_F05_BACKUP';

    const APPLY_UNLOCK = false;   // set true to actually clear the device lock

    // ---- 1. Read the current device fingerprint the app would use. --------
    // Mirrors getHardwareDeviceProfile() (line 2952) without needing internals.
    function readDeviceProfile() {
        const ua = String(navigator.userAgent || '');
        let osName = 'Windows PC';
        if (/iPhone|iPad|iPod/i.test(ua)) osName = 'iOS (iPhone/iPad)';
        else if (/Android/i.test(ua)) osName = 'Android';
        else if (/Mac OS X|Macintosh/i.test(ua)) osName = 'macOS';
        else if (/Linux/i.test(ua)) osName = 'Linux';

        let browserName = 'Chrome';
        if (/CocCoc|coc_coc_browser/i.test(ua)) browserName = 'Cốc Cốc';
        else if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
        else if (/Firefox\//i.test(ua)) browserName = 'Firefox';

        // The app derives the stable device id from a localStorage install token.
        let installToken = null;
        for (const k of Object.keys(localStorage)) {
            if (/DEVICE_HW_TOKEN|INSTALL_TOKEN/i.test(k)) { installToken = localStorage.getItem(k); break; }
        }
        return {
            osName,
            browserName,
            deviceId: installToken || '(install token not found in localStorage)',
            cores: navigator.hardwareConcurrency || 4,
            screen: `${window.screen?.width || '?'}x${window.screen?.height || '?'}`,
            timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return '?'; } })()
        };
    }

    // ---- 2. Read the current account's binding state. ----------------------
    const raw = localStorage.getItem(K_USERS);
    let users = [];
    try { users = JSON.parse(raw || '[]'); } catch (e) { users = []; }
    if (!Array.isArray(users)) users = [];

    const loginRaw = localStorage.getItem('TRITHUC50_LOGGED_STUDENT_V436');
    let login = null;
    try { login = JSON.parse(loginRaw || 'null'); } catch (e) { login = null; }

    const me = login ? users.find(u => String(u.username || '').toLowerCase() === String(login.username || '').toLowerCase()) : null;

    console.log('=== F-05 device / Gmail binding (read-only unless APPLY_UNLOCK) ===');
    const prof = readDeviceProfile();
    console.table({ deviceId: prof.deviceId, os: prof.osName, browser: prof.browserName, screen: prof.screen, cores: prof.cores, timezone: prof.timezone });

    if (!me) {
        console.log('[F-05] no logged-in student found in local state.');
        console.log('       accounts present:', users.map(u => u.username).join(', ') || '(none)');
        return { device: prof, account: null, verdict: 'no logged-in account' };
    }

    const bound = Array.isArray(me.trustedDevices) ? me.trustedDevices : [];
    console.table([{
        username: me.username,
        status: me.status,
        gmail: me.gmail,
        maxDevices: me.maxDevices,
        boundDevices: bound.length,
        deviceShareViolations: me.deviceShareViolations || 0,
        blockedDeviceLog: (me.blockedDevicesLog || []).length,
        lockReason: me.lockReason || '(none)',
        currentDeviceBound: bound.some(d => d.deviceId === prof.deviceId)
    }]);

    if (bound.length) {
        console.table(bound.map(d => ({
            deviceId: d.deviceId, type: d.deviceType || d.shortType || '',
            os: d.osBrowser || '', boundAt: d.boundAt || '', lastActive: d.lastActiveAt || ''
        })));
    }

    // ---- 3. Explain what a bypass consists of. ---------------------------
    console.log('[F-05] Enforcement reads only these client-owned fields:');
    console.log('       u.trustedDevices (bound device list)');
    console.log('       u.maxDevices     (the limit, clamped 1..3)');
    console.log('       u.gmail          (Gmail identity binding)');
    console.log('       u.status         ("locked" after auto-lock)');
    console.log('       → clearing trustedDevices + status, and raising maxDevices to 3,');
    console.log('         makes verifyAndBindStudentDeviceOnLogin bind this device instead of blocking.');

    // ---- 4. Optional local unlock. ---------------------------------------
    if (!APPLY_UNLOCK) {
        console.log('\n[F-05] APPLY_UNLOCK = false → nothing was changed.');
        console.log('       Set APPLY_UNLOCK = true and re-run to clear the local device lock.');
        return {
            device: prof,
            account: { username: me.username, status: me.status, maxDevices: me.maxDevices, boundDevices: bound.length },
            verdict: 'display only — no change applied'
        };
    }

    if (!localStorage.getItem(K_BACKUP)) {
        localStorage.setItem(K_BACKUP, JSON.stringify({ users: raw, at: Date.now() }));
    }

    const before = { status: me.status, maxDevices: me.maxDevices, bound: bound.length };
    me.status = 'active';
    me.lockReason = '';
    me.deviceShareViolations = 0;
    me.maxDevices = 3;
    me.trustedDevices = [];
    me.blockedDevicesLog = [];

    users = users.map(u => (u.username === me.username ? me : u));
    localStorage.setItem(K_USERS, JSON.stringify(users));

    console.table({
        status: `${before.status} → ${me.status}`,
        maxDevices: `${before.maxDevices} → ${me.maxDevices}`,
        boundDevices: `${before.bound} → ${me.trustedDevices.length}`,
        note: 'local only — reload to bind this device as slot 1'
    });
    console.log('[F-05] local device lock cleared. Press F5 to log in again — this device binds as slot 1.');

    window.__AERO_F05_RESTORE__ = function () {
        const b = localStorage.getItem(K_BACKUP);
        if (!b) return console.warn('[F-05] no backup found');
        const saved = JSON.parse(b);
        if (saved.users === null) localStorage.removeItem(K_USERS);
        else localStorage.setItem(K_USERS, saved.users);
        localStorage.removeItem(K_BACKUP);
        delete window.__AERO_F05_RESTORE__;
        console.log('[F-05] original state restored. Press F5.');
        return true;
    };
    console.log('Restore: __AERO_F05_RESTORE__() then F5');

    return {
        device: prof,
        before,
        after: { status: me.status, maxDevices: me.maxDevices, boundDevices: me.trustedDevices.length },
        verdict: 'F-05 device lock cleared LOCALLY (no server involvement)'
    };
})();
