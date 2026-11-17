// verify_live_readonly.mjs — READ-ONLY verification of public ntfy/KV sync state.
// No POST, no packet publication, no production writes, no password output.
// Usage: node research/trithuc5/poc/verify_live_readonly.mjs [--show-identifiers]
import process from 'node:process';

const SHOW_IDS = process.argv.includes('--show-identifiers');
const TOPICS = [
  'https://ntfy.sh/trithuc50_v436_live_sync_hn',
  'https://ntfy.sh/trithuc50_v436_bak_sync_hn'
];
const KV_GET = 'https://keyvalue.immanuel.co/api/KeyVal/GetValue/tt50v436hn/';
const SEED = new Set([
  'hs12a1', 'hs12a2', 'quanganh', 'hoangnam',
  'khanhlinh', 'minhanh12a1', 'tuananh12a2'
]);

function decodeMessage(raw) {
  const s = String(raw || '').trim();
  try {
    if (s.startsWith('TT50V437:') || s.startsWith('TT50V436:')) {
      return JSON.parse(Buffer.from(s.slice(9), 'base64url').toString('utf8'));
    }
    if (s.startsWith('TT50V434:')) {
      return JSON.parse(Buffer.from(s.slice(9), 'base64').toString('utf8'));
    }
  } catch (_) {}
  return null;
}

function usersOf(pkt) {
  if (!pkt || typeof pkt !== 'object') return [];
  const out = [];
  if (pkt.user) out.push(pkt.user);
  if (Array.isArray(pkt.users)) out.push(...pkt.users);
  return out.filter(u => u && typeof u === 'object');
}

function summarize(pkt, source) {
  const users = usersOf(pkt);
  const tombs = (pkt && pkt.deletedMap && typeof pkt.deletedMap === 'object')
    ? Object.keys(pkt.deletedMap) : [];
  const usernames = users.map(u => String(u.u || u.username || '')).filter(Boolean);
  return {
    source,
    app: pkt && pkt.app,
    type: pkt && pkt.type,
    ts: pkt && pkt.ts,
    fromAdmin: Boolean(pkt && pkt.fromAdmin),
    hasSig: Boolean(pkt && pkt.adminSig),
    users: users.length,
    withPasswordField: users.filter(u => Object.prototype.hasOwnProperty.call(u, 'p')).length,
    tombstones: tombs.length,
    nonSeedTombstones: tombs.filter(k => !SEED.has(k)).length,
    usernames
  };
}

async function getText(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

const summaries = [];
const uniqueUsers = new Set();
const errors = [];

console.log('=== TRITHUC5.0 live read-only verification ===');
console.log('No POST. No state write. Passwords are never printed.');

for (const endpoint of TOPICS) {
  try {
    const text = await getText(`${endpoint}/json?poll=1&since=24h`);
    const lines = text.split(/\r?\n/).filter(Boolean);
    let decoded = 0;
    for (const line of lines) {
      try {
        const outer = JSON.parse(line);
        const pkt = decodeMessage(outer && outer.message);
        if (!pkt) continue;
        decoded++;
        const s = summarize(pkt, endpoint.split('/').pop());
        summaries.push(s);
        s.usernames.forEach(u => uniqueUsers.add(u));
      } catch (_) {}
    }
    console.log(`${endpoint.split('/').pop()}: lines=${lines.length} decoded=${decoded}`);
  } catch (e) {
    errors.push(`${endpoint}: ${e.message}`);
    console.log(`${endpoint.split('/').pop()}: ERROR ${e.message}`);
  }
}

try {
  const rawMeta = (await getText(`${KV_GET}meta_cnt`)).replace(/^"|"$/g, '').trim();
  const cnt = parseInt(rawMeta.split('_')[0], 10);
  console.log(`KV meta_cnt: raw=${rawMeta} count=${cnt}`);
  if (Number.isFinite(cnt) && cnt > 0 && cnt <= 24) {
    // Read chunks sequentially. A 16-way burst caused HTTP 503 responses.
    // One short retry is allowed only for transient 503s; no POST or write occurs.
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    async function getKVChunk(i) {
      const url = `${KV_GET}s_${i}`;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          return (await getText(url)).replace(/^"|"$/g, '').trim();
        } catch (e) {
          if (attempt === 2 || !/HTTP 503/.test(e.message)) throw e;
          await sleep(500);
        }
      }
    }
    const parts = [];
    for (let i = 0; i < cnt; i++) {
      try {
        const raw = await getKVChunk(i);
        if (!raw) {
          errors.push(`KV s_${i}: empty`);
        }
        parts.push(raw);
      } catch (e) {
        errors.push(`KV s_${i}: ${e.message}`);
        parts.push('');
      }
      if (i < cnt - 1) await sleep(120);
    }
    if (parts.every(Boolean)) {
      const json = Buffer.from(parts.join(''), 'base64url').toString('utf8');
      const pkt = JSON.parse(json);
      const s = summarize(pkt, 'KV snapshot');
      summaries.push(s);
      s.usernames.forEach(u => uniqueUsers.add(u));
    } else {
      errors.push('KV chunk set incomplete; snapshot skipped');
    }
  }
} catch (e) {
  errors.push(`KV meta_cnt: ${e.message}`);
  console.log(`KV meta_cnt: ERROR ${e.message}`);
}

const rows = summaries.map((s, i) => ({
  idx: i + 1,
  source: s.source,
  app: s.app || '',
  type: s.type || '',
  fromAdmin: s.fromAdmin,
  sig: s.hasSig,
  users: s.users,
  pwdField: s.withPasswordField,
  tombs: s.tombstones,
  nonSeedTombs: s.nonSeedTombstones
}));

console.table(rows);
console.log('aggregate:', {
  packets: summaries.length,
  uniqueUsernames: uniqueUsers.size,
  packetsWithPasswordField: summaries.filter(s => s.withPasswordField > 0).length,
  packetsWithNonSeedTombstones: summaries.filter(s => s.nonSeedTombstones > 0).length
});

if (SHOW_IDS) {
  console.log('identifiers (explicit --show-identifiers):', [...uniqueUsers]);
} else {
  console.log('identifiers hidden. Re-run with --show-identifiers only if owner-approved.');
}

console.log('errors:', errors);
console.log('=== END READ-ONLY VERIFICATION ===');
