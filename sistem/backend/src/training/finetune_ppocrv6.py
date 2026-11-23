"""Pipeline Fine-Tuning End-to-End PP-OCRv6 Tiny pada Dataset Latih 7-Segmen Bersih (01_latih)."""

import json
import math
import os
import sys
import time
from typing import Any, Dict, List, Tuple
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import yaml

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.training.dataset import CTCLabelConverter, crnn_collate_fn
from src.training.onnx_to_torch import DIGIT_DICT, TrainableOnnxBackbone
from src.training.train_crnn import collect_training_samples, compute_cer


def _augment_bgr(img: np.ndarray) -> np.ndarray:
    """Augmentasi ringan realistis pada citra BGR timbangan (rotasi, pencahayaan, blur)."""
    if np.random.rand() > 0.50:
        ang = float(np.random.uniform(-10.0, 10.0))
        ih, iw = img.shape[:2]
        mat = cv2.getRotationMatrix2D((iw / 2.0, ih / 2.0), ang, 1.0)
        img = cv2.warpAffine(img, mat, (iw, ih), borderMode=cv2.BORDER_REPLICATE)
    if np.random.rand() > 0.45:
        alpha = float(np.random.uniform(0.75, 1.25))
        beta = float(np.random.uniform(-22.0, 22.0))
        img = np.clip(alpha * img.astype(np.float32) + beta, 0, 255).astype(np.uint8)
    if np.random.rand() > 0.80:
        img = cv2.GaussianBlur(img, (3, 3), 0.7)
    return img


class PPOCRv6FineTuneDataset(Dataset):
    """Dataset citra BGR 48x320 sesuai standar RecResizeImg PP-OCRv6."""

    def __init__(self, samples: List[Dict[str, Any]], is_training: bool = True, target_h: int = 48, base_w: int = 320):
        self.is_training = is_training
        self.target_h = target_h
        self.base_w = base_w
        self._cache: List[Tuple[np.ndarray, torch.Tensor, int, str]] = []
        for item in samples:
            img = cv2.imread(item["image_path"]) if os.path.exists(item["image_path"]) else None
            if img is not None and item.get("roi_bbox"):
                x1, y1, x2, y2 = item["roi_bbox"]
                if int(y2) > int(y1) and int(x2) > int(x1):
                    img = img[int(y1):int(y2), int(x1):int(x2)]
            if img is None or img.size == 0:
                img = np.full((target_h, 160, 3), 128, dtype=np.uint8)
            elif img.shape[1] > base_w or img.shape[0] > 96:
                scale = min(base_w / float(img.shape[1]), 96.0 / float(img.shape[0]))
                img = cv2.resize(img, (max(8, int(img.shape[1] * scale)), max(8, int(img.shape[0] * scale))), interpolation=cv2.INTER_AREA)

            label = str(item["label"])
            encoded = CTCLabelConverter.encode(label)
            self._cache.append((img, torch.tensor(encoded, dtype=torch.long), len(encoded), label))

    def __len__(self) -> int:
        return len(self._cache)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, int, str]:
        img, target_tensor, target_len, label = self._cache[idx]
        img = _augment_bgr(img.copy()) if self.is_training else img
        h, w = img.shape[:2]
        wh_ratio = max(1e-3, w / float(max(1, h)))
        resized_w = min(self.base_w, max(8, int(math.ceil(self.target_h * wh_ratio))))
        resized = cv2.resize(img, (resized_w, self.target_h)).astype(np.float32)
        normalized = (resized / 255.0 - 0.5) / 0.5
        padded = np.zeros((3, self.target_h, self.base_w), dtype=np.float32)
        padded[:, :, :resized_w] = np.transpose(normalized, (2, 0, 1))
        return torch.from_numpy(padded), target_tensor, target_len, label


class ExportWrapper(nn.Module):
    """Menjamin ekspor ONNX menghasilkan probabilitas Softmax (B, T, 12)."""

    def __init__(self, backbone: TrainableOnnxBackbone):
        super().__init__()
        self.backbone = backbone

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x, return_probs=True)


def _evaluate_val(model: TrainableOnnxBackbone, loader: DataLoader, criterion: nn.CTCLoss) -> Tuple[float, float, float]:
    model.eval()
    correct_seq, total_seq, total_cer, total_loss = 0, 0, 0.0, 0.0
    with torch.no_grad():
        for batch in loader:
            logits = model(batch["images"], return_probs=False)
            log_probs = F.log_softmax(logits.permute(1, 0, 2), dim=-1)
            t_steps, b_size, _ = log_probs.size()
            in_len = torch.full(size=(b_size,), fill_value=t_steps, dtype=torch.long)
            total_loss += criterion(log_probs, batch["targets"], in_len, batch["target_lengths"]).item()
            for b in range(b_size):
                pred_str, _ = CTCLabelConverter.decode_greedy(log_probs[:, b, :])
                gt_str = batch["raw_texts"][b]
                correct_seq += int(pred_str == gt_str)
                total_cer += compute_cer(gt_str, pred_str)
                total_seq += 1
    denom = max(1, total_seq)
    return total_loss / max(1, len(loader)), (correct_seq / denom) * 100.0, (total_cer / denom) * 100.0


def finetune_ppocrv6_tiny(epochs: int = 35, batch_size: int = 32, patience: int = 10) -> str:
    """Menjalankan fine-tuning end-to-end PP-OCRv6 Tiny dan mengekspor ONNX + YAML."""
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    src_onnx = os.path.expanduser("~/.paddlex/official_models/PP-OCRv6_tiny_rec_onnx/inference.onnx")
    out_dir = os.path.join(backend_dir, "weights", "ppocrv6_tiny_ft")
    config_dir = os.path.join(backend_dir, "config")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(config_dir, exist_ok=True)

    train_samples, val_samples = collect_training_samples(backend_dir)
    train_loader = DataLoader(PPOCRv6FineTuneDataset(train_samples, is_training=True), batch_size=batch_size, shuffle=True, collate_fn=crnn_collate_fn)
    val_loader = DataLoader(PPOCRv6FineTuneDataset(val_samples, is_training=False), batch_size=batch_size, shuffle=False, collate_fn=crnn_collate_fn)

    model = TrainableOnnxBackbone(src_onnx)
    criterion = nn.CTCLoss(blank=0, zero_infinity=True)

    head_params = [p for n, p in model.named_parameters() if n.startswith("head_") or "linear_0" in n]
    backbone_params = [p for n, p in model.named_parameters() if not (n.startswith("head_") or "linear_0" in n)]
    optimizer = optim.AdamW([
        {"params": backbone_params, "lr": 2e-4},
        {"params": head_params, "lr": 1e-3},
    ], weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    val0_loss, val0_fsr, val0_cer = _evaluate_val(model, val_loader, criterion)
    print(f"[Epoch 00 Pretrained Head-Slice] ValLoss={val0_loss:.4f} | Val FSR={val0_fsr:.2f}% | Val CER={val0_cer:.2f}%", flush=True)

    best_score, best_epoch = (val0_fsr, -val0_cer), 0
    best_val_fsr, best_val_cer, no_improve = round(val0_fsr, 2), round(val0_cer, 2), 0
    best_pth = os.path.join(out_dir, "ppocrv6_tiny_ft_best.pth")
    torch.save(model.state_dict(), best_pth)
    history: List[Dict[str, Any]] = []

    for epoch in range(1, epochs + 1):
        t0 = time.perf_counter()
        model.train()
        total_loss = 0.0
        for batch in train_loader:
            optimizer.zero_grad()
            logits = model(batch["images"], return_probs=False)
            log_probs = F.log_softmax(logits.permute(1, 0, 2), dim=-1)
            t_steps, b_size, _ = log_probs.size()
            in_len = torch.full(size=(b_size,), fill_value=t_steps, dtype=torch.long)
            loss = criterion(log_probs, batch["targets"], in_len, batch["target_lengths"])
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
            optimizer.step()
            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / max(1, len(train_loader))
        val_loss, val_fsr, val_cer = _evaluate_val(model, val_loader, criterion)
        elapsed = time.perf_counter() - t0
        history.append({
            "epoch": epoch,
            "train_loss": round(avg_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_fsr": round(val_fsr, 2),
            "val_cer": round(val_cer, 2),
            "lr_head": round(float(optimizer.param_groups[1]["lr"]), 6),
        })
        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] ({elapsed:.1f}s) TrainLoss={avg_loss:.4f} | ValLoss={val_loss:.4f} | Val FSR={val_fsr:.2f}% | Val CER={val_cer:.2f}%",
            flush=True,
        )

        if (val_fsr, -val_cer) > best_score:
            best_score, best_epoch = (val_fsr, -val_cer), epoch
            best_val_fsr, best_val_cer, no_improve = round(val_fsr, 2), round(val_cer, 2), 0
            torch.save(model.state_dict(), best_pth)
        else:
            no_improve += 1
            if no_improve >= patience and epoch >= 15:
                print(f"[EarlyStopping] Konvergen di epoch {epoch} (best={best_epoch}, Val FSR={best_val_fsr}%)", flush=True)
                break

    hist_p = os.path.join(config_dir, "ppocrv6_tiny_ft_history.json")
    with open(hist_p, "w", encoding="utf-8") as hf:
        json.dump({
            "model": "ppocrv6_tiny_ft",
            "epochs_ran": len(history),
            "max_epochs": epochs,
            "best_epoch": best_epoch,
            "best_val_fsr": best_val_fsr,
            "best_val_cer": best_val_cer,
            "train_samples": len(train_samples),
            "val_samples": len(val_samples),
            "history": history,
        }, hf, indent=2)

    model.load_state_dict(torch.load(best_pth, map_location="cpu"))
    model.eval()
    exporter = ExportWrapper(model).eval()
    onnx_out = os.path.join(out_dir, "inference.onnx")
    dummy_in = torch.randn(1, 3, 48, 320)
    torch.onnx.export(
        exporter, dummy_in, onnx_out, export_params=True, opset_version=14,
        do_constant_folding=True, input_names=["x"], output_names=["fetch_name_0"],
        dynamic_axes={"x": {0: "batch", 3: "width"}, "fetch_name_0": {0: "batch", 1: "seq_len"}},
    )
    yml_out = os.path.join(out_dir, "inference.yml")
    with open(yml_out, "w", encoding="utf-8") as yf:
        yaml.safe_dump({"PostProcess": {"character_dict": DIGIT_DICT}}, yf)
    print(f"[DONE] Fine-tuned PP-OCRv6 Tiny tersimpan ke {onnx_out} (Best Ep={best_epoch}, Val FSR={best_val_fsr}%)", flush=True)
    return onnx_out


if __name__ == "__main__":
    finetune_ppocrv6_tiny(epochs=35, batch_size=32, patience=10)
