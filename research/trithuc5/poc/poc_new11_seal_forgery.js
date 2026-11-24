// poc_new11_seal_forgery.js — NEW-11: canonical VIP approval seal is client-derivable
//
// Target:  https://trithuc500.vercel.app/
// Finding: NEW-11 (Critical). V5.4.2 replaced the old vault-hash-derived seal secret
//          with a canonical master literal inside computeTeacherVipApprovalSealV44.
//          isValidTeacherVipSealV522 accepts that offline-recomputed seal; the
//          approval is therefore not proof of a teacher's server-side action.
//
// Type:     DISPLAY ONLY. Reads the shipped script text and recomputes a seal for a
//           SYNTHETIC fixture in memory. Does not write localStorage, does not
//           publish to ntfy/KV, does not submit a form, does not touch a real account.
//
// Usage: paste into DevTools Console on the target page.

(() => {
    'use strict';

    const result = {
        ok: false,
        type: 'DISPLAY',
        finding: 'NEW-11',
        status: 'UNVERIFIED',
        sourceContainsCanonicalLiteral: false,
        sourceContainsValidator: false,
        syntheticSeal: null,
        note: 'No state change. Synthetic fixture only.'
    };

    function hashStringHex(rawStr) {
        const str = String(rawStr || '');
        let h1 = 0x811c9dc5, h2 = 0x1b873593;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ c, 16777619);
            h2 = Math.imul(h2 ^ c, 2246822507);
        }
        const p1 = (h1 >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(-4);
        const p2 = (h2 >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(-4);
        return p1 + p2;
    }

    const fixture = {
        username: 'seal_probe_synthetic',
        name: 'Seal Probe',
        class: '12A1',
        vipPackages: { k12: true, k11: true, k10: true, luyende: true },
        maxDevices: 2
    };

    try {
        const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent || '');
        const src = scripts.join('\n');
        result.sourceContainsCanonicalLiteral = src.includes("'TT50_CANONICAL_MASTER_V522'");
        result.sourceContainsValidator = src.includes('function isValidTeacherVipSealV522');

        const vp = fixture.vipPackages || {};
        const maxD = Math.max(1, Math.min(3, Number(fixture.maxDevices || 2)));
        const raw = `TT50_VIP_SEAL_V44|${String(fixture.username || '').toLowerCase()}|${String(fixture.name || '').trim()}|${String(fixture.class || '').trim()}|${vp.k12 ? 1 : 0}${vp.k11 ? 1 : 0}${vp.k10 ? 1 : 0}${vp.luyende ? 1 : 0}|MAXD:${maxD}|TT50_CANONICAL_MASTER_V522|THAY_TRUNG_MASTER_SEAL_2026`;
        result.syntheticSeal = 'vseal44_' + hashStringHex(raw);
        result.ok = result.sourceContainsCanonicalLiteral && /^vseal44_/.test(result.syntheticSeal);
        result.status = result.ok ? 'LOCAL_CONFIRMED' : 'UNVERIFIED';
    } catch (e) {
        result.note = 'Inspection failed in this context: ' + String(e && e.message || e).slice(0, 100);
    }

    console.table({
        finding: result.finding,
        type: result.type,
        status: result.status,
        canonicalLiteralInBundle: result.sourceContainsCanonicalLiteral,
        validatorInBundle: result.sourceContainsValidator,
        syntheticSeal: result.syntheticSeal,
        note: result.note
    });
    console.warn('[NEW-11] A seal computed from bundle material is not server-side approval. Do not use this to alter real accounts.');

    return result;
})();
