# temp

## speaker-transcriber.html

A single self-contained HTML page that transcribes audio or video **in the browser** and tags every line with the voice that said it.

- **Transcription:** OpenAI Whisper (ONNX) via [Transformers.js](https://github.com/huggingface/transformers.js), running on WebGPU when available or WebAssembly otherwise. Quality presets: **Best** (Whisper large-v3-turbo, the default, ≈1.4 GB one-time download, WebGPU strongly recommended), **Balanced** (Whisper small) and **Fast** (Whisper base), or any custom Whisper ONNX repo. Model ids are tried in order, so the word-timestamp variant of turbo is used when available and the plain model otherwise.
- **Who spoke when:** pyannote `segmentation-3.0` finds speech and local speaker changes in 10 s windows. Inside every local speaker region the page embeds 2 s sub-windows every 0.5 s with WeSpeaker ResNet34, clusters them with average linkage on cosine distance (threshold 0.70), and cuts a region wherever the sub-window votes change, so two people the segmentation model lumped together are still separated. Defaults were tuned on ground-truth conversations built from seven distinct speakers (mean speaker confusion ≈ 2%, correct speaker count in all seven scenarios) and checked on a real four-speaker recording.
- **Names, not "Speaker 1":** enroll known voices once (from a file, the microphone, or straight from a finished transcript) and matching speakers are named automatically next time. Rename, merge and reassign lines by clicking a speaker chip.
- **Word-level alignment** (with Whisper models exported with attention outputs), click-to-seek, live playback highlighting, and TXT / SRT / VTT / JSON export.

Open the file in a modern browser (Chrome or Edge 113+ recommended for WebGPU). The page itself has no dependencies; the Transformers.js library is loaded from jsDelivr and the models from the Hugging Face Hub on first use, then cached by the browser. No audio ever leaves the machine.

### Self-hosted models

`models/` holds Transformers.js-compatible copies of the two speaker models, so speaker identification works even when the
Hugging Face mirrors are gated or offline. The page looks under `./models/` first and only falls back to the Hub when a
model is not there.

- `models/wespeaker/voxceleb-resnet34-LM/` (~26 MB, fp32): the **WeSpeaker ResNet34-LM** speaker-embedding model, the
  project's own `voxceleb_resnet34_LM.onnx` taken from the
  [sherpa-onnx speaker-recognition release](https://github.com/k2-fsa/sherpa-onnx/releases/tag/speaker-recongition-models),
  tensors renamed (`feats` → `input_features`, `embs` → `embeddings`), weights unchanged. See the
  [WeSpeaker](https://github.com/wenet-e2e/wespeaker) project for license terms.
- `models/pyannote/segmentation-3.0/` (~6 MB, fp32): **pyannote/segmentation-3.0** (MIT), ONNX export from the
  [sherpa-onnx speaker-segmentation release](https://github.com/k2-fsa/sherpa-onnx/releases/tag/speaker-segmentation-models),
  tensors renamed (`x` → `input_values`, `y` → `logits`), weights unchanged.

Whisper is still fetched from the Hub (the useful sizes exceed GitHub's per-file limit). To self-host a Whisper model, drop an
`<owner>/<model>/` folder with the Transformers.js layout under `models/` and add the id to the Advanced settings.
