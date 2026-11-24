// poc_suite_validation.js — runs every shipped PoC file in a mock browser
// environment and asserts the documented behaviour. Real V4.5 functions are
// used where the PoC depends on them.
//
// Usage: node poc_suite_validation.js

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const h = require('./phase4_harness.js');
const PINNED_SOURCE = h.readSource().text;
const NODE_BUFFER = Buffer;

const POC_DIR = path.join(__dirname, '..', 'poc');
const NOW = 1795000000000;

let pass = 0, fail = 0;
const failures = [];
function check(label, cond, extra) {
    if (cond) { pass++; console.log(`PASS ${label}`); }
    else { fail++; failures.push(label + (extra ? ' :: ' + extra : '')); console.log(`FAIL ${label}${extra ? ' :: ' + extra : ''}`); }
}

// Build a mock browser env that the PoCs can run against.
function makeEnv(seedUsers, seedLogin) {
    const store = new Map();
    if (seedUsers) store.set('TRITHUC50_USERS_V436_CLEAN', seedUsers);
    if (seedLogin) store.set('TRITHUC50_LOGGED_STUDENT_V436', seedLogin);

    const localStorage = {
        getItem: k => (store.has(String(k)) ? store.get(String(k)) : null),
        setItem: (k, v) => store.set(String(k), String(v)),
        removeItem: k => store.delete(String(k)),
        get length() { return store.size; },
        key: i => Array.from(store.keys())[i]
    };
    const sessionStorage = {
        getItem: () => null, setItem: () => {}, removeItem: () => {}, get length() { return 0; }, key: () => null
    };

    const listeners = {};
    const docBody = { innerText: 'Trọn đời Vĩnh viễn' };

    const document = {
        readyState: 'complete', hidden: false, fullscreenElement: null, activeElement: null,
        body: { classList: { add() {}, remove() {}, contains() { return false; } }, innerText: docBody.innerText },
        cookie: '',
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: (sel) => String(sel).includes('script') ? [{ textContent: PINNED_SOURCE }] : [],
        addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
        createElement: () => ({ width: 0, height: 0, getContext: () => null, toDataURL: () => 'data:,', style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, appendChild() {} })
    };

    const calls = { toast: [], fetch: [], rendered: 0, packets: [] , broadcast: [] };

    // Mock of the shipped cloud bus: applyIncomingPacket persists the packet's
    // users into the local store and returns true; exportSnapshotPacket returns
    // the current local store in compact form.
    const bus = {
        applyIncomingPacket(packetObj) {
            calls.packets.push(packetObj);
            if (!packetObj || !String(packetObj.app || '').startsWith('TRITHUC50_V4')) return false;
            const list = Array.isArray(packetObj.users) ? packetObj.users : [];
            const current = (() => { try { return JSON.parse(store.get('TRITHUC50_USERS_V436_CLEAN') || '[]'); } catch (e) { return []; } })();
            list.forEach(cu => {
                if (!cu || !cu.u) return;
                const u = {
                    id: cu.id, username: cu.u, password: cu.p || '123', name: cu.n || ('HS ' + cu.u),
                    class: cu.c || '12A1', stt: cu.s || '01', gmail: cu.g || '', phone: cu.ph || '',
                    status: cu.st || 'active',
                    vipPackages: { k12: !!cu.vp?.[0], k11: !!cu.vp?.[1], k10: !!cu.vp?.[2], luyende: !!cu.vp?.[3] },
                    vipPlan: cu.pl || 'none', vipExpiresAt: cu.exp || null,
                    maxDevices: Number(cu.maxD || 2), trustedDevices: Array.isArray(cu.devs) ? cu.devs : [],
                    _adminVipSeal: cu.seal || '', _backendVipToken: cu.bkt || '', createdInV436: true
                };
                current.unshift(u);
            });
            store.set('TRITHUC50_USERS_V436_CLEAN', JSON.stringify(current));
            return true;
        },
        exportSnapshotPacket() {
            const current = (() => { try { return JSON.parse(store.get('TRITHUC50_USERS_V436_CLEAN') || '[]'); } catch (e) { return []; } })();
            return {
                app: 'TRITHUC50_V436', type: 'CLOUD_STATE_SYNC', ts: NOW,
                users: current.map(u => ({ u: u.username, st: u.status }))
            };
        }
    };

    const sandbox = {
        console, Math, JSON, Date: { now: () => NOW }, localStorage, sessionStorage, document,
        navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0) TestHarness', hardwareConcurrency: 4 },
        screen: { width: 1920, height: 1080 },
        location: { href: 'https://trithuc500.vercel.app/', search: '', hash: '' },
        atob: s => Buffer.from(String(s), 'base64').toString('binary'),
        btoa: s => Buffer.from(String(s), 'binary').toString('base64'),
        TextDecoder, TextEncoder, Uint8Array, ArrayBuffer,
        setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; },
        clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
        fetch: async (url, init) => { calls.fetch.push({ url: String(url), init }); return { ok: false, status: 0, text: async () => '' }; },
        Intl,
        __calls: calls
    };
    sandbox.BroadcastChannel = class {
        constructor(name) { this.name = name; }
        postMessage(packet) {
            try {
                calls.broadcast.push({ name: this.name, packet });
                if (bus && typeof bus.applyIncomingPacket === 'function') bus.applyIncomingPacket(packet);
            } catch (e) {}
        }
        close() {}
    };
    sandbox.window = sandbox;
    sandbox.window.name = '';
    sandbox.__TRITHUC50_CLOUD_BUS__ = bus;
    sandbox.globalThis = sandbox;
    // Node-side gzip helper for the F-04 DISPLAY PoC (browser path stays untouched).
    sandbox.Buffer = NODE_BUFFER;
    sandbox.TRITHUC = {
        loginAdmin: async () => true,
        logoutAdmin: () => true,
        openAdminPortal: () => 'admin',
        switchAdminTab: tab => tab,
        approveStudentWithVip: u => ({ ok: true, user: u }),
        grantVipAllActiveStudents: () => 3,
        deleteStudentAccount: u => ({ deleted: u }),
        setAdminUserStatusFilter: f => f,
        setAdminGradeFilter: g => g
    };
    sandbox.__AERO_GUNZIP__ = (parts) => {
        const zlib = require('zlib');
        const buf = Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));
        return zlib.gunzipSync(buf).toString('utf8');
    };
    // Node polyfills for browser gzip APIs used by the F-04 DISPLAY PoC.
    if (typeof sandbox.Blob === 'undefined') {
        const zlib = require('zlib');
        sandbox.DecompressionStream = class {
            constructor(format) { this.format = format; }
        };
        sandbox.Blob = class {
            constructor(parts) { this.parts = parts || []; }
            stream() {
                const zlib = require('zlib');
                const buf = Buffer.concat(this.parts.map(p => Buffer.from(p)));
                const out = zlib.gunzipSync(buf);
                const { ReadableStream } = require('stream/web');
                return new ReadableStream({ start(c) { c.enqueue(new Uint8Array(out)); c.close(); } });
            }
        };
        sandbox.Response = class {
            constructor(body) { this.body = body; }
            async text() {
                const chunks = [];
                const reader = this.body.getReader();
                for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(Buffer.from(value)); }
                return Buffer.concat(chunks).toString('utf8');
            }
        };
    }
    vm.createContext(sandbox);
    return { sandbox, store, calls };
}

async function runPoc(file, seed) {
    const env = makeEnv(seed?.users, seed?.login);
    const src = fs.readFileSync(path.join(POC_DIR, file), 'utf8');
    let result;
    let error = null;
    try {
        result = vm.runInContext(src, env.sandbox, { filename: file });
        // Async PoCs return a Promise; surface rejections as errors.
        if (result && typeof result.then === 'function') {
            try { result = await result; } catch (e) { error = e; }
        }
    } catch (e) {
        error = e;
    }
    return { result, error, env };
}

async function main() {
// ---------------------------------------------------------------------------
// 1. F-03 VIP entitlement — the flagship bypass.
// ---------------------------------------------------------------------------
{
    const { result, error, env } = await runPoc('poc_f03_vip_entitlement.js');
    check('F-03 payload executes without error', !error, error && error.message);
    if (!error) {
        check('F-03 payload reports a synthetic username', !!result?.username);
        const stored = JSON.parse(env.store.get('TRITHUC50_USERS_V436_CLEAN') || '[]');
        const me = stored.find(u => u.username === result.username);
        check('F-03 payload persisted the synthetic account', !!me);
        check('F-03 account has all four VIP packages',
            me && ['k12', 'k11', 'k10', 'luyende'].every(k => me.vipPackages[k] === true));
        check('F-03 account carries a forged _sig', /^v27_[0-9a-f]{16}$/.test(me?._sig || ''), me?._sig);
        check('F-03 account carries a forged seal', /^vseal44_[0-9A-F]{8}$/.test(me?._adminVipSeal || ''), me?._adminVipSeal);
        check('F-03 account maxDevices is within 1..3', me && me.maxDevices >= 1 && me.maxDevices <= 3);
        check('F-03 account avoids the keyword blocklist',
            !/(poc_vip|nologin|hack|exploit|bypass|cheat)/i.test(`${me?.username} ${me?.name} ${me?.gmail}`));
        check('F-03 account id is not one of the exempt ids',
            !['gv_test', 'stu_free_12b1', 'stu_practice_e'].includes(me?.id));
        check('F-03 payload wrote a login marker', !!env.store.get('TRITHUC50_LOGGED_STUDENT_V436'));
        check('F-03 payload did NOT publish to ntfy/KV',
            env.calls.fetch.length === 0, JSON.stringify(env.calls.fetch));
    }
}

// ---------------------------------------------------------------------------
// 1b. NEW-11 — canonical seal literal is client-derivable (DISPLAY).
// ---------------------------------------------------------------------------
{
    const { result, error, env } = await runPoc('poc_new11_seal_forgery.js');
    check('NEW-11 payload executes without error', !error, error && error.message);
    if (!error) {
        check('NEW-11 is classified DISPLAY', result?.type === 'DISPLAY');
        check('NEW-11 reports LOCAL_CONFIRMED', result?.status === 'LOCAL_CONFIRMED', result?.status);
        check('NEW-11 finds the canonical literal in bundle', result?.sourceContainsCanonicalLiteral === true);
        check('NEW-11 finds the seal validator in bundle', result?.sourceContainsValidator === true);
        check('NEW-11 recomputed a canonical seal', /^vseal44_[0-9A-F]{8}$/.test(result?.syntheticSeal || ''), result?.syntheticSeal);
        check('NEW-11 wrote no state', env.store.size === 0, String(env.store.size));
        check('NEW-11 made no network call', env.calls.fetch.length === 0);
    }
}

// ---------------------------------------------------------------------------
// 2. F-02 admin auth — now DISPLAY verification of the V4.8.5 fix.
// ---------------------------------------------------------------------------
{
    const { result, error, env } = await runPoc('poc_f02_admin_login.js');
    check('F-02 payload executes without error', !error, error && error.message);
    if (!error) {
        check('F-02 is classified DISPLAY', result?.type === 'DISPLAY');
        check('F-02 reports FIXED-V4.8.5', result?.status === 'FIXED-V4.8.5');
        check('F-02 wrote no remembered admin session',
            !env.store.get('TRITHUC50_REMEMBER_ADMIN_SESSION_V26'));
        check('F-02 sent no POST', env.calls.fetch.every(c => (c.init && c.init.method || 'GET') !== 'POST'));
        const src = h.readSource().text;
        check('F-02 source has server login API', src.includes("fetch('/api/admin/login', {"));
        check('F-02 source no longer has admin password hash', /const DEFAULT_ADMIN_PASS_HASH_V45 = '';/.test(src));
        check('F-02 source uses ephemeral admin salt',
            src.includes('__TT50_EPH_ADM_SALT_V485__') && !src.includes('TRITHUC50_ADM_SALT_V27'));
    }
}

// ---------------------------------------------------------------------------
// 3. NEW-15 admin preview — now DISPLAY verification of the V4.8.5 fix.
// ---------------------------------------------------------------------------
{
    const { result, error, env } = await runPoc('poc_new15_admin_preview.js');
    check('NEW-15 payload executes without error', !error, error && error.message);
    if (!error) {
        check('NEW-15 is classified DISPLAY', result?.type === 'DISPLAY');
        check('NEW-15 reports FIXED-V4.8.5', result?.status === 'FIXED-V4.8.5');
        check('NEW-15 sent no POST', env.calls.fetch.every(c => (c.init && c.init.method || 'GET') !== 'POST'));
        check('NEW-15 wrote no admin session',
            !env.store.get('TRITHUC50_REMEMBER_ADMIN_SESSION_V26'));
    }
}

// ---------------------------------------------------------------------------
// 3b. NEW-17 results API — read-only GET, metadata only.
// ---------------------------------------------------------------------------
{
    const { result, error, env } = await runPoc('poc_new17_results_api.js');
    check('NEW-17 payload executes without error', !error, error && error.message);
    if (!error) {
        check('NEW-17 is classified DISPLAY', result?.type === 'DISPLAY');
        check('NEW-17 reports the results endpoint', result?.finding === 'NEW-17');
        check('NEW-17 uses GET only', env.calls.fetch.every(c => (c.init && c.init.method || 'GET') === 'GET'));
        check('NEW-17 sent no POST/write', env.calls.fetch.every(c => (c.init && c.init.method || 'GET') !== 'POST'));
    }
}

// ---------------------------------------------------------------------------
// 4. NEW-02 packet injection.
// ---------------------------------------------------------------------------
{
    const { result, error, env } = await runPoc('poc_new02_packet_injection.js');
    check('NEW-02 payload executes without error', !error, error && error.message);
    if (!error) {
        check('NEW-02 reports the tombstone merge result',
            result && typeof result.tombstoneAcceptedWithoutAdminSig === 'boolean');
        check('NEW-02 payload did NOT publish automatically', env.calls.fetch.length === 0);
    }
}

// ---------------------------------------------------------------------------
// 5. Display-only PoCs must not write state or transmit.
// ---------------------------------------------------------------------------
for (const f of ['poc_f04_exam_answers.js', 'poc_f01_student_data.js',
                 'poc_new08_new09_leakage.js', 'poc_new05_new07_new10_misc.js']) {
    const seed = {
        users: JSON.stringify([{
            id: 'stu_a', username: 'nguyena', password: 'SYNTHETIC', name: 'Nguyen A',
            class: '12A1', gmail: 'a@example.edu.vn', status: 'active',
            vipPackages: { k12: true, k11: true, k10: true, luyende: true }, vipPlan: 'lifetime',
            maxDevices: 2, trustedDevices: [], createdInV436: true
        }]),
        login: JSON.stringify({ username: 'nguyena' })
    };
    const { result, error, env } = await runPoc(f, seed);
    check(`${f} executes without error`, !error, error && error.message);
    check(`${f} performs no network write`,
        env.calls.fetch.every(c => !c.init || !/POST/i.test(String(c.init.method || 'GET'))),
        JSON.stringify(env.calls.fetch.map(c => c.init?.method || 'GET')));
    if (f === 'poc_new05_new07_new10_misc.js') {
        check(`${f} reports NEW-05 key presence`, typeof result?.new05?.keyPresent === 'boolean');
        check(`${f} reports NEW-10 privileged count`, typeof result?.new10?.privilegedRecords === 'number');
    }
    if (f === 'poc_f01_student_data.js') {
        check(`${f} reports the cloud verdicts`, !!result?.verdicts);
    }
    if (f === 'poc_f04_exam_answers.js') {
        check('F-04 PoC is DISPLAY', result?.type === 'DISPLAY');
        check('F-04 PoC reports FIXED-V5.4.6', result?.status === 'FIXED-V5.4.6', result?.status);
        check('F-04 PoC counts 191 exam shells', result?.exams === 191, String(result?.exams));
        check('F-04 PoC finds zero bundled answers', result?.answers === 0, String(result?.answers));
        check('F-04 PoC finds zero bundled questions', result?.questions === 0, String(result?.questions));
        check('F-04 PoC detects server fetch + submit', result?.hasServerFetch === true && result?.hasServerSubmit === true);
        check('F-04 PoC prints no answer values', !JSON.stringify(result).includes('correctAnswers'));
    }
    if (f === 'poc_new08_new09_leakage.js') {
        check('NEW-08 PoC reports FIXED-V5.4.6', String(result?.new08?.verdict || '').includes('FIXED-V5.4.6'), result?.new08?.verdict);
        check('NEW-08 PoC sees disabled dispatch', result?.new08?.gformDispatchDisabled === true);
        check('NEW-08 PoC sees no synced log entries', result?.new08?.logEntriesMarkedSynced === 0, String(result?.new08?.logEntriesMarkedSynced));
    }
}

// ---------------------------------------------------------------------------
// 6. F-05 device lock and F-06 anti-cheat are display-first.
// ---------------------------------------------------------------------------
{
    const seed = {
        users: JSON.stringify([{
            id: 'stu_a', username: 'nguyena', password: 'SYNTHETIC', name: 'Nguyen A',
            class: '12A1', gmail: 'a@example.edu.vn', status: 'locked',
            vipPackages: { k12: false, k11: false, k10: false, luyende: false }, vipPlan: 'none',
            maxDevices: 2, trustedDevices: [], deviceShareViolations: 3,
            blockedDevicesLog: [], lockReason: 'auto lock', createdInV436: true
        }]),
        login: JSON.stringify({ username: 'nguyena' })
    };
    const { result, error, env } = await runPoc('poc_f05_device_lock.js', seed);
    check('F-05 payload executes without error', !error, error && error.message);
    if (!error) {
        check('F-05 defaults to display only', result?.verdict === 'display only — no change applied', result?.verdict);
        const after = JSON.parse(env.store.get('TRITHUC50_USERS_V436_CLEAN') || '[]')[0];
        check('F-05 made no change in display mode', after.status === 'locked' && after.maxDevices === 2);
    }
}
{
    const { result, error, env } = await runPoc('poc_f06_anticheat.js');
    check('F-06 payload executes without error', !error, error && error.message);
    const f06 = env.sandbox.__AERO_F06_RESULT__ || result;
    check('F-06 reports the console variant', f06?.variant === 'console', JSON.stringify(f06?.variant));
    check('F-06 states the residual risk', typeof f06?.residual === 'string');
}

// ---------------------------------------------------------------------------
// 6b. Admin offline logger — ACTION with full restore.
// ---------------------------------------------------------------------------
{
    const { result, error, env } = await runPoc('poc_admin_offline_log.js');
    check('admin logger payload executes without error', !error, error && error.message);
    if (!error) {
        check('admin logger is ACTION', result?.type === 'ACTION');
        check('admin logger reports ACTIVE', result?.status === 'ACTIVE', result?.status);
        check('admin logger hooked at least 5 methods', (result?.hooked || 0) >= 5, String(result?.hooked));
        const installRows = JSON.parse(env.store.get('__AERO_ADMIN_OFFLINE_LOG__') || '[]');
        check('admin logger wrote an install record', installRows.some(r => r.kind === 'install'));
        check('admin logger mock flag set', env.store.get('__AERO_ADMIN_LOG_MOCK__') === '1');
        check('admin logger replaced fetch', typeof env.sandbox.fetch === 'function');
        // Invoke two hooked methods and confirm the log captured them.
        const api = env.sandbox.TRITHUC;
        check('admin logger preserves API return value', api.switchAdminTab('users') === 'users');
        const vip = await api.approveStudentWithVip('synthetic_user');
        check('admin logger preserves async return value', vip && vip.ok === true);
        const rows = JSON.parse(env.store.get('__AERO_ADMIN_OFFLINE_LOG__') || '[]');
        check('admin logger recorded method calls', rows.some(r => r.kind === 'call' && r.method === 'switchAdminTab'));
        check('admin logger recorded results', rows.some(r => r.kind === 'result' && r.method === 'approveStudentWithVip'));
        check('admin logger never sent a network request', env.calls.fetch.length === 0,
            JSON.stringify(env.calls.fetch.map(c => c.url)));
        const restored = env.sandbox.__AERO_ADMIN_LOG_RESTORE__();
        check('admin logger restore reports count', restored && restored.restored >= 5);
        check('admin logger cleared mock flag', !env.store.get('__AERO_ADMIN_LOG_MOCK__'));
        check('admin logger retained the local log', JSON.parse(env.store.get('__AERO_ADMIN_OFFLINE_LOG__') || '[]').length > 0);
    }
}

// ---------------------------------------------------------------------------
// 7. Syntax check every file in poc/.
// ---------------------------------------------------------------------------
const pocFiles = fs.readdirSync(POC_DIR).filter(f => f.endsWith('.js'));
for (const f of pocFiles) {
    const src = fs.readFileSync(path.join(POC_DIR, f), 'utf8');
    let ok = true, msg = '';
    try { new vm.Script(src, { filename: f }); } catch (e) { ok = false; msg = e.message; }
    check(`syntax ${f}`, ok, msg);
}

console.log(`\nTOTAL ${pass + fail} PASS ${pass} FAIL ${fail}`);
if (failures.length) { console.log('failures:'); failures.forEach(f => console.log(' - ' + f)); }
process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('validator crashed:', e); process.exit(1); });
