"""Pembersihan Kebocoran & Pembaruan Dataset Latih Terpadu (dataset/dataset_latih).

Menghapus 80 citra bocor (`scale_syn_0001..0080`), menggantikannya dengan 400 citra
sintesis timbangan independen (tanpa bocor uji), serta melengkapi `roi_bbox` jendela LCD
pada foto riil `sachaizadi_real` di split latih.
"""

import csv
import json
import os
from typing import Any, Dict, List, Optional
import cv2
import numpy as np

from .generate_train_scales import (
    generate_disjoint_train_corpus,
    generate_warehouse_bezel_corpus,
)


def _pick_best_lcd_contour(cnts, sw: int, sh: int, min_hull: float) -> Optional[List[int]]:
    best = None
    for c in cnts:
        x, y, bw, bh = cv2.boundingRect(c)
        ar = bw / max(1.0, float(bh))
        h_frac = bh / float(sh)
        w_frac = bw / float(sw)
        hull = cv2.contourArea(c) / max(1.0, float(bw * bh))
        if 1.9 <= ar <= 8.5 and 0.12 <= h_frac <= 0.55 and w_frac >= 0.30 and hull >= min_hull:
            score = (bw * bh) * hull * (1.25 if y < sh * 0.65 else 0.7)
            if best is None or score > best[0]:
                best = (score, x, y, bw, bh)
    if not best:
        return None
    _, x, y, bw, bh = best
    return [x, y, x + bw, y + bh]


def detect_lcd_roi_bbox(img: np.ndarray) -> Optional[List[int]]:
    """Mendeteksi koordinat kotak jendela LCD gelap pada citra meteran/timbangan penuh."""
    if img is None or img.size == 0:
        return None
    h, w = img.shape[:2]
    sw = 640
    sh = max(32, int(sw * h / float(w)))
    small = cv2.resize(img, (sw, sh))
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    # Pass 1: lokalisasi jendela LCD dari latar terang via background normalization
    bg = cv2.GaussianBlur(gray, (101, 101), 0)
    norm_dark = cv2.subtract(bg, gray)
    _, th = cv2.threshold(norm_dark, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, np.ones((9, 25), np.uint8))
    th = cv2.morphologyEx(th, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    box_s = _pick_best_lcd_contour(cnts, sw, sh, min_hull=0.60)

    # Pass 2: cadangan threshold lokal lebih ketat untuk foto berkabut / bayangan jari
    if box_s is None:
        ada = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 61, 12)
        ada = cv2.morphologyEx(ada, cv2.MORPH_CLOSE, np.ones((11, 29), np.uint8))
        ada = cv2.morphologyEx(ada, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        cnts2, _ = cv2.findContours(ada, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        box_s = _pick_best_lcd_contour(cnts2, sw, sh, min_hull=0.55)

    if box_s is None:
        return None
    sx, sy = w / float(sw), h / float(sh)
    return [
        max(0, int(box_s[0] * sx)),
        max(0, int(box_s[1] * sy)),
        min(w, int(box_s[2] * sx)),
        min(h, int(box_s[3] * sy)),
    ]


def clean_and_rebuild_train_dataset(
    dataset_latih_dir: str, new_scale_count: int = 400, warehouse_count: int = 200
) -> Dict[str, Any]:
    """Membersihkan citra bocor di 01_latih dan membangun manifes & labels.csv baru."""
    manifest_p = os.path.join(dataset_latih_dir, "manifest.json")
    labels_p = os.path.join(dataset_latih_dir, "labels.csv")
    img_dir = os.path.join(dataset_latih_dir, "images")

    with open(manifest_p, "r", encoding="utf-8") as f:
        old_items = json.load(f)

    removed_leaked = 0
    kept_items: List[Dict[str, Any]] = []
    roi_found = 0
    sacha_count = 0

    for it in old_items:
        src = it.get("source", "")
        fname = it.get("filename", "")
        if src in ("scale_synthetic_timbangan", "scale_train_synthetic", "scale_train_warehouse") or fname.startswith(("scale_syn_", "scale_train_", "scale_wh_")):
            leaked_fp = os.path.join(img_dir, fname)
            if os.path.exists(leaked_fp):
                os.remove(leaked_fp)
            if src == "scale_synthetic_timbangan" or fname.startswith("scale_syn_"):
                removed_leaked += 1
            continue

        if src == "sachaizadi_real":
            sacha_count += 1
            if not it.get("roi_bbox"):
                fp = os.path.join(img_dir, fname)
                img = cv2.imread(fp)
                bbox = detect_lcd_roi_bbox(img)
                if bbox:
                    it["roi_bbox"] = bbox
                    roi_found += 1
            else:
                roi_found += 1

        kept_items.append(it)

    # Bersihkan sisa generate_disjoint lama bila pernah dijalankan ulang
    for fn in os.listdir(img_dir):
        if fn.startswith(("scale_train_", "scale_wh_")):
            os.remove(os.path.join(img_dir, fn))

    new_items = generate_disjoint_train_corpus(img_dir, count=new_scale_count, seed=20261122)
    wh_items = generate_warehouse_bezel_corpus(img_dir, count=warehouse_count, seed=20261123)
    unified = new_items + wh_items + kept_items

    with open(manifest_p, "w", encoding="utf-8") as f:
        json.dump(unified, f, indent=2, ensure_ascii=False)

    fieldnames = ["id", "source", "filename", "label", "display_type", "total_slots", "roi_bbox", "notes"]
    with open(labels_p, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in unified:
            writer.writerow({k: item.get(k, "") for k in fieldnames})

    return {
        "removed_leaked": removed_leaked,
        "added_disjoint_scales": len(new_items),
        "added_warehouse_scales": len(wh_items),
        "sacha_total": sacha_count,
        "sacha_with_roi": roi_found,
        "total_train": len(unified),
    }


if __name__ == "__main__":
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
    p01 = os.path.join(root, "dataset", "01_latih")
    target = p01 if os.path.exists(p01) else os.path.join(root, "dataset", "dataset_latih")
    stats = clean_and_rebuild_train_dataset(target)
    print("Clean train dataset summary:", json.dumps(stats, indent=2))
