"""Build a release package of the Dub Studio Capture extension.

Copies extension/ to dist/dub-studio-capture/, sets devBuild to false in config.js (DRM check always
enforced, no setting), checks it, and zips it for the Chrome Web Store or for managed deployment.

    python3 tools/build_extension.py
"""
import json, re, shutil, zipfile, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src, out = root / 'extension', root / 'dist' / 'dub-studio-capture'
shutil.rmtree(out, ignore_errors=True)
shutil.copytree(src, out, ignore=shutil.ignore_patterns('README.md', '*.map', '.DS_Store'))
cfg = out / 'config.js'
text, n = re.subn(r'=\s*\{\s*devBuild:\s*true\s*\}', '= { devBuild: false }', cfg.read_text())
assert n == 1 and '= { devBuild: false }' in text, 'could not switch config.js to a release build'
cfg.write_text(text)
version = json.loads((out / 'manifest.json').read_text())['version']
zip_path = root / 'dist' / f'dub-studio-capture-{version}.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(out.rglob('*')):
        if f.is_file(): z.write(f, f.relative_to(out))
print(f'Release build {version}: {out} and {zip_path} (devBuild: false)')
