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
    'perion_boar': (102020300, '와일드보어의 땅', (-27, 0), 0, (680, 878)),
    'kerning_subway': (103000101, '커닝시티 지하철 1호선', (51, 0), 0, (520, 678)),
    'sleepy_dungeon': (105090900, '저주받은 신전', (-4, 0), 191, (180, 1019)),
    'ship_orbis': (200090010, '오르비스행 비행선 갑판', (-202, 199), 0, (520, 1019)),
    'el_nath_deadmine': (211041400, '죽은나무의 숲 4', (-2, 238), 0, (920, 840)),
    'ludi_clocktower': (220070200, '시계탑 최하층 잊혀진 시간의 길 3', (-4, 0), 416, (1250, 681)),
    'kerning_pq': (103000804, '커닝시티 파퀘 킹슬라임 제단', (-59, 0), 224, (220, 2549)),
}
NPCS = {
    'henesys_hhg': [('일반택시', 'regular_cab', 350, 1320, 'cab'), ('장로 스탄', 'chief_stan', 1480, 1320, 'stan')],
    'henesys_town': [('장로 스탄', 'chief_stan', 1800, 560, 'stan'), ('일반택시', 'regular_cab', 2250, 560, 'cab'), ('고급택시', 'vip_cab', 3100, 560, 'vip_cab'), ('마야', 'maya', 4200, 680, 'maya')],
    'ant_tunnel': [('고급택시', 'vip_cab', 930, 225, 'vip_cab')],
    'ellinia': [('일반택시', 'regular_cab', 1600, 4300, 'cab'), ('베티 박사', 'betty', 900, 4186, 'betty')],
    'zakum_altar': [('아도비스', 'adobis', 100, 330, 'adobis')],
    'perion_boar': [('일반택시', 'regular_cab', 480, 878, 'cab')],
    'kerning_subway': [('웅이', 'regular_cab', 350, 678, 'cab')],
    'sleepy_dungeon': [('수행사제', 'adobis', 320, 1019, 'adobis')],
    'ship_orbis': [('선원 캘리', 'chief_stan', 380, 1019, 'stan')],
    'el_nath_deadmine': [('폐광 광부', 'regular_cab', 680, 840, 'cab')],
    'ludi_clocktower': [('보좌관 티군', 'vip_cab', 1050, 681, 'vip_cab')],
    'kerning_pq': [('라케리스', 'betty', 340, 2549, 'betty')],
}
LINKS = {
    'henesys_hhg': [(120, 1320, 'henesys_town'), (2180, 1320, 'ant_tunnel'), (750, 1320, 'perion_boar')],
    'henesys_town': [(6300, 680, 'henesys_hhg'), (100, 650, 'ellinia')],
    'ant_tunnel': [(520, 225, 'henesys_hhg'), (2800, 2150, 'zakum_altar'), (1500, 1200, 'sleepy_dungeon')],
    'ellinia': [(300, 4300, 'henesys_town'), (2500, 4300, 'ship_orbis'), (1800, 4300, 'zakum_altar')],
    'zakum_altar': [(60, 537, 'henesys_hhg'), (400, 537, 'el_nath_deadmine')],
    'perion_boar': [(220, 878, 'henesys_hhg'), (1580, 878, 'kerning_subway')],
    'kerning_subway': [(180, 678, 'perion_boar'), (3650, 678, 'kerning_pq')],
    'sleepy_dungeon': [(60, 1019, 'ant_tunnel'), (1420, 1019, 'zakum_altar')],
    'ship_orbis': [(660, 1019, 'ellinia'), (920, 1019, 'el_nath_deadmine')],
    'el_nath_deadmine': [(280, 840, 'ship_orbis'), (2320, 900, 'ludi_clocktower')],
    'ludi_clocktower': [(780, 681, 'el_nath_deadmine'), (2200, 2195, 'zakum_altar')],
    'kerning_pq': [(90, 2549, 'kerning_subway')],
}


def build():
    catalog = json.loads((ROOT / 'assets/monsters/catalog.json').read_text(encoding='utf8'))
    species = {v['mobId']: k for k, v in catalog.items()}
    # Canonical WZ map mob ID mappings to genuine monster species
    species[2130100] = 'dark_axe_stump'
    species[1130100] = 'axe_stump'
    species[3210800] = 'fire_boar'
    species[9400568] = 'jr_wraith'
    species[9300002] = 'curse_eye'
    species[9300000] = 'jr_necki'
    species[7130010] = 'death_teddy'
    # Note: 9300003 (King Slime in kerning_pq) is spawned via bossSpawn so it is not duplicated in mobSpawns

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
            prop = (
                (key == 'henesys_hhg' and any(abs(y1 - y) <= 6 for y in [473, 714, 956, 1255]))
                or (key == 'el_nath_deadmine' and f['y1'] < -600)
                or (key == 'ship_orbis' and (f['y1'] < 0 or f['y1'] > 300))
            )
            fhs.append(dict(id=f['id'], x1=x1, y1=y1, x2=x2, y2=y2, isProp=prop,
                            sourceLayer=f.get('layerId', 0), sourceGroup=f.get('groupId', 0)))
        fhs_by_id = {f['id']: f for f in fhs if not f['isProp']}
        image = ROOT / f'assets/map/{key}_terrain.png'
        width, height = Image.open(image).size
        data = dict(key=key, name=name, mapId=mid, source=f'https://maplestory.io/api/GMS/62/map/{mid}',
                    region='GMS', version='62', category='마을' if source.get('isTown') else '사냥터',
                    width=max(width + offset[0], max(f['x2'] for f in fhs)),
                    height=max(height + offset[1], max(max(f['y1'], f['y2']) for f in fhs) + 120),
                    terrainSourceWidth=width, terrainSourceHeight=height,
                    img=str(image.relative_to(ROOT)).replace('\\', '/'), nativeTerrain=True,
                    minimap=f'assets/map/{key}_minimap.png', terrainOffset=dict(x=offset[0], y=offset[1]),
                    nativeRopeTailOffset=-19 if key == 'henesys_hhg' else (-12 if key == 'ant_tunnel' else 0),
                    sourceTransform=dict(x=dx, y=dy), isTown=bool(source.get('isTown')),
                    isBossMap=key in ('zakum_altar', 'sleepy_dungeon', 'ship_orbis', 'kerning_pq'), footholds=fhs,
                    defaultSpawn=dict(x=spawn[0], y=spawn[1]),
                    ladders=[dict(id=i + 1, x=l['x'] + dx, top=l['y1'] + dy, bottom=l['y2'] + dy,
                                  nativeBottom=l['y2'] + dy, renderedInTerrain=True, isLadder=l['isLadder'])
                             for i, l in enumerate(source.get('ladderRopes') or [])])
        # Specific ladder extensions if needed
        if key == 'henesys_hhg':
            for ladder in data['ladders']:
                if ladder['id'] in (1, 2, 4):
                    ladder['bottom'] = 1320
        data['npcs'] = [dict(name=n, type=t, x=x, y=y, dialog=d, adaptation=True) for n, t, x, y, d in NPCS.get(key, [])]
        data['portals'] = [dict(x=x, y=y, targetMap=target, targetX=POLICY[target][4][0],
                                targetY=POLICY[target][4][1], name=POLICY[target][1], adaptation=True)
                           for x, y, target in LINKS.get(key, [])]

        mob_spawns = []
        for m in source.get('mobs') or []:
            if m['id'] == 9300003 and key == 'kerning_pq':
                continue
            if m['id'] not in species:
                continue
            mx = m['x'] + dx
            my = m['y'] + dy
            fh = fhs_by_id.get(m['footholdId'])
            if fh and fh['x1'] <= mx <= fh['x2']:
                if fh['x2'] != fh['x1']:
                    my = fh['y1'] + (fh['y2'] - fh['y1']) * (mx - fh['x1']) / (fh['x2'] - fh['x1'])
                else:
                    my = fh['y1']
            mob_spawns.append(dict(type=species[m['id']], x=mx, y=my,
                                   sourceFootholdId=m['footholdId'], sourceMobId=m['id']))

        # Populate sleepy_dungeon platforms with Tauromacis & Drake (raw WZ only has 1 boss spawn entry)
        if key == 'sleepy_dungeon':
            temple_spawns = [
                ('tauromacis', 650, 1019, 13, 7130100),
                ('tauromacis', 950, 1019, 15, 7130100),
                ('tauromacis', 1220, 1019, 21, 7130100),
                ('drake', 520, 678, 86, 5130100),
                ('tauromacis', 780, 578, 63, 7130100),
                ('drake', 1120, 678, 128, 5130100),
                ('tauromacis', 900, 484, 150, 7130100),
                ('drake', 400, 355, 42, 5130100),
                ('tauromacis', 650, 216, 48, 7130100),
                ('tauromacis', 1220, 398, 165, 7130100),
            ]
            mob_spawns = []
            for stype, sx, sy, sfh, smob in temple_spawns:
                pt = dict(x=sx, y=sy)
                cands = [f for f in fhs if not f['isProp'] and f['x1'] <= sx <= f['x2']]
                if cands:
                    best_f = min(cands, key=lambda f: abs((f['y1'] + (f['y2'] - f['y1']) * (sx - f['x1']) / (f['x2'] - f['x1'])) - sy))
                    sy = best_f['y1'] + (best_f['y2'] - best_f['y1']) * (sx - best_f['x1']) / (best_f['x2'] - best_f['x1'])
                    sfh = best_f['id']
                mob_spawns.append(dict(type=stype, x=sx, y=sy, sourceFootholdId=sfh, sourceMobId=smob))

        data['mobSpawns'] = mob_spawns

        # Regional & Raid Boss spawns per map
        if key == 'henesys_hhg':
            data['bossSpawn'] = dict(type='mushmom', x=1500, y=540, adaptation=True)
        elif key == 'ant_tunnel':
            data['bossSpawn'] = dict(type='zombie_mushmom', x=1750, y=1323, adaptation=True)
        elif key == 'perion_boar':
            data['bossSpawn'] = dict(type='stumpy', x=1050, y=878, adaptation=True)
        elif key == 'kerning_subway':
            data['bossSpawn'] = dict(type='dyle', x=1850, y=803, adaptation=True)
        elif key == 'el_nath_deadmine':
            data['bossSpawn'] = dict(type='manon', x=1550, y=840, adaptation=True)
        elif key == 'ludi_clocktower':
            data['bossSpawn'] = dict(type='papulatus', x=1550, y=681, adaptation=True)
        elif key == 'zakum_altar':
            data['boss'] = 'zakum'
            data['bossSpawn'] = dict(type='zakum', x=600, y=537)
        elif key == 'sleepy_dungeon':
            data['boss'] = 'jr_balrog'
            data['bossSpawn'] = dict(type='jr_balrog', x=820, y=1019)
        elif key == 'ship_orbis':
            data['boss'] = 'crimson_balrog'
            data['bossSpawn'] = dict(type='crimson_balrog', x=780, y=1019)
        elif key == 'kerning_pq':
            data['boss'] = 'king_slime'
            data['bossSpawn'] = dict(type='king_slime', x=580, y=2549)

        data['maxMonsters'] = 0 if data['isTown'] else (len(data['mobSpawns']) or 12)

        def resolve(point):
            candidates = [f for f in fhs if not f['isProp'] and f['x1'] <= point['x'] <= f['x2']]
            if not candidates:
                candidates = [f for f in fhs if not f['isProp']] or fhs
            def y_at(f):
                if f['x2'] == f['x1']:
                    return f['y1']
                return f['y1'] + (f['y2'] - f['y1']) * (point['x'] - f['x1']) / (f['x2'] - f['x1'])
            fh = min(candidates, key=lambda f: abs(y_at(f) - point['y']))
            point['y'] = y_at(fh)

        for point in [data['defaultSpawn'], *data['npcs'], *data['portals']]:
            resolve(point)
        if data.get('bossSpawn') and key != 'zakum_altar':
            resolve(data['bossSpawn'])
        database[key] = data

    for data in database.values():
        for portal in data['portals']:
            arrival = database[portal['targetMap']]['defaultSpawn']
            portal.update(targetX=arrival['x'], targetY=arrival['y'])

    (ROOT / 'js/map_data.js').write_text('// Generated by sync_classic_world.py; pinned GMS 62 data + explicit web adaptations.\nconst MAP_DATABASE = ' + json.dumps(database, ensure_ascii=False, indent=2) + ';\n', encoding='utf8')
    print('Generated', {k: (len(v['footholds']), len(v['mobSpawns'])) for k, v in database.items()})


if __name__ == '__main__':
    build()
