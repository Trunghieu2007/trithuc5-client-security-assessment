/* No-login VIP — LOCAL-ONLY console payload (real Chrome)
 * ================================================================
 * Run: paste into DevTools Console on https://trithuc500.vercel.app/
 *
 * Why no login is needed:
 *  - boot loads TRITHUC50_USERS_V436_CLEAN into state.users (line 2257)
 *  - boot loads TRITHUC50_LOGGED_STUDENT_V436 and sets loggedInStudent
 *    only by matching `username` against state.users (line 2357-2361).
 *    NO password check on this path.
 *  - a user WITHOUT `_sig` skips the VIP-strip branch (line 2303) and
 *    is re-signed with the hardcoded salt at line 2322.
 *
 * Effect: THIS browser profile only. No ntfy/KV write. No real user
 * read or modified. Synthetic password placeholder only.
 *
 * Cleanup: __AERO_NO_LOGIN_VIP_RESTORE__() then F5.
 */
(() => {
  'use strict';

  const K_USERS = 'TRITHUC50_USERS_V436_CLEAN';
  const K_LOGIN = 'TRITHUC50_LOGGED_STUDENT_V436';
  const K_BACKUP = 'TRITHUC50_AERO_NOLOGIN_BACKUP';

  if (localStorage.getItem(K_BACKUP)) {
    return console.warn('[no-login VIP] already active. Restore first with __AERO_NO_LOGIN_VIP_RESTORE__()');
  }

  const rawUsers = localStorage.getItem(K_USERS);
  const rawLogin = localStorage.getItem(K_LOGIN);
  localStorage.setItem(K_BACKUP, JSON.stringify({
    users: rawUsers, login: rawLogin, savedAt: Date.now()
  }));

  const NAME = 'poc_vip_nologin_' + String(Date.now()).slice(-6);
  const now = Date.now();

  // Synthetic full-format user. NOTE: `_sig` deliberately OMITTED.
  const synthetic = {
    id: 'stu_' + NAME,
    username: NAME,
    password: 'SYNTHETIC_POC_ONLY',
    name: 'POC VIP no-login',
    class: '12A1', stt: '99',
    gmail: NAME + '@gmail.com',
    phone: '',
    status: 'active',
    vipPackages: { k12: true, k11: true, k10: true, luyende: true },
    requestedPackages: { k12: true, k11: true, k10: true, luyende: true },
    isVip: true,
    vipPlan: 'lifetime',
    requestedPlan: '1y',
    vipExpiresAt: null,
    vipRequestPending: false,
    isNewRegistration: false,
    maxDevices: 999,
    trustedDevices: [],
    blockedDevicesLog: [],
    deviceShareViolations: 0,
    registeredAt: 'POC',
    updatedAt: now,
    createdInV436: true
    // no _sig -> boot re-signs with the bundle's hardcoded salt
  };

  const users = rawUsers ? JSON.parse(rawUsers) : [];
  if (!Array.isArray(users)) throw new Error('unexpected users format');
  users.unshift(synthetic);
  localStorage.setItem(K_USERS, JSON.stringify(users));

  // Boot matches by username only; full object is harmless and keeps UI fields populated.
  localStorage.setItem(K_LOGIN, JSON.stringify(synthetic));

  console.table({
    username: NAME,
    status: synthetic.status,
    vip: 'k12+k11+k10+luyende',
    plan: synthetic.vipPlan,
    hasSig: false,
    backupKey: K_BACKUP
  });
  console.log('[no-login VIP] state written. Press F5. No login form needed.');

  window.__AERO_NO_LOGIN_VIP_RESTORE__ = function () {
    const b = localStorage.getItem(K_BACKUP);
    if (!b) return console.warn('[no-login VIP] no backup found');
    const saved = JSON.parse(b);
    if (saved.users === null) localStorage.removeItem(K_USERS);
    else localStorage.setItem(K_USERS, saved.users);
    if (saved.login === null) localStorage.removeItem(K_LOGIN);
    else localStorage.setItem(K_LOGIN, saved.login);
    localStorage.removeItem(K_BACKUP);
    delete window.__AERO_NO_LOGIN_VIP_RESTORE__;
    console.log('[no-login VIP] original localStorage restored. Press F5.');
    return true;
  };

  return { ok: true, username: NAME, note: 'LOCAL ONLY. No ntfy/KV publish. Reload to activate.' };
})();
