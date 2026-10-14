# Test media

Small, openly licensed clips for testing Dub Studio and Speaker Transcriber. Everything here may be redistributed with attribution under the licenses below.

| File | What it's for | Source and license |
|---|---|---|
| `tears-of-steel-0-70s.mp4` | Full-dub and live-dub tests. English dialogue between two characters from 0:23 to 1:03, with music and effects underneath. 640p, 70 s. | *Tears of Steel* (2012), © Blender Foundation, [mango.blender.org](https://mango.blender.org). [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Trimmed and re-encoded. |
| `tears-of-steel.{en,es,fr,de,it,jp,pt-br,ru}.srt` | Reference translations to compare your dub script against. Timings match the excerpt above. | Community subtitles distributed with the film at [download.blender.org/demo/movies/ToS/subtitles](https://download.blender.org/demo/movies/ToS/subtitles/). |
| `fleurs-japanese-8-speakers.ogg` + `.txt` | Japanese → English/other dubbing, and speaker identification. 8 read sentences by different speakers, 0.8 s apart, with the reference transcript. | [FLEURS](https://huggingface.co/datasets/google/fleurs) (Google), `ja_jp` dev split. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). |
| `librispeech-1272-train.ogg`, `librispeech-1272-heldout.ogg` | Voice Lab training (≈90 s) and an evaluation set it never sees (≈40 s). Male reader. | [LibriSpeech](https://www.openslr.org/12) dev-clean, speaker 1272. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). |
| `librispeech-1462-train.ogg`, `librispeech-1462-heldout.ogg` | Same, female reader (held-out set ≈12 s). | LibriSpeech dev-clean, speaker 1462. CC BY 4.0. |

## About the LibriSpeech voices

The Voice Lab only trains after the talent reads a consent statement live into the microphone and the app confirms it is the same voice as the training audio. Dataset readers can't do that, so the LibriSpeech clips are for measuring training quality from a script or the console, not for the normal UI flow. To try the whole flow yourself, record your own training audio and consent.

## Longer material

- *Tears of Steel* full film (12 min, 372 MB): https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov
- *Elephants Dream* (11 min, dialogue, CC BY 2.5): https://download.blender.org/ED/ED_1024.avi
- FLEURS covers 102 languages: `data/<lang>/audio/{dev,test}.tar.gz` on the dataset page.
- LibriSpeech dev-clean has 40 speakers with about 8 minutes each: https://www.openslr.org/resources/12/dev-clean.tar.gz
- VCTK (110 English speakers with varied accents, CC BY 4.0): https://datashare.ed.ac.uk/handle/10283/3443
