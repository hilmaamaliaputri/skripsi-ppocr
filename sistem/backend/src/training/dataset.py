"""Dataset Loader & CTC Label Converter untuk Timbangan Digital 7-Segmen.

Mendukung:
1. Encoding label string ('24.50') ke sekuens integer token CTC
2. Decoding greedy CTC (Argmax collapse) kembali ke string representasi timbangan
3. Preprocessing citra grayscale normalisasi [-1.0, 1.0] dengan dimensi baku (32 x 128)
"""

import os
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset
from typing import List, Tuple, Dict, Any, Optional

VOCAB: List[str] = ["<BLANK>", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]
CHAR2IDX: Dict[str, int] = {c: i for i, c in enumerate(VOCAB)}
IDX2CHAR: Dict[int, str] = {i: c for i, c in enumerate(VOCAB)}


class CTCLabelConverter:
    """Konverter representasi string ke integer target CTC dan sebaliknya."""

    @staticmethod
    def encode(text: str) -> List[int]:
        """Ubah string bobot timbangan ke daftar integer."""
        tokens: List[int] = []
        for ch in text.strip():
            if ch in CHAR2IDX and ch != "<BLANK>":
                tokens.append(CHAR2IDX[ch])
            elif ch == ",":
                tokens.append(CHAR2IDX["."])
        return tokens

    @staticmethod
    def decode_greedy(preds: torch.Tensor) -> Tuple[str, float]:
        """Greedy CTC decoder (mengambil argmax, collapse duplikat, dan buang blank).
        Args:
            preds: Tensor log-probabilitas (T, num_classes)
        Returns:
            Tuple[str_hasil, skor_rata_rata]
        """
        probs = torch.softmax(preds, dim=-1)
        max_probs, max_indices = torch.max(probs, dim=-1)

        raw_indices = max_indices.detach().cpu().numpy()
        token_probs = max_probs.detach().cpu().numpy()

        res_tokens: List[str] = []
        res_scores: List[float] = []
        prev_idx = -1

        for idx, p in zip(raw_indices, token_probs):
            if idx != prev_idx:
                if idx != 0 and idx in IDX2CHAR:  # 0 adalah Blank
                    res_tokens.append(IDX2CHAR[idx])
                    res_scores.append(float(p))
            prev_idx = idx

        decoded_text = "".join(res_tokens)
        mean_score = float(np.mean(res_scores)) if len(res_scores) > 0 else 0.0
        return decoded_text, mean_score


class ScaleDataset(Dataset):
    """PyTorch Dataset untuk citra crop display timbangan digital."""

    def __init__(
        self,
        samples: List[Dict[str, Any]],
        target_size: Tuple[int, int] = (128, 32),  # (Width, Height)
        is_training: bool = True,
    ):
        self.samples = samples
        self.width, self.height = target_size
        self.is_training = is_training

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, int, str]:
        item = self.samples[idx]
        img_path = item["image_path"]
        text_label = str(item["label"])

        # Baca citra grayscale
        if os.path.exists(img_path):
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            roi_bbox = item.get("roi_bbox")
            if roi_bbox and img is not None:
                x1, y1, x2, y2 = roi_bbox
                if int(y2) > int(y1) and int(x2) > int(x1):
                    img = img[int(y1):int(y2), int(x1):int(x2)]
        else:
            img = np.full((self.height, self.width), 128, dtype=np.uint8)

        if img is None or img.size == 0:
            img = np.full((self.height, self.width), 128, dtype=np.uint8)

        # Augmentasi ringan saat pelatihan (jitter kecerahan, blur, dan inversi polaritas)
        if self.is_training:
            if np.random.rand() > 0.5:
                alpha = np.random.uniform(0.8, 1.2)
                beta = np.random.uniform(-15, 15)
                img = np.clip(alpha * img + beta, 0, 255).astype(np.uint8)
            if np.random.rand() > 0.8:
                img = cv2.GaussianBlur(img, (3, 3), 0.5)

        # Resize ke dimensi baku CRNN (32 x 128)
        img_resized = cv2.resize(img, (self.width, self.height), interpolation=cv2.INTER_LINEAR)

        # Normalisasi ke [-1.0, 1.0]
        img_norm = (img_resized.astype(np.float32) / 127.5) - 1.0
        tensor_img = torch.tensor(img_norm).unsqueeze(0)  # (1, 32, 128)

        # Konversi label ke token CTC
        encoded_tokens = CTCLabelConverter.encode(text_label)
        target_tensor = torch.tensor(encoded_tokens, dtype=torch.long)
        target_length = len(encoded_tokens)

        return tensor_img, target_tensor, target_length, text_label


def crnn_collate_fn(batch: List[Tuple[torch.Tensor, torch.Tensor, int, str]]) -> Dict[str, Any]:
    """Collate function untuk menangani panjang target sekuens yang bervariasi."""
    images, targets, lengths, raw_texts = zip(*batch)

    images_tensor = torch.stack(images, dim=0)
    targets_concat = torch.cat(targets, dim=0)
    target_lengths = torch.tensor(lengths, dtype=torch.long)

    return {
        "images": images_tensor,
        "targets": targets_concat,
        "target_lengths": target_lengths,
        "raw_texts": list(raw_texts),
    }
