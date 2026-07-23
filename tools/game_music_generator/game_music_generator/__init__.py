"""
Game Music Generator — ゲーム向けループBGMを Python だけで生成する。

AI API 不要。MIDI 出力。任意で簡易ソフトシンセから WAV/OGG も書き出せる。
"""

from .composer import GameMusicComposer

__all__ = ["GameMusicComposer"]
__version__ = "0.1.0"
