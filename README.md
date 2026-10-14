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
- **Mix:** the original track is ducked under each dubbed line, and stereo centre-channel cancellation suppresses the original dialogue while keeping music and effects.
- **Live modes:** dub the loaded video, another browser tab (via screen-share audio) or the microphone in real time (about 1–3 s behind with WebGPU). The voice for each live line is chosen by how high or low the speaker sounds.
- **Characters from Speaker Transcriber:** import a JSON export from `speaker-transcriber.html` and its named speakers become the cast, each with their own voice.
- **Export:** time-aligned dub track (WAV), translated subtitles (SRT), the dub project (JSON), or a real-time recording of the dubbed video (WebM).
- **Voice Lab:** train a custom voice from a voice actor's recordings, on device (WebGPU, including Apple Silicon). See below.

### Voice Lab

Trains a Kokoro voice that sounds like a specific, consenting voice actor, without leaving the browser.

1. **Recordings:** upload or record 1–5 minutes of the talent's clean solo speech, or **extract it from a video**: the app separates voices from music and effects (Open-Unmix UMX-L in ONNX Runtime Web, with the STFT done in JavaScript), finds speech, voice-prints 2 s windows with WeSpeaker, and groups them into voices. Listen to each voice and pick one to use as training audio. Note that the UMX-L weights are licensed upstream for non-commercial use (CC BY-NC-SA 4.0); for production, point `SEPARATOR_URL` at a separator you have a commercial license for.
2. **Consent:** the talent reads a generated statement live into the microphone: their name, your studio, and a random four-word code. Whisper checks the words, and a WeSpeaker voice print checks that it is the same voice as the recordings (cosine ≥ 0.5). Training stays locked until both pass, and the consent audio is stored with the voice.
3. **Training:** Kokoro voices are tables of style vectors. Training starts from the closest blend of stock voices and then runs an adaptive random walk (a (1+1) evolution strategy) through that space. Each candidate speaks probe sentences, gets voice-printed, and is kept when it sits closer to the talent. The final score is measured on a sentence the search never used. A few hundred steps take minutes with WebGPU.
4. **Use:** saved voices live in the browser (IndexedDB), appear in every character's voice list and in the **Speak** panel (type text, hear it, download a WAV), and export or import as `.voice.json` with their consent record.

What to expect: the trained voice moves toward the talent's timbre and pitch, but it is not a studio-grade clone. Kokoro speaks English only, and very unusual voices (children, creatures, heavy effects) land further away. Consent is checked in the page, so a product that must enforce it should repeat the check on a server.

Stock and preset voices are generic synthetic voices. Use the app with video you have the rights to and voices whose owners have agreed.

## test-media/

Small, openly licensed clips for testing both tools: a *Tears of Steel* excerpt with subtitles in eight languages, Japanese read speech from FLEURS, and LibriSpeech readers for measuring Voice Lab training. Sources and licenses are in [`test-media/SOURCES.md`](test-media/SOURCES.md).
