"""Pipeline Pelatihan CRNN-CTC & Ekspor Otomatis ke Format ONNX.

Menjalankan:
1. Pemuatan dataset latih & validasi dari kalibrasi/sintetis (menjaga test set tetap terkunci)
2. Loop pelatihan dengan PyTorch CTCLoss & optimizer AdamW + Cosine Annealing
3. Evaluasi metrik FSR & CER pada validation set
4. Penyimpanan bobot terbaik (crnn_best.pth)
5. Ekspor otomatis ke ONNX (crnn_ctc.onnx) untuk inferensi native di backend FastAPI
"""

import os
import sys
import json
import time
import glob
import numpy as np

# Pastikan root backend ada dalam sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from typing import List, Dict, Any, Tuple

from src.training.crnn_model import CRNN, NUM_CLASSES
from src.training.dataset import ScaleDataset, crnn_collate_fn, CTCLabelConverter
from src.training.segment_synth import render_scale_display
import cv2


def generate_synthetic_corpus(output_dir: str, count: int = 1200) -> List[Dict[str, Any]]:
    """Hasilkan korpus citra 7-segmen acak dengan segmen hantu untuk memperkuat model."""
    os.makedirs(output_dir, exist_ok=True)
    samples: List[Dict[str, Any]] = []

    # Ragam pola timbangan realistis (desimal dan integer)
    for i in range(count):
        # 75% angka dengan desimal, 25% angka bulat
        if np.random.rand() > 0.25:
            val = round(np.random.uniform(0.1, 150.0), np.random.choice([1, 2]))
            label = f"{val:.2f}" if np.random.rand() > 0.3 else f"{val:.1f}"
        else:
            val = int(np.random.uniform(0, 500))
            label = str(val)

        theme = "lcd" if np.random.rand() > 0.4 else "led"
        slots = np.random.choice([5, 6])
        img = render_scale_display(label, total_slots=slots, theme=theme)

        img_path = os.path.join(output_dir, f"synth_{i:04d}.png")
        cv2.imwrite(img_path, img)
        samples.append({"image_path": img_path, "label": label, "roi_bbox": None})

    return samples


def collect_training_samples(base_dir: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Kumpulkan dataset latih dan validasi (Test set 120 folder tetap terkunci)."""
    samples: List[Dict[str, Any]] = []
    synthetic_dir = os.path.join(base_dir, "data", "synthetic")

    # Ambil folder sampel sintetis
    folder_paths = sorted(glob.glob(os.path.join(synthetic_dir, "scale_syn_*")))

    # Sesuai aturan akademik: 80 folder pertama untuk latih/validasi, sisa untuk evaluasi
    train_folders = folder_paths[:80]

    for fld in train_folders:
        meta_file = os.path.join(fld, "metadata.json")
        if not os.path.exists(meta_file):
            continue

        try:
            with open(meta_file, "r", encoding="utf-8") as f:
                meta = json.load(f)
            label = str(meta.get("ground_truth", ""))
            roi_bbox = meta.get("roi_bbox")
        except Exception:
            continue

        # Ambil setiap frame (frame_01.jpg s.d. frame_05.jpg)
        for frame_file in sorted(glob.glob(os.path.join(fld, "frame_*.jpg"))):
            samples.append({"image_path": frame_file, "label": label, "roi_bbox": roi_bbox})

    # Tambahkan korpus sintetis 7-segmen yang mencakup ghost segments
    synth_cache_dir = os.path.join(base_dir, "data", "train_synth")
    synth_samples = generate_synthetic_corpus(synth_cache_dir, count=1200)
    samples.extend(synth_samples)

    # Shuffle dan split: 85% train, 15% validation
    np.random.seed(42)
    np.random.shuffle(samples)

    split_idx = int(len(samples) * 0.85)
    train_samples = samples[:split_idx]
    val_samples = samples[split_idx:]

    print(f"[Dataset] Terkumpul: {len(train_samples)} sampel latih, {len(val_samples)} sampel validasi.")
    return train_samples, val_samples


def compute_cer(gt: str, pred: str) -> float:
    """Hitung Character Error Rate (Levenshtein Distance) sederhana."""
    if gt == pred:
        return 0.0
    # Levenshtein distance matrix
    m, n = len(gt), len(pred)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if gt[i - 1] == pred[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return dp[m][n] / max(1, m)


def train_crnn_pipeline(
    epochs: int = 30,
    batch_size: int = 32,
    lr: float = 1e-3,
    output_dir: str = "weights",
):
    """Jalankan siklus pelatihan lengkap model CRNN-CTC."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    weights_dir = os.path.join(base_dir, output_dir)
    os.makedirs(weights_dir, exist_ok=True)

    train_samples, val_samples = collect_training_samples(base_dir)

    train_dataset = ScaleDataset(train_samples, is_training=True)
    val_dataset = ScaleDataset(val_samples, is_training=False)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        collate_fn=crnn_collate_fn,
        num_workers=0,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=crnn_collate_fn,
        num_workers=0,
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Device] Menggunakan: {device}")

    model = CRNN(num_classes=NUM_CLASSES).to(device)
    criterion = nn.CTCLoss(blank=0, zero_infinity=True)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_fsr = 0.0
    best_weights_path = os.path.join(weights_dir, "crnn_best.pth")
    onnx_path = os.path.join(weights_dir, "crnn_ctc.onnx")

    print("\n" + "=" * 60)
    print(f"MEMULAI PELATIHAN CRNN-CTC ({epochs} EPOCH)")
    print("=" * 60)

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0

        for batch in train_loader:
            images = batch["images"].to(device)
            targets = batch["targets"].to(device)
            target_lengths = batch["target_lengths"].to(device)

            optimizer.zero_grad()

            # Output model: (T, B, num_classes)
            log_probs = model(images)
            T, B, _ = log_probs.size()
            input_lengths = torch.full(size=(B,), fill_value=T, dtype=torch.long, device=device)

            loss = criterion(log_probs, targets, input_lengths, target_lengths)
            loss.backward()

            nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
            optimizer.step()
            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / max(1, len(train_loader))

        # Evaluasi Validasi
        model.eval()
        correct_sequences = 0
        total_sequences = 0
        total_cer = 0.0

        with torch.no_grad():
            for batch in val_loader:
                images = batch["images"].to(device)
                raw_texts = batch["raw_texts"]

                log_probs = model(images)  # (T, B, num_classes)
                T, B, _ = log_probs.size()

                for b in range(B):
                    sample_log_probs = log_probs[:, b, :]
                    pred_str, _ = CTCLabelConverter.decode_greedy(sample_log_probs)
                    gt_str = raw_texts[b]

                    if pred_str == gt_str:
                        correct_sequences += 1
                    total_cer += compute_cer(gt_str, pred_str)
                    total_sequences += 1

        val_fsr = (correct_sequences / max(1, total_sequences)) * 100.0
        val_cer = (total_cer / max(1, total_sequences)) * 100.0

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] "
            f"Loss: {avg_loss:.4f} | "
            f"Val FSR: {val_fsr:.1f}% | "
            f"Val CER: {val_cer:.2f}%"
        )

        if val_fsr >= best_fsr:
            best_fsr = val_fsr
            torch.save(model.state_dict(), best_weights_path)

    print("\n" + "=" * 60)
    print(f"PELATIHAN SELESAI! Best Validation FSR: {best_fsr:.1f}%")
    print(f"Bobot disimpan di: {best_weights_path}")
    print("=" * 60)

    # Ekspor ke ONNX
    print(f"[ONNX] Mengekspor model terbaik ke: {onnx_path}...")
    model.load_state_dict(torch.load(best_weights_path, map_location="cpu"))
    model.eval()
    dummy_input = torch.randn(1, 1, 32, 128, device="cpu")

    torch.onnx.export(
        model.to("cpu"),
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {1: "batch_size"}},
    )
    print("[ONNX] Ekspor ONNX berhasil!")
    return onnx_path


if __name__ == "__main__":
    train_crnn_pipeline(epochs=25, batch_size=32, lr=1e-3)
