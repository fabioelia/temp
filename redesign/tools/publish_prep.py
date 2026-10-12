"""Prepare the redesign for publishing as one multi-file web artifact.

1. Re-runs the generators (docs, audit, hub) and renders each concept README into concepts/<id>/notes.html.
2. Writes the hub as an artifact page fragment (no doctype/html/head/body) to <stage>/index.html.
3. Computes the list of files to publish: every page, stylesheet, script and data file, plus only the images that
   some published text file actually references. Writes <stage>/files.json (batches of <= 240 files / <= 60 MB).

Usage: python3 -I tools/publish_prep.py <stage_dir>
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
STAGE = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, '_publish')
TEXT_EXT = {'.html', '.css', '.js', '.json', '.svg'}
IMG_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'}
SKIP_DIRS = {'tools', 'research/raw-crawl', 'research/screenshots', '_publish'}


def run(script):
    subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'tools', script)], check=True)


def render_concept_notes():
    import markdown  # noqa
    sys.path.insert(0, os.path.join(ROOT, 'tools'))
    import render_docs
    for cid in sorted(os.listdir(os.path.join(ROOT, 'concepts'))):
        md = os.path.join('concepts', cid, 'README.md')
        if os.path.exists(os.path.join(ROOT, md)):
            name = cid.split('-', 1)[1].title()
            render_docs.render(md, f'concepts/{cid}/notes.html', f'{name} Design Notes', f'Concept {cid[:2]} · design notes')


def hub_fragment():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    head = re.search(r'<head>(.*?)</head>', src, re.S).group(1)
    body = re.search(r'<body[^>]*>(.*)</body>', src, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*', '', head)
    head = re.sub(r'<meta name="viewport"[^>]*>\s*', '', head)
    # <title> must come first (scanned in the first 8 KB)
    title = re.search(r'<title>.*?</title>', head, re.S).group(0)
    head = head.replace(title, '')
    os.makedirs(STAGE, exist_ok=True)
    open(os.path.join(STAGE, 'index.html'), 'w', encoding='utf-8').write(title + '\n' + head.strip() + '\n' + body.strip() + '\n')


def walk():
    for dp, dns, fns in os.walk(ROOT):
        rel_dir = os.path.relpath(dp, ROOT).replace(os.sep, '/')
        if rel_dir == '.':
            rel_dir = ''
        if any(rel_dir == s or rel_dir.startswith(s + '/') for s in SKIP_DIRS) or '/.' in '/' + rel_dir:
            dns[:] = []
            continue
        for f in fns:
            yield (rel_dir + '/' + f).lstrip('/')


def collect():
    files = list(walk())
    text = [f for f in files if os.path.splitext(f)[1].lower() in TEXT_EXT and not f.endswith('manifest.json')]
    imgs = [f for f in files if os.path.splitext(f)[1].lower() in IMG_EXT and f not in text]
    # which images are referenced anywhere in published text (by file name)
    blob = ''
    for f in text:
        if f.endswith('.json'):
            continue
        blob += open(os.path.join(ROOT, f), encoding='utf-8', errors='ignore').read()
    used_imgs = [f for f in imgs if os.path.basename(f) in blob]
    pages = [f for f in text if f != 'index.html' and not f.endswith('.json')]
    out = sorted(set(pages + used_imgs))
    return out, sorted(set(imgs) - set(used_imgs))


def batches(paths, max_files=240, max_bytes=60 * 1024 * 1024):
    out, cur, size = [], [], 0
    for p in paths:
        b = os.path.getsize(os.path.join(ROOT, p))
        if cur and (len(cur) >= max_files or size + b > max_bytes):
            out.append(cur)
            cur, size = [], 0
        cur.append(p)
        size += b
    if cur:
        out.append(cur)
    return out


if __name__ == '__main__':
    run('build_data_js.py')
    run('render_docs.py')
    render_concept_notes()
    run('build_audit.py')
    run('build_hub.py')
    hub_fragment()
    paths, unused = collect()
    total = sum(os.path.getsize(os.path.join(ROOT, p)) for p in paths)
    b = batches(paths)
    json.dump({'root': ROOT, 'page': os.path.join(STAGE, 'index.html'), 'batches': b}, open(os.path.join(STAGE, 'files.json'), 'w'), indent=1)
    print(f'{len(paths)} files, {total / 1048576:.1f} MB, {len(b)} batch(es): {[len(x) for x in b]}; unreferenced images skipped: {len(unused)}')
