"""Generator Korpus Latih Independen Display Timbangan Industri (Anti-Kebocoran Uji).

Menghasilkan citra crop display bezel timbangan 7-segmen beserta label dan anotasi kondisi
menggunakan seed terpisah (seed=20261122) sehingga 100% disjoint dari dataset_uji.
"""

import os
import random
from typing import Dict, List, Tuple
import cv2
import numpy as np

from .segment_synth import DIGIT_MAP

THEME_PALETTES: Dict[str, Tuple[Tuple[int, int, int], Tuple[int, int, int], Tuple[int, int, int]]] = {
    # (bezel_bgr, screen_bg_bgr, active_fg_bgr)
    "mettler_lcd_white": ((45, 50, 56), (234, 240, 242), (24, 28, 32)),
    "cas_lcd_olive": ((52, 58, 54), (170, 188, 168), (22, 32, 26)),
    "lcd_low_contrast": ((68, 72, 74), (165, 170, 172), (96, 102, 104)),
    "and_led_red": ((28, 28, 30), (16, 14, 18), (45, 55, 245)),
    "led_emerald_green": ((26, 30, 28), (14, 22, 16), (95, 245, 80)),
    "led_amber": ((32, 28, 24), (20, 16, 12), (45, 185, 250)),
    "led_ice_blue": ((26, 28, 32), (18, 18, 24), (250, 235, 110)),
    "orange_backlit": ((42, 42, 46), (22, 130, 235), (18, 20, 24)),
}


def _blend_color(bg: Tuple[int, int, int], fg: Tuple[int, int, int], alpha: float) -> Tuple[int, int, int]:
    return tuple(int(bg[c] + (fg[c] - bg[c]) * alpha) for c in range(3))


def _draw_color_digit(
    img: np.ndarray,
    ch: str,
    x: int,
    y: int,
    w: int,
    h: int,
    fg: Tuple[int, int, int],
    ghost_col: Tuple[int, int, int],
    thickness: int = 4,
) -> None:
    segs = DIGIT_MAP.get(ch, [0] * 7)
    half_h = h // 2
    t = max(2, thickness)
    lines = [
        ((x + t, y), (x + w - t, y)),
        ((x + w, y + t), (x + w, y + half_h - t)),
        ((x + w, y + half_h + t), (x + w, y + h - t)),
        ((x + t, y + h), (x + w - t, y + h)),
        ((x, y + half_h + t), (x, y + h - t)),
        ((x, y + t), (x, y + half_h - t)),
        ((x + t, y + half_h), (x + w - t, y + half_h)),
    ]
    for on, (p1, p2) in zip(segs, lines):
        cv2.line(img, p1, p2, fg if on else ghost_col, t)


def render_industrial_bezel(
    text: str,
    theme_key: str,
    total_slots: int,
    condition: str,
    rng: random.Random,
) -> np.ndarray:
    """Merender crop display timbangan industri lengkap dengan bezel, ghost 8, dan kondisi lapangan."""
    w = 430 if total_slots == 5 else (570 if total_slots == 7 else 500)
    h = 163
    bezel_bgr, bg_bgr, fg_bgr = THEME_PALETTES[theme_key]
    img = np.full((h, w, 3), bezel_bgr, dtype=np.uint8)

    pad_x, pad_y = 14, 14
    cv2.rectangle(img, (pad_x, pad_y), (w - pad_x, h - pad_y), bg_bgr, -1)

    chars_no_dots = text.replace(".", "")
    padded = chars_no_dots.rjust(total_slots, " ")
    dot_slots = {len(text[: idx].replace(".", "")) - 1 for idx, ch in enumerate(text) if ch == "."}

    ghost_alpha = rng.uniform(0.08, 0.20)
    ghost_col = _blend_color(bg_bgr, fg_bgr, ghost_alpha)

    slot_w = int((w - 2 * pad_x - 56) / max(total_slots, 1))
    digit_w = max(24, int(slot_w * 0.62))
    digit_h = 84
    start_y = 26

    for s_idx, ch in enumerate(padded):
        sx = pad_x + 14 + s_idx * slot_w
        _draw_color_digit(img, ch, sx, start_y, digit_w, digit_h, fg_bgr, ghost_col, thickness=rng.randint(4, 6))
        if s_idx in dot_slots:
            cv2.circle(img, (sx + digit_w + 5, start_y + digit_h + 2), 4, fg_bgr, -1)
        elif ghost_alpha > 0.12:
            cv2.circle(img, (sx + digit_w + 5, start_y + digit_h + 2), 3, ghost_col, -1)

    # Keterangan bezel halus di bagian bawah layar
    legend_col = _blend_color(bg_bgr, fg_bgr, 0.55)
    cv2.putText(img, "ZERO   NET   STABLE", (pad_x + 24, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.36, legend_col, 1)
    cv2.putText(img, "kg", (w - pad_x - 36, start_y + digit_h - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, legend_col, 1)

    # Terapkan kondisi degradasi lapangan pada split latih
    if condition == "glare":
        overlay = img.copy()
        cx = rng.randint(int(w * 0.2), int(w * 0.8))
        cv2.circle(overlay, (cx, rng.randint(30, h - 30)), rng.randint(45, 85), (255, 255, 255), -1)
        img = cv2.addWeighted(overlay, rng.uniform(0.25, 0.45), img, 0.65, 0)
    elif condition == "tilt":
        ang = rng.uniform(-7.0, 7.0)
        mat = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), ang, 0.96)
        img = cv2.warpAffine(img, mat, (w, h), borderValue=bezel_bgr)
    elif condition == "wet_foggy":
        k = rng.choice([3, 5])
        img = cv2.GaussianBlur(img, (k, k), 1.4)
    elif condition == "dusty":
        np_rng = np.random.default_rng(rng.randint(1, 999999))
        noise = np_rng.normal(0, 12.0, img.shape)
        img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        for _ in range(rng.randint(8, 22)):
            px, py = rng.randint(10, w - 10), rng.randint(10, h - 10)
            cv2.circle(img, (px, py), rng.randint(1, 2), (90, 90, 90), -1)
    elif condition == "low_contrast":
        alpha = rng.uniform(0.45, 0.65)
        img = np.clip(img.astype(np.float32) * alpha + 60.0, 0, 255).astype(np.uint8)

    return img


def generate_disjoint_train_corpus(output_images_dir: str, count: int = 320, seed: int = 20261122) -> List[Dict]:
    """Membangkitkan dataset sintetis latih yang terpisah 100% dari locked_test_set."""
    rng = random.Random(seed)
    themes = list(THEME_PALETTES.keys())
    conditions = ("clean", "glare", "tilt", "wet_foggy", "dusty", "low_contrast")
    items: List[Dict] = []

    os.makedirs(output_images_dir, exist_ok=True)
    for idx in range(count):
        slots = rng.choice([5, 6, 7])
        if rng.random() > 0.25:
            decimals = rng.choice([1, 2, 3]) if slots >= 6 else rng.choice([1, 2])
            max_v = 120.0 if slots <= 6 else 1800.0
            val = round(rng.uniform(0.25, max_v), decimals)
            label = f"{val:.{decimals}f}"
        else:
            label = str(rng.randint(2, 1950 if slots >= 6 else 350))

        theme_key = themes[idx % len(themes)]
        cond = conditions[(idx // len(themes)) % len(conditions)]
        img = render_industrial_bezel(label, theme_key=theme_key, total_slots=slots, condition=cond, rng=rng)

        fname = f"scale_train_{idx + 1:04d}.jpg"
        cv2.imwrite(os.path.join(output_images_dir, fname), img)
        items.append({
            "id": f"scale_train_{idx + 1:04d}",
            "source": "scale_train_synthetic",
            "filename": fname,
            "label": label,
            "display_type": "LED" if "led" in theme_key else "LCD",
            "theme": theme_key,
            "condition": cond,
            "total_slots": slots,
            "roi_bbox": None,
            "notes": f"Sintesis latih independen seed={seed}; kondisi={cond}",
        })
    return items


def generate_warehouse_bezel_corpus(output_images_dir: str, count: int = 200, seed: int = 20261123) -> List[Dict]:
    """Menghasilkan variasi bezel gudang penuh (teks header atas, margin casing, goresan/debu)."""
    rng = random.Random(seed)
    themes = list(THEME_PALETTES.keys())
    headers = ("SCALEPRO DS-33", "XK-57", "PRIMA-W EW-82", "IND-231 PRO", "CAS-SW30")
    conditions = ("clean", "glare", "tilt", "wet_foggy", "dusty", "low_contrast")
    items: List[Dict] = []

    os.makedirs(output_images_dir, exist_ok=True)
    for idx in range(count):
        slots = rng.choice([5, 6, 7])
        if rng.random() > 0.25:
            dec = rng.choice([1, 2])
            label = f"{round(rng.uniform(0.3, 180.0 if slots >= 6 else 60.0), dec):.{dec}f}"
        else:
            label = str(rng.randint(5, 1500 if slots >= 6 else 250))

        theme_key = themes[idx % len(themes)]
        cond = conditions[(idx // len(themes)) % len(conditions)]
        inner = render_industrial_bezel(label, theme_key=theme_key, total_slots=slots, condition=cond, rng=rng)
        ih, iw = inner.shape[:2]

        # Tambahkan margin casing putih/abu atas-bawah + teks merek yang terpotong wajar di ROI
        top_pad = rng.randint(18, 36)
        bot_pad = rng.randint(6, 16)
        side_pad = rng.randint(12, 32)
        casing_col = rng.choice([(228, 232, 236), (175, 182, 195), (210, 214, 218)])
        canvas = np.full((ih + top_pad + bot_pad, iw + 2 * side_pad, 3), casing_col, dtype=np.uint8)
        canvas[top_pad:top_pad + ih, side_pad:side_pad + iw] = inner
        cv2.putText(
            canvas,
            headers[idx % len(headers)],
            (side_pad + rng.randint(4, 30), max(12, top_pad - 5)),
            cv2.FONT_HERSHEY_SIMPLEX,
            rng.uniform(0.55, 0.78),
            (24, 24, 28),
            2,
        )

        # Tambah sedikit goresan/debu putih pada skenario LED atau dusty
        if cond in ("dusty", "glare"):
            for _ in range(rng.randint(4, 10)):
                x1, y1 = rng.randint(0, canvas.shape[1] - 1), rng.randint(0, canvas.shape[0] - 1)
                x2, y2 = rng.randint(0, canvas.shape[1] - 1), rng.randint(0, canvas.shape[0] - 1)
                cv2.line(canvas, (x1, y1), (x2, y2), (225, 225, 225), 1)

        fname = f"scale_wh_{idx + 1:04d}.jpg"
        cv2.imwrite(os.path.join(output_images_dir, fname), canvas)
        items.append({
            "id": f"scale_wh_{idx + 1:04d}",
            "source": "scale_train_warehouse",
            "filename": fname,
            "label": label,
            "display_type": "LED" if "led" in theme_key else "LCD",
            "theme": theme_key,
            "condition": cond,
            "total_slots": slots,
            "roi_bbox": None,
            "notes": f"Sintesis bezel gudang seed={seed}; kondisi={cond}",
        })
    return items
