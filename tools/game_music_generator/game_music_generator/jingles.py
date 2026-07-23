"""短い効果音ジングル（ゲームオーバーなど）。"""

from __future__ import annotations

from pathlib import Path

import pretty_midi


def write_game_over_jingle(output_path: str | Path, tempo_bpm: int = 72) -> Path:
    """
    短く悲しいゲームオーバージングル。

    構成（Aマイナー）:
      メロディ: E → D → C → B → A（ゆっくり下降）
      コード: Am → F → Em → Am
      低音: 最後に低い A を伸ばす
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    pm = pretty_midi.PrettyMIDI(initial_tempo=tempo_bpm)
    seconds_per_beat = 60.0 / tempo_bpm

    melody = pretty_midi.Instrument(program=46, name="Melody")  # Harp
    chords = pretty_midi.Instrument(program=89, name="Chords")  # Warm Pad
    bass = pretty_midi.Instrument(program=35, name="Bass")  # Soft bass

    def beat_to_sec(beat: float) -> float:
        return beat * seconds_per_beat

    def add_note(
        instrument: pretty_midi.Instrument,
        pitch: int,
        start_beat: float,
        duration_beats: float,
        velocity: int,
    ) -> None:
        start = beat_to_sec(start_beat)
        end = beat_to_sec(start_beat + duration_beats)
        instrument.notes.append(
            pretty_midi.Note(
                velocity=velocity,
                pitch=pitch,
                start=start,
                end=max(start + 0.05, end),
            )
        )

    # メロディ: 下降してトニックで止まる
    melody_notes = [
        (76, 0.0, 0.75),  # E5
        (74, 0.75, 0.75),  # D5
        (72, 1.5, 0.75),  # C5
        (71, 2.25, 0.75),  # B4
        (69, 3.0, 2.0),  # A4 長く
    ]
    for pitch, start, dur in melody_notes:
        add_note(melody, pitch, start, dur, velocity=92)

    # コード（暗いが短く）
    chord_events = [
        # Am: A C E
        (0.0, 1.5, (57, 60, 64)),
        # F: F A C
        (1.5, 1.5, (53, 57, 60)),
        # Em: E G B
        (3.0, 1.0, (52, 55, 59)),
        # Am: A C E（低い）
        (4.0, 1.5, (45, 48, 52)),
    ]
    for start, dur, pitches in chord_events:
        for pitch in pitches:
            add_note(chords, pitch, start, dur, velocity=58)

    # ベース
    bass_notes = [
        (45, 0.0, 1.5),  # A2
        (41, 1.5, 1.5),  # F2
        (40, 3.0, 1.0),  # E2
        (33, 4.0, 1.5),  # A1
    ]
    for pitch, start, dur in bass_notes:
        add_note(bass, pitch, start, dur, velocity=78)

    pm.instruments.extend([melody, chords, bass])
    pm.write(str(path))
    return path


def write_level_up_jingle(output_path: str | Path, tempo_bpm: int = 140) -> Path:
    """
    短く明るいレベルアップジングル。

    構成（Cメジャー）:
      メロディ: C → E → G → C（上昇アルペジオ）＋高いキラッ
      コード: C → G → C
    何度も鳴るので、約 1.5 秒に抑える。
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    pm = pretty_midi.PrettyMIDI(initial_tempo=tempo_bpm)
    seconds_per_beat = 60.0 / tempo_bpm

    melody = pretty_midi.Instrument(program=9, name="Melody")  # Glockenspiel寄り
    sparkle = pretty_midi.Instrument(program=11, name="Sparkle")  # Music Box
    chords = pretty_midi.Instrument(program=46, name="Chords")  # Harp

    def beat_to_sec(beat: float) -> float:
        return beat * seconds_per_beat

    def add_note(
        instrument: pretty_midi.Instrument,
        pitch: int,
        start_beat: float,
        duration_beats: float,
        velocity: int,
    ) -> None:
        start = beat_to_sec(start_beat)
        end = beat_to_sec(start_beat + duration_beats)
        instrument.notes.append(
            pretty_midi.Note(
                velocity=velocity,
                pitch=pitch,
                start=start,
                end=max(start + 0.04, end),
            )
        )

    # 上昇アルペジオ
    melody_notes = [
        (72, 0.0, 0.4),  # C5
        (76, 0.4, 0.4),  # E5
        (79, 0.8, 0.4),  # G5
        (84, 1.2, 1.4),  # C6 着地＋余韻
    ]
    for pitch, start, dur in melody_notes:
        add_note(melody, pitch, start, dur, velocity=100)

    # 最後に少し高いキラッ
    add_note(sparkle, 88, 1.35, 1.1, velocity=78)  # E6
    add_note(sparkle, 91, 1.55, 0.9, velocity=70)  # G6

    # 明るい短いコード
    chord_events = [
        # C: C E G
        (0.0, 0.8, (60, 64, 67)),
        # G: G B D
        (0.8, 0.55, (55, 59, 62)),
        # C: C E G（高め）
        (1.35, 1.25, (64, 67, 72)),
    ]
    for start, dur, pitches in chord_events:
        for pitch in pitches:
            add_note(chords, pitch, start, dur, velocity=62)

    pm.instruments.extend([melody, sparkle, chords])
    pm.write(str(path))
    return path


def write_stage_clear_jingle(output_path: str | Path, tempo_bpm: int = 120) -> Path:
    """
    ステージクリア用（達成感はあるが控えめ）。

    構成（Gメジャー）:
      メロディ: G → A → B → D → G（上がって着地）
      コード: G → C → D → G
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    pm = pretty_midi.PrettyMIDI(initial_tempo=tempo_bpm)
    seconds_per_beat = 60.0 / tempo_bpm

    melody = pretty_midi.Instrument(program=73, name="Melody")  # Flute
    chords = pretty_midi.Instrument(program=46, name="Chords")  # Harp
    bass = pretty_midi.Instrument(program=32, name="Bass")

    def beat_to_sec(beat: float) -> float:
        return beat * seconds_per_beat

    def add_note(
        instrument: pretty_midi.Instrument,
        pitch: int,
        start_beat: float,
        duration_beats: float,
        velocity: int,
    ) -> None:
        start = beat_to_sec(start_beat)
        end = beat_to_sec(start_beat + duration_beats)
        instrument.notes.append(
            pretty_midi.Note(
                velocity=velocity,
                pitch=pitch,
                start=start,
                end=max(start + 0.05, end),
            )
        )

    melody_notes = [
        (67, 0.0, 0.4),  # G4
        (69, 0.4, 0.4),  # A4
        (71, 0.8, 0.4),  # B4
        (74, 1.2, 0.5),  # D5
        (79, 1.7, 1.3),  # G5 着地
    ]
    for pitch, start, dur in melody_notes:
        add_note(melody, pitch, start, dur, velocity=96)

    chord_events = [
        (0.0, 0.8, (55, 59, 62)),  # G
        (0.8, 0.8, (48, 52, 55)),  # C
        (1.6, 0.5, (50, 54, 57)),  # D
        (2.1, 1.2, (55, 59, 62)),  # G
    ]
    for start, dur, pitches in chord_events:
        for pitch in pitches:
            add_note(chords, pitch, start, dur, velocity=58)

    bass_notes = [
        (43, 0.0, 0.8),  # G2
        (36, 0.8, 0.8),  # C2
        (38, 1.6, 0.5),  # D2
        (43, 2.1, 1.2),  # G2
    ]
    for pitch, start, dur in bass_notes:
        add_note(bass, pitch, start, dur, velocity=72)

    pm.instruments.extend([melody, chords, bass])
    pm.write(str(path))
    return path


def write_area_clear_jingle(output_path: str | Path, tempo_bpm: int = 132) -> Path:
    """
    エリアクリア用（ステージクリアより明るく派手）。

    構成（Cメジャー）:
      メロディ: C → E → G → C → E → 高い C（ファンファーレ）
      キラッ多め＋最後に明るい和音
    """
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    pm = pretty_midi.PrettyMIDI(initial_tempo=tempo_bpm)
    seconds_per_beat = 60.0 / tempo_bpm

    melody = pretty_midi.Instrument(program=56, name="Melody")  # Trumpet寄り
    sparkle = pretty_midi.Instrument(program=9, name="Sparkle")  # Glockenspiel
    chords = pretty_midi.Instrument(program=46, name="Chords")  # Harp
    bass = pretty_midi.Instrument(program=32, name="Bass")

    def beat_to_sec(beat: float) -> float:
        return beat * seconds_per_beat

    def add_note(
        instrument: pretty_midi.Instrument,
        pitch: int,
        start_beat: float,
        duration_beats: float,
        velocity: int,
    ) -> None:
        start = beat_to_sec(start_beat)
        end = beat_to_sec(start_beat + duration_beats)
        instrument.notes.append(
            pretty_midi.Note(
                velocity=velocity,
                pitch=pitch,
                start=start,
                end=max(start + 0.05, end),
            )
        )

    # ファンファーレ風の上昇
    melody_notes = [
        (72, 0.0, 0.35),  # C5
        (76, 0.35, 0.35),  # E5
        (79, 0.7, 0.35),  # G5
        (84, 1.05, 0.45),  # C6
        (88, 1.5, 0.45),  # E6
        (96, 1.95, 2.0),  # C7 明るく着地＋余韻
    ]
    for pitch, start, dur in melody_notes:
        add_note(melody, pitch, start, dur, velocity=108)

    # キラッを多めに
    sparkle_notes = [
        (84, 1.1, 0.7),
        (88, 1.55, 0.9),
        (91, 1.9, 1.2),
        (96, 2.15, 1.5),
        (100, 2.4, 1.3),  # E7
    ]
    for pitch, start, dur in sparkle_notes:
        add_note(sparkle, pitch, start, dur, velocity=82)

    chord_events = [
        (0.0, 0.7, (60, 64, 67)),  # C
        (0.7, 0.7, (55, 59, 62)),  # G
        (1.4, 0.6, (53, 57, 60)),  # F
        (2.0, 2.0, (64, 67, 72, 76)),  # C 明るい広い和音
    ]
    for start, dur, pitches in chord_events:
        for pitch in pitches:
            add_note(chords, pitch, start, dur, velocity=68)

    bass_notes = [
        (36, 0.0, 0.7),  # C2
        (43, 0.7, 0.7),  # G2
        (41, 1.4, 0.6),  # F2
        (36, 2.0, 2.0),  # C2
    ]
    for pitch, start, dur in bass_notes:
        add_note(bass, pitch, start, dur, velocity=80)

    pm.instruments.extend([melody, sparkle, chords, bass])
    pm.write(str(path))
    return path


JINGLE_BUILDERS = {
    "game_over": write_game_over_jingle,
    "level_up": write_level_up_jingle,
    "stage_clear": write_stage_clear_jingle,
    "area_clear": write_area_clear_jingle,
}
