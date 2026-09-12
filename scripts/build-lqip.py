#!/usr/bin/env python3
"""Add a low-quality placeholder for every image under public/images that does
not already have one. Each entry is a 24px-wide PNG as a data URI plus the
image's intrinsic size, which Pic.astro uses for the placeholder and to set
width/height. Pass --all to rebuild every entry instead of only the missing."""
import base64, io, json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, 'public', 'images')
DATA = os.path.join(ROOT, 'src', 'data', 'lqip.json')
EXT = {'.png', '.jpg', '.jpeg'}
WIDTH = 24

def entry(path):
    with Image.open(path) as im:
        w, h = im.size
        small = im.convert('RGBA').resize((WIDTH, max(1, round(h * WIDTH / w))), Image.LANCZOS)
        buf = io.BytesIO()
        small.save(buf, 'PNG', optimize=True)
    return {'lqip': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), 'w': w, 'h': h}

data = json.load(open(DATA)) if os.path.exists(DATA) else {}
rebuild = '--all' in sys.argv
added = 0
for dirpath, _, files in os.walk(IMAGES):
    for f in sorted(files):
        if os.path.splitext(f)[1].lower() not in EXT:
            continue
        full = os.path.join(dirpath, f)
        key = '/' + os.path.relpath(full, os.path.join(ROOT, 'public')).replace(os.sep, '/')
        if key in data and not rebuild:
            continue
        data[key] = entry(full)
        added += 1
        print('  +', key)

# drop entries whose file is gone
for key in [k for k in data if not os.path.exists(os.path.join(ROOT, 'public', k.lstrip('/')))]:
    del data[key]
    print('  -', key)

json.dump(dict(sorted(data.items())), open(DATA, 'w'), indent=2)
print('%d entries (%d new)' % (len(data), added))
