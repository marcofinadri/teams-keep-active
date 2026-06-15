'use strict';

// ── i18n ─────────────────────────────────────────────────────────────────────
const lang = chrome.i18n.getUILanguage();

// RTL languages
if (['ar', 'he', 'fa', 'ur'].includes(lang.split('-')[0])) {
    document.documentElement.dir = 'rtl';
}

document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
});

// Locale-aware day names (Mon–Sun display order)
// Jan 5 2025 = Sunday, so jsDay 0 → +0, jsDay 1 → +1, etc.
function localDayName(jsDay) {
    return new Intl.DateTimeFormat(lang, { weekday: 'short' })
        .format(new Date(2025, 0, 5 + jsDay));
}

// Locale-aware time format for overnight hint
function formatHint() {
    const use12h = new Intl.DateTimeFormat(lang, { hour: 'numeric' })
        .resolvedOptions().hour12;
    const opts = use12h
        ? { hour: 'numeric', minute: '2-digit', hour12: true }
        : { hour: '2-digit', minute: '2-digit', hour12: false };
    const t1 = new Intl.DateTimeFormat(lang, opts).format(new Date(2000, 0, 1, 22, 0));
    const t2 = new Intl.DateTimeFormat(lang, opts).format(new Date(2000, 0, 1,  6, 0));
    return chrome.i18n.getMessage('hintOvernight', [t1, t2]);
}

document.getElementById('hint-overnight').textContent = formatHint();

// ── State ─────────────────────────────────────────────────────────────────────
const DAYS = [
    { idx: 1 }, { idx: 2 }, { idx: 3 }, { idx: 4 },
    { idx: 5 }, { idx: 6 }, { idx: 0 },
];

const DEFAULT_DAYS = Array.from({ length: 7 }, (_, i) => ({
    active: i >= 1 && i <= 5,
    start:  '09:00',
    end:    '18:00',
}));

const toggle      = document.getElementById('toggle');
const useSchedule = document.getElementById('useSchedule');
const daysWrap    = document.getElementById('days-wrap');
const daysGrid    = document.getElementById('days-grid');
const saveBtn     = document.getElementById('save');
const saveStatus  = document.getElementById('save-status');
const statusPill  = document.getElementById('status-pill');
const statusLabel = document.getElementById('status-label');

// ── Schedule helpers ──────────────────────────────────────────────────────────
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
    return inRange(now.getHours() * 60 + now.getMinutes(), toMin(day.start), toMin(day.end));
}

function updatePill(s) {
    const on = computeActive(s);
    statusPill.className  = `status-pill ${on ? 'on' : 'off'}`;
    statusLabel.textContent = chrome.i18n.getMessage(on ? 'statusActive' : 'statusOff');
}

// ── Days grid ─────────────────────────────────────────────────────────────────
function buildGrid(days) {
    daysGrid.innerHTML = '';
    DAYS.forEach(({ idx }) => {
        const d   = days[idx] ?? DEFAULT_DAYS[idx];
        const row = document.createElement('div');
        row.className   = `day-row ${d.active ? 'day-on' : ''}`;
        row.dataset.day = idx;
        row.innerHTML = `
            <span class="day-name">${localDayName(idx)}</span>
            <label class="toggle sm">
                <input type="checkbox" class="day-toggle" ${d.active ? 'checked' : ''}>
                <span class="toggle-track"></span>
            </label>
            <input type="time" class="day-start" value="${d.start}" ${d.active ? '' : 'disabled'}>
            <input type="time" class="day-end"   value="${d.end}"   ${d.active ? '' : 'disabled'}>
        `;
        row.querySelector('.day-toggle').addEventListener('change', e => {
            const on = e.target.checked;
            row.classList.toggle('day-on', on);
            row.querySelector('.day-start').disabled = !on;
            row.querySelector('.day-end').disabled   = !on;
        });
        daysGrid.appendChild(row);
    });
}

function readDays() {
    const days = DEFAULT_DAYS.map(d => ({ ...d }));
    daysGrid.querySelectorAll('.day-row').forEach(row => {
        const idx = Number(row.dataset.day);
        days[idx] = {
            active: row.querySelector('.day-toggle').checked,
            start:  row.querySelector('.day-start').value,
            end:    row.querySelector('.day-end').value,
        };
    });
    return days;
}

// ── Init ──────────────────────────────────────────────────────────────────────
useSchedule.addEventListener('change', () => {
    daysWrap.style.display = useSchedule.checked ? 'block' : 'none';
});

chrome.storage.sync.get({ enabled: true, useSchedule: false, days: DEFAULT_DAYS }, s => {
    toggle.checked      = s.enabled;
    useSchedule.checked = s.useSchedule;
    buildGrid(s.days);
    if (s.useSchedule) daysWrap.style.display = 'block';
    updatePill(s);
});

saveBtn.addEventListener('click', () => {
    const s = {
        enabled:     toggle.checked,
        useSchedule: useSchedule.checked,
        days:        readDays(),
    };
    chrome.storage.sync.set(s, () => {
        updatePill(s);
        saveStatus.textContent = chrome.i18n.getMessage('savedOk');
        setTimeout(() => { saveStatus.textContent = ''; }, 1800);
    });
});
