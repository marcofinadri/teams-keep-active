(function () {
    'use strict';

    const INTERVAL_MS       = 45_000;
    const IDLE_THRESHOLD_MS = 50_000;

    const DEFAULT_DAYS = Array.from({ length: 7 }, (_, i) => ({
        active: i >= 1 && i <= 5,
        start:  '09:00',
        end:    '18:00',
    }));

    let lastRealActivity = Date.now();
    let keepaliveId      = null;
    let settings         = { enabled: true, useSchedule: false, days: DEFAULT_DAYS };

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(type => {
        document.addEventListener(type, e => {
            if (e.isTrusted) lastRealActivity = Date.now();
        }, { passive: true, capture: true });
    });

    function tryDefine(prop, getter) {
        try {
            const desc = Object.getOwnPropertyDescriptor(document, prop)
                ?? Object.getOwnPropertyDescriptor(Document.prototype, prop);
            if (!desc || desc.configurable) {
                Object.defineProperty(document, prop, { get: getter, configurable: true, enumerable: true });
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

    try {
        const _hasFocus = Document.prototype.hasFocus;
        Document.prototype.hasFocus = function () {
            return this === document ? true : _hasFocus.call(this);
        };
    } catch (_) {}

    try {
        if (navigator.userActivation) {
            Object.defineProperty(navigator.userActivation, 'isActive',      { get: () => true, configurable: true });
            Object.defineProperty(navigator.userActivation, 'hasBeenActive', { get: () => true, configurable: true });
        }
    } catch (_) {}

    function inRange(cur, start, end) {
        // start > end means the range crosses midnight (e.g. 22:00–06:00)
        return start <= end ? cur >= start && cur <= end
                            : cur >= start || cur <= end;
    }

    function isWithinSchedule() {
        if (!settings.enabled)     return false;
        if (!settings.useSchedule) return true;

        const now  = new Date();
        const day  = (settings.days ?? DEFAULT_DAYS)[now.getDay()];
        if (!day?.active) return false;

        const cur            = now.getHours() * 60 + now.getMinutes();
        const [sh, sm]       = day.start.split(':').map(Number);
        const [eh, em]       = day.end.split(':').map(Number);
        return inRange(cur, sh * 60 + sm, eh * 60 + em);
    }

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

    chrome.storage.sync.get({ enabled: true, useSchedule: false, days: DEFAULT_DAYS }, s => {
        settings = s;
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        for (const [key, { newValue }] of Object.entries(changes)) settings[key] = newValue;
    });

    window.addEventListener('beforeunload', () => clearInterval(keepaliveId), { once: true });

})();
