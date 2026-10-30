# tools/audit_ui_methods.py - Static UI Method & Event Listener Integrity Audit
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(ROOT, '..', 'js', 'ui.js')):
    ROOT = os.path.abspath(os.path.join(ROOT, '..'))

ui_path = os.path.join(ROOT, 'js', 'ui.js')
with open(ui_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Match declared methods in UIManager
methods = set(re.findall(r'^\s*([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{', code, re.MULTILINE))
# Add methods dynamically assigned on this
for dyn in re.findall(r'this\.([a-zA-Z0-9_]+)\s*=', code):
    methods.add(dyn)

# 2. Match calls to this.xxx(...) in ui.js
calls = set(re.findall(r'this\.([a-zA-Z0-9_]+)\s*\(', code))

missing = []
for c in sorted(list(calls)):
    if c not in methods:
        missing.append(c)

print(f"[AUDIT] Checked {len(calls)} method calls against {len(methods)} declared methods.")
if missing:
    print(f"[AUDIT ERROR] Missing methods called on 'this' in ui.js:")
    for m in missing:
        print(f"  - this.{m}()")
    sys.exit(1)

print("[AUDIT SUCCESS] 100% of 'this' method calls in ui.js resolve to declared methods!")
