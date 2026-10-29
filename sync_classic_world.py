"""Rebuild playable geometry and population from pinned GMS 62 source records.

Source snapshots are checked in; normal execution is offline and deterministic.
Transport shortcuts and melee raid platforms are explicit project adaptations.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / 'assets/map/source'
POLICY = {
    'henesys_hhg': (104040000, '헤네시스 사냥터 1', (13, -20), 0, (1050, 1320)),
    'henesys_town': (100000000, '헤네시스', (40, -294), 0, (2000, 560)),
    'ant_tunnel': (105050000, '개미굴 1', (31, 10), 0, (721, 225)),
    'ellinia': (101000000, '엘리니아', (-10, -294), 0, (1400, 4300)),
    'zakum_altar': (280030000, '자쿰의 제단', (31, 150), 196, (260, 537)),
}
NPCS = {
    'henesys_hhg': [('일반택시', 'regular_cab', 350, 1320, 'cab'), ('장로 스탄', 'chief_stan', 1480, 1320, 'stan')],
    'henesys_town': [('장로 스탄', 'chief_stan', 1800, 560, 'stan'), ('일반택시', 'regular_cab', 2250, 560, 'cab'), ('고급택시', 'vip_cab', 3100, 560, 'vip_cab'), ('마야', 'maya', 4200, 680, 'maya')],
    'ant_tunnel': [('고급택시', 'vip_cab', 930, 225, 'vip_cab')],
    'ellinia': [('일반택시', 'regular_cab', 1600, 4300, 'cab'), ('베티 박사', 'betty', 900, 4186, 'betty')],
    'zakum_altar': [('아도비스', 'adobis', 100, 330, 'adobis')],
}
LINKS = {
    'henesys_hhg': [(120, 1320, 'henesys_town'), (2180, 1320, 'ant_tunnel')],
    'henesys_town': [(6300, 680, 'henesys_hhg'), (100, 650, 'ellinia')],
    'ant_tunnel': [(520, 225, 'henesys_hhg'), (2800, 2150, 'zakum_altar')],
    'ellinia': [(300, 4300, 'henesys_town'), (2500, 4300, 'zakum_altar')],
    'zakum_altar': [(60, 537, 'henesys_hhg')],
}


def build():
    catalog = json.loads((ROOT / 'assets/monsters/catalog.json').read_text(encoding='utf8'))
    species = {v['mobId']: k for k, v in catalog.items()}
    database = {}
    for key, (mid, name, offset, padding, spawn) in POLICY.items():
        source = json.loads((SOURCES / f'{mid}.json').read_text(encoding='utf8'))
        raw = list(source['footholds'].values())
        min_x = min(min(f['x1'], f['x2']) for f in raw)
        min_y = min(min(f['y1'], f['y2']) for f in raw)
        dx, dy = -min_x, -min_y + padding
        fhs = []
        for f in raw:
            if f['x1'] == f['x2']:
                continue
            x1, x2, y1, y2 = f['x1'] + dx, f['x2'] + dx, f['y1'] + dy, f['y2'] + dy
            if x1 > x2:
                x1, x2, y1, y2 = x2, x1, y2, y1
            prop = key == 'henesys_hhg' and any(abs(y1-y) <= 6 for y in [473, 714, 956, 1255])
            fhs.append(dict(id=f['id'], x1=x1, y1=y1, x2=x2, y2=y2, isProp=prop,
                            sourceLayer=f['layerId'], sourceGroup=f['groupId']))
        image = ROOT / f'assets/map/{key}_terrain.png'
        width, height = Image.open(image).size
        data = dict(key=key, name=name, mapId=mid, source=f'https://maplestory.io/api/GMS/62/map/{mid}',
                    region='GMS', version='62', category='마을' if source['isTown'] else '사냥터',
                    width=max(width+offset[0], max(f['x2'] for f in fhs)),
                    height=max(height+offset[1], max(max(f['y1'], f['y2']) for f in fhs)+120),
                    terrainSourceWidth=width, terrainSourceHeight=height,
                    img=str(image.relative_to(ROOT)).replace('\\', '/'), nativeTerrain=True,
                    minimap=f'assets/map/{key}_minimap.png', terrainOffset=dict(x=offset[0], y=offset[1]),
                    nativeRopeTailOffset=-19 if key == 'henesys_hhg' else (-12 if key == 'ant_tunnel' else 0),
                    sourceTransform=dict(x=dx, y=dy), isTown=bool(source['isTown']),
                    isBossMap=key == 'zakum_altar', footholds=fhs,
                    defaultSpawn=dict(x=spawn[0], y=spawn[1]),
                    ladders=[dict(id=i+1, x=l['x']+dx, top=l['y1']+dy, bottom=l['y2']+dy,
                                  nativeBottom=l['y2']+dy, renderedInTerrain=True, isLadder=l['isLadder'])
                             for i, l in enumerate(source.get('ladderRopes') or [])])
        # Three short source ladders need explicit playable extensions to the lower floor.
        if key == 'henesys_hhg':
            for ladder in data['ladders']:
                if ladder['id'] in (1, 2, 4):
                    ladder['bottom'] = 1320
        data['npcs'] = [dict(name=n, type=t, x=x, y=y, dialog=d, adaptation=True) for n,t,x,y,d in NPCS[key]]
        data['portals'] = [dict(x=x, y=y, targetMap=target, targetX=POLICY[target][4][0],
                                targetY=POLICY[target][4][1], name=POLICY[target][1], adaptation=True)
                           for x,y,target in LINKS[key]]
        data['mobSpawns'] = [dict(type=species[m['id']], x=m['x']+dx, y=m['y']+dy,
                                  sourceFootholdId=m['footholdId'], sourceMobId=m['id'])
                             for m in source.get('mobs') or [] if m['id'] in species]
        data['maxMonsters'] = len(data['mobSpawns'])
        if key == 'henesys_hhg':
            data['bossSpawn'] = dict(type='mushmom', x=1500, y=540, adaptation=True)
        if key == 'zakum_altar':
            data['boss'] = 'zakum'
            data['bossSpawn'] = dict(type='zakum', x=600, y=537)
        def resolve(point):
            candidates = [f for f in fhs if not f['isProp'] and f['x1'] <= point['x'] <= f['x2']]
            if not candidates:
                raise ValueError(f"{key}: no authored surface for {point}")
            def y_at(f):
                return f['y1'] + (f['y2']-f['y1'])*(point['x']-f['x1'])/(f['x2']-f['x1'])
            fh = min(candidates, key=lambda f: abs(y_at(f)-point['y']))
            point['y'] = y_at(fh)
        for point in [data['defaultSpawn'], *data['npcs'], *data['portals']]:
            resolve(point)
        database[key] = data
    for data in database.values():
        for portal in data['portals']:
            arrival = database[portal['targetMap']]['defaultSpawn']
            portal.update(targetX=arrival['x'], targetY=arrival['y'])
    (ROOT / 'js/map_data.js').write_text('// Generated by sync_classic_world.py; pinned GMS 62 data + explicit web adaptations.\nconst MAP_DATABASE = '+json.dumps(database, ensure_ascii=False, indent=2)+';\n', encoding='utf8')
    print('Generated', {k: (len(v['footholds']), len(v['mobSpawns'])) for k,v in database.items()})


if __name__ == '__main__':
    build()
