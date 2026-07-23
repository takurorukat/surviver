"""コード伴奏生成。"""

from __future__ import annotations

import random

from ..harmony import midi_in_octave, progression_mode, triad_pitch_classes
from ..models import NoteEvent


class ChordGenerator:
    """各小節に三和音をブロックで置く（軽いアルペジオ混じり）。"""

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
            root, third, fifth = triad_pitch_classes(key, roman, mode=mode)
            start = float(bar_index * beats_per_bar)
            # 平原向け: 穏やかなブロックコード + 時々分散
            voicing = [
                midi_in_octave(root, 4),
                midi_in_octave(third, 4),
                midi_in_octave(fifth, 4),
                midi_in_octave(root, 5),
            ]
            if rng.random() < 0.35:
                # 簡易アルペジオ
                for i, pitch in enumerate(voicing[:3]):
                    notes.append(
                        NoteEvent(
                            pitch=pitch,
                            start_beat=start + i * 0.5,
                            duration_beats=beats_per_bar - i * 0.5,
                            velocity=rng.randint(48, 62),
                        )
                    )
            else:
                for pitch in voicing[:3]:
                    notes.append(
                        NoteEvent(
                            pitch=pitch,
                            start_beat=start,
                            duration_beats=beats_per_bar * 0.95,
                            velocity=rng.randint(50, 64),
                        )
                    )
        return notes
