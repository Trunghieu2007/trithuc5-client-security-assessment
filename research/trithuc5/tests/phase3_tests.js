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
    console.log('=== TRITHUC5.0 V4.5 Phase 3 controlled validation ===');
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

    await check('P3-02', 'V4.8.0 FIX: sensitive keys stay in localStorage, not cookie/window.name/sessionStorage', () => {
        const store = h.makeMemoryStorage();
        const e = h.createEnv({ now: NOW, localStore: store });
        e.safeStorageSet('TRITHUC50_USERS_V436_CLEAN', '{"secret":1}');
        assert.ok(store.getItem('TRITHUC50_USERS_V436_CLEAN'), 'localStorage write remains');
        assert.ok(!e.document.cookie.includes('TRITHUC50_USERS'), 'no sensitive cookie mirror');
        assert.ok(!e.window.name.includes('TRITHUC50_USERS'), 'no sensitive window.name mirror');
        // Non-sensitive values still mirror, with a Strict cookie.
        e.safeStorageSet('P3_SECRET_KEY', 'phase3_synthetic_secret');
        assert.ok(e.document.cookie.includes('P3_SECRET_KEY=phase3_synthetic_secret'), 'non-sensitive cookie mirror');
        assert.ok(e.window.name.includes('phase3_synthetic_secret'), 'non-sensitive window.name mirror');
        const lines = h.readSource().lines;
        const cookieLine = lines.find(l => l.includes('document.cookie = `${key}=${encodeURIComponent(sVal)}'));
        assert.ok(/SameSite=Strict/i.test(cookieLine), 'cookie is SameSite=Strict');
        assert.ok(lines.some(l => l.includes('__SENSITIVE_STORAGE_RE_V480__')), 'sensitive-key filter present');
    });

    await check('P3-03', 'V4.8.0 FIX: stale packets are rejected at the verifier even when signed', async () => {
        const e = h.createEnv({ now: NOW });
        const stale = pkt({
            ts: 1,
            fromAdmin: true,
            hideAuthorInfo: true,
            hideAuthorTs: 2,
            users: [e.serializeCompactUser(h.compactUser({ username: 'stale_auto_user', updatedAt: 1 }))]
        });
        e.__meta.bus.sse = ['TT50V436:' + e.toBase64UrlSafe(JSON.stringify(stale))];
        await e.pullCloudSyncMessages(false);
        assert.strictEqual(e.state.hideAuthorInfo, false, 'unsigned stale admin packet rejected');
        assert.strictEqual(e.state.users.some(u => u.username === 'stale_auto_user'), false);

        const staleSigned = Object.assign({}, stale, { adminSig: e.computeCloudPacketAdminSig(stale) });
        e.__meta.bus.sse = ['TT50V436:' + e.toBase64UrlSafe(JSON.stringify(staleSigned))];
        const changed = await e.pullCloudSyncMessages(false);
        assert.strictEqual(changed, false, 'signed stale packet rejected by the 26h verifier');
        assert.strictEqual(e.state.hideAuthorInfo, false);
        assert.ok(!e.state.users.some(u => u.username === 'stale_auto_user'));

        const src = h.readSource().text;
        assert.ok(src.includes("/json?poll=1&since=24h"), '24h poll window in source');
        assert.ok(src.includes("/sse?since=24h"), '24h SSE window in source');
    });

    await check('P3-04', 'V4.8.5 FIX: public KV writes disabled; passwords, seal and token absent from remaining writes', async () => {
        const e = p3.createDeepEnv({ now: NOW });
        await e.pushCloudSyncPacket('STUDENT_REGISTER', { username: 'S.User', password: 'spw' }, []);

        const perUser = e.__captures.filter(c => c.url.includes('u_suser_'));
        assert.strictEqual(perUser.length, 0, 'per-user KV write skipped for a typical record');
        const cu = e.serializeCompactUser({ username: 'S.User', password: 'spw' });
        assert.strictEqual(cu.p, '', 'password field blanked');
        assert.strictEqual(cu.seal, '', 'seal field blanked');
        assert.strictEqual(cu.bkt, '', 'backend token field blanked');

        // V4.8.5 disabled the public keyvalue.immanuel.co path entirely.
        const kvCalls = e.__captures.filter(c =>
            c.url.includes('keyvalue.immanuel.co') || c.url.includes('/s_') || c.url.includes('u_suser_'));
        assert.strictEqual(kvCalls.length, 0, 'no public KV snapshot/per-user write remains');
        assert.ok(h.readSource().text.includes('const CLOUD_KV_DISABLED_V485 = true;'), 'KV path disabled in source');
        assert.ok(e.__captures.every(c => !String(c.body).includes('spw')), 'password absent from every captured write');

        const cuFinal = e.serializeCompactUser({ username: 'stored_user', password: 'spw' });
        assert.strictEqual(cuFinal.p, '', 'password never serialised, even for a stored user');
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

    await check('P3-08', 'V4.5: student remember-me still stores plaintext; admin remember-me no longer does', () => {
        const e = h.createEnv({ now: NOW });
        e.safeStorageSet(e.STORAGE_KEYS.REMEMBERED_STUDENT_CREDS, JSON.stringify({
            username: 'synthetic_user', password: 'synthetic_password', remember: true
        }));
        const raw = e.safeStorageGet(e.STORAGE_KEYS.REMEMBERED_STUDENT_CREDS);
        assert.ok(raw.includes('synthetic_password'), 'student password still survives in storage');
        const lines = h.readSource().lines;
        assert.ok(lines.some(l => l.includes('REMEMBERED_STUDENT_CREDS, JSON.stringify(state.savedStudentCreds)')));
        assert.ok(lines.some(l => l.includes('pInp.value = state.savedStudentCreds.password')));
        // V4.5 fix: admin credentials/remember-me write only username + remember.
        assert.ok(lines.some(l => l.includes('REMEMBERED_ADMIN_CREDS, JSON.stringify({ username: uVal, remember: true })')));
        assert.ok(!lines.some(l => l.includes('REMEMBERED_ADMIN_CREDS, JSON.stringify(state.savedAdminCreds)')));
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
