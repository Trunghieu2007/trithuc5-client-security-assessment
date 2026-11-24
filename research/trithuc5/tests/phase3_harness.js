// phase3_harness.js — additive harness for Phase 3 deep investigation.
// Reuses the hash-pinned base harness and extracts additional REAL functions from
// the same measured source. No production network access is performed here.
'use strict';
const vm = require('vm');
const h = require('./harness.js');

const EXTRA_FNS = [
    'saveActivityLogsState',
    'normalizeGFormEntryCode',
    'normalizeGFormActionUrl',
    'dispatchParamsToGoogleFormUrl',
    'postToGoogleFormEndpoint',
    'syncActivityLogToGoogleForm',
    'logStudentActivity',
    'isAdminExamAttempt', 'pushSystemUserPacketToVercelApiV521'
];

function createDeepEnv(options) {
    options = options || {};
    const captures = [];
    const fetchImpl = options.fetchImpl || (async (url, init) => {
        captures.push({ url: String(url), body: String((init && init.body) || '') });
        return { ok: true, text: async () => '' };
    });
    const env = h.createEnv(Object.assign({}, options, { fetchImpl }));

    env.URLSearchParams = URLSearchParams;
    env.Blob = Blob;
    if (!env.navigator) env.navigator = {};
    env.navigator.sendBeacon = () => false;
    // Replaced by the real extracted declaration below; kept as a safe fallback.
    env.isAdminExamAttempt = () => false;

    const src = h.readSource();
    const pieces = [
        'const __GFORM_DISPATCH_QUEUE__ = [];',
        'let __gformFlushTimer__ = null;',
        ...EXTRA_FNS.map(name => h.extractFunction(src.lines, name).code)
    ];
    vm.runInContext(pieces.join('\n'), env, { filename: 'phase3-extracted-client.js' });
    return Object.assign(env, { __captures: captures });
}

module.exports = { createDeepEnv, EXTRA_FNS };
