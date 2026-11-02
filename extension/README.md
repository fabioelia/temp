# Dub Studio Capture (Chrome extension)

Records the audio of a video playing on a web page together with its caption track, and saves a package that Dub Studio's Voice Lab imports with **Add audio + captions…**.

Use it only on video you own or are licensed to use: your own review links, private uploads, or your company's player. It does not record DRM-protected video (players using Encrypted Media Extensions). Voices trained from captures still need the talent's release details in Dub Studio.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this `extension/` folder.
3. Pin **Dub Studio Capture** to the toolbar.

## Use

1. Open the page with the video and click the extension icon.
2. Pick the video and its caption track, then click **Start recording**.
3. Play the part you want; the tab stays audible. Captions are collected as they play.
4. Click **Stop & save**. Three files go to `Downloads/dub-capture/`:
   - `<title>-<time>.webm`: the tab audio (Opus).
   - `<title>-<time>.vtt`: caption lines, re-timed to the recording.
   - `<title>-<time>.json`: source URL, title, length and line count.
5. In Dub Studio, go to Voice Lab → **Add audio + captions…** and select the `.webm` and `.vtt` together. If the captions name speakers (`<v Name>` tags or `NAME:` prefixes), pick which character's lines to use.
6. Dub Studio checks the caption timing against the speech in the audio, using Silero VAD over the first 4 minutes within ±15 s. It shifts the captions if they are clearly off, and tells you how much. Use ▶ to listen, and type a number in the offset box to override.

## Captions from the network

Many players never expose captions as a `<track>`. They fetch `.vtt` files or HLS WebVTT segments themselves. When you open the popup, the extension also looks for those:
- **Files already loaded:** caption files the page fetched earlier are found in its resource timeline and fetched again inside the page, with the page's own credentials.
- **Files loaded while recording:** the page's `fetch` and XHR are watched for new `.vtt`, `.srt` and `.m3u8` subtitle responses. HLS subtitle playlists have their segments fetched too, up to 600.
- **One choice per stream:** segment files are grouped per stream (e.g. `…/eng/seg_#.vtt`) and listed as **Network: …** in the Captions menu.
- **Segment timing:** each segment's `X-TIMESTAMP-MAP` is applied so segments line up with each other. Any constant offset left over is removed by Dub Studio's alignment on import (see below).

Audio always comes from tab capture. The extension doesn't download media segments.

## How it works

- `content.js` lists `<video>` elements and their `textTracks`, refuses any video with `mediaKeys` set (DRM), and logs playback time every 250 ms while recording.
- `background.js` gets a tab-capture stream ID. Cues are mapped from video time to recording time through the playback log, so pauses and seeks are handled; lines that didn't play are dropped.
- `offscreen.js` records the stream with `MediaRecorder` and plays it back so the tab isn't muted.

## Limits

- Only captions exposed as `<track>` / `textTracks` are captured. Players that draw captions in their own HTML are not supported yet.
- Tab audio includes music and effects. Prefer clean dialogue when you have it; the Voice Lab's voice separation can help otherwise.
