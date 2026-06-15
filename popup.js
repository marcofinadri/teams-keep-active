'use strict';

const toggle      = document.getElementById('toggle');
const useSchedule = document.getElementById('useSchedule');
const startTime   = document.getElementById('startTime');
const endTime     = document.getElementById('endTime');
const saveBtn     = document.getElementById('save');
const status      = document.getElementById('status');

function setScheduleEnabled(on) {
    startTime.disabled = !on;
    endTime.disabled   = !on;
}

useSchedule.addEventListener('change', () => setScheduleEnabled(useSchedule.checked));

chrome.storage.sync.get(
    { enabled: true, useSchedule: false, startTime: '09:00', endTime: '18:00' },
    (s) => {
        toggle.checked      = s.enabled;
        useSchedule.checked = s.useSchedule;
        startTime.value     = s.startTime;
        endTime.value       = s.endTime;
        setScheduleEnabled(s.useSchedule);
    }
);

saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set({
        enabled:     toggle.checked,
        useSchedule: useSchedule.checked,
        startTime:   startTime.value,
        endTime:     endTime.value,
    }, () => {
        status.textContent = 'Saved ✓';
        setTimeout(() => { status.textContent = ''; }, 1800);
    });
});
