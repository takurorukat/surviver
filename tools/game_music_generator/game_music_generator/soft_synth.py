"""簡易ソフトシンセ（numpy）。依存を増やさず WAV を出す。"""

from __future__ import annotations

import wave
from pathlib import Path

import numpy as np
import pretty_midi


class SoftSynthRenderer:
    """
    pretty_midi のノートを正弦波＋軽い減衰で合成する。
    SoundFont なしでもプレビュー用 WAV を作れる。
    """

    def __init__(self, sample_rate: int = 44100) -> None:
        self.sample_rate = sample_rate

    def render_midi_file(self, midi_path: str | Path, wav_path: str | Path) -> Path:
        pm = pretty_midi.PrettyMIDI(str(midi_path))
        duration = max(pm.get_end_time(), 1.0)
        # ループ接続を少し滑らかにするため末尾に余白を足さない
        total_samples = int(duration * self.sample_rate)
        mix = np.zeros(total_samples, dtype=np.float64)

        for instrument in pm.instruments:
            if instrument.is_drum:
                self._render_drums(instrument, mix)
            else:
                self._render_melodic(instrument, mix)

        peak = np.max(np.abs(mix))
        if peak > 0:
            mix = mix / peak * 0.85

        wav_path = Path(wav_path)
        wav_path.parent.mkdir(parents=True, exist_ok=True)
        pcm = np.clip(mix, -1.0, 1.0)
        pcm_i16 = (pcm * 32767.0).astype(np.int16)
        with wave.open(str(wav_path), "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(pcm_i16.tobytes())
        return wav_path

    def _render_melodic(
        self,
        instrument: pretty_midi.Instrument,
        mix: np.ndarray,
    ) -> None:
        for note in instrument.notes:
            start = int(note.start * self.sample_rate)
            end = int(note.end * self.sample_rate)
            if end <= start or start >= len(mix):
                continue
            end = min(end, len(mix))
            n = end - start
            t = np.arange(n) / self.sample_rate
            freq = 440.0 * (2.0 ** ((note.pitch - 69) / 12.0))
            # 音色を少し変える（program で倍音比率）
            if instrument.program >= 70:
                wave_form = np.sin(2 * np.pi * freq * t)
            elif instrument.program >= 40:
                wave_form = (
                    0.7 * np.sin(2 * np.pi * freq * t)
                    + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
                )
            else:
                wave_form = (
                    0.6 * np.sin(2 * np.pi * freq * t)
                    + 0.25 * np.sin(2 * np.pi * freq * 2 * t)
                    + 0.15 * np.sin(2 * np.pi * freq * 3 * t)
                )
            attack = min(n, int(0.02 * self.sample_rate))
            release = min(n, int(0.08 * self.sample_rate))
            env = np.ones(n)
            if attack > 0:
                env[:attack] = np.linspace(0, 1, attack)
            if release > 0:
                env[-release:] *= np.linspace(1, 0, release)
            amp = (note.velocity / 127.0) * 0.18
            mix[start:end] += wave_form * env * amp

    def _render_drums(
        self,
        instrument: pretty_midi.Instrument,
        mix: np.ndarray,
    ) -> None:
        for note in instrument.notes:
            start = int(note.start * self.sample_rate)
            if start >= len(mix):
                continue
            amp = (note.velocity / 127.0) * 0.35
            if note.pitch in (35, 36):
                # kick: 低周波ノイズ減衰
                n = int(0.18 * self.sample_rate)
                n = min(n, len(mix) - start)
                t = np.arange(n) / self.sample_rate
                tone = np.sin(2 * np.pi * (90 * np.exp(-18 * t)) * t)
                env = np.exp(-12 * t)
                mix[start : start + n] += tone * env * amp
            elif note.pitch in (38, 40):
                n = int(0.12 * self.sample_rate)
                n = min(n, len(mix) - start)
                noise = np.random.default_rng(note.pitch + start).normal(0, 1, n)
                t = np.arange(n) / self.sample_rate
                env = np.exp(-28 * t)
                mix[start : start + n] += noise * env * amp * 0.45
            else:
                # hihat
                n = int(0.05 * self.sample_rate)
                n = min(n, len(mix) - start)
                noise = np.random.default_rng(note.pitch + start).normal(0, 1, n)
                t = np.arange(n) / self.sample_rate
                env = np.exp(-50 * t)
                mix[start : start + n] += noise * env * amp * 0.22
