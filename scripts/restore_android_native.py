"""Restore Android native modules from agent transcript."""
import json
import os
from collections import defaultdict

TRANSCRIPT = r"C:\Users\Assil\.cursor\projects\c-Projects-Kiddy\agent-transcripts\08ce52be-24c0-4c68-ae78-2e933bcf9ffc\08ce52be-24c0-4c68-ae78-2e933bcf9ffc.jsonl"
ROOT = r"C:\Projects\Kiddy"
ANDROID_ROOT = os.path.join(ROOT, "android")


def norm(path: str) -> str:
    return os.path.normpath(path).lower()


files: dict[str, str] = {}
ops: dict[str, list[tuple[str, str]]] = defaultdict(list)

with open(TRANSCRIPT, "r", encoding="utf-8") as handle:
    for line in handle:
        obj = json.loads(line)
        if obj.get("role") != "assistant":
            continue
        for item in obj.get("message", {}).get("content", []):
            if item.get("type") != "tool_use":
                continue
            name = item.get("name")
            inp = item.get("input", {})
            path = inp.get("path", "")
            if "android" not in norm(path):
                continue
            rel = os.path.relpath(path, ANDROID_ROOT)
            if name == "Write":
                files[rel] = inp.get("contents", "")
            elif name == "StrReplace":
                ops[rel].append((inp.get("old_string", ""), inp.get("new_string", "")))

for rel, replacements in ops.items():
    if rel not in files:
        continue
    content = files[rel]
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new, 1)
        else:
            print(f"WARN missing replace in {rel}: {old[:80]!r}")
    files[rel] = content


def to_wlidi(content: str) -> str:
    content = content.replace("com.kiddy.app", "com.wlidi.app")
    content = content.replace("KiddyBootReceiver", "WlidiBootReceiver")
    content = content.replace('"Kiddy"', '"WLIDI"')
    content = content.replace("'Kiddy'", "'WLIDI'")
    return content


for rel, content in sorted(files.items()):
    if not (rel.endswith(".kt") or rel.endswith(".xml")):
        continue
    rel_wlidi = rel.replace("com\\kiddy\\app", "com\\wlidi\\app")
    dest = os.path.join(ANDROID_ROOT, rel_wlidi)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as out:
        out.write(to_wlidi(content))
    print(f"WROTE {rel_wlidi} ({len(content)} bytes)")
