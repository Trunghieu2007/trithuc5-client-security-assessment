// run_all.js — deterministic local regression tests for TRITHUC5.0 V4.3.9.
// Uses only the isolated harness; never contacts the target, ntfy.sh, or Cloud KV.
// Usage: node research/trithuc5/tests/run_all.js

'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
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

console.log('=== TRITHUC5.0 V4.3.9 isolated regression suite ===');
console.log('source sha256: ' + h.readSource().sha);
console.log('now (fixed): ' + NOW);
console.log('--- F-01 cloud sync / ntfy / KV ---');

test('F-01-T01', 'missing adminSig is accepted as admin and merges privileged fields', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'victim', status: 'pending', vipPlan: 'none', updatedAt: NOW - 1000 })] } });
    const p = packet(e, {
        fromAdmin: true,
        hideAuthorInfo: true,
        hideAuthorTs: NOW + 1,
        users: [compact(e, { username: 'victim', status: 'active', vipPlan: 'lifetime', updatedAt: NOW })]
    });
    assert.strictEqual(typeof p.adminSig, 'undefined');
    e.processIncomingCloudPacket(p);
    assert.strictEqual(e.state.hideAuthorInfo, true, 'hideAuthorInfo should have been changed');
    const v = e.state.users.find(u => u.username === 'victim');
    assert.strictEqual(v.status, 'active');
    assert.strictEqual(v.vipPlan, 'lifetime');
});

test('F-01-T02', 'invalid signature still applies tombstone and injects active VIP user', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'synthetic_student', updatedAt: NOW - 10 })] } });
    const p = packet(e, {
        fromAdmin: true,
        adminSig: 'asig_INVALID',
        deletedMap: { synthetic_student: NOW + 10000 },
        users: [compact(e, allVip({ username: 'injected_user', id: 'stu_injected' }))]
    });
    e.processIncomingCloudPacket(p);
    assert.strictEqual(e.state.users.some(u => u.username === 'synthetic_student'), false, 'tombstone should have removed user');
    const injected = e.state.users.find(u => u.username === 'injected_user');
    assert.ok(injected, 'injected user should exist');
    assert.strictEqual(injected.status, 'active');
    assert.strictEqual(injected.vipPlan, 'lifetime');
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

test('F-01-T04', 'missing fromAdmin still injects active VIP user when type is not STUDENT_REGISTER', () => {
    const e = h.createEnv({ now: NOW });
    const p = packet(e, { type: 'ANY_OTHER_EVENT', users: [compact(e, allVip({ username: 'ghost_user' }))] });
    delete p.fromAdmin;
    assert.strictEqual(typeof p.fromAdmin, 'undefined');
    assert.strictEqual(typeof p.adminSig, 'undefined');
    e.processIncomingCloudPacket(p);
    const g = e.state.users.find(u => u.username === 'ghost_user');
    assert.ok(g);
    assert.strictEqual(g.status, 'active');
    assert.strictEqual(g.isVip, true);
});

test('F-01-T05', 'forged fromAdmin without signature is indistinguishable from a real admin packet', () => {
    const e = h.createEnv({ now: NOW });
    e.processIncomingCloudPacket(packet(e, { fromAdmin: true, hideAuthorInfo: true, hideAuthorTs: NOW + 1 }));
    assert.strictEqual(e.state.hideAuthorInfo, true);
});

test('F-01-T06', 'replayed packet has no replay guard and is merely idempotent for equal timestamps', () => {
    const e = h.createEnv({ now: NOW });
    const p = signed(e, { hideAuthorInfo: true, hideAuthorTs: NOW + 1, users: [compact(e, allVip({ username: 'replay_user' }))] });
    e.processIncomingCloudPacket(p);
    const first = e.state.users.length;
    e.processIncomingCloudPacket(p);
    assert.strictEqual(e.state.users.length, first, 'duplicate should not add another user');
    const fn = h.extractFunction(h.readSource().lines, 'processIncomingCloudPacket').code;
    assert.ok(!/nonce|replay|seenPacket|messageId/i.test(fn), 'no replay identifiers in verifier');
});

test('F-01-T07', 'expired packet is still applied', () => {
    const e = h.createEnv({ now: NOW });
    const p = signed(e, {
        ts: 1, hideAuthorTs: 2, hideAuthorInfo: true,
        users: [compact(e, { username: 'ancient_user', updatedAt: 1 })]
    });
    e.processIncomingCloudPacket(p);
    assert.strictEqual(e.state.hideAuthorInfo, true);
    assert.ok(e.state.users.some(u => u.username === 'ancient_user'));
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

test('F-01-T10', 'unauthorized deletion request from non-admin packet is applied', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'delete_me', updatedAt: NOW - 1 })] } });
    e.processIncomingCloudPacket(packet(e, { fromAdmin: false, deletedMap: { delete_me: NOW + 5000 } }));
    assert.strictEqual(e.state.users.some(u => u.username === 'delete_me'), false);
});

test('F-01-T11', 'public topic has no cross-browser isolation: packet from one client mutates another', () => {
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
    assert.strictEqual(v.status, 'locked', 'other client accepted packet from public channel');
});

test('F-01-T12', 'forged tombstone persists and blocks later legitimate restore', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'restore_me', updatedAt: NOW - 100 })] } });
    e.processIncomingCloudPacket(packet(e, { fromAdmin: true, deletedMap: { restore_me: NOW + 100000 } }));
    assert.strictEqual(e.state.users.some(u => u.username === 'restore_me'), false);
    e.processIncomingCloudPacket(signed(e, { users: [compact(e, { username: 'restore_me', updatedAt: NOW })] }));
    assert.strictEqual(e.state.users.some(u => u.username === 'restore_me'), false, 'tombstone should still block restore');
});

test('F-01-T13', 'student passwords are serialized into public cloud packets', () => {
    const e = h.createEnv({ now: NOW, state: { users: [h.compactUser()] } });
    const compact = e.serializeCompactUser(e.state.users[0]);
    assert.strictEqual(typeof compact.p, 'string');
    assert.ok(compact.p.length > 0, 'password field must be populated by shipped serializer');
    const pkt = e.buildTeacherSnapshotPacket([]);
    const json = JSON.stringify(pkt);
    assert.ok(json.includes('"p":"synthetic_password"'), 'password must appear in snapshot JSON');
    const decoded = e.fromBase64UrlSafe(e.toBase64UrlSafe(json));
    assert.ok(decoded.includes('synthetic_password'));
});

test('F-01-T14', 'global cloud bus exposes direct packet application (static)', () => {
    const src = h.readSource().text;
    assert.ok(src.includes('window.__TRITHUC50_CLOUD_BUS__'));
    assert.ok(src.includes('applyIncomingPacket(packetObj)'));
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

test('F-02-T02', 'session with missing signature is accepted', () => {
    const e = h.createEnv({ now: NOW });
    e.safeStorageSet(e.STORAGE_KEYS.REMEMBERED_ADMIN_SESSION, JSON.stringify({ loggedIn: true, username: 'anyone', ts: NOW }));
    e.checkRememberedAdminSessionFromSource();
    assert.strictEqual(e.state.isAdminLoggedIn, true);
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

test('F-03-T01', 'recomputed _sig makes tampered VIP entitlement pass runtime check', () => {
    const e = h.createEnv({ now: NOW });
    const u = h.compactUser({ vipPackages: { k12: true, k11: true, k10: true, luyende: true }, vipPlan: 'lifetime', maxDevices: 999 });
    u._sig = e.computeUserIntegritySig(u);
    e.state.loggedInStudent = u;
    assert.strictEqual(e.verifyRuntimeSecurityIntegrity(), true);
    assert.strictEqual(e.state.loggedInStudent.maxDevices, 999);
});

test('F-03-T02', 'stale _sig is detected and VIP is stripped', () => {
    const e = h.createEnv({ now: NOW });
    const clean = h.compactUser();
    clean._sig = e.computeUserIntegritySig(clean);
    const tampered = JSON.parse(JSON.stringify(clean));
    tampered.vipPackages = { k12: true, k11: true, k10: true, luyende: true };
    tampered.vipPlan = 'lifetime';
    e.state.loggedInStudent = tampered;
    assert.strictEqual(e.verifyRuntimeSecurityIntegrity(), false);
    assert.strictEqual(e.state.loggedInStudent.vipPlan, 'none');
});

test('F-03-T03', 'lifetime and future expiry pass, past expiry fails', () => {
    const e = h.createEnv({ now: NOW });
    assert.strictEqual(e.isStudentVipExpired(h.compactUser({ vipPlan: 'lifetime' })), false);
    assert.strictEqual(e.isStudentVipExpired(h.compactUser({ vipPlan: '1y', vipExpiresAt: NOW + 1000 })), false);
    assert.strictEqual(e.isStudentVipExpired(h.compactUser({ vipPlan: '1y', vipExpiresAt: NOW - 1000 })), true);
});

console.log('--- F-04 answer exposure ---');

test('F-04-T01', '15 bundled exams expose 330 plain answer entries before submission', () => {
    const lines = h.readSource().lines;
    const idx = lines.findIndex(l => l.startsWith('window.__INITIAL_EXAMS_DATA__'));
    assert.ok(idx >= 0);
    const raw = lines[idx].replace(/^window\.__INITIAL_EXAMS_DATA__\s*=\s*/, '');
    const exams = JSON.parse(raw.slice(0, raw.lastIndexOf('];') + 1));
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
    const anti = lines.slice(3783, 3945).join('\n');
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

test('A-03-T01', 'response headers lack CSP and frame/content-type protections (static)', () => {
    const headers = fs.readFileSync(path.join(__dirname, '..', 'current.headers'), 'utf8');
    assert.ok(/Access-Control-Allow-Origin:\s*\*/i.test(headers));
    assert.ok(!/Content-Security-Policy:/i.test(headers));
    assert.ok(!/X-Frame-Options:/i.test(headers));
    assert.ok(!/X-Content-Type-Options:/i.test(headers));
});

test('A-04-T01', 'cross-tab storage event replaces state.users from writable localStorage (static)', () => {
    const lines = h.readSource().lines;
    const block = lines.slice(15860, 15878).join('\n');
    assert.ok(block.includes("window.addEventListener('storage'"));
    assert.ok(block.includes('state.users = parsedU'));
    assert.ok(!/origin|isTrusted|signature/i.test(block));
});

const outDir = path.join(__dirname, '..', 'evidence');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'test-results.txt'), results.join('\n') + `\n\nTOTAL ${results.length} PASS ${results.length - failures} FAIL ${failures}\n`);
console.log(`\nTOTAL ${results.length} PASS ${results.length - failures} FAIL ${failures}`);
process.exit(failures ? 1 : 0);
