"""Refresh versioned WZ monster artwork and its browser catalog (development only)."""
import argparse
import concurrent.futures
import json
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
MONSTERS = {
    'snail': 100100, 'blue_snail': 100101, 'red_snail': 130101,
    'slime': 210100, 'ribbon_pig': 1210101, 'orange_mushroom': 1210102,
    'green_mushroom': 1110100, 'mushmom': 6130101,
    'zombie_mushroom': 2230101, 'horny_mushroom': 2110200,
    'shroom': 120100, 'stump': 130100,
    'pig': 1210100, 'wild_boar': 2230102, 'octopus': 1120100,
    'bubbling': 1210103, 'jr_wraith': 3230101, 'coolie_zombie': 5130107,
    'drake': 5130100, 'king_slime': 9500168, 'jr_balrog': 8130100,
    'crimson_balrog': 8150000,
    'axe_stump': 1130100, 'dark_axe_stump': 2130100, 'fire_boar': 3210100,
    'curse_eye': 3230100, 'jr_necki': 2130103, 'tauromacis': 7130100,
    'death_teddy': 7130010, 'mano': 2220000, 'stumpy': 3220000,
    'faust': 5220002, 'dyle': 6220000, 'zombie_mushmom': 6300005,
    'manon': 8180000, 'papulatus': 8500001, 'horntail': 8810002,
}
ACTIONS = ('stand', 'move', 'hit1', 'die1')


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'OpenMaple-Classic-Asset-Sync'})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read()


def sync(name):
    mob_id = MONSTERS[name]
    base = f'https://maplestory.io/api/GMS/62/mob/{mob_id}'
    data = json.loads(fetch(base))
    folder = ROOT / 'assets' / 'monsters' / name
    folder.mkdir(parents=True, exist_ok=True)
    meta_file = folder / 'meta.json'
    if meta_file.exists():
        meta_file.unlink()
    frames = {}
    for action in ACTIONS:
        source_action = action if action in data['framebooks'] else ('fly' if action == 'move' and 'fly' in data['framebooks'] else action)
        expected = int(data['framebooks'][source_action])
        for index in range(expected):
            path = folder / f'{action}_{index}.png'
            path.write_bytes(fetch(f'{base}/render/{source_action}/{index}'))
            with Image.open(path) as frame:
                frame.verify()
        for old in folder.glob(f'{action}_*.png'):
            if int(old.stem.rsplit('_', 1)[1]) >= expected:
                if old.resolve().parent != folder.resolve():
                    raise ValueError('Asset cleanup escaped its monster folder')
                old.unlink()
        frames[action] = expected
    return name, {'mobId': mob_id, 'name': data['name'], 'source': base,
                  'region': 'GMS', 'version': '62', 'frames': frames,
                  'classicStats': data.get('meta', {})}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('monsters', nargs='*', choices=list(MONSTERS))
    args = parser.parse_args()
    names = args.monsters or list(MONSTERS)
    path = ROOT / 'assets' / 'monsters' / 'catalog.json'
    catalog = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for name, record in pool.map(sync, names):
            catalog[name] = record
            print(f"{name}: {record['name']} (GMS 62/{record['mobId']}) {record['frames']}")
    path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
