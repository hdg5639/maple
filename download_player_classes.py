import urllib.request
import urllib.parse
import json
import os

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

jobs = {
    'beginner': [
        {"itemId": 2000, "version": "231"},
        {"itemId": 12000, "version": "231"},
        {"itemId": 30000, "version": "231"},
        {"itemId": 20000, "version": "231"},
        {"itemId": 1050018, "version": "231"},
        {"itemId": 1072005, "version": "231"},
        {"itemId": 1302000, "version": "231"}
    ],
    'warrior': [
        {"itemId": 2000, "version": "231"},
        {"itemId": 12000, "version": "231"},
        {"itemId": 30020, "version": "231"},
        {"itemId": 20001, "version": "231"},
        {"itemId": 1002001, "version": "231"},
        {"itemId": 1040002, "version": "231"},
        {"itemId": 1060002, "version": "231"},
        {"itemId": 1072007, "version": "231"},
        {"itemId": 1302002, "version": "231"}
    ],
    'magician': [
        {"itemId": 2000, "version": "231"},
        {"itemId": 12000, "version": "231"},
        {"itemId": 30010, "version": "231"},
        {"itemId": 20002, "version": "231"},
        {"itemId": 1002009, "version": "231"},
        {"itemId": 1050005, "version": "231"},
        {"itemId": 1072010, "version": "231"},
        {"itemId": 1382000, "version": "231"}
    ],
    'bowman': [
        {"itemId": 2000, "version": "231"},
        {"itemId": 12000, "version": "231"},
        {"itemId": 30030, "version": "231"},
        {"itemId": 20000, "version": "231"},
        {"itemId": 1002013, "version": "231"},
        {"itemId": 1040014, "version": "231"},
        {"itemId": 1060014, "version": "231"},
        {"itemId": 1072003, "version": "231"},
        {"itemId": 1452002, "version": "231"}
    ],
    'thief': [
        {"itemId": 2000, "version": "231"},
        {"itemId": 12000, "version": "231"},
        {"itemId": 30000, "version": "231"},
        {"itemId": 20000, "version": "231"},
        {"itemId": 1002067, "version": "231"},
        {"itemId": 1050018, "version": "231"},
        {"itemId": 1072015, "version": "231"},
        {"itemId": 1472000, "version": "231"}
    ]
}

actions = [
    ('stand_0', 'stand1', 0),
    ('stand_1', 'stand1', 1),
    ('stand_2', 'stand1', 2),
    ('walk_0', 'walk1', 0),
    ('walk_1', 'walk1', 1),
    ('walk_2', 'walk1', 2),
    ('walk_3', 'walk1', 3),
    ('jump_0', 'jump', 0),
    ('attack_0', 'swingO1', 0),
    ('attack_1', 'swingO1', 1),
    ('attack_2', 'swingO1', 2),
    ('ladder_0', 'ladder', 0),
    ('rope_0', 'rope', 0)
]

print("=== Downloading Authentic Player Class Sprites ===")
for job_name, items in jobs.items():
    job_dir = os.path.join('assets', 'player', job_name)
    os.makedirs(job_dir, exist_ok=True)
    encoded_items = ",".join(urllib.parse.quote(json.dumps(it)) for it in items)
    
    for fname, act, frame in actions:
        out_path = os.path.join(job_dir, f"{fname}.png")
        if os.path.exists(out_path):
            continue
        url = f"https://maplestory.io/api/character/{encoded_items}/{act}/{frame}?resize=1"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = resp.read()
                with open(out_path, 'wb') as f:
                    f.write(data)
                print(f"[{job_name}] {fname} saved ({len(data)} bytes)")
        except Exception as e:
            print(f"[{job_name}] {fname} error: {e}")

print("=== Player sprites download complete! ===")
