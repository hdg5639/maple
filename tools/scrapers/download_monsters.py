import urllib.request
import urllib.parse
import json
import os
from PIL import Image, ImageSequence

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def download_file(url, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        with open(out_path, 'wb') as f:
            f.write(data)
        return len(data)

# 1. Download All Authentic Monsters
mobs = {
    'snail': 100100,
    'blue_snail': 100101,
    'red_snail': 130101,
    'slime': 210100,
    'ribbon_pig': 1210101,
    'orange_mushroom': 1210102,
    'green_mushroom': 1110100,
    'mushmom': 6130101,
    'zombie_mushroom': 6300005 # from user image #2 (ant tunnel)!
}

print("=== Downloading Authentic Monster Sprites ===")
for mob_name, mob_id in mobs.items():
    mob_dir = os.path.join('assets', 'monsters', mob_name)
    os.makedirs(mob_dir, exist_ok=True)
    
    for action in ['stand', 'move', 'hit1', 'die1']:
        url = f"https://maplestory.io/api/GMS/62/mob/{mob_id}/render/{action}"
        gif_path = os.path.join(mob_dir, f"{action}.gif")
        try:
            sz = download_file(url, gif_path)
            # Split gif into png frames
            im = Image.open(gif_path)
            frames = [f.copy().convert('RGBA') for f in ImageSequence.Iterator(im)]
            for idx, frame in enumerate(frames):
                frame.save(os.path.join(mob_dir, f"{action}_{idx}.png"))
            print(f"[{mob_name}] {action}: {len(frames)} frames extracted (GIF {sz} bytes)")
        except Exception as e:
            print(f"[{mob_name}] {action} error: {e}")

print("=== Monster sprites download complete! ===")
