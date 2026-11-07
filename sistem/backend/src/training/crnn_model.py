"""Arsitektur Model CRNN-CTC Klasik (Shi et al., 2016) untuk Pembacaan Timbangan Digital 7-Segmen.

Pipeline:
1. Convolutional Feature Extractor (VGG-style / MobileNet) -> Ekstraksi fitur visual (B, 512, 1, W')
2. Map-to-Sequence -> Permutasi dimensi spasial horizontal menjadi sekuens waktu (W', B, 512)
3. Bidirectional LSTM (2 Lapis) -> Memodelkan ketergantungan sekuensial antar segmen digit
4. Linear Transcription Head -> Proyeksi probabilitas 12 token karakter (Blank + 0-9 + .)
"""

import torch
import torch.nn as nn
from typing import List

# Kamus karakter 7-segmen: 0 adalah reserved CTC Blank
VOCAB: List[str] = ["<BLANK>", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]
NUM_CLASSES: int = len(VOCAB)  # 12 token


class CRNN(nn.Module):
    def __init__(self, num_classes: int = NUM_CLASSES, in_channels: int = 1, hidden_size: int = 256):
        super(CRNN, self).__init__()

        # 1. CNN Feature Extractor: Input (B, 1, 32, 128) -> Output (B, 512, 1, 32)
        self.cnn = nn.Sequential(
            # Block 1: 32x128 -> 16x64
            nn.Conv2d(in_channels, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 2: 16x64 -> 8x32
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 3: 8x32 -> 4x32 (H dipool, W dipertahankan resolusinya)
            nn.Conv2d(128, 256, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=(2, 1), stride=(2, 1)),

            # Block 4: 4x32 -> 2x32
            nn.Conv2d(256, 512, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=(2, 1), stride=(2, 1)),

            # Block 5: 2x32 -> 1x31
            nn.Conv2d(512, 512, kernel_size=2, stride=1, padding=0),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
        )

        # 2. Recurrent Sequence Modeler: 2-Layer Bidirectional LSTM
        self.rnn = nn.LSTM(
            input_size=512,
            hidden_size=hidden_size,
            num_layers=2,
            bidirectional=True,
            batch_first=False,
            dropout=0.1,
        )

        # 3. Linear Transcription Head
        self.fc = nn.Linear(hidden_size * 2, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass.
        Args:
            x: Tensor citra (B, 1, 32, W)
        Returns:
            Log-probabilitas kelas pada tiap time step (T, B, num_classes)
        """
        # Ekstraksi CNN: (B, 512, 1, W')
        conv = self.cnn(x)
        b, c, h, w = conv.size()
        assert h == 1, f"Tinggi fitur spasial harus 1, namun didapat {h}"

        # Squeeze dimensi H dan permutasi ke sekuens waktu: (W', B, C)
        conv = conv.squeeze(2)  # (B, 512, W')
        conv = conv.permute(2, 0, 1)  # (W', B, 512)

        # Recurrent modeling: (W', B, hidden_size * 2)
        recurrent, _ = self.rnn(conv)

        # Linear classification: (W', B, num_classes)
        logits = self.fc(recurrent)

        # Log Softmax untuk CTCLoss
        log_probs = logits.log_softmax(2)
        return log_probs
