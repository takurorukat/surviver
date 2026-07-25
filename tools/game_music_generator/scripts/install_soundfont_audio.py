#!/usr/bin/env python3
"""
現行の public/assets/audio/*.ogg をバックアップし、
SoundFont（FluidSynth）で BGM と長い結果ジングルだけ再レンダーして入れ替える。

短尺戦闘／UI SE（敵撃破・ヒット・コイン・メニュー等）は上書きしない。
それらは scripts/regen_element_bullet_sfx.py（波形合成）が唯一の生成元。

使い方:
  cd tools/game_music_generator
  source .venv312/bin/activate   # または .venv
  python scripts/install_soundfont_audio.py

元に戻す:
  python scripts/restore_softsynth_audio.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent.parent
PUBLIC_AUDIO = REPO_ROOT / "public" / "assets" / "audio"
BACKUP_DIR = PUBLIC_AUDIO / "_softsynth_backup"
OUTPUT_DIR = ROOT / "output" / "soundfont_install"
SF2 = ROOT / "soundfonts" / "TimGM6mb.sf2"

sys.path.insert(0, str(ROOT))

from game_music_generator.fluid_synth import FluidSynthRenderer  # noqa: E402
from game_music_generator.jingles import JINGLE_BUILDERS  # noqa: E402


# ゲームに入れるファイル名 → 既存 MIDI（あれば）またはジングル ID
# BGM は現行メロディを保つため、output 内の代表 MIDI を優先する
BGM_MIDI_SOURCES: dict[str, Path] = {
    "title_bgm.ogg": ROOT / "output" / "title_006.mid",
    "plains_bgm.ogg": ROOT / "output" / "plains_001.mid",
    "forest_bgm.ogg": ROOT / "output" / "forest_003.mid",
    "volcano_bgm.ogg": ROOT / "output" / "volcano_001.mid",
    "ruins_bgm.ogg": ROOT / "output" / "dungeon_002.mid",
    "area_clear_bgm.ogg": ROOT / "output" / "area_clear_002.mid",
}

# 長い結果ジングルのみ（短尺 SE は regen_element_bullet_sfx.py 担当）
RESULT_JINGLE_IDS: dict[str, str] = {
    "game_over.ogg": "game_over",
    "level_up.ogg": "level_up",
    "stage_clear.ogg": "stage_clear",
    "area_clear.ogg": "area_clear",
}

# 既存 MIDI があればジングルより優先（品質・長さを維持）
RESULT_MIDI_OVERRIDES: dict[str, Path] = {
    "game_over.ogg": ROOT / "output" / "game_over_001.mid",
    "level_up.ogg": ROOT / "output" / "level_up_002.mid",
    "stage_clear.ogg": ROOT / "output" / "stage_clear_001.mid",
    "area_clear.ogg": ROOT / "output" / "area_clear_002.mid",
}


def convert_wav_to_ogg(wav_path: Path, ogg_path: Path) -> None:
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(wav_path),
        "-c:a",
        "libvorbis",
        "-q:a",
        "5",
        str(ogg_path),
    ]
    subprocess.run(command, check=True, capture_output=True)


def backup_current_ogg_files() -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stamped = BACKUP_DIR / stamp
    stamped.mkdir(parents=True, exist_ok=True)
    latest = BACKUP_DIR / "latest"
    if latest.exists() or latest.is_symlink():
        if latest.is_symlink() or latest.is_file():
            latest.unlink()
        else:
            shutil.rmtree(latest)
    latest.mkdir(parents=True, exist_ok=True)

    copied = 0
    for ogg_path in sorted(PUBLIC_AUDIO.glob("*.ogg")):
        # バックアップ用フォルダ内や旧 backup ファイルも対象外にしない（全部保存）
        dest_stamp = stamped / ogg_path.name
        dest_latest = latest / ogg_path.name
        shutil.copy2(ogg_path, dest_stamp)
        shutil.copy2(ogg_path, dest_latest)
        copied += 1
    print(f"Backed up {copied} ogg files -> {stamped}")
    print(f"Also mirrored to {latest}")
    return latest


def render_midi_to_public(midi_path: Path, public_name: str, renderer: FluidSynthRenderer) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stem = public_name.replace(".ogg", "")
    wav_path = OUTPUT_DIR / f"{stem}.wav"
    ogg_path = OUTPUT_DIR / f"{stem}.ogg"
    renderer.render_midi_file(midi_path, wav_path)
    convert_wav_to_ogg(wav_path, ogg_path)
    dest = PUBLIC_AUDIO / public_name
    shutil.copy2(ogg_path, dest)
    print(f"Installed {dest} <- {midi_path.name}")


def ensure_jingle_midi(jingle_id: str) -> Path:
    midi_path = OUTPUT_DIR / f"{jingle_id}_new.mid"
    builder = JINGLE_BUILDERS[jingle_id]
    builder(midi_path)
    return midi_path


def pick_existing_midi(preferred: Path, fallbacks: list[Path]) -> Path | None:
    if preferred.is_file():
        return preferred
    for path in fallbacks:
        if path.is_file():
            return path
    return None


def main() -> int:
    if not SF2.is_file():
        print(f"SoundFont missing: {SF2}", file=sys.stderr)
        return 1
    if shutil.which("fluidsynth") is None:
        print("fluidsynth not found. brew install fluid-synth", file=sys.stderr)
        return 1
    if shutil.which("ffmpeg") is None:
        print("ffmpeg not found", file=sys.stderr)
        return 1

    PUBLIC_AUDIO.mkdir(parents=True, exist_ok=True)
    backup_current_ogg_files()
    bgm_renderer = FluidSynthRenderer(soundfont_path=SF2, gain=0.55)
    # 結果ジングルは残響を切ってはっきりさせる
    jingle_renderer = FluidSynthRenderer(
        soundfont_path=SF2, gain=0.7, reverb=False, chorus=False
    )

    # --- BGM ---
    for public_name, preferred in BGM_MIDI_SOURCES.items():
        # title_005 / forest_002 などへフォールバック
        theme = preferred.name.split("_")[0]
        fallbacks = sorted(ROOT.glob(f"output/{theme}_*.mid"), reverse=True)
        midi = pick_existing_midi(preferred, fallbacks)
        if midi is None:
            print(f"SKIP BGM (no midi): {public_name}", file=sys.stderr)
            continue
        render_midi_to_public(midi, public_name, bgm_renderer)

    # --- 長い結果ジングルのみ（短尺 SE は触らない）---
    for public_name, jingle_id in RESULT_JINGLE_IDS.items():
        override = RESULT_MIDI_OVERRIDES.get(public_name)
        if override is not None and override.is_file():
            midi = override
        else:
            midi = ensure_jingle_midi(jingle_id)
        render_midi_to_public(midi, public_name, jingle_renderer)

    # マーカー（今どれを使っているか分かるように）
    marker = PUBLIC_AUDIO / "_audio_renderer.txt"
    marker.write_text(
        "renderer=fluid\n"
        f"soundfont={SF2.name}\n"
        f"installed_at={datetime.now().isoformat(timespec='seconds')}\n"
        "short_sfx=python tools/game_music_generator/scripts/regen_element_bullet_sfx.py\n"
        "restore=python tools/game_music_generator/scripts/restore_softsynth_audio.py\n",
        encoding="utf-8",
    )
    print("Done. SoftSynth backups are in public/assets/audio/_softsynth_backup/latest/")
    print("Short SFX were not overwritten (use regen_element_bullet_sfx.py).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
