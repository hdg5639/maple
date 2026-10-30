"""Run the QP/QA/QC regression gate against a running local server.

Failure stops the gate; fix the registered defect and rerun this command.
No commits, pushes or source regeneration are performed by this runner.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf8', errors='replace')

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'scratch_scripts/verification'


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    commands = [['node', '--test', *[p.name for p in sorted(ROOT.glob('test_*.js'))]]]
    commands += [[sys.executable, name] for name in (
        'run_qa.py', 'game_qa_suite.py', 'test_multi_tier_pipeline.py',
        'test_input_regressions.py', 'test_sprite_grounding.py', 'test_ladder_browser.py',
        'test_world_browser.py', 'test_rpg_browser.py', 'test_zakum_assembly.py', 'test_responsive_ui.py', 'test_zakum_playability.py')]
    for command in commands:
        if command[-1].endswith('.py') and not (ROOT / command[-1]).exists():
            raise FileNotFoundError(command[-1])
    results = []
    for index, command in enumerate(commands):
        print('RUN', ' '.join(command), flush=True)
        start = time.monotonic()
        result = subprocess.run(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        log = OUTPUT / f'{index:02d}_{Path(command[-1]).stem}.log'
        log.write_bytes(result.stdout)
        results.append({'command':command, 'exitCode':result.returncode,
                        'seconds':round(time.monotonic()-start,2), 'log':str(log.relative_to(ROOT))})
        (OUTPUT/'results.json').write_text(json.dumps(results,indent=2)+'\n', encoding='utf8')
        print(('PASS' if result.returncode == 0 else 'FAIL'), log, flush=True)
        if result.returncode:
            print(result.stdout.decode('utf8',errors='replace'))
            return result.returncode
    print('All regression gates passed. Review screenshots and CLASSIC_RESEARCH_AND_QA.md before QC signoff.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
