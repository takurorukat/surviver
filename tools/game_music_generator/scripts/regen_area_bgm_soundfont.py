#!/usr/bin/env python3
"""
提案 B: エリア別の進行・編成で BGM を作り直し、SoundFont でゲームに入れる。

使い方:
  cd tools/game_music_generator
  python scripts/regen_area_bgm_soundfont.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent.parent
PUBLIC_AUDIO = REPO_ROOT / "public" / "assets" / "audio"
OUT_DIR = ROOT / "output" / "area_distinct"
SF2 = ROOT / "soundfonts" / "TimGM6mb.sf2"

sys.path.insert(0, str(ROOT))

from game_music_generator import GameMusicComposer  # noqa: E402
from game_music_generator.fluid_synth import FluidSynthRenderer  # noqa: E402
from game_music_generator.midi_writer import MidiWriter  # noqa: E402

# theme_id, seed, public ogg name, length_seconds
BGM_JOBS = [
    ("title", 42, "title_bgm.ogg", 48.0),
    ("plains", 42, "plains_bgm.ogg", 60.0),
    ("forest", 42, "forest_bgm.ogg", 60.0),
    ("volcano", 42, "volcano_bgm.ogg", 60.0),
    ("dungeon", 42, "ruins_bgm.ogg", 60.0),
]


def convert_wav_to_ogg(wav_path: Path, ogg_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(wav_path),
            "-c:a",
            "libvorbis",
            "-q:a",
            "5",
            str(ogg_path),
        ],
        check=True,
        capture_output=True,
    )


def backup_one(ogg_name: str) -> None:
    src = PUBLIC_AUDIO / ogg_name
    if not src.is_file():
        return
    backup_dir = PUBLIC_AUDIO / "_softsynth_backup" / "before_area_distinct_b"
    backup_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, backup_dir / ogg_name)


def main() -> int:
    if not SF2.is_file():
        print(f"Missing SoundFont: {SF2}", file=sys.stderr)
        return 1
    if shutil.which("fluidsynth") is None:
        print("fluidsynth not found", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    composer = GameMusicComposer()
    writer = MidiWriter()
    renderer = FluidSynthRenderer(soundfont_path=SF2, gain=0.55)

    for theme_id, seed, public_name, length in BGM_JOBS:
        backup_one(public_name)
        arrangement = composer.compose(
            theme_id,
            length_seconds=length,
            seed=seed,
            progression_index=0,
        )
        midi_path = OUT_DIR / f"{theme_id}_area_b.mid"
        writer.write(arrangement, midi_path)
        wav_path = midi_path.with_suffix(".wav")
        ogg_path = midi_path.with_suffix(".ogg")
        renderer.render_midi_file(midi_path, wav_path)
        convert_wav_to_ogg(wav_path, ogg_path)
        dest = PUBLIC_AUDIO / public_name
        shutil.copy2(ogg_path, dest)
        print(
            f"Installed {public_name} "
            f"(key={arrangement.key}, tempo={arrangement.tempo_bpm}, theme={theme_id})"
        )

    marker = PUBLIC_AUDIO / "_audio_renderer.txt"
    marker.write_text(
        "renderer=fluid\n"
        "variant=area_distinct_b\n"
        "restore_bgm=public/assets/audio/_softsynth_backup/before_area_distinct_b/\n"
        "or=python tools/game_music_generator/scripts/restore_softsynth_audio.py\n",
        encoding="utf-8",
    )
    print("Done. Previous BGM copies: _softsynth_backup/before_area_distinct_b/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
