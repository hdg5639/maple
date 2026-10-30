"""
Sync Authentic Classic MapleStory Throwing Star Assets
Extracts official pixel sprites for bullets (frame 0, 1) and inventory icons
directly from the MapleStory classic WZ archive.
"""

import os
import json
import base64
import urllib.request

STARS = {
    'subi': 2070000,
    'mokbi': 2070002,
    'kumbi': 2070003,
    'tobi': 2070004,
    'steely': 2070005,
    'ilbi': 2070006,
    'hwabi': 2070007,
    'ultimate': 2070016  # Crystal Ilbi / Ultimate Shuriken
}

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets', 'projectiles', 'stars'))
os.makedirs(OUT_DIR, exist_ok=True)

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def save_b64_png(b64_str, path):
    data = base64.b64decode(b64_str)
    with open(path, 'wb') as f:
        f.write(data)
    print(f"Saved: {os.path.basename(path)} ({len(data)} bytes)")

def sync_stars():
    print(f"[SYNC] Downloading authentic classic throwing stars into {OUT_DIR}...")
    for name, item_id in STARS.items():
        wz_id = f"0{item_id}"
        
        # 1. Flying Bullet Frame 0
        try:
            url_b0 = f"https://maplestory.io/api/wz/GMS/62/Item/Consume/0207.img/{wz_id}/bullet/0"
            data = fetch_json(url_b0)
            if data and data.get('value'):
                save_b64_png(data['value'], os.path.join(OUT_DIR, f"{name}_0.png"))
        except Exception as e:
            print(f"Failed bullet 0 for {name}: {e}")

        # 2. Flying Bullet Frame 1
        try:
            url_b1 = f"https://maplestory.io/api/wz/GMS/62/Item/Consume/0207.img/{wz_id}/bullet/1"
            data = fetch_json(url_b1)
            if data and data.get('value'):
                save_b64_png(data['value'], os.path.join(OUT_DIR, f"{name}_1.png"))
        except Exception as e:
            print(f"Failed bullet 1 for {name}: {e}")

        # 3. Inventory Icon
        try:
            url_icon = f"https://maplestory.io/api/wz/GMS/62/Item/Consume/0207.img/{wz_id}/info/icon"
            data = fetch_json(url_icon)
            if data and data.get('value'):
                save_b64_png(data['value'], os.path.join(OUT_DIR, f"{name}_icon.png"))
        except Exception as e:
            print(f"Failed icon for {name}: {e}")

    print("[SYNC] All throwing star assets synchronized successfully!")

if __name__ == '__main__':
    sync_stars()
