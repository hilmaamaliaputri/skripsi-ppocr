"""Router API Evaluasi Riset (Benchmark, Komparasi 6 Model, Pelatihan CRNN, Kalibrasi)."""

import csv
import json
import os
from typing import Any, Dict, List
import cv2
from fastapi import APIRouter, HTTPException, Query

from ..evaluation.calibration_optimizer import CalibrationOptimizer
from ..evaluation.comparison import get_all_model_comparisons
from ..evaluation.harness import BenchmarkHarness
from ..pipeline.normalizer import StringNormalizer
from . import runtime

router = APIRouter(prefix="/api/eval", tags=["evaluation"])

_benchmark_cache: Dict[str, Any] = {}


@router.get("/benchmark")
@router.get("/benchmark/quick20")
@router.post("/benchmark/quick20")
def run_benchmark_dataset(
    model: str = Query("small", description="Pilihan varian model: small, tiny, medium, ppocrv5, crnn, dbnet_parseq"),
    verification_active: bool = Query(True, description="True = 4-Lapis Verifikasi Aktif, False = Mode Mentah"),
    all_data: bool = True,
    force_rerun: bool = False,
) -> Dict[str, Any]:
    """Menjalankan evaluasi benchmark pada dataset uji terkunci (120 burst)."""
    manifest_p = os.path.join(runtime.BASE_DIR, "data", "locked_test_set", "manifest.json")
    if not os.path.exists(manifest_p):
        manifest_p = os.path.join(runtime.BASE_DIR, "data", "locked_test_set", "quick_20.json")
    if not os.path.exists(manifest_p):
        raise HTTPException(status_code=404, detail="Berkas manifest dataset tidak ditemukan")

    cache_key = f"{model}::{'verif' if verification_active else 'raw'}"
    if not force_rerun and cache_key in _benchmark_cache:
        return _benchmark_cache[cache_key]

    t_val, tau_val = runtime.get_calib_pair(model)
    runtime.calibration_v.temperature = t_val
    runtime.calibration_v.threshold = tau_val
    runtime.benchmark_harness.recognizer = runtime.get_recognizer(model)
    active_layers = {"L3", "L1", "L2", "L4"} if verification_active else set()
    result = runtime.benchmark_harness.run_manifest(manifest_p, active_layers=active_layers)

    cal_cfg = runtime.CALIBRATION_PARAMS.get(model, {})
    result["verification_active"] = verification_active
    result["temperature_used"] = t_val
    result["confidence_threshold"] = tau_val
    if cal_cfg:
        result["calibration"] = {
            "optimal_temperature": t_val,
            "ece_before": cal_cfg.get("ece_before", 0.0),
            "ece_after": cal_cfg.get("ece_after", 0.0),
            "bins_before": cal_cfg.get("reliability_bins_before", []),
            "bins_after": cal_cfg.get("reliability_bins_after", []),
        }
    _benchmark_cache[cache_key] = result
    return result


@router.get("/comparison-matrix")
def get_comparison_matrix() -> List[Dict[str, Any]]:
    """Mengembalikan matriks komparasi seluruh varian model (mentah vs 4-lapis)."""
    return get_all_model_comparisons()


@router.get("/training-history")
def get_training_history() -> Dict[str, Any]:
    """Mengembalikan catatan historis per-epoch pelatihan CRNN-CTC & info model lain."""
    hist_p = os.path.join(runtime.CONFIG_DIR, "crnn_training_history.json")
    crnn_hist: Dict[str, Any] = {}
    if os.path.exists(hist_p):
        with open(hist_p, "r", encoding="utf-8") as f:
            crnn_hist = json.load(f)
    return {
        "crnn": crnn_hist,
        "pretrained_models": {
            key: {"epochs_local": 0, "mode": "Pretrained ONNX Zero-Shot"}
            for key in ("tiny", "small", "medium", "ppocrv5", "dbnet_parseq")
        },
    }


@router.get("/experiment-overview")
def get_experiment_overview() -> Dict[str, Any]:
    """Mengembalikan ringkasan resmi Tahap A (755 citra), Tahap B ablasi, Edge, dan Kalibrasi."""
    res_dir = os.path.join(runtime.BASE_DIR, "data", "results")
    overview: Dict[str, Any] = {
        "calibration": runtime.CALIBRATION_PARAMS,
        "tahap_a": [],
        "tahap_b": [],
        "edge_profile": [],
        "champion": {},
    }
    for key, fname in (
        ("tahap_a", "tahap_a_summary.csv"),
        ("tahap_b", "tahap_b_ablation.csv"),
        ("edge_profile", "edge_profile.csv"),
    ):
        fp = os.path.join(res_dir, fname)
        if os.path.exists(fp):
            with open(fp, "r", encoding="utf-8") as f:
                overview[key] = list(csv.DictReader(f))

    champ_p = os.path.abspath(os.path.join(runtime.BASE_DIR, "..", "docs", "hasil_eksperimen", "champion_selection.json"))
    if os.path.exists(champ_p):
        with open(champ_p, "r", encoding="utf-8") as f:
            overview["champion"] = json.load(f)
    return overview


@router.post("/calibrate")
def run_calibration(
    model: str = Query("small", description="Pilihan varian model: small, tiny, medium, ppocrv5, crnn, dbnet_parseq"),
    use_all_frames: bool = Query(True, description="Gunakan seluruh 600 bingkai kalibrasi atau bingkai pertama saja"),
) -> Dict[str, Any]:
    """Mengoptimalkan suhu T pada dataset kalibrasi berlabel (data/calib)."""
    calib_meta_p = os.path.join(runtime.BASE_DIR, "data", "calib", "meta.jsonl")
    if not os.path.exists(calib_meta_p):
        raise HTTPException(status_code=404, detail="Berkas kalibrasi meta.jsonl tidak ditemukan")

    with open(calib_meta_p, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    raw_scores: List[float] = []
    labels: List[int] = []
    active_rec = runtime.get_recognizer(model)

    for item in records:
        frames = item.get("frames", [])
        f_gts = item.get("frame_ground_truths") or [item.get("ground_truth", "")] * len(frames)
        f_rois = item.get("frame_roi_bboxes")
        default_roi = item.get("roi_bbox")
        for idx in (range(len(frames)) if use_all_frames else [0]):
            if idx >= len(frames):
                continue
            frame_p = os.path.join(runtime.BASE_DIR, "data", "calib", "frames", frames[idx])
            if not os.path.exists(frame_p):
                continue
            img = cv2.imread(frame_p)
            if img is None:
                continue
            bbox = f_rois[idx] if (f_rois and idx < len(f_rois)) else default_roi
            crop = BenchmarkHarness._crop_bbox(img, bbox)
            gt_norm = StringNormalizer.normalize(str(f_gts[idx]))
            if not gt_norm or crop.size == 0:
                continue
            reading = active_rec.predict(crop)
            raw_scores.append(reading.raw_score)
            labels.append(1 if reading.normalized_text == gt_norm else 0)

    opt = CalibrationOptimizer()
    optimal_t = opt.fit_temperature(raw_scores, labels) if raw_scores else 1.0
    ece_before, bins_before = opt.calculate_ece(raw_scores, labels) if raw_scores else (0.0, [])
    runtime.calibration_v.temperature = optimal_t
    calibrated_scores = [runtime.calibration_v.scale_confidence(s) for s in raw_scores]
    ece_after, bins_after = opt.calculate_ece(calibrated_scores, labels) if raw_scores else (0.0, [])

    return {
        "status": "success",
        "model": model,
        "optimal_temperature": optimal_t,
        "ece_before": ece_before,
        "ece_after": ece_after,
        "samples_calibrated": len(raw_scores),
        "exact_match_count": int(sum(labels)),
        "reliability_bins_before": bins_before,
        "reliability_bins_after": bins_after,
    }
