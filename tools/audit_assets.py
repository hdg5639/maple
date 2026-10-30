# tools/audit_assets.py - Static Asset Reference Exhaustive Validation
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(ROOT, '..', 'index.html')):
    ROOT = os.path.abspath(os.path.join(ROOT, '..'))

missing = []

# 1. Check all references in HTML
with open(os.path.join(ROOT, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

for match in re.findall(r'(?:src|href)=["\']([^"\']+\.(?:png|jpg|jpeg|gif|mp3|ogg|wav|json|js|css))["\']', html):
    if match.startswith('http') or match.startswith('data:'):
        continue
    full_path = os.path.normpath(os.path.join(ROOT, match))
    if not os.path.exists(full_path):
        missing.append(('index.html', match, full_path))

# 2. Check catalog.json
catalog_path = os.path.join(ROOT, 'assets', 'monsters', 'catalog.json')
if os.path.exists(catalog_path):
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    for mob_id, mob_data in catalog.items():
        frames = mob_data.get('frames', {})
        for action, frame_count in frames.items():
            for idx in range(frame_count):
                rel_path = f"assets/monsters/{mob_id}/{action}_{idx}.png"
                full_path = os.path.normpath(os.path.join(ROOT, rel_path))
                if not os.path.exists(full_path):
                    missing.append(('catalog.json:' + mob_id, rel_path, full_path))

# 3. Check map_data.js
map_data_path = os.path.join(ROOT, 'js', 'map_data.js')
if os.path.exists(map_data_path):
    with open(map_data_path, 'r', encoding='utf-8') as f:
        mcode = f.read()
    for match in re.findall(r'["\'](assets/[^"\']+\.(?:png|jpg|jpeg|gif|json))["\']', mcode):
        full_path = os.path.normpath(os.path.join(ROOT, match))
        if not os.path.exists(full_path):
            missing.append(('map_data.js', match, full_path))

# 4. Check sprites.js
sprites_path = os.path.join(ROOT, 'js', 'sprites.js')
if os.path.exists(sprites_path):
    with open(sprites_path, 'r', encoding='utf-8') as f:
        scode = f.read()
    for match in re.findall(r'["\'](assets/[^"\']+\.(?:png|jpg|jpeg|gif|json))["\']', scode):
        full_path = os.path.normpath(os.path.join(ROOT, match))
        if not os.path.exists(full_path):
            missing.append(('sprites.js', match, full_path))

print(f"[AUDIT] Total missing static asset references: {len(missing)}")
for src, ref, path in missing:
    print(f"  [{src}] Missing: {ref}")

if missing:
    sys.exit(1)
print("[AUDIT SUCCESS] 100% of static asset references exist on disk!")
