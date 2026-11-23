"""Harness Pengujian Evaluasi Terpadu (C5, EXP-13).

Menguji model pembanding OCR dan lapisan verifikasi pada:
1) Manifes burst timbangan (locked_test_set/manifest.json: 120 burst / 600 frame), maupun
2) Dataset Uji Terkunci Terpadu 755 Citra (600 bingkai timbangan + 155 citra riil SachaIZADI).
Menyertakan interval kepercayaan 95% (bootstrap 1.000 iterasi) dan rincian per kondisi lapangan.
"""

from collections import defaultdict
import json
import os
from typing import Any, Dict, List, Optional, Set
import cv2
import numpy as np

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
        recognizer: Optional[Any] = None,
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

    def _resolve_path(self, rel_path: str) -> str:
        clean_rel = rel_path.replace("/", os.sep).replace("\\", os.sep)
        if clean_rel.startswith("data" + os.sep):
            return os.path.join(self.base_dir, clean_rel)
        return os.path.join(self.base_dir, "data", clean_rel)

    @staticmethod
    def _crop_bbox(img: np.ndarray, roi_bbox: Optional[List[int]]) -> np.ndarray:
        if not roi_bbox:
            return img
        h, w = img.shape[:2]
        x1, y1, x2, y2 = roi_bbox
        x1 = max(0, min(int(x1), w - 1))
        y1 = max(0, min(int(y1), h - 1))
        x2 = max(x1 + 1, min(int(x2), w))
        y2 = max(y1 + 1, min(int(y2), h))
        return img[y1:y2, x1:x2]

    def _summarize_records(self, records: List[Dict[str, Any]], latencies: List[float]) -> Dict[str, Any]:
        predictions = [r["prediction"] for r in records]
        ground_truths = [r["ground_truth"] for r in records]
        decisions = [r["decision"] for r in records]
        confidences = [r["calibrated_score"] for r in records]
        binary_correctness = [1 if r["is_correct"] else 0 for r in records]

        model_m = EvaluationMetrics.calculate_model_metrics(predictions, ground_truths)
        verif_m = EvaluationMetrics.calculate_verification_metrics(decisions, predictions, ground_truths)
        aurc, curve_pts = self.risk_analyzer.compute_curve(confidences, binary_correctness)

        p50_lat = float(np.percentile(latencies, 50)) if latencies else 0.0
        p95_lat = float(np.percentile(latencies, 95)) if latencies else 0.0

        fsr_samples = [100.0 if p == g else 0.0 for p, g in zip(predictions, ground_truths)]
        cer_samples = [
            (EvaluationMetrics.levenshtein_distance(p, g) / float(max(len(g), 1))) * 100.0
            for p, g in zip(predictions, ground_truths)
        ]
        fsr_ci = EvaluationMetrics.bootstrap_confidence_interval(fsr_samples)
        cer_ci = EvaluationMetrics.bootstrap_confidence_interval(cer_samples)

        return {
            "total_samples": len(predictions),
            "model_metrics": {
                "fsr": model_m["fsr"],
                "fsr_ci_95": list(fsr_ci),
                "cer": model_m["cer"],
                "cer_ci_95": list(cer_ci),
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
            "risk_coverage_curve": curve_pts,
        }

    def _build_report(
        self,
        results: List[Dict[str, Any]],
        latencies: List[float],
        by_condition: Dict[str, List[Dict[str, Any]]],
        by_condition_lat: Optional[Dict[str, List[float]]] = None,
    ) -> Dict[str, Any]:
        """Menyatukan ringkasan global dan rincian per kondisi lapangan."""
        summary_full = self._summarize_records(results, latencies)
        cond_summary = {
            cond: {
                k: v
                for k, v in self._summarize_records(
                    recs, by_condition_lat[cond] if by_condition_lat else []
                ).items()
                if k != "risk_coverage_curve"
            }
            for cond, recs in by_condition.items()
        }
        return {
            "summary": {
                "total_samples": summary_full["total_samples"],
                "model_metrics": summary_full["model_metrics"],
                "verification_metrics": summary_full["verification_metrics"],
                "by_condition": cond_summary,
            },
            "risk_coverage_curve": summary_full["risk_coverage_curve"],
            "sample_results": results,
        }

    def run_manifest(
        self,
        manifest_path: str,
        max_samples: Optional[int] = None,
        active_layers: Optional[Set[str]] = None,
    ) -> Dict[str, Any]:
        """Menjalankan evaluasi pada berkas manifes burst (seperti locked_test_set/manifest.json)."""
        if not os.path.isabs(manifest_path):
            manifest_path = os.path.join(self.base_dir, manifest_path)

        with open(manifest_path, "r", encoding="utf-8") as f:
            samples = json.load(f)

        if max_samples:
            samples = samples[:max_samples]

        results: List[Dict[str, Any]] = []
        latencies: List[float] = []
        by_condition: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

        for item in samples:
            sample_id = item["id"]
            gt = StringNormalizer.normalize(item["ground_truth"])
            prod_id = item.get("product_profile")
            dev_id = item.get("theme_key")
            condition = item.get("condition", "unknown")
            roi_bbox = item.get("roi_bbox")
            expected_slots = item.get("total_slots", 6)
            frame_paths = item.get("frame_paths", [])

            frame_readings: List[ReadingContract] = []
            slot_prof = None

            for idx, rel_path in enumerate(frame_paths):
                full_p = self._resolve_path(rel_path)
                if not os.path.exists(full_p):
                    continue
                img = cv2.imread(full_p)
                if img is None:
                    continue

                crop = self._crop_bbox(img, roi_bbox)
                if idx == 0 and crop.size > 0:
                    slot_prof = self.slot_profiler.profile(crop, expected_slots=expected_slots)

                reading = self.recognizer.predict(crop)
                frame_readings.append(reading)
                latencies.append(reading.latency_ms)

            decision: DecisionContract = self.decision_engine.evaluate_burst(
                frame_readings=frame_readings,
                slot_profile=slot_prof,
                product_id=prod_id,
                device_id=dev_id,
                expected_slots=expected_slots,
                active_layers=active_layers,
            )

            pred_val = decision.reading
            is_correct = pred_val == gt
            rec_out = {
                "id": sample_id,
                "condition": condition,
                "ground_truth": gt,
                "prediction": pred_val,
                "is_correct": is_correct,
                "decision": decision.decision.value,
                "trigger_layer": decision.trigger_layer,
                "reason": decision.reason,
                "calibrated_score": decision.calibrated_score,
                "product_id": prod_id,
                "device_id": dev_id,
                "frames": [
                    {
                        "frame_idx": f_idx + 1,
                        "image_url": f"/data/{rel.replace('\\', '/')[5:]}"
                        if rel.replace("\\", "/").startswith("data/")
                        else f"/data/{rel.replace('\\', '/')}",
                        "raw_text": fr.raw_text,
                        "normalized_text": fr.normalized_text,
                        "confidence": round(fr.raw_score, 4),
                        "decision": "TERIMA" if fr.normalized_text == gt else "TOLAK",
                    }
                    for f_idx, (fr, rel) in enumerate(zip(frame_readings, frame_paths))
                ],
            }
            results.append(rec_out)
            by_condition[condition].append(rec_out)

        return self._build_report(results, latencies, by_condition)

    def run_unified_755(
        self,
        dataset_uji_dir: Optional[str] = None,
        locked_manifest_path: Optional[str] = None,
        active_layers: Optional[Set[str]] = None,
        max_samples: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Menjalankan evaluasi menyeluruh pada 755 Citra Uji Terkunci (600 timbangan + 155 SachaIZADI)."""
        uji_dir = dataset_uji_dir or os.path.join(self.base_dir, "data", "dataset_uji")
        manifest_uji_p = os.path.join(uji_dir, "manifest.json")
        locked_p = locked_manifest_path or os.path.join(self.base_dir, "data", "locked_test_set", "manifest.json")

        with open(manifest_uji_p, "r", encoding="utf-8") as f:
            items = json.load(f)

        cond_lookup: Dict[str, Dict[str, Any]] = {}
        if os.path.exists(locked_p):
            with open(locked_p, "r", encoding="utf-8") as f:
                for entry in json.load(f):
                    cond_lookup[entry["id"]] = entry

        if max_samples:
            items = items[:max_samples]

        results: List[Dict[str, Any]] = []
        latencies: List[float] = []
        by_condition: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        by_condition_lat: Dict[str, List[float]] = defaultdict(list)

        for item in items:
            folder_id = item.get("folder_id", "")
            meta_syn = cond_lookup.get(folder_id, {})
            source = item.get("source", "unknown")
            condition = meta_syn.get("condition", "sachaizadi_real" if source == "sachaizadi_test_split" else "unknown")
            prod_id = meta_syn.get("product_profile")
            dev_id = meta_syn.get("theme_key") or item.get("theme")
            expected_slots = int(item.get("total_slots", 6))
            roi_bbox = item.get("roi_bbox")
            gt = StringNormalizer.normalize(str(item["ground_truth"]))

            img_p = os.path.join(uji_dir, "images", item["filename"].replace("/", os.sep))
            img = cv2.imread(img_p)
            if img is None:
                continue

            crop = self._crop_bbox(img, roi_bbox)
            slot_prof = self.slot_profiler.profile(crop, expected_slots=expected_slots)
            reading = self.recognizer.predict(crop)
            latencies.append(reading.latency_ms)

            # Untuk citra riil SachaIZADI (tanpa profil produk timbangan gudang), skip L2 jika product_id None
            decision = self.decision_engine.evaluate_burst(
                frame_readings=[reading],
                slot_profile=slot_prof,
                product_id=prod_id,
                device_id=dev_id,
                expected_slots=expected_slots,
                require_decimal=("." in gt),
                active_layers=active_layers,
            )

            pred_val = decision.reading
            rec_out = {
                "id": item["id"],
                "folder_id": folder_id,
                "source": source,
                "condition": condition,
                "ground_truth": gt,
                "prediction": pred_val,
                "is_correct": (pred_val == gt),
                "decision": decision.decision.value,
                "trigger_layer": decision.trigger_layer,
                "calibrated_score": decision.calibrated_score,
                "latency_ms": reading.latency_ms,
            }
            results.append(rec_out)
            by_condition[condition].append(rec_out)
            by_condition_lat[condition].append(reading.latency_ms)

        return self._build_report(results, latencies, by_condition, by_condition_lat)
