import json

portals_update = {
    "henesys_town": [
        {
            "x": 6300,
            "y": 679.0,
            "targetMap": "henesys_hhg",
            "targetX": 180,
            "targetY": 1320.0,
            "name": "헤네시스 사냥터 1",
            "adaptation": True
        },
        {
            "x": 100,
            "y": 499.0,
            "targetMap": "ellinia",
            "targetX": 360,
            "targetY": 4487.547169811321,
            "name": "마법의 숲 엘리니아",
            "adaptation": True
        },
        {
            "x": 4700,
            "y": 679.0,
            "targetMap": "ant_tunnel",
            "targetX": 520,
            "targetY": 319.04347826086956,
            "name": "던전 개미굴 1",
            "adaptation": True
        }
    ],
    "henesys_hhg": [
        {
            "x": 120,
            "y": 1320.0,
            "targetMap": "henesys_town",
            "targetX": 6240,
            "targetY": 679.0,
            "name": "헤네시스 마을",
            "adaptation": True
        },
        {
            "x": 2180,
            "y": 1320.0,
            "targetMap": "ant_tunnel",
            "targetX": 520,
            "targetY": 319.04347826086956,
            "name": "던전 개미굴 1",
            "adaptation": True
        },
        {
            "x": 750,
            "y": 1320.0,
            "targetMap": "perion_boar",
            "targetX": 280,
            "targetY": 890.5396825396825,
            "name": "와일드보어의 땅",
            "adaptation": True
        }
    ],
    "perion_boar": [
        {
            "x": 220,
            "y": 890.5396825396825,
            "targetMap": "henesys_hhg",
            "targetX": 750,
            "targetY": 1320.0,
            "name": "헤네시스 사냥터 1",
            "adaptation": True
        },
        {
            "x": 1580,
            "y": 885.0,
            "targetMap": "kerning_subway",
            "targetX": 360,
            "targetY": 678.0,
            "name": "커닝시티 지하철 1호선",
            "adaptation": True
        }
    ],
    "kerning_subway": [
        {
            "x": 320,
            "y": 678.0,
            "targetMap": "perion_boar",
            "targetX": 1520,
            "targetY": 885.0,
            "name": "와일드보어의 땅",
            "adaptation": True
        },
        {
            "x": 3650,
            "y": 678.0,
            "targetMap": "kerning_pq",
            "targetX": 150,
            "targetY": 2549.0,
            "name": "커닝시티 파퀘 킹슬라임 제단",
            "adaptation": True
        }
    ],
    "kerning_pq": [
        {
            "x": 90,
            "y": 2549.0,
            "targetMap": "kerning_subway",
            "targetX": 3580,
            "targetY": 678.0,
            "name": "커닝시티 지하철 1호선",
            "adaptation": True
        }
    ],
    "ant_tunnel": [
        {
            "x": 520,
            "y": 319.04347826086956,
            "targetMap": "henesys_town",
            "targetX": 4700,
            "targetY": 679.0,
            "name": "헤네시스 마을",
            "adaptation": True
        },
        {
            "x": 440,
            "y": 331.0204081632653,
            "targetMap": "henesys_hhg",
            "targetX": 2120,
            "targetY": 1320.0,
            "name": "헤네시스 사냥터 1",
            "adaptation": True
        },
        {
            "x": 1500,
            "y": 1179.0576923076924,
            "targetMap": "sleepy_dungeon",
            "targetX": 120,
            "targetY": 1019.0,
            "name": "저주받은 신전",
            "adaptation": True
        },
        {
            "x": 2800,
            "y": 2087.1428571428573,
            "targetMap": "zakum_altar",
            "targetX": 260,
            "targetY": 534.0909090909091,
            "name": "자쿰의 제단",
            "adaptation": True
        }
    ],
    "sleepy_dungeon": [
        {
            "x": 60,
            "y": 1019.0,
            "targetMap": "ant_tunnel",
            "targetX": 1500,
            "targetY": 1179.0576923076924,
            "name": "개미굴 1",
            "adaptation": True
        },
        {
            "x": 1420,
            "y": 1019.0,
            "targetMap": "zakum_altar",
            "targetX": 260,
            "targetY": 534.0909090909091,
            "name": "자쿰의 제단",
            "adaptation": True
        }
    ],
    "ellinia": [
        {
            "x": 300,
            "y": 4487.547169811321,
            "targetMap": "henesys_town",
            "targetX": 160,
            "targetY": 499.0,
            "name": "헤네시스 마을",
            "adaptation": True
        },
        {
            "x": 2500,
            "y": 4435.72,
            "targetMap": "ship_orbis",
            "targetX": 660,
            "targetY": 1017.5792349726776,
            "name": "오르비스행 비행선 갑판",
            "adaptation": True
        },
        {
            "x": 1800,
            "y": 4336.159090909091,
            "targetMap": "zakum_altar",
            "targetX": 260,
            "targetY": 534.0909090909091,
            "name": "자쿰의 제단",
            "adaptation": True
        }
    ],
    "ship_orbis": [
        {
            "x": 660,
            "y": 1017.5792349726776,
            "targetMap": "ellinia",
            "targetX": 2440,
            "targetY": 4435.72,
            "name": "마법의 숲 엘리니아",
            "adaptation": True
        },
        {
            "x": 920,
            "y": 995.5787878787879,
            "targetMap": "el_nath_deadmine",
            "targetX": 340,
            "targetY": 840.0,
            "name": "죽은나무의 숲 4",
            "adaptation": True
        }
    ],
    "el_nath_deadmine": [
        {
            "x": 280,
            "y": 840.0,
            "targetMap": "ship_orbis",
            "targetX": 660,
            "targetY": 1017.5792349726776,
            "name": "오르비스행 비행선 갑판",
            "adaptation": True
        },
        {
            "x": 2320,
            "y": 900.0,
            "targetMap": "ludi_clocktower",
            "targetX": 840,
            "targetY": 480.0,
            "name": "시계탑 최하층 잊혀진 시간의 길 3",
            "adaptation": True
        }
    ],
    "ludi_clocktower": [
        {
            "x": 780,
            "y": 480.0,
            "targetMap": "el_nath_deadmine",
            "targetX": 2260,
            "targetY": 900.0,
            "name": "죽은나무의 숲 4",
            "adaptation": True
        },
        {
            "x": 2200,
            "y": 2195.0,
            "targetMap": "zakum_altar",
            "targetX": 260,
            "targetY": 534.0909090909091,
            "name": "자쿰의 제단",
            "adaptation": True
        }
    ],
    "zakum_altar": [
        {
            "x": 60,
            "y": 537.0,
            "targetMap": "sleepy_dungeon",
            "targetX": 1360,
            "targetY": 1019.0,
            "name": "저주받은 신전",
            "adaptation": True
        },
        {
            "x": 400,
            "y": 537.875,
            "targetMap": "el_nath_deadmine",
            "targetX": 340,
            "targetY": 840.0,
            "name": "죽은나무의 숲 4",
            "adaptation": True
        },
        {
            "x": 200,
            "y": 539.5333333333333,
            "targetMap": "ludi_clocktower",
            "targetX": 2150,
            "targetY": 2195.0,
            "name": "시계탑 최하층 잊혀진 시간의 길 3",
            "adaptation": True
        }
    ]
}

with open("js/map_data.js", "r", encoding="utf-8") as f:
    text = f.read()

# Replace each map's "portals": [ ... ] with the new formatted portals
import re

for map_key, portals in portals_update.items():
    formatted_json = json.dumps(portals, ensure_ascii=False, indent=6)
    # Match the "key": "map_key" block or "map_key": { ... "portals": [ ... ]
    # We can locate: "map_key": { ... "portals": [ ... ]
    pattern = rf'("{map_key}":\s*\{{.*?\"portals\":\s*\[)(.*?)(\]\s*,\s*\"mobSpawns\")'
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        print(f"FAILED TO MATCH: {map_key}")
        continue
    
    # We replace match.group(2) with formatted_json lines (excluding outer brackets)
    # Let's inspect formatted_json
    # outer brackets: [ ... ]
    inner_portals = formatted_json[1:-1] # strip leading [ and trailing ]
    replacement = r'\1' + inner_portals + '\n    ' + r'\3'
    text = text[:match.start()] + re.sub(pattern, replacement, text[match.start():match.end()], flags=re.DOTALL) + text[match.end():]
    print(f"Updated portals for: {map_key}")

with open("js/map_data.js", "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully wrote updated map_data.js!")
