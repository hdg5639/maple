"""Static Verification Gate (QC): Asset Link Audit & UIManager Method Coherence Check."""
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent


def audit_static_asset_links():
    asset_pattern = re.compile(
        r"""['"](assets/[a-zA-Z0-9_./-]+\.(?:png|gif|jpg|jpeg|svg|mp3|wav|ogg|json))['"]"""
    )
    targets = [ROOT / "index.html", ROOT / "style.css", *sorted((ROOT / "js").glob("*.js"))]
    missing = []
    checked = set()

    for file_path in targets:
        if not file_path.exists():
            continue
        text = file_path.read_text(encoding="utf-8", errors="replace")
        for match in asset_pattern.finditer(text):
            rel_path = match.group(1)
            checked.add(rel_path)
            full_path = ROOT / rel_path
            if not full_path.is_file():
                missing.append((file_path.relative_to(ROOT), rel_path))

    if missing:
        for src, rel in missing:
            print(f"[FAIL] Missing static asset referenced in {src}: {rel}")
        raise AssertionError(f"{len(missing)} missing asset link(s) detected.")
    print(f"[PASS] Static asset link audit: {len(checked)} unique asset paths verified on disk.")


def audit_ui_methods():
    ui_path = ROOT / "js" / "ui.js"
    text = ui_path.read_text(encoding="utf-8", errors="replace")

    declared = set(
        re.findall(r"^\s{2}([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{", text, flags=re.MULTILINE)
    )
    assigned_props = set(
        re.findall(r"\bthis\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=", text)
    )
    valid_methods = declared | assigned_props

    called = set(re.findall(r"\bthis\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", text))
    missing_methods = sorted(called - valid_methods)
    if missing_methods:
        print(f"[FAIL] UIManager calls undeclared method(s): {missing_methods}")
        raise AssertionError(f"Undeclared UIManager methods: {missing_methods}")
    print(f"[PASS] UIManager method coherence audit: {len(called)} called methods verified.")


def main():
    audit_static_asset_links()
    audit_ui_methods()
    print("QC Static Verification Gate (audit_assets.py): 100% PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
