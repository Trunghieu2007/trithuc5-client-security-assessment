// aero_hook_v2.js — CONSOLE-SAFE payload for TRITHUC5.0 V4.3.9.
// Paste into Chrome DevTools Console (NOT into Tampermonkey).
// Local-only: no auto publish. Use __AERO_POC__.pageFetch / publishRawExplicitUrl manually.
(() => {
  const w = window;
  const d = document;
  const pageEval = expr => w.eval(expr);

  if (!w.__AERO_ORIG__) {
    w.__AERO_ORIG__ = {
      triggerExamViolation: w.triggerExamViolation,
      recordAISuspicion: w.recordAISuspicion,
      scanAndBlockAIExtensions: w.scanAndBlockAIExtensions,
      verifyRuntimeSecurityIntegrity: w.verifyRuntimeSecurityIntegrity,
      showToast: w.showToast
    };
  }

  function removeViolationOverlay() {
    // Overlay markup at source line 9189 uses z-[99985] + bg-slate-950.
    d.querySelectorAll('div').forEach(el => {
      const c = typeof el.className === 'string' ? el.className : '';
      if (c.includes('z-[99985]') && c.includes('bg-slate-950')) el.remove();
    });
  }

  function neutralize() {
    w.triggerExamViolation = () => false;
    w.recordAISuspicion = () => false;
    w.scanAndBlockAIExtensions = () => false;
    w.verifyRuntimeSecurityIntegrity = () => true;

    try { pageEval('clearInterval(antiAiInterval)'); } catch (e) {}

    w.showToast = function (msg) {
      const s = String(msg || '');
      if (/KHIÊN BẢO MẬT|BẢO MẬT BẢN QUYỀN|Quy chế \/ AI|Cảnh báo Quy chế|Chặn thiết bị/.test(s)) return;
      const orig = w.__AERO_ORIG__ && w.__AERO_ORIG__.showToast;
      return orig ? orig.apply(this, arguments) : undefined;
    };

    if (d.body) d.body.classList.remove('anti-copy-shield-v43', 'security-blur-active');

    const banner = d.getElementById('idleBlurBanner');
    if (banner) {
      banner.classList.remove('show');
      banner.style.display = 'none';
    }
    const wm = d.getElementById('watermarkLayer');
    if (wm) wm.style.display = 'none';

    let hadOverlay = false;
    try {
      hadOverlay = Boolean(pageEval('Boolean(state && state.showViolationOverlay)'));
      pageEval(`
        (function () {
          try {
            state.tabSwitches = 0;
            state.lastViolationReason = '';
            state.showViolationOverlay = false;
            if (state.antiAiConfig) {
              state.antiAiConfig.idleBlur = false;
              state.antiAiConfig.extensionDetector = false;
              state.antiAiConfig.watermark = false;
            }
          } catch (e) {}
        })();
      `);
    } catch (e) {}

    removeViolationOverlay();
    if (hadOverlay) {
      try { pageEval('renderApp(true)'); } catch (e) {}
    }
  }

  ['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart', 'paste']
    .forEach(type => w.addEventListener(type, e => e.stopImmediatePropagation(), true));

  w.addEventListener('keydown', function (e) {
    const k = String(e.key || '').toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const tag = ((e.target && e.target.tagName) || '').toUpperCase();
    const editable = tag === 'INPUT' || tag === 'TEXTAREA' ||
      Boolean(e.target && e.target.isContentEditable);
    const devShortcut =
      e.key === 'F12' || e.keyCode === 123 ||
      (ctrl && (e.shiftKey || e.altKey) && ['i', 'j', 'c', 'k', 'u'].includes(k)) ||
      (ctrl && ['u', 's', 'p'].includes(k)) ||
      (!editable && ctrl && ['c', 'x', 'a'].includes(k)) ||
      e.key === 'PrintScreen' || e.keyCode === 44;
    if (devShortcut) e.stopImmediatePropagation();
  }, true);

  clearInterval(w.__AERO_NEUTRALIZE_TIMER__);
  neutralize();
  w.__AERO_NEUTRALIZE_TIMER__ = setInterval(neutralize, 1000);

  function base64Url(packet) {
    const bytes = new w.TextEncoder().encode(JSON.stringify(packet));
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return w.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  w.__AERO_POC__ = {
    version: '2.0-console',
    rawState: () => pageEval('state'),
    stateJson: () => pageEval('JSON.parse(JSON.stringify(state))'),
    users: () => pageEval('JSON.parse(JSON.stringify(state.users || []))'),
    bus: () => w.__TRITHUC50_CLOUD_BUS__,
    exportSnapshot: () =>
      w.__TRITHUC50_CLOUD_BUS__ && w.__TRITHUC50_CLOUD_BUS__.exportSnapshotPacket(),
    applyLocal: packet => w.__TRITHUC50_CLOUD_BUS__.applyIncomingPacket(packet),

    makeNew02Packet: overrides => {
      const now = Date.now();
      const username = 'poc_new02_' + String(now).slice(-6);
      return Object.assign({
        app: 'TRITHUC50_V436', type: 'LOCAL_POC_NEW02', ts: now,
        fromAdmin: false, hideAuthorInfo: false, hideAuthorTs: 0,
        deletedUsernames: [], deletedMap: {},
        users: [{
          id: 'stu_' + username, u: username, p: 'SYNTHETIC_POC_ONLY',
          n: 'POC Synthetic', c: '12A1', s: '99', g: username + '@gmail.com', ph: '',
          st: 'active', vp: [1, 1, 1, 1], rp: [1, 0, 0, 0],
          pl: 'lifetime', rpl: '1y', exp: null, pend: 0, newReg: 0,
          maxD: 999, devs: [], regAt: 'POC', updAt: now, v436: 1
        }]
      }, overrides || {});
    },

    pageFetch: (url, init) => w.fetch(url, init),
    publishRawExplicitUrl: (url, packet) =>
      w.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: 'TT50V436:' + base64Url(packet)
      }),

    restore: () => {
      clearInterval(w.__AERO_NEUTRALIZE_TIMER__);
      const o = w.__AERO_ORIG__ || {};
      Object.keys(o).forEach(k => {
        if (typeof o[k] === 'function') w[k] = o[k];
      });
      delete w.__AERO_POC__;
      console.log('[Aero] console hook restored');
      return true;
    }
  };

  console.log('[Aero] console hook v2 ready — overlay removal enabled');
  return true;
})();
