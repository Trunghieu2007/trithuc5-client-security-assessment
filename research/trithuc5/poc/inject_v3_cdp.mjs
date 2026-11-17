// inject_v3_cdp.mjs — launch Chrome with remote debugging and inject v3 at document-start.
// No Tampermonkey/Violentmonkey required. Node 18+ (global fetch + WebSocket).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.POC_CDP_PORT || 9222);
const TARGET = process.env.POC_TARGET || 'https://trithuc500.vercel.app/';
const PROFILE = process.env.POC_PROFILE || path.join(os.tmpdir(), 'aero-cdp-profile');
const SCRIPT = fs.readFileSync(
  new URL('./aero_hook_v3_cdp.js', import.meta.url),
  'utf8'
);

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  `--remote-allow-origins=*`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

async function waitForCdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return await r.json();
    } catch (_) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('CDP did not become ready. Check CHROME_PATH and port.');
}

const version = await waitForCdp();
console.log('[Aero] CDP ready:', version.Browser);

let target;
const created = await fetch(
  `http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(TARGET)}`,
  { method: 'PUT' }
);
if (created.ok) {
  target = await created.json();
} else {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  target = list.find(t => t.type === 'page');
  if (!target) throw new Error('No page target available.');
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();

ws.onmessage = ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

function send(method, params = {}) {
  return new Promise(resolve => {
    const id = ++seq;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: SCRIPT });
await send('Page.navigate', { url: TARGET });

console.log('[Aero] v3 injected at document-start. Chrome PID:', chrome.pid);
console.log('[Aero] Chrome profile:', PROFILE);

await new Promise(r => setTimeout(r, 2500));
const probe = await send('Runtime.evaluate', {
  expression: 'typeof window.__AERO_POC__',
  returnByValue: true
});
console.log('[Aero] hook check:', probe.result?.result?.value);

console.log('[Aero] Keep this Node process open while testing. Close Chrome when done.');
setInterval(() => {}, 1 << 30);
