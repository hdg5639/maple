"""Check real Zakum PNG assembly against the pinned GMS62 WZ origins.

Run with Python/Pillow and Node; no server or browser is required.
"""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parent
FOLDER = ROOT / 'assets' / 'monsters' / 'zakum'


def runtime_geometry():
    script = r"""
const fs = require('fs'), vm = require('vm');
const context = vm.createContext({window: {}, console, Math});
for (const path of ['js/sprite_grounding.js', 'js/entities.js']) {
  vm.runInContext(fs.readFileSync(path, 'utf8'), context, {filename: path});
}
const boss = new context.window.ZakumBoss().setGroundPosition(600, 537);
const samples = [];
// At body 4fps and arms 5fps, 160 samples visit every frame combination
// reached by the real animation clock over its full eight-second period.
for (let tick = 0; tick < 160; tick++) {
  boss.animationTime = tick / 20;
  samples.push({body: boss.getPartGeometry(),
    arms: boss.arms.map(arm => boss.getPartGeometry('arm', arm))});
}
process.stdout.write(JSON.stringify(samples));
"""
    result = subprocess.run(['node', '-e', script], cwd=ROOT, text=True,
                            capture_output=True, check=True)
    return json.loads(result.stdout)


def mask(part, frame, draw_x, draw_y):
    filename = f'stand_{frame}.png' if part == 'body' else f'arm_{part}_{frame}.png'
    with Image.open(FOLDER / filename) as image:
        alpha = image.convert('RGBA').getchannel('A').point(lambda a: 255 if a >= 32 else 0)
    canvas = Image.new('L', (1200, 800))
    canvas.paste(alpha, (draw_x, draw_y))
    return canvas


def main():
    origins = json.loads((FOLDER / 'origins.json').read_text(encoding='utf-8'))
    source = json.loads((FOLDER / 'origins_source.json').read_text(encoding='utf-8'))
    assert len(source) == 72
    for record in source:
        part, frame = record['part'], record['frame']
        expected_id = 8800000 if part == 'body' else 8800002 + int(part)
        assert record['id'] == expected_id
        expected = [a + b for a, b in zip(record['origin'], record['padding'])]
        assert expected == record['bakedOrigin'] == origins[part][frame]
        assert record['matchError'] < 3, f'{part}/{frame}: PNG/WZ registration mismatch'

    # Independent pixel evidence: each shoulder joins the statue in every
    # possible body/arm pose, and each limb still has a visible outer portion.
    body_masks = [mask('body', frame, 600 - origin[0], 533 - origin[1])
                  for frame, origin in enumerate(origins['body'])]
    checked = 0
    for arm in range(1, 9):
        for frame, origin in enumerate(origins[str(arm)]):
            arm_mask = mask(arm, frame, 600 - origin[0], 533 - origin[1])
            for body_mask in body_masks:
                assert ImageChops.multiply(arm_mask, body_mask).getbbox(), f'arm {arm}/{frame}: detached shoulder'
                assert ImageChops.subtract(arm_mask, body_mask).getbbox(), f'arm {arm}/{frame}: hidden limb'
                checked += 1

    for sample in runtime_geometry():
        for part, geometry in [('body', sample['body'])] + [
                (str(i + 1), value) for i, value in enumerate(sample['arms'])]:
            origin = origins[part][geometry['frame']]
            assert geometry['drawX'] == 600 - origin[0], f'{part}: runtime X bypasses WZ origin'
            assert geometry['drawY'] == 533 - origin[1], f'{part}: runtime Y bypasses WZ origin'
            assert geometry['maskRects'], f'{part}: missing opaque collision mask'
        assert sample['body']['y'] + sample['body']['height'] == 537
    print(f'PASS: 72 pinned WZ registrations, {checked} PNG joint/visibility combinations, '
          '160 runtime poses with shared origins and floor contact')


if __name__ == '__main__':
    main()
