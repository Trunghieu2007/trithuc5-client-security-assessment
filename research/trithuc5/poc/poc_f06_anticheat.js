// poc_f06_anticheat.js — F-06: anti-cheat controls are UX-only
//                        (ACTION — installs the anti-cheat bypass)
//
// Target:  https://trithuc500.vercel.app/
// Finding:  F-06 — every anti-cheat control is cosmetic client-side behaviour:
//             - DevTools / fullscreen / copy / paste / context menu handling
//               is `preventDefault()` on DOM events.
//             - The violation overlay is a DOM node with fixed Tailwind classes.
//             - Idle-blur, camera-OCR grid, extension detector and watermark
//               are DOM/CSS artefacts.
//             - `state` and the handlers are closure-local inside the page
//               IIFE, so `window.triggerExamViolation = ...` does NOT replace
//               them. The reliable interception point is the registration of
//               the listeners themselves.
//
// Type:     ACTION. This file contains two variants:
//
//   A) CONSOLE variant  — for the page state that is already loaded. It
//      neutralises the visible overlay, the idle-blur banner, the watermark
//      and the anti-AI field toggles. It cannot unregister listeners that
//      are already bound.
//
//   B) USERSCRIPT variant — the reliable one. Tampermonkey/Violentmonkey with
//      `@run-at document-start` blocks the anti-cheat listener registration
//      before the page code runs. Copy the block marked USERSCRIPT below into
//      a new userscript.
//
// Usage:
//   - Console variant: paste this whole file into DevTools Console.
//   - Userscript variant: copy the marked block into Tampermonkey.
//
// SCOPE / SAFETY: local browser behaviour only. No server interaction.

(() => {
    'use strict';

    // ---- Shared helpers ---------------------------------------------------
    const MARKER = /triggerExamViolation|recordAISuspicion|KHIÊN BẢO MẬT|BẢO MẬT BẢN QUYỀN|showToast\(['"]🛡️|scanAndBlockAIExtensions|verifyRuntimeSecurityIntegrity/;

    const BAD_TYPES = new Set([
        'visibilitychange', 'fullscreenchange', 'webkitfullscreenchange',
        'mozfullscreenchange', 'blur', 'contextmenu', 'copy', 'cut',
        'dragstart', 'selectstart', 'paste', 'keydown'
    ]);

    // -----------------------------------------------------------------------
    // VARIANT A — CONSOLE (works on an already-loaded page)
    // -----------------------------------------------------------------------
    function neutralizeVisibleArtifacts() {
        const t = window.TRITHUC;
        let acted = [];

        if (t && typeof t.toggleAntiAiField === 'function') {
            ['idleBlur', 'extensionDetector', 'watermark', 'promptTrap', 'cameraOcrGrid']
                .forEach(k => { try { t.toggleAntiAiField(k, false); acted.push('toggleAntiAiField:' + k); } catch (e) {} });
        }
        if (t && typeof t.dismissIdleBlurBanner === 'function') {
            try { t.dismissIdleBlurBanner(); acted.push('dismissIdleBlurBanner'); } catch (e) {}
        }

        // Remove the violation overlay (class-based detection).
        let removed = 0;
        document.querySelectorAll('div').forEach(el => {
            const c = typeof el.className === 'string' ? el.className : '';
            if (c.includes('z-[99985]') && c.includes('bg-slate-950')) { el.remove(); removed++; }
        });

        // Re-enter fullscreen if the app dropped it because of a violation.
        const overlayPresent = Array.from(document.querySelectorAll('div')).some(el => {
            const c = typeof el.className === 'string' ? el.className : '';
            return c.includes('z-[99985]') && c.includes('bg-slate-950');
        });
        if (overlayPresent && t && typeof t.reEnterExamFullscreen === 'function') {
            try { t.reEnterExamFullscreen(); acted.push('reEnterExamFullscreen'); } catch (e) {}
        }

        return { acted, removed };
    }

    console.log('=== F-06 anti-cheat UX neutralisation (console variant) ===');
    const res = neutralizeVisibleArtifacts();
    console.log('[F-06] actions:', res.acted.join(', ') || '(none)');
    console.log('[F-06] overlays removed:', res.removed);

    // Inspect what protections are still armed, so the residual risk is explicit.
    const probe = {
        overlayPresent: Array.from(document.querySelectorAll('div')).some(el => {
            const c = typeof el.className === 'string' ? el.className : '';
            return c.includes('z-[99985]') && c.includes('bg-slate-950');
        }),
        watermarkPresent: Array.from(document.querySelectorAll('*')).some(el => {
            const c = typeof el.className === 'string' ? el.className : '';
            return /watermark/i.test(c);
        }),
        copyHandlerBlocked: (() => {
            try {
                const ev = new Event('copy', { cancelable: true });
                const before = ev.defaultPrevented;
                document.dispatchEvent(ev);
                return ev.defaultPrevented !== before;
            } catch (e) { return 'n/a'; }
        })(),
        trithucApiPresent: !!window.TRITHUC,
        note: 'listeners already bound to document/window cannot be removed from the console'
    };
    console.table(probe);
    console.warn('[F-06] The console variant only hides UI artefacts. Use the USERSCRIPT variant');
    console.warn('       below for a complete bypass (it blocks listener registration).');

    // Re-apply periodically so a re-render cannot restore the overlay.
    let timer = setInterval(() => { try { neutralizeVisibleArtifacts(); } catch (e) {} }, 1000);
    window.__AERO_F06_STOP__ = function () {
        clearInterval(timer);
        delete window.__AERO_F06_STOP__;
        console.log('[F-06] console neutraliser stopped.');
        return true;
    };
    console.log('Stop: __AERO_F06_STOP__()');

        const summary = {
        variant: 'console',
        acted: res.acted,
        overlaysRemoved: res.removed,
        probe,
        residual: 'Document/window listeners bound before this script ran still fire.',
        fullBypass: 'Use the USERSCRIPT variant (document-start).'
    };
    window.__AERO_F06_RESULT__ = summary;
    return summary;
})();

/* ===========================================================================
 * USERSCRIPT VARIANT — the complete bypass.
 * Install in Tampermonkey/Violentmonkey with @run-at document-start.
 * Do NOT paste into the Console.
 *
 *   // ==UserScript==
 *   // @name         Aero F-06 Anti-Cheat Bypass
 *   // @namespace    http://tampermonkey.net/
 *   // @version      4.0
 *   // @description  Blocks TRITHUC5.0 anti-cheat listener registration at document-start
 *   // @match        https://trithuc500.vercel.app/*
 *   // @grant        unsafeWindow
 *   // @run-at       document-start
 *   // ==/UserScript==
 *
 * (function () {
 *     'use strict';
 *     const w = unsafeWindow;
 *     const origAdd = EventTarget.prototype.addEventListener;
 *     const origInterval = w.setInterval;
 *
 *     const BAD_TYPES = new Set([
 *         'visibilitychange', 'fullscreenchange', 'webkitfullscreenchange',
 *         'mozfullscreenchange', 'blur', 'contextmenu', 'copy', 'cut',
 *         'dragstart', 'selectstart', 'paste', 'keydown'
 *     ]);
 *     const MARKER = /triggerExamViolation|recordAISuspicion|KHIÊN BẢO MẬT|BẢO MẬT BẢN QUYỀN|showToast\(['"]🛡️|scanAndBlockAIExtensions|verifyRuntimeSecurityIntegrity/;
 *
 *     EventTarget.prototype.addEventListener = function (type, fn, opts) {
 *         let src = '';
 *         try { src = String(fn && fn.toString ? fn.toString() : ''); } catch (e) {}
 *         if (BAD_TYPES.has(String(type)) && MARKER.test(src)) return;
 *         return origAdd.call(this, type, fn, opts);
 *     };
 *
 *     w.setInterval = function (fn, ms) {
 *         let src = '';
 *         try { src = String(fn && fn.toString ? fn.toString() : ''); } catch (e) {}
 *         if (/scanAndBlockAIExtensions|verifyRuntimeSecurityIntegrity/.test(src)) return 0;
 *         return origInterval.apply(w, arguments);
 *     };
 *
 *     console.log('[Aero] F-06 bypass active (document-start)');
 * })();
 * ========================================================================= */
