"""Analisis Kurva Risk-Coverage dan Metrik AURC (Geifman & El-Yaniv, 2017).

Menghitung pertukaran antara cakupan otomatisasi (Coverage) dan risiko kesalahan (Risk),
serta mencari ambang batas keyakinan terkunci yang memenuhi target batas kesalahan senyap.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np


class RiskCoverageAnalyzer:
    """Menganalisis kurva risiko-cakupan dan menghitung luas di bawah kurva (AURC)."""

    def compute_curve(
        self, confidences: List[float], correctness: List[int], sample_step: int = 5
    ) -> Tuple[float, List[Dict]]:
        """Menghitung koordinat kurva Risk-Coverage dan nilai AURC.

        Args:
            confidences: Nilai keyakinan (bisa raw atau terkalibrasi)
            correctness: 1 jika prediksi benar, 0 jika salah
            sample_step: Langkah reduksi titik untuk efisiensi rendering antarmuka

        Returns:
            Tuple[aurc, curve_points]
        """
        if not confidences or len(confidences) != len(correctness):
            return 0.0, []

        n = len(confidences)
        scores = np.array(confidences, dtype=np.float64)
        corr = np.array(correctness, dtype=np.int32)

        # Urutkan berdasarkan skor secara menurun (descending)
        sort_indices = np.argsort(-scores)
        sorted_corr = corr[sort_indices]
        sorted_scores = scores[sort_indices]

        # Hitung kumulatif kesalahan
        cumulative_errors = np.cumsum(1 - sorted_corr)
        k_indices = np.arange(1, n + 1)

        # Risiko selektif pada setiap titik k: r(k/n) = errors / k
        selective_risks = cumulative_errors / k_indices
        coverages = k_indices / float(n)

        # Hitung AURC: rata-rata risiko pada seluruh tingkat coverage
        aurc = float(np.mean(selective_risks))

        curve_points = []
        for i in range(0, n, max(1, sample_step)):
            curve_points.append({
                "k": int(k_indices[i]),
                "coverage": round(float(coverages[i]), 4),
                "risk": round(float(selective_risks[i]), 4),
                "selective_accuracy": round(float(1.0 - selective_risks[i]), 4),
                "threshold": round(float(sorted_scores[i]), 4),
            })

        # Pastikan titik akhir (coverage 1.0) selalu ada
        if n > 0 and (n - 1) % sample_step != 0:
            curve_points.append({
                "k": n,
                "coverage": 1.0,
                "risk": round(float(selective_risks[-1]), 4),
                "selective_accuracy": round(float(1.0 - selective_risks[-1]), 4),
                "threshold": round(float(sorted_scores[-1]), 4),
            })

        return round(aurc, 4), curve_points

    def find_operating_threshold(
        self,
        confidences: List[float],
        correctness: List[int],
        max_silent_error: float = 0.01,
        min_coverage: float = 0.50,
    ) -> Dict:
        """Mencari ambang batas terendah dengan risk <= max_silent_error dan coverage >= min_coverage.

        Jika target risiko tidak tercapai pada cakupan minimal, fallback ke titik dengan
        cakupan >= min_coverage yang memiliki risiko terkecil.
        """
        aurc, points = self.compute_curve(confidences, correctness, sample_step=1)
        if not points:
            return {
                "recommended_threshold": 0.85,
                "achieved_coverage": 0.0,
                "expected_risk": 0.0,
                "selective_accuracy": 1.0,
                "aurc": aurc,
                "policy_note": "empty_points",
            }

        eligible = [p for p in points if p["coverage"] >= min_coverage]
        pool = eligible if eligible else points

        best_point: Optional[Dict] = None
        note = "target_met"
        for pt in pool:
            if pt["risk"] <= max_silent_error:
                if best_point is None or pt["coverage"] > best_point["coverage"]:
                    best_point = pt

        if best_point is None:
            # Fallback: pilih risiko terendah pada coverage >= min_coverage (memecah seri dengan coverage terbesar)
            best_point = min(pool, key=lambda p: (p["risk"], -p["coverage"]))
            note = "min_risk_at_min_coverage"

        return {
            "recommended_threshold": best_point["threshold"],
            "achieved_coverage": best_point["coverage"],
            "expected_risk": best_point["risk"],
            "selective_accuracy": best_point.get("selective_accuracy", 1.0),
            "aurc": aurc,
            "policy_note": note,
        }
