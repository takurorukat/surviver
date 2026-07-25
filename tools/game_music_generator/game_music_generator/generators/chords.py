"""コード伴奏生成。"""

from __future__ import annotations

import random

from ..harmony import midi_in_octave, progression_mode, triad_pitch_classes
from ..models import NoteEvent

# block=和音そのまま / arpeggio=分散 / sparse=まばら / pulse=短く刻む
ChordStyle = str


class ChordGenerator:
    """テーマ別に伴奏の置き方を変える。"""

    def generate(
        self,
        rng: random.Random,
        key: str,
        progression: tuple[str, ...],
        bars: int,
        beats_per_bar: int = 4,
        style: ChordStyle = "block",
    ) -> list[NoteEvent]:
        notes: list[NoteEvent] = []
        mode = progression_mode(progression)
        for bar_index in range(bars):
            roman = progression[bar_index % len(progression)]
            root, third, fifth = triad_pitch_classes(key, roman, mode=mode)
            start = float(bar_index * beats_per_bar)
            voicing = [
                midi_in_octave(root, 4),
                midi_in_octave(third, 4),
                midi_in_octave(fifth, 4),
                midi_in_octave(root, 5),
            ]

            if style == "arpeggio":
                for i, pitch in enumerate(voicing[:3]):
                    notes.append(
                        NoteEvent(
                            pitch=pitch,
                            start_beat=start + i * 0.5,
                            duration_beats=beats_per_bar - i * 0.5,
                            velocity=rng.randint(46, 60),
                        )
                    )
            elif style == "sparse":
                # 低めの2音だけ・小節の半分
                for pitch in voicing[:2]:
                    notes.append(
                        NoteEvent(
                            pitch=pitch - 12,
                            start_beat=start,
                            duration_beats=beats_per_bar * 0.7,
                            velocity=rng.randint(40, 54),
                        )
                    )
            elif style == "pulse":
                # 1拍ごとに短く（緊張感）
                for beat in range(beats_per_bar):
                    for pitch in voicing[:3]:
                        notes.append(
                            NoteEvent(
                                pitch=pitch,
                                start_beat=start + beat,
                                duration_beats=0.45,
                                velocity=rng.randint(52, 70),
                            )
                        )
            else:
                # block: 平原向け。時々軽いアルペジオ
                if rng.random() < 0.25:
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
