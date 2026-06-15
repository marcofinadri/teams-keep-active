'use strict';

// ── i18n ─────────────────────────────────────────────────────────────────────
const lang = chrome.i18n.getUILanguage();

if (['ar', 'he', 'fa', 'ur'].includes(lang.split('-')[0])) {
    document.documentElement.dir = 'rtl';
}

document.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = chrome.i18n.getMessage(el.dataset.i18n);
    if (msg) el.textContent = msg;
});

function localDayName(jsDay) {
    return new Intl.DateTimeFormat(lang, { weekday: 'short' })
        .format(new Date(2025, 0, 5 + jsDay));
}

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

// Show actual keyboard shortcut assigned by Chrome
chrome.commands.getAll(cmds => {
    const cmd = cmds.find(c => c.name === 'toggle-active');
    if (cmd?.shortcut) {
        document.getElementById('shortcut-hint').textContent = cmd.shortcut;
    }
});

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

const PRESETS = {
    workweek: {
        enabled: true, useSchedule: true,
        days: Array.from({ length: 7 }, (_, i) => ({
            active: i >= 1 && i <= 5, start: '09:00', end: '18:00',
        })),
    },
    alwayson: {
        enabled: true, useSchedule: false,
        days: Array.from({ length: 7 }, () => ({ active: true, start: '00:00', end: '23:59' })),
    },
    off: {
        enabled: false, useSchedule: false,
        days: DEFAULT_DAYS.map(d => ({ ...d })),
    },
};

const toggle      = document.getElementById('toggle');
const useSchedule = document.getElementById('useSchedule');
const notifyOnEnd = document.getElementById('notifyOnEnd');
const daysWrap    = document.getElementById('days-wrap');
const daysGrid    = document.getElementById('days-grid');
const saveBtn     = document.getElementById('save');
const saveStatus  = document.getElementById('save-status');
const statusPill  = document.getElementById('status-pill');
const statusLabel = document.getElementById('status-label');
const statsToday  = document.getElementById('stats-today');
const btnExport   = document.getElementById('btnExport');
const btnImport   = document.getElementById('btnImport');
const importFile  = document.getElementById('importFile');

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
    statusPill.className    = `status-pill ${on ? 'on' : 'off'}`;
    statusLabel.textContent = chrome.i18n.getMessage(on ? 'statusActive' : 'statusOff');
}

// ── Activity stats ────────────────────────────────────────────────────────────
function loadStats() {
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    chrome.storage.local.get({ stats: {} }, ({ stats }) => {
        const mins = stats[key] || 0;
        if (mins === 0) { statsToday.textContent = '—'; return; }
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        statsToday.textContent = h > 0 ? `${h}h ${m}m` : `${m}m`;
    });
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

// ── Apply settings to UI ──────────────────────────────────────────────────────
function applySettings(s) {
    toggle.checked      = s.enabled;
    useSchedule.checked = s.useSchedule;
    notifyOnEnd.checked = s.notifyOnEnd ?? false;
    buildGrid(s.days ?? DEFAULT_DAYS);
    daysWrap.style.display = s.useSchedule ? 'block' : 'none';
    updatePill(s);
}

function loadSettings() {
    chrome.storage.sync.get(
        { enabled: true, useSchedule: false, days: DEFAULT_DAYS, notifyOnEnd: false },
        s => applySettings(s)
    );
}

// ── Event handlers ────────────────────────────────────────────────────────────
useSchedule.addEventListener('change', () => {
    daysWrap.style.display = useSchedule.checked ? 'block' : 'none';
});

// Preset buttons — apply + auto-save immediately
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = PRESETS[btn.dataset.preset];
        if (!preset) return;
        const s = { ...preset, notifyOnEnd: notifyOnEnd.checked };
        applySettings(s);
        chrome.storage.sync.set(s, () => {
            updatePill(s);
            saveStatus.textContent = chrome.i18n.getMessage('savedOk');
            setTimeout(() => { saveStatus.textContent = ''; }, 1800);
        });
    });
});

// Export settings as JSON file
btnExport.addEventListener('click', () => {
    chrome.storage.sync.get(null, data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), {
            href: url, download: 'teams-keep-active-settings.json',
        });
        a.click();
        URL.revokeObjectURL(url);
    });
});

// Import settings from JSON file
btnImport.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const s = JSON.parse(ev.target.result);
            if (typeof s.enabled !== 'boolean') throw new Error('invalid');
            chrome.storage.sync.set(s, () => {
                loadSettings();
                loadStats();
                saveStatus.textContent = chrome.i18n.getMessage('savedOk');
                setTimeout(() => { saveStatus.textContent = ''; }, 1800);
            });
        } catch (_) {
            saveStatus.textContent = chrome.i18n.getMessage('importError');
            setTimeout(() => { saveStatus.textContent = ''; }, 2000);
        }
        importFile.value = '';
    };
    reader.readAsText(file);
});

// Save button
saveBtn.addEventListener('click', () => {
    const s = {
        enabled:     toggle.checked,
        useSchedule: useSchedule.checked,
        notifyOnEnd: notifyOnEnd.checked,
        days:        readDays(),
    };
    chrome.storage.sync.set(s, () => {
        updatePill(s);
        saveStatus.textContent = chrome.i18n.getMessage('savedOk');
        setTimeout(() => { saveStatus.textContent = ''; }, 1800);
    });
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadSettings();
loadStats();
