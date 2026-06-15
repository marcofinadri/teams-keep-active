# Privacy Policy — Teams Keep Active

**Last updated: June 2025**

## Data collection

Teams Keep Active does **not** collect, transmit, or share any personal data.

## What the extension does

- Injects a content script into `teams.microsoft.com` and `teams.live.com` pages to prevent Microsoft Teams from detecting inactivity.
- Stores your schedule settings (enabled/disabled state, per-day time ranges) **locally in your browser** using the `chrome.storage.sync` API.

## chrome.storage.sync

Settings are synced across your own Chrome profiles via your Google account's Chrome sync. No data is sent to any server operated by this extension. The sync is handled entirely by Google's infrastructure under your own account.

## No third-party services

This extension makes no network requests of any kind. It does not use analytics, crash reporting, advertising, or any external service.

## Permissions

| Permission | Why |
|---|---|
| `storage` | To save and sync your schedule across devices |
| `alarms` | To refresh the toolbar badge when active hours change |

## Contact

For questions or concerns: open an issue at [github.com/marcofinadri/teams-keep-active](https://github.com/marcofinadri/teams-keep-active).
