"""Unit & Integration Test Suite untuk Seluruh Modul Backend Sistem OCR.

Menguji normalizer, profiler, verifier (L1-L4), engine keputusan,
dan benchmark harness.
"""

import os
import sys
import numpy as np

# Ensure parent directory (sistem/backend) is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.pipeline.normalizer import StringNormalizer
from src.pipeline.schema import DecisionState, ReadingContract, SlotProfile
from src.vision.preprocessor import ImagePreprocessor
from src.vision.slot_profiler import SlotProfiler
from src.verification.v_temporal import TemporalVerifier
from src.verification.v_structural import StructuralVerifier
from src.verification.v_physical import PhysicalVerifier
from src.verification.v_calibration import CalibrationVerifier
from src.engine.decision_engine import DecisionEngine
from src.engine.audit_logger import AuditLogger
from src.evaluation.calibration_optimizer import CalibrationOptimizer
from src.evaluation.risk_coverage import RiskCoverageAnalyzer
from src.evaluation.metrics import EvaluationMetrics


# 1. Test Normalizer
def test_normalizer():
    assert StringNormalizer.normalize(" 25,00 kg ") == "25.00"
    assert StringNormalizer.normalize("1006.50 kg Net") == "1006.50"
    assert StringNormalizer.normalize("05.20kg") == "05.20"
    assert StringNormalizer.is_valid_format("25.00") is True
    assert StringNormalizer.is_valid_format("abc") is False


# 2. Test Preprocessor
def test_preprocessor():
    prep = ImagePreprocessor()
    dummy = np.ones((100, 200, 3), dtype=np.uint8) * 120
    crop = prep.crop_roi(dummy, [10, 10, 50, 50])
    assert crop.shape == (40, 40, 3)

    enhanced = prep.enhance_contrast(crop)
    assert enhanced.shape == crop.shape

    bin_img = prep.binarize(crop)
    assert len(bin_img.shape) == 2


# 3. Test Slot Profiler
def test_slot_profiler():
    profiler = SlotProfiler()
    dummy_panel = np.zeros((60, 240, 3), dtype=np.uint8)
    # Draw 4 vertical white bars to simulate 4 digits
    for x in [30, 80, 130, 180]:
        dummy_panel[10:50, x : x + 15] = 255
    # Draw a small dot at bottom right to simulate decimal
    dummy_panel[48:54, 150:156] = 255

    profile = profiler.profile(dummy_panel, expected_slots=6)
    assert isinstance(profile, SlotProfile)
    assert profile.detected_slots >= 2


# 4. Test L3 Temporal Verifier
def test_temporal_verifier():
    v = TemporalVerifier(min_agreement_ratio=0.8)
    # 4 dari 5 cocok -> Lolos
    passed, res, reading = v.verify(["25.00", "25.00", "25.05", "25.00", "25.00"])
    assert passed is True
    assert reading == "25.00"
    assert res.passed is True

    # 2 dari 5 beda -> Gagal
    passed, res, reading = v.verify(["25.00", "24.50", "25.00", "24.50", "26.00"])
    assert passed is False


# 5. Test L1 Structural Verifier
def test_structural_verifier():
    v = StructuralVerifier()
    # 4 digit pada 6 slot + desimal -> Lolos
    passed, res = v.verify("25.00", expected_slots=6, require_decimal=True)
    assert passed is True

    # 7 digit pada 6 slot -> TOLAK (kelebihan slot)
    passed, res = v.verify("8825.000", expected_slots=6, require_decimal=True)
    assert passed is False
    assert "melebihi kapasitas" in res.reason


# 6. Test L2 Physical Verifier
def test_physical_verifier():
    configs = {
        "beras_25kg": {"min_weight": 24.70, "max_weight": 25.40, "tolerance": 0.50}
    }
    v = PhysicalVerifier(product_configs=configs)

    # 25.02 kg dalam rentang beras_25kg -> Lolos
    passed, res = v.verify("25.02", product_id="beras_25kg")
    assert passed is True

    # 2.50 kg di luar rentang -> TOLAK
    passed, res = v.verify("2.50", product_id="beras_25kg")
    assert passed is False
    assert "di luar batas produk" in res.reason


# 7. Test L4 Calibration Verifier
def test_calibration_verifier():
    v = CalibrationVerifier(temperature=1.2, threshold=0.85)
    # High raw score
    passed, res, cal_score = v.verify(0.98)
    assert passed is True
    assert cal_score > 0.85

    # Low raw score
    passed, res, cal_score = v.verify(0.40)
    assert passed is False


# 8. Test Decision Engine Cascading
def test_decision_engine():
    configs = {
        "beras_25kg": {"min_weight": 24.70, "max_weight": 25.40, "tolerance": 0.50}
    }
    engine = DecisionEngine(
        temporal_verifier=TemporalVerifier(min_agreement_ratio=0.8),
        structural_verifier=StructuralVerifier(),
        physical_verifier=PhysicalVerifier(product_configs=configs),
        calibration_verifier=CalibrationVerifier(temperature=1.0, threshold=0.80),
    )

    # Normal valid burst -> TERIMA
    burst_readings = [
        ReadingContract(
            model_name="ppocrv6", raw_text="25.00", normalized_text="25.00",
            raw_score=0.95, latency_ms=45.0
        )
        for _ in range(5)
    ]
    dec = engine.evaluate_burst(burst_readings, product_id="beras_25kg", expected_slots=6)
    assert dec.decision == DecisionState.TERIMA
    assert dec.reading == "25.00"

    # Glitch value (8825.00) -> TOLAK di L2 atau L1
    bad_readings = [
        ReadingContract(
            model_name="ppocrv6", raw_text="8825.00", normalized_text="8825.00",
            raw_score=0.95, latency_ms=45.0
        )
        for _ in range(5)
    ]
    dec_bad = engine.evaluate_burst(bad_readings, product_id="beras_25kg", expected_slots=6)
    assert dec_bad.decision == DecisionState.TOLAK


# 9. Test Calibration Optimizer & Risk-Coverage
def test_calibration_and_risk():
    opt = CalibrationOptimizer()
    confidences = [0.99, 0.95, 0.80, 0.70, 0.60, 0.40]
    labels = [1, 1, 1, 0, 0, 0]

    opt_t = opt.fit_temperature(confidences, labels)
    assert opt_t > 0.0

    ece, bins = opt.calculate_ece(confidences, labels, n_bins=3)
    assert 0.0 <= ece <= 1.0

    analyzer = RiskCoverageAnalyzer()
    aurc, curve_pts = analyzer.compute_curve(confidences, labels, sample_step=1)
    assert 0.0 <= aurc <= 1.0
    assert len(curve_pts) > 0


# 10. Test Evaluation Metrics & Levenshtein
def test_evaluation_metrics():
    dist = EvaluationMetrics.levenshtein_distance("1006.5", "106.5")
    assert dist == 1

    model_m = EvaluationMetrics.calculate_model_metrics(
        predictions=["25.00", "10.50", "5.00"],
        ground_truths=["25.00", "10.55", "5.00"],
    )
    assert model_m["exact_matches"] == 2
    assert model_m["fsr"] == 66.67


if __name__ == "__main__":
    tests = [
        ("test_normalizer", test_normalizer),
        ("test_preprocessor", test_preprocessor),
        ("test_slot_profiler", test_slot_profiler),
        ("test_temporal_verifier", test_temporal_verifier),
        ("test_structural_verifier", test_structural_verifier),
        ("test_physical_verifier", test_physical_verifier),
        ("test_calibration_verifier", test_calibration_verifier),
        ("test_decision_engine", test_decision_engine),
        ("test_calibration_and_risk", test_calibration_and_risk),
        ("test_evaluation_metrics", test_evaluation_metrics),
    ]

    print("=" * 60)
    print("MENJALANKAN SUITE PENGUJIAN MODUL SISTEM BACKEND")
    print("=" * 60)
    passed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"PASS: {name}")
            passed += 1
        except Exception as e:
            print(f"FAIL: {name} - {e}")

    print("=" * 60)
    print(f"HASIL AKHIR: {passed}/{len(tests)} SUITE BERHASIL")
    print("=" * 60)
    if passed < len(tests):
        sys.exit(1)

