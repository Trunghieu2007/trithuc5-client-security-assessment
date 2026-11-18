// phase3_tests.js — Phase 3 controlled validation.
// Run with: TRITHUC_SOURCE=/path/to/target.html node research/trithuc5/tests/phase3_tests.js
// Uses synthetic identities only. All fetch calls are captured by local mocks.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const h = require('./harness.js');
const p3 = require('./phase3_harness.js');

const NOW = 1795000000000;
const results = [];
let failures = 0;

async function check(id, title, fn) {
    try {
        await fn();
        const line = `PASS ${id} ${title}`;
        results.push(line);
        console.log(line);
    } catch (e) {
        failures++;
        const line = `FAIL ${id} ${title} :: ${String(e.message).split('\n')[0]}`;
        results.push(line);
        console.log(line);
    }
}

function gformConfig() {
    return {
        actionUrl: 'https://docs.google.com/forms/d/e/SYNTHETIC_FORM_ID/formResponse',
        entryName: 'entry.111111',
        entryClass: 'entry.222222',
        entryScore: 'entry.333333',
        entryDetail: 'entry.444444',
        autoSyncActivity: true
    };
}

function pkt(overrides) {
    return Object.assign({
        app: 'TRITHUC50_V436',
        type: 'CLOUD_STATE_SYNC',
        ts: NOW,
        fromAdmin: false,
        hideAuthorInfo: false,
        hideAuthorTs: 0,
        deletedUsernames: [],
        deletedMap: {},
        users: []
    }, overrides || {});
}

(async () => {
    console.log('=== TRITHUC5.0 V4.3.9 Phase 3 controlled validation ===');
    console.log('source sha256: ' + h.readSource().sha);

    await check('P3-01', 'registration password reaches Google Form payload and localStorage activity log', () => {
        const e = p3.createDeepEnv({ now: NOW, state: { activityLogs: [] } });
        e.state.googleFormConfig = gformConfig();
        const u = h.compactUser();
        const entry = e.logStudentActivity(
            'REGISTER_ACCOUNT',
            'register',
            '[REGISTER_ACCOUNT] TK: synthetic_user | MK: synthetic_password | Gmail: synthetic@example.edu.vn',
            'synthetic detail',
            'Chờ duyệt',
            u
        );
        assert.ok(entry, 'log entry should be created');
        const sent = e.window.__GFORM_SENT_LOG__ || [];
        assert.ok(sent.some(x => JSON.stringify(x).includes('synthetic_password')), 'password in GForm send log');
        assert.ok(e.__captures.some(c =>
            c.url.includes('docs.google.com/forms') && c.body.includes('synthetic_password')
        ), 'password in captured GForm request body');
        const stored = e.safeStorageGet(e.STORAGE_KEYS.ACTIVITY_LOGS);
        assert.ok(stored && stored.includes('synthetic_password'), 'password in localStorage activity log');
    });

    await check('P3-02', 'safeStorageSet mirrors sensitive values into cookie and window.name', () => {
        const e = h.createEnv({ now: NOW });
        e.safeStorageSet('P3_SECRET_KEY', 'phase3_synthetic_secret');
        assert.ok(e.document.cookie.includes('P3_SECRET_KEY=phase3_synthetic_secret'), 'cookie mirror');
        assert.ok(e.window.name.includes('__TRITHUC_WN__:'), 'window.name store marker');
        assert.ok(e.window.name.includes('phase3_synthetic_secret'), 'window.name mirror');
        const lines = h.readSource().lines;
        const cookieLine = lines.find(l => l.includes('document.cookie = `${key}=${encodeURIComponent(sVal)}'));
        assert.ok(cookieLine, 'cookie write line found');
        assert.ok(/SameSite=Lax/i.test(cookieLine), 'SameSite=Lax present');
        assert.ok(!/HttpOnly/i.test(cookieLine), 'HttpOnly absent');
        assert.ok(!/Secure/i.test(cookieLine), 'Secure absent');
    });

    await check('P3-03', 'V4.4: unsigned stale admin packet is rejected by the 24h poll; a VALIDLY signed stale packet still applies', async () => {
        const e = h.createEnv({ now: NOW });
        const stale = pkt({
            ts: 1,
            fromAdmin: true,
            hideAuthorInfo: true,
            hideAuthorTs: 2,
            users: [e.serializeCompactUser(h.compactUser({ username: 'stale_auto_user', updatedAt: 1 }))]
        });
        // Unsigned: V4.4 rejects the admin claim outright.
        e.__meta.bus.sse = ['TT50V436:' + e.toBase64UrlSafe(JSON.stringify(stale))];
        await e.pullCloudSyncMessages(false);
        assert.strictEqual(e.state.hideAuthorInfo, false, 'V4.4 must not apply an unsigned admin packet');
        assert.strictEqual(e.state.users.some(u => u.username === 'stale_auto_user'), false,
            'V4.4 must not inject from an unsigned admin packet');

        // Signed (signature is reproducible offline): the stale packet still applies.
        const staleSigned = Object.assign({}, stale, { adminSig: e.computeCloudPacketAdminSig(stale) });
        e.__meta.bus.sse = ['TT50V436:' + e.toBase64UrlSafe(JSON.stringify(staleSigned))];
        const changed = await e.pullCloudSyncMessages(false);
        assert.strictEqual(changed, true, 'validly signed stale packet applies (no packet-level expiry)');
        assert.strictEqual(e.state.hideAuthorInfo, true, 'stale privileged field applied');
        assert.ok(e.state.users.some(u => u.username === 'stale_auto_user'), 'stale user applied');

        const src = h.readSource().text;
        assert.ok(src.includes("/json?poll=1&since=24h"), '24h poll window in source');
        assert.ok(src.includes("/sse?since=24h"), '24h SSE window in source');
    });

    await check('P3-04', 'V4.4: per-user KV record exceeds the 450-char cap and is skipped; the password still lands in the public snapshot chunks', async () => {
        const e = p3.createDeepEnv({ now: NOW });
        await e.pushCloudSyncPacket('STUDENT_REGISTER', { username: 'S.User', password: 'spw' }, []);

        // V4.4 added `seal`/`bkt` to serializeCompactUser, pushing a typical
        // per-user record past the `singleStr.length <= 450` gate (line ~3812),
        // so the predictable u_<slug>_<idx> key is no longer written.
        const perUser = e.__captures.filter(c => c.url.includes('u_suser_'));
        assert.strictEqual(perUser.length, 0, 'V4.4 skips the per-user KV write for a typical record');
        const cu = e.serializeCompactUser({ username: 'S.User', password: 'spw' });
        const probe = e.toBase64UrlSafe(JSON.stringify({ app: 'TRITHUC50_V436', type: 'STUDENT_REGISTER', ts: NOW, fromAdmin: false, adminSig: '', user: cu }));
        assert.ok(probe.length > 450, 'per-user payload measures ' + probe.length + ' chars (> 450 cap)');

        // The registration record itself no longer enters the snapshot through
        // this path on V4.4 (the snapshot serialises state.users, and a fresh
        // registration is not in state.users yet).
        const chunkCalls = e.__captures.filter(c => c.url.includes('/s_'));
        assert.ok(chunkCalls.length > 0, 'snapshot chunks are still published');
        const joined = chunkCalls.map(c => c.url.split('/').pop()).join('');
        const decoded = e.fromBase64UrlSafe(joined);
        assert.ok(!decoded.includes('spw'), 'V4.4: registration password absent from this snapshot path');

        // NEW-01 still holds at the serializer level: any user stored in
        // state.users keeps its password in every published packet.
        const cuFinal = e.serializeCompactUser({ username: 'stored_user', password: 'spw' });
        assert.strictEqual(cu.p, 'spw', 'password still serialised for users in state.users');
    });

    await check('P3-05', 'client-controlled admin-tester flag suppresses logging and GForm sync', () => {
        const e = p3.createDeepEnv({ now: NOW, state: { activityLogs: [] } });
        e.state.googleFormConfig = gformConfig();
        const tester = h.compactUser({ isAdminTester: true, username: 'synthetic_tester' });
        assert.strictEqual(e.isAdminExamAttempt(tester), true, 'flag accepted as admin tester');
        const before = e.__captures.length;
        const entry = e.logStudentActivity('LOGIN', 'login', 'synthetic_target', 'synthetic_detail', 'ok', tester);
        assert.strictEqual(entry, null, 'log creation suppressed');
        assert.strictEqual(e.__captures.length, before, 'no Google Form request');
        assert.strictEqual(e.state.activityLogs.length, 0, 'no local activity log');
    });

    await check('P3-06', 'negative control: object-valued __proto__ tombstone does not pollute the tombstone map', () => {
        const e = h.createEnv({ now: NOW, state: { users: [h.compactUser({ username: 'victim', updatedAt: NOW })] } });
        const malformed = JSON.parse('{"__proto__":{"victim":9999999999999}}');
        e.processIncomingCloudPacket(pkt({ deletedMap: malformed }));
        assert.strictEqual(Object.getPrototypeOf(e.state.deletedUsersMap), Object.prototype, 'prototype unchanged');
        assert.ok(e.state.users.some(u => u.username === 'victim'), 'victim not deleted');
    });

    await check('P3-07', 'negative control: no cross-environment mutation without explicit packet transfer', () => {
        const a = h.createEnv({ now: NOW });
        const b = h.createEnv({ now: NOW });
        a.processIncomingCloudPacket(pkt({
            users: [a.serializeCompactUser(h.compactUser({ username: 'isolated_user', status: 'active' }))]
        }));
        assert.ok(a.state.users.some(u => u.username === 'isolated_user'));
        assert.strictEqual(b.state.users.length, 0, 'other VM unchanged');
    });

    await check('P3-08', 'remembered credentials are stored as plaintext and autofilled', () => {
        const e = h.createEnv({ now: NOW });
        e.safeStorageSet(e.STORAGE_KEYS.REMEMBERED_STUDENT_CREDS, JSON.stringify({
            username: 'synthetic_user', password: 'synthetic_password', remember: true
        }));
        const raw = e.safeStorageGet(e.STORAGE_KEYS.REMEMBERED_STUDENT_CREDS);
        assert.ok(raw.includes('synthetic_password'));
        const lines = h.readSource().lines;
        assert.ok(lines.some(l => l.includes('REMEMBERED_STUDENT_CREDS, JSON.stringify(state.savedStudentCreds)')));
        assert.ok(lines.some(l => l.includes('pInp.value = state.savedStudentCreds.password')));
        assert.ok(lines.some(l => l.includes('REMEMBERED_ADMIN_CREDS, JSON.stringify(state.savedAdminCreds)')));
    });

    const outDir = path.join(__dirname, '..', 'evidence');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'phase3-test-results.txt'),
        results.join('\n') + `\n\nTOTAL ${results.length} PASS ${results.length - failures} FAIL ${failures}\n`);
    console.log(`\nTOTAL ${results.length} PASS ${results.length - failures} FAIL ${failures}`);
    process.exit(failures ? 1 : 0);
})().catch(err => {
    console.error(err);
    process.exit(2);
});
