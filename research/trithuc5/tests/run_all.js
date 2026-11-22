// run_all.js — deterministic local regression tests for TRITHUC5.0 V4.5.
// Uses only the isolated harness; never contacts the target, ntfy.sh, or Cloud KV.
// Usage: node research/trithuc5/tests/run_all.js

'use strict';
const assert = require('assert');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const vm = require('vm');
const h = require('./harness.js');

const NOW = 1795000000000;
const results = [];
let failures = 0;

function test(id, title, fn) {
    try {
        fn();
        results.push(`PASS ${id} ${title}`);
        console.log(`PASS ${id} ${title}`);
    } catch (e) {
        failures++;
        results.push(`FAIL ${id} ${title} :: ${e.message}`);
        console.log(`FAIL ${id} ${title} :: ${e.message}`);
    }
}

function packet(env, overrides) {
    const p = {
        app: 'TRITHUC50_V436',
        type: 'CLOUD_STATE_SYNC',
        ts: NOW,
        fromAdmin: false,
        hideAuthorInfo: false,
        hideAuthorTs: 0,
        deletedUsernames: [],
        deletedMap: {},
        users: []
    };
    return Object.assign(p, overrides || {});
}

function signed(env, overrides) {
    const p = packet(env, Object.assign({ fromAdmin: true }, overrides || {}));
    p.adminSig = env.computeCloudPacketAdminSig(p);
    return p;
}

function compact(env, overrides) {
    return env.serializeCompactUser(h.compactUser(overrides));
}

function allVip(overrides) {
    return Object.assign({
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: 'lifetime',
        status: 'active',
        updatedAt: NOW
    }, overrides || {});
}

console.log('=== TRITHUC5.0 V4.5 isolated regression suite ===');
console.log('source sha256: ' + h.readSource().sha);
console.log('now (fixed): ' + NOW);

test('H-01', 'extracted functions are syntactically complete and correctly named', () => {
    const lines = h.readSource().lines;
    for (const name of [
        'processIncomingCloudPacket', 'pushCloudSyncPacket', 'serializeCompactUser',
        'deserializeCompactUser', 'computeUserIntegritySig', 'computeAdminSessionSig',
        'verifyAndBindStudentDeviceOnLogin', 'decryptV97EmbedPayload', 'saveUsersState'
    ]) {
        const code = h.extractFunction(lines, name).code;
        assert.ok(new RegExp('^\\s*(?:async\\s+)?function\\s+' + name + '\\s*\\(').test(code));
        new vm.Script(code);
    }
});

console.log('--- F-01 cloud sync / ntfy / KV ---');

test('F-01-T01', 'V4.5 FIX: packet claiming fromAdmin without a valid adminSig is rejected outright', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'victim', status: 'pending', vipPlan: 'none', updatedAt: NOW - 1000 })] } });
    const p = packet(e, {
        fromAdmin: true,
        hideAuthorInfo: true,
        hideAuthorTs: NOW + 1,
        users: [compact(e, { username: 'victim', status: 'active', vipPlan: 'lifetime', updatedAt: NOW })]
    });
    assert.strictEqual(typeof p.adminSig, 'undefined');
    e.processIncomingCloudPacket(p);
    assert.strictEqual(e.state.hideAuthorInfo, false, 'V4.5 must not apply admin flags from an unsigned packet');
    const v = e.state.users.find(u => u.username === 'victim');
    assert.strictEqual(v.status, 'pending', 'V4.5 must not upgrade the victim');
    assert.strictEqual(v.vipPlan, 'none', 'V4.5 must not grant VIP');
});

test('F-01-T02', 'V4.5 FIX: invalid adminSig rejects the whole packet (tombstone and injection)', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'synthetic_student', updatedAt: NOW - 10 })] } });
    const p = packet(e, {
        fromAdmin: true,
        adminSig: 'asig_INVALID',
        deletedMap: { synthetic_student: NOW + 10000 },
        users: [compact(e, allVip({ username: 'injected_user', id: 'stu_injected' }))]
    });
    e.processIncomingCloudPacket(p);
    assert.strictEqual(e.state.users.some(u => u.username === 'synthetic_student'), true, 'V4.5 must not apply the forged tombstone');
    assert.strictEqual(e.state.users.some(u => u.username === 'injected_user'), false, 'V4.5 must not inject the user');
});

test('F-01-T03', 'valid signature applies the same privileged merge', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'victim', status: 'pending', updatedAt: NOW - 5 })] } });
    e.processIncomingCloudPacket(signed(e, {
        hideAuthorInfo: true, hideAuthorTs: NOW + 1,
        users: [compact(e, { username: 'victim', status: 'active', vipPlan: '1y', updatedAt: NOW })]
    }));
    const v = e.state.users.find(u => u.username === 'victim');
    assert.strictEqual(v.status, 'active');
    assert.strictEqual(v.vipPlan, '1y');
});

test('F-01-T04', 'V4.5 FIX: unsigned packet inserts the user but downgrades it to pending/non-VIP', () => {
    const e = h.createEnv({ now: NOW });
    const p = packet(e, { type: 'ANY_OTHER_EVENT', users: [compact(e, allVip({ username: 'ghost_user' }))] });
    delete p.fromAdmin;
    assert.strictEqual(typeof p.fromAdmin, 'undefined');
    assert.strictEqual(typeof p.adminSig, 'undefined');
    e.processIncomingCloudPacket(p);
    const g = e.state.users.find(u => u.username === 'ghost_user');
    assert.ok(g, 'V4.5 still inserts the record (residual: unauthenticated table growth)');
    assert.strictEqual(g.status, 'pending', 'V4.5 downgrades status to pending');
    assert.strictEqual(g.isVip, false, 'V4.5 clears isVip');
    assert.strictEqual(g.vipPlan, 'none', 'V4.5 resets vipPlan');
    assert.strictEqual(g.vipPackages.k12, false, 'V4.5 clears packages');
});

test('F-01-T05', 'V4.5 FIX: forged fromAdmin without signature is rejected and leaves state untouched', () => {
    const e = h.createEnv({ now: NOW });
    e.processIncomingCloudPacket(packet(e, { fromAdmin: true, hideAuthorInfo: true, hideAuthorTs: NOW + 1 }));
    assert.strictEqual(e.state.hideAuthorInfo, false, 'V4.5 rejects the forged admin claim');
});

test('F-01-T06', 'V4.8.0 FIX: nonce replay is rejected by the verifier', () => {
    const e = h.createEnv({ now: NOW });
    const p = signed(e, { nonce: 'poc_replay_nonce', users: [compact(e, allVip({ username: 'replay_user' }))] });
    assert.strictEqual(e.processIncomingCloudPacket(p), true, 'first delivery applies');
    assert.strictEqual(e.processIncomingCloudPacket(p), false, 'replay of the same nonce is rejected');
    assert.strictEqual(e.state.users.length, 1, 'duplicate does not add another user');
    const fn = h.extractFunction(h.readSource().lines, 'processIncomingCloudPacket').code;
    assert.ok(/__SEEN_CLOUD_NONCES_V480__/.test(fn), 'nonce registry present in verifier');
    // Residual: a packet with no nonce is still only idempotent, not replay-protected.
    assert.ok(!/nonce/.test(JSON.stringify(signed(e, { users: [] }))), 'nonce remains optional');
});

test('F-01-T07', 'V4.8.0 FIX: a packet older than 26 hours is rejected', () => {
    const e = h.createEnv({ now: NOW });
    const p = signed(e, {
        ts: 1, hideAuthorTs: 2, hideAuthorInfo: true,
        users: [compact(e, { username: 'ancient_user', updatedAt: 1 })]
    });
    assert.strictEqual(e.processIncomingCloudPacket(p), false, 'stale packet rejected');
    assert.strictEqual(e.state.hideAuthorInfo, false);
    assert.ok(!e.state.users.some(u => u.username === 'ancient_user'));
});

test('F-01-T08', 'duplicate users in one packet are collapsed by username', () => {
    const e = h.createEnv({ now: NOW });
    const u = compact(e, allVip({ username: 'dupe_user' }));
    e.processIncomingCloudPacket(packet(e, { users: [u, JSON.parse(JSON.stringify(u))] }));
    assert.strictEqual(e.state.users.filter(x => x.username === 'dupe_user').length, 1);
});

test('F-01-T09', 'malformed tombstone values do not crash but malformed user entries are skipped', () => {
    const e = h.createEnv({ now: NOW });
    const p = packet(e, {
        deletedMap: 'not-an-object',
        deletedUsernames: { 0: 'bad' },
        users: [{}, null, compact(e, allVip({ username: 'valid_after_malformed' }))]
    });
    e.processIncomingCloudPacket(p);
    assert.ok(e.state.users.some(u => u.username === 'valid_after_malformed'));
});

test('F-01-T10', 'V4.8.0 FIX: unsigned tombstone deletion is rejected', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'delete_me', updatedAt: NOW - 1 })] } });
    e.processIncomingCloudPacket(packet(e, { fromAdmin: false, deletedMap: { delete_me: NOW + 5000 } }));
    assert.strictEqual(e.state.users.some(u => u.username === 'delete_me'), true, 'user survives unsigned deletion');
});

test('F-01-T11', 'V4.5 FIX: forged admin packet does not mutate a second isolated environment', () => {
    const envA = h.createEnv({ now: NOW });
    const envB = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'cross_victim', status: 'active', updatedAt: NOW - 5 })] } });
    const p = packet(envA, {
        fromAdmin: true,
        users: [compact(envA, { username: 'cross_victim', status: 'locked', vipPlan: 'none', updatedAt: NOW })]
    });
    const encoded = 'TT50V436:' + envA.toBase64UrlSafe(JSON.stringify(p));
    const decoded = envB.decodeCloudMessageString(encoded);
    envB.processIncomingCloudPacket(decoded);
    const v = envB.state.users.find(u => u.username === 'cross_victim');
    assert.strictEqual(v.status, 'active', 'V4.5 must reject the forged admin claim in the second VM');
    assert.strictEqual(v.isVip, undefined, 'V4.5 must not grant VIP from the forged packet');
});

test('F-01-T12', 'V4.8.0 FIX: only a signature-verified admin tombstone merges', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'restore_me', updatedAt: NOW - 100 })] } });
    // Both a forged admin claim and an unsigned tombstone must be rejected.
    e.processIncomingCloudPacket(packet(e, { fromAdmin: true, deletedMap: { restore_me: NOW + 100000 } }));
    assert.strictEqual(e.state.users.some(u => u.username === 'restore_me'), true, 'forged admin tombstone rejected');
    e.processIncomingCloudPacket(packet(e, { fromAdmin: false, deletedMap: { restore_me: NOW + 100000 } }));
    assert.strictEqual(e.state.users.some(u => u.username === 'restore_me'), true, 'unsigned tombstone rejected');
    // A validly signed admin tombstone still deletes, and blocks a later restore.
    e.processIncomingCloudPacket(signed(e, { deletedMap: { restore_me: NOW + 100000 }, deletedUsernames: ['restore_me'] }));
    assert.strictEqual(e.state.users.some(u => u.username === 'restore_me'), false, 'signed tombstone applies');
    e.processIncomingCloudPacket(signed(e, { users: [compact(e, { username: 'restore_me', updatedAt: NOW })] }));
    assert.strictEqual(e.state.users.some(u => u.username === 'restore_me'), false, 'tombstone blocks restore');
});

test('F-01-T13', 'V4.8.0 FIX: password and admin seal no longer leave the client in packets', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser()] } });
    const compact = e.serializeCompactUser(e.state.users[0]);
    assert.strictEqual(compact.p, '', 'password field blanked by shipped serializer');
    assert.strictEqual(compact.seal, '', 'admin seal not serialised');
    assert.strictEqual(compact.bkt, '', 'backend token not serialised');
    const pkt = e.buildTeacherSnapshotPacket([]);
    const json = JSON.stringify(pkt);
    assert.ok(!json.includes('synthetic_password'), 'password absent from snapshot JSON');
    assert.ok(!json.includes('vseal44_'), 'seal absent from snapshot JSON');
});

test('F-01-T14', 'V4.8.0 FIX: the internal cloud bus is removed from production', () => {
    const src = h.readSource().text;
    assert.ok(!src.includes('__INTERNAL_CLOUD_BUS_V45__ ='), 'no internal bus assignment remains');
    assert.ok(!src.includes('applyIncomingPacket(packetObj)'), 'no direct packet-application helper remains');
    assert.ok(!src.includes('window.__TRITHUC50_CLOUD_BUS__ ='), 'no window bus published');
    // Residual: BroadcastChannel.onmessage still applies raw objects locally.
    assert.ok(src.includes('processIncomingCloudPacket(ev.data)'), 'local BroadcastChannel path remains');
});

test('F-01-T15', 'stale privileged packet can override a newer local downgrade', () => {
    const e = h.createEnv({ now: NOW });
    e.state.users = [h.compactUser({ username: 'downgraded', status: 'pending', vipPlan: 'none', updatedAt: NOW })];
    const stale = signed(e, { users: [compact(e, { username: 'downgraded', status: 'active', vipPlan: 'lifetime', updatedAt: 1 })] });
    e.processIncomingCloudPacket(stale);
    const v = e.state.users.find(u => u.username === 'downgraded');
    assert.strictEqual(v.status, 'active');
    assert.strictEqual(v.vipPlan, 'lifetime');
});

test('F-01-T16', 'V4.8.0 FIX: unsigned tombstone cannot facilitate a deletion replay', () => {
    const e = h.createEnv({ now: NOW });
    e.state.users = [h.compactUser({ username: 'gone', updatedAt: NOW })];
    e.processIncomingCloudPacket(packet(e, { fromAdmin: true, deletedMap: { gone: NOW + 1000 } }));
    assert.strictEqual(e.state.users.some(u => u.username === 'gone'), true, 'forged admin tombstone rejected');
    e.processIncomingCloudPacket(packet(e, { fromAdmin: false, deletedMap: { gone: NOW + 1000 } }));
    assert.strictEqual(e.state.users.some(u => u.username === 'gone'), true, 'unsigned tombstone rejected');
    // A validly signed tombstone still deletes and blocks a later restore.
    e.processIncomingCloudPacket(signed(e, { deletedMap: { gone: NOW + 1000 }, deletedUsernames: ['gone'] }));
    assert.strictEqual(e.state.users.some(u => u.username === 'gone'), false);
    e.processIncomingCloudPacket(signed(e, { users: [compact(e, { username: 'gone', updatedAt: 1 })] }));
    assert.strictEqual(e.state.users.some(u => u.username === 'gone'), false);
});

test('F-01-T17', 'unsigned stale packet does not override a newer non-pending user', () => {
    const e = h.createEnv({ now: NOW });
    e.state.users = [h.compactUser({ username: 'stable', status: 'active', vipPlan: 'none', updatedAt: NOW })];
    e.processIncomingCloudPacket(packet(e, {
        type: 'ANY_OTHER_EVENT',
        users: [compact(e, { username: 'stable', status: 'active', vipPlan: 'lifetime', updatedAt: 1 })]
    }));
    const v = e.state.users.find(u => u.username === 'stable');
    assert.strictEqual(v.vipPlan, 'none');
});

console.log('--- F-02 admin auth / session ---');

test('F-02-T01', 'session forged with client-side salt is accepted', () => {
    const e = h.createEnv({ now: NOW });
    const username = 'synthetic_admin';
    e.safeStorageSet(e.STORAGE_KEYS.REMEMBERED_ADMIN_SESSION, JSON.stringify({
        loggedIn: true, username, ts: NOW, sig: e.computeAdminSessionSig(username, NOW)
    }));
    e.checkRememberedAdminSessionFromSource();
    assert.strictEqual(e.state.isAdminLoggedIn, true);
});

test('F-02-T02', 'V4.5 FIX: session with a missing signature is rejected', () => {
    const e = h.createEnv({ now: NOW });
    e.safeStorageSet(e.STORAGE_KEYS.REMEMBERED_ADMIN_SESSION, JSON.stringify({ loggedIn: true, username: 'anyone', ts: NOW }));
    e.checkRememberedAdminSessionFromSource();
    assert.strictEqual(e.state.isAdminLoggedIn, false, 'V4.5 requires a session signature');
});

test('F-02-T03', 'invalid signature is rejected and session storage is removed', () => {
    const e = h.createEnv({ now: NOW });
    e.safeStorageSet(e.STORAGE_KEYS.REMEMBERED_ADMIN_SESSION, JSON.stringify({ loggedIn: true, username: 'anyone', ts: NOW, sig: 'adm_INVALID' }));
    e.checkRememberedAdminSessionFromSource();
    assert.strictEqual(e.state.isAdminLoggedIn, false);
    assert.strictEqual(e.safeStorageGet(e.STORAGE_KEYS.REMEMBERED_ADMIN_SESSION), null);
});

test('F-02-T04', 'expired session with otherwise valid signature is rejected', () => {
    const e = h.createEnv({ now: NOW });
    const ts = NOW - 8 * 86400000;
    e.safeStorageSet(e.STORAGE_KEYS.REMEMBERED_ADMIN_SESSION, JSON.stringify({
        loggedIn: true, username: 'anyone', ts, sig: e.computeAdminSessionSig('anyone', ts)
    }));
    e.checkRememberedAdminSessionFromSource();
    assert.strictEqual(e.state.isAdminLoggedIn, false);
});

test('F-02-T05', 'no same-origin backend authorization endpoint exists (static)', () => {
    const src = h.readSource().text;
    const fetches = (src.match(/fetch\([^\n]{0,200}/g) || []).join('\n');
    assert.ok(!/fetch\(['"`]\/(?:api|auth|admin|v1)\//i.test(fetches), 'no app-origin auth API call');
    assert.ok(!/https:\/\/trithuc500\.vercel\.app\/(api|auth)/i.test(src));
});

console.log('--- F-03 VIP / integrity ---');

test('F-03-T01', 'V4.5: recomputed _sig alone is NOT enough (runtime check also requires a valid seal)', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.compactUser({ vipPackages: { k12: true, k11: true, k10: true, luyende: true }, vipPlan: 'lifetime', maxDevices: 2 });
    u._sig = e.computeUserIntegritySig(u);
    e.state.loggedInStudent = u;
    assert.strictEqual(e.verifyRuntimeSecurityIntegrity(), false, 'missing seal must fail the runtime check');
    // But forging BOTH (both secrets are bundle literals) passes: see P4-04/P4-16.
    const u2 = h.compactUser({ vipPackages: { k12: true, k11: true, k10: true, luyende: true }, vipPlan: 'lifetime', maxDevices: 2 });
    u2._sig = e.computeUserIntegritySig(u2);
    u2._adminVipSeal = e.computeTeacherVipApprovalSealV44(u2);
    e.state.loggedInStudent = u2;
    assert.strictEqual(e.verifyRuntimeSecurityIntegrity(), true, 'forged sig + forged seal pass');
});

test('F-03-T02', 'V4.5: stale _sig is detected, VIP stripped, session force-logged-out', () => {
    const e = h.createEnv({ now: NOW });
    const clean = h.compactUser();
    clean._sig = e.computeUserIntegritySig(clean);
    const tampered = JSON.parse(JSON.stringify(clean));
    tampered.vipPackages = { k12: true, k11: true, k10: true, luyende: true };
    tampered.vipPlan = 'lifetime';
    e.state.loggedInStudent = tampered;
    assert.strictEqual(e.verifyRuntimeSecurityIntegrity(), false);
    assert.strictEqual(e.state.loggedInStudent, null, 'V4.5 force-logs out the tampered session');
    assert.strictEqual(tampered.vipPlan, 'none', 'VIP stripped on the tampered object');
    assert.strictEqual(tampered.status, 'locked', 'V4.5 locks the account locally');
});

test('F-03-T03', 'lifetime and future expiry pass, past expiry fails', () => {
    const e = h.createEnv({ now: NOW });
    assert.strictEqual(e.isStudentVipExpired(h.compactUser({ vipPlan: 'lifetime' })), false);
    assert.strictEqual(e.isStudentVipExpired(h.compactUser({ vipPlan: '1y', vipExpiresAt: NOW + 1000 })), false);
    assert.strictEqual(e.isStudentVipExpired(h.compactUser({ vipPlan: '1y', vipExpiresAt: NOW - 1000 })), true);
});

console.log('--- F-04 answer exposure ---');

test('F-04-T01', 'V4.5 gzip vault still yields 15 exams / 330 answers offline (bundle-seed XOR + gzip)', () => {
    const lines = h.readSource().lines;
    const idx = lines.findIndex(l => l.includes('var __ENC_GZ = '));
    assert.ok(idx >= 0, 'V4.5 must embed the gzip vault blob');
    const line = lines[idx];
    const from = line.indexOf('var __ENC_GZ = ') + 'var __ENC_GZ = '.length;
    const to = line.indexOf(';', from);
    const enc = JSON.parse(line.slice(from, to));
    assert.ok(Array.isArray(enc.exams) && enc.exams.length > 0);
    // Reproduce the shipped __decGzChunks PRNG-XOR + gzip path locally.
    const parts = enc.exams.map((chunk, ci) => {
        const bin = Buffer.from(chunk, 'base64').toString('binary');
        const buf = Buffer.alloc(bin.length);
        let s = ((0x4F81E3A7 ^ Math.imul(ci + 1, 0x9E3779B1)) >>> 0) || 0x9E3779B9;
        const ks = new Uint8Array(4096);
        for (let k = 0; k < 4096; k++) {
            s ^= (s << 13) >>> 0; s ^= (s >>> 17); s ^= (s << 5) >>> 0;
            ks[k] = (s ^ ((k * 31) & 0xFF)) & 0xFF;
        }
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i) ^ ks[i & 4095];
        return buf;
    });
    const exams = JSON.parse(zlib.gunzipSync(Buffer.concat(parts)).toString('utf8'));
    let count = 0;
    exams.forEach(x => ['p1', 'p2', 'p3'].forEach(p => { count += Object.keys((x.correctAnswers || {})[p] || {}).length; }));
    assert.strictEqual(exams.length, 15);
    assert.strictEqual(count, 330);
    assert.ok(exams.every(x => x.correctAnswers));
});

test('F-04-T02', 'XOR answer payload is reversible with public key material', () => {
    const e = h.createEnv({ now: NOW });
    const sig = 'synthetic_sig';
    const key = 'TRUNG_SEC_2026_' + sig;
    const plain = Buffer.from('{"correctAnswers":{"p1":{"1":"B"}}}', 'utf8');
    const enc = Buffer.alloc(plain.length);
    for (let i = 0; i < plain.length; i++) {
        enc[i] = ((plain[i] + ((i * 7) % 256)) % 256) ^ key.charCodeAt(i % key.length);
    }
    const out = e.decryptV97EmbedPayload(enc.toString('base64'), sig);
    assert.strictEqual(out.correctAnswers.p1['1'], 'B');
});

test('F-04-T03', 'grading is client-side and no server grading endpoint is called (static)', () => {
    const src = h.readSource().text;
    assert.ok(/function calculateAttemptScore\s*\(/.test(src));
    assert.ok(!/submitAnswers|gradeExam|api\/grade/i.test(src));
});

console.log('--- F-05 device / Gmail lock ---');

function deviceEnv(overrides, token) {
    const seed = {};
    seed['TRITHUC50_DEVICE_HW_TOKEN_V26'] = token || 'DEV-PC-SYNTHETIC1';
    return h.createEnv({ now: NOW, localSeed: seed, state: Object.assign({ users: [h.compactUser()] }, overrides || {}) });
}

test('F-05-T01', 'empty trustedDevices causes automatic device registration', () => {
    const e = deviceEnv();
    const r = e.verifyAndBindStudentDeviceOnLogin(e.state.users[0], 'synthetic@example.edu.vn');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.isNewDevice, true);
    assert.strictEqual(e.state.users[0].trustedDevices.length, 1);
});

test('F-05-T02', 'overwriting deviceId in trustedDevices makes device recognized', () => {
    const e = deviceEnv();
    const dev = e.getHardwareDeviceProfile();
    e.state.users[0].trustedDevices = [{ deviceId: dev.deviceId }];
    const r = e.verifyAndBindStudentDeviceOnLogin(e.state.users[0], 'synthetic@example.edu.vn');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.isNewDevice, false);
});

test('F-05-T03', 'two-device limit blocks third device and can lock locally', () => {
    const e = deviceEnv();
    const u = e.state.users[0];
    u.trustedDevices = [{ deviceId: 'DEV-PC-1' }, { deviceId: 'DEV-MOB-2' }];
    const r1 = e.verifyAndBindStudentDeviceOnLogin(u, 'synthetic@example.edu.vn');
    const r2 = e.verifyAndBindStudentDeviceOnLogin(u, 'synthetic@example.edu.vn');
    assert.strictEqual(r1.ok, false);
    assert.strictEqual(r1.reason, 'DEVICE_LIMIT_EXCEEDED');
    assert.strictEqual(r2.ok, false);
    assert.strictEqual(u.status, 'locked');
});

test('F-05-T04', 'simulated third-device slot is available in production source', () => {
    const e = h.createEnv({ now: NOW });
    e.state.simulatedDeviceSlot = 'sim_dev3_intruder';
    assert.strictEqual(e.getHardwareDeviceProfile().deviceId, 'DEV-PC-INTRUDER99');
});

test('F-05-T05', 'independent clients both accept their own device without server arbitration', () => {
    const a = deviceEnv({}, 'DEV-PC-CLIENT-A');
    const b = deviceEnv({}, 'DEV-PC-CLIENT-B');
    const ra = a.verifyAndBindStudentDeviceOnLogin(a.state.users[0], 'synthetic@example.edu.vn');
    const rb = b.verifyAndBindStudentDeviceOnLogin(b.state.users[0], 'synthetic@example.edu.vn');
    assert.strictEqual(ra.ok, true);
    assert.strictEqual(rb.ok, true);
    assert.notStrictEqual(ra.deviceProfile.deviceId, rb.deviceProfile.deviceId);
});

console.log('--- F-06 anti-cheat / DOM ---');

test('F-06-T01', 'protections are preventDefault / DOM / CSS only (static)', () => {
    const lines = h.readSource().lines;
    // V4.5 moved the anti-cheat listener block; search the pinned source instead
    // of depending on a build-specific line range.
    const anti = lines.join('\n');
    assert.ok(anti.includes("e.preventDefault()"));
    assert.ok(anti.includes("'contextmenu', 'copy', 'cut', 'dragstart', 'selectstart'"));
    assert.ok(lines.some(l => l.includes('blur(22px)')), 'idle blur CSS must exist');
    assert.ok(lines.some(l => l.includes('watermarkLayer')), 'watermark DOM must exist');
    const src = h.readSource().text;
    assert.ok(!/attest|integrityMeasurement|serverNonce/i.test(src));
});

console.log('--- A additional surface ---');

test('A-01-T01', 'no server-side entitlement or admin boundary in shipped client (static)', () => {
    const src = h.readSource().text;
    assert.ok(!/fetch\(['"`]https:\/\/trithuc500\.vercel\.app/i.test(src));
    assert.ok(!/Authorization:\s*Bearer/i.test(src));
});

test('A-02-T01', 'Gemini API key is read from localStorage and sent client-side (static)', () => {
    const src = h.readSource().text;
    assert.ok(src.includes("GEMINI_KEY: 'TRUNG_GEMINI_OCR_KEY'"));
    assert.ok(src.includes('generativelanguage.googleapis.com'));
    assert.ok(!/(?:AIza)[0-9A-Za-z_-]{20,}/.test(src), 'no embedded live key value');
});

test('A-03-T01', 'V4.8.0 partial FIX: XFO/nosniff present, CSP and CORS still weak (static)', () => {
    const headers = fs.readFileSync(path.join(__dirname, '..', 'current.headers'), 'utf8');
    assert.ok(/Access-Control-Allow-Origin:\s*\*/i.test(headers), 'wildcard CORS remains');
    assert.ok(!/Content-Security-Policy:/i.test(headers), 'CSP still absent');
    assert.ok(/X-Frame-Options:\s*DENY/i.test(headers), 'XFO hardened');
    assert.ok(/X-Content-Type-Options:\s*nosniff/i.test(headers), 'nosniff hardened');
});

test('A-04-T01', 'cross-tab storage event replaces state.users from writable localStorage (static)', () => {
    const lines = h.readSource().lines;
    const block = h.extractDeclaration(lines, 'const setupCrossTabUserSync =').code;
    assert.ok(block.includes("window.addEventListener('storage'"));
    assert.ok(block.includes('state.users = parsedU'));
    assert.ok(!/origin|isTrusted|signature/i.test(block));
});

test('A-04-T02', 'malicious localStorage state propagates to another VM tab and persists', () => {
    const shared = h.makeMemoryStorage();
    const tabA = h.createEnv({ now: NOW, localStore: shared });
    const tabB = h.createEnv({ now: NOW, localStore: shared });
    tabB.setupCrossTabUserSync();
    const injected = [h.compactUser({ username: 'injected_via_tab', status: 'active' })];
    const raw = JSON.stringify(injected);
    tabA.safeStorageSet(tabA.STORAGE_KEYS.USERS, raw);
    tabB.__dispatchWindowEvent('storage', { key: tabA.STORAGE_KEYS.USERS, newValue: raw });
    assert.ok(tabB.state.users.some(u => u.username === 'injected_via_tab'));
    tabB.saveUsersState();
    assert.ok(shared.getItem(tabA.STORAGE_KEYS.USERS).includes('injected_via_tab'));
});

const outDir = path.join(__dirname, '..', 'evidence');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'test-results.txt'), results.join('\n') + `\n\nTOTAL ${results.length} PASS ${results.length - failures} FAIL ${failures}\n`);
console.log(`\nTOTAL ${results.length} PASS ${results.length - failures} FAIL ${failures}`);
process.exit(failures ? 1 : 0);
