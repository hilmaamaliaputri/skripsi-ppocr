"""Modul Optimasi Penskalaan Suhu dan ECE (Guo dkk., 2017).

Mengoptimalkan parameter suhu T pada data kalibrasi terpisah dan mengukur ECE.
"""

from typing import Dict, List, Tuple
import numpy as np
from scipy.optimize import minimize_scalar


class CalibrationOptimizer:
    """Mengoptimalkan parameter suhu tunggal T untuk Temperature Scaling."""

    @staticmethod
    def _logits_from_probs(probs: np.ndarray) -> np.ndarray:
        """Mengonversi probabilitas ke logit numerik stabil."""
        p_clipped = np.clip(probs, 1e-6, 1.0 - 1e-6)
        return np.log(p_clipped / (1.0 - p_clipped))

    @staticmethod
    def _scale(logits: np.ndarray, temp: float) -> np.ndarray:
        """Sigmoid(logit / temp)."""
        scaled = logits / max(temp, 1e-4)
        return 1.0 / (1.0 + np.exp(-scaled))

    def fit_temperature(
        self, confidences: List[float], labels: List[int]
    ) -> float:
        """Mencari suhu T* yang meminimalkan Negative Log-Likelihood (NLL).

        Args:
            confidences: Daftar confidence mentah (0.0 - 1.0)
            labels: 1 jika bacaan benar (exact match), 0 jika salah
        Returns:
            Nilai suhu optimal T*
        """
        probs = np.array(confidences, dtype=np.float64)
        y = np.array(labels, dtype=np.float64)
        logits = self._logits_from_probs(probs)

        def nll_objective(temp: float) -> float:
            p_scaled = self._scale(logits, temp)
            p_scaled = np.clip(p_scaled, 1e-6, 1.0 - 1e-6)
            loss = -np.mean(y * np.log(p_scaled) + (1.0 - y) * np.log(1.0 - p_scaled))
            return float(loss)

        # Optimasi scalar pada rentang T in [0.05, 10.0]
        res = minimize_scalar(nll_objective, bounds=(0.05, 10.0), method="bounded")
        opt_temp = float(res.x) if res.success else 1.0
        return round(opt_temp, 4)

    def calculate_ece(
        self, confidences: List[float], labels: List[int], n_bins: int = 10
    ) -> Tuple[float, List[Dict]]:
        """Menghitung Expected Calibration Error (ECE) dan data diagram reliabilitas."""
        probs = np.array(confidences, dtype=np.float64)
        y = np.array(labels, dtype=np.float64)
        bin_limits = np.linspace(0.0, 1.0, n_bins + 1)

        ece = 0.0
        total_samples = len(probs)
        reliability_bins = []

        for i in range(n_bins):
            b_min, b_max = bin_limits[i], bin_limits[i + 1]
            mask = (probs >= b_min) & (probs <= b_max if i == n_bins - 1 else probs < b_max)
            bin_size = int(np.sum(mask))

            if bin_size > 0:
                bin_acc = float(np.mean(y[mask]))
                bin_conf = float(np.mean(probs[mask]))
                diff = abs(bin_acc - bin_conf)
                ece += (bin_size / total_samples) * diff

                reliability_bins.append({
                    "bin_index": i,
                    "bin_range": [round(b_min, 2), round(b_max, 2)],
                    "count": bin_size,
                    "accuracy": round(bin_acc, 4),
                    "confidence": round(bin_conf, 4),
                    "gap": round(diff, 4),
                })
            else:
                reliability_bins.append({
                    "bin_index": i,
                    "bin_range": [round(b_min, 2), round(b_max, 2)],
                    "count": 0,
                    "accuracy": 0.0,
                    "confidence": round((b_min + b_max) / 2.0, 4),
                    "gap": 0.0,
                })

        return round(float(ece), 4), reliability_bins
