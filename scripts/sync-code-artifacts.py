"""Synchronize displayed Python, cipher constants, and existing downloadable bundles.

Use --check in CI to detect drift without changing files. Never touches podcast data.
"""
import argparse
import ast
import io
import json
from pathlib import Path
import re
import zipfile
from explanation_sources import refresh_explanations

ROOT = Path(__file__).resolve().parents[1]
ALGOS = ("des", "aes", "rc5", "idea", "gost", "rc4", "rc6", "cast", "blowfish")

def constants(algo):
    tree = ast.parse((ROOT / algo / f"{algo}_manual.py").read_text())
    return {node.targets[0].id: ast.literal_eval(node.value) for node in tree.body
            if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name)}

def sync(check=False):
    changed = []
    def write(path, data):
        data = data.encode() if isinstance(data, str) else data
        if path.exists() and path.read_bytes() == data:
            return
        changed.append(str(path.relative_to(ROOT)))
        if not check:
            path.write_bytes(data)

    for algo in ALGOS:
        path = ROOT / "src/content/algorithms" / f"{algo}.ts"
        source = path.read_text()
        pattern = r'("fileName":\s*"([^"]+)".*?"code":\s*)("(?:[^"\\]|\\.)*")'
        def code(match):
            return match[1] + json.dumps((ROOT / algo / match[2]).read_text(), ensure_ascii=False)
        source = re.sub(pattern, code, source, flags=re.S)
        if algo in ("rc5", "rc6", "idea"):
            source = source.replace('"category": "libs"', '"category": "wrapper"')
            source = source.replace(f'{algo}_libs.py (باستخدام المكتبات القياسية)', f'{algo}_libs.py (واجهة توافق للتطبيق اليدوي)')
            source = source.replace('التطبيق القياسي باستخدام مكتبات التشفير المعتمدة (PyCryptodome / gostcrypto)', 'واجهة توافق تعيد تصدير التطبيق اليدوي ولا تعتمد على مكتبة تشفير مستقلة')
        write(path, source)

    explanations = ROOT / "src/content/code_explanations.json"
    contents = json.loads(explanations.read_text())
    refresh_explanations(contents, ROOT)
    write(explanations, json.dumps(contents, ensure_ascii=False, indent=2)+"\n")

    cast = constants("cast")
    bf = constants("blowfish")
    data = dict(cast=[cast[f"S{i}"] for i in range(1,9)],
                blowfishP=bf["P_INIT"], blowfishS=[bf[f"S{i}_INIT"] for i in range(4)],
                des=constants("des"), gost=constants("gost")["_S_BOX_MAGMA"])
    write(ROOT / "src/lib/crypto/cipher-tables.json", json.dumps(data, separators=(",", ":"))+"\n")

    for name in [*ALGOS, "crypto_lab_full"]:
        public = ROOT / "public/downloads" / f"{name}.zip"
        with zipfile.ZipFile(public) as archive:
            entries = {item.filename: archive.read(item) for item in archive.infolist() if not item.is_dir()}
        for filename in entries:
            source = ROOT / filename
            if source.is_file():
                entries[filename] = source.read_bytes()
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for filename in sorted(entries):
                info = zipfile.ZipInfo(filename, date_time=(1980,1,1,0,0,0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, entries[filename])
        for folder in ("public/downloads", "docs/downloads"):
            write(ROOT / folder / f"{name}.zip", buffer.getvalue())
    if changed:
        print(("Out of sync: " if check else "Updated: ") + ", ".join(changed))
    else:
        print("Displayed sources, cipher tables and download bundles are synchronized.")
    return bool(changed)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    raise SystemExit(1 if sync(args.check) and args.check else 0)
