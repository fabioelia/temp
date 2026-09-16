# temp

## speaker-transcriber.html

A single self-contained HTML page that transcribes audio or video **in the browser** and tags every line with the voice that said it.

- **Transcription:** OpenAI Whisper (ONNX) via [Transformers.js](https://github.com/huggingface/transformers.js), running on WebGPU when available or WebAssembly otherwise.
- **Who spoke when:** pyannote `segmentation-3.0` finds speech and speaker changes; WeSpeaker ResNet34 voice embeddings are clustered into global speakers (the same recipe as the pyannote 3.x pipeline).
- **Names, not "Speaker 1":** enroll known voices once (from a file, the microphone, or straight from a finished transcript) and matching speakers are named automatically next time. Rename, merge and reassign lines by clicking a speaker chip.
- **Word-level alignment** (with Whisper models exported with attention outputs), click-to-seek, live playback highlighting, and TXT / SRT / VTT / JSON export.

Open the file in a modern browser (Chrome or Edge 113+ recommended for WebGPU). The page itself has no dependencies; the Transformers.js library is loaded from jsDelivr and the models from the Hugging Face Hub on first use, then cached by the browser. No audio ever leaves the machine.

### Self-hosted models

`models/` holds a Transformers.js-compatible copy of the **WeSpeaker ResNet34-LM** speaker-embedding model
(`models/wespeaker/voxceleb-resnet34-LM/`, ~26 MB, fp32). The page looks for embedding models under `./models/` first and only
falls back to the Hugging Face Hub when a model is not there, so the voice-identification step works even when the Hub
mirrors are gated or offline. The ONNX file is the WeSpeaker project's `voxceleb_resnet34_LM.onnx`, taken from the
[sherpa-onnx speaker-recognition release](https://github.com/k2-fsa/sherpa-onnx/releases/tag/speaker-recongition-models),
with its tensors renamed (`feats` → `input_features`, `embs` → `embeddings`) and no change to the weights. See the
[WeSpeaker](https://github.com/wenet-e2e/wespeaker) project for the model's license terms.

Whisper and pyannote segmentation are still fetched from the Hub (they are public). To self-host those too, drop
`<owner>/<model>/` folders with the same layout under `models/` and add the ids to the Advanced settings.
