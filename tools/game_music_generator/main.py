#!/usr/bin/env python3
"""
Game Music Generator CLI

例:
  python main.py plains --ogg
  python main.py plains --ogg --renderer soft
  python main.py game_over --ogg --renderer fluid
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from game_music_generator import GameMusicComposer
from game_music_generator.fluid_synth import FluidSynthRenderer, find_fluidsynth_binary
from game_music_generator.jingles import (
    DEPRECATED_SHORT_SFX_JINGLE_BUILDERS,
    JINGLE_BUILDERS,
)
from game_music_generator.midi_writer import MidiWriter
from game_music_generator.soft_synth import SoftSynthRenderer
from game_music_generator.themes import THEME_LIBRARY


def next_output_path(output_dir: Path, theme_id: str) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    index = 1
    while True:
        candidate = output_dir / f"{theme_id}_{index:03d}.mid"
        if not candidate.exists():
            return candidate
        index += 1


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


def known_ids() -> str:
    ids = sorted(set(THEME_LIBRARY.keys()) | set(JINGLE_BUILDERS.keys()))
    return ", ".join(ids)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate loopable game BGM / jingles")
    parser.add_argument(
        "theme",
        nargs="?",
        default="plains",
        help=f"Theme or jingle id. Known: {known_ids()}",
    )
    parser.add_argument("--length", type=float, default=60.0, help="Length in seconds (BGM only)")
    parser.add_argument("--tempo", type=int, default=None, help="Tempo BPM override")
    parser.add_argument("--seed", type=int, default=None, help="Random seed (BGM only)")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "output",
        help="Output directory",
    )
    parser.add_argument("--wav", action="store_true", help="Also write WAV")
    parser.add_argument(
        "--ogg",
        action="store_true",
        help="Also write OGG (requires ffmpeg; implies --wav)",
    )
    parser.add_argument(
        "--renderer",
        choices=("fluid", "soft", "auto"),
        default="auto",
        help="Audio renderer: fluid=SoundFont, soft=正弦波, auto=fluidsynthがあればfluid",
    )
    return parser


def resolve_renderer_name(requested: str) -> str:
    if requested == "soft":
        return "soft"
    if requested == "fluid":
        return "fluid"
    # auto
    if find_fluidsynth_binary() is not None:
        return "fluid"
    return "soft"


def render_audio(
    midi_path: Path,
    want_ogg: bool,
    want_wav: bool,
    renderer_name: str,
) -> None:
    need_wav = want_wav or want_ogg
    if not need_wav:
        return
    wav_path = midi_path.with_suffix(".wav")
    if renderer_name == "fluid":
        FluidSynthRenderer().render_midi_file(midi_path, wav_path)
        print(f"Wrote {wav_path} (fluid / SoundFont)")
    else:
        SoftSynthRenderer().render_midi_file(midi_path, wav_path)
        print(f"Wrote {wav_path} (soft synth)")
    if want_ogg:
        ogg_path = midi_path.with_suffix(".ogg")
        convert_wav_to_ogg(wav_path, ogg_path)
        print(f"Wrote {ogg_path}")


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    renderer_name = resolve_renderer_name(args.renderer)

    if args.theme in DEPRECATED_SHORT_SFX_JINGLE_BUILDERS:
        print(
            f"短尺 SE '{args.theme}' は MIDI/SoundFont では生成しません。\n"
            "波形合成スクリプトを使ってください:\n"
            "  python tools/game_music_generator/scripts/regen_element_bullet_sfx.py --preview-pack\n"
            "  python tools/game_music_generator/scripts/regen_element_bullet_sfx.py "
            f"--install {args.theme}=a",
            file=sys.stderr,
        )
        return 2

    if args.theme in JINGLE_BUILDERS:
        midi_path = next_output_path(args.output_dir, args.theme)
        builder = JINGLE_BUILDERS[args.theme]
        if args.tempo is not None:
            builder(midi_path, tempo_bpm=args.tempo)
        else:
            builder(midi_path)
        print(f"Wrote {midi_path}")
        render_audio(midi_path, want_ogg=args.ogg, want_wav=args.wav, renderer_name=renderer_name)
        return 0

    composer = GameMusicComposer()
    arrangement = composer.compose(
        args.theme,
        length_seconds=args.length,
        tempo_bpm=args.tempo,
        seed=args.seed,
    )
    midi_path = next_output_path(args.output_dir, arrangement.theme_id)
    MidiWriter().write(arrangement, midi_path)
    print(f"Wrote {midi_path}")
    render_audio(midi_path, want_ogg=args.ogg, want_wav=args.wav, renderer_name=renderer_name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
