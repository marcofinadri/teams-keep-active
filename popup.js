'use strict';

const toggle      = document.getElementById('toggle');
const useSchedule = document.getElementById('useSchedule');
const schedBlock  = document.getElementById('scheduleBlock');
const startTime   = document.getElementById('startTime');
const endTime     = document.getElementById('endTime');
const saveBtn     = document.getElementById('save');
const status      = document.getElementById('status');

// Show/hide schedule block
useSchedule.addEventListener('change', () => {
    schedBlock.classList.toggle('visible', useSchedule.checked);
});

// Load saved settings
chrome.storage.sync.get(
    { enabled: true, useSchedule: false, startTime: '09:00', endTime: '18:00' },
    (s) => {
        toggle.checked      = s.enabled;
        useSchedule.checked = s.useSchedule;
        startTime.value     = s.startTime;
        endTime.value       = s.endTime;
        if (s.useSchedule) schedBlock.classList.add('visible');
    }
);

// Save and notify content script
saveBtn.addEventListener('click', () => {
    const settings = {
        enabled:     toggle.checked,
        useSchedule: useSchedule.checked,
        startTime:   startTime.value,
        endTime:     endTime.value,
    };

    chrome.storage.sync.set(settings, () => {
        status.textContent = 'Salvato ✓';
        setTimeout(() => { status.textContent = ''; }, 1800);
    });
});
