"""テーマ別の Key / Tempo / コード進行ライブラリ。"""

from __future__ import annotations

from ..models import ThemeConfig

# ローマ数字 → メジャースケール上の度数（0=I）
DEGREE_BY_ROMAN = {
    "I": 0,
    "ii": 1,
    "II": 1,
    "iii": 2,
    "III": 2,
    "IV": 3,
    "V": 4,
    "vi": 5,
    "VI": 5,
    "vii": 6,
    "VII": 6,
}

# メジャースケールの半音オフセット
MAJOR_SCALE_SEMITONES = (0, 2, 4, 5, 7, 9, 11)
# ナチュラルマイナー（魔法タイトル向け）
MINOR_SCALE_SEMITONES = (0, 2, 3, 5, 7, 8, 10)

# Key 名 → MIDI ルート（C4=60 基準のオクターブは呼び出し側で決める）
KEY_ROOT_PC = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "Ab": 8,
    "A": 9,
    "Bb": 10,
    "B": 11,
}


THEME_LIBRARY: dict[str, ThemeConfig] = {
    "title": ThemeConfig(
        theme_id="title",
        display_name="Title (Magic Survivor)",
        key="A",
        tempo_bpm=88,
        # 神秘: 短調循環（他エリアと被らない）
        progressions=(
            ("i", "VI", "III", "VII"),
            ("i", "VII", "VI", "VII"),
            ("i", "VI", "VII", "i"),
        ),
    ),
    "plains": ThemeConfig(
        theme_id="plains",
        display_name="Plains",
        key="C",
        tempo_bpm=112,
        # 開けた平原: 明るいメジャー進行
        progressions=(
            ("I", "V", "vi", "IV"),
            ("I", "IV", "V", "I"),
            ("I", "vi", "ii", "V"),
        ),
    ),
    "forest": ThemeConfig(
        theme_id="forest",
        display_name="Forest",
        # 鼻歌モチーフが G 系なのでキーは維持。進行とテンポで平原と差別化
        key="G",
        tempo_bpm=98,
        progressions=(
            ("I", "iii", "IV", "I"),
            ("vi", "IV", "I", "V"),
            ("I", "ii", "IV", "V"),
        ),
    ),
    "dungeon": ThemeConfig(
        theme_id="dungeon",
        display_name="Earth Dungeon",
        key="D",
        tempo_bpm=100,
        # 地下: 低音ドローン寄り・狭い進行
        progressions=(
            ("i", "i", "iv", "V"),
            ("i", "iv", "i", "VII"),
            ("i", "VI", "iv", "i"),
        ),
    ),
    "town": ThemeConfig(
        theme_id="town",
        display_name="Town",
        key="F",
        tempo_bpm=112,
        progressions=(
            ("I", "IV", "V", "I"),
            ("I", "vi", "ii", "V"),
            ("I", "V", "vi", "iii"),
        ),
    ),
    "boss": ThemeConfig(
        theme_id="boss",
        display_name="Boss",
        key="E",
        tempo_bpm=140,
        progressions=(
            ("i", "VI", "III", "VII"),
            ("i", "iv", "V", "i"),
            ("i", "VII", "VI", "VII"),
        ),
    ),
    "castle": ThemeConfig(
        theme_id="castle",
        display_name="Castle",
        key="D",
        tempo_bpm=108,
        progressions=(
            ("I", "V", "vi", "iii"),
            ("I", "IV", "I", "V"),
            ("vi", "IV", "I", "V"),
        ),
    ),
    "desert": ThemeConfig(
        theme_id="desert",
        display_name="Desert",
        key="D",
        tempo_bpm=96,
        progressions=(
            ("i", "VII", "VI", "VII"),
            ("i", "iv", "VII", "III"),
            ("i", "VI", "VII", "i"),
        ),
    ),
    "ice": ThemeConfig(
        theme_id="ice",
        display_name="Ice",
        key="A",
        tempo_bpm=88,
        progressions=(
            ("I", "vi", "IV", "V"),
            ("vi", "IV", "I", "V"),
            ("I", "V", "vi", "IV"),
        ),
    ),
    "volcano": ThemeConfig(
        theme_id="volcano",
        display_name="Fire Volcano",
        key="B",
        tempo_bpm=130,
        # 火山: 短調で押し出す・平原/森と対照的
        progressions=(
            ("i", "VII", "VI", "VII"),
            ("i", "iv", "VII", "i"),
            ("i", "VI", "III", "VII"),
        ),
    ),
}


def get_theme(theme_id: str) -> ThemeConfig:
    key = theme_id.strip().lower()
    # ゲーム内 area id（ruins）でも呼べるようにする
    if key == "ruins":
        key = "dungeon"
    if key not in THEME_LIBRARY:
        known = ", ".join(sorted(THEME_LIBRARY.keys()))
        raise KeyError(f"Unknown theme '{theme_id}'. Known: {known}")
    return THEME_LIBRARY[key]
