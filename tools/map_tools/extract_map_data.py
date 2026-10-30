import urllib.request
import json
import os

url = 'https://maplestory.io/api/GMS/62/map/104040000'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as resp:
    data = json.loads(resp.read().decode())

fhs_dict = data['footholds']
ladder_list = data.get('ladderRopes', [])

X_OFFSET = 489
Y_OFFSET = 1105

# Filter horizontal & sloped walkable footholds (skip purely vertical walls if any)
processed_fhs = []
for fid, fh in fhs_dict.items():
    x1 = fh['x1'] + X_OFFSET
    y1 = fh['y1'] + Y_OFFSET
    x2 = fh['x2'] + X_OFFSET
    y2 = fh['y2'] + Y_OFFSET
    
    # We only care about walk platforms where x1 != x2
    if x1 != x2:
        # Guarantee x1 < x2
        if x1 > x2:
            x1, x2 = x2, x1
            y1, y2 = y2, y1
        is_ground = (y1 >= 1570 and y2 >= 1570)
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
    lx = lr['x'] + X_OFFSET
    ly1 = lr['y1'] + Y_OFFSET
    ly2 = lr['y2'] + Y_OFFSET
    top_y = min(ly1, ly2)
    bot_y = max(ly1, ly2)
    processed_ladders.append({
        'id': i + 1,
        'x': lx,
        'top': top_y,
        'bottom': bot_y,
        'isLadder': lr.get('isLadder', True)
    })

map_data = {
    'name': '헤네시스 사냥터 1',
    'width': 2242,
    'height': 1634,
    'groundY': 1585,
    'footholds': processed_fhs,
    'ladders': processed_ladders
}

with open('assets/map/henesys_data.json', 'w', encoding='utf-8') as f:
    json.dump(map_data, f, indent=2, ensure_ascii=False)

print(f"Saved {len(processed_fhs)} footholds and {len(processed_ladders)} ladders to assets/map/henesys_data.json!")
