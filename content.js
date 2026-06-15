(function () {
    'use strict';

    const INTERVAL_MS       = 45_000;
    const IDLE_THRESHOLD_MS = 50_000;

    let lastRealActivity = Date.now();
    let keepaliveId      = null;
    let settings         = { enabled: true, useSchedule: false, startTime: '09:00', endTime: '18:00' };

    // ── 1. Track genuine user input ──────────────────────────────────────────
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(type => {
        document.addEventListener(type, e => {
            if (e.isTrusted) lastRealActivity = Date.now();
        }, { passive: true, capture: true });
    });

    // ── 2. Patch Page Visibility API ─────────────────────────────────────────
    function tryDefine(prop, getter) {
        try {
            const existingDesc = Object.getOwnPropertyDescriptor(document, prop)
                ?? Object.getOwnPropertyDescriptor(Document.prototype, prop);
            if (!existingDesc || existingDesc.configurable) {
                Object.defineProperty(document, prop, {
                    get: getter,
                    configurable: true,
                    enumerable: true,
                });
            }
        } catch (_) {}
    }

    function patchVisibility() {
        tryDefine('hidden', () => false);
        tryDefine('visibilityState', () => 'visible');
    }

    patchVisibility();
    document.addEventListener('DOMContentLoaded', patchVisibility, { once: true });
    window.addEventListener('load', patchVisibility, { once: true });

    // ── 3. Patch hasFocus ────────────────────────────────────────────────────
    try {
        const _hasFocus = Document.prototype.hasFocus;
        Document.prototype.hasFocus = function () {
            return this === document ? true : _hasFocus.call(this);
        };
    } catch (_) {}

    // ── 4. Patch userActivation ──────────────────────────────────────────────
    try {
        if (navigator.userActivation) {
            Object.defineProperty(navigator.userActivation, 'isActive',      { get: () => true, configurable: true });
            Object.defineProperty(navigator.userActivation, 'hasBeenActive', { get: () => true, configurable: true });
        }
    } catch (_) {}

    // ── 5. Schedule check ────────────────────────────────────────────────────
    function isWithinSchedule() {
        if (!settings.enabled)     return false;
        if (!settings.useSchedule) return true;

        const now = new Date();
        const cur = now.getHours() * 60 + now.getMinutes();

        const [sh, sm] = settings.startTime.split(':').map(Number);
        const [eh, em] = settings.endTime.split(':').map(Number);
        const start = sh * 60 + sm;
        const end   = eh * 60 + em;

        // Handles overnight ranges (e.g. 22:00–06:00)
        return start <= end ? cur >= start && cur <= end
                            : cur >= start || cur <= end;
    }

    // ── 6. Keepalive pulse ───────────────────────────────────────────────────
    function getTarget() {
        return document.querySelector('[data-tid="app-layout-area--main"]')
            ?? document.querySelector('[class*="app-layout"]')
            ?? document.querySelector('[class*="ts-app"]')
            ?? document.body;
    }

    function pulse() {
        if (!isWithinSchedule()) return;
        if (Date.now() - lastRealActivity < IDLE_THRESHOLD_MS) return;

        try {
            const el   = getTarget();
            const rect = el.getBoundingClientRect();
            el.dispatchEvent(new PointerEvent('pointermove', {
                bubbles:     true,
                cancelable:  false,
                clientX:     Math.round(rect.left + rect.width  / 2),
                clientY:     Math.round(rect.top  + rect.height / 2),
                pointerType: 'mouse',
                isPrimary:   true,
            }));
        } catch (_) {}
    }

    keepaliveId = setInterval(pulse, INTERVAL_MS);

    // ── 7. React to settings changes in real time ────────────────────────────
    chrome.storage.sync.get(
        { enabled: true, useSchedule: false, startTime: '09:00', endTime: '18:00' },
        s => { settings = s; }
    );

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        for (const [key, { newValue }] of Object.entries(changes)) {
            settings[key] = newValue;
        }
    });

    // ── 8. Cleanup ───────────────────────────────────────────────────────────
    window.addEventListener('beforeunload', () => clearInterval(keepaliveId), { once: true });

})();
