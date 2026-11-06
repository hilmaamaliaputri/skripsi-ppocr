"""Verifikasi Lapis 2: Uji Masuk Akal Fisik (v_physical.py).

Memeriksa rentang berat produk dan deviasi terhadap riwayat transaksi.
Mengacu pada spesifikasi arsitektur Bab V.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
from ..pipeline.schema import LayerResult


class PhysicalVerifier:
    """Memverifikasi kelayakan nilai numerik berat terhadap batas fisik produk."""

    def __init__(self, product_configs: Optional[Dict] = None):
        self.product_configs = product_configs or {}

    def verify(
        self,
        reading: str,
        product_id: Optional[str] = None,
        recent_history: Optional[List[float]] = None,
    ) -> Tuple[bool, LayerResult]:
        """Mengevaluasi nilai numerik terhadap batas rentang produk dan toleransi riwayat.

        Returns:
            Tuple[is_passed, layer_result]
        """
        try:
            weight_val = float(reading)
        except (ValueError, TypeError):
            return False, LayerResult(
                layer_id="L2",
                passed=False,
                reason=f"Bacaan '{reading}' tidak dapat dikonversi ke nilai numerik",
            )

        if not product_id or product_id not in self.product_configs:
            # Jika produk tidak didefinisikan secara khusus, lakukan batas kewajaran umum
            if weight_val <= 0.0 or weight_val > 5000.0:
                return False, LayerResult(
                    layer_id="L2",
                    passed=False,
                    reason=f"Berat {weight_val} kg berada di luar rentang fisik masuk akal",
                )
            return True, LayerResult(
                layer_id="L2",
                passed=True,
                reason=f"Berat {weight_val} kg lolos batas umum",
                details={"value": weight_val},
            )

        cfg = self.product_configs[product_id]
        min_w = cfg.get("min_weight", 0.0)
        max_w = cfg.get("max_weight", 1000.0)
        tolerance = cfg.get("tolerance", 1.0)

        # 1. Validasi Batas Min-Max Produk
        if weight_val < min_w or weight_val > max_w:
            return False, LayerResult(
                layer_id="L2",
                passed=False,
                reason=f"Berat {weight_val} kg di luar batas produk {product_id} ({min_w}–{max_w} kg)",
                details={"value": weight_val, "min": min_w, "max": max_w},
            )

        # 2. Validasi Toleransi terhadap Riwayat Transaksi (Moving Median)
        if recent_history and len(recent_history) >= 3:
            median_hist = float(np.median(recent_history))
            delta = abs(weight_val - median_hist)
            if delta > tolerance * 2.0:
                return False, LayerResult(
                    layer_id="L2",
                    passed=False,
                    reason=f"Deviasi ({delta:.2f} kg) melebihi batas toleransi dari riwayat ({median_hist:.2f} kg)",
                    details={"value": weight_val, "median_history": median_hist, "delta": delta},
                )

        reason = f"Berat {weight_val} kg sesuai rentang produk {product_id} ({min_w}–{max_w} kg)"
        return True, LayerResult(
            layer_id="L2",
            passed=True,
            reason=reason,
            details={"value": weight_val, "min": min_w, "max": max_w},
        )
