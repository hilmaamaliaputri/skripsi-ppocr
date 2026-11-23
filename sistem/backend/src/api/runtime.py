"""Konfigurasi singleton, lazy recognizer cache, dan utilitas runtime API."""

import json
import os
import sys
from typing import Any, Dict, Optional, Tuple
import yaml
from fastapi import HTTPException

from ..engine.audit_logger import AuditLogger
from ..engine.decision_engine import DecisionEngine
from ..evaluation.harness import BenchmarkHarness
from ..models.registry import MODEL_FACTORIES
from ..verification.v_calibration import CalibrationVerifier
from ..verification.v_physical import PhysicalVerifier
from ..verification.v_structural import StructuralVerifier
from ..verification.v_temporal import TemporalVerifier
from ..vision.slot_profiler import SlotProfiler

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
CONFIG_DIR = os.path.join(BACKEND_DIR, "config")


def _load_yaml_section(filename: str, section: str) -> Dict[str, Any]:
    path = os.path.join(CONFIG_DIR, filename)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f).get(section, {})


PRODUCT_CONFIGS: Dict[str, Any] = _load_yaml_section("produk.yaml", "products")
DEVICE_CONFIGS: Dict[str, Any] = _load_yaml_section("devices.yaml", "devices")

_CALIB_PATH = os.path.join(CONFIG_DIR, "calibration_params.json")
CALIBRATION_PARAMS: Dict[str, Any] = {}
if os.path.exists(_CALIB_PATH):
    with open(_CALIB_PATH, "r", encoding="utf-8") as _cf:
        CALIBRATION_PARAMS = json.load(_cf)

_recognizer_cache: Dict[str, Any] = {}


def get_recognizer(variant: Optional[str] = "small") -> Any:
    """Lazy loader untuk 6 model pembanding OCR."""
    key = variant or "small"
    if key not in MODEL_FACTORIES:
        raise HTTPException(status_code=400, detail=f"Varian model tidak dikenal: {key}")
    if key not in _recognizer_cache:
        _recognizer_cache[key] = MODEL_FACTORIES[key]()
    return _recognizer_cache[key]


def get_calib_pair(variant: Optional[str]) -> Tuple[float, float]:
    """Mengambil pasangan (T*, tau) resmi hasil kalibrasi."""
    cfg = CALIBRATION_PARAMS.get(variant or "small", {})
    return float(cfg.get("optimal_temperature", 1.0)), float(cfg.get("locked_threshold", 0.85))


_init_temp, _init_tau = get_calib_pair("small")
slot_profiler = SlotProfiler()
temporal_v = TemporalVerifier(min_agreement_ratio=0.8)
structural_v = StructuralVerifier()
physical_v = PhysicalVerifier(product_configs=PRODUCT_CONFIGS)
calibration_v = CalibrationVerifier(temperature=_init_temp, threshold=_init_tau)

decision_engine = DecisionEngine(
    temporal_verifier=temporal_v,
    structural_verifier=structural_v,
    physical_verifier=physical_v,
    calibration_verifier=calibration_v,
)

audit_logger = AuditLogger(audit_dir=os.path.join(BASE_DIR, "data", "audit"))
benchmark_harness = BenchmarkHarness(
    recognizer=None,
    slot_profiler=slot_profiler,
    decision_engine=decision_engine,
    base_dir=BASE_DIR,
)


def get_active_audit_logger() -> AuditLogger:
    """Mendukung injeksi audit_logger dari main saat pengujian unit/E2E."""
    main_mod = sys.modules.get("main")
    if main_mod is not None and hasattr(main_mod, "audit_logger"):
        return main_mod.audit_logger
    return audit_logger
