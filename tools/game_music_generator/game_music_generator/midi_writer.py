"""Arrangement → MIDI ファイル。"""

from __future__ import annotations

from pathlib import Path

import pretty_midi

from .models import Arrangement, DrumHit, NoteEvent


class MidiWriter:
    """トラック別に Instrument を分けて書き出す。"""

    def write(self, arrangement: Arrangement, output_path: str | Path) -> Path:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        pm = pretty_midi.PrettyMIDI(initial_tempo=arrangement.tempo_bpm)
        seconds_per_beat = 60.0 / arrangement.tempo_bpm

        # タイトルは魔法っぽい音色（ハープ＋パッド＋ソフトベース）
        if arrangement.theme_id == "title":
            melody = pretty_midi.Instrument(program=46, name="Melody")  # Harp
            chords = pretty_midi.Instrument(program=89, name="Chords")  # Warm Pad
            bass = pretty_midi.Instrument(program=35, name="Bass")  # Fretless Bass
        elif arrangement.theme_id == "forest":
            # Forest: 明るめ（フルート＋マリンバ寄りコード）
            melody = pretty_midi.Instrument(program=73, name="Melody")  # Flute
            chords = pretty_midi.Instrument(program=12, name="Chords")  # Marimba
            bass = pretty_midi.Instrument(program=32, name="Bass")  # Acoustic Bass
        else:
            melody = pretty_midi.Instrument(program=73, name="Melody")  # Flute
            chords = pretty_midi.Instrument(program=48, name="Chords")  # Strings
            bass = pretty_midi.Instrument(program=33, name="Bass")  # Finger Bass
        drums = pretty_midi.Instrument(program=0, is_drum=True, name="Drums")

        self._add_notes(melody, arrangement.melody, seconds_per_beat)
        self._add_notes(chords, arrangement.chords, seconds_per_beat)
        self._add_notes(bass, arrangement.bass, seconds_per_beat)
        self._add_drums(drums, arrangement.drums, seconds_per_beat)

        pm.instruments.extend([melody, chords, bass, drums])
        pm.write(str(path))
        return path

    def _add_notes(
        self,
        instrument: pretty_midi.Instrument,
        notes: list[NoteEvent],
        seconds_per_beat: float,
    ) -> None:
        for note in notes:
            start = note.start_beat * seconds_per_beat
            end = start + note.duration_beats * seconds_per_beat
            instrument.notes.append(
                pretty_midi.Note(
                    velocity=max(1, min(127, note.velocity)),
                    pitch=max(0, min(127, note.pitch)),
                    start=start,
                    end=max(start + 0.05, end),
                )
            )

    def _add_drums(
        self,
        instrument: pretty_midi.Instrument,
        hits: list[DrumHit],
        seconds_per_beat: float,
    ) -> None:
        for hit in hits:
            start = hit.start_beat * seconds_per_beat
            end = start + hit.duration_beats * seconds_per_beat
            instrument.notes.append(
                pretty_midi.Note(
                    velocity=max(1, min(127, hit.velocity)),
                    pitch=hit.pitch,
                    start=start,
                    end=max(start + 0.05, end),
                )
            )
