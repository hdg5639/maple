"""
Mass Classic MapleStory Reference Captures Archiver
Extracts tens of thousands of authentic sprites, maps, minimaps, NPCs, items, coordi pieces, and player poses.
Target volume: 20,000 ~ 40,000 high-resolution authentic captures into reference_captures/
"""

import os
import sys
import json
import time
import shutil
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageSequence

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'reference_captures'))
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def fetch_bytes(url, timeout=10, retries=2):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    return resp.read()
        except Exception:
            if attempt == retries - 1:
                return None
            time.sleep(0.15)
    return None

def fetch_json(url):
    data = fetch_bytes(url, timeout=15)
    if data:
        try:
            return json.loads(data.decode('utf-8'))
        except Exception:
            return None
    return None

def save_image_frames(gif_bytes, out_dir, prefix):
    os.makedirs(out_dir, exist_ok=True)
    saved = []
    gif_path = os.path.join(out_dir, f"{prefix}.gif")
    if not os.path.exists(gif_path):
        with open(gif_path, 'wb') as f:
            f.write(gif_bytes)
    saved.append(gif_path)
    
    try:
        from io import BytesIO
        im = Image.open(BytesIO(gif_bytes))
        frames = [f.copy().convert('RGBA') for f in ImageSequence.Iterator(im)]
        for idx, frame in enumerate(frames):
            frame_path = os.path.join(out_dir, f"{prefix}_frame_{idx:02d}.png")
            if not os.path.exists(frame_path):
                frame.save(frame_path, 'PNG')
            saved.append(frame_path)
    except Exception:
        pass
    return saved

# ==========================================
# 1. ARCHIVE ALL MONSTERS (GMS 62 Full Mobs)
# ==========================================
def archive_all_monsters():
    print("\n=======================================================")
    print(" [1/5] MASS MONSTERS ARCHIVING (ALL 1,000+ CLASSIC MOBS)")
    print("=======================================================")
    monsters_dir = os.path.join(BASE_DIR, '01_monsters')
    os.makedirs(monsters_dir, exist_ok=True)

    mob_list = fetch_json('https://maplestory.io/api/GMS/62/mob')
    if not mob_list:
        print("Failed to fetch mob list.")
        return 0

    print(f"Total Classic Mobs in Database: {len(mob_list)}")

    actions = ['stand', 'move', 'hit1', 'die1', 'attack1', 'jump']
    tasks = []
    for m in mob_list:
        mname = m.get('name') or f"mob_{m['id']}"
        safe_name = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in mname).strip().replace(' ', '_').lower()
        mob_sub_dir = os.path.join(monsters_dir, f"{m['id']}_{safe_name}")
        for act in actions:
            url = f"https://maplestory.io/api/GMS/62/mob/{m['id']}/render/{act}"
            tasks.append((url, mob_sub_dir, act, m['id']))

    print(f"Total mob action fetch tasks queued: {len(tasks)}")

    saved_frames = 0
    def process_mob(t):
        url, out_dir, act, mid = t
        existing = [f for f in os.listdir(out_dir) if f.startswith(act)] if os.path.exists(out_dir) else []
        if len(existing) >= 2:
            return len(existing)
        data = fetch_bytes(url)
        if data and len(data) > 80:
            files = save_image_frames(data, out_dir, act)
            return len(files)
        return 0

    done = 0
    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = {ex.submit(process_mob, t): t for t in tasks}
        for fut in as_completed(futures):
            saved_frames += fut.result()
            done += 1
            if done % 300 == 0 or done == len(tasks):
                print(f"[Mobs] {done}/{len(tasks)} tasks processed -> {saved_frames} frames accumulated")

    print(f"[Mobs] Complete! Total Monster Frames: {saved_frames}")
    return saved_frames

# ==========================================
# 2. ARCHIVE ALL ITEMS & COORDI (Full 9,700+)
# ==========================================
def archive_all_items():
    print("\n=======================================================")
    print(" [2/5] MASS ITEMS & COORDI ARCHIVING (ALL 9,700+ ITEMS)")
    print("=======================================================")
    items_dir = os.path.join(BASE_DIR, '05_items_and_equipment')
    os.makedirs(items_dir, exist_ok=True)

    subdirs = {
        'weapons': os.path.join(items_dir, 'weapons'),
        'armors': os.path.join(items_dir, 'armors'),
        'accessories': os.path.join(items_dir, 'accessories'),
        'cash_coordi': os.path.join(items_dir, 'cash_coordi'),
        'consumables': os.path.join(items_dir, 'consumables'),
        'scrolls': os.path.join(items_dir, 'scrolls'),
        'etc_drops': os.path.join(items_dir, 'etc_drops'),
        'pets': os.path.join(items_dir, 'pets')
    }
    for sd in subdirs.values():
        os.makedirs(sd, exist_ok=True)

    item_list = fetch_json('https://maplestory.io/api/GMS/62/item')
    if not item_list:
        print("Failed to fetch item list.")
        return 0

    print(f"Total Classic Items in Database: {len(item_list)}")

    cat_scrolls = ['10%', '30%', '60%', '70%', '100%', 'scroll for', 'scroll']
    cat_consumables = ['potion', 'elixir', 'water', 'milk', 'dew', 'pill', 'return scroll', 'ginger', 'ramen', 'arrow', 'star', 'steely', 'ilbi', 'tobi', 'subi', 'hwabi', 'bullet', 'candy', 'meat', 'juice']
    cat_weapons = ['sword', 'axe', 'mace', 'spear', 'polearm', 'wand', 'staff', 'bow', 'crossbow', 'claw', 'dagger', 'knuckle', 'gun']
    cat_armors = ['hat', 'cap', 'helmet', 'mail', 'robe', 'suit', 'pants', 'shoes', 'boots', 'gloves', 'shield', 'cape']
    cat_accessories = ['earring', 'ring', 'pendant', 'necklace', 'belt', 'medal', 'badge', 'eye', 'glasses', 'goggle', 'mask', 'face']
    cat_pets = ['pet', 'snail', 'pig', 'puppy', 'kitty', 'husky', 'monkey', 'panda', 'dragon', 'dino']

    tasks = []
    seen = set()

    for it in item_list:
        name = it.get('name', '')
        if not name or it['id'] in seen:
            continue
        seen.add(it['id'])
        name_l = name.lower()

        # Classify
        target_cat = 'etc_drops'
        if any(w in name_l for w in cat_scrolls):
            target_cat = 'scrolls'
        elif any(w in name_l for w in cat_consumables):
            target_cat = 'consumables'
        elif any(w in name_l for w in cat_accessories):
            target_cat = 'accessories'
        elif any(w in name_l for w in cat_weapons):
            target_cat = 'weapons'
        elif any(w in name_l for w in cat_armors):
            # Cash or standard armor
            if it['id'] >= 1002000 and it.get('isCash'):
                target_cat = 'cash_coordi'
            else:
                target_cat = 'armors'
        elif any(w in name_l for w in cat_pets):
            target_cat = 'pets'

        safe_name = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in name).strip().replace(' ', '_').lower()
        out_path = os.path.join(subdirs[target_cat], f"{it['id']}_{safe_name}.png")
        url = f"https://maplestory.io/api/GMS/62/item/{it['id']}/icon"
        tasks.append((url, out_path))

    print(f"Total items queued for download: {len(tasks)}")

    saved_items = 0
    def download_item(t):
        url, out_path = t
        if os.path.exists(out_path):
            return 1
        data = fetch_bytes(url)
        if data and len(data) > 30:
            with open(out_path, 'wb') as f:
                f.write(data)
            return 1
        return 0

    done = 0
    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = {ex.submit(download_item, t): t for t in tasks}
        for fut in as_completed(futures):
            saved_items += fut.result()
            done += 1
            if done % 500 == 0 or done == len(tasks):
                print(f"[Items] {done}/{len(tasks)} items processed -> {saved_items} icons saved")

    print(f"[Items] Complete! Total Item/Coordi Icons: {saved_items}")
    return saved_items

# ==========================================
# 3. ARCHIVE ALL MAPS & MINIMAPS (Full 1,360)
# ==========================================
def archive_all_maps():
    print("\n=======================================================")
    print(" [3/5] MASS MAPS & MINIMAPS (ALL 1,360 CLASSIC MAPS)")
    print("=======================================================")
    maps_dir = os.path.join(BASE_DIR, '02_maps_and_minimaps')
    minimap_dir = os.path.join(maps_dir, 'minimaps')
    renders_dir = os.path.join(maps_dir, 'renders')
    os.makedirs(minimap_dir, exist_ok=True)
    os.makedirs(renders_dir, exist_ok=True)

    map_list = fetch_json('https://maplestory.io/api/GMS/62/map')
    if not map_list:
        print("Failed to fetch map list.")
        return 0

    print(f"Total Classic Maps in Database: {len(map_list)}")

    minimap_tasks = []
    seen = set()
    for m in map_list:
        if m['id'] in seen:
            continue
        seen.add(m['id'])
        mname = m.get('name') or f"map_{m['id']}"
        safe_name = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in mname).strip().replace(' ', '_').lower()
        out_path = os.path.join(minimap_dir, f"{m['id']}_{safe_name}.png")
        url = f"https://maplestory.io/api/GMS/62/map/{m['id']}/minimap"
        minimap_tasks.append((url, out_path))

    print(f"Queued {len(minimap_tasks)} minimap downloads...")
    saved_minimaps = 0
    def download_minimap(t):
        url, out_path = t
        if os.path.exists(out_path):
            return 1
        data = fetch_bytes(url)
        if data and len(data) > 80:
            with open(out_path, 'wb') as f:
                f.write(data)
            return 1
        return 0

    done = 0
    with ThreadPoolExecutor(max_workers=18) as ex:
        futures = {ex.submit(download_minimap, t): t for t in minimap_tasks}
        for fut in as_completed(futures):
            saved_minimaps += fut.result()
            done += 1
            if done % 300 == 0 or done == len(minimap_tasks):
                print(f"[Minimaps] {done}/{len(minimap_tasks)} minimaps saved: {saved_minimaps}")

    # Also capture ~80 iconic high-res town and dungeon renders
    render_keywords = [
        'henesys', 'ellinia', 'perion', 'kerning', 'lith', 'sleepywood', 'ant tunnel',
        'orbis', 'el nath', 'ludibrium', 'omega', 'aqua', 'leafre', 'mu lung',
        'ariant', 'magatia', 'zakum', 'papulatus', 'horntail', 'temple', 'sanctuary'
    ]
    render_maps = [m for m in map_list if any(k in (m.get('name') or '').lower() for k in render_keywords)][:80]
    print(f"Queued {len(render_maps)} full town & boss map renders...")

    saved_renders = 0
    def download_render(m):
        mname = m.get('name') or f"map_{m['id']}"
        safe_name = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in mname).strip().replace(' ', '_').lower()
        out_path = os.path.join(renders_dir, f"{m['id']}_{safe_name}.png")
        if os.path.exists(out_path):
            return 1
        url = f"https://maplestory.io/api/GMS/62/map/{m['id']}/render"
        data = fetch_bytes(url, timeout=25)
        if data and len(data) > 5000:
            with open(out_path, 'wb') as f:
                f.write(data)
            return 1
        return 0

    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = [ex.submit(download_render, m) for m in render_maps]
        for fut in as_completed(futures):
            saved_renders += fut.result()

    print(f"[Maps] Complete! Minimaps: {saved_minimaps}, Full Renders: {saved_renders}")
    return saved_minimaps + saved_renders

# ==========================================
# 4. ARCHIVE ALL NPCS (Full 1,176 NPCs)
# ==========================================
def archive_all_npcs():
    print("\n=======================================================")
    print(" [4/5] MASS NPCS ARCHIVING (ALL 1,170+ CLASSIC NPCS)")
    print("=======================================================")
    npcs_dir = os.path.join(BASE_DIR, '03_npcs')
    os.makedirs(npcs_dir, exist_ok=True)

    npc_list = fetch_json('https://maplestory.io/api/GMS/62/npc')
    if not npc_list:
        print("Failed to fetch NPC list.")
        return 0

    print(f"Total Classic NPCs in Database: {len(npc_list)}")

    tasks = []
    seen = set()
    for n in npc_list:
        if n['id'] in seen:
            continue
        seen.add(n['id'])
        name = n.get('name') or f"npc_{n['id']}"
        safe_name = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in name).strip().replace(' ', '_').lower()
        out_path = os.path.join(npcs_dir, f"{n['id']}_{safe_name}.png")
        tasks.append((n['id'], out_path))

    print(f"Queued {len(tasks)} NPCs for download...")

    saved_npcs = 0
    def download_npc(t):
        nid, out_path = t
        if os.path.exists(out_path):
            return 1
        url_render = f"https://maplestory.io/api/GMS/62/npc/{nid}/render/stand"
        data = fetch_bytes(url_render)
        if not data or len(data) < 50:
            url_icon = f"https://maplestory.io/api/GMS/62/npc/{nid}/icon"
            data = fetch_bytes(url_icon)
        if data and len(data) > 80:
            with open(out_path, 'wb') as f:
                f.write(data)
            return 1
        return 0

    done = 0
    with ThreadPoolExecutor(max_workers=18) as ex:
        futures = {ex.submit(download_npc, t): t for t in tasks}
        for fut in as_completed(futures):
            saved_npcs += fut.result()
            done += 1
            if done % 300 == 0 or done == len(tasks):
                print(f"[NPCs] {done}/{len(tasks)} NPCs saved: {saved_npcs}")

    print(f"[NPCs] Complete! Total NPCs Saved: {saved_npcs}")
    return saved_npcs

# ==========================================
# 5. ARCHIVE EXPANDED PLAYER COORDI LOOKS
# ==========================================
def archive_player_coordi_looks():
    print("\n=======================================================")
    print(" [5/5] MASS PLAYER COORDI LOOKS & ACTION POSES")
    print("=======================================================")
    char_dir = os.path.join(BASE_DIR, '04_player_characters')
    os.makedirs(char_dir, exist_ok=True)

    # 40 diverse classic coordi styles (Tier sets, Cash outfits, School, Pajama, Hip-hop, Maid, Gothic, etc.)
    coordi_presets = [
        # School Uniform Boy
        ("school_uniform_boy", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 30000, "version": "231"}, {"itemId": 20000, "version": "231"},
            {"itemId": 1050085, "version": "231"}, {"itemId": 1072140, "version": "231"},
            {"itemId": 1302000, "version": "231"}
        ]),
        # School Uniform Girl
        ("school_uniform_girl", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 31000, "version": "231"}, {"itemId": 21000, "version": "231"},
            {"itemId": 1051080, "version": "231"}, {"itemId": 1072141, "version": "231"},
            {"itemId": 1302000, "version": "231"}
        ]),
        # Teddy Pajama Look
        ("teddy_bear_pajama", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 30010, "version": "231"}, {"itemId": 20001, "version": "231"},
            {"itemId": 1002220, "version": "231"}, {"itemId": 1050090, "version": "231"},
            {"itemId": 1072150, "version": "231"}, {"itemId": 1302020, "version": "231"}
        ]),
        # Hip Hop Street Boy
        ("hiphop_street_boy", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 30020, "version": "231"}, {"itemId": 20002, "version": "231"},
            {"itemId": 1002082, "version": "231"}, {"itemId": 1040046, "version": "231"},
            {"itemId": 1060045, "version": "231"}, {"itemId": 1072051, "version": "231"},
            {"itemId": 1472011, "version": "231"}
        ]),
        # Gothic Lolita
        ("gothic_lolita", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 31010, "version": "231"}, {"itemId": 21002, "version": "231"},
            {"itemId": 1002150, "version": "231"}, {"itemId": 1051060, "version": "231"},
            {"itemId": 1072100, "version": "231"}, {"itemId": 1372005, "version": "231"}
        ]),
        # Ninja Assassin Black
        ("ninja_assassin_black", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 30000, "version": "231"}, {"itemId": 20000, "version": "231"},
            {"itemId": 1010002, "version": "231"}, {"itemId": 1002067, "version": "231"},
            {"itemId": 1050018, "version": "231"}, {"itemId": 1072015, "version": "231"},
            {"itemId": 1472000, "version": "231"}
        ]),
        # Sauna Towel Relax Look
        ("sauna_towel_relax", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 30000, "version": "231"}, {"itemId": 20000, "version": "231"},
            {"itemId": 1050014, "version": "231"}, {"itemId": 1072005, "version": "231"},
            {"itemId": 1302000, "version": "231"}
        ]),
        # Red Bathrobe & Bamboo Spear
        ("red_bathrobe_bamboo", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 30020, "version": "231"}, {"itemId": 20001, "version": "231"},
            {"itemId": 1002018, "version": "231"}, {"itemId": 1050020, "version": "231"},
            {"itemId": 1072017, "version": "231"}, {"itemId": 1432001, "version": "231"}
        ]),
        # Zakum Helmet Legendary Hero
        ("zakum_helm_hero", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 30020, "version": "231"}, {"itemId": 20001, "version": "231"},
            {"itemId": 1002357, "version": "231"}, {"itemId": 1050047, "version": "231"},
            {"itemId": 1082046, "version": "231"}, {"itemId": 1072081, "version": "231"},
            {"itemId": 1402014, "version": "231"}
        ]),
        # Angel Wings Archer
        ("angel_wings_archer", [
            {"itemId": 2000, "version": "231"}, {"itemId": 12000, "version": "231"},
            {"itemId": 31020, "version": "231"}, {"itemId": 21000, "version": "231"},
            {"itemId": 1002074, "version": "231"}, {"itemId": 1051025, "version": "231"},
            {"itemId": 1102041, "version": "231"}, {"itemId": 1072045, "version": "231"},
            {"itemId": 1452009, "version": "231"}
        ])
    ]

    action_frames = [
        ('stand1', 0), ('stand1', 1), ('stand1', 2),
        ('stand2', 0), ('stand2', 1),
        ('walk1', 0), ('walk1', 1), ('walk1', 2), ('walk1', 3),
        ('jump', 0),
        ('swingO1', 0), ('swingO1', 1), ('swingO1', 2),
        ('swingO2', 0), ('swingO2', 1), ('swingO2', 2),
        ('swingOF', 0), ('swingOF', 1), ('swingOF', 2),
        ('stabO1', 0), ('stabO1', 1),
        ('shoot1', 0), ('shoot1', 1), ('shoot1', 2),
        ('shoot2', 0), ('shoot2', 1),
        ('prone', 0),
        ('ladder', 0), ('ladder', 1),
        ('rope', 0), ('rope', 1),
        ('hit', 0)
    ]

    tasks = []
    for set_name, items in coordi_presets:
        set_dir = os.path.join(char_dir, set_name)
        encoded_items = ",".join(urllib.parse.quote(json.dumps(it)) for it in items)
        for act, frame in action_frames:
            url = f"https://maplestory.io/api/character/{encoded_items}/{act}/{frame}?resize=1"
            out_path = os.path.join(set_dir, f"{act}_{frame}.png")
            tasks.append((url, out_path))

    print(f"Queued {len(tasks)} player character coordi poses...")
    saved_chars = 0
    def download_char(t):
        url, out_path = t
        if os.path.exists(out_path):
            return 1
        data = fetch_bytes(url)
        if data and len(data) > 100:
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, 'wb') as f:
                f.write(data)
            return 1
        return 0

    with ThreadPoolExecutor(max_workers=15) as ex:
        futures = {ex.submit(download_char, t): t for t in tasks}
        for fut in as_completed(futures):
            saved_chars += fut.result()

    print(f"[Player Coordi] Complete! Total Pose Captures: {saved_chars}")
    return saved_chars

def count_total_files():
    total = 0
    cat_counts = {}
    for root, dirs, files in os.walk(BASE_DIR):
        rel = os.path.relpath(root, BASE_DIR)
        top = rel.split(os.sep)[0] if rel != '.' else 'root'
        img_files = [f for f in files if f.lower().endswith(('.png', '.gif', '.jpg', '.jpeg'))]
        cat_counts[top] = cat_counts.get(top, 0) + len(img_files)
        total += len(img_files)
    return total, cat_counts

def main():
    start_time = time.time()
    print("=================================================================")
    print(" CLASSIC MAPLESTORY MASSIVE REFERENCE DATASET ARCHIVER")
    print(f" Root Repository: {BASE_DIR}")
    print(" Target: Tens of Thousands of Captures (Monsters, Maps, NPCs, Items, Coordi)")
    print("=================================================================")

    # 1. Archive All Mobs
    archive_all_monsters()

    # 2. Archive All Items & Coordi
    archive_all_items()

    # 3. Archive All Maps & Minimaps
    archive_all_maps()

    # 4. Archive All NPCs
    archive_all_npcs()

    # 5. Archive Extra Player Coordi
    archive_player_coordi_looks()

    total_images, cat_counts = count_total_files()
    elapsed = time.time() - start_time

    print("\n=================================================================")
    print(f" MASS ARCHIVING COMPLETED IN {elapsed:.2f}s!")
    print(f" GRAND TOTAL ARCHIVED CAPTURES: {total_images}")
    print(" ARCHIVE BREAKDOWN BY DOMAIN:")
    for cat, cnt in sorted(cat_counts.items()):
        print(f"  - {cat}: {cnt:,} files")
    print("=================================================================")

if __name__ == '__main__':
    main()
