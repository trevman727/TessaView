# TessaView — multi-video viewer

Independent video queues, with YouTube videos and Twitch channels/VODs, multiple layouts and adjustable grid dividers. Desktop-first.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. `npm install`
3. `npm run dev`
4. Open the localhost address shown in the terminal.

For a production build, run `npm run build`.

## Notes

- YouTube videos advance to the next queue item when they end; the finished item is removed, matching the original behavior. Initial playback is subject to browser autoplay restrictions.
- Twitch channels remain in place when they go offline. Twitch VODs do **not** auto-advance.
- Twitch embeds require HTTPS and the correct `parent` domain; localhost testing may behave differently from deployment. Twitch requires a player at least 400×300 px.
- Queues migrate from the original `playlist-panel-N` browser storage format when using the same origin. Storage is per-domain, so a new domain won't automatically have the old queues.
- No Electron/desktop packaging, accounts, backend, analytics or monetization.

## Rebranding and saved settings

TessaView imports saved layout and divider preferences from the previous `quadview-layout` and `quadview-sizes` browser storage keys when running on the same origin, then saves preferences under `tessaview-layout` and `tessaview-sizes`. Video queues and playback progress retain their existing storage keys to preserve user data. Changing the website domain does not automatically transfer browser storage.
