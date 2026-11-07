"""Harness Pengujian Evaluasi Terpadu (C5).

Menguji model PP-OCRv6 dan lapisan verifikasi pada dataset acuan,
serta mengembalikan laporan metrik lengkap dengan interval kepercayaan 95%.
"""

import json
import os
import time
from typing import Dict, List, Optional
import cv2
import numpy as np
import yaml

from ..engine.decision_engine import DecisionEngine
from ..models.ppocrv6_onnx import PPOCRv6OnnxRecognizer
from ..pipeline.normalizer import StringNormalizer
from ..pipeline.schema import DecisionContract, ReadingContract
from ..vision.slot_profiler import SlotProfiler
from .metrics import EvaluationMetrics
from .risk_coverage import RiskCoverageAnalyzer


class BenchmarkHarness:
    """Harness evaluasi benchmark satu atap untuk tahap model dan tahap verifikasi."""

    def __init__(
        self,
        recognizer: Optional[PPOCRv6OnnxRecognizer] = None,
        slot_profiler: Optional[SlotProfiler] = None,
        decision_engine: Optional[DecisionEngine] = None,
        base_dir: str = "sistem",
    ):
        self.base_dir = base_dir
        self._recognizer = recognizer
        self.slot_profiler = slot_profiler or SlotProfiler()
        self.decision_engine = decision_engine or DecisionEngine()
        self.risk_analyzer = RiskCoverageAnalyzer()

    @property
    def recognizer(self):
        if self._recognizer is None:
            self._recognizer = PPOCRv6OnnxRecognizer(tier="small")
        return self._recognizer

    @recognizer.setter
    def recognizer(self, val):
        self._recognizer = val

    def run_manifest(
        self, manifest_path: str, max_samples: Optional[int] = None
    ) -> Dict:
        """Menjalankan evaluasi pada berkas manifes (seperti quick_20.json)."""
        if not os.path.isabs(manifest_path):
            manifest_path = os.path.join(self.base_dir, manifest_path)

        with open(manifest_path, "r", encoding="utf-8") as f:
            samples = json.load(f)

        if max_samples:
            samples = samples[:max_samples]

        results = []
        predictions: List[str] = []
        ground_truths: List[str] = []
        decisions: List[str] = []
        confidences: List[float] = []
        latencies: List[float] = []
        binary_correctness: List[int] = []

        for item in samples:
            sample_id = item["id"]
            gt = StringNormalizer.normalize(item["ground_truth"])
            prod_id = item.get("product_profile")
            dev_id = item.get("theme_key")
            roi_bbox = item.get("roi_bbox")
            expected_slots = item.get("total_slots", 6)
            frame_paths = item.get("frame_paths", [])

            frame_readings: List[ReadingContract] = []
            slot_prof = None

            # Proses setiap bingkai pada burst
            for idx, rel_path in enumerate(frame_paths):
                # Normalisasi path
                clean_rel = rel_path.replace("/", os.sep).replace("\\", os.sep)
                if clean_rel.startswith("data" + os.sep):
                    full_p = os.path.join(self.base_dir, clean_rel)
                else:
                    full_p = os.path.join(self.base_dir, "data", clean_rel)

                if not os.path.exists(full_p):
                    continue

                img = cv2.imread(full_p)
                if img is None:
                    continue

                # Crop ROI
                crop = img
                if roi_bbox:
                    x1, y1, x2, y2 = roi_bbox
                    crop = img[int(y1):int(y2), int(x1):int(x2)]

                # Profil slot pada frame pertama
                if idx == 0 and crop.size > 0:
                    slot_prof = self.slot_profiler.profile(crop, expected_slots=expected_slots)

                # Jalankan inferensi PP-OCRv6
                reading = self.recognizer.predict(crop)
                frame_readings.append(reading)
                latencies.append(reading.latency_ms)

            # Evaluasi keputusan
            decision: DecisionContract = self.decision_engine.evaluate_burst(
                frame_readings=frame_readings,
                slot_profile=slot_prof,
                product_id=prod_id,
                device_id=dev_id,
                expected_slots=expected_slots,
            )

            pred_val = decision.reading
            is_correct = 1 if pred_val == gt else 0

            predictions.append(pred_val)
            ground_truths.append(gt)
            decisions.append(decision.decision.value)
            confidences.append(decision.calibrated_score)
            binary_correctness.append(is_correct)

            results.append({
                "id": sample_id,
                "ground_truth": gt,
                "prediction": pred_val,
                "is_correct": bool(is_correct),
                "decision": decision.decision.value,
                "trigger_layer": decision.trigger_layer,
                "reason": decision.reason,
                "calibrated_score": decision.calibrated_score,
                "product_id": prod_id,
                "device_id": dev_id,
                "frames": [
                    {
                        "frame_idx": f_idx + 1,
                        "image_url": f"/data/{rel.replace('\\', '/')[5:]}" if rel.replace('\\', '/').startswith('data/') else f"/data/{rel.replace('\\', '/')}",
                        "raw_text": fr.raw_text,
                        "normalized_text": fr.normalized_text,
                        "confidence": round(fr.raw_score, 4),
                        "decision": "TERIMA" if fr.normalized_text == gt else "TOLAK",
                    }
                    for f_idx, (fr, rel) in enumerate(zip(frame_readings, frame_paths))
                ],
            })

        # Hitung seluruh metrik
        model_m = EvaluationMetrics.calculate_model_metrics(predictions, ground_truths)
        verif_m = EvaluationMetrics.calculate_verification_metrics(
            decisions, predictions, ground_truths
        )
        aurc, curve_pts = self.risk_analyzer.compute_curve(confidences, binary_correctness)

        p50_lat = float(np.percentile(latencies, 50)) if latencies else 0.0
        p95_lat = float(np.percentile(latencies, 95)) if latencies else 0.0

        # Hitung bootstrap CI untuk FSR dan Selective Accuracy
        fsr_samples = [100.0 if p == g else 0.0 for p, g in zip(predictions, ground_truths)]
        fsr_ci = EvaluationMetrics.bootstrap_confidence_interval(fsr_samples)

        return {
            "summary": {
                "total_samples": len(predictions),
                "model_metrics": {
                    "fsr": model_m["fsr"],
                    "fsr_ci_95": fsr_ci,
                    "cer": model_m["cer"],
                    "decimal_acc": model_m["decimal_acc"],
                    "latency_p50_ms": round(p50_lat, 2),
                    "latency_p95_ms": round(p95_lat, 2),
                },
                "verification_metrics": {
                    "coverage": verif_m["coverage"],
                    "silent_error": verif_m["silent_error"],
                    "selective_accuracy": verif_m["selective_accuracy"],
                    "aurc": aurc,
                },
            },
            "risk_coverage_curve": curve_pts,
            "sample_results": results,
        }
