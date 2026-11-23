"""Pipeline Pelatihan CRNN-CTC & Ekspor Otomatis ke Format ONNX."""

import glob
import json
import os
import sys
from typing import Any, Dict, List, Tuple
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.evaluation.metrics import EvaluationMetrics
from src.training.crnn_model import CRNN, NUM_CLASSES
from src.training.dataset import CTCLabelConverter, ScaleDataset, crnn_collate_fn
from src.training.segment_synth import render_scale_display


def generate_synthetic_corpus(output_dir: str, count: int = 1200) -> List[Dict[str, Any]]:
    """Hasilkan korpus citra 7-segmen acak untuk pengayaan latih CRNN."""
    os.makedirs(output_dir, exist_ok=True)
    samples: List[Dict[str, Any]] = []
    for i in range(count):
        if np.random.rand() > 0.25:
            val = round(np.random.uniform(0.1, 150.0), np.random.choice([1, 2]))
            label = f"{val:.2f}" if np.random.rand() > 0.3 else f"{val:.1f}"
        else:
            label = str(int(np.random.uniform(0, 500)))
        theme = "lcd" if np.random.rand() > 0.4 else "led"
        slots = int(np.random.choice([5, 6]))
        img = render_scale_display(label, total_slots=slots, theme=theme)
        img_path = os.path.join(output_dir, f"synth_{i:04d}.png")
        cv2.imwrite(img_path, img)
        samples.append({"image_path": img_path, "label": label, "roi_bbox": None})
    return samples


def collect_training_samples(base_dir: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Kumpulkan dataset latih terpadu bersih dan bagi menjadi train (85%) + val (15%)."""
    samples: List[Dict[str, Any]] = []
    candidates = [
        os.path.abspath(os.path.join(base_dir, "..", "..", "dataset", "01_latih", "manifest.json")),
        os.path.join(base_dir, "data", "dataset_latih", "manifest.json"),
        os.path.abspath(os.path.join(base_dir, "..", "data", "dataset_latih", "manifest.json")),
        os.path.abspath(os.path.join(base_dir, "..", "..", "dataset", "dataset_latih", "manifest.json")),
    ]
    unified_p = next((p for p in candidates if os.path.exists(p)), None)

    if unified_p:
        with open(unified_p, "r", encoding="utf-8") as f:
            manifest_items = json.load(f)
        img_dir = os.path.join(os.path.dirname(unified_p), "images")
        for item in manifest_items:
            img_p = os.path.join(img_dir, item["filename"])
            if os.path.exists(img_p) and item.get("label"):
                samples.append({"image_path": img_p, "label": str(item["label"]), "roi_bbox": item.get("roi_bbox")})
        print(f"[Dataset] Memuat {len(samples)} sampel dari {unified_p}.")
    else:
        synthetic_dir = os.path.join(base_dir, "data", "synthetic")
        for fld in sorted(glob.glob(os.path.join(synthetic_dir, "scale_syn_*")))[:80]:
            meta_file = os.path.join(fld, "metadata.json")
            if not os.path.exists(meta_file):
                continue
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                label, roi_bbox = str(meta.get("ground_truth", "")), meta.get("roi_bbox")
            except Exception:
                continue
            for frame_file in sorted(glob.glob(os.path.join(fld, "frame_*.jpg"))):
                samples.append({"image_path": frame_file, "label": label, "roi_bbox": roi_bbox})
        samples.extend(generate_synthetic_corpus(os.path.join(base_dir, "data", "train_synth"), count=1200))

    np.random.seed(42)
    np.random.shuffle(samples)
    split_idx = int(len(samples) * 0.85)
    print(f"[Dataset] Terkumpul: {split_idx} sampel latih, {len(samples) - split_idx} sampel validasi.")
    return samples[:split_idx], samples[split_idx:]


def compute_cer(gt: str, pred: str) -> float:
    """Hitung Character Error Rate dengan helper Levenshtein terpusat."""
    if gt == pred:
        return 0.0
    return EvaluationMetrics.levenshtein_distance(gt, pred) / max(1, len(gt))


def _evaluate_validation_epoch(
    model: CRNN, val_loader: DataLoader, criterion: nn.CTCLoss, device: torch.device
) -> Tuple[float, float, float]:
    model.eval()
    correct_seq, total_seq, total_cer, total_loss = 0, 0, 0.0, 0.0
    with torch.no_grad():
        for batch in val_loader:
            images = batch["images"].to(device)
            targets = batch["targets"].to(device)
            target_lengths = batch["target_lengths"].to(device)
            raw_texts = batch["raw_texts"]
            log_probs = model(images)
            t_steps, b_size, _ = log_probs.size()
            in_len = torch.full(size=(b_size,), fill_value=t_steps, dtype=torch.long, device=device)
            total_loss += criterion(log_probs, targets, in_len, target_lengths).item()
            for b in range(b_size):
                pred_str, _ = CTCLabelConverter.decode_greedy(log_probs[:, b, :])
                gt_str = raw_texts[b]
                correct_seq += int(pred_str == gt_str)
                total_cer += compute_cer(gt_str, pred_str)
                total_seq += 1
    denom = max(1, total_seq)
    return total_loss / max(1, len(val_loader)), (correct_seq / denom) * 100.0, (total_cer / denom) * 100.0


def _export_onnx_weights(model: CRNN, best_weights_path: str, onnx_path: str) -> None:
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


def train_crnn_pipeline(
    epochs: int = 50,
    batch_size: int = 32,
    lr: float = 1e-3,
    output_dir: str = "weights",
    patience: int = 12,
) -> str:
    """Jalankan siklus pelatihan lengkap CRNN-CTC dan ekspor ONNX."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    weights_dir, config_dir = os.path.join(base_dir, output_dir), os.path.join(base_dir, "config")
    os.makedirs(weights_dir, exist_ok=True)
    os.makedirs(config_dir, exist_ok=True)

    train_samples, val_samples = collect_training_samples(base_dir)
    train_loader = DataLoader(ScaleDataset(train_samples, is_training=True), batch_size=batch_size, shuffle=True, collate_fn=crnn_collate_fn, num_workers=0)
    val_loader = DataLoader(ScaleDataset(val_samples, is_training=False), batch_size=batch_size, shuffle=False, collate_fn=crnn_collate_fn, num_workers=0)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = CRNN(num_classes=NUM_CLASSES).to(device)
    criterion = nn.CTCLoss(blank=0, zero_infinity=True)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_score, best_epoch, best_val_fsr, best_val_cer, no_improve = (-1.0, float("inf")), 1, 0.0, 100.0, 0
    history: List[Dict[str, Any]] = []
    best_weights_path = os.path.join(weights_dir, "crnn_best.pth")
    onnx_path = os.path.join(weights_dir, "crnn_ctc.onnx")
    history_path = os.path.join(config_dir, "crnn_training_history.json")

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        for batch in train_loader:
            images, targets = batch["images"].to(device), batch["targets"].to(device)
            target_lengths = batch["target_lengths"].to(device)
            optimizer.zero_grad()
            log_probs = model(images)
            t_steps, b_size, _ = log_probs.size()
            in_len = torch.full(size=(b_size,), fill_value=t_steps, dtype=torch.long, device=device)
            loss = criterion(log_probs, targets, in_len, target_lengths)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
            optimizer.step()
            total_loss += loss.item()

        current_lr = optimizer.param_groups[0]["lr"]
        scheduler.step()
        avg_loss = total_loss / max(1, len(train_loader))
        val_loss, val_fsr, val_cer = _evaluate_validation_epoch(model, val_loader, criterion, device)
        history.append({
            "epoch": epoch, "train_loss": round(avg_loss, 4), "val_loss": round(val_loss, 4),
            "val_fsr": round(val_fsr, 2), "val_cer": round(val_cer, 2), "lr": round(float(current_lr), 6),
        })
        print(f"Epoch [{epoch:02d}/{epochs:02d}] TrainLoss: {avg_loss:.4f} | ValLoss: {val_loss:.4f} | Val FSR: {val_fsr:.2f}% | Val CER: {val_cer:.2f}%", flush=True)

        if (val_fsr, -val_cer) > best_score:
            best_score, best_epoch = (val_fsr, -val_cer), epoch
            best_val_fsr, best_val_cer, no_improve = round(val_fsr, 2), round(val_cer, 2), 0
            torch.save(model.state_dict(), best_weights_path)
        else:
            no_improve += 1
            if no_improve >= patience and epoch >= 20:
                break

    with open(history_path, "w", encoding="utf-8") as hf:
        json.dump({
            "epochs_ran": len(history), "max_epochs": epochs, "best_epoch": best_epoch,
            "best_val_fsr": best_val_fsr, "best_val_cer": best_val_cer,
            "train_samples": len(train_samples), "val_samples": len(val_samples), "history": history,
        }, hf, indent=2)
    _export_onnx_weights(model, best_weights_path, onnx_path)
    return onnx_path


if __name__ == "__main__":
    train_crnn_pipeline(epochs=50, batch_size=32, lr=1e-3, patience=12)
