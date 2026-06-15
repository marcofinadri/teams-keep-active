'use strict';

const DAYS = [
    { idx: 1, label: 'Mon' },
    { idx: 2, label: 'Tue' },
    { idx: 3, label: 'Wed' },
    { idx: 4, label: 'Thu' },
    { idx: 5, label: 'Fri' },
    { idx: 6, label: 'Sat' },
    { idx: 0, label: 'Sun' },
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

function toMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function inRange(cur, start, end) {
    return start <= end ? cur >= start && cur <= end
                        : cur >= start || cur <= end;
}

function computeActive(s) {
    if (!s.enabled) return false;
    if (!s.useSchedule) return true;
    const now = new Date();
    const day = (s.days ?? DEFAULT_DAYS)[now.getDay()];
    if (!day?.active) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    return inRange(cur, toMinutes(day.start), toMinutes(day.end));
}

function updateStatusPill(s) {
    const on = computeActive(s);
    statusPill.className = `status-pill ${on ? 'on' : 'off'}`;
    statusLabel.textContent = on ? 'Active' : 'Off';
}

function buildGrid(days) {
    daysGrid.innerHTML = '';
    DAYS.forEach(({ idx, label }) => {
        const d   = days[idx] ?? DEFAULT_DAYS[idx];
        const row = document.createElement('div');
        row.className   = `day-row ${d.active ? 'day-on' : ''}`;
        row.dataset.day = idx;
        row.innerHTML = `
            <span class="day-name">${label}</span>
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

useSchedule.addEventListener('change', () => {
    daysWrap.style.display = useSchedule.checked ? 'block' : 'none';
});

chrome.storage.sync.get({ enabled: true, useSchedule: false, days: DEFAULT_DAYS }, s => {
    toggle.checked      = s.enabled;
    useSchedule.checked = s.useSchedule;
    buildGrid(s.days);
    if (s.useSchedule) daysWrap.style.display = 'block';
    updateStatusPill(s);
});

saveBtn.addEventListener('click', () => {
    const s = {
        enabled:     toggle.checked,
        useSchedule: useSchedule.checked,
        days:        readDays(),
    };
    chrome.storage.sync.set(s, () => {
        updateStatusPill(s);
        saveStatus.textContent = 'Saved ✓';
        setTimeout(() => { saveStatus.textContent = ''; }, 1800);
    });
});
