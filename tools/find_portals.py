import json

with open("js/map_data.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

cur_map = ""
for i, line in enumerate(lines):
    if line.startswith('  "') and '": {' in line:
        cur_map = line.strip().split('"')[1]
    if '"portals": [' in line:
        print(f"{cur_map}: line {i+1}")
