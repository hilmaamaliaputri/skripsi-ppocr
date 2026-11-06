"""Kalkulator Metrik Kuantitatif dan Uji Statistik Bootstrap (Bab IV & VI).

Menghitung FSR, CER, Akurasi Desimal, Kesalahan Senyap, Coverage,
serta Interval Kepercayaan 95% via Bootstrap.
"""

from typing import Dict, List, Tuple
import numpy as np


class EvaluationMetrics:
    """Menghitung metrik performa model dan efektivitas verifikasi."""

    @staticmethod
    def levenshtein_distance(s1: str, s2: str) -> int:
        """Menghitung jarak Levenshtein antara dua deret karakter."""
        if len(s1) < len(s2):
            return EvaluationMetrics.levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)

        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        return previous_row[-1]

    @classmethod
    def calculate_model_metrics(
        cls, predictions: List[str], ground_truths: List[str]
    ) -> Dict[str, float]:
        """Menghitung metrik tahap model: FSR, CER, dan Akurasi Desimal."""
        n = len(predictions)
        if n == 0 or n != len(ground_truths):
            return {"fsr": 0.0, "cer": 0.0, "decimal_acc": 0.0, "total_samples": 0}

        exact_matches = 0
        total_edit_distance = 0
        total_target_length = 0
        correct_decimals = 0

        for pred, gt in zip(predictions, ground_truths):
            p_clean = pred.strip()
            g_clean = gt.strip()

            if p_clean == g_clean:
                exact_matches += 1

            total_edit_distance += cls.levenshtein_distance(p_clean, g_clean)
            total_target_length += max(len(g_clean), 1)

            # Evaluasi posisi desimal
            p_dot = p_clean.find(".")
            g_dot = g_clean.find(".")
            if p_dot == g_dot:
                correct_decimals += 1

        fsr = (exact_matches / float(n)) * 100.0
        cer = (total_edit_distance / float(total_target_length)) * 100.0
        decimal_acc = (correct_decimals / float(n)) * 100.0

        return {
            "total_samples": n,
            "fsr": round(fsr, 2),
            "cer": round(cer, 2),
            "decimal_acc": round(decimal_acc, 2),
            "exact_matches": exact_matches,
        }

    @classmethod
    def calculate_verification_metrics(
        cls,
        decisions: List[str],  # TERIMA, TOLAK, KONFIRMASI, BATAL
        predictions: List[str],
        ground_truths: List[str],
    ) -> Dict[str, float]:
        """Menghitung metrik tahap verifikasi: Kesalahan Senyap, Coverage, Selective Accuracy."""
        n = len(decisions)
        if n == 0:
            return {"coverage": 0.0, "silent_error": 0.0, "selective_accuracy": 0.0}

        accepted_count = 0
        silent_error_count = 0
        accepted_correct_count = 0

        for dec, pred, gt in zip(decisions, predictions, ground_truths):
            is_correct = pred.strip() == gt.strip()
            is_accepted = dec == "TERIMA"

            if is_accepted:
                accepted_count += 1
                if is_correct:
                    accepted_correct_count += 1
                else:
                    silent_error_count += 1

        coverage = (accepted_count / float(n)) * 100.0
        silent_error = (silent_error_count / float(n)) * 100.0
        selective_acc = (
            (accepted_correct_count / float(accepted_count) * 100.0)
            if accepted_count > 0
            else 100.0
        )

        return {
            "total_samples": n,
            "coverage": round(coverage, 2),
            "silent_error": round(silent_error, 2),
            "selective_accuracy": round(selective_acc, 2),
            "accepted_count": accepted_count,
            "silent_error_count": silent_error_count,
        }

    @classmethod
    def bootstrap_confidence_interval(
        cls,
        values: List[float],
        n_bootstraps: int = 1000,
        alpha: float = 0.05,
    ) -> Tuple[float, float]:
        """Menghitung interval kepercayaan 95% menggunakan metode bootstrap (1000 iterasi)."""
        if not values or len(values) < 5:
            mean_val = float(np.mean(values)) if values else 0.0
            return mean_val, mean_val

        arr = np.array(values)
        boot_means = []
        n = len(arr)
        rng = np.random.default_rng(seed=42)

        for _ in range(n_bootstraps):
            sample = rng.choice(arr, size=n, replace=True)
            boot_means.append(np.mean(sample))

        low_p = (alpha / 2.0) * 100.0
        high_p = (1.0 - alpha / 2.0) * 100.0
        ci_lower = float(np.percentile(boot_means, low_p))
        ci_upper = float(np.percentile(boot_means, high_p))

        return round(ci_lower, 2), round(ci_upper, 2)
