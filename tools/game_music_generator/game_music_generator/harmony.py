"""コード進行・スケールのヘルパー。"""

from __future__ import annotations

from .themes.library import (
    DEGREE_BY_ROMAN,
    KEY_ROOT_PC,
    MAJOR_SCALE_SEMITONES,
    MINOR_SCALE_SEMITONES,
)


def pitch_class_for_roman(key: str, roman: str, mode: str = "major") -> int:
    """ローマ数字コードのルート pitch class (0-11)。小文字 i も度数として扱う。"""
    normalized = roman.strip()
    # 小文字の三和音も同じ度数マップを使う
    lookup = normalized if normalized in DEGREE_BY_ROMAN else normalized.upper()
    if lookup not in DEGREE_BY_ROMAN and normalized.lower() in {
        "i",
        "ii",
        "iii",
        "iv",
        "v",
        "vi",
        "vii",
    }:
        lookup = {
            "i": "I",
            "ii": "ii",
            "iii": "iii",
            "iv": "IV",
            "v": "V",
            "vi": "vi",
            "vii": "vii",
        }[normalized.lower()]
    degree = DEGREE_BY_ROMAN[lookup]
    root_pc = KEY_ROOT_PC[key]
    intervals = MINOR_SCALE_SEMITONES if mode == "minor" else MAJOR_SCALE_SEMITONES
    return (root_pc + intervals[degree % 7]) % 12


def is_minor_roman(roman: str) -> bool:
    text = roman.strip()
    return text[:1].islower() or text in {"ii", "iii", "vi", "vii"}


def triad_pitch_classes(
    key: str,
    roman: str,
    mode: str = "major",
) -> tuple[int, int, int]:
    """三和音の pitch class (root, third, fifth)。"""
    root = pitch_class_for_roman(key, roman, mode=mode)
    if is_minor_roman(roman):
        third = (root + 3) % 12
    else:
        third = (root + 4) % 12
    fifth = (root + 7) % 12
    return root, third, fifth


def scale_pitch_classes(key: str, mode: str = "major") -> list[int]:
    root = KEY_ROOT_PC[key]
    intervals = MINOR_SCALE_SEMITONES if mode == "minor" else MAJOR_SCALE_SEMITONES
    return [(root + interval) % 12 for interval in intervals]


def progression_mode(progression: tuple[str, ...]) -> str:
    """進行の先頭が小文字ならマイナー扱い。"""
    if not progression:
        return "major"
    first = progression[0].strip()
    if first[:1].islower() or first in {"i", "ii", "iii", "iv", "v", "vi", "vii"}:
        return "minor"
    return "major"


def midi_in_octave(pitch_class: int, octave: int) -> int:
    return octave * 12 + pitch_class


def nearest_scale_pitch(pitch: int, scale_pcs: list[int]) -> int:
    """最も近いスケール音へスナップ。"""
    pc = pitch % 12
    best = pitch
    best_dist = 99
    for scale_pc in scale_pcs:
        dist = min((scale_pc - pc) % 12, (pc - scale_pc) % 12)
        if dist < best_dist:
            best_dist = dist
            # 同じオクターブ帯に寄せる
            octave = pitch // 12
            candidate = octave * 12 + scale_pc
            if abs(candidate - pitch) > 6:
                if candidate > pitch:
                    candidate -= 12
                else:
                    candidate += 12
            best = candidate
    return best
