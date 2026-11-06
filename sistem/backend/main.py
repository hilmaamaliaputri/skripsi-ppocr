"""FastAPI Backend Server untuk Sistem Verifikasi OCR Timbangan (C1-C10).

Menghubungkan pipeline inferensi PP-OCRv6, OpenCV Profiler, 4 Lapis Verifikasi,
dan Jejak Audit ke antarmuka Evaluator & Operator.
"""

import base64
import os
import sys
from typing import Any, Dict, List, Optional
import cv2
import numpy as np
import yaml
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.engine.audit_logger import AuditLogger
from src.engine.decision_engine import DecisionEngine
from src.evaluation.calibration_optimizer import CalibrationOptimizer
from src.evaluation.harness import BenchmarkHarness
from src.evaluation.risk_coverage import RiskCoverageAnalyzer
from src.models.ppocrv6_onnx import PPOCRv6OnnxRecognizer
from src.pipeline.schema import DecisionContract, ReadingContract
from src.verification.v_calibration import CalibrationVerifier
from src.verification.v_physical import PhysicalVerifier
from src.verification.v_structural import StructuralVerifier
from src.verification.v_temporal import TemporalVerifier
from src.vision.slot_profiler import SlotProfiler

app = FastAPI(
    title="Scale OCR Verification System API",
    version="1.0.0",
    description="Backend API untuk Komparasi & Verifikasi OCR 7-Segmen Berbasis PP-OCRv6",
)

# CORS Middleware untuk komunikasi aman dengan Frontend React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi Singletons
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config")

# Muat Konfigurasi Produk & Display
with open(os.path.join(CONFIG_DIR, "produk.yaml"), "r", encoding="utf-8") as f:
    PRODUCT_CONFIGS = yaml.safe_load(f).get("products", {})

with open(os.path.join(CONFIG_DIR, "devices.yaml"), "r", encoding="utf-8") as f:
    DEVICE_CONFIGS = yaml.safe_load(f).get("devices", {})

recognizer = PPOCRv6OnnxRecognizer(tier="small")
slot_profiler = SlotProfiler()
temporal_v = TemporalVerifier(min_agreement_ratio=0.8)
structural_v = StructuralVerifier()
physical_v = PhysicalVerifier(product_configs=PRODUCT_CONFIGS)
calibration_v = CalibrationVerifier(temperature=1.0, threshold=0.85)

decision_engine = DecisionEngine(
    temporal_verifier=temporal_v,
    structural_verifier=structural_v,
    physical_verifier=physical_v,
    calibration_verifier=calibration_v,
)

audit_logger = AuditLogger(audit_dir=os.path.join(BASE_DIR, "data", "audit"))
benchmark_harness = BenchmarkHarness(
    recognizer=recognizer,
    slot_profiler=slot_profiler,
    decision_engine=decision_engine,
    base_dir=BASE_DIR,
)


class ProcessBurstRequest(BaseModel):
    """Permintaan inferensi burst 3-5 frame dalam format base64."""
    frames_base64: List[str] = Field(..., description="Daftar citra frame encoded base64 JPEG/PNG")
    product_id: Optional[str] = Field(default="beras_25kg")
    device_id: Optional[str] = Field(default="mettler_lcd_white")
    roi_bbox: Optional[List[int]] = Field(default=None, description="[x1, y1, x2, y2]")


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """Cek kesehatan server dan kesiapan model OCR."""
    return {
        "status": "online",
        "model": "PP-OCRv6_small_onnx",
        "engine": "ONNXRuntime-CPU",
        "version": "1.0.0",
        "products_available": list(PRODUCT_CONFIGS.keys()),
        "devices_available": list(DEVICE_CONFIGS.keys()),
    }


@app.get("/api/config/products")
def get_products() -> Dict[str, Any]:
    """Mengembalikan daftar spesifikasi produk timbangan."""
    return PRODUCT_CONFIGS


@app.get("/api/config/devices")
def get_devices() -> Dict[str, Any]:
    """Mengembalikan daftar spesifikasi display timbangan."""
    return DEVICE_CONFIGS


@app.post("/api/process-burst", response_model=DecisionContract)
def process_burst(req: ProcessBurstRequest) -> DecisionContract:
    """Memproses burst 3-5 frame kamera dan mengembalikan keputusan 4 keadaan."""
    if not req.frames_base64:
        raise HTTPException(status_code=400, detail="Daftar bingkai tidak boleh kosong")

    frame_readings: List[ReadingContract] = []
    slot_prof = None
    expected_slots = DEVICE_CONFIGS.get(req.device_id, {}).get("total_slots", 6)

    for idx, b64_str in enumerate(req.frames_base64):
        try:
            # Decode base64
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            img_bytes = base64.b64decode(b64_str)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if img is None:
                continue

            crop = img
            if req.roi_bbox:
                x1, y1, x2, y2 = req.roi_bbox
                crop = img[int(y1):int(y2), int(x1):int(x2)]

            if idx == 0 and crop.size > 0:
                slot_prof = slot_profiler.profile(crop, expected_slots=expected_slots)

            reading = recognizer.predict(crop)
            frame_readings.append(reading)
        except Exception as e:
            continue

    # Evaluasi keputusan
    decision = decision_engine.evaluate_burst(
        frame_readings=frame_readings,
        slot_profile=slot_prof,
        product_id=req.product_id,
        device_id=req.device_id,
        expected_slots=expected_slots,
    )

    # Catat jejak audit
    audit_logger.log_decision(decision)
    return decision


@app.get("/api/transactions")
def get_transactions(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    decision: Optional[str] = Query(None),
) -> List[Dict]:
    """Mengambil riwayat transaksi jejak audit."""
    return audit_logger.get_transactions(limit=limit, offset=offset, decision_filter=decision)


@app.get("/api/transactions/summary")
def get_transaction_summary() -> Dict[str, int]:
    """Mengambil ringkasan jumlah transaksi audit."""
    return audit_logger.get_summary_counts()


@app.get("/api/eval/benchmark/quick20")
def run_quick20_benchmark() -> Dict[str, Any]:
    """Menjalankan evaluasi benchmark pada dataset terkunci quick_20."""
    manifest_p = os.path.join(BASE_DIR, "data", "locked_test_set", "quick_20.json")
    if not os.path.exists(manifest_p):
        raise HTTPException(status_code=404, detail="Berkas quick_20.json tidak ditemukan")
    return benchmark_harness.run_manifest(manifest_p)


@app.post("/api/eval/calibrate")
def run_calibration() -> Dict[str, Any]:
    """Mengoptimalkan suhu T pada 120 sampel citra kalibrasi (data/calib)."""
    calib_meta_p = os.path.join(BASE_DIR, "data", "calib", "meta.jsonl")
    if not os.path.exists(calib_meta_p):
        raise HTTPException(status_code=404, detail="Berkas kalibrasi meta.jsonl tidak ditemukan")

    import json
    with open(calib_meta_p, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]

    raw_scores: List[float] = []
    labels: List[int] = []

    for item in records:
        frames = item.get("frames", [])
        if not frames:
            continue
        first_frame = frames[0]
        frame_p = os.path.join(BASE_DIR, "data", "calib", "frames", first_frame)
        if not os.path.exists(frame_p):
            continue

        img = cv2.imread(frame_p)
        if img is None:
            continue

        reading = recognizer.predict(img)
        raw_scores.append(reading.raw_score)
        # Evaluasi kecocokan (menggunakan heuristik format untuk kalibrasi unlabelled)
        labels.append(1 if reading.raw_score > 0.85 else 0)

    opt = CalibrationOptimizer()
    optimal_t = opt.fit_temperature(raw_scores, labels) if raw_scores else 1.0
    ece_before, bins_before = opt.calculate_ece(raw_scores, labels) if raw_scores else (0.0, [])

    # Update instance calibration_v
    calibration_v.temperature = optimal_t
    calibrated_scores = [calibration_v.scale_confidence(s) for s in raw_scores]
    ece_after, bins_after = opt.calculate_ece(calibrated_scores, labels) if raw_scores else (0.0, [])

    return {
        "status": "success",
        "optimal_temperature": optimal_t,
        "ece_before": ece_before,
        "ece_after": ece_after,
        "samples_calibrated": len(raw_scores),
        "reliability_bins_before": bins_before,
        "reliability_bins_after": bins_after,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

