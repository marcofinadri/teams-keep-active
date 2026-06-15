# Privacy Policy — Teams Keep Active

**Last updated: June 2025**

## Data collection

Teams Keep Active does **not** collect, transmit, or share any personal data.

## What the extension does

- Injects a content script into `teams.microsoft.com` and `teams.live.com` pages to prevent Microsoft Teams from detecting inactivity.
- Stores your schedule settings (enabled/disabled state, per-day time ranges, notification preference) **locally in your browser** using the `chrome.storage.sync` API.
- Stores a daily activity counter (minutes the extension was active today) in `chrome.storage.local`. This data never leaves your browser.

## chrome.storage.sync

Settings are synced across your own Chrome profiles via your Google account's Chrome sync. No data is sent to any server operated by this extension. The sync is handled entirely by Google's infrastructure under your own account.

## chrome.storage.local

The daily activity stats (minutes per day, kept for up to 30 days) are stored locally on the current device and are **not** synced to any account or external service.

## No third-party services

This extension makes no network requests of any kind. It does not use analytics, crash reporting, advertising, or any external service.

## Permissions

| Permission | Why |
|---|---|
| `storage` | To save and sync your schedule across devices |
| `alarms` | To refresh the toolbar badge and update activity stats every minute |
| `notifications` | To send an optional desktop alert when active hours end (only if you opt in) |

## Contact

For questions or concerns: open an issue at [github.com/marcofinadri/teams-keep-active](https://github.com/marcofinadri/teams-keep-active).
