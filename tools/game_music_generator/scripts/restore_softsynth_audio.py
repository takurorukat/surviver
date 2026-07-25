#!/usr/bin/env python3
"""
SoundFont 差し替え前にバックアップした SoftSynth 版 OGG を復元する。

使い方:
  python tools/game_music_generator/scripts/restore_softsynth_audio.py
  python tools/game_music_generator/scripts/restore_softsynth_audio.py --from 20260724_105000
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PUBLIC_AUDIO = REPO_ROOT / "public" / "assets" / "audio"
BACKUP_ROOT = PUBLIC_AUDIO / "_softsynth_backup"


def main() -> int:
    parser = argparse.ArgumentParser(description="Restore SoftSynth OGG backups")
    parser.add_argument(
        "--from",
        dest="stamp",
        default="latest",
        help="Backup folder name under _softsynth_backup (default: latest)",
    )
    args = parser.parse_args()
    source_dir = BACKUP_ROOT / args.stamp
    if not source_dir.is_dir():
        print(f"Backup not found: {source_dir}", file=sys.stderr)
        return 1

    restored = 0
    for ogg_path in sorted(source_dir.glob("*.ogg")):
        dest = PUBLIC_AUDIO / ogg_path.name
        shutil.copy2(ogg_path, dest)
        restored += 1
        print(f"Restored {dest.name}")

    marker = PUBLIC_AUDIO / "_audio_renderer.txt"
    marker.write_text(
        "renderer=soft\n"
        f"restored_from={source_dir}\n",
        encoding="utf-8",
    )
    print(f"Restored {restored} files from {source_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
