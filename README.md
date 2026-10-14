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

Voices are generic synthetic voices. The app does not clone or imitate real people's voices. Use it with video you have the rights to.
