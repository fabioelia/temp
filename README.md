# temp

## speaker-transcriber.html

A single self-contained HTML page that transcribes audio or video **in the browser** and tags every line with the voice that said it.

- **Transcription:** OpenAI Whisper (ONNX) via [Transformers.js](https://github.com/huggingface/transformers.js), running on WebGPU when available or WebAssembly otherwise.
- **Who spoke when:** pyannote `segmentation-3.0` finds speech and speaker changes; WeSpeaker ResNet34 voice embeddings are clustered into global speakers (the same recipe as the pyannote 3.x pipeline).
- **Names, not "Speaker 1":** enroll known voices once (from a file, the microphone, or straight from a finished transcript) and matching speakers are named automatically next time. Rename, merge and reassign lines by clicking a speaker chip.
- **Word-level alignment** (with Whisper models exported with attention outputs), click-to-seek, live playback highlighting, and TXT / SRT / VTT / JSON export.

Open the file in a modern browser (Chrome or Edge 113+ recommended for WebGPU). The page itself has no dependencies; the Transformers.js library is loaded from jsDelivr and the models from the Hugging Face Hub on first use, then cached by the browser. No audio ever leaves the machine.

## dub-studio.html

A single self-contained HTML page that **dubs video into another language in the browser**, either live while it plays or as a finished, editable dub.

- **Listen:** Whisper (Transformers.js) transcribes the dialogue, or translates it straight to English, on WebGPU or WebAssembly.
- **Translate:** on device (Whisper → English, then Opus-MT into Spanish, French, German, Portuguese, Italian, Russian, Chinese, Hindi and more), or with Claude via your own Anthropic API key. Claude translates whole scenes at once, keeping character voice, consistent names and line lengths that fit the time on screen.
- **Voice cast:** each character gets their own synthetic voice. Pick a style preset (young hero, proud rival, old mentor, villain…), choose a voice, and adjust pitch and pace. Voices come from [Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) (natural, English, on device) or the browser's built-in voices (any language, lowest latency). Lines are sped up automatically when they would overrun the time the character has.
- **Dialogue replacement:** a neural model ([TIGER-DnR](https://huggingface.co/audiojs/tiger-dnr), Apache-2.0, 7 MB) removes the original dialogue and keeps the music and effects. The dubbed voices play over that bed in sync with the picture, and the bed and the finished mix export as WAV. Live dubbing, which has no bed, ducks the original and cancels its centre channel instead.
- **Characters:** see *Characters* below. The app finds who speaks when in a video, matches voices to your character library, and dubs each character with their own voice.
- **Live modes:** dub the loaded video, another browser tab (via screen-share audio) or the microphone in real time (about 1–3 s behind with WebGPU). The voice for each live line is chosen by how high or low the speaker sounds.
- **Characters from Speaker Transcriber:** import a JSON export from `speaker-transcriber.html` and its named speakers become the cast, each with their own voice.
- **Captions in, not just speech recognition:** load a `.vtt`, `.srt` or TTML/DFXP/IMSC file with the video. Its lines are used instead of Whisper and aligned to the speech automatically, and any speaker names in it identify the characters.
- **Export:** time-aligned dub track (WAV), music + effects bed (WAV), full dubbed mix (WAV), translated subtitles (SRT), the dub project (JSON), or a real-time recording of the dubbed video (WebM).
- **Voice Lab:** train a custom voice from a voice actor's recordings, on device (WebGPU, including Apple Silicon). See below.

### Characters

The flow for re-using your actors' characters across shows:

1. **Learn the cast from a video they appear in.** Load the video (and its captions if you have them), then press **Find characters**.
   - The dialogue is separated from the music first.
   - Each line, from the captions or from Whisper, is voice-printed with WeSpeaker.
   - Lines are attributed in this order: by the speaker names in the captions, by voice against the character library, then grouped by voice ("Voice A", "Voice B"…).
2. **Review on the timeline.** Each character gets a lane showing when they speak. Click a block to play that line.
   - Reassign a line, nudge its start or end by 0.1 s, or fix its text.
   - Name a voice. Typing an existing character's name merges the two.
   - While the video plays, press **M** at the start of a line and again at its end to mark it yourself. It is transcribed and voice-printed.
3. **Save to library.** Each named character keeps a voice print (averaged over every video), plus their lines as training clips: audio from the separated dialogue, with text. The library lives in the browser (IndexedDB).
4. **Train their voice.** **Train voice…** loads a character's lines into the Voice Lab. When you save the trained voice, the character uses it automatically.
5. **Dub a new video.** Load it (with captions if available) and press **Prepare full dub**. Lines are matched to library characters by caption name or by voice, translated, and spoken in each character's voice over the music + effects bed.
   - Check the timeline first, and fix any line whose character is shown with a "?".

**Identifying the content, captions and timeline** (generic parts adapted from the CleanCut scene-filter work):
- **Which episode:** each video is identified as a series and episode (key `series-slug/s01e03`), or a title and year for films. Dub Studio reads this from file names like `Show.S01E03…`, `1x03` and `Season 1 Episode 3`. A capture's `.json` from the extension, picked together with the captions, gives what the page declared instead. Library sources are grouped by that key, so another encode of the same episode doesn't count twice.
- **Captions:**
  - HTML entities are decoded.
  - A cue holding two speakers ("- Are you coming? / - In a minute.") is split into two lines, with its time shared in proportion to each part's length.
  - Sung lines (♪ … ♪) aren't treated as dialogue.
- **Timeline:** SDH sound descriptions (`[door slams]`, `(sighs)`, ♪) become *Music* and *Effects* lanes under the character lanes. Events less than 2 s apart join into one segment. These lanes show where the music + effects bed has to keep sound.
- **Not adopted:** CleanCut's Netflix and Prime Video adapters, which read those services' private player data.

**Measured** on test material built from known parts, so the truth is exact.

*Recognition with several lines per character* (the normal case):
- **Setup:** 8 LibriSpeech speakers (4 women, 4 men) over the *Tears of Steel* music and effects. Episode 1 has 6 captioned lines per speaker, named. Episode 2 has 4 *different* lines per speaker, unnamed.
- **Result:** 32 of 32 episode-2 lines got the right character.
- **With fewer learning lines per character:**
  - 1 line: 29 correct, 1 wrong, 2 left for review.
  - 2 lines: 29 correct, 1 wrong (flagged "?"), 2 for review.
  - 3 lines: 30 correct, 0 wrong, 2 for review, both with the right first suggestion.

*The hard case: one short line per character, all recorded alike.* Here 8 FLEURS speakers read Japanese over the same bed.
- **Full in-app run** (separation, recognition, Whisper translation, Kokoro voices, exports): 3 of 8 lines matched automatically. The rest were left for review or matched with a "?".
- **Why it's hard:** recordings from one source sound alike to the voice-print model; different speakers scored 0.6–0.85.
- **Two changes that help:**
  - Prints are centred on the episode's average when it has at least 6 voice-printed lines.
  - Each line is voice-printed across its whole length (3 s windows, averaged) rather than its middle.
  - Offline, these raised the right speaker to first place for 6–7 of 8 lines, up from 4–5.

*Dialogue removal*, measured on the 8-speaker Japanese episode against the true stems:
- Music and effects are kept: correlation with the true bed 0.997 away from dialogue, 0.91 under it, same level.
- **The model under-removes non-English speech.** TIGER-DnR (trained on English) estimated the Japanese dialogue at 0.84× its real level. The app now scales its subtraction per second to leave the bed uncorrelated with the dialogue, measured from the audio itself.
  - In the full in-app run, that cut the Japanese left in the bed from 12.5% to 6.0%, with music and effects unchanged.
  - On English (*Tears of Steel*) the factor stays at 1.00 and nothing changes; English dialogue drops about 20 dB.
- **Tried, and not better:**
  - a second separation pass (it finds no more dialogue)
  - MRX alone (leaves more dialogue) or combined with TIGER
  - a bed rebuilt from the music and effects stems, or with soft masks
  - dipping the speech band (costs 1–3 dB of real effects)
- **[BandIt v2](https://github.com/kwatcharasupat/bandit-v2), the multilingual DnR v3 checkpoint, tested and not adopted.** Its forward pass was rewritten from the paper and repository, and only its weight tensors were loaded, through a reader that runs nothing from the file.
  - On the same Japanese episode it left *more* dialogue than TIGER: 17.2% coherent alone, 13.0% with self-calibration.
  - Combined with TIGER (the larger of the two estimates per frequency bin, plus self-calibration) it reached 7.3%, against TIGER's 9.0%. That's two models' compute and 63 M more parameters for a small gain, with slightly worse music and effects.
- **Where it stands:** TIGER plus self-calibration is the best trade-off among the open models tested (TIGER-DnR, MRX, BandIt v2 multilingual). All of them land around −8 to −9 dB on non-English speech. Removing more would take a separator fine-tuned on dialogue in your production's languages.

*Speed:* separation runs 12 s windows through a 7 MB model. On a 4-core CPU without WebGPU, 70 s of audio took about 11–12 minutes on *Fast*. WebGPU on Apple Silicon should be much faster; time one episode before planning a full season.

Voice prints need the separated dialogue: on a full mix with music underneath they are close to chance. Very short lines (under about 1.5 s) are the least reliable. Separation runs in 12 s segments; set the speed/quality trade-off under *Advanced → Separation*. It is fast on WebGPU and slow on CPU-only machines.

### Voice Lab

Trains a Kokoro voice that sounds like a specific voice actor from your roster, without leaving the browser.

1. **Recordings:** upload or record 1–5 minutes of the talent's clean solo speech, or **extract it from a video**: the app separates the dialogue from music and effects (TIGER-DnR in ONNX Runtime Web, with the STFT done in JavaScript), finds speech, voice-prints 2 s windows with WeSpeaker, and groups them into voices. Listen to each voice and pick one to use as training audio. Characters saved in the character library can be loaded here with one click (**Train voice…**).
2. **Release on file:** enter the talent's release or contract reference and who approved it, and confirm the release covers a synthetic voice. Training unlocks once this is filled in, and the reference is saved with the voice and its exports.
3. **Training:** two methods.
   - **Deep training (recommended):** real gradient-based fine-tuning in the browser. The decoder's style layers (37k parameters, AdaSpeech-style) are trained on the talent's own sentences, which Whisper transcribes and which are aligned to the audio with real pitch and energy. A training-step graph exported from PyTorch computes the loss and gradients on WebGPU through ONNX Runtime Web, and Adam runs in JavaScript. In a benchmark on a LibriSpeech reader (90 s of audio, 300 steps), similarity of new sentences to held-out recordings went from 0.08 (closest stock voice) to 0.40. It needs about 190 MB of models in `models/kokoro-train/`, downloaded once, and English training audio. How it works and how to rebuild the models: [`tools/kokoro-train/README.md`](tools/kokoro-train/README.md).
   - **Quick match:** Kokoro voices are tables of style vectors. Training starts from the closest blend of stock voices and then runs an adaptive random walk (a (1+1) evolution strategy) through that space. Each candidate speaks probe sentences, gets voice-printed, and is kept when it sits closer to the talent. The final score is measured on a sentence the search never used. A few hundred steps take minutes with WebGPU.
4. **Use:** saved voices live in the browser (IndexedDB), appear in every character's voice list and in the **Speak** panel (type text, hear it, download a WAV), and export or import as `.voice.json` with their release record.

What to expect: the trained voice moves toward the talent's timbre and pitch, but it is not a studio-grade clone. Kokoro speaks English only, and very unusual voices (children, creatures, heavy effects) land further away.

Stock and preset voices are generic synthetic voices. Use the app with video you have the rights to and voices whose owners have agreed.

## test-media/

Small, openly licensed clips for testing both tools: a *Tears of Steel* excerpt with subtitles in eight languages, Japanese read speech from FLEURS, and LibriSpeech readers for measuring Voice Lab training. Sources and licenses are in [`test-media/SOURCES.md`](test-media/SOURCES.md).

## audio8-lab.html

A test page for [Audio8 TTS Preview 0.6B](https://huggingface.co/Edge0/Audio8-TTS-Preview-0.6b) (Apache-2.0) running in the browser with ONNX Runtime Web. It does multilingual speech (11 languages) and zero-shot voice cloning from a 5–15 s reference recording plus its transcript. Cloning asks for the talent's release details, as in the Voice Lab.

- Model files: the official INT4 ONNX build streams from Hugging Face (`Edge0/Audio8-TTS-Preview-0.6B-ONNX-INT4`): about 600 MB for speech, plus 415 MB once for registering a reference voice.
- `models/audio8/`: the slow and fast graphs patched for the browser. ONNX Runtime Web has no CPU kernel for `GatherBlockQuantized`, so those 12 embedding lookups are removed and done in JavaScript from the same 4-bit weights (`patch_gbq.py`). The lookups are bit-identical to the original op.
- Run `python3 tools/serve.py`, then open http://localhost:8000/audio8-lab.html. The server sends cross-origin isolation headers so the CPU path can use multiple threads.

Status: verified on the CPU path in headless Chromium. English came out word-perfect according to Whisper, and voice registration works. CPU generation is slow (several seconds per 46 ms frame on one thread), so WebGPU is the intended path on Apple Silicon; it is not yet verified.

## extension/: Dub Studio Capture

A Chrome extension that records a page video's audio together with its caption track, for the Voice Lab's **Add audio + captions…** import. Caption lines become training sentences (no Whisper pass), split by speaker when the captions name them. Captions can be WebVTT, SRT or TTML/DFXP/IMSC. For TTML that means tick, frame and clock times, nested `begin` offsets, and `ttm:agent` speakers; the format cases follow [netflix-to-srt](https://github.com/isaacbernat/netflix-to-srt) (MIT). The extension refuses DRM-protected video. Install and usage: [`extension/README.md`](extension/README.md).
