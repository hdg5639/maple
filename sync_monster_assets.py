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
    frames = {}
    for action in ACTIONS:
        expected = int(data['framebooks'][action])
        for index in range(expected):
            path = folder / f'{action}_{index}.png'
            path.write_bytes(fetch(f'{base}/render/{action}/{index}'))
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
