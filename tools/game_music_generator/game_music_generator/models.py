"""共有データ型（生成器同士のやり取り用）。"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ThemeConfig:
    """1テーマのメタ情報。"""

    theme_id: str
    display_name: str
    key: str
    tempo_bpm: int
    # 代表コード進行（ローマ数字 or コード名）。例: ["I", "V", "vi", "IV"]
    progressions: tuple[tuple[str, ...], ...]


@dataclass
class NoteEvent:
    """1音。pitch は MIDI ノート番号。"""

    pitch: int
    start_beat: float
    duration_beats: float
    velocity: int = 80


@dataclass
class DrumHit:
    """ドラム1打。pitch は GM パーカッション番号。"""

    pitch: int
    start_beat: float
    velocity: int = 90
    duration_beats: float = 0.25


@dataclass
class Arrangement:
    """1曲分の全トラック。"""

    theme_id: str
    key: str
    tempo_bpm: int
    time_signature: tuple[int, int]
    length_beats: float
    melody: list[NoteEvent] = field(default_factory=list)
    chords: list[NoteEvent] = field(default_factory=list)
    bass: list[NoteEvent] = field(default_factory=list)
    drums: list[DrumHit] = field(default_factory=list)
