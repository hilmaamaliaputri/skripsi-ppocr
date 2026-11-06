"""Verifikasi Lapis 4: Uji Keyakinan Terkalibrasi (v_calibration.py).

Menerapkan Temperature Scaling dan seleksi ambang batas keyakinan (Selective Classification).
Mengacu pada spesifikasi arsitektur Bab V.
"""

from typing import Tuple
import numpy as np
from ..pipeline.schema import LayerResult


class CalibrationVerifier:
    """Melakukan penskalaan suhu dan evaluasi terhadap ambang keyakinan terkunci."""

    def __init__(self, temperature: float = 1.0, threshold: float = 0.85):
        # Suhu T > 0. Nilai T > 1.0 meredam overconfidence model.
        self.temperature = max(1e-4, float(temperature))
        self.threshold = float(threshold)

    def scale_confidence(self, raw_score: float) -> float:
        """Mengubah skor keyakinan mentah menjadi skor terkalibrasi melalui Temperature Scaling."""
        # Menghindari pembagian nol atau log tak terhingga
        p = np.clip(raw_score, 1e-6, 1.0 - 1e-6)
        # Logit z
        logit = np.log(p / (1.0 - p))
        # Penskalaan suhu z / T
        scaled_logit = logit / self.temperature
        # Sigmoid
        calibrated_p = 1.0 / (1.0 + np.exp(-scaled_logit))
        return float(np.clip(calibrated_p, 0.0, 1.0))

    def verify(self, raw_score: float) -> Tuple[bool, LayerResult, float]:
        """Mengevaluasi skor keyakinan terhadap ambang batas terkunci.

        Returns:
            Tuple[is_passed, layer_result, calibrated_score]
        """
        calibrated_score = self.scale_confidence(raw_score)
        passed = calibrated_score >= self.threshold

        if passed:
            reason = (
                f"Skor terkalibrasi {calibrated_score:.4f} memenuhi ambang batas {self.threshold:.4f}"
            )
        else:
            reason = (
                f"Skor terkalibrasi {calibrated_score:.4f} di bawah ambang batas {self.threshold:.4f} "
                "(keyakinan rendah akibat refleksi atau buram)"
            )

        layer_res = LayerResult(
            layer_id="L4",
            passed=passed,
            reason=reason,
            details={
                "raw_score": round(raw_score, 4),
                "calibrated_score": round(calibrated_score, 4),
                "temperature": round(self.temperature, 4),
                "threshold": round(self.threshold, 4),
            },
        )
        return passed, layer_res, calibrated_score
