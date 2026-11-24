// poc_admin_offline_log.js — LOCAL admin action logger (ACTION, offline only)
//
// Target:  https://trithuc500.vercel.app/
// Purpose: instrument the teacher/admin UI locally so every admin action can be
//          reviewed offline. It does NOT authenticate with the real server, does
//          NOT publish to ntfy.sh / keyvalue.immanuel.co / Google Forms, and does
//          NOT submit any real exam or modify a real account.
//
// Type:    ACTION. Installs a local mock + method hooks. All state is in THIS
//          browser's localStorage and is restored by the supplied function.
//
// Usage:  paste into DevTools Console on the target page.
// Output: number of hooked methods and a local log key.
// Audit:  window.__AERO_ADMIN_LOG_DUMP__()
// Restore: window.__AERO_ADMIN_LOG_RESTORE__(); then F5.
//
// The mock admin login returns a synthetic success response; it is NOT a
// server-side login and grants no real authority.

(() => {
    'use strict';

    const LOG_KEY = '__AERO_ADMIN_OFFLINE_LOG__';
    const MOCK_KEY = '__AERO_ADMIN_LOG_MOCK__';
    const BACKUP_KEY = '__AERO_ADMIN_LOG_BACKUP__';

    if (localStorage.getItem(MOCK_KEY) === '1') {
        return {
            type: 'ACTION',
            status: 'ALREADY_ACTIVE',
            logKey: LOG_KEY,
            note: 'Restore first with __AERO_ADMIN_LOG_RESTORE__()'
        };
    }

    const api = window.TRITHUC || (window.TRITHUC = {});
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    const origGetById = document.getElementById ? document.getElementById.bind(document) : null;

    // Admin-relevant methods present in the V5.4.6 public API. Hooking is
    // best-effort: missing methods are skipped, not invented.
    const METHOD_NAMES = [
        'loginAdmin', 'logoutAdmin', 'openAdminPortal', 'switchAdminTab',
        'approveStudentWithVip', 'grantVipAllActiveStudents', 'deleteStudentAccount',
        'quickDeleteAllPendingUsers', 'quickDeleteSelectedUsers', 'quickDeleteFilteredUsers',
        'adminSetStudentMaxDevices', 'adminResetStudentDevices', 'adminClearDeviceViolations',
        'adminApproveDeviceResetRequest', 'adminSaveStudentGmail', 'adminRemoveSingleDevice',
        'saveCreatedExam', 'deleteExamById', 'publishBatchExamsToSystemV50',
        'publishMatrixExamToSystemV44', 'saveEditedLesson', 'changeVaultAdminPasswordInlineV44',
        'changeVaultAdminPasswordModalV44', 'saveGFormSettings', 'saveGitHubSyncConfigV473',
        'exportFilteredResultsToExcelV45', 'enterLocalOfflineAdminPreviewV511',
        'setAdminUserStatusFilter', 'setAdminUserClassFilter', 'setAdminUsersSubView',
        'setAdminGradeFilter', 'setAdminResultFilter', 'setAdminResultGradeFilterV45',
        'setAdminResultStudentSearchV45', 'dismissAllVipHackAlertsV44'
    ];

    const SENSITIVE = /pass|secret|token|key|gmail|cred|mk|password/i;

    function safeArgs(name, args) {
        const redact = SENSITIVE.test(name);
        return args.map((v, i) => {
            if (redact) return `[REDACTED arg${i}: ${typeof v}]`;
            if (v === null || v === undefined) return v === null ? null : undefined;
            const t = typeof v;
            if (t === 'string') return String(v).slice(0, 120);
            if (t === 'number' || t === 'boolean') return v;
            if (t === 'function') return `[Function ${v.name || 'anonymous'}]`;
            if (Array.isArray(v)) return `[Array(${v.length})]`;
            if (t === 'object') {
                const out = {};
                for (const k of Object.keys(v).slice(0, 30)) {
                    out[k] = SENSITIVE.test(k) ? '[REDACTED]' : safeValue(v[k]);
                }
                return out;
            }
            return String(v).slice(0, 80);
        });
    }

    function safeValue(v) {
        const t = typeof v;
        if (v === null || v === undefined || t === 'number' || t === 'boolean') return v;
        if (t === 'string') return String(v).slice(0, 120);
        if (t === 'function') return `[Function ${v.name || 'anonymous'}]`;
        if (Array.isArray(v)) return `[Array(${v.length})]`;
        if (t === 'object') return `{${Object.keys(v).slice(0, 20).join(',')}}`;
        return String(v).slice(0, 80);
    }

    function append(kind, payload) {
        let rows = [];
        try { rows = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { rows = []; }
        if (!Array.isArray(rows)) rows = [];
        rows.unshift(Object.assign({ ts: Date.now(), kind }, payload));
        try { localStorage.setItem(LOG_KEY, JSON.stringify(rows.slice(0, 500))); } catch (e) {}
        if (kind !== 'fetch') console.log(`[AERO-ADMIN] ${kind}`, payload);
    }

    // ---- 1. Fully local fetch stub: no request leaves the browser. --------
    const localResponse = body => ({
        ok: true,
        status: 200,
        json: async () => body,
        text: async () => JSON.stringify(body)
    });

    window.fetch = async function (u, init = {}) {
        const url = String((u && u.url) || u);
        const method = String(init.method || 'GET').toUpperCase();
        append('fetch', { url, method, note: 'LOCAL MOCK — no network request sent' });
        if (url.includes('/api/admin/login')) {
            return localResponse({ ok: true, authenticated: true });
        }
        return localResponse({ ok: true, offline: true, records: [], count: 0 });
    };

    // Satisfy the shipped client-side admin-session flag without a server.
    window.__TT50_SERVER_ADMIN_VERIFIED_V485__ = true;

    // Synthetic credentials for the mock login form only.
    document.getElementById = function (id) {
        if (id === 'adminUserInput' || id === 'adminPassInput') {
            return { value: 'local-mock', checked: true, tagName: 'INPUT' };
        }
        if (id === 'adminRememberMeChk') {
            return { checked: true, tagName: 'INPUT' };
        }
        return origGetById ? origGetById(id) : null;
    };

    // ---- 2. Hook admin methods. -------------------------------------------
    const originals = [];
    const wrapped = [];

    METHOD_NAMES.forEach(name => {
        const orig = api[name];
        if (typeof orig !== 'function') return;
        const hooked = function (...args) {
            append('call', { method: name, args: safeArgs(name, args) });
            let out;
            try {
                out = orig.apply(this, args);
            } catch (e) {
                append('error', { method: name, error: String(e && e.message || e).slice(0, 200) });
                throw e;
            }
            if (out && typeof out.then === 'function') {
                return out.then(
                    value => { append('result', { method: name, result: safeValue(value) }); return value; },
                    err => { append('error', { method: name, error: String(err && err.message || err).slice(0, 200) }); throw err; }
                );
            }
            append('result', { method: name, result: safeValue(out) });
            return out;
        };
        hooked.__AERO_ADMIN_LOG__ = true;
        api[name] = hooked;
        originals.push({ name, fn: orig });
        wrapped.push(name);
    });

    // ---- 3. Restore / dump. ------------------------------------------------
    window.__AERO_ADMIN_LOG_DUMP__ = function () {
        try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { return []; }
    };

    window.__AERO_ADMIN_LOG_CLEAR__ = function () {
        localStorage.removeItem(LOG_KEY);
        return true;
    };

    window.__AERO_ADMIN_LOG_RESTORE__ = function () {
        originals.forEach(x => {
            if (api[x.name] && api[x.name].__AERO_ADMIN_LOG__) api[x.name] = x.fn;
        });
        window.fetch = origFetch;
        document.getElementById = origGetById;
        window.__TT50_SERVER_ADMIN_VERIFIED_V485__ = false;
        localStorage.removeItem(MOCK_KEY);
        delete window.__AERO_ADMIN_LOG_DUMP__;
        delete window.__AERO_ADMIN_LOG_CLEAR__;
        delete window.__AERO_ADMIN_LOG_RESTORE__;
        console.log('[AERO-ADMIN] restored; log retained in', LOG_KEY, '— press F5 to clear memory state');
        return { restored: wrapped.length, logKey: LOG_KEY };
    };

    localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: Date.now(), wrapped, note: 'local instrumentation only' }));
    localStorage.setItem(MOCK_KEY, '1');
    append('install', { hooked: wrapped.length, methods: wrapped, offline: true });

    console.log(`[AERO-ADMIN] hooked ${wrapped.length} admin methods; log -> localStorage.${LOG_KEY}`);
    console.log('[AERO-ADMIN] restore with __AERO_ADMIN_LOG_RESTORE__()');

    return {
        type: 'ACTION',
        status: 'ACTIVE',
        hooked: wrapped.length,
        methods: wrapped,
        logKey: LOG_KEY,
        scope: 'LOCAL ONLY — no network request is sent',
        note: 'Mock admin login grants no real authority. Restore with __AERO_ADMIN_LOG_RESTORE__().'
    };
})();
