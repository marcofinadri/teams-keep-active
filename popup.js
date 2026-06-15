'use strict';

// Display order: Mon–Sun (JS getDay(): 0=Sun, 1=Mon … 6=Sat)
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
const status      = document.getElementById('status');

function buildGrid(days) {
    daysGrid.innerHTML = '';
    DAYS.forEach(({ idx, label }) => {
        const d   = days[idx] ?? DEFAULT_DAYS[idx];
        const row = document.createElement('div');
        row.className   = 'day-row';
        row.dataset.day = idx;
        row.innerHTML = `
            <span class="day-label">${label}</span>
            <label class="switch mini">
                <input type="checkbox" class="day-toggle" ${d.active ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <input type="time" class="day-start" value="${d.start}" ${d.active ? '' : 'disabled'}>
            <input type="time" class="day-end"   value="${d.end}"   ${d.active ? '' : 'disabled'}>
        `;
        row.querySelector('.day-toggle').addEventListener('change', e => {
            const on = e.target.checked;
            row.querySelector('.day-start').disabled = !on;
            row.querySelector('.day-end').disabled   = !on;
        });
        daysGrid.appendChild(row);
    });
}

function readDays() {
    const days = DEFAULT_DAYS.map(d => ({ ...d }));
    daysGrid.querySelectorAll('.day-row').forEach(row => {
        const idx    = Number(row.dataset.day);
        days[idx] = {
            active: row.querySelector('.day-toggle').checked,
            start:  row.querySelector('.day-start').value,
            end:    row.querySelector('.day-end').value,
        };
    });
    return days;
}

useSchedule.addEventListener('change', () => {
    daysWrap.classList.toggle('visible', useSchedule.checked);
});

chrome.storage.sync.get({ enabled: true, useSchedule: false, days: DEFAULT_DAYS }, s => {
    toggle.checked      = s.enabled;
    useSchedule.checked = s.useSchedule;
    buildGrid(s.days);
    if (s.useSchedule) daysWrap.classList.add('visible');
});

saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set({
        enabled:     toggle.checked,
        useSchedule: useSchedule.checked,
        days:        readDays(),
    }, () => {
        status.textContent = 'Saved ✓';
        setTimeout(() => { status.textContent = ''; }, 1800);
    });
});
