// phase4_payload_validation.js — executes the shipped PoC payload
// (poc/v44_vip_bypass_payload.js) inside a mock browser environment and
// cross-checks the results against the REAL V4.4 functions extracted from the
// deployed bundle. No production traffic.
//
// Usage: node phase4_payload_validation.js

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const h = require('./phase4_harness.js');

const NOW = 1795000000000;
const PAYLOAD = path.join(__dirname, '..', 'poc', 'v44_vip_bypass_payload.js');

let pass = 0, fail = 0;
const failures = [];
function check(label, cond, extra) {
    if (cond) { pass++; console.log(`PASS ${label}`); }
    else { fail++; failures.push(label + (extra ? ' :: ' + extra : '')); console.log(`FAIL ${label}${extra ? ' :: ' + extra : ''}`); }
}

// --- Mock browser ----------------------------------------------------------
const store = new Map();
const localStorage = {
    getItem: k => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => store.set(String(k), String(v)),
    removeItem: k => store.delete(String(k))
};
const sandbox = {
    console, Math, JSON, Date: { now: () => NOW }, localStorage,
    window: {}
};
sandbox.window.localStorage = localStorage;
vm.createContext(sandbox);

const payloadSrc = fs.readFileSync(PAYLOAD, 'utf8');
vm.runInContext(payloadSrc, sandbox, { filename: 'v44_vip_bypass_payload.js' });

// --- Read what the payload wrote ------------------------------------------
const users = JSON.parse(localStorage.getItem('TRITHUC50_USERS_V436_CLEAN') || '[]');
const login = JSON.parse(localStorage.getItem('TRITHUC50_LOGGED_STUDENT_V436') || 'null');
check('payload wrote a user record', users.length >= 1, `users=${users.length}`);
check('payload wrote a login marker', login && typeof login.username === 'string');

const injected = users[0];
check('injected username avoids the V4.4 keyword blacklist',
    !/(poc_vip|nologin|hack|exploit|bypass|cheat)/i.test(`${injected.username} ${injected.name} ${injected.gmail}`),
    injected.username);
check('injected maxDevices is within 1..3', injected.maxDevices >= 1 && injected.maxDevices <= 3, String(injected.maxDevices));
check('injected name is non-empty and not "()"', !!injected.name && injected.name !== '()');

// --- Cross-check signatures against the REAL bundle implementations ---------
const e = h.createEnv({ now: NOW });
check('_sig forged by the payload matches the real computeUserIntegritySig',
    injected._sig === e.computeUserIntegritySig(injected), `payload=${injected._sig} real=${e.computeUserIntegritySig(injected)}`);
check('_adminVipSeal forged by the payload matches the real computeTeacherVipApprovalSealV44',
    injected._adminVipSeal === e.computeTeacherVipApprovalSealV44(injected),
    `payload=${injected._adminVipSeal} real=${e.computeTeacherVipApprovalSealV44(injected)}`);

// --- End-to-end: run the REAL boot normalizer over the payload's own record -
const e2 = h.createEnv({ now: NOW });
e2.state.users = JSON.parse(JSON.stringify(users));
e2.bootNormalizeUsersV44();
const after = e2.state.users.find(u => u.username === injected.username) || e2.state.users[0];
check('boot keeps the account active', after.status === 'active', after.status);
check('boot keeps isVip true', after.isVip === true, String(after.isVip));
check('boot leaves a valid seal in place',
    !!after._adminVipSeal && after._adminVipSeal === e2.computeTeacherVipApprovalSealV44(after));
const svc = e2.BackendVipAuthServiceV44;
svc.registerVerifiedUserRecord(after);
check('BackendVipAuthService grants k12 access', svc.hasVerifiedPackageAccess(after, '12', 'payload') === true);
check('BackendVipAuthService grants luyende access', svc.hasVerifiedPackageAccess(after, 'luyende', 'payload') === true);
check('the V4.4 detect guard does not fire on the payload account',
    e2.detectAndBlockStudentVipHackV44(after, 'payload') === false);

// --- Restore helper works --------------------------------------------------
sandbox.window.__AERO_V44_RESTORE__();
check('restore helper clears the backup marker', localStorage.getItem('TRITHUC50_AERO_V44_BACKUP') === null);

console.log(`\nTOTAL ${pass + fail} PASS ${pass} FAIL ${fail}`);
if (failures.length) failures.forEach(f => console.log(' - ' + f));
process.exit(fail ? 1 : 0);
