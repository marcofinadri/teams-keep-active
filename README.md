# ⚡ Teams Keep Active

> Prevents Microsoft Teams from setting your status to **Away** — schedule it by day and time range so you're never caught offline at the wrong moment.

Available for Chrome, Edge, Brave, Arc, Opera, and all Chromium-based browsers.

---

## Features

| Feature | Description |
|---|---|
| **Per-day scheduling** | Independent on/off + time range for each day of the week |
| **Overnight ranges** | Ranges that cross midnight work correctly (e.g. 22:00 → 06:00) |
| **Quick presets** | One-click: Work week, Always on, Turn off |
| **Keyboard shortcut** | Ctrl+Shift+K / ⌘⇧K to toggle without opening the popup |
| **Master toggle** | Disable instantly without uninstalling |
| **Badge indicator** | Toolbar icon shows "OFF" when inactive |
| **Schedule notifications** | Optional desktop alert when active hours end |
| **Import / Export** | Back up settings to JSON and restore on any device |
| **Activity stats** | Today's active-minutes counter in the popup |
| **Real-time sync** | Changes take effect immediately; no tab reload needed |
| **Zero visual interference** | Nothing moves on screen, no keystrokes, no cursor jumps |
| **20 languages** | Auto-detected from browser locale (AR, BN, DE, EN, ES, FR, HI, ID, IT, JA, KO, NL, PL, PT, RU, TH, TR, UK, VI, ZH_CN) |
| **12 h / 24 h** | Overnight hint and day names adapt to the user's locale automatically |

---

## Installation

### Chrome Web Store *(coming soon)*

### Manual (Developer Mode)

1. Clone or download this repository
2. Open `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer mode**
4. Click **Load unpacked** and select the repository folder

---

## How it works

Microsoft Teams detects inactivity through browser events and the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). When you switch tabs, minimize the window, or stop interacting, Teams changes your status to Away after a few minutes.

This extension patches those detection mechanisms at the browser level:

| Mechanism | Patch |
|---|---|
| `document.hidden` | Always returns `false` |
| `document.visibilityState` | Always returns `"visible"` |
| `document.hasFocus()` | Always returns `true` |
| `navigator.userActivation` | Always reports active |
| Idle timer | A silent `PointerEvent` every 45 s (only when idle > 50 s and within schedule) |

Everything runs **inside the Teams tab**. No background HTTP requests, no external servers, no data collected.

---

## Compatibility

| Environment | Works |
|---|---|
| Teams web (`teams.microsoft.com`) — Chrome, Edge, Brave, Arc, Opera | ✅ |
| Teams Personal (`teams.live.com`) | ✅ |
| Teams PWA (installed from Chrome or Edge) | ✅ |
| Teams Desktop App (Electron installer from microsoft.com) | ❌ |
| Teams tab closed | ❌ |
| Firefox / Safari | ❌ |

> **Note:** the extension requires the Teams tab or PWA window to remain open. It cannot act on a closed tab.

---

## Keyboard shortcut

The default shortcut is **Ctrl+Shift+K** (Windows/Linux) or **⌘⇧K** (Mac).  
You can change it at `chrome://extensions/shortcuts`.

---

## Project structure

```
teams-keep-active/
├── manifest.json          # Extension manifest (MV3, v1.5.0)
├── content.js             # Injected into Teams pages
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic + i18n + presets + import/export
├── background.js          # Service worker — badge, notifications, stats
├── icons/                 # PNG icons (16, 32, 48, 128 px)
├── _locales/              # Chrome i18n message files (20 languages)
│   └── {lang}/messages.json
├── store/                 # Chrome Web Store copy
│   └── {lang}/
│       ├── short.txt      # ≤ 132 characters
│       └── full.txt       # Full description
├── privacy-policy.md
└── LICENSE
```

---

## Privacy

No data is collected. No network requests are made. Settings are stored locally via `chrome.storage.sync`. Activity stats are stored via `chrome.storage.local` — they never leave your browser. See [privacy-policy.md](privacy-policy.md) for details.

---

## Contributing

Pull requests are welcome. Please open an issue first for major changes.

---

## License

[MIT](LICENSE) © 2025 Marco Finadri
