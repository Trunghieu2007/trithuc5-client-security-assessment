// ==UserScript==
// @name         Aero Universal Test Hook v3 - TRITHUC5.0
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Document-start F-06 bypass for closure-scoped anti-cheat + NEW-02 test API
// @match        https://trithuc500.vercel.app/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

// IMPORTANT: install in Tampermonkey/Violentmonkey. Do NOT paste into Console.
// v1/v2 failed to fully disable checks because handlers are closure-local inside the page IIFE.
// v3 blocks those handlers from being registered in the first place.

(function () {
  'use strict';
  const w = unsafeWindow;

  const origAdd = EventTarget.prototype.addEventListener;
  const origInterval = w.setInterval;
  const safeSetInterval = origInterval.bind(w);

  w.__AERO_ORIG_ADD__ = origAdd;
  w.__AERO_ORIG_INTERVAL__ = origInterval;

  const BAD_TYPES = new Set([
    'visibilitychange',
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'blur',
    'contextmenu',
    'copy',
    'cut',
    'dragstart',
    'selectstart',
    'paste',
    'keydown'
  ]);

  const MARKER = /triggerExamViolation|recordAISuspicion|KHIÊN BẢO MẬT|BẢO MẬT BẢN QUYỀN|showToast\(['"]🛡️|scanAndBlockAIExtensions/;

  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    let src = '';
    try { src = String(fn && fn.toString ? fn.toString() : ''); } catch (e) {}
    if (BAD_TYPES.has(String(type)) && MARKER.test(src)) {
      return; // block anti-cheat listener registration
    }
    return origAdd.call(this, type, fn, opts);
  };

  w.setInterval = function (fn, ms) {
    let src = '';
    try { src = String(fn && fn.toString ? fn.toString() : ''); } catch (e) {}
    if (/scanAndBlockAIExtensions|verifyRuntimeSecurityIntegrity/.test(src)) {
      return 0; // block the 2s radar
    }
    return origInterval.apply(w, arguments);
  };

  function removeViolationOverlay() {
    const d = w.document;
    d.querySelectorAll('div').forEach(el => {
      const c = typeof el.className === 'string' ? el.className : '';
      if (c.includes('z-[99985]') && c.includes('bg-slate-950')) el.remove();
    });
  }

  function neutralize() {
    const t = w.TRITHUC;
    if (!t) return;

    if (typeof t.toggleAntiAiField === 'function') {
      ['idleBlur', 'extensionDetector', 'watermark', 'promptTrap', 'cameraOcrGrid']
        .forEach(k => { try { t.toggleAntiAiField(k, false); } catch (e) {} });
    }
    if (typeof t.dismissIdleBlurBanner === 'function') {
      try { t.dismissIdleBlurBanner(); } catch (e) {}
    }

    const overlay = [...w.document.querySelectorAll('div')]
      .some(el => {
        const c = typeof el.className === 'string' ? el.className : '';
        return c.includes('z-[99985]') && c.includes('bg-slate-950');
      });

    if (overlay && typeof t.reEnterExamFullscreen === 'function') {
      try { t.reEnterExamFullscreen(); } catch (e) {}
    }
    removeViolationOverlay();
  }

  safeSetInterval(() => {
    if (!w.__TRITHUC50_CLOUD_BUS__ || !w.TRITHUC) return;
    clearInterval(w.__AERO_NEUTRALIZE_TIMER__);
    neutralize();
    w.__AERO_NEUTRALIZE_TIMER__ = safeSetInterval(neutralize, 1000);

    function base64Url(packet) {
      const bytes = new w.TextEncoder().encode(JSON.stringify(packet));
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return w.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    w.__AERO_POC__ = {
      version: '3.0-userscript',
      // `state` is closure-local inside the page IIFE; expose only what the
      // shipped cloud-bus bridge legitimately returns.
      stateJson: () => ({ note: 'state is closure-local; use exportSnapshot()' }),
      users: () => {
        const snap = w.__TRITHUC50_CLOUD_BUS__.exportSnapshotPacket();
        return snap && Array.isArray(snap.users) ? snap.users : [];
      },
      bus: () => w.__TRITHUC50_CLOUD_BUS__,
      exportSnapshot: () => w.__TRITHUC50_CLOUD_BUS__.exportSnapshotPacket(),
      applyLocal: packet => w.__TRITHUC50_CLOUD_BUS__.applyIncomingPacket(packet),
      neutralize,
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
        EventTarget.prototype.addEventListener = w.__AERO_ORIG_ADD__;
        w.setInterval = w.__AERO_ORIG_INTERVAL__;
        delete w.__AERO_POC__;
        return true;
      }
    };

    console.log('[Aero] userscript hook v3 ready — closure anti-cheat blocked at registration');
  }, 200);
})();
