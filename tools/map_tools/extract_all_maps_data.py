import urllib.request
import json
import os
from PIL import Image

MAPS = {
    'henesys_hhg': {
        'id': 104040000,
        'name': '헤네시스 사냥터 1',
        'category': '사냥터',
        'img': 'assets/map/henesys_terrain.png',
        'minimap': 'assets/map/henesys_minimap.png',
        'bgm': 'henesys',
        'defaultSpawn': {'x': 1050, 'y': 1320},
        'spawnMonsters': ['snail', 'blue_snail', 'red_snail', 'slime', 'orange_mushroom', 'green_mushroom', 'ribbon_pig', 'zombie_mushroom'],
        'npcs': [
            {'name': '중형택시 (Regular Cab)', 'type': 'regular_cab', 'x': 820, 'y': 1320, 'dialog': 'cab'},
            {'name': '장로 스탄 (Chief Stan)', 'type': 'chief_stan', 'x': 1480, 'y': 1320, 'dialog': 'stan'}
        ],
        'portals': [
            {'x': 120, 'y': 1320, 'targetMap': 'henesys_town', 'targetX': 6000, 'targetY': 880, 'name': '헤네시스 마을로'},
            {'x': 2180, 'y': 1320, 'targetMap': 'ant_tunnel', 'targetX': 300, 'targetY': 240, 'name': '개미굴 입구로'}
        ]
    },
    'henesys_town': {
        'id': 100000000,
        'name': '헤네시스 (Henesys Town)',
        'category': '마을',
        'img': 'assets/map/henesys_town.png',
        'minimap': 'assets/map/henesys_town_minimap.png',
        'bgm': 'henesys',
        'defaultSpawn': {'x': 2000, 'y': 880},
        'spawnMonsters': ['snail', 'blue_snail'],
        'npcs': [
            {'name': '중형택시 (Regular Cab)', 'type': 'regular_cab', 'x': 2250, 'y': 880, 'dialog': 'cab'},
            {'name': '모범택시 (VIP Cab)', 'type': 'vip_cab', 'x': 3100, 'y': 880, 'dialog': 'vip_cab'},
            {'name': '장로 스탄 (Chief Stan)', 'type': 'chief_stan', 'x': 1800, 'y': 880, 'dialog': 'stan'},
            {'name': '마야 (Maya)', 'type': 'maya', 'x': 4200, 'y': 880, 'dialog': 'maya'}
        ],
        'portals': [
            {'x': 6300, 'y': 880, 'targetMap': 'henesys_hhg', 'targetX': 200, 'targetY': 1320, 'name': '사냥터 1로'},
            {'x': 100, 'y': 880, 'targetMap': 'ellinia', 'targetX': 500, 'targetY': 4500, 'name': '엘리니아로'}
        ]
    },
    'ant_tunnel': {
        'id': 105070001,
        'name': '개미굴 1 (Ant Tunnel 1)',
        'category': '던전',
        'img': 'assets/map/ant_tunnel.png',
        'minimap': 'assets/map/ant_tunnel_minimap.png',
        'bgm': 'ant_tunnel',
        'defaultSpawn': {'x': 400, 'y': 240},
        'spawnMonsters': ['zombie_mushroom', 'blue_snail', 'orange_mushroom', 'green_mushroom'],
        'npcs': [
            {'name': '모범택시 (VIP Cab)', 'type': 'vip_cab', 'x': 600, 'y': 240, 'dialog': 'vip_cab'}
        ],
        'portals': [
            {'x': 250, 'y': 240, 'targetMap': 'henesys_hhg', 'targetX': 2100, 'targetY': 1320, 'name': '헤네시스로'},
            {'x': 2800, 'y': 2380, 'targetMap': 'zakum_altar', 'targetX': 200, 'targetY': 490, 'name': '자쿰의 제단으로'}
        ]
    },
    'ellinia': {
        'id': 101000000,
        'name': '엘리니아 (Ellinia Tree Town)',
        'category': '마을',
        'img': 'assets/map/ellinia.png',
        'minimap': 'assets/map/ellinia_minimap.png',
        'bgm': 'ellinia',
        'defaultSpawn': {'x': 1400, 'y': 4550},
        'spawnMonsters': ['slime', 'green_mushroom'],
        'npcs': [
            {'name': '중형택시 (Regular Cab)', 'type': 'regular_cab', 'x': 1600, 'y': 4550, 'dialog': 'cab'},
            {'name': '베티 박사 (Dr. Betty)', 'type': 'betty', 'x': 900, 'y': 4150, 'dialog': 'betty'}
        ],
        'portals': [
            {'x': 300, 'y': 4550, 'targetMap': 'henesys_town', 'targetX': 200, 'targetY': 880, 'name': '헤네시스로'},
            {'x': 2500, 'y': 4550, 'targetMap': 'zakum_altar', 'targetX': 200, 'targetY': 490, 'name': '자쿰의 제단 입구로'}
        ]
    },
    'zakum_altar': {
        'id': 280030000,
        'name': '자쿰의 제단 (Zakum\'s Altar)',
        'category': '보스 레이드',
        'img': 'assets/map/zakum_altar.png',
        'minimap': 'assets/map/zakum_altar_minimap.png',
        'bgm': 'zakum',
        'defaultSpawn': {'x': 180, 'y': 490},
        'isBossMap': True,
        'boss': 'zakum',
        'npcs': [
            {'name': '아도비스 (Adobis)', 'type': 'adobis', 'x': 150, 'y': 490, 'dialog': 'adobis'}
        ],
        'portals': [
            {'x': 80, 'y': 490, 'targetMap': 'henesys_hhg', 'targetX': 1050, 'targetY': 1320, 'name': '헤네시스로 귀환'}
        ]
    }
}

all_map_output = {}

for key, mconf in MAPS.items():
    print(f"Fetching WZ data for {key} (ID: {mconf['id']})...")
    url = f"https://maplestory.io/api/GMS/62/map/{mconf['id']}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    
    img = Image.open(mconf['img'])
    img_w, img_h = img.size

    fhs_dict = data.get('footholds', {})
    ladder_list = data.get('ladderRopes', [])

    min_x = min(min(f['x1'], f['x2']) for f in fhs_dict.values())
    min_y = min(min(f['y1'], f['y2']) for f in fhs_dict.values())
    max_y = max(max(f['y1'], f['y2']) for f in fhs_dict.values())

    x_offset = -min_x
    y_offset = -min_y

    processed_fhs = []
    for fid, fh in fhs_dict.items():
        x1 = fh['x1'] + x_offset
        y1 = fh['y1'] + y_offset
        x2 = fh['x2'] + x_offset
        y2 = fh['y2'] + y_offset
        if x1 != x2:
            if x1 > x2:
                x1, x2 = x2, x1
                y1, y2 = y2, y1
            
            # Ground detection: near bottom
            is_ground = (y1 >= img_h - 100 or y2 >= img_h - 100)
            processed_fhs.append({
                'id': int(fid),
                'x1': x1,
                'y1': y1,
                'x2': x2,
                'y2': y2,
                'canDropThrough': not is_ground
            })
    
    processed_ladders = []
    for i, lr in enumerate(ladder_list):
        lx = lr['x'] + x_offset
        ly1 = lr['y1'] + y_offset
        ly2 = lr['y2'] + y_offset
        processed_ladders.append({
            'id': i + 1,
            'x': lx,
            'top': min(ly1, ly2),
            'bottom': max(ly1, ly2),
            'isLadder': lr.get('isLadder', True)
        })

    all_map_output[key] = {
        'key': key,
        'id': mconf['id'],
        'name': mconf['name'],
        'category': mconf['category'],
        'width': img_w,
        'height': img_h,
        'img': mconf['img'],
        'minimap': mconf['minimap'],
        'defaultSpawn': mconf['defaultSpawn'],
        'spawnMonsters': mconf.get('spawnMonsters', []),
        'isBossMap': mconf.get('isBossMap', False),
        'boss': mconf.get('boss', None),
        'npcs': mconf.get('npcs', []),
        'portals': mconf.get('portals', []),
        'footholds': processed_fhs,
        'ladders': processed_ladders
    }
    print(f"Processed {key}: {len(processed_fhs)} footholds, {len(processed_ladders)} ladders, size: {img_w}x{img_h}")

with open('assets/map/all_maps_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_map_output, f, ensure_ascii=False, indent=2)

print("Saved all maps to assets/map/all_maps_data.json successfully!")
