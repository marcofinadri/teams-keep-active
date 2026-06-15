'use strict';

const DEFAULT_DAYS = Array.from({ length: 7 }, (_, i) => ({
    active: i >= 1 && i <= 5, start: '09:00', end: '18:00',
}));

function toMin(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function inRange(cur, s, e) {
    return s <= e ? cur >= s && cur <= e : cur >= s || cur <= e;
}

function computeActive(s) {
    if (!s.enabled) return false;
    if (!s.useSchedule) return true;
    const now = new Date();
    const day = (s.days ?? DEFAULT_DAYS)[now.getDay()];
    if (!day?.active) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    return inRange(cur, toMin(day.start), toMin(day.end));
}

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getSync(defaults) {
    return new Promise(resolve => chrome.storage.sync.get(defaults, resolve));
}

async function getSession(defaults) {
    return new Promise(resolve => chrome.storage.session.get(defaults, resolve));
}

async function tick() {
    const s = await getSync({
        enabled: true, useSchedule: false, days: DEFAULT_DAYS, notifyOnEnd: false,
    });
    const on = computeActive(s);

    // Desktop notification on schedule → inactive transition
    if (s.notifyOnEnd && s.useSchedule) {
        const { prevActive } = await getSession({ prevActive: null });
        if (prevActive === true && !on) {
            chrome.notifications.create('sched-end', {
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: chrome.i18n.getMessage('extensionName'),
                message: chrome.i18n.getMessage('notifPaused'),
            });
        }
    }

    chrome.storage.session.set({ prevActive: on });

    // Activity stats — increment today's minute counter while active
    if (on) {
        const key = todayKey();
        chrome.storage.local.get({ stats: {} }, ({ stats }) => {
            stats[key] = (stats[key] || 0) + 1;
            // Keep only the last 30 days
            const keys = Object.keys(stats).sort();
            while (keys.length > 30) delete stats[keys.shift()];
            chrome.storage.local.set({ stats });
        });
    }

    // Badge
    chrome.action.setBadgeText({ text: on ? '' : 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: on ? '#3dd68c' : '#4a4a6a' });
}

// Keyboard shortcut: toggle enabled
chrome.commands.onCommand.addListener(command => {
    if (command !== 'toggle-active') return;
    chrome.storage.sync.get({ enabled: true }, s => {
        chrome.storage.sync.set({ enabled: !s.enabled }, () => tick());
    });
});

chrome.runtime.onInstalled.addListener(() => tick());

// Re-check every minute so badge and stats reflect schedule transitions
chrome.alarms.create('tick', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'tick') tick(); });

// Instant update when settings change from the popup
chrome.storage.onChanged.addListener((_, area) => { if (area === 'sync') tick(); });
