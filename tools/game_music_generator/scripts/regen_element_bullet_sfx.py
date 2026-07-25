#!/usr/bin/env python3
"""
[DEPRECATED] 旧・全効果音 Python 波形合成ジェネレータ。

正式 SE の生成は Tone.js オフラインツールを使ってください:
  npm run generate:sfx
  （tools/sfx_designer）

このスクリプトは互換のため残していますが、デフォルトでは正式 SE を上書きしません。
上書きが必要な場合のみ --force-legacy を明示してください。

使い方（非推奨）:
  python tools/game_music_generator/scripts/regen_element_bullet_sfx.py --force-legacy --install-all
"""

from __future__ import annotations

import argparse
import math
import random
import shutil
import struct
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

REPO_ROOT = Path(__file__).resolve().parents[3]
PUBLIC_AUDIO = REPO_ROOT / "public" / "assets" / "audio"
WORK_DIR = REPO_ROOT / "tools" / "game_music_generator" / "output" / "element_sfx"

SAMPLE_RATE = 44100
PEAK_DBFS = -1.0
PEAK_LINEAR = 10.0 ** (PEAK_DBFS / 20.0)

# 誤って触ってはいけない BGM（確認用）
BGM_NAMES = {
    "plains_bgm.ogg",
    "forest_bgm.ogg",
    "volcano_bgm.ogg",
    "ruins_bgm.ogg",
    "title_bgm.ogg",
    "area_clear_bgm.ogg",
}


@dataclass(frozen=True)
class SfxDef:
    sfx_id: str
    max_duration: float
    builder: Callable[[], list[float]]
    public_name: str | None = None

    @property
    def ogg_name(self) -> str:
        if self.public_name is not None:
            return self.public_name
        return f"{self.sfx_id}.ogg"


def clamp(value: float, low: float = -1.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def envelope(index: int, total: int, attack: float = 0.01, release_power: float = 2.0) -> float:
    if total <= 1:
        return 0.0
    attack_end = max(1, int(total * attack))
    if index < attack_end:
        return index / attack_end
    remain = 1.0 - (index - attack_end) / max(1, total - attack_end)
    return remain ** release_power


def mix_samples(*layers: list[float]) -> list[float]:
    if not layers:
        return []
    length = max(len(layer) for layer in layers)
    out = [0.0] * length
    for layer in layers:
        for index, sample in enumerate(layer):
            out[index] += sample
    peak = max(abs(sample) for sample in out) if out else 1.0
    if peak < 1e-6:
        return out
    return [clamp(sample * (0.85 / peak)) for sample in out]


def tone(
    duration: float,
    freq_start: float,
    freq_end: float | None = None,
    volume: float = 0.5,
    wave_kind: str = "sine",
    attack: float = 0.02,
    release_power: float = 2.2,
) -> list[float]:
    total = max(1, int(SAMPLE_RATE * duration))
    freq_end = freq_start if freq_end is None else freq_end
    phase = 0.0
    samples: list[float] = []
    for index in range(total):
        t = index / max(1, total - 1)
        freq = freq_start + (freq_end - freq_start) * t
        phase += 2.0 * math.pi * freq / SAMPLE_RATE
        if wave_kind == "square":
            raw = 1.0 if math.sin(phase) >= 0 else -1.0
        elif wave_kind == "saw":
            raw = 2.0 * ((phase / (2.0 * math.pi)) % 1.0) - 1.0
        elif wave_kind == "triangle":
            raw = 2.0 * abs(2.0 * ((phase / (2.0 * math.pi)) % 1.0) - 1.0) - 1.0
        else:
            raw = math.sin(phase)
        samples.append(raw * volume * envelope(index, total, attack, release_power))
    return samples


def noise(
    duration: float,
    volume: float = 0.4,
    attack: float = 0.005,
    release_power: float = 3.0,
    highpass_mix: float = 0.0,
    rng: random.Random | None = None,
) -> list[float]:
    rng = rng or random.Random(0)
    total = max(1, int(SAMPLE_RATE * duration))
    samples: list[float] = []
    prev = 0.0
    for index in range(total):
        white = rng.uniform(-1.0, 1.0)
        filtered = white * (1.0 - highpass_mix) + (white - prev) * highpass_mix
        prev = white
        samples.append(filtered * volume * envelope(index, total, attack, release_power))
    return samples


def silence(duration: float) -> list[float]:
    return [0.0] * max(0, int(SAMPLE_RATE * duration))


def pad_start(samples: list[float], delay_seconds: float) -> list[float]:
    return silence(delay_seconds) + samples


def trim_to_max(samples: list[float], max_duration: float) -> list[float]:
    max_len = max(1, int(SAMPLE_RATE * max_duration))
    if len(samples) <= max_len:
        return samples
    return samples[:max_len]


def peak_normalize(samples: list[float]) -> list[float]:
    peak = max(abs(sample) for sample in samples) if samples else 0.0
    if peak < 1e-6:
        return samples
    scale = PEAK_LINEAR / peak
    return [clamp(sample * scale) for sample in samples]


# ---------------------------------------------------------------------------
# 属性SE用の音響部品（帯域ノイズ・共鳴・crackle・grain）
# ---------------------------------------------------------------------------


def bandpass_noise(
    duration: float,
    center_hz: float,
    bandwidth_hz: float,
    volume: float = 0.4,
    attack: float = 0.005,
    release_power: float = 3.0,
    rng: random.Random | None = None,
) -> list[float]:
    """簡易バンドパス風ノイズ（1次 IIR っぽい帯域強調）。"""
    rng = rng or random.Random(0)
    total = max(1, int(SAMPLE_RATE * duration))
    # 中心周波数付近の係数
    w0 = 2.0 * math.pi * center_hz / SAMPLE_RATE
    q = max(0.4, center_hz / max(40.0, bandwidth_hz))
    alpha = math.sin(w0) / (2.0 * q)
    # biquad bandpass (normalized roughly)
    b0 = alpha
    b1 = 0.0
    b2 = -alpha
    a0 = 1.0 + alpha
    a1 = -2.0 * math.cos(w0)
    a2 = 1.0 - alpha
    b0 /= a0
    b1 /= a0
    b2 /= a0
    a1 /= a0
    a2 /= a0
    x1 = 0.0
    x2 = 0.0
    y1 = 0.0
    y2 = 0.0
    samples: list[float] = []
    for index in range(total):
        x0 = rng.uniform(-1.0, 1.0)
        y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2 = x1
        x1 = x0
        y2 = y1
        y1 = y0
        samples.append(y0 * volume * envelope(index, total, attack, release_power))
    return samples


def colored_noise(
    duration: float,
    volume: float = 0.35,
    attack: float = 0.005,
    release_power: float = 3.0,
    color: float = 0.0,
    rng: random.Random | None = None,
) -> list[float]:
    """
    色付きノイズ。color > 0 で高域寄り、color < 0 で低域寄り（柔らかい）。
    Python: 白ノイズを1ポールフィルタで着色するイメージ。
    """
    rng = rng or random.Random(0)
    total = max(1, int(SAMPLE_RATE * duration))
    # color: -1..1 → フィルタ係数
    coeff = clamp(0.55 - color * 0.35, 0.05, 0.95)
    samples: list[float] = []
    state = 0.0
    for index in range(total):
        white = rng.uniform(-1.0, 1.0)
        state = state * coeff + white * (1.0 - coeff)
        samples.append(state * volume * envelope(index, total, attack, release_power))
    return samples


def resonator(
    duration: float,
    freq_start: float,
    freq_end: float | None = None,
    volume: float = 0.35,
    decay: float = 18.0,
    attack: float = 0.004,
    wobble_hz: float = 0.0,
    wobble_amount: float = 0.0,
    rng: random.Random | None = None,
) -> list[float]:
    """減衰する共鳴（打撃で鳴る短い共振）。ベル連打にはしない。"""
    rng = rng or random.Random(0)
    total = max(1, int(SAMPLE_RATE * duration))
    freq_end = freq_start if freq_end is None else freq_end
    phase = rng.uniform(0.0, math.pi * 2.0)
    samples: list[float] = []
    for index in range(total):
        t = index / SAMPLE_RATE
        progress = index / max(1, total - 1)
        freq = freq_start + (freq_end - freq_start) * progress
        if wobble_hz > 0.0 and wobble_amount > 0.0:
            freq *= 1.0 + math.sin(2.0 * math.pi * wobble_hz * t) * wobble_amount
        phase += 2.0 * math.pi * freq / SAMPLE_RATE
        amp = math.exp(-decay * t) * envelope(index, total, attack, 1.2)
        samples.append(math.sin(phase) * volume * amp)
    return samples


def crackle(
    duration: float,
    volume: float = 0.2,
    density: float = 28.0,
    rng: random.Random | None = None,
) -> list[float]:
    """火用の短い不規則クラックル（スパッと鳴る粒）。"""
    rng = rng or random.Random(0)
    total = max(1, int(SAMPLE_RATE * duration))
    samples = [0.0] * total
    pops = max(1, int(density * duration))
    for _ in range(pops):
        center = rng.randrange(0, total)
        width = rng.randint(2, 8)
        amp = rng.uniform(0.4, 1.0) * volume
        for offset in range(-width, width + 1):
            index = center + offset
            if 0 <= index < total:
                fall = 1.0 - abs(offset) / (width + 1)
                samples[index] += amp * fall * rng.choice([-1.0, 1.0])
    # 全体エンベロープで短く収める
    for index in range(total):
        samples[index] *= envelope(index, total, 0.02, 2.4)
    return samples


def grain_noise(
    duration: float,
    volume: float = 0.28,
    grain_hz: float = 90.0,
    center_hz: float = 700.0,
    bandwidth_hz: float = 500.0,
    attack: float = 0.004,
    release_power: float = 3.2,
    rng: random.Random | None = None,
) -> list[float]:
    """土用の粒状ノイズ（短い粒が連なる砂・小石感）。"""
    rng = rng or random.Random(0)
    base = bandpass_noise(
        duration,
        center_hz,
        bandwidth_hz,
        volume=1.0,
        attack=0.001,
        release_power=1.0,
        rng=rng,
    )
    total = len(base)
    samples: list[float] = []
    for index in range(total):
        t = index / SAMPLE_RATE
        # 粒のゲート（速い振幅揺らぎ）
        gate = 0.55 + 0.45 * abs(math.sin(2.0 * math.pi * grain_hz * t + rng.random()))
        # ときどき粒を落とす
        if rng.random() < 0.08:
            gate *= 0.15
        samples.append(
            base[index] * gate * volume * envelope(index, total, attack, release_power)
        )
    return samples


def amp_flutter(samples: list[float], depth: float, rate_hz: float, seed: int = 0) -> list[float]:
    """ごく弱い振幅揺らぎ（連射で機械的になりすぎない程度）。"""
    rng = random.Random(seed)
    phase = rng.uniform(0.0, math.pi * 2.0)
    out: list[float] = []
    for index, sample in enumerate(samples):
        t = index / SAMPLE_RATE
        mod = 1.0 + depth * math.sin(2.0 * math.pi * rate_hz * t + phase)
        out.append(sample * mod)
    return out


# ---------------------------------------------------------------------------
# 戦闘（属性弾）
# ---------------------------------------------------------------------------


def build_power_fire() -> list[float]:
    # クリーンな基準魔法。ノイズ少なめ＋明瞭な中高域下降。
    body = resonator(0.075, 980, 560, volume=0.36, decay=22.0, attack=0.005)
    air = bandpass_noise(0.04, 2200, 1400, volume=0.1, attack=0.008, release_power=4.0, rng=random.Random(21))
    soft = tone(0.07, 720, 480, 0.12, "sine", 0.01, 3.2)
    return amp_flutter(mix_samples(body, air, soft), 0.04, 18.0, 210)


def build_power_hit() -> list[float]:
    # 同じクリーン素材で、短いアタックを強めた命中。
    click = bandpass_noise(0.02, 2600, 1600, volume=0.18, attack=0.001, release_power=6.0, rng=random.Random(22))
    body = resonator(0.055, 840, 420, volume=0.34, decay=28.0, attack=0.002)
    return mix_samples(click, body)


def build_wind_fire() -> list[float]:
    # 空気を切る。高中域帯域ノイズ主体、音程は弱め、急速に抜ける。
    whoosh = bandpass_noise(0.085, 2800, 2200, volume=0.42, attack=0.01, release_power=2.8, rng=random.Random(2))
    air = colored_noise(0.07, volume=0.14, attack=0.012, release_power=3.2, color=0.55, rng=random.Random(12))
    thin = tone(0.045, 1500, 900, 0.06, "sine", 0.02, 4.0)
    return amp_flutter(mix_samples(whoosh, air, thin), 0.06, 40.0, 20)


def build_wind_hit() -> list[float]:
    # 短い切り付けアタック。発射より鋭く、すぐ消える（0.05s以上）。
    slash = bandpass_noise(0.055, 3200, 2400, volume=0.46, attack=0.001, release_power=5.0, rng=random.Random(3))
    tip = colored_noise(0.04, volume=0.12, attack=0.001, release_power=5.5, color=0.7, rng=random.Random(13))
    return mix_samples(slash, tip)


def build_water_fire() -> list[float]:
    # 水滴・冷たい液体の小さな共鳴（近い2音＋微量の柔ノイズ）。ベル化しない。
    drop_a = resonator(0.08, 920, 780, volume=0.28, decay=16.0, attack=0.006, wobble_hz=7.0, wobble_amount=0.012)
    drop_b = resonator(0.07, 1080, 900, volume=0.2, decay=18.0, attack=0.008, wobble_hz=9.0, wobble_amount=0.01)
    soft = colored_noise(0.05, volume=0.07, attack=0.01, release_power=4.0, color=-0.15, rng=random.Random(4))
    return mix_samples(drop_a, pad_start(drop_b, 0.012), soft)


def build_water_hit() -> list[float]:
    # 水しぶきの短いアタック＋共鳴。発射と同じ素材だが当たった感を強く。
    splash = colored_noise(0.03, volume=0.14, attack=0.001, release_power=5.5, color=-0.05, rng=random.Random(14))
    drop_a = resonator(0.06, 860, 620, volume=0.3, decay=22.0, attack=0.002)
    drop_b = resonator(0.05, 1020, 760, volume=0.18, decay=24.0, attack=0.003)
    return mix_samples(splash, drop_a, pad_start(drop_b, 0.008))


def build_fire_fire() -> list[float]:
    # 小さな炎の噴出。中域色付きノイズ主体＋短い crackle。低い爆発にしない。
    roar = colored_noise(0.085, volume=0.3, attack=0.01, release_power=2.4, color=0.15, rng=random.Random(5))
    mid = bandpass_noise(0.07, 900, 700, volume=0.18, attack=0.012, release_power=2.8, rng=random.Random(15))
    sparks = crackle(0.035, volume=0.16, density=36.0, rng=random.Random(25))
    hint = resonator(0.05, 640, 420, volume=0.1, decay=20.0, attack=0.01)
    return amp_flutter(mix_samples(roar, mid, sparks, hint), 0.08, 22.0, 50)


def build_fire_hit() -> list[float]:
    # 火の粉が弾ける命中。crackle をやや多めに。
    pop = crackle(0.04, volume=0.22, density=48.0, rng=random.Random(6))
    body = colored_noise(0.055, volume=0.24, attack=0.002, release_power=3.6, color=0.2, rng=random.Random(16))
    mid = bandpass_noise(0.04, 1100, 800, volume=0.14, attack=0.002, release_power=4.2, rng=random.Random(26))
    hint = resonator(0.04, 580, 360, volume=0.1, decay=26.0, attack=0.002)
    return mix_samples(pop, body, mid, hint)


def build_earth_fire() -> list[float]:
    # 砂粒・小石。粒状ノイズ＋軽い石の共鳴。重低音にしない。
    grains = grain_noise(
        0.08,
        volume=0.3,
        grain_hz=110.0,
        center_hz=780.0,
        bandwidth_hz=520.0,
        attack=0.006,
        release_power=3.0,
        rng=random.Random(7),
    )
    tap = resonator(0.055, 720, 520, volume=0.16, decay=24.0, attack=0.008)
    dust = colored_noise(0.05, volume=0.08, attack=0.01, release_power=3.5, color=-0.35, rng=random.Random(17))
    return mix_samples(grains, tap, dust)


def build_earth_hit() -> list[float]:
    # 小石が当たるコツッ。粒＋短い減衰共鳴アタック。
    grains = grain_noise(
        0.06,
        volume=0.28,
        grain_hz=130.0,
        center_hz=700.0,
        bandwidth_hz=480.0,
        attack=0.001,
        release_power=4.5,
        rng=random.Random(8),
    )
    knock = resonator(0.07, 640, 400, volume=0.26, decay=26.0, attack=0.002)
    dust = colored_noise(0.035, volume=0.1, attack=0.001, release_power=5.0, color=-0.3, rng=random.Random(18))
    return mix_samples(grains, knock, dust)


def build_enemy_defeat() -> list[float]:
    # 0.07〜0.11s プチッ／ポフ。結晶・ベル・上昇なし
    return mix_samples(
        noise(0.035, 0.3, 0.001, 5.5, 0.55, random.Random(61)),
        tone(0.09, 650, 180, 0.42, "sine", 0.003, 3.2),
    )


def build_enemy_hit() -> list[float]:
    # 0.04〜0.07s 軽い命中
    return mix_samples(
        noise(0.025, 0.24, 0.001, 6.0, 0.65, random.Random(31)),
        tone(0.045, 780, 340, 0.28, "triangle", 0.002, 4.5),
    )


def build_enemy_blocked() -> list[float]:
    # 短く硬い反射。金属ベルにしない
    return mix_samples(
        noise(0.04, 0.28, 0.001, 5.0, 0.4, random.Random(32)),
        tone(0.075, 360, 160, 0.36, "sine", 0.002, 3.4),
        tone(0.045, 520, 280, 0.14, "triangle", 0.002, 4.0),
    )


def build_coin_pickup() -> list[float]:
    # 控えめ上昇ピップ。キラキラしすぎない
    return mix_samples(
        tone(0.06, 980, 1280, 0.3, "sine", 0.003, 3.6),
        tone(0.05, 1320, 1600, 0.14, "triangle", 0.005, 4.0),
        noise(0.02, 0.05, 0.001, 6.0, 0.7, random.Random(33)),
    )


def build_player_hurt() -> list[float]:
    # 0.10〜0.16s 被弾。低すぎる重音は避け、中域寄りの「カッ／ヒュッ」。
    return mix_samples(
        tone(0.11, 520, 320, 0.4, "sine", 0.004, 2.8),
        tone(0.09, 780, 480, 0.18, "triangle", 0.006, 3.0),
        noise(0.07, 0.18, 0.002, 3.5, 0.45, random.Random(34)),
    )


# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------


def build_menu_move() -> list[float]:
    # 0.04〜0.07s 控えめクリック
    return mix_samples(
        tone(0.045, 1200, 980, 0.26, "sine", 0.003, 4.5),
        noise(0.018, 0.05, 0.001, 6.0, 0.75, random.Random(41)),
    )


def build_menu_cancel() -> list[float]:
    # menu_move より低い短い戻る音
    return mix_samples(
        tone(0.08, 720, 420, 0.28, "sine", 0.004, 3.2),
        tone(0.06, 520, 300, 0.14, "triangle", 0.006, 3.5),
    )


def build_shop_purchase() -> list[float]:
    # 0.16〜0.24s 短い肯定。派手にしない
    return mix_samples(
        tone(0.1, 760, 980, 0.28, "sine", 0.005, 2.8),
        pad_start(tone(0.12, 980, 1220, 0.24, "sine", 0.005, 2.6), 0.07),
        noise(0.03, 0.04, 0.001, 5.0, 0.5, random.Random(43)),
    )


# ---------------------------------------------------------------------------
# イベント（短い上昇／勝利／下降。ベル・オルゴール・長い残響なし）
# ---------------------------------------------------------------------------


def _fanfare_note(
    duration: float,
    freq: float,
    volume: float,
    attack: float = 0.01,
    release_power: float = 2.8,
) -> list[float]:
    """明るいファンファーレ用の1音（sine + 薄い square。ベル化しない）。"""
    return mix_samples(
        tone(duration, freq, freq, volume, "sine", attack, release_power),
        tone(duration, freq, freq, volume * 0.28, "square", attack + 0.004, release_power + 0.3),
        tone(duration, freq * 2.0, freq * 2.0, volume * 0.08, "sine", attack + 0.01, release_power + 0.5),
    )


def _major_triad_pad(
    duration: float,
    root_hz: float,
    volume: float,
    attack: float = 0.02,
    release_power: float = 2.0,
) -> list[float]:
    """短い明るいメジャー和音パッド（低すぎる根音は使わない）。"""
    third = root_hz * (5.0 / 4.0)
    fifth = root_hz * (3.0 / 2.0)
    return mix_samples(
        tone(duration, root_hz, root_hz, volume, "sine", attack, release_power),
        tone(duration, third, third, volume * 0.85, "sine", attack, release_power),
        tone(duration, fifth, fifth, volume * 0.75, "triangle", attack, release_power),
    )


def build_level_up() -> list[float]:
    # 旧ジングル参考: C→E→G→C の短いファンファーレ。0.45〜0.65s。
    c5 = 523.25
    e5 = 659.25
    g5 = 783.99
    c6 = 1046.50
    note1 = _fanfare_note(0.10, c5, 0.36, 0.008, 3.6)
    note2 = pad_start(_fanfare_note(0.10, e5, 0.38, 0.008, 3.5), 0.10)
    note3 = pad_start(_fanfare_note(0.11, g5, 0.4, 0.008, 3.3), 0.20)
    note4 = pad_start(
        mix_samples(
            _fanfare_note(0.28, c6, 0.44, 0.01, 2.3),
            _major_triad_pad(0.26, c5, 0.14, 0.02, 2.2),
        ),
        0.32,
    )
    return mix_samples(note1, note2, note3, note4)


def build_stage_clear() -> list[float]:
    # 旧ジングル参考: 上昇して着地する勝利ファンファーレ（level_up より明確）。
    # メロ: G4→B4→D5→G5、最後に明るい G メジャー。0.9〜1.3s。
    g4 = 392.00
    b4 = 493.88
    d5 = 587.33
    g5 = 783.99
    b5 = 987.77
    note1 = _fanfare_note(0.16, g4, 0.34, 0.012, 2.8)
    note2 = pad_start(_fanfare_note(0.16, b4, 0.36, 0.012, 2.7), 0.16)
    note3 = pad_start(_fanfare_note(0.18, d5, 0.38, 0.012, 2.6), 0.34)
    note4 = pad_start(_fanfare_note(0.22, g5, 0.4, 0.014, 2.4), 0.56)
    landing = pad_start(
        mix_samples(
            _fanfare_note(0.42, b5, 0.36, 0.016, 2.0),
            _fanfare_note(0.42, g5, 0.22, 0.02, 2.0),
            _major_triad_pad(0.4, g4 * 2.0, 0.16, 0.025, 1.9),
        ),
        0.78,
    )
    return mix_samples(note1, note2, note3, note4, landing)


def build_area_clear() -> list[float]:
    # 旧ジングル参考: C→E→G→C→E→高いC のファンファーレ。stage_clear より一段豪華。
    # 1.2〜1.8s。ベル連打ではなく、柔らかいブラス寄りシンセ。
    c5 = 523.25
    e5 = 659.25
    g5 = 783.99
    c6 = 1046.50
    e6 = 1318.51
    note1 = _fanfare_note(0.14, c5, 0.34, 0.012, 2.9)
    note2 = pad_start(_fanfare_note(0.14, e5, 0.36, 0.012, 2.8), 0.14)
    note3 = pad_start(_fanfare_note(0.14, g5, 0.38, 0.012, 2.7), 0.28)
    note4 = pad_start(_fanfare_note(0.18, c6, 0.4, 0.014, 2.5), 0.44)
    note5 = pad_start(_fanfare_note(0.2, e6, 0.38, 0.014, 2.4), 0.66)
    landing = pad_start(
        mix_samples(
            _fanfare_note(0.55, c6 * 2.0, 0.34, 0.02, 1.8),
            _fanfare_note(0.55, c6, 0.28, 0.02, 1.8),
            _major_triad_pad(0.55, c5, 0.18, 0.03, 1.7),
            _major_triad_pad(0.5, c6, 0.1, 0.04, 1.9),
        ),
        0.92,
    )
    return mix_samples(note1, note2, note3, note4, note5, landing)


def build_game_over() -> list[float]:
    # 0.7〜1.1s 短い下降。必要以上に暗く長くしない
    return mix_samples(
        tone(0.28, 392, 330, 0.3, "sine", 0.02, 1.9),
        pad_start(tone(0.35, 330, 262, 0.26, "triangle", 0.025, 1.8), 0.2),
        pad_start(tone(0.4, 262, 196, 0.22, "sine", 0.03, 1.7), 0.45),
        noise(0.1, 0.12, 0.01, 2.4, 0.15, random.Random(74)),
    )


SFX_DEFS: list[SfxDef] = [
    SfxDef("player_fire_power", 0.08, build_power_fire),
    SfxDef("player_hit_power", 0.10, build_power_hit),
    SfxDef("player_fire_wind", 0.09, build_wind_fire),
    SfxDef("player_hit_wind", 0.10, build_wind_hit),
    SfxDef("player_fire_water", 0.10, build_water_fire),
    SfxDef("player_hit_water", 0.10, build_water_hit),
    SfxDef("player_fire_fire", 0.11, build_fire_fire),
    SfxDef("player_hit_fire", 0.10, build_fire_hit),
    SfxDef("player_fire_earth", 0.12, build_earth_fire),
    SfxDef("player_hit_earth", 0.10, build_earth_hit),
    SfxDef("enemy_defeat", 0.11, build_enemy_defeat),
    SfxDef("enemy_hit", 0.07, build_enemy_hit),
    SfxDef("enemy_blocked", 0.11, build_enemy_blocked),
    SfxDef("coin_pickup", 0.10, build_coin_pickup),
    SfxDef("player_hurt", 0.16, build_player_hurt),
    SfxDef("menu_move", 0.07, build_menu_move),
    SfxDef("menu_cancel", 0.12, build_menu_cancel),
    SfxDef("shop_purchase", 0.24, build_shop_purchase),
    SfxDef("level_up", 0.70, build_level_up),
    SfxDef("stage_clear", 1.30, build_stage_clear),
    SfxDef("area_clear", 1.80, build_area_clear),
    SfxDef("game_over", 1.10, build_game_over),
]

SFX_BY_ID: dict[str, SfxDef] = {item.sfx_id: item for item in SFX_DEFS}


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        frames = b"".join(struct.pack("<h", int(clamp(sample) * 32767)) for sample in samples)
        wav_file.writeframes(frames)


def ffmpeg_trim_normalize_to_ogg(wav_path: Path, ogg_path: Path) -> None:
    ogg_path.parent.mkdir(parents=True, exist_ok=True)
    # 短尺 SE では loudnorm が音量を下げすぎるため使わない。
    # Python 側でピーク -1dB 済み。ffmpeg は末尾無音除去と mono/44.1k 化のみ。
    filter_graph = (
        "silenceremove=start_periods=0:stop_periods=-1:"
        "stop_duration=0.015:stop_threshold=-50dB,"
        "alimiter=limit=0.8913:level=disabled"
    )
    command = [
        "ffmpeg", "-y", "-i", str(wav_path),
        "-af", filter_graph,
        "-ar", str(SAMPLE_RATE), "-ac", "1",
        "-c:a", "libvorbis", "-q:a", "5",
        str(ogg_path),
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed for {wav_path.name}:\n{result.stderr[-800:]}")


def render_sfx(sfx: SfxDef) -> list[float]:
    samples = trim_to_max(sfx.builder(), sfx.max_duration)
    return peak_normalize(samples)


def install_sfx(sfx: SfxDef) -> Path:
    if sfx.ogg_name in BGM_NAMES:
        raise RuntimeError(f"BGM を上書きしようとしました: {sfx.ogg_name}")
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg が見つかりません。")

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_AUDIO.mkdir(parents=True, exist_ok=True)

    samples = render_sfx(sfx)
    wav_path = WORK_DIR / f"{sfx.sfx_id}.wav"
    work_ogg = WORK_DIR / f"{sfx.sfx_id}.ogg"
    write_wav(wav_path, samples)
    ffmpeg_trim_normalize_to_ogg(wav_path, work_ogg)

    dest = PUBLIC_AUDIO / sfx.ogg_name
    shutil.copy2(work_ogg, dest)
    raw_seconds = len(samples) / SAMPLE_RATE
    print(f"Installed {dest.name}  (raw {raw_seconds:.3f}s / max {sfx.max_duration:.2f}s)")

    if sfx.sfx_id == "player_fire_power":
        shutil.copy2(dest, PUBLIC_AUDIO / "player_fire.ogg")
        print("Also updated player_fire.ogg")
    return dest


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "[DEPRECATED] 旧 Python 波形合成 SE 生成器。"
            "正式 SE は npm run generate:sfx（Tone.js オフライン）を使ってください。"
        )
    )
    parser.add_argument(
        "--install-all",
        action="store_true",
        help="全 SE を再生成して public/assets/audio へ入れる",
    )
    parser.add_argument(
        "--install",
        action="append",
        default=[],
        metavar="ID",
        help="個別に再生成して正式採用（例: enemy_defeat）",
    )
    parser.add_argument(
        "--force-legacy",
        action="store_true",
        help="非推奨のまま正式 SE を上書きする（通常は使わない）",
    )
    args = parser.parse_args()

    if not args.force_legacy:
        print(
            "DEPRECATED: このスクリプトは旧 Python 波形合成です。\n"
            "正式 SE の生成・更新は次を使ってください:\n"
            "  npm run generate:sfx\n"
            "（tools/sfx_designer / Tone.js オフライン）\n"
            "どうしてもこのスクリプトで上書きする場合のみ --force-legacy を付けてください。",
            file=sys.stderr,
        )
        return 2

    if not args.install_all and not args.install:
        args.install_all = True

    targets: list[SfxDef] = []
    if args.install_all:
        targets = list(SFX_DEFS)
    for sfx_id in args.install:
        key = sfx_id.strip()
        if key not in SFX_BY_ID:
            known = ", ".join(sorted(SFX_BY_ID.keys()))
            raise SystemExit(f"不明な SE id: {key}\n既知: {known}")
        targets.append(SFX_BY_ID[key])

    # 重複除去（順序維持）
    seen: set[str] = set()
    unique: list[SfxDef] = []
    for sfx in targets:
        if sfx.sfx_id in seen:
            continue
        seen.add(sfx.sfx_id)
        unique.append(sfx)

    for sfx in unique:
        install_sfx(sfx)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
