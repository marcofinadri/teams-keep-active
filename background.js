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

function updateBadge() {
    chrome.storage.sync.get({ enabled: true, useSchedule: false, days: DEFAULT_DAYS }, s => {
        const on = computeActive(s);
        chrome.action.setBadgeText({ text: on ? '' : 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: on ? '#3dd68c' : '#4a4a6a' });
    });
}

chrome.runtime.onInstalled.addListener(updateBadge);

// Re-check every minute so the badge reflects schedule transitions
chrome.alarms.create('tick', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'tick') updateBadge();
});

// Instant update when settings change from the popup
chrome.storage.onChanged.addListener((_, area) => {
    if (area === 'sync') updateBadge();
});
