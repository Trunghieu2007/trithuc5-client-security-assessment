// harness.js — isolated execution environment for TRITHUC5.0 V4.5 client code.
// Extracts REAL functions from the downloaded public HTML and runs them in a Node VM
// with synthetic storage, mock ntfy/KV, and no network access to production.
// Usage: require('./harness.js') from any test in this directory.

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const SOURCE = process.env.TRITHUC_SOURCE || path.join(
    __dirname, '..', '..', '..', '..', 'research', 'trithuc5', 'phase5', 'target.html');
const EXPECTED_SHA = 'ffe94aea9b327853b0b8836bf0d52e1f509fcc68c007bead7b8a888604389185';

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
        adminCreds: { username: 'synthetic_admin', password: 'synthetic_password' },
        vaultLockConfig: { isLocked: true, adminPassHash: 'h45_44e3396f901a954c_24f662274f7844f4' },
        savedAdminCreds: { username: '', password: '', remember: false },
        adminRememberMe: false,
        adminLoginLockUntil: 0,
        adminLoginFailedAttempts: 0,
        view: 'studentHome',
        isReviewMode: false,
        currentDeviceProfile: null,
        simulatedDeviceSlot: 'real',
        deviceSecurityPolicy: {
            requireGmail: true,
            defaultMaxDevices: 2,
            autoLockOnThirdDevice: true,
            maxViolationsBeforeLock: 2
        },
        cloudSyncStatus: '',
        lastCloudSyncTs: 0,
        selectedExam: null,
        ans: { p1: {}, p2: {}, p3: {} },
        activityLogs: []
    }, overrides || {});
}

const FN_NAMES = [
    'readWindowNameStore', 'writeWindowNameStore', 'safeStorageGet', 'safeStorageSet', 'safeStorageRemove',
    'hashStringHex', 'sanitizePlainInput', 'toBase64UrlSafe', 'fromBase64UrlSafe',
    'computeCloudPacketAdminSig', 'computeUserIntegritySig', 'computeAdminSessionSig',
    'computeTeacherVipApprovalSealV44', 'detectAndBlockStudentVipHackV44',
    'recordVipHackSecurityAlertV44',
    'verifyRuntimeSecurityIntegrity', 'isStudentVipExpired',
    'serializeCompactUser', 'deserializeCompactUser', 'isUserDeletedByTombstone',
    'processIncomingCloudPacket', 'decodeCloudMessageString', 'buildTeacherSnapshotPacket',
    'pushCloudSyncPacket', 'pullCloudSyncMessages',
    'getCanvasAndWebGLHardwareSig', 'getHardwareDeviceProfile', 'isValidStudentGmail',
    'buildCompactCustomMockSpecs',
    'verifyAndBindStudentDeviceOnLogin', 'decryptV97EmbedPayload',
    'saveUsersState', 'broadcastTeacherUsersToCloud'
];

function createEnv(options) {
    options = options || {};
    const src = readSource();
    const now = options.now === undefined ? 1795000000000 : options.now;
    const localStore = options.localStore || makeMemoryStorage(options.localSeed);
    const sessionStore = makeMemoryStorage();
    const bus = options.bus || { messages: [], sse: [], kv: new Map() };
    const calls = { render: 0, toast: [], logs: [], drafts: 0, submissions: 0, cloudPushes: 0, deviceEvents: [] };

    class FakeDate extends Date {
        constructor(...args) { super(...(args.length ? args : [now])); }
        static now() { return now; }
    }

    const sandbox = {
        console, Math, JSON, Uint8Array, TextDecoder, TextEncoder, Array, Object, String, Number,
        Boolean, Set, Map, Promise, RegExp, Error, parseInt, parseFloat, isNaN, encodeURIComponent,
        decodeURIComponent, escape, unescape,
        Date: FakeDate,
        setTimeout: () => 0,
        clearTimeout: () => {},
        setInterval: () => 0,
        clearInterval: () => {},
        AbortController: class { constructor() { this.signal = {}; } abort() {} },
        BroadcastChannel: class {
            postMessage(pkt) { bus.messages.push(JSON.parse(JSON.stringify(pkt))); }
        },
        atob: s => Buffer.from(String(s), 'base64').toString('binary'),
        btoa: s => Buffer.from(String(s), 'binary').toString('base64'),
        localStorage: localStore,
        sessionStorage: sessionStore,
        __MEMORY_STORE__: {},
        navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestHarness', hardwareConcurrency: 4 },
        screen: { width: 1920, height: 1080 },
        fetch: options.fetchImpl || (async (url, init) => {
            calls.cloudPushes++;
            const u = String(url);
            if (u.includes('/json?poll=1')) {
                return { ok: true, text: async () => bus.sse.map(m => JSON.stringify({ message: m })).join('\n') };
            }
            if (u.includes('GetValue')) {
                const key = u.split('/').pop();
                const val = bus.kv.get(key);
                return { ok: val !== undefined, text: async () => val === undefined ? '' : String(val) };
            }
            if (u.includes('UpdateValue')) {
                const parts = u.split('/');
                bus.kv.set(parts.pop(), String((init && init.body) || ''));
                return { ok: true, text: async () => 'OK' };
            }
            return { ok: false, text: async () => '' };
        }),
        state: makeState(options.state),
        deletedUsernamesRegistry: new Set(),
        lastCloudPullMs: 0,
        cloudSseSource: null,
        broadcastChan: null,
        showToast: m => calls.toast.push(String(m)),
        renderApp: () => { calls.render++; },
        logStudentActivity: (...a) => calls.logs.push(a),
        saveDraftAnswers: () => { calls.drafts++; },
        finalizeExamSubmission: () => { calls.submissions++; },
        saveUsersState: () => { calls.render++; },
        syncDeviceSecurityEventToGoogleForm: (...a) => calls.deviceEvents.push(a),
        triggerExamViolation: reason => calls.toast.push('VIOLATION:' + reason),
        internalActionGuardUntil: 0,
        antiAiInterval: null,
        LEGACY_SAMPLE_BANNED: new Set()
    };
    const windowListeners = {};
    sandbox.window = {
        name: options.windowName || '',
        TRITHUC: {},
        addEventListener(type, fn) {
            if (!windowListeners[type]) windowListeners[type] = [];
            windowListeners[type].push(fn);
        },
        removeEventListener() {},
        getComputedStyle: () => ({ display: 'flex', visibility: 'visible', opacity: '1' })
    };
    sandbox.__windowListeners = windowListeners;
    sandbox.__dispatchWindowEvent = (type, ev) => {
        (windowListeners[type] || []).forEach(fn => fn(ev));
    };
    const cookieJar = {};
    const documentStub = {
        readyState: 'complete',
        hidden: false,
        fullscreenElement: null,
        activeElement: null,
        body: { classList: { add() {}, remove() {}, contains() { return false; } } },
        getElementById: () => null,
        querySelector: () => null,
        addEventListener: () => {},
        createElement: () => ({
            width: 0, height: 0,
            getContext: () => null,
            toDataURL: () => 'data:,',
            style: {}, classList: { add() {}, remove() {}, contains() { return false; } }
        })
    };
    Object.defineProperty(documentStub, 'cookie', {
        get() { return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; '); },
        set(raw) {
            const s = String(raw);
            const pair = s.split(';')[0];
            const i = pair.indexOf('=');
            if (i < 0) return;
            const key = pair.slice(0, i).trim();
            if (/max-age=0/i.test(s)) delete cookieJar[key];
            else cookieJar[key] = pair.slice(i + 1);
        }
    });
    sandbox.document = documentStub;

    vm.createContext(sandbox);

    const pieces = [
        extractDeclaration(src.lines, 'const STORAGE_KEYS = {').code,
        extractDeclaration(src.lines, 'const setupCrossTabUserSync =').code,
        extractFunction(src.lines, 'getCanvasAndWebGLHardwareSig').code,
        // Cloud sync constants (V4.8.6: lines 4295-4299) are lexical, not functions.
        extractLineRange(src.lines, 4295, 4299).code,
        // V4.6.3 closure-vault variables referenced by buildCompactCustomMockSpecs (line 1993-2005 — unchanged in V4.8.0).
        extractLineRange(src.lines, 1993, 2005).code,
        // V4.8.6 keeps the hash functions but empties the admin/vault literals (lines 2030-2055).
        extractLineRange(src.lines, 2030, 2055).code,
        // V4.8.6 lexical constants referenced by safeStorageSet / packet verifier.
        extractLineRange(src.lines, 2228, 2228).code,
        extractLineRange(src.lines, 5768, 5768).code,
        ...FN_NAMES.map(n => extractFunction(src.lines, n).code),
        // Admin session restore block exactly as shipped (V4.8.6: lines 3740-3752).
        'function checkRememberedAdminSessionFromSource() {\n' + extractLineRange(src.lines, 3740, 3752).code + '\n}',
        // Expose lexical constants/functions as context properties for assertions.
        'globalThis.STORAGE_KEYS = STORAGE_KEYS;',
        'globalThis.CLOUD_SYNC_TOPIC = CLOUD_SYNC_TOPIC;',
        'globalThis.CLOUD_KV_APP_KEY = CLOUD_KV_APP_KEY;',
        'globalThis.DEFAULT_VAULT_PASS_HASH_V45 = DEFAULT_VAULT_PASS_HASH_V45;',
        'globalThis.DEFAULT_ADMIN_USER_HASHES_V45 = DEFAULT_ADMIN_USER_HASHES_V45;',
        'globalThis.DEFAULT_ADMIN_PASS_HASH_V45 = DEFAULT_ADMIN_PASS_HASH_V45;',
        'globalThis.setupCrossTabUserSync = setupCrossTabUserSync;',
        extractDeclaration(src.lines, 'const BackendVipAuthServiceV44 = (function() {').code,
        'globalThis.BackendVipAuthServiceV44 = BackendVipAuthServiceV44;',
        // V4.5 lesson vault is referenced by buildTeacherSnapshotPacket and isFreeLesson.
        extractDeclaration(src.lines, 'const LessonVipVaultV44 = (function() {').code,
        'globalThis.LessonVipVaultV44 = LessonVipVaultV44;',
        // Expose a wrapped tombstone deletion request path without calling network code.
        'function forceAdminFlagFromSource() { state.isAdminLoggedIn = true; }'
    ];
    vm.runInContext(pieces.join('\n'), sandbox, { filename: 'extracted-trithuc5-client.js' });
    sandbox.broadcastChan = new sandbox.BroadcastChannel();
    return Object.assign(sandbox, { __meta: { sha: src.sha, source: SOURCE, now, calls, bus } });
}

function compactUser(overrides) {
    return Object.assign({
        id: 'stu_synthetic_1',
        username: 'synthetic_student',
        password: 'synthetic_password',
        name: 'Synthetic Student',
        class: '12A1',
        stt: '01',
        gmail: 'synthetic@example.edu.vn',
        phone: '',
        status: 'active',
        vipPackages: { k12: false, k11: false, k10: false, luyende: false },
        requestedPackages: { k12: true, k11: false, k10: false, luyende: false },
        vipPlan: 'none',
        requestedPlan: '1y',
        vipExpiresAt: null,
        vipRequestPending: false,
        isNewRegistration: false,
        maxDevices: 2,
        trustedDevices: [],
        registeredAt: '01/01/2026',
        updatedAt: 1794000000000,
        createdInV436: true
    }, overrides || {});
}

module.exports = { readSource, extractFunction, extractDeclaration, extractLineRange, createEnv, makeMemoryStorage, makeState, compactUser, SOURCE, EXPECTED_SHA };
