#!/usr/bin/env python3
"""
Generator de manifest pentru galeria foto de nuntă.

Scanează folderul photos/, detectează albumele (foldere numerotate, ex. "1. Cununie")
și fișierele din interior (poze/video), le sortează crescător după numărul din nume
(ex. DSC_0001, DSC_0002, ...), apoi scrie rezultatul în data/manifest.json.

Rulare (din rădăcina proiectului):
    python3 scripts/generate_manifest.py

Nu are nevoie de nimic instalat în plus - doar Python 3 standard.
"""

import json
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = ROOT / "photos"
OUTPUT_FILE = ROOT / "data" / "manifest.json"

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"}
VIDEO_EXT = {".mp4", ".mov", ".webm", ".avi", ".m4v"}
VALID_EXT = IMAGE_EXT | VIDEO_EXT

# Potrivește foldere de tipul "1. Cununie", "2 - Petrecere", "10.Dans" etc.
FOLDER_PATTERN = re.compile(r"^\s*(\d+)\s*[.\-_]?\s*(.*)$")
NUMBER_PATTERN = re.compile(r"(\d+)")

DIACRITICS_MAP = str.maketrans({
    "ă": "a", "Ă": "a",
    "â": "a", "Â": "a",
    "î": "i", "Î": "i",
    "ș": "s", "Ș": "s", "ş": "s", "Ş": "s",
    "ț": "t", "Ț": "t", "ţ": "t", "Ţ": "t",
})


def slugify(text: str) -> str:
    text = text.translate(DIACRITICS_MAP).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "album"


def natural_key(filename: str):
    """Sortare crescătoare după ultimul număr găsit în nume (DSC_0001 -> 1).

    Căutăm numărul doar în numele fără extensie (stem) - altfel extensii ca
    .mp4 sau .m4v ar "contamina" căutarea cu cifra din numele extensiei.
    """
    stem = Path(filename).stem
    matches = NUMBER_PATTERN.findall(stem)
    if matches:
        return (0, int(matches[-1]), filename.lower())
    return (1, 0, filename.lower())


def detect_type(ext: str) -> str:
    ext = ext.lower()
    if ext in IMAGE_EXT:
        return "image"
    if ext in VIDEO_EXT:
        return "video"
    return "other"


def scan_albums():
    if not PHOTOS_DIR.exists():
        print(f"Folderul '{PHOTOS_DIR.name}/' nu există încă. Creează-l, adaugă albume, apoi rulează din nou scriptul.")
        return []

    albums = []
    skipped_no_media = []

    for entry in sorted(PHOTOS_DIR.iterdir()):
        if not entry.is_dir() or entry.name.startswith('.'):
            continue

        match = FOLDER_PATTERN.match(entry.name)
        if match:
            order = int(match.group(1))
            title = match.group(2).strip() or f"Album {order}"
        else:
            order = 9999
            title = entry.name
            print(f"ℹ️  '{entry.name}' nu începe cu un număr (ex: '1. Nume') - va apărea ultimul.")

        items = [
            f.name for f in entry.iterdir()
            if f.is_file() and not f.name.startswith('.') and f.suffix.lower() in VALID_EXT
        ]

        if not items:
            skipped_no_media.append(entry.name)
            continue

        items.sort(key=natural_key)
        cover = next((i for i in items if detect_type(Path(i).suffix) == "image"), items[0])

        albums.append({
            "id": f"{order}-{slugify(title)}",
            "order": order,
            "title": title,
            "folder": f"photos/{entry.name}",
            "cover": cover,
            "items": [{"file": i, "type": detect_type(Path(i).suffix)} for i in items],
        })

    albums.sort(key=lambda a: (a["order"], a["title"].lower()))

    if skipped_no_media:
        print("⚠️  Foldere ignorate (nu conțin poze/video recunoscute): " + ", ".join(skipped_no_media))

    return albums


def main():
    albums = scan_albums()
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "albumCount": len(albums),
        "itemCount": sum(len(a["items"]) for a in albums),
        "albums": albums,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Manifest generat: {OUTPUT_FILE.relative_to(ROOT)}")
    print(f"   {len(albums)} albume, {manifest['itemCount']} fișiere în total.\n")
    for a in albums:
        print(f"   {a['order']:>4}. {a['title']:<30} ({len(a['items'])} fișiere)")


if __name__ == "__main__":
    main()
