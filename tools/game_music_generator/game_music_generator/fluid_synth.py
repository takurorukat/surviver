"""FluidSynth + SoundFont で MIDI を WAV 化する。"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


DEFAULT_SOUNDFONT_NAME = "TimGM6mb.sf2"


def default_soundfont_path() -> Path:
    """tools/game_music_generator/soundfonts/TimGM6mb.sf2"""
    return Path(__file__).resolve().parent.parent / "soundfonts" / DEFAULT_SOUNDFONT_NAME


def find_fluidsynth_binary() -> str | None:
    return shutil.which("fluidsynth")


class FluidSynthRenderer:
    """
    fluidsynth CLI で MIDI → WAV する。
    SoftSynth より楽器感がある。fluidsynth と SoundFont が必要。
    """

    def __init__(
        self,
        sample_rate: int = 44100,
        soundfont_path: Path | None = None,
        gain: float = 0.6,
        *,
        reverb: bool = True,
        chorus: bool = True,
    ) -> None:
        self.sample_rate = sample_rate
        self.soundfont_path = soundfont_path or default_soundfont_path()
        self.gain = gain
        self.reverb = reverb
        self.chorus = chorus

    def render_midi_file(self, midi_path: str | Path, wav_path: str | Path) -> Path:
        midi_path = Path(midi_path)
        wav_path = Path(wav_path)
        wav_path.parent.mkdir(parents=True, exist_ok=True)

        fluidsynth = find_fluidsynth_binary()
        if fluidsynth is None:
            raise RuntimeError(
                "fluidsynth が見つかりません。例: brew install fluid-synth"
            )
        if not self.soundfont_path.is_file():
            raise RuntimeError(f"SoundFont がありません: {self.soundfont_path}")

        # オプションは SoundFont / MIDI より前に置く（FluidSynth 2.x）
        command = [
            fluidsynth,
            "-ni",
            "-F",
            str(wav_path),
            "-r",
            str(self.sample_rate),
            "-g",
            str(self.gain),
            "-R",
            "1" if self.reverb else "0",
            "-C",
            "1" if self.chorus else "0",
            "-O",
            "s16",
            "-T",
            "wav",
            str(self.soundfont_path),
            str(midi_path),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0 or not wav_path.is_file():
            raise RuntimeError(
                "fluidsynth レンダー失敗:\n"
                f"cmd: {' '.join(command)}\n"
                f"stdout: {result.stdout}\n"
                f"stderr: {result.stderr}"
            )
        return wav_path
