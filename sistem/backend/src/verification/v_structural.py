"""Verifikasi Lapis 1: Uji Kesesuaian Struktural (v_structural.py).

Memeriksa geometri jumlah digit terhadap slot fisik display dan validitas titik desimal.
Mengacu pada spesifikasi arsitektur Bab V.
"""

from typing import Optional, Tuple
from ..pipeline.schema import LayerResult, SlotProfile


class StructuralVerifier:
    """Memverifikasi kecocokan bentuk bacaan terhadap spesifikasi fisik panel."""

    def verify(
        self,
        reading: str,
        slot_profile: Optional[SlotProfile] = None,
        expected_slots: int = 6,
        require_decimal: bool = True,
    ) -> Tuple[bool, LayerResult]:
        """Mengevaluasi kesesuaian format digit dan desimal terhadap slot display.

        Returns:
            Tuple[is_passed, layer_result]
        """
        if not reading:
            return False, LayerResult(
                layer_id="L1",
                passed=False,
                reason="Bacaan kosong (tidak ada karakter numerik)",
            )

        # 1. Hitung jumlah digit murni tanpa titik desimal
        digits_only = [c for c in reading if c.isdigit()]
        num_digits = len(digits_only)
        decimal_count = reading.count(".")

        # Gunakan slot dari profile jika ada, fallback ke expected_slots
        max_slots = slot_profile.expected_slots if slot_profile else expected_slots

        # Validasi A: Jumlah digit melebihi slot fisik display
        if num_digits > max_slots:
            return False, LayerResult(
                layer_id="L1",
                passed=False,
                reason=f"Jumlah digit ({num_digits}) melebihi kapasitas display ({max_slots} slot)",
                details={"digits": num_digits, "max_slots": max_slots},
            )

        # Validasi B: Format titik desimal
        if decimal_count > 1:
            return False, LayerResult(
                layer_id="L1",
                passed=False,
                reason=f"Terdeteksi {decimal_count} titik desimal (maksimal 1 diizinkan)",
            )

        if require_decimal and decimal_count == 0:
            # Jika profil mewajibkan desimal namun tidak terbaca
            return False, LayerResult(
                layer_id="L1",
                passed=False,
                reason="Titik desimal tidak terdeteksi pada panel yang memiliki resolusi desimal",
            )

        # Validasi C: Posisi titik desimal
        decimal_pos_from_right = None
        if decimal_count == 1:
            parts = reading.split(".")
            decimals_after_dot = len(parts[1])
            decimal_pos_from_right = decimals_after_dot
            # Pada timbangan industri umumnya desimal berada di 1, 2, atau 3 angka belakang
            if decimals_after_dot < 1 or decimals_after_dot > 3:
                return False, LayerResult(
                    layer_id="L1",
                    passed=False,
                    reason=f"Posisi desimal tidak wajar ({decimals_after_dot} angka di belakang koma)",
                )

        reason = f"Format valid ({num_digits} digit dari {max_slots} slot, desimal sah)"
        return True, LayerResult(
            layer_id="L1",
            passed=True,
            reason=reason,
            details={
                "digits": num_digits,
                "slots": max_slots,
                "has_decimal": decimal_count == 1,
                "decimal_position_from_right": decimal_pos_from_right,
            },
        )
