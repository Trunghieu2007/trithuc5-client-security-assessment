// phase4_harness.js — isolated execution environment for TRITHUC5.0 V4.5 (post-patch).
// Extracts REAL V4.5 functions from the freshly fetched public HTML and runs them in a
// Node VM with synthetic storage and mocked cloud backends. No production writes.
//
// Usage: require('./phase4_harness.js')

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const SOURCE = process.env.TRITHUC_SOURCE ||
    path.join(__dirname, '..', '..', '..', '..', 'research', 'trithuc5', 'phase5', 'target.html');
const EXPECTED_SHA = '2dbf781e4febf2e47a78da81352227de30c4972a8f0491e4864bdb32e370f61c';

function readSource() {
    const text = fs.readFileSync(SOURCE, 'utf8');
    const sha = crypto.createHash('sha256').update(text).digest('hex');
    if (sha !== EXPECTED_SHA) {
        throw new Error(`SOURCE CHANGED: expected ${EXPECTED_SHA}, measured ${sha}. Re-measure before using these tests.`);
    }
    return { text, lines: text.split(/\r?\n/), sha };
}

function extractFunction(lines, name) {
    const start = lines.findIndex(l => new RegExp('^\\s*(?:async\\s+)?function\\s+' + name + '\\s*\\(').test(l));
    if (start < 0) throw new Error('function not found: ' + name);
    let depth = 0, seen = false;
    for (let i = start; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === '{') { depth++; seen = true; }
            else if (ch === '}') depth--;
        }
        if (seen && depth === 0) {
            return { code: lines.slice(start, i + 1).join('\n'), start: start + 1, end: i + 1 };
        }
    }
    throw new Error('unbalanced function: ' + name);
}

function extractDeclaration(lines, declaration) {
    const start = lines.findIndex(l => l.includes(declaration));
    if (start < 0) throw new Error('declaration not found: ' + declaration);
    let depth = 0, seen = false;
    for (let i = start; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === '{') { depth++; seen = true; }
            else if (ch === '}') depth--;
        }
        if (seen && depth === 0) {
            return { code: lines.slice(start, i + 1).join('\n'), start: start + 1, end: i + 1 };
        }
    }
    throw new Error('unbalanced declaration: ' + declaration);
}

function extractLineRange(lines, first, last) {
    return { code: lines.slice(first - 1, last).join('\n'), start: first, end: last };
}

function makeMemoryStorage(seed) {
    const m = new Map(seed ? Object.entries(seed) : []);
    return {
        getItem(k) { return m.has(String(k)) ? m.get(String(k)) : null; },
        setItem(k, v) { m.set(String(k), String(v)); },
        removeItem(k) { m.delete(String(k)); },
        has(k) { return m.has(String(k)); },
        get size() { return m.size; },
        entries() { return m.entries(); }
    };
}

function makeState(overrides) {
    return Object.assign({
        deletedUsersMap: {},
        users: [],
        loggedInStudent: null,
        hideAuthorInfo: false,
        isAdminLoggedIn: false,
        adminPreviewUnlockAll: false,
        adminCreds: { username: 'synthetic_admin', password: 'synthetic_password' },
        vaultLockConfig: { isLocked: true, adminPassHash: 'h45_44e3396f901a954c_24f662274f7844f4', unlockedAt: 0 },
        blacklistedDeviceIds: {},
        vipHackAlerts: [],
        activeGrade: '12',
        deviceSecurityPolicy: {
            requireGmail: true,
            defaultMaxDevices: 2,
            autoLockOnThirdDevice: true,
            maxViolationsBeforeLock: 2
        },
        activityLogs: []
    }, overrides || {});
}

// Real V4.5 functions under test.
const FN_NAMES = [
    'hashStringHex',
    'computeUserIntegritySig',
    'computeAdminSessionSig',
    'computeTeacherVipApprovalSealV44', 'isValidTeacherVipSealV522',
    'recordVipHackSecurityAlertV44',
    'detectAndBlockStudentVipHackV44',
    'isStudentVipExpired',
    'verifyRuntimeSecurityIntegrity',
    'computeCloudPacketAdminSig',
    'serializeCompactUser',
    'deserializeCompactUser',
    'isUserDeletedByTombstone',
    'processIncomingCloudPacket',
    'isValidStudentGmail',
    'decryptV97EmbedPayload',
    'sanitizePlainInput', 'requestBackgroundRenderV521', 'isUserTypingInModalOrInputV521', 'hasStudentVipAccess', 'pushSystemUserPacketToVercelApiV521'
];

function createEnv(options) {
    options = options || {};
    const src = readSource();
    const now = options.now === undefined ? 1795000000000 : options.now;
    const localStore = options.localStore || makeMemoryStorage(options.localSeed);
    const calls = { toast: [], logs: [], render: 0, alerts: [], kvWrites: [], kvReads: [] };

    class FakeDate extends Date {
        constructor(...args) { super(...(args.length ? args : [now])); }
        static now() { return now; }
    }

    const sandbox = {
        console, Math, JSON, Uint8Array, TextDecoder, TextEncoder, Array, Object, String, Number,
        Boolean, Set, Map, Promise, RegExp, Error, parseInt, parseFloat, isNaN, encodeURIComponent,
        decodeURIComponent, escape, unescape, isFinite,
        Date: FakeDate,
        setTimeout: () => 0,
        clearTimeout: () => {},
        setInterval: () => 0,
        clearInterval: () => {},
        AbortController: class { constructor() { this.signal = {}; } abort() {} },
        atob: s => Buffer.from(String(s), 'base64').toString('binary'),
        btoa: s => Buffer.from(String(s), 'binary').toString('base64'),
        localStorage: localStore,
        sessionStorage: makeMemoryStorage(),
        navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestHarness', hardwareConcurrency: 4 },
        screen: { width: 1920, height: 1080 },
        fetch: async (url, init) => {
            const u = String(url);
            if (u.includes('UpdateValue')) {
                calls.kvWrites.push({ url: u, body: init && init.body });
                return { ok: true, text: async () => 'OK' };
            }
            if (u.includes('GetValue')) {
                calls.kvReads.push(u);
                const key = u.split('/').pop();
                return { ok: false, text: async () => '' };
            }
            return { ok: false, text: async () => '' };
        },
        state: makeState(options.state),
        showToast: m => calls.toast.push(String(m)),
        renderApp: () => { calls.render++; },
        logStudentActivity: (...a) => calls.logs.push(a),
        getHardwareDeviceProfile: () => ({ deviceId: 'DEV-HARNESS-001', deviceName: 'HarnessDevice' }),
        toBase64UrlSafe: s => Buffer.from(String(s), 'utf8').toString('base64url').replace(/=+$/, ''),
        fromBase64UrlSafe: s => Buffer.from(String(s), 'base64url').toString('utf8'),
        VIP_HACK_ALERTS_KEY_V44: 'TRITHUC50_VIP_HACK_ALERTS_V44',
        safeStorageGet: (k) => {
            try {
                const v = localStore.getItem(k);
                if (v !== null && v !== undefined) return v;
            } catch (e) {}
            return null;
        },
        safeStorageSet: (k, v) => { try { localStore.setItem(k, v); } catch (e) {} },
        safeStorageRemove: (k) => { try { localStore.removeItem(k); } catch (e) {} }
    };
    sandbox.window = { TRITHUC: {}, name: '' };
    sandbox.document = {
        readyState: 'complete', hidden: false, fullscreenElement: null, activeElement: null,
        body: { classList: { add() {}, remove() {}, contains() { return false; } } },
        getElementById: () => null, querySelector: () => null, addEventListener: () => {},
        createElement: () => ({ width: 0, height: 0, getContext: () => null, toDataURL: () => 'data:,', style: {}, classList: { add() {}, remove() {}, contains() { return false; } } })
    };

    vm.createContext(sandbox);

    const pieces = [
        // Storage keys are needed by the cloud packet path.
        extractDeclaration(src.lines, 'const STORAGE_KEYS = {').code,
        'const LEGACY_SAMPLE_BANNED = new Set();',
        // BackendVipAuthServiceV44 is an IIFE assigned to a const — extract as declaration.
        extractDeclaration(src.lines, 'const BackendVipAuthServiceV44 = (function() {').code,
        // V4.5 lesson vault is referenced by isFreeLesson / protected-action gates.
        extractDeclaration(src.lines, 'const LessonVipVaultV44 = (function() {').code,
        ...FN_NAMES.map(n => extractFunction(src.lines, n).code),
        // V4.8.6 keeps the hash functions but empties the admin/vault literals (lines 2030-2055).
        extractLineRange(src.lines, 4679, 4704).code,
        // V4.8.6 lexical constants referenced by safeStorageSet / packet verifier.
        extractLineRange(src.lines, 4878, 4878).code,
        extractLineRange(src.lines, 8818, 8818).code,
        // Real boot-time user normalization block (V4.8.6): lines 3575-3643.
        'const bundledUsers = [];\n' +
        'function bootNormalizeUsersV44() {\n' +
        extractLineRange(src.lines, 6314, 6383).code + '\n}',
        'globalThis.BackendVipAuthServiceV44 = BackendVipAuthServiceV44;',
        'globalThis.LessonVipVaultV44 = LessonVipVaultV44;',
        'globalThis.bootNormalizeUsersV44 = bootNormalizeUsersV44;',
        // Expose the cloud-packet helpers used by NEW-02 / F-01 tests.
        'globalThis.processIncomingCloudPacket = processIncomingCloudPacket;',
        'globalThis.serializeCompactUser = serializeCompactUser;',
        'globalThis.deserializeCompactUser = deserializeCompactUser;',
        'globalThis.computeCloudPacketAdminSig = computeCloudPacketAdminSig;',
        // The tombstone registry is a module-level Set in the shipped source.
        'const deletedUsernamesRegistry = new Set();',
        'globalThis.deletedUsernamesRegistry = deletedUsernamesRegistry;'
    ];
    vm.runInContext(pieces.join('\n'), sandbox, { filename: 'extracted-trithuc5-v44.js' });
    return Object.assign(sandbox, { __meta: { sha: src.sha, source: SOURCE, now, calls } });
}

// A synthetic, fully-valid-looking student account (no PoC keywords, sane fields).
function syntheticStudent(overrides) {
    return Object.assign({
        id: 'stu_synthetic_v44_1',
        username: 'nguyenvana',
        password: 'SYNTHETIC_ONLY',
        name: 'Nguyen Van A',
        class: '12A1',
        stt: '01',
        gmail: 'nguyenvana@example.edu.vn',
        phone: '',
        status: 'active',
        vipPackages: { k12: false, k11: false, k10: false, luyende: false },
        vipPlan: 'none',
        vipExpiresAt: null,
        vipExpiredAt: null,
        isVip: false,
        maxDevices: 2,
        trustedDevices: [],
        registeredAt: '01/01/2026',
        updatedAt: 1794000000000,
        createdInV436: true
    }, overrides || {});
}

module.exports = {
    readSource, extractFunction, extractDeclaration, extractLineRange,
    createEnv, makeMemoryStorage, makeState, syntheticStudent,
    SOURCE, EXPECTED_SHA
};
