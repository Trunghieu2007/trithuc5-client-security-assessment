// phase4_tests.js — Phase 4 regression tests against TRITHUC5.0 V4.5 (post-patch source).
// Goal: prove which of the V4.5 anti-hack guards still hold and which can be bypassed.
// All tests run locally against extracted real functions. No production traffic.
//
// Usage: node phase4_tests.js

'use strict';
const h = require('./phase4_harness.js');

let pass = 0, fail = 0;
const failures = [];

function test(id, title, fn) {
    try {
        const r = fn();
        if (r === false) throw new Error('assertion returned false');
        pass++;
        console.log(`PASS ${id}  ${title}`);
    } catch (e) {
        fail++;
        failures.push(`${id}: ${e.message}`);
        console.log(`FAIL ${id}  ${title}\n       ${e.message}`);
    }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function eq(a, b, msg) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
        throw new Error(`${msg || 'not equal'}: got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
    }
}

const NOW = 1795000000000;
const env = h.createEnv({ now: NOW });
const E = env;
const svc = E.BackendVipAuthServiceV44;

// ---------------------------------------------------------------------------
// P4-01  Baseline: the V4.5 guard DOES detect the original PoC shape.
// ---------------------------------------------------------------------------
test('P4-01', 'baseline: V4.5 detectAndBlock rejects maxDevices=999 PoC shape', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({ maxDevices: 999, vipPackages: { k12: true, k11: true, k10: true, luyende: true }, isVip: true });
    const blocked = e.detectAndBlockStudentVipHackV44(u, 'test');
    assert(blocked === true, 'expected PoC shape to be blocked');
    assert(e.__meta.calls.alerts.length >= 0);
});

// ---------------------------------------------------------------------------
// P4-02  Keyword-based blacklist is trivially evaded by renaming the account.
// ---------------------------------------------------------------------------
test('P4-02', 'V4.8.0 FIX: structural invariant catches unsigned VIP flags even after renaming', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        username: 'nguyenvana', name: 'Nguyen Van A',
        gmail: 'nguyenvana@example.edu.vn',
        maxDevices: 2,
        vipPackages: { k12: true, k11: true, k10: true, luyende: true }, isVip: true
    });
    eq(e.detectAndBlockStudentVipHackV44(u, 'test'), true,
        'renamed account with VIP but no sig/seal is now detected');
    // Residual: recompute both bundle-derived artifacts offline and the guard is silent again.
    u._sig = e.computeUserIntegritySig(u);
    u._adminVipSeal = e.computeTeacherVipApprovalSealV44(u);
    eq(e.detectAndBlockStudentVipHackV44(u, 'test'), false,
        'offline-forged sig+seal still evade the structural invariant');
});

// ---------------------------------------------------------------------------
// P4-03  The _adminVipSeal is computed from a CLIENT-SIDE secret.
//          If the secret is derivable from the bundle, the seal is forgeable.
// ---------------------------------------------------------------------------
test('P4-03', 'bypass: _adminVipSeal secret (vaultLockConfig.adminPass) is client-side and forgeable', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', maxDevices: 2
    });
    const seal = e.computeTeacherVipApprovalSealV44(u);
    assert(/^vseal44_/.test(seal), 'unexpected seal format: ' + seal);
    // Same secret + same fields => same seal, computed by anyone offline.
    const e2 = h.createEnv({ now: NOW });
    const u2 = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', maxDevices: 2
    });
    eq(e2.computeTeacherVipApprovalSealV44(u2), seal, 'seal is reproducible outside the app');
});

// ---------------------------------------------------------------------------
// P4-04  FULL CHAIN: forge seal + sig -> BackendVipAuthService grants VIP access.
//          This is the core bypass of the V4.5 patch.
// ---------------------------------------------------------------------------
test('P4-04', 'bypass: forged seal+sig grants verified VIP package access via BackendVipAuthServiceV44', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', vipExpiresAt: null, vipExpiredAt: null,
        isVip: true, maxDevices: 2
    });
    // Attacker computes the teacher seal (secret is client-side) and the integrity sig.
    u._adminVipSeal = e.computeTeacherVipApprovalSealV44(u);
    u._sig = e.computeUserIntegritySig(u);

    e.state.loggedInStudent = u;
    const svc4 = e.BackendVipAuthServiceV44;
    svc4.registerVerifiedUserRecord(u);

    const ok = svc.hasVerifiedPackageAccess(u, '12', 'P4-04');
    assert(ok === true, 'expected forged account to pass verified package access');
    const luyendeOk = svc.hasVerifiedPackageAccess(u, 'luyende', 'P4-04');
    assert(luyendeOk === true, 'expected forged account to pass luyende access');
});

// ---------------------------------------------------------------------------
// P4-05  Negative control: an UNSEALED account must be denied.
// ---------------------------------------------------------------------------
test('P4-05', 'negative control: account without a valid seal is denied VIP access', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', isVip: true, maxDevices: 2
    });
    u._sig = e.computeUserIntegritySig(u);
    e.state.loggedInStudent = u;
    const s = e.BackendVipAuthServiceV44;
    s.registerVerifiedUserRecord(u);
    const ok = s.hasVerifiedPackageAccess(u, '12', 'P4-05');
    assert(ok === false, 'unsealed account must not get VIP access');
});

// ---------------------------------------------------------------------------
// P4-06  Negative control: tampering after registration is reverted by the vault.
// ---------------------------------------------------------------------------
test('P4-06', 'negative control: post-registration tampering is reverted to vault state', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', isVip: true, maxDevices: 2
    });
    u._adminVipSeal = e.computeTeacherVipApprovalSealV44(u);
    u._sig = e.computeUserIntegritySig(u);
    const s = e.BackendVipAuthServiceV44;
    s.registerVerifiedUserRecord(u);
    // Attacker flips a package after registration.
    u.vipPackages = { k12: true, k11: true, k10: true, luyende: false };
    const enforced = s.verifyAndEnforceClientUserObject(u, 'P4-06');
    assert(enforced === false, 'tampering should be rejected');
    eq(u.vipPackages.luyende, true, 'luyende should be restored from vault');
});

// ---------------------------------------------------------------------------
// P4-07  The seal does NOT bind maxDevices beyond clamping to 1..3,
//          and does NOT bind the expiry timestamp.
// ---------------------------------------------------------------------------
test('P4-07', 'finding: seal binds username/name/class/packages but not the expiry timestamp', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', vipExpiresAt: null, maxDevices: 2
    });
    const seal = e.computeTeacherVipApprovalSealV44(u);
    // Changing expiry only (not part of the seal raw string) keeps the same seal.
    u.vipExpiresAt = NOW + 10 * 365 * 86400000;
    u.vipExpiredAt = u.vipExpiresAt;
    eq(e.computeTeacherVipApprovalSealV44(u), seal, 'expiry is not bound by the seal');
});

// ---------------------------------------------------------------------------
// P4-08  detectAndBlock exempts ids gv_test / stu_free_12b1 / stu_practice_e
//          and anything with isAdminTester set.
// ---------------------------------------------------------------------------
test('P4-08', 'V4.8.0 partial FIX: isAdminTester exemption removed; gv_test still exempt', () => {
    const e = h.createEnv({ now: NOW });
    const a = h.syntheticStudent({ id: 'gv_test', maxDevices: 999, isVip: true });
    const b = h.syntheticStudent({ isAdminTester: true, maxDevices: 999, isVip: true });
    eq(e.detectAndBlockStudentVipHackV44(a, 't'), false, 'gv_test still skips the guard');
    eq(e.detectAndBlockStudentVipHackV44(b, 't'), true, 'isAdminTester no longer skips the guard');
    const c = h.syntheticStudent({ id: 'stu_free_12b1', maxDevices: 2, isVip: true });
    eq(e.detectAndBlockStudentVipHackV44(c, 't'), true, 'guest VIP flag is now detected');
});

// ---------------------------------------------------------------------------
// P4-09  verifyRuntimeSecurityIntegrity skips integrity checks for the same
//          privileged ids — combined with P4-08 this is a full guard bypass.
// ---------------------------------------------------------------------------
test('P4-09', 'finding: runtime integrity check skips gv_test / stu_free_12b1 / stu_practice_e', () => {
    const e = h.createEnv({ now: NOW });
    e.state.loggedInStudent = h.syntheticStudent({
        id: 'gv_test', maxDevices: 999,
        vipPackages: { k12: true, k11: true, k10: true, luyende: true }, isVip: true
    });
    // No _sig, no seal, bogus values — yet the runtime check returns true.
    const ok = e.verifyRuntimeSecurityIntegrity();
    assert(ok === true, 'privileged ids must bypass runtime integrity verification');
    assert(e.state.loggedInStudent !== null, 'student must NOT be nulled out');
});

// ---------------------------------------------------------------------------
// P4-10  The admin-preview path unlocks EVERYTHING when isAdminLoggedIn
//          and adminPreviewUnlockAll are set, bypassing all VIP checks.
// ---------------------------------------------------------------------------
test('P4-10', 'finding: admin preview unlock-all bypasses every VIP package check', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({ maxDevices: 2 });
    u._sig = e.computeUserIntegritySig(u);
    e.state.loggedInStudent = u;
    e.state.isAdminLoggedIn = true;
    e.state.adminPreviewUnlockAll = true;
    const s = e.BackendVipAuthServiceV44;
    s.registerVerifiedUserRecord(u);
    // Even a completely non-VIP student gets full access.
    const ok = s.hasVerifiedPackageAccess(u, 'luyende', 'P4-10');
    assert(ok === true, 'admin preview mode must unlock all packages');
});

// ---------------------------------------------------------------------------
// P4-11  Admin session signature is reproducible offline (salt is in the bundle).
// ---------------------------------------------------------------------------
test('P4-11', 'bypass: admin session signature is computable offline from the bundled salt', () => {
    const e = h.createEnv({ now: NOW });
    const sig = e.computeAdminSessionSig('admin', NOW);
    assert(/^adm_/.test(sig), 'unexpected admin sig format');
    const e2 = h.createEnv({ now: NOW });
    eq(e2.computeAdminSessionSig('admin', NOW), sig, 'admin sig reproducible');
    // The literal salt is present in the shipped bundle.
    const src = h.readSource();
    assert(src.text.includes('TRITHUC50_ADM_SALT_V27'), 'admin salt must be a bundle literal');
});

// ---------------------------------------------------------------------------
// P4-12  The integrity signature salt is also a bundle literal => _sig forgeable.
// ---------------------------------------------------------------------------
test('P4-12', 'bypass: user integrity sig salt is a bundle literal => _sig forgeable offline', () => {
    const src = h.readSource();
    assert(src.text.includes('TRITHUC50_SEC_SALT_2026_V27'), 'integrity salt must be a bundle literal');
    assert(src.text.includes('THAY_TRUNG_MASTER_SEAL_2026'), 'VIP seal master literal present');
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent();
    const sig = e.computeUserIntegritySig(u);
    const e2 = h.createEnv({ now: NOW });
    const u2 = h.syntheticStudent();
    eq(e2.computeUserIntegritySig(u2), sig, 'user sig reproducible offline');
});

// ---------------------------------------------------------------------------
// P4-13  The V4.5 "backend" vault is a closure Map in the client.
//          It is rebuilt from client-supplied records at boot, so it is not a
//          trust anchor — it only enforces consistency of client state.
// ---------------------------------------------------------------------------
test('P4-13', 'finding: BackendVipAuthServiceV44 vault is an in-client Map rebuilt from client data', () => {
    // (a) Unsealed record: denied, and the vault actively rolls the client back.
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', isVip: true, maxDevices: 2
    });
    e.BackendVipAuthServiceV44.registerVerifiedUserRecord(u);
    const ok = e.BackendVipAuthServiceV44.hasVerifiedPackageAccess(u, '12', 'P4-13');
    assert(ok === false, 'unsealed record must not grant access');
    eq(u.vipPackages.k12, false, 'vault must roll the client VIP flags back');

    // (b) Sealed record from a clean environment: granted.
    const e2 = h.createEnv({ now: NOW });
    const u2 = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', isVip: true, maxDevices: 2
    });
    u2._adminVipSeal = e2.computeTeacherVipApprovalSealV44(u2);
    e2.BackendVipAuthServiceV44.registerVerifiedUserRecord(u2);
    const ok2 = e2.BackendVipAuthServiceV44.hasVerifiedPackageAccess(u2, '12', 'P4-13b');
    assert(ok2 === true, 'sealed record grants access');
});

// ---------------------------------------------------------------------------
// P4-14  BOOT CHAIN (the real shipped normalizer): a user injected into
//          localStorage with a forged _sig is auto-granted a valid
//          _adminVipSeal by the app itself, then registered into the vault.
// ---------------------------------------------------------------------------
test('P4-14', 'V4.5 FIX: boot normalizer strips VIP when _sig is valid but _adminVipSeal is absent', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', vipExpiresAt: null, vipExpiredAt: null,
        isVip: true, maxDevices: 2
    });
    u._sig = e.computeUserIntegritySig(u);
    assert(!u._adminVipSeal, 'precondition: no seal before boot');
    e.state.users = [u];
    e.bootNormalizeUsersV44();
    const after = e.state.users[0];
    assert(!after._adminVipSeal, 'V4.5 must NOT mint a seal from _sig alone');
    eq(after.isVip, false, 'VIP must be revoked');
    eq(after.vipPlan, 'none', 'vipPlan must be reset');
    eq(after.vipPackages.k12, false, 'all VIP flags must be cleared');
    const ok = e.BackendVipAuthServiceV44.hasVerifiedPackageAccess(after, '12', 'P4-14');
    assert(ok === false, 'unsealed user must be denied');
});

// ---------------------------------------------------------------------------
// P4-15  BOOT CHAIN negative control: a user with a WRONG _sig is downgraded.
// ---------------------------------------------------------------------------
test('P4-15', 'negative control: boot normalizer downgrades a user with a bad _sig', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', isVip: true, maxDevices: 2
    });
    u._sig = 'v27_deadbeefdeadbeef';
    e.state.users = [u];
    e.bootNormalizeUsersV44();
    const after = e.state.users[0];
    eq(after.isVip, false, 'isVip must be revoked');
    eq(after.vipPlan, 'none', 'vipPlan must be reset');
    assert(!after._adminVipSeal, 'no seal may be granted');
});

// ---------------------------------------------------------------------------
// P4-16  BOOT CHAIN: the rename + sane-field payload survives boot intact.
//          This is the full end-to-end bypass of the V4.5 patch.
// ---------------------------------------------------------------------------
test('P4-16', 'V4.5 end-to-end: renamed user with BOTH offline-forged _sig and _adminVipSeal survives boot', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.syntheticStudent({
        id: 'stu_real_looking_01',
        username: 'nguyenvana',
        name: 'Nguyen Van A',
        class: '12A1',
        gmail: 'nguyenvana@example.edu.vn',
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime', vipExpiresAt: null, vipExpiredAt: null,
        isVip: true, maxDevices: 2
    });
    // V4.5 removed boot auto-sealing, but the seal secret is still a bundle
    // literal, so both artifacts remain reproducible offline together.
    u._adminVipSeal = e.computeTeacherVipApprovalSealV44(u);
    u._sig = e.computeUserIntegritySig(u);
    e.state.users = [u];
    e.bootNormalizeUsersV44();
    const after = e.state.users[0];
    assert(after.status === 'active', 'must not be locked');
    assert(after.isVip === true, 'must stay VIP');
    assert(after._adminVipSeal, 'must have a seal');
    const s = e.BackendVipAuthServiceV44;
    assert(s.hasVerifiedPackageAccess(after, '12', 'P4-16') === true, 'k12 access');
    assert(s.hasVerifiedPackageAccess(after, 'luyende', 'P4-16') === true, 'luyende access');
    assert(e.detectAndBlockStudentVipHackV44(after, 'P4-16') === false, 'must not trip the guard');
});

// ---------------------------------------------------------------------------
// P4-17  NEW-02 revalidation on V4.5: an unsigned, non-admin cloud packet
//          must be downgraded to pending / non-VIP.
// ---------------------------------------------------------------------------
test('P4-17', 'revalidation: unsigned cloud packet is downgraded to pending/non-VIP on V4.5', () => {
    const e = h.createEnv({ now: NOW });
    const NAME = 'sinhvien_probe';
    const pkt = {
        app: 'TRITHUC50_V436', type: 'STUDENT_REGISTER', ts: NOW,
        fromAdmin: false, adminSig: '',
        deletedUsernames: [], deletedMap: {},
        users: [{
            id: 'stu_' + NAME, u: NAME, p: 'SYNTHETIC_POC_ONLY', n: 'Sinh vien Probe',
            c: '12A1', s: '01', g: NAME + '@example.edu.vn', ph: '',
            st: 'active', vp: [1, 1, 1, 1], rp: [1, 1, 1, 1],
            pl: 'lifetime', rpl: 'lifetime', exp: null, pend: 0, newReg: 0,
            maxD: 2, devs: [], regAt: 'POC', updAt: NOW, seal: '', bkt: '', v436: 1
        }]
    };
    e.state.users = [];
    const changed = e.processIncomingCloudPacket(pkt);
    const hit = e.state.users.find(u => u.username === NAME);
    assert(!!hit, 'the record must still land in the local table');
    assert(hit.status === 'pending', 'status must be downgraded to pending, got: ' + hit.status);
    assert(hit.isVip !== true, 'isVip must be false');
    assert(hit.vipPlan === 'none', 'vipPlan must be none, got: ' + hit.vipPlan);
    assert(hit.vipPackages.k12 !== true, 'packages must be cleared');
});

// ---------------------------------------------------------------------------
// P4-18  Negative control: a FORGED admin packet (fromAdmin without a valid
//          adminSig) must be rejected outright.
// ---------------------------------------------------------------------------
test('P4-18', 'negative control: forged fromAdmin packet is rejected on V4.5', () => {
    const e = h.createEnv({ now: NOW });
    const pkt = {
        app: 'TRITHUC50_V436', type: 'CLOUD_STATE_SYNC', ts: NOW,
        fromAdmin: true, adminSig: 'asig_DEADBEEF',
        deletedUsernames: [], deletedMap: {}, users: []
    };
    const changed = e.processIncomingCloudPacket(pkt);
    assert(changed === false, 'forged admin packet must be rejected');
});

// ---------------------------------------------------------------------------
// P4-19  The tombstone table is merged WITHOUT any admin check.
//          This is the residual unauthenticated part of F-01.
// ---------------------------------------------------------------------------
test('P4-19', 'V4.8.0 FIX: tombstone table only merges from a signature-verified admin packet', () => {
    const e = h.createEnv({ now: NOW });
    const base = {
        app: 'TRITHUC50_V436', type: 'CLOUD_STATE_SYNC', ts: NOW,
        fromAdmin: false, adminSig: '',
        deletedUsernames: ['demo_target'], deletedMap: { demo_target: NOW }, users: []
    };
    e.state.deletedUsersMap = {};
    e.processIncomingCloudPacket(base);
    eq(e.state.deletedUsersMap.demo_target, undefined, 'unsigned tombstone ignored');
    const signedPkt = Object.assign({}, base, { fromAdmin: true });
    signedPkt.adminSig = e.computeCloudPacketAdminSig(signedPkt);
    e.processIncomingCloudPacket(signedPkt);
    eq(e.state.deletedUsersMap.demo_target, NOW, 'signed tombstone recorded');
    assert(Array.from(e.deletedUsernamesRegistry || []).includes('demo_target'),
        'tombstone added to the deleted-username registry');
});

// ---------------------------------------------------------------------------
// P4-20  A correct admin signature IS reproducible offline (the secret is a
//          bundle literal), so the admin-packet check is a barrier, not a
//          trust anchor.
// ---------------------------------------------------------------------------
test('P4-20', 'finding: cloud admin signature secret is a bundle literal', () => {
    const src = h.readSource();
    assert(src.text.includes('THAYTRUNG_SECRET_2026_V436'), 'cloud admin secret must be a bundle literal');
    const e = h.createEnv({ now: NOW });
    const pkt = { app: 'TRITHUC50_V436', type: 'CLOUD_STATE_SYNC', ts: NOW, fromAdmin: true, users: [] };
    const sig = e.computeCloudPacketAdminSig(pkt);
    assert(/^asig_/.test(sig), 'unexpected cloud sig format: ' + sig);
    const e2 = h.createEnv({ now: NOW });
    eq(e2.computeCloudPacketAdminSig({ ...pkt }), sig, 'cloud admin sig is reproducible offline');
});

console.log(`\nTOTAL ${pass + fail} PASS ${pass} FAIL ${fail}`);if (failures.length) {
    console.log('failures:');
    failures.forEach(f => console.log(' - ' + f));
}
process.exit(fail ? 1 : 0);
