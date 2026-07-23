"""ドラム生成（Kick / Snare / HiHat のみ。平原向け控えめ）。"""

from __future__ import annotations

import random

from ..models import DrumHit

# General MIDI percussion
KICK = 36
SNARE = 38
CLOSED_HAT = 42


class DrumGenerator:
    """RPG平原向け。派手すぎない4パターン。"""

    def generate(
        self,
        rng: random.Random,
        bars: int,
        beats_per_bar: int = 4,
        pattern_index: int | None = None,
    ) -> list[DrumHit]:
        if pattern_index is None:
            pattern_index = rng.randrange(4)
        pattern_index = pattern_index % 4
        hits: list[DrumHit] = []

        for bar_index in range(bars):
            start = float(bar_index * beats_per_bar)
            if pattern_index == 0:
                hits.extend(self._pattern_soft_four(start, rng))
            elif pattern_index == 1:
                hits.extend(self._pattern_light_backbeat(start, rng))
            elif pattern_index == 2:
                hits.extend(self._pattern_walking(start, rng))
            else:
                hits.extend(self._pattern_half_time_feel(start, rng))
        return hits

    def _hats(self, start: float, every: float, velocity: int) -> list[DrumHit]:
        hits: list[DrumHit] = []
        t = 0.0
        while t < 4.0 - 0.001:
            hits.append(
                DrumHit(
                    pitch=CLOSED_HAT,
                    start_beat=start + t,
                    velocity=velocity,
                    duration_beats=0.2,
                )
            )
            t += every
        return hits

    def _pattern_soft_four(self, start: float, rng: random.Random) -> list[DrumHit]:
        # Kick on 1/3, Snare on 2/4, hats 8th soft
        hits = self._hats(start, 0.5, rng.randint(40, 55))
        for beat, pitch, vel in [
            (0.0, KICK, 85),
            (1.0, SNARE, 70),
            (2.0, KICK, 80),
            (3.0, SNARE, 68),
        ]:
            hits.append(DrumHit(pitch=pitch, start_beat=start + beat, velocity=vel))
        return hits

    def _pattern_light_backbeat(self, start: float, rng: random.Random) -> list[DrumHit]:
        hits = self._hats(start, 0.5, rng.randint(38, 50))
        for beat, pitch, vel in [
            (0.0, KICK, 82),
            (1.0, SNARE, 66),
            (2.0, KICK, 78),
            (2.5, KICK, 60),
            (3.0, SNARE, 64),
        ]:
            hits.append(DrumHit(pitch=pitch, start_beat=start + beat, velocity=vel))
        return hits

    def _pattern_walking(self, start: float, rng: random.Random) -> list[DrumHit]:
        # よりゆったり: hats 4分、kick sparse
        hits = self._hats(start, 1.0, rng.randint(36, 48))
        for beat, pitch, vel in [
            (0.0, KICK, 80),
            (1.5, SNARE, 58),
            (2.0, KICK, 74),
            (3.0, SNARE, 62),
        ]:
            hits.append(DrumHit(pitch=pitch, start_beat=start + beat, velocity=vel))
        return hits

    def _pattern_half_time_feel(self, start: float, rng: random.Random) -> list[DrumHit]:
        hits = self._hats(start, 0.5, rng.randint(34, 46))
        for beat, pitch, vel in [
            (0.0, KICK, 84),
            (2.0, SNARE, 72),
            (3.5, KICK, 58),
        ]:
            hits.append(DrumHit(pitch=pitch, start_beat=start + beat, velocity=vel))
        return hits
