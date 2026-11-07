"""Sintesis Citra Tampilan 7-Segmen untuk Pelatihan CRNN-CTC.

Modul ini menghasilkan citra crop tampilan timbangan digital 7-segmen realistis:
1. Mendukung 7-segmen baku dengan segmen aktif dan segmen hantu (ghost segments).
2. Mendukung titik desimal, variasi slot kosong depan (leading zeros / faint eights).
3. Mendukung ragam tema: LCD Gelap-di-Terang dan LED Terang-di-Gelap.
"""

import random
from typing import List, Tuple
import cv2
import numpy as np

# Pemetaan 7 segmen: a, b, c, d, e, f, g
DIGIT_MAP = {
    "0": [1, 1, 1, 1, 1, 1, 0],
    "1": [0, 1, 1, 0, 0, 0, 0],
    "2": [1, 1, 0, 1, 1, 0, 1],
    "3": [1, 1, 1, 1, 0, 0, 1],
    "4": [0, 1, 1, 0, 0, 1, 1],
    "5": [1, 0, 1, 1, 0, 1, 1],
    "6": [1, 0, 1, 1, 1, 1, 1],
    "7": [1, 1, 1, 0, 0, 0, 0],
    "8": [1, 1, 1, 1, 1, 1, 1],
    "9": [1, 1, 1, 1, 0, 1, 1],
    " ": [0, 0, 0, 0, 0, 0, 0],
}


def draw_segment_digit(
    canvas: np.ndarray,
    char: str,
    x: int,
    y: int,
    w: int,
    h: int,
    fg_val: int,
    bg_val: int,
    ghost_alpha: float = 0.15,
    thickness: int = 2,
):
    """Gambar satu digit 7-segmen dengan segmen aktif dan segmen hantu."""
    segs = DIGIT_MAP.get(char, [0, 0, 0, 0, 0, 0, 0])
    half_h = h // 2
    t = max(1, thickness)

    # Definisi koordinat garis segmen (p1, p2)
    # a: top, b: top-right, c: bottom-right, d: bottom, e: bottom-left, f: top-left, g: mid
    lines = [
        ((x + t, y), (x + w - t, y)),                      # a
        ((x + w, y + t), (x + w, y + half_h - t)),         # b
        ((x + w, y + half_h + t), (x + w, y + h - t)),     # c
        ((x + t, y + h), (x + w - t, y + h)),              # d
        ((x, y + half_h + t), (x, y + h - t)),             # e
        ((x, y + t), (x, y + half_h - t)),                 # f
        ((x + t, y + half_h), (x + w - t, y + half_h)),    # g
    ]

    for is_on, (p1, p2) in zip(segs, lines):
        if is_on:
            cv2.line(canvas, p1, p2, fg_val, t)
        elif ghost_alpha > 0.0:
            val = int(bg_val + (fg_val - bg_val) * ghost_alpha)
            cv2.line(canvas, p1, p2, val, t)


def render_scale_display(
    text: str,
    total_slots: int = 6,
    width: int = 128,
    height: int = 32,
    theme: str = "lcd",
) -> np.ndarray:
    """Render satu gambar crop tampilan timbangan digital."""
    # Tentukan polaritas tema
    if theme == "lcd":
        bg_val = random.randint(180, 230)
        fg_val = random.randint(20, 60)
        ghost_alpha = random.uniform(0.08, 0.22)
    else:  # led
        bg_val = random.randint(10, 40)
        fg_val = random.randint(210, 255)
        ghost_alpha = random.uniform(0.05, 0.15)

    canvas = np.full((height, width), bg_val, dtype=np.uint8)

    # Parsing digit dan posisi titik
    digits_only = [c for c in text if c.isdigit()]
    dot_pos = text.find(".") if "." in text else -1

    # Right align digit pada slot
    num_digits = len(digits_only)
    padding_slots = max(0, total_slots - num_digits)

    slot_w = (width - 16) // total_slots
    digit_w = int(slot_w * 0.65)
    digit_h = int(height * 0.70)
    y_top = (height - digit_h) // 2
    thickness = max(2, digit_w // 4)

    curr_x = 8
    dot_x = None

    for s in range(total_slots):
        if s < padding_slots:
            # Slot kosong di depan (bisa tampilkan segmen hantu faint 8)
            draw_segment_digit(
                canvas, " ", curr_x, y_top, digit_w, digit_h, fg_val, bg_val, ghost_alpha, thickness
            )
        else:
            d_idx = s - padding_slots
            ch = digits_only[d_idx]
            draw_segment_digit(
                canvas, ch, curr_x, y_top, digit_w, digit_h, fg_val, bg_val, ghost_alpha, thickness
            )

        # Cek apakah titik desimal jatuh tepat setelah digit ini
        if dot_pos != -1:
            digit_global_idx = s - padding_slots
            chars_before_dot = len([c for c in text[:dot_pos] if c.isdigit()])
            if digit_global_idx == chars_before_dot - 1:
                dot_x = curr_x + digit_w + 2

        curr_x += slot_w

    # Gambar titik desimal jika ada
    if dot_x is not None and dot_x < width - 2:
        dot_y = y_top + digit_h
        cv2.circle(canvas, (dot_x, dot_y), max(1, thickness // 2), fg_val, -1)

    # Tambahkan noise gaussian ringan
    noise = np.random.normal(0, random.uniform(1.0, 4.0), canvas.shape).astype(np.float32)
    noisy = np.clip(canvas.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    # Blur ringan opsional
    if random.random() > 0.5:
        noisy = cv2.GaussianBlur(noisy, (3, 3), 0.5)

    return noisy
