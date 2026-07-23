"""メロディ生成（モチーフ反復＋軽い変奏）。"""

from __future__ import annotations

import random

from ..harmony import (
    midi_in_octave,
    nearest_scale_pitch,
    progression_mode,
    scale_pitch_classes,
    triad_pitch_classes,
)
from ..models import NoteEvent
from ..motifs import (
    FOREST_HUM_LANDING_PITCH,
    FOREST_HUM_MOTIF,
    FOREST_HUM_MOTIF_HIGH,
    TITLE_HUM_MOTIF,
    TITLE_HUM_MOTIF_HIGH,
)


class MelodyGenerator:
    """
    ゲームBGM向け:
      - 短いモチーフを作って繰り返す（覚えやすさ）
      - 音域を狭く保つ
      - マイナー進行ならマイナースケールを使う
      - 最後はトニックへ解決
      - タイトル／Forest は鼻歌由来の固定モチーフを使う
    """

    def generate(
        self,
        rng: random.Random,
        key: str,
        progression: tuple[str, ...],
        bars: int,
        beats_per_bar: int = 4,
        style: str = "default",
    ) -> list[NoteEvent]:
        if style == "title":
            return self._generate_fixed_motif_melody(
                rng,
                bars,
                beats_per_bar,
                TITLE_HUM_MOTIF,
                TITLE_HUM_MOTIF_HIGH,
                landing_pitch=55,
                velocity_range=(70, 88),
            )
        if style == "forest":
            return self._generate_fixed_motif_melody(
                rng,
                bars,
                beats_per_bar,
                FOREST_HUM_MOTIF,
                FOREST_HUM_MOTIF_HIGH,
                landing_pitch=FOREST_HUM_LANDING_PITCH,
                velocity_range=(78, 96),
            )
        return self._generate_motif_melody(
            rng, key, progression, bars, beats_per_bar, magical=False
        )

    def _generate_fixed_motif_melody(
        self,
        rng: random.Random,
        bars: int,
        beats_per_bar: int,
        motif_a: list[tuple[int, float, float]],
        motif_b: list[tuple[int, float, float]],
        landing_pitch: int,
        velocity_range: tuple[int, int],
    ) -> list[NoteEvent]:
        """固定モチーフを 8 拍ループで敷く。"""
        total_beats = float(bars * beats_per_bar)
        loop_beats = 8.0
        notes: list[NoteEvent] = []
        loop_index = 0
        beat = 0.0
        velocity_low, velocity_high = velocity_range

        while beat < total_beats - 0.001:
            # 2ループに1回、高めのバリエーション
            use_high = loop_index % 2 == 1
            motif = motif_b if use_high else motif_a

            for pitch, start_offset, duration in motif:
                note_start = beat + start_offset
                if note_start >= total_beats:
                    break
                note_duration = duration
                if note_start + note_duration > total_beats:
                    note_duration = total_beats - note_start
                if note_duration < 0.25:
                    continue

                final_pitch = pitch
                if note_start >= total_beats - beats_per_bar:
                    final_pitch = landing_pitch

                velocity = rng.randint(velocity_low, velocity_high)
                notes.append(
                    NoteEvent(
                        pitch=final_pitch,
                        start_beat=note_start,
                        duration_beats=max(0.25, note_duration),
                        velocity=velocity,
                    )
                )

            beat += loop_beats
            loop_index += 1

        return notes

    def _generate_motif_melody(
        self,
        rng: random.Random,
        key: str,
        progression: tuple[str, ...],
        bars: int,
        beats_per_bar: int,
        magical: bool,
    ) -> list[NoteEvent]:
        mode = progression_mode(progression)
        scale_pcs = scale_pitch_classes(key, mode)
        tonic_pc = scale_pcs[0]
        # タイトルは少し高めの狭い音域、通常も1.5オクターブ以内
        center = midi_in_octave(tonic_pc, 5)
        low = center - (5 if magical else 7)
        high = center + (7 if magical else 9)

        motif = self._build_motif(rng, scale_pcs, center, magical=magical)
        notes: list[NoteEvent] = []
        total_beats = bars * beats_per_bar
        motif_beats = sum(step[1] for step in motif)

        # モチーフをループ全体に敷き、小節ごとにコードトーンへ軽く寄せる
        beat = 0.0
        motif_index = 0
        while beat < total_beats - 0.001:
            bar_index = int(beat // beats_per_bar)
            chord = progression[bar_index % len(progression)]
            chord_pcs = list(triad_pitch_classes(key, chord, mode=mode))

            pitch_offset, duration = motif[motif_index % len(motif)]
            motif_index += 1

            # 変奏: 2回に1回は上下に少しずらす／休符を入れる
            phrase_cycle = int(beat // motif_beats) if motif_beats > 0 else 0
            if magical and phrase_cycle % 2 == 1 and motif_index % len(motif) == 1:
                # フレーズ頭で短い休み（魔法っぽい間）
                beat += 0.5
                if beat >= total_beats:
                    break

            raw_pitch = center + pitch_offset
            # コードトーンに寄せる（タイトルは強め）
            if magical or rng.random() < 0.65:
                raw_pitch = self._snap_to_chord_or_scale(
                    raw_pitch, chord_pcs, scale_pcs, prefer_chord=True
                )
            else:
                raw_pitch = nearest_scale_pitch(raw_pitch, scale_pcs)

            pitch = max(low, min(high, raw_pitch))
            pitch = nearest_scale_pitch(pitch, scale_pcs)

            if beat + duration > total_beats:
                duration = total_beats - beat

            # ループ終端はトニック長音
            if beat >= total_beats - beats_per_bar:
                if beat >= total_beats - 2:
                    pitch = midi_in_octave(tonic_pc, 5)
                    duration = total_beats - beat

            velocity = rng.randint(68, 86) if magical else rng.randint(72, 92)
            notes.append(
                NoteEvent(
                    pitch=pitch,
                    start_beat=beat,
                    duration_beats=max(0.25, duration),
                    velocity=velocity,
                )
            )
            beat += duration

        return notes

    def _build_motif(
        self,
        rng: random.Random,
        scale_pcs: list[int],
        center: int,
        magical: bool,
    ) -> list[tuple[int, float]]:
        """
        相対音程と音価のモチーフ。
        戻り値: [(centerからの半音オフセット, 拍数), ...]
        """
        # スケール度数 → 半音オフセット表（major/minor 共通で「度数」として使う）
        # scale_pcs の 0,2,4 番目あたりを使う
        deg = []
        for i, pc in enumerate(scale_pcs):
            # center と同じオクターブでの距離
            candidate = (center // 12) * 12 + pc
            if candidate < center - 6:
                candidate += 12
            if candidate > center + 6:
                candidate -= 12
            deg.append(candidate - center)

        d0, d1, d2, d3, d4 = deg[0], deg[1], deg[2], deg[3], deg[4]

        if magical:
            # ゆっくりめ・跳躍少なめ・覚えやすい4〜5音
            candidates = [
                [(d0, 1.0), (d2, 1.0), (d3, 0.5), (d2, 0.5), (d4, 1.0), (d0, 2.0)],
                [(d0, 1.5), (d1, 0.5), (d2, 1.0), (d4, 1.0), (d3, 1.0), (d0, 1.0)],
                [(d2, 1.0), (d0, 1.0), (d2, 0.5), (d3, 0.5), (d4, 1.5), (d0, 1.5)],
                [(d0, 2.0), (d2, 1.0), (d4, 1.0), (d3, 1.0), (d2, 1.0), (d0, 2.0)],
            ]
        else:
            candidates = [
                [(d0, 1.0), (d2, 0.5), (d3, 0.5), (d4, 1.0), (d2, 1.0), (d0, 1.0)],
                [(d0, 0.5), (d1, 0.5), (d2, 1.0), (d4, 1.0), (d3, 0.5), (d2, 0.5), (d0, 1.0)],
                [(d2, 1.0), (d4, 1.0), (d3, 1.0), (d2, 0.5), (d1, 0.5), (d0, 2.0)],
            ]
        return list(rng.choice(candidates))

    def _snap_to_chord_or_scale(
        self,
        pitch: int,
        chord_pcs: list[int],
        scale_pcs: list[int],
        prefer_chord: bool,
    ) -> int:
        if prefer_chord:
            # コードトーンの最近傍
            best = pitch
            best_dist = 99
            for pc in chord_pcs:
                octave = pitch // 12
                candidate = octave * 12 + pc
                if abs(candidate - pitch) > 6:
                    candidate = candidate - 12 if candidate > pitch else candidate + 12
                dist = abs(candidate - pitch)
                if dist < best_dist:
                    best_dist = dist
                    best = candidate
            return best
        return nearest_scale_pitch(pitch, scale_pcs)
