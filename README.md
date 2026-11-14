# temp

## caliper/

A browser CAD tool for 3D-printable parts: sketch, extrude, fillet, shell, pattern, and export STL or STEP, with a Claude assistant that edits the same parametric timeline you do. The geometry kernel is OpenCascade running as WebAssembly in a worker. See [caliper/README.md](caliper/README.md) to run it (`npm install && npm run dev`).

## speaker-transcriber.html

A single self-contained HTML page that transcribes audio or video **in the browser** and tags every line with the voice that said it.

- **Transcription:** OpenAI Whisper (ONNX) via [Transformers.js](https://github.com/huggingface/transformers.js), running on WebGPU when available or WebAssembly otherwise.
- **Who spoke when:** pyannote `segmentation-3.0` finds speech and speaker changes; WeSpeaker ResNet34 voice embeddings are clustered into global speakers (the same recipe as the pyannote 3.x pipeline).
- **Names, not "Speaker 1":** enroll known voices once (from a file, the microphone, or straight from a finished transcript) and matching speakers are named automatically next time. Rename, merge and reassign lines by clicking a speaker chip.
- **Word-level alignment** (with Whisper models exported with attention outputs), click-to-seek, live playback highlighting, and TXT / SRT / VTT / JSON export.

Open the file in a modern browser (Chrome or Edge 113+ recommended for WebGPU). The page itself has no dependencies; the Transformers.js library is loaded from jsDelivr and the models from the Hugging Face Hub on first use, then cached by the browser. No audio ever leaves the machine.
