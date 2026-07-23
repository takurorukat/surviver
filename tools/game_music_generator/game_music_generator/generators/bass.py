"""ベース生成（ルート中心・時々5度・8分主体）。"""

from __future__ import annotations

import random

from ..harmony import midi_in_octave, progression_mode, triad_pitch_classes
from ..models import NoteEvent


class BassGenerator:
    """ゲーム音楽でよくある歩行ベース。ループ感を重視。"""

    def generate(
        self,
        rng: random.Random,
        key: str,
        progression: tuple[str, ...],
        bars: int,
        beats_per_bar: int = 4,
    ) -> list[NoteEvent]:
        notes: list[NoteEvent] = []
        mode = progression_mode(progression)
        for bar_index in range(bars):
            roman = progression[bar_index % len(progression)]
            root, _third, fifth = triad_pitch_classes(key, roman, mode=mode)
            root_midi = midi_in_octave(root, 2)
            fifth_midi = midi_in_octave(fifth, 2)
            if fifth_midi < root_midi:
                fifth_midi += 12

            start = float(bar_index * beats_per_bar)
            # 8分音符で ルート-ルート-5度-ルート 系
            pattern = self._pick_pattern(rng, root_midi, fifth_midi)
            for step, pitch in enumerate(pattern):
                notes.append(
                    NoteEvent(
                        pitch=pitch,
                        start_beat=start + step * 0.5,
                        duration_beats=0.45,
                        velocity=rng.randint(70, 88),
                    )
                )
        return notes

    def _pick_pattern(
        self,
        rng: random.Random,
        root: int,
        fifth: int,
    ) -> list[int]:
        patterns = [
            [root, root, fifth, root, root, root, fifth, root],
            [root, fifth, root, fifth, root, root, fifth, root],
            [root, root, root, fifth, root, fifth, root, root],
            [root, fifth, fifth, root, root, root, fifth, fifth],
        ]
        return list(rng.choice(patterns))
