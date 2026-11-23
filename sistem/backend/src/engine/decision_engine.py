"""Engine Pengambil Keputusan Empat Keadaan (C8).

Menggabungkan hasil verifikasi berurutan (L3 -> L1 -> L2 -> L4) untuk menghasilkan
keputusan akhir: TERIMA, TOLAK, KONFIRMASI, atau BATAL.
Mengacu pada spesifikasi arsitektur Bab V dan Bab VI.
"""

from typing import Dict, List, Optional, Set
from ..pipeline.normalizer import StringNormalizer
from ..pipeline.schema import (
    DecisionContract,
    DecisionState,
    FrameEvaluation,
    LayerResult,
    ReadingContract,
    SlotProfile,
)
from ..verification.v_calibration import CalibrationVerifier
from ..verification.v_physical import PhysicalVerifier
from ..verification.v_structural import StructuralVerifier
from ..verification.v_temporal import TemporalVerifier


class DecisionEngine:
    """Mesin keputusan terpadu untuk sistem pembacaan timbangan industri."""

    def __init__(
        self,
        temporal_verifier: Optional[TemporalVerifier] = None,
        structural_verifier: Optional[StructuralVerifier] = None,
        physical_verifier: Optional[PhysicalVerifier] = None,
        calibration_verifier: Optional[CalibrationVerifier] = None,
    ):
        self.v_temporal = temporal_verifier or TemporalVerifier()
        self.v_structural = structural_verifier or StructuralVerifier()
        self.v_physical = physical_verifier or PhysicalVerifier()
        self.v_calibration = calibration_verifier or CalibrationVerifier()

    def evaluate_burst(
        self,
        frame_readings: List[ReadingContract],
        slot_profile: Optional[SlotProfile] = None,
        product_id: Optional[str] = None,
        device_id: Optional[str] = None,
        expected_slots: int = 6,
        require_decimal: bool = True,
        recent_history: Optional[List[float]] = None,
        active_layers: Optional[Set[str]] = None,
    ) -> DecisionContract:
        """Mengevaluasi satu burst transaksi penimbangan multi-frame.

        Args:
            active_layers: Himpunan lapis aktif untuk uji ablasi (e.g. {'L1', 'L2', 'L3', 'L4'}).
                           Jika None, seluruh lapis L1-L4 diaktifkan.
        """
        enabled = {"L1", "L2", "L3", "L4"} if active_layers is None else set(active_layers)

        if not frame_readings:
            return DecisionContract(
                reading="",
                decision=DecisionState.BATAL,
                trigger_layer=None,
                reason="Tidak ada citra bingkai yang berhasil diproses oleh model",
                calibrated_score=0.0,
                threshold_applied=self.v_calibration.threshold,
                product_id=product_id,
                device_id=device_id,
            )

        layer_results: List[LayerResult] = []

        # 1. Normalisasi teks seluruh bingkai
        normalized_texts = [
            StringNormalizer.normalize(r.normalized_text or r.raw_text)
            for r in frame_readings
        ]

        # 2. Uji Temporal (L3: Stabilitas antar-bingkai)
        if "L3" in enabled:
            t_pass, t_res, agreed_reading = self.v_temporal.verify(normalized_texts)
            layer_results.append(t_res)
        else:
            t_pass = True
            agreed_reading = normalized_texts[0]

        frame_evaluations: List[FrameEvaluation] = [
            FrameEvaluation(
                frame_idx=idx + 1,
                raw_text=r.raw_text,
                normalized_text=norm_txt,
                confidence=round(r.raw_score, 4),
                decision=DecisionState.TERIMA if norm_txt == agreed_reading else DecisionState.TOLAK,
            )
            for idx, (r, norm_txt) in enumerate(zip(frame_readings, normalized_texts))
        ]

        if not t_pass:
            # Gagal L3 -> Minta Konfirmasi (ambil foto ulang)
            return DecisionContract(
                reading=agreed_reading or normalized_texts[0],
                decision=DecisionState.KONFIRMASI,
                trigger_layer="L3",
                reason=t_res.reason,
                calibrated_score=0.5,
                threshold_applied=self.v_calibration.threshold,
                product_id=product_id,
                device_id=device_id,
                layer_results=layer_results,
                frames=frame_evaluations,
            )

        # 3. Uji Struktur (L1: Format slot & titik desimal)
        if "L1" in enabled:
            s_pass, s_res = self.v_structural.verify(
                reading=agreed_reading,
                slot_profile=slot_profile,
                expected_slots=expected_slots,
                require_decimal=require_decimal,
            )
            layer_results.append(s_res)

            if not s_pass:
                return DecisionContract(
                    reading=agreed_reading,
                    decision=DecisionState.TOLAK,
                    trigger_layer="L1",
                    reason=s_res.reason,
                    calibrated_score=0.0,
                    threshold_applied=self.v_calibration.threshold,
                    product_id=product_id,
                    device_id=device_id,
                    layer_results=layer_results,
                    frames=frame_evaluations,
                )

        # 4. Uji Fisik (L2: Batas produk & toleransi riwayat)
        if "L2" in enabled:
            p_pass, p_res = self.v_physical.verify(
                reading=agreed_reading,
                product_id=product_id,
                recent_history=recent_history,
            )
            layer_results.append(p_res)

            if not p_pass:
                return DecisionContract(
                    reading=agreed_reading,
                    decision=DecisionState.TOLAK,
                    trigger_layer="L2",
                    reason=p_res.reason,
                    calibrated_score=0.0,
                    threshold_applied=self.v_calibration.threshold,
                    product_id=product_id,
                    device_id=device_id,
                    layer_results=layer_results,
                    frames=frame_evaluations,
                )

        # 5. Uji Kalibrasi Keyakinan (L4: Temperature Scaling & Threshold)
        matching_scores = [
            r.raw_score
            for r, norm in zip(frame_readings, normalized_texts)
            if norm == agreed_reading
        ]
        avg_raw_score = float(sum(matching_scores) / max(len(matching_scores), 1))

        if "L4" in enabled:
            c_pass, c_res, cal_score = self.v_calibration.verify(avg_raw_score)
            layer_results.append(c_res)

            if not c_pass:
                return DecisionContract(
                    reading=agreed_reading,
                    decision=DecisionState.KONFIRMASI,
                    trigger_layer="L4",
                    reason=c_res.reason,
                    calibrated_score=cal_score,
                    threshold_applied=self.v_calibration.threshold,
                    product_id=product_id,
                    device_id=device_id,
                    layer_results=layer_results,
                    frames=frame_evaluations,
                )
        else:
            cal_score = round(avg_raw_score, 4)

        # Seluruh Lapis Aktif Lolos -> TERIMA
        return DecisionContract(
            reading=agreed_reading,
            decision=DecisionState.TERIMA,
            trigger_layer=None,
            reason="Lolos verifikasi aktif (" + ", ".join(sorted(enabled)) + ")" if enabled else "Mode Baseline (tanpa verifikasi)",
            calibrated_score=cal_score,
            threshold_applied=self.v_calibration.threshold,
            product_id=product_id,
            device_id=device_id,
            layer_results=layer_results,
            frames=frame_evaluations,
        )
