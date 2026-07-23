"""作曲オーケストレーション（テーマ → Arrangement）。"""

from __future__ import annotations

import random

from .generators import BassGenerator, ChordGenerator, DrumGenerator, MelodyGenerator
from .models import Arrangement
from .themes import get_theme


class GameMusicComposer:
    """
    テーマ設定を読み、各生成器に委譲して Arrangement を組み立てる。
    責務は「どの進行を何小節で回すか」まで。MIDI書き出しは別クラス。
    """

    def __init__(self) -> None:
        self.melody_generator = MelodyGenerator()
        self.chord_generator = ChordGenerator()
        self.bass_generator = BassGenerator()
        self.drum_generator = DrumGenerator()

    def compose(
        self,
        theme_id: str,
        *,
        length_seconds: float = 60.0,
        tempo_bpm: int | None = None,
        seed: int | None = None,
        progression_index: int | None = None,
    ) -> Arrangement:
        theme = get_theme(theme_id)
        rng = random.Random(seed)
        tempo = tempo_bpm if tempo_bpm is not None else theme.tempo_bpm
        beats_per_bar = 4
        # ループしやすいよう 4 の倍数小節にする
        beats_needed = (length_seconds * tempo) / 60.0
        bars = max(4, int(round(beats_needed / beats_per_bar)))
        bars = max(4, (bars // 4) * 4)
        length_beats = float(bars * beats_per_bar)

        if progression_index is None:
            progression_index = rng.randrange(len(theme.progressions))
        progression = theme.progressions[progression_index % len(theme.progressions)]

        # タイトル／Forest は鼻歌モチーフ、それ以外は通常のモチーフ生成
        if theme.theme_id == "title":
            melody_style = "title"
        elif theme.theme_id == "forest":
            melody_style = "forest"
        else:
            melody_style = "default"
        melody = self.melody_generator.generate(
            rng,
            theme.key,
            progression,
            bars,
            beats_per_bar,
            style=melody_style,
        )
        chords = self.chord_generator.generate(
            rng, theme.key, progression, bars, beats_per_bar
        )
        bass = self.bass_generator.generate(
            rng, theme.key, progression, bars, beats_per_bar
        )

        # タイトルは控えめなドラム（ハーフタイム）＋全体を少し静かに
        if theme.theme_id == "title":
            drums = self.drum_generator.generate(
                rng, bars, beats_per_bar, pattern_index=3
            )
            for hit in drums:
                hit.velocity = max(28, int(hit.velocity * 0.5))
            for note in chords:
                note.velocity = max(40, int(note.velocity * 0.8))
            for note in bass:
                note.velocity = max(50, int(note.velocity * 0.85))
            for note in melody:
                note.velocity = max(55, int(note.velocity * 0.9))
        elif theme.theme_id == "forest":
            # Forest: 軽めのドラムで明るく軽快に
            drums = self.drum_generator.generate(
                rng, bars, beats_per_bar, pattern_index=1
            )
            for hit in drums:
                hit.velocity = max(32, int(hit.velocity * 0.7))
        else:
            drums = self.drum_generator.generate(rng, bars, beats_per_bar)

        return Arrangement(
            theme_id=theme.theme_id,
            key=theme.key,
            tempo_bpm=tempo,
            time_signature=(4, 4),
            length_beats=length_beats,
            melody=melody,
            chords=chords,
            bass=bass,
            drums=drums,
        )
