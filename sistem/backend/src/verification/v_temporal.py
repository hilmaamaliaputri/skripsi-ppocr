"""Verifikasi Lapis 3: Uji Stabilitas Temporal (v_temporal.py).

Memeriksa kesepakatan bacaan antar 3 sampai 5 bingkai berurutan.
Mengacu pada spesifikasi arsitektur Bab V.
"""

from collections import Counter
from typing import List, Tuple
from ..pipeline.schema import LayerResult


class TemporalVerifier:
    """Memverifikasi konsistensi bacaan antar-bingkai (multi-frame consensus)."""

    def __init__(self, min_agreement_ratio: float = 0.8):
        self.min_agreement_ratio = min_agreement_ratio

    def verify(self, frame_readings: List[str]) -> Tuple[bool, LayerResult, str]:
        """Mengevaluasi deret bacaan dari 3-5 bingkai.

        Returns:
            Tuple[is_passed, layer_result, agreed_reading]
        """
        if not frame_readings:
            res = LayerResult(
                layer_id="L3",
                passed=False,
                reason="Tidak ada bingkai yang diterima untuk verifikasi temporal",
            )
            return False, res, ""

        total_frames = len(frame_readings)
        counts = Counter(frame_readings)
        most_common_reading, highest_count = counts.most_common(1)[0]
        agreement_ratio = highest_count / float(total_frames)

        passed = agreement_ratio >= self.min_agreement_ratio
        if passed:
            reason = f"Stabil pada {highest_count}/{total_frames} bingkai ({agreement_ratio*100:.1f}%)"
        else:
            diff_count = total_frames - highest_count
            reason = f"Tidak stabil: bacaan berubah pada {diff_count} dari {total_frames} bingkai"

        layer_res = LayerResult(
            layer_id="L3",
            passed=passed,
            reason=reason,
            details={
                "total_frames": total_frames,
                "agreed_count": highest_count,
                "agreement_ratio": round(agreement_ratio, 3),
                "distribution": dict(counts),
            },
        )
        return passed, layer_res, most_common_reading
