"""Modul Runner Eksperimen Formal (Kalibrasi, Tahap A, Tahap B, Profil Edge)."""

import csv
import hashlib
import json
import os
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple
import cv2
import numpy as np
import yaml

from ..engine.decision_engine import DecisionEngine
from ..models.registry import MODEL_ORDER, create_recognizer
from ..pipeline.normalizer import StringNormalizer
from ..verification.v_calibration import CalibrationVerifier
from ..verification.v_physical import PhysicalVerifier
from ..verification.v_structural import StructuralVerifier
from ..verification.v_temporal import TemporalVerifier
from ..vision.slot_profiler import SlotProfiler
from .calibration_optimizer import CalibrationOptimizer
from .edge_profiler import run_edge_profile as _profile_edge_models
from .harness import BenchmarkHarness
from .risk_coverage import RiskCoverageAnalyzer

ABLATION_CONFIGS: Tuple[Tuple[str, Set[str]], ...] = (
    ("baseline_raw", set()),
    ("stage1_temporal", {"L3"}),
    ("stage2_temporal_structural", {"L3", "L1"}),
    ("stage3_temporal_structural_physical", {"L3", "L1", "L2"}),
    ("stage4_full_4layer", {"L3", "L1", "L2", "L4"}),
)


def _load_product_configs(backend_dir: str) -> Dict[str, Any]:
    cfg_path = os.path.join(backend_dir, "config", "produk.yaml")
    if not os.path.exists(cfg_path):
        return {}
    with open(cfg_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f).get("products", {})


def _build_engine(backend_dir: str, temperature: float = 1.0, threshold: float = 0.85) -> DecisionEngine:
    return DecisionEngine(
        temporal_verifier=TemporalVerifier(min_agreement_ratio=0.8),
        structural_verifier=StructuralVerifier(),
        physical_verifier=PhysicalVerifier(product_configs=_load_product_configs(backend_dir)),
        calibration_verifier=CalibrationVerifier(temperature=temperature, threshold=threshold),
    )


def _load_calibration_map(backend_dir: str) -> Dict[str, Dict[str, Any]]:
    cal_path = os.path.join(backend_dir, "config", "calibration_params.json")
    if not os.path.exists(cal_path):
        return {}
    with open(cal_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_calib_crops(base_dir: str, use_all_frames: bool = True, limit: Optional[int] = None) -> List[Tuple[np.ndarray, str]]:
    """Memuat pasangan (crop, gt_normalized) HANYA dari data/calib/meta.jsonl."""
    meta_path = os.path.join(base_dir, "data", "calib", "meta.jsonl")
    if not os.path.exists(meta_path):
        raise FileNotFoundError(f"Berkas kalibrasi tidak ditemukan: {meta_path}")

    with open(meta_path, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    pairs: List[Tuple[np.ndarray, str]] = []
    for item in records:
        frames = item.get("frames", [])
        f_gts = item.get("frame_ground_truths") or [item.get("ground_truth", "")] * len(frames)
        f_rois = item.get("frame_roi_bboxes")
        default_roi = item.get("roi_bbox")
        indices = range(len(frames)) if use_all_frames else [0]
        for idx in indices:
            if idx >= len(frames):
                continue
            fp = os.path.join(base_dir, "data", "calib", "frames", frames[idx])
            img = cv2.imread(fp)
            if img is None:
                continue
            bbox = f_rois[idx] if (f_rois and idx < len(f_rois)) else default_roi
            crop = BenchmarkHarness._crop_bbox(img, bbox)
            gt_norm = StringNormalizer.normalize(str(f_gts[idx]))
            if gt_norm and crop.size > 0:
                pairs.append((crop, gt_norm))
                if limit and len(pairs) >= limit:
                    return pairs
    return pairs


def _calibrate_single_model(
    rec: Any, pairs: List[Tuple[np.ndarray, str]], max_silent_error: float
) -> Dict[str, Any]:
    opt, rc = CalibrationOptimizer(), RiskCoverageAnalyzer()
    raw_scores, labels, latencies = [], [], []
    for crop, gt_norm in pairs:
        r = rec.predict(crop)
        raw_scores.append(r.raw_score)
        labels.append(1 if r.normalized_text == gt_norm else 0)
        latencies.append(r.latency_ms)

    opt_t = opt.fit_temperature(raw_scores, labels)
    ece_before, bins_before = opt.calculate_ece(raw_scores, labels)
    cal_v = CalibrationVerifier(temperature=opt_t)
    cal_scores = [cal_v.scale_confidence(s) for s in raw_scores]
    ece_after, bins_after = opt.calculate_ece(cal_scores, labels)
    op_point = rc.find_operating_threshold(
        cal_scores, labels, max_silent_error=max_silent_error, min_coverage=0.50
    )
    return {
        "samples": len(raw_scores),
        "exact_match_rate_pct": round(100.0 * sum(labels) / max(len(labels), 1), 2),
        "optimal_temperature": opt_t,
        "locked_threshold": op_point["recommended_threshold"],
        "calib_policy_note": op_point.get("policy_note", ""),
        "ece_before": ece_before,
        "ece_after": ece_after,
        "calib_expected_risk": op_point["expected_risk"],
        "calib_achieved_coverage": op_point["achieved_coverage"],
        "calib_aurc": op_point["aurc"],
        "median_latency_ms": round(float(np.median(latencies)) if latencies else 0.0, 2),
        "reliability_bins_before": bins_before,
        "reliability_bins_after": bins_after,
    }


def run_calibration_stage(
    base_dir: str,
    backend_dir: str,
    models: Sequence[str] = MODEL_ORDER,
    use_all_frames: bool = True,
    max_silent_error: float = 0.01,
) -> Dict[str, Any]:
    """Menjalankan kalibrasi Temperature Scaling (T*) & ambang selektif (tau) di data/calib."""
    pairs = _load_calib_crops(base_dir, use_all_frames=use_all_frames)
    results = {
        model_key: _calibrate_single_model(create_recognizer(model_key), pairs, max_silent_error)
        for model_key in models
    }
    out_path = os.path.join(backend_dir, "config", "calibration_params.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    merged = _load_calibration_map(backend_dir)
    merged.update(results)
    ordered = {k: merged[k] for k in MODEL_ORDER if k in merged}
    for k, v in merged.items():
        ordered.setdefault(k, v)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(ordered, f, indent=2)
    return results


def _merge_csv_rows(csv_path: str, key_cols: Tuple[str, ...], new_rows: List[Dict[str, Any]], ordered_keys: List[Tuple[str, ...]]) -> None:
    merged: Dict[Tuple[str, ...], Dict[str, Any]] = {}
    if os.path.exists(csv_path):
        with open(csv_path, "r", newline="", encoding="utf-8") as f:
            for existing in csv.DictReader(f):
                merged[tuple(existing[k] for k in key_cols)] = existing
    for row in new_rows:
        merged[tuple(str(row[k]) for k in key_cols)] = row
    ordered = [merged[k] for k in ordered_keys if k in merged]
    for k, v in merged.items():
        if v not in ordered:
            ordered.append(v)
    _write_csv(csv_path, ordered or new_rows)


def _write_csv(path: str, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


class _MemoizedRecognizer:
    """Cache deterministik per-crop agar tahap ablasi tidak mengulang inferensi ONNX identik."""

    def __init__(self, inner: Any):
        self._inner = inner
        self._cache: Dict[Tuple[Tuple[int, ...], bytes], Any] = {}

    def predict(self, crop: np.ndarray) -> Any:
        key = (tuple(crop.shape), hashlib.blake2b(crop.tobytes(), digest_size=16).digest())
        if key not in self._cache:
            self._cache[key] = self._inner.predict(crop)
        return self._cache[key]


def run_tahap_a(
    base_dir: str,
    backend_dir: str,
    models: Sequence[str] = MODEL_ORDER,
    max_samples: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Menjalankan Tahap A (perbandingan 6 model) pada 755 citra dataset uji terkunci."""
    cal_map = _load_calibration_map(backend_dir)
    out_dir = os.path.join(base_dir, "data", "results")
    os.makedirs(out_dir, exist_ok=True)
    summary_rows: List[Dict[str, Any]] = []

    for model_key in models:
        cal_cfg = cal_map.get(model_key, {})
        temp = float(cal_cfg.get("optimal_temperature", 1.0))
        tau = float(cal_cfg.get("locked_threshold", 0.85))
        rec = _MemoizedRecognizer(create_recognizer(model_key))

        for mode_label, layers in (("raw", set()), ("verified_4layer", {"L3", "L1", "L2", "L4"})):
            engine = _build_engine(backend_dir, temperature=temp, threshold=tau)
            harness = BenchmarkHarness(recognizer=rec, slot_profiler=SlotProfiler(), decision_engine=engine, base_dir=base_dir)
            report = harness.run_unified_755(active_layers=layers, max_samples=max_samples)
            with open(os.path.join(out_dir, f"tahap_a_{model_key}_{mode_label}.json"), "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)

            mm = report["summary"]["model_metrics"]
            vm = report["summary"]["verification_metrics"]
            print(f"  [Tahap A] {model_key} ({mode_label}): n={report['summary']['total_samples']} FSR={mm['fsr']}% CER={mm['cer']}% SilentErr={vm['silent_error']}% Cov={vm['coverage']}%", flush=True)
            summary_rows.append({
                "model": model_key,
                "mode": mode_label,
                "n": report["summary"]["total_samples"],
                "temperature": temp,
                "threshold": tau,
                "fsr_pct": mm["fsr"],
                "fsr_ci95_low": mm["fsr_ci_95"][0],
                "fsr_ci95_high": mm["fsr_ci_95"][1],
                "cer_pct": mm["cer"],
                "cer_ci95_low": mm["cer_ci_95"][0],
                "cer_ci95_high": mm["cer_ci_95"][1],
                "decimal_acc_pct": mm["decimal_acc"],
                "coverage_pct": vm["coverage"],
                "silent_error_pct": vm["silent_error"],
                "selective_acc_pct": vm["selective_accuracy"],
                "aurc": vm["aurc"],
                "latency_p50_ms": mm["latency_p50_ms"],
                "latency_p95_ms": mm["latency_p95_ms"],
            })

    csv_path = os.path.join(out_dir, "tahap_a_summary.csv")
    ordered_keys = [(m, md) for m in MODEL_ORDER for md in ("raw", "verified_4layer")]
    _merge_csv_rows(csv_path, ("model", "mode"), summary_rows, ordered_keys)
    return summary_rows


def run_tahap_b(
    base_dir: str,
    backend_dir: str,
    models: Sequence[str] = ("small",),
    max_samples: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Menjalankan Tahap B (ablasi 5 tingkat pada burst 120 + unified 755)."""
    cal_map = _load_calibration_map(backend_dir)
    out_dir = os.path.join(base_dir, "data", "results")
    manifest_120 = os.path.join(base_dir, "data", "locked_test_set", "manifest.json")
    os.makedirs(out_dir, exist_ok=True)
    rows: List[Dict[str, Any]] = []

    for model_key in models:
        cal_cfg = cal_map.get(model_key, {})
        temp = float(cal_cfg.get("optimal_temperature", 1.0))
        tau = float(cal_cfg.get("locked_threshold", 0.85))
        rec = _MemoizedRecognizer(create_recognizer(model_key))

        for cfg_name, layers in ABLATION_CONFIGS:
            engine = _build_engine(backend_dir, temperature=temp, threshold=tau)
            harness = BenchmarkHarness(recognizer=rec, slot_profiler=SlotProfiler(), decision_engine=engine, base_dir=base_dir)
            rep_burst = harness.run_manifest(manifest_120, max_samples=max_samples, active_layers=layers)
            rep_755 = harness.run_unified_755(active_layers=layers, max_samples=max_samples)

            with open(os.path.join(out_dir, f"tahap_b_{model_key}_{cfg_name}.json"), "w", encoding="utf-8") as f:
                json.dump({"burst_120": rep_burst, "unified_755": rep_755}, f, indent=2)

            for scope_name, rep in (("burst_120", rep_burst), ("unified_755", rep_755)):
                mm = rep["summary"]["model_metrics"]
                vm = rep["summary"]["verification_metrics"]
                print(f"  [Tahap B] {model_key} [{cfg_name}] ({scope_name}): Cov={vm['coverage']}% SilentErr={vm['silent_error']}% SelAcc={vm['selective_accuracy']}% AURC={vm['aurc']}", flush=True)
                rows.append({
                    "model": model_key,
                    "ablation_stage": cfg_name,
                    "scope": scope_name,
                    "n": rep["summary"]["total_samples"],
                    "fsr_pct": mm["fsr"],
                    "cer_pct": mm["cer"],
                    "coverage_pct": vm["coverage"],
                    "silent_error_pct": vm["silent_error"],
                    "selective_acc_pct": vm["selective_accuracy"],
                    "aurc": vm["aurc"],
                })

    csv_b = os.path.join(out_dir, "tahap_b_ablation.csv")
    ordered_b = [
        (m, st, sc)
        for m in MODEL_ORDER
        for st, _ in ABLATION_CONFIGS
        for sc in ("burst_120", "unified_755")
    ]
    _merge_csv_rows(csv_b, ("model", "ablation_stage", "scope"), rows, ordered_b)
    return rows


def run_edge_profile(
    base_dir: str,
    models: Sequence[str] = MODEL_ORDER,
    num_crops: int = 30,
) -> List[Dict[str, Any]]:
    """Mengukur waktu muat, konsumsi RSS RAM, dan latensi p50/p95 CPU menggunakan data/calib."""
    pairs = _load_calib_crops(base_dir, use_all_frames=False, limit=num_crops)
    crops = [c for c, _ in pairs]
    return _profile_edge_models(base_dir=base_dir, crops=crops, models=models)
