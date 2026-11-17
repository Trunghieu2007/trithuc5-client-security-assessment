// secure_controls.js — post-remediation acceptance tests.
// These tests assert SECURE behavior. They are expected to FAIL on the current vulnerable
// build. After a patch they must all pass. Usage:
//   node research/trithuc5/tests/secure_controls.js
// Exit 0 = every secure control passes (patched state).
// Exit 1 = at least one control fails (expected on the current build).

'use strict';
const assert = require('assert');
const h = require('./harness.js');

const NOW = 1795000000000;
const rows = [];
let failed = 0;

function control(id, title, fn) {
    try {
        fn();
        rows.push(`PASS ${id} ${title}`);
        console.log(`PASS ${id} ${title}`);
    } catch (e) {
        failed++;
        rows.push(`FAIL ${id} ${title} :: ${e.message.split('\n')[0]}`);
        console.log(`FAIL ${id} ${title} :: ${e.message.split('\n')[0]}`);
    }
}

function user(overrides) {
    return h.compactUser(overrides);
}
function compact(env, overrides) {
    return env.serializeCompactUser(user(overrides));
}
function packet(env, overrides) {
    return Object.assign({
        app: 'TRITHUC50_V436', type: 'CLOUD_STATE_SYNC', ts: NOW,
        fromAdmin: false, hideAuthorInfo: false, hideAuthorTs: 0,
        deletedUsernames: [], deletedMap: {}, users: []
    }, overrides || {});
}
function signed(env, overrides) {
    const p = packet(env, Object.assign({ fromAdmin: true }, overrides || {}));
    p.adminSig = env.computeCloudPacketAdminSig(p);
    return p;
}

console.log('=== POST-PATCH SECURE CONTROLS (expected to fail before remediation) ===');
console.log('source sha256: ' + h.readSource().sha);

control('SC-01', 'positive: valid signed admin packet is applied', () => {
    const e = h.createEnv({ now: NOW });
    e.state.users = [user({ username: 'victim', status: 'pending', updatedAt: NOW - 1 })];
    e.processIncomingCloudPacket(signed(e, { users: [compact(e, { username: 'victim', status: 'active', updatedAt: NOW })] }));
    assert.strictEqual(e.state.users.find(u => u.username === 'victim').status, 'active');
});

control('SC-02', 'unsigned fromAdmin packet is rejected', () => {
    const e = h.createEnv({ now: NOW });
    const changed = e.processIncomingCloudPacket(packet(e, { fromAdmin: true, hideAuthorInfo: true, hideAuthorTs: NOW + 1 }));
    assert.strictEqual(changed, false, 'unsigned privileged packet must be rejected');
    assert.strictEqual(e.state.hideAuthorInfo, false);
});

control('SC-03', 'invalid signature packet causes no tombstone or user mutation', () => {
    const e = h.createEnv({ now: NOW, state: { users: [user({ username: 'victim', updatedAt: NOW - 1 })] } });
    e.processIncomingCloudPacket(packet(e, {
        fromAdmin: true, adminSig: 'asig_INVALID',
        deletedMap: { victim: NOW + 10000 },
        users: [compact(e, { username: 'injected', status: 'active', vipPlan: 'lifetime', updatedAt: NOW })]
    }));
    assert.ok(e.state.users.some(u => u.username === 'victim'), 'tombstone must be ignored');
    assert.ok(!e.state.users.some(u => u.username === 'injected'), 'user injection must be ignored');
});

control('SC-04', 'expired packet is rejected', () => {
    const e = h.createEnv({ now: NOW });
    const changed = e.processIncomingCloudPacket(signed(e, {
        ts: 1, hideAuthorTs: 2, hideAuthorInfo: true,
        users: [compact(e, { username: 'ancient', updatedAt: 1 })]
    }));
    assert.strictEqual(changed, false);
    assert.strictEqual(e.state.users.some(u => u.username === 'ancient'), false);
});

control('SC-05', 'replay protection is present in the verifier', () => {
    const e = h.createEnv({ now: NOW });
    const p = signed(e, { users: [compact(e, { username: 'replay', updatedAt: NOW })] });
    e.processIncomingCloudPacket(p);
    assert.ok(e.replayCache || e.seenPacketIds, 'verifier must expose a replay cache');
    const changed = e.processIncomingCloudPacket(p);
    assert.strictEqual(changed, false);
});

control('SC-06', 'unauthorized tombstone is rejected', () => {
    const e = h.createEnv({ now: NOW, state: { users: [user({ username: 'victim', updatedAt: NOW - 1 })] } });
    e.processIncomingCloudPacket(packet(e, { fromAdmin: false, deletedMap: { victim: NOW + 5000 } }));
    assert.ok(e.state.users.some(u => u.username === 'victim'));
});

control('SC-07', 'unauthorized user injection is rejected for every packet type', () => {
    const e = h.createEnv({ now: NOW });
    for (const type of ['STUDENT_REGISTER', 'ANY_OTHER_EVENT', 'CLOUD_STATE_SYNC', undefined]) {
        const p = packet(e, { type, users: [compact(e, { username: 'ghost_' + type, status: 'active', vipPlan: 'lifetime', updatedAt: NOW })] });
        e.processIncomingCloudPacket(p);
    }
    assert.strictEqual(e.state.users.length, 0, 'no unsigned packet may create local users');
});

control('SC-08', 'password never enters a public packet', () => {
    const e = h.createEnv({ now: NOW, state: { users: [user()] } });
    const serialized = e.serializeCompactUser(e.state.users[0]);
    assert.ok(!Object.prototype.hasOwnProperty.call(serialized, 'p'));
    const snapshot = JSON.stringify(e.buildTeacherSnapshotPacket([]));
    assert.ok(!snapshot.includes('synthetic_password'));
});

control('SC-09', 'cross-account packet does not mutate an unrelated account', () => {
    const accountA = h.createEnv({ now: NOW, state: { users: [user({ username: 'a_user', status: 'active', updatedAt: NOW - 1 })] } });
    const accountB = h.createEnv({ now: NOW, state: { users: [user({ username: 'b_user', status: 'active', updatedAt: NOW - 1 })] } });
    const p = signed(accountA, { targetAccount: 'account-a', users: [compact(accountA, { username: 'b_user', status: 'locked', updatedAt: NOW })] });
    accountB.processIncomingCloudPacket(p);
    assert.strictEqual(accountB.state.users.find(u => u.username === 'b_user').status, 'active');
});

console.log(`\nTOTAL ${rows.length} PASS ${rows.length - failed} FAIL ${failed}`);
console.log(failed === 0 ? 'PATCHED STATE: all secure controls pass' : 'CURRENT STATE: controls fail as expected before remediation');
process.exit(failed === 0 ? 0 : 1);
