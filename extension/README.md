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
5. In Dub Studio, go to Voice Lab → **Add audio + captions…** and select the `.webm` and `.vtt` together. (The importer also reads your own `.srt`, `.ttml`, `.dfxp` and IMSC `.xml` deliverables.) If the captions name speakers (`<v Name>` tags or `NAME:` prefixes), pick which character's lines to use.
6. Dub Studio checks the caption timing against the speech in the audio, using Silero VAD over the first 4 minutes within ±15 s. It shifts the captions if they are clearly off, and tells you how much. Use ▶ to listen, and type a number in the offset box to override.

## Captions from the network

Many players never expose captions as a `<track>`. They fetch `.vtt` files or HLS WebVTT segments themselves. When you open the popup, the extension also looks for those:
- **Files already loaded:** caption files the page fetched earlier are found in its resource timeline and fetched again inside the page, with the page's own credentials.
- **Files loaded while recording:** the page's `fetch` and XHR are watched for new `.vtt`, `.srt` and `.m3u8` subtitle responses. HLS subtitle playlists have their segments fetched too, up to 600.
- **One choice per stream:** segment files are grouped per stream (e.g. `…/eng/seg_#.vtt`) and listed as **Network: …** in the Captions menu.
- **DASH manifests:** `.mpd` manifests the page loads are read for text tracks (`text/vtt`, TTML and `stpp` IMSC), using `BaseURL` files or `SegmentTemplate` segments (`$Number$` and `SegmentTimeline`). Each track is labelled with its language, `Label` and `Role`.
- **Player configs:** many players get their subtitle list as JSON from an API. The extension watches the JSON the page parses (read-only) for subtitle tracks. A track is any object with a subtitle type, or an entry in a list whose key names subtitles, captions or text tracks. Under each track it gathers every file address, including nested per-format maps and lists of mirror URLs. It fetches the best format first (WebVTT, then TTML/IMSC/DFXP, then SRT) and falls back to the next one if a fetch fails. Language, name, **forced** and **CC/SDH** flags go into the label; picture-based subtitles are skipped. Relative addresses are resolved against the page. Nothing the page sends is changed. The approach is generalized from the greasyfork "subtitle downloader" userscript, without its site-specific keys or request rewriting.
- **TTML / DFXP / IMSC:** `.ttml` and `.dfxp` files, and responses served as TTML, are converted to WebVTT inside the page, keeping speaker names from `ttm:agent`.
- **Segment timing:** each segment's `X-TIMESTAMP-MAP` is applied so segments line up with each other. Any constant offset left over is removed by Dub Studio's alignment on import (see below).

**Save all network caption tracks** (popup button) saves every track found, in every language, as separate `.vtt` files plus an `index.json` in `Downloads/dub-capture/<page>-captions/`. Times stay on the video's own timeline, and nothing is recorded. On a page with protected video, the same rule as recording applies: release builds refuse, and dev builds need the sign-off, which is saved in `index.json`.

**What is playing:** the capture's `.json` records the title or episode as the page declares it. Sources, in order:
- `<meta name="dub:series|dub:season|dub:episode|dub:title">` tags (add these to your own players)
- schema.org JSON-LD (`TVEpisode` or `Movie`, with `partOfSeries`, `partOfSeason` and `episodeNumber`)
- `og:title`
- an "S1:E3"-style label in the page title

It also gets a key such as `series-slug/s01e03`. Pick the `.json` with the captions in Dub Studio's **Captions…** and lines are grouped under that episode.

Audio always comes from tab capture. The extension doesn't download media segments.

## How it works

- `content.js` lists `<video>` elements and their `textTracks`, flags any video with `mediaKeys` set (DRM), which release builds always refuse (see below), and logs playback time every 250 ms while recording.
- `background.js` gets a tab-capture stream ID. Cues are mapped from video time to recording time through the playback log, so pauses and seeks are handled; lines that didn't play are dropped.
- `offscreen.js` records the stream with `MediaRecorder` and plays it back so the tab isn't muted.

## Dev and release builds

`config.js` holds the build flag:
- **Development (`extension/`, `devBuild: true`):** for protected (DRM) video, the popup asks for a sign-off: your name, a rights or approval reference, and a confirmation that you own or are licensed to record the content and the use is approved. Recording unlocks once it's filled in. The sign-off is saved in the capture's `.json` file, together with the page address and time.
- **Release (`python3 tools/build_extension.py`):** builds `dist/` with `devBuild: false`. Protected video is never recorded, and there is no sign-off option.

Whether Chrome's tab capture delivers audio for a given protected player depends on the player and platform. Check that the saved `.webm` has sound.

## When it finds no video

The popup says what it found and in how many frames:
- **Player in another site's frame** (embedded players): the popup names the frame's site and offers **Allow access to …**. Grant it once and the scan includes that frame.
- **Web-component players** (`<video>` inside a shadow root) are found automatically, as long as the shadow root is open.
- **Player uses DRM:** release builds won't record it. Dev builds record it after the sign-off. Export from your source files where you can.
- **Canvas or audio-only players** aren't supported yet.

## Limits

- Only captions exposed as `<track>` / `textTracks` are captured. Players that draw captions in their own HTML are not supported yet.
- Tab audio includes music and effects. Prefer clean dialogue when you have it; the Voice Lab's voice separation can help otherwise.
