// v44_vip_bypass_payload.js — TRITHUC5.0 V4.4 (post-patch) local VIP bypass.
//
// Target: https://trithuc500.vercel.app/
// Scope:  LOCAL ONLY. Modifies localStorage of the browser you run it in.
//         Does NOT publish to ntfy.sh / keyvalue.immanuel.co.
//         Does NOT touch real accounts.
//
// Root cause (source-verified, V4.4 build SHA-256 33be09d7…):
//   The V4.4 patch added _adminVipSeal + BackendVipAuthServiceV44 to stop local
//   VIP injection. Both are derived from secrets that live in the public bundle:
//     - computeUserIntegritySig  -> salt "TRITHUC50_SEC_SALT_2026_V27"  (line 3170)
//     - computeTeacherVipApprovalSealV44 -> vaultLockConfig.adminPass,
//       default "THAYTRUNG2026" + literal "THAY_TRUNG_MASTER_SEAL_2026" (lines 10649-10656)
//   So both signatures are reproducible offline by anyone.
//   Additionally, the shipped boot normalizer (lines 2605-2668) AUTO-GRANTS a
//   valid _adminVipSeal to any user whose _sig matches, so a forged _sig alone
//   is enough. The V4.4 detect guard only blocks accounts whose name/gmail
//   contains poc_vip|nologin|hack|exploit|bypass|cheat, whose maxDevices is
//   outside 1..3, or that have an empty name.
//
// Usage: paste into DevTools Console on the target page, then press F5.
//
// Reference implementation of the shipped hashes (copy of the real algorithms):
//   hashStringHex(raw)            -> 2 x FNV-style 32-bit, uppercase hex, 8 chars
//   computeUserIntegritySig(u)    -> 'v27_' + h2 + h1 over the signed field list
//   computeTeacherVipApprovalSealV44(u) -> 'vseal44_' + hashStringHex(raw)

(() => {
    'use strict';

    // ---- 1. Reimplement the two shipped hash primitives exactly. -------------
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

    const INTEGRITY_SALT = 'TRITHUC50_SEC_SALT_2026_V27';
    const SEAL_MASTER = 'THAY_TRUNG_MASTER_SEAL_2026';
    const VAULT_ADMIN_PASS = 'THAYTRUNG2026';

    function computeUserIntegritySig(u) {
        if (!u) return '';
        const vp = u.vipPackages || {};
        const raw = `${u.id || ''}|${(u.username || '').toLowerCase()}|${u.status || ''}|${vp.k12 ? 1 : 0}${vp.k11 ? 1 : 0}${vp.k10 ? 1 : 0}${vp.luyende ? 1 : 0}|${u.vipPlan || 'none'}|${u.vipExpiresAt || 0}|${(u.gmail || '').toLowerCase()}|${u.maxDevices || 2}|${INTEGRITY_SALT}`;
        let h1 = 0xdeadbeef ^ raw.length, h2 = 0x41c6ce57 ^ raw.length;
        for (let i = 0; i < raw.length; i++) {
            const ch = raw.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 'v27_' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
    }

    function computeTeacherVipApprovalSealV44(u) {
        if (!u) return '';
        const vp = u.vipPackages || {};
        const maxD = Math.max(1, Math.min(3, Number(u.maxDevices || 2)));
        const raw = `TT50_VIP_SEAL_V44|${String(u.username || '').toLowerCase()}|${String(u.name || '').trim()}|${String(u.class || '').trim()}|${vp.k12 ? 1 : 0}${vp.k11 ? 1 : 0}${vp.k10 ? 1 : 0}${vp.luyende ? 1 : 0}|MAXD:${maxD}|${VAULT_ADMIN_PASS}|${SEAL_MASTER}`;
        return 'vseal44_' + hashStringHex(raw);
    }

    // ---- 2. Build a synthetic account that passes the V4.4 heuristics. ------
    const stamp = String(Date.now()).slice(-6);
    const NAME = 'nguyenvan' + stamp;          // no poc_vip/nologin/hack/... substring
    const FULLNAME = 'Nguyen Van ' + stamp;    // non-empty, not "()"
    const GMAIL = NAME + '@example.edu.vn';
    const NOW = Date.now();

    const synthetic = {
        id: 'stu_' + NAME,
        username: NAME,
        password: 'SYNTHETIC_POC_ONLY',
        name: FULLNAME,
        class: '12A1',
        stt: '01',
        gmail: GMAIL,
        phone: '',
        status: 'active',
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        requestedPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime',
        requestedPlan: 'lifetime',
        vipExpiresAt: null,
        vipExpiredAt: null,
        vipRequestPending: false,
        isNewRegistration: false,
        isVip: true,
        maxDevices: 2,               // must be 1..3
        trustedDevices: [],
        blockedDevicesLog: [],
        deviceShareViolations: 0,
        registeredAt: '01/01/2026',
        updatedAt: NOW,
        createdInV436: true
    };

    // ---- 3. Forge both signatures offline. ----------------------------------
    synthetic._sig = computeUserIntegritySig(synthetic);
    synthetic._adminVipSeal = computeTeacherVipApprovalSealV44(synthetic);

    // ---- 4. Write into local storage. ---------------------------------------
    const K_USERS = 'TRITHUC50_USERS_V436_CLEAN';
    const K_LOGIN = 'TRITHUC50_LOGGED_STUDENT_V436';
    const K_BACKUP = 'TRITHUC50_AERO_V44_BACKUP';

    const prevUsers = localStorage.getItem(K_USERS);
    const prevLogin = localStorage.getItem(K_LOGIN);
    localStorage.setItem(K_BACKUP, JSON.stringify({ users: prevUsers, login: prevLogin, at: NOW }));

    let users = [];
    try { users = JSON.parse(prevUsers || '[]'); } catch (e) { users = []; }
    if (!Array.isArray(users)) users = [];
    users = users.filter(u => String(u && u.username || '').toLowerCase() !== NAME.toLowerCase());
    users.unshift(synthetic);
    localStorage.setItem(K_USERS, JSON.stringify(users));
    localStorage.setItem(K_LOGIN, JSON.stringify({ username: NAME }));

    console.table({
        username: NAME,
        name: FULLNAME,
        maxDevices: synthetic.maxDevices,
        vipPackages: Object.keys(synthetic.vipPackages).filter(k => synthetic.vipPackages[k]).join(','),
        vipPlan: synthetic.vipPlan,
        _sig: synthetic._sig,
        _adminVipSeal: synthetic._adminVipSeal,
        scope: 'LOCAL ONLY — no ntfy/KV publish'
    });
    console.log('[Aero] V4.4 bypass written. Press F5 to boot with VIP.');

    window.__AERO_V44_RESTORE__ = function () {
        const b = localStorage.getItem(K_BACKUP);
        if (!b) return console.warn('[Aero] no backup found');
        const saved = JSON.parse(b);
        if (saved.users === null) localStorage.removeItem(K_USERS);
        else localStorage.setItem(K_USERS, saved.users);
        if (saved.login === null) localStorage.removeItem(K_LOGIN);
        else localStorage.setItem(K_LOGIN, saved.login);
        localStorage.removeItem(K_BACKUP);
        delete window.__AERO_V44_RESTORE__;
        console.log('[Aero] original state restored. Press F5.');
        return true;
    };
    console.log('Restore: __AERO_V44_RESTORE__() then F5');

    return { ok: true, username: NAME, scope: 'LOCAL ONLY' };
})();
