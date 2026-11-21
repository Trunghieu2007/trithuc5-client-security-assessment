// independent_verification.js — INDEPENDENT execution-based verification of the V4.5 build.
// Written separately from phase4_tests.js: its own SHA pin, extraction, VM environment and
// assertions. Exercises the REAL functions extracted from the public HTML with synthetic data.
// No production requests, no real credentials, no ntfy/KV writes.
//
// Usage: TRITHUC_SOURCE=/path/to/V4.5/target.html node tests/independent_verification.js

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const SOURCE = process.env.TRITHUC_SOURCE || path.join(
    __dirname, '..', '..', '..', '..', 'research', 'trithuc5', 'phase5', 'target.html');
const EXPECTED_SHA = 'eff119024864bb4cfcc96ba2eeac44257e0c73c79456616091b6202535ab965f';
const NOW = 1795000000000;

function source() {
    const text = fs.readFileSync(SOURCE, 'utf8');
    const sha = crypto.createHash('sha256').update(text).digest('hex');
    assert.strictEqual(sha, EXPECTED_SHA, 'source hash mismatch — re-measure before verification');
    return text.split(/\r?\n/);
}

function byName(lines, name) {
    const start = lines.findIndex(l => new RegExp('^\\s*(?:async\\s+)?function\\s+' + name + '\\s*\\(').test(l));
    if (start < 0) throw new Error('missing function: ' + name);
    let depth = 0, seen = false;
    for (let i = start; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === '{') { depth++; seen = true; }
            else if (ch === '}') depth--;
        }
        if (seen && depth === 0) return lines.slice(start, i + 1).join('\n');
    }
    throw new Error('unbalanced function: ' + name);
}

function byDecl(lines, needle) {
    const start = lines.findIndex(l => l.includes(needle));
    if (start < 0) throw new Error('missing declaration: ' + needle);
    let depth = 0, seen = false;
    for (let i = start; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === '{') { depth++; seen = true; }
            else if (ch === '}') depth--;
        }
        if (seen && depth === 0) return lines.slice(start, i + 1).join('\n');
    }
    throw new Error('unbalanced declaration: ' + needle);
}

const FN = [
    'hashStringHex', 'sanitizePlainInput', 'computeUserIntegritySig', 'computeAdminSessionSig',
    'computeTeacherVipApprovalSealV44', 'detectAndBlockStudentVipHackV44',
    'recordVipHackSecurityAlertV44', 'verifyRuntimeSecurityIntegrity', 'isStudentVipExpired',
    'hasStudentVipAccess', 'verifyProtectedVipActionV44', 'isAdminExamAttempt', 'isFreeLesson',
    'computeCloudPacketAdminSig', 'serializeCompactUser', 'deserializeCompactUser',
    'isUserDeletedByTombstone', 'processIncomingCloudPacket',
    'readWindowNameStore', 'writeWindowNameStore', 'safeStorageGet', 'safeStorageSet',
    'safeStorageRemove', 'saveActivityLogsState', 'normalizeGFormActionUrl',
    'normalizeGFormEntryCode', 'postToGoogleFormEndpoint', 'syncActivityLogToGoogleForm',
    'logStudentActivity'
];

function mem() {
    const m = new Map();
    return {
        getItem(k) { return m.has(String(k)) ? m.get(String(k)) : null; },
        setItem(k, v) { m.set(String(k), String(v)); },
        removeItem(k) { m.delete(String(k)); },
        entries() { return m.entries(); }
    };
}

function makeEnv(overrides) {
    const lines = source();
    const local = mem(), session = mem();
    const rec = { cookie: [], gform: [], formDispatch: [], iframe: [], kv: [], toast: [], render: 0 };
    class FakeDate extends Date {
        constructor(...a) { super(...(a.length ? a : [NOW])); }
        static now() { return NOW; }
    }
    const document = {
        body: { appendChild() {}, removeChild() {} },
        getElementById() { return null; }, createElement() { return { style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, appendChild() {}, submit() {} }; },
        addEventListener() {}, querySelector() { return null; }
    };
    Object.defineProperty(document, 'cookie', {
        get() { return rec.cookie.map(c => c.split(';')[0]).join('; '); },
        set(v) { rec.cookie.push(String(v)); }
    });
    const sandbox = {
        console, Math, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise,
        RegExp, Error, TypeError, Date: FakeDate, URLSearchParams, parseInt, parseFloat,
        isNaN, isFinite, encodeURIComponent, decodeURIComponent, atob, btoa,
        setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
        localStorage: local, sessionStorage: session, document,
        navigator: { userAgent: 'IndependentVerificationHarness/1.0' },
        screen: { width: 1920, height: 1080 },
        AbortController: class { constructor() { this.signal = {}; } abort() {} },
        window: { name: '', TRITHUC: {} },
        fetch: async (url, init) => {
            rec.kv.push({ url: String(url), body: init && init.body });
            return { ok: false, text: async () => '' };
        },
        showToast: m => rec.toast.push(String(m)),
        renderApp: () => { rec.render++; },
        getHardwareDeviceProfile: () => ({ deviceId: 'DEV-INDEPENDENT', deviceName: 'IndependentHarness' }),
        findLessonById: () => null,
        saveExamsState: () => {},
        dispatchParamsToGoogleFormUrl: (url, params, pairs) => { rec.formDispatch.push({ url, pairs }); },
        submitViaHiddenIframe: (url, pairs) => { rec.iframe.push({ url, pairs }); return true; },
        extractGoogleFormEntriesFromAnyInput: () => ({ entries: [] }),
        VIP_HACK_ALERTS_KEY_V44: 'TRITHUC50_VIP_HACK_ALERTS_V44',
        state: Object.assign({
            users: [], deletedUsersMap: {}, deletedUsernames: [], loggedInStudent: null,
            isAdminLoggedIn: false, adminPreviewUnlockAll: false, activeGrade: '12',
            vaultLockConfig: {}, adminCreds: {},
            vipHackAlerts: [], activityLogs: [], exams: [],
            blacklistedDeviceIds: {}, deviceSecurityPolicy: { defaultMaxDevices: 2 },
            googleFormConfig: {}, perfConfig: {}
        }, (overrides && overrides.state) || {})
    };
    vm.createContext(sandbox);
    const pieces = [
        byDecl(lines, 'const STORAGE_KEYS = {'),
        lines[2193], // V4.5: const __MEMORY_STORE__ = {}; (line 2194)
        lines.slice(2029, 2054).join('\n'), // hash64V45 / saltedAuthHashV45 / V4.5 hash literals
        'const LEGACY_SAMPLE_BANNED = new Set();',
        'const deletedUsernamesRegistry = new Set();',
        byDecl(lines, 'const BackendVipAuthServiceV44 = (function() {'),
        byDecl(lines, 'const LessonVipVaultV44 = (function() {'),
        ...FN.map(n => byName(lines, n)),
        'function bootNormalizeUsersV44() {\n' +
        lines.slice(3552, 3621).join('\n') + '\n}',
        'const bundledUsers = [];',
        ...['BackendVipAuthServiceV44', 'bootNormalizeUsersV44', 'processIncomingCloudPacket',
            'computeCloudPacketAdminSig', 'serializeCompactUser', 'deserializeCompactUser',
            'deletedUsernamesRegistry', 'hasStudentVipAccess', 'verifyProtectedVipActionV44',
            'verifyRuntimeSecurityIntegrity',             'hasVerifiedPackageAccessProbe', 'LessonVipVaultV44',
            'computeUserIntegritySig', 'computeTeacherVipApprovalSealV44', 'detectAndBlockStudentVipHackV44'
        ].map(n => n === 'hasVerifiedPackageAccessProbe'
            ? 'globalThis.hasVerifiedPackageAccessProbe = (u,k,c) => BackendVipAuthServiceV44.hasVerifiedPackageAccess(u,k,c);'
            : `globalThis.${n} = ${n};`)
    ];
    vm.runInContext(pieces.join('\n'), sandbox, { filename: 'independent-v44-extracted.js' });
    return Object.assign(sandbox, { __rec: rec, __local: local, __session: session });
}

function ordinaryUser(overrides) {
    return Object.assign({
        id: 'stu_independent_001', username: 'independentuser', password: 'SYNTHETIC_SENTINEL_PW',
        name: 'Independent User', class: '12A1', stt: '01', gmail: 'independentuser@example.edu.vn',
        status: 'active', vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        vipPlan: '1y', vipExpiresAt: null, vipExpiredAt: null, isVip: true,
        maxDevices: 2, trustedDevices: [], updatedAt: NOW - 10000, createdInV436: true
    }, overrides || {});
}

let pass = 0, fail = 0;
function check(id, label, fn) {
    try { fn(); console.log('PASS ' + id + '  ' + label); pass++; }
    catch (e) { console.log('FAIL ' + id + '  ' + label + ' :: ' + (e && e.message)); fail++; }
}
function compact(u) { return { u: u.username, p: u.password, n: u.name, c: u.class, s: u.stt, vp: [1, 1, 1, 1], st: 'active', pl: '1y', maxD: 2, updAt: NOW, v436: 1 }; }

console.log('=== INDEPENDENT VERIFICATION — V4.5 (SHA ' + EXPECTED_SHA.slice(0, 8) + ') ===');

// ---------------------------------------------------------------- TRACK 1: NEW-11/12
console.log('\n-- Track 1: NEW-11/12 — _sig -> boot seal -> real access gates --');
const t1 = makeEnv();
const t1u = ordinaryUser();
const sig1 = t1.computeUserIntegritySig(t1u);
t1u._sig = sig1;
t1.state.users = [t1u];
check('IV-01', 'computeUserIntegritySig is reproducible from bundle-literal salt (offline)', () => {
    assert.strictEqual(sig1, t1.computeUserIntegritySig(ordinaryUser()));
    assert.ok(sig1.startsWith('v27_'));
});
t1.bootNormalizeUsersV44();
check('IV-02', 'V4.5 FIX: boot no longer mints a seal from _sig; an unsealed VIP record is stripped', () => {
    const u = t1.state.users[0];
    assert.ok(!u._adminVipSeal, 'no seal may be minted from _sig alone');
    assert.strictEqual(u.isVip, false);
    assert.strictEqual(u.vipPackages.k12, false);
});
// V4.5 still bundles the seal secret, so both artifacts remain reproducible offline.
t1u.vipPackages = { k12: true, k11: true, k10: true, luyende: true };
t1u.vipPlan = '1y'; t1u.isVip = true; t1u.status = 'active';
t1u._adminVipSeal = t1.computeTeacherVipApprovalSealV44(t1u);
t1u._sig = t1.computeUserIntegritySig(t1u);
t1.BackendVipAuthServiceV44.registerVerifiedUserRecord(t1u);
check('IV-02b', 'offline-forged sig + seal restore the attacker-owned VIP record after V4.5 boot stripping', () => {
    assert.ok(t1u._adminVipSeal.startsWith('vseal44_'));
    assert.strictEqual(t1u._sig, t1.computeUserIntegritySig(t1u));
});
check('IV-03', 'in-client vault registers the attacker-owned record as VIP with a backend token', () => {
    const u = t1.state.users[0];
    assert.ok(u._backendVipToken && u._backendVipToken.startsWith('bkt44_'), 'backend token minted');
    assert.strictEqual(t1.hasVerifiedPackageAccessProbe(u, 'k12', 'IV-03'), true);
    assert.strictEqual(u._adminVipSeal, t1.computeTeacherVipApprovalSealV44(u));
});
t1.state.loggedInStudent = t1.state.users[0];
check('IV-04', 'real runtime integrity check accepts the self-signed, self-sealed record', () => {
    assert.strictEqual(t1.verifyRuntimeSecurityIntegrity(), true);
});
check('IV-05', 'real hasStudentVipAccess grants k12 package', () => {
    assert.strictEqual(t1.hasStudentVipAccess('k12'), true);
});
check('IV-06', 'real hasVerifiedPackageAccess and verifyProtectedVipActionV44 both grant', () => {
    assert.strictEqual(t1.hasVerifiedPackageAccessProbe(t1u, 'k12', 'IV-06'), true);
    assert.strictEqual(t1.verifyProtectedVipActionV44('openLesson', 'k12', 'lesson_v44_x'), true);
});
check('IV-07', 'whole chain uses no server call: no KV write, no form dispatch', () => {
    assert.strictEqual(t1.__rec.kv.length, 0);
    assert.strictEqual(t1.__rec.formDispatch.length, 0);
});
// Control: tamper without recomputing sig/seal -> blocked
t1u.vipPackages.k12 = true; t1u.name = 'Independent User (tampered)';
check('IV-08', 'control: tampering after sealing invalidates _sig and runtime check rejects', () => {
    assert.strictEqual(t1.verifyRuntimeSecurityIntegrity(), false);
    assert.strictEqual(t1u.status, 'locked');
});
// Forge again entirely offline after tamper: recompute sig AND seal
const t1b = makeEnv();
const fb = ordinaryUser({ name: 'Forged Offline Name', maxDevices: 3 });
fb._sig = t1b.computeUserIntegritySig(fb);
fb._adminVipSeal = t1b.computeTeacherVipApprovalSealV44(fb);
t1b.state.users = [fb]; t1b.state.loggedInStudent = fb;
t1b.BackendVipAuthServiceV44.registerVerifiedUserRecord(fb);
check('IV-09', 'offline recomputation of sig+seal (both bundle secrets) restores all access', () => {
    assert.strictEqual(t1b.verifyRuntimeSecurityIntegrity(), true);
    assert.strictEqual(t1b.hasStudentVipAccess('k12'), true);
    assert.strictEqual(t1b.verifyProtectedVipActionV44('openLesson', 'k12', 'lesson_v44_y'), true);
});
const t1c = makeEnv();
const nc = ordinaryUser();
t1c.state.users = [nc]; t1c.bootNormalizeUsersV44();
check('IV-10', 'control: unsigned VIP record is stripped by boot before any seal is minted', () => {
    assert.ok(!nc._adminVipSeal);
    assert.strictEqual(nc.vipPackages.k12, false);
    assert.strictEqual(nc.isVip, false);
});

// ---------------------------------------------------------------- TRACK 2: NEW-14/15
console.log('\n-- Track 2: NEW-14/15 — privileged exemptions and admin preview gate bypasses --');
const t2priv = makeEnv();
const privIds = ['gv_test', 'stu_free_12b1', 'stu_practice_e'];
for (const id of privIds) {
    check('IV-11-' + id, 'detector returns false for privileged id ' + id + ' even when maxDevices=999 and _sig missing', () => {
        const u = ordinaryUser({ id, maxDevices: 999, _sig: undefined, name: '' });
        assert.strictEqual(t2priv.detectAndBlockStudentVipHackV44(u, 'IV-11'), false);
    });
}
check('IV-12', 'identical tampered record with ordinary id IS detected (true detector, not source-only)', () => {
    const u = ordinaryUser({ id: 'stu_ordinary', maxDevices: 999, _sig: undefined, name: '' });
    assert.strictEqual(t2priv.detectAndBlockStudentVipHackV44(u, 'IV-12'), true);
});
const t2rt = makeEnv();
const rtPriv = ordinaryUser({ id: 'gv_test', maxDevices: 999, _sig: undefined, name: '' });
t2rt.state.loggedInStudent = rtPriv;
check('IV-13', 'runtime integrity check skips the entire student block for gv_test (returns true with junk fields)', () => {
    assert.strictEqual(t2rt.verifyRuntimeSecurityIntegrity(), true);
    assert.strictEqual(rtPriv.maxDevices, 999);
});
const t2rt2 = makeEnv();
const rtOrd = ordinaryUser({ id: 'stu_ordinary', maxDevices: 999, _sig: undefined, name: '' });
t2rt2.state.loggedInStudent = rtOrd;
check('IV-14', 'control: same junk fields on ordinary id are locked and force session logout', () => {
    assert.strictEqual(t2rt2.verifyRuntimeSecurityIntegrity(), false);
    assert.strictEqual(rtOrd.status, 'locked');
    assert.strictEqual(t2rt2.state.loggedInStudent, null);
});
check('IV-15', 'isAdminTester flag suppresses detector on an otherwise ordinary record', () => {
    const u = ordinaryUser({ isAdminTester: true, maxDevices: 999, name: '' });
    assert.strictEqual(t2priv.detectAndBlockStudentVipHackV44(u, 'IV-15'), false);
});
const t2prev = makeEnv({ state: { isAdminLoggedIn: true, adminPreviewUnlockAll: true } });
const junk = ordinaryUser({ id: 'stu_junk', status: 'pending', vipPackages: { k12: false, k11: false, k10: false, luyende: false }, isVip: false, _sig: 'bad' });
t2prev.state.loggedInStudent = junk;
check('IV-16', 'admin preview: hasStudentVipAccess returns true for a pending junk student', () => {
    assert.strictEqual(t2prev.hasStudentVipAccess('k12'), true);
});
check('IV-17', 'admin preview: hasVerifiedPackageAccess returns true independently', () => {
    assert.strictEqual(t2prev.hasVerifiedPackageAccessProbe(junk, 'k12', 'IV-17'), true);
});
check('IV-18', 'admin preview: verifyProtectedVipActionV44 returns true independently', () => {
    assert.strictEqual(t2prev.verifyProtectedVipActionV44('openLesson', 'k12', 'locked_lesson'), true);
});
const t2prevOff = makeEnv({ state: { isAdminLoggedIn: true, adminPreviewUnlockAll: false } });
t2prevOff.state.loggedInStudent = ordinaryUser({ status: 'pending', _sig: 'bad' });
check('IV-19', 'control: same session with preview OFF denies all three gates', () => {
    assert.strictEqual(t2prevOff.hasStudentVipAccess('k12'), false);
    assert.strictEqual(t2prevOff.hasVerifiedPackageAccessProbe(t2prevOff.state.loggedInStudent, 'k12', 'IV-19'), false);
    assert.strictEqual(t2prevOff.verifyProtectedVipActionV44('openLesson', 'k12', 'locked_lesson'), false);
});
check('IV-20', 'admin session signature is reproducible offline; isAdminExamAttempt suppresses audit logging', () => {
    const ts = NOW;
    const sig = t2prevOff.computeAdminSessionSig('synthetic_admin', ts);
    assert.ok(sig.startsWith('adm_'));
    assert.strictEqual(t2prevOff.isAdminExamAttempt(ordinaryUser({ isAdminTester: true })), true);
});

// ---------------------------------------------------------------- TRACK 3: NEW-08/09
console.log('\n-- Track 3: NEW-08/09 — exact sensitive field mapping (synthetic sentinel only) --');
const SENTINEL = 'SYNTHETIC_SENTINEL_PW';
const formCfg = {
    actionUrl: 'https://docs.google.com/forms/d/e/SYNTHETIC_FORM/formResponse',
    entryName: 'entry.111', entryClass: 'entry.222', entryScore: 'entry.333', entryDetail: 'entry.444'
};
const t3 = makeEnv({ state: { googleFormConfig: formCfg, perfConfig: { autoOffloadGForm: true } } });
const t3u = ordinaryUser({ id: 'stu_form_probe', username: 'formprobe', name: 'Form Probe', password: SENTINEL });
check('IV-21', 'logStudentActivity with synthetic password carries detail string into the real Google Form payload', () => {
    const entry = t3.logStudentActivity('LOGIN', 'Dang nhap', 'Bai 1', 'MK: ' + SENTINEL, '---', t3u);
    assert.ok(entry && entry.syncedToGForm);
    const sent = t3.window.__GFORM_SENT_LOG__;
    assert.strictEqual(sent.length, 1);
    assert.ok(sent[0].payload.detail.includes(SENTINEL), 'password sentinel present in detail field');
    assert.strictEqual(sent[0].payload.name, '[formprobe] Form Probe');
    assert.strictEqual(sent[0].payload.classInfo, '12A1 (SBD: 01)');
    assert.strictEqual(sent[0].payload.score, '---', 'scoreStr fallback is the literal ---');
});
check('IV-22', 'Google Form wire pairs are exactly entry.111/222/333/444 plus submit; no real network call made', () => {
    const pairs = t3.__rec.formDispatch[0].pairs;
    assert.strictEqual(pairs.map(p => p[0]).join(','), 'entry.111,entry.222,entry.333,entry.444,submit');
    assert.ok(pairs[3][1].includes(SENTINEL));
    assert.strictEqual(t3.__rec.kv.length, 0, 'no fetch to any endpoint');
});
check('IV-23', 'NEW-08: admin/tester identities suppress the log entirely (no form payload)', () => {
    const before = t3.window.__GFORM_SENT_LOG__.length;
    const suppressed = t3.logStudentActivity('LOGIN', 'x', 'y', 'MK: ' + SENTINEL, '---', ordinaryUser({ isAdminTester: true }));
    assert.strictEqual(suppressed, null);
    assert.strictEqual(t3.window.__GFORM_SENT_LOG__.length, before);
});
const t3s = makeEnv();
const mirKey = 'TRITHUC50_USERS_V436_CLEAN';
t3s.safeStorageSet(mirKey, JSON.stringify([t3u]));
check('IV-24', 'NEW-09: safeStorageSet mirrors the password-bearing user table into localStorage, sessionStorage, window.name and cookie', () => {
    assert.strictEqual(t3s.localStorage.getItem(mirKey).includes(SENTINEL), true);
    assert.strictEqual(t3s.sessionStorage.getItem(mirKey).includes(SENTINEL), true);
    assert.ok(t3s.window.name.startsWith('__TRITHUC_WN__:'));
    assert.ok(t3s.window.name.includes(SENTINEL));
    const c = t3s.__rec.cookie.find(x => x.startsWith(mirKey + '='));
    assert.ok(c, 'cookie written');
    assert.ok(decodeURIComponent(c.split(';')[0].split('=')[1]).includes(SENTINEL));
    assert.ok(c.includes('SameSite=Lax'), 'non-HttpOnly, lax cookie');
});
check('IV-25', 'NEW-09: size thresholds are exact — window.name < 3500 chars, cookie < 1800 chars', () => {
    const e = makeEnv();
    e.safeStorageSet('SMALL_V', 'x'.repeat(100));
    assert.ok(e.window.name.includes('SMALL_V'));
    assert.ok(e.__rec.cookie.some(c => c.startsWith('SMALL_V=')));
    const f = makeEnv();
    f.safeStorageSet('MID_V', 'y'.repeat(2000));
    assert.ok(f.window.name.includes('MID_V'), '2000 chars < 3500 -> still mirrored to window.name');
    assert.ok(!f.__rec.cookie.some(c => c.startsWith('MID_V=')), '2000 chars >= 1800 -> excluded from cookie');
    const g = makeEnv();
    g.safeStorageSet('BIG_V', 'z'.repeat(4000));
    assert.ok(!g.window.name.includes('BIG_V'), '4000 chars >= 3500 -> excluded from window.name');
    assert.ok(!g.__rec.cookie.some(c => c.startsWith('BIG_V=')));
});
check('IV-26', 'no real credential literal is stored in this suite (synthetic sentinel only)', () => {
    const src = fs.readFileSync(__filename, 'utf8');
    const secrets = [
        ['THAY', 'TRUNG2026'].join(''),
        ['TRITHUC50', '_SEC_SALT'].join(''),
        ['THAY_TRUNG', '_MASTER_SEAL_2026'].join('')
    ];
    assert.ok(src.includes('SYNTHETIC_SENTINEL_PW'));
    assert.ok(secrets.every(s => !src.includes(s)), 'suite itself contains no signing secret literal');
});

// ---------------------------------------------------------------- TRACK 4: F-01
console.log('\n-- Track 4: F-01 — tombstone / signature / authorization on V4.5 (synthetic fixtures) --');
const victim = ordinaryUser({ id: 'stu_victim', username: 'victimuser', name: 'Victim User' });
const t4 = makeEnv({ state: { users: [victim] } });
check('IV-27', 'forged admin claim (bad adminSig) is rejected outright and leaves tombstone untouched', () => {
    const pkt = { app: 'TRITHUC50_V436', fromAdmin: true, adminSig: 'asig_forged', ts: NOW, deletedUsernames: ['victimuser'] };
    assert.strictEqual(t4.processIncomingCloudPacket(pkt), false);
    assert.strictEqual(t4.state.deletedUsersMap['victimuser'], undefined);
    assert.strictEqual(t4.state.users.length, 1);
});
check('IV-28', 'validly signed admin tombstone (offline-computed sig) deletes the user locally', () => {
    const pkt = { app: 'TRITHUC50_V436', fromAdmin: true, ts: NOW, deletedUsernames: ['victimuser'] };
    pkt.adminSig = t4.computeCloudPacketAdminSig(pkt);
    assert.ok(pkt.adminSig.startsWith('asig_'));
    assert.strictEqual(t4.processIncomingCloudPacket(pkt), true);
    assert.ok(t4.state.deletedUsersMap['victimuser'] > 0);
    assert.strictEqual(t4.state.users.length, 0);
});
const t4b = makeEnv({ state: { users: [ordinaryUser({ username: 'victimb', id: 'stu_victim_b' })] } });
check('IV-29', 'F-01 RESIDUAL: unsigned tombstone still merges with no admin check', () => {
    const pkt = { app: 'TRITHUC50_V436', ts: NOW, deletedUsernames: ['victimb'] };
    assert.strictEqual(t4b.processIncomingCloudPacket(pkt), true);
    assert.ok(t4b.state.deletedUsersMap['victimb'] > 0);
    assert.strictEqual(t4b.state.users.length, 0);
});
check('IV-30', 'tombstone blocks a later restore packet even when that packet is validly signed', () => {
    const restore = { app: 'TRITHUC50_V436', fromAdmin: true, ts: NOW + 1000, user: compact(ordinaryUser({ username: 'victimb', id: 'stu_victim_b' })) };
    restore.adminSig = t4b.computeCloudPacketAdminSig(restore);
    t4b.processIncomingCloudPacket(restore);
    assert.strictEqual(t4b.state.users.length, 0);
});
const t4c = makeEnv();
check('IV-31', 'unsigned packet with VIP flags is downgraded to pending/non-VIP (V4.5 fix holds)', () => {
    const pkt = { app: 'TRITHUC50_V436', ts: NOW, user: compact(ordinaryUser({ username: 'unsignedvip', id: 'stu_unsigned' })) };
    assert.strictEqual(t4c.processIncomingCloudPacket(pkt), true);
    const u = t4c.state.users[0];
    assert.strictEqual(u.username, 'unsignedvip');
    assert.strictEqual(u.status, 'pending');
    assert.strictEqual(JSON.stringify(u.vipPackages), JSON.stringify({ k12: false, k11: false, k10: false, luyende: false }));
});
const t4d = makeEnv();
check('IV-32', 'validly signed admin packet grants active VIP and mints a seal + integrity sig', () => {
    const pkt = { app: 'TRITHUC50_V436', fromAdmin: true, ts: NOW, user: compact(ordinaryUser({ username: 'signedvip', id: 'stu_signed' })) };
    pkt.adminSig = t4d.computeCloudPacketAdminSig(pkt);
    assert.strictEqual(t4d.processIncomingCloudPacket(pkt), true);
    const u = t4d.state.users[0];
    assert.strictEqual(u.status, 'active');
    assert.strictEqual(u.vipPackages.k12, true);
    assert.ok(u._adminVipSeal && u._adminVipSeal.startsWith('vseal44_'));
    assert.strictEqual(u._sig, t4d.computeUserIntegritySig(u));
});
check('IV-33', 'packet path never writes to ntfy/KV transport in this suite (all mocks local)', () => {
    assert.strictEqual(t4.__rec.kv.length, 0);
    assert.strictEqual(t4c.__rec.kv.length, 0);
});

console.log('\nTOTAL ' + (pass + fail) + ' PASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
