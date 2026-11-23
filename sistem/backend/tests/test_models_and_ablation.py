"""Unit Test untuk Model PP-OCRv5, DBNet+PARSeq, Ablasi Lapis L1-L4, dan Harness 755."""

import json
import os
import tempfile
import unittest
import cv2
import numpy as np

from src.engine.decision_engine import DecisionEngine
from src.evaluation.harness import BenchmarkHarness
from src.models.dbnet_parseq import DBNetPARSeqRecognizer
from src.models.ppocrv5_onnx import PPOCRv5OnnxRecognizer
from src.pipeline.schema import DecisionState, ReadingContract, SlotProfile
from src.verification.v_calibration import CalibrationVerifier
from src.verification.v_physical import PhysicalVerifier


def _make_digit_image(width: int = 160, height: int = 48, text: str = "25.00") -> np.ndarray:
    """Membuat citra sintetis angka gelap di atas latar terang untuk uji inferensi."""
    img = np.full((height, width, 3), 240, dtype=np.uint8)
    cv2.putText(img, text, (12, int(height * 0.72)), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (20, 20, 20), 2)
    return img


class TestNewModelsAndAblation(unittest.TestCase):
    """Menguji wrapper PP-OCRv5, DBNet+PARSeq, mode ablasi DecisionEngine, dan Harness 755."""

    def test_ppocrv5_empty_and_synthetic(self):
        rec = PPOCRv5OnnxRecognizer()
        with self.assertRaises(ValueError):
            rec.predict(np.zeros((0, 0, 3), dtype=np.uint8))

        # Uji rasio aspek normal dan rasio sangat lebar (melebihi max_wh_ratio 10.0)
        for width in (160, 540):
            res = rec.predict(_make_digit_image(width=width, height=48, text="25.00"))
            self.assertEqual(res.model_name, "ppocrv5_mobile")
            self.assertEqual(res.param_count, 4113256)
            self.assertEqual(res.version, "5.0.0")
            self.assertGreaterEqual(res.raw_score, 0.0)
            self.assertLessEqual(res.raw_score, 1.0)
            self.assertGreaterEqual(res.latency_ms, 0.0)

    def test_dbnet_parseq_empty_and_synthetic(self):
        rec = DBNetPARSeqRecognizer()
        with self.assertRaises(ValueError):
            rec.predict(np.zeros((0, 0, 3), dtype=np.uint8))

        res = rec.predict(_make_digit_image(width=180, height=56, text="24.5"))
        self.assertEqual(res.model_name, "dbnet_parseq")
        self.assertEqual(res.param_count, 26296439)
        self.assertEqual(res.version, "dbnet+parseq")
        self.assertGreaterEqual(res.raw_score, 0.0)
        self.assertLessEqual(res.raw_score, 1.0)
        self.assertGreaterEqual(res.latency_ms, 0.0)

    def test_decision_engine_ablation_modes(self):
        phys = PhysicalVerifier(product_configs={"beras_25kg": {"min_weight": 20.0, "max_weight": 30.0}})
        cal = CalibrationVerifier(temperature=1.0, threshold=0.85)
        engine = DecisionEngine(physical_verifier=phys, calibration_verifier=cal)

        # Burst dengan nilai di luar rentang fisik (99.90 > 30.0) dan skor rendah (0.60 < 0.85)
        bad_phys_readings = [
            ReadingContract(model_name="ppocrv6_small", raw_text="99.90", normalized_text="99.90", raw_score=0.60, latency_ms=10.0),
            ReadingContract(model_name="ppocrv6_small", raw_text="99.90", normalized_text="99.90", raw_score=0.60, latency_ms=10.0),
            ReadingContract(model_name="ppocrv6_small", raw_text="99.90", normalized_text="99.90", raw_score=0.60, latency_ms=10.0),
        ]
        slot_ok = SlotProfile(detected_slots=4, expected_slots=4, has_decimal_point=True, decimal_position_from_right=2)

        # Baseline mentah (tanpa lapis): langsung TERIMA
        d_raw = engine.evaluate_burst(
            bad_phys_readings, slot_profile=slot_ok, product_id="beras_25kg", expected_slots=4, active_layers=set()
        )
        self.assertEqual(d_raw.decision, DecisionState.TERIMA)
        self.assertIsNone(d_raw.trigger_layer)

        # +L3 saja (Temporal konsisten -> lolos ke TERIMA)
        d_l3 = engine.evaluate_burst(
            bad_phys_readings, slot_profile=slot_ok, product_id="beras_25kg", expected_slots=4, active_layers={"L3"}
        )
        self.assertEqual(d_l3.decision, DecisionState.TERIMA)

        # +L3+L1 pada jumlah digit melebihi slot display (misal ghost digit '8825.00' = 6 digit > 4 slot) -> ditolak L1 Struktural
        ghost_readings = [
            ReadingContract(model_name="ppocrv6_small", raw_text="8825.00", normalized_text="8825.00", raw_score=0.95, latency_ms=10.0),
        ] * 3
        d_l31_fail = engine.evaluate_burst(
            ghost_readings, slot_profile=slot_ok, product_id="beras_25kg", expected_slots=4, active_layers={"L3", "L1"}
        )
        self.assertEqual(d_l31_fail.decision, DecisionState.TOLAK)
        self.assertEqual(d_l31_fail.trigger_layer, "L1")

        # +L3+L1+L2 -> ditolak oleh L2 karena > max_weight 30.0
        d_l312 = engine.evaluate_burst(
            bad_phys_readings, slot_profile=slot_ok, product_id="beras_25kg", expected_slots=4, active_layers={"L3", "L1", "L2"}
        )
        self.assertEqual(d_l312.decision, DecisionState.TOLAK)
        self.assertEqual(d_l312.trigger_layer, "L2")

        # +L3 (Temporal) pada burst yang tidak konsisten -> KONFIRMASI di L3
        unstable_readings = [
            ReadingContract(model_name="ppocrv6_small", raw_text="25.00", normalized_text="25.00", raw_score=0.95, latency_ms=10.0),
            ReadingContract(model_name="ppocrv6_small", raw_text="28.00", normalized_text="28.00", raw_score=0.95, latency_ms=10.0),
            ReadingContract(model_name="ppocrv6_small", raw_text="21.00", normalized_text="21.00", raw_score=0.95, latency_ms=10.0),
        ]
        d_l3_unstable = engine.evaluate_burst(
            unstable_readings, slot_profile=slot_ok, product_id="beras_25kg", expected_slots=4, active_layers={"L3"}
        )
        self.assertEqual(d_l3_unstable.decision, DecisionState.KONFIRMASI)
        self.assertEqual(d_l3_unstable.trigger_layer, "L3")

        # +L3+L1+L2+L4 pada skor rendah tapi valid fisik & stabil -> KONFIRMASI di L4
        low_conf_readings = [
            ReadingContract(model_name="ppocrv6_small", raw_text="25.00", normalized_text="25.00", raw_score=0.60, latency_ms=10.0),
            ReadingContract(model_name="ppocrv6_small", raw_text="25.00", normalized_text="25.00", raw_score=0.60, latency_ms=10.0),
            ReadingContract(model_name="ppocrv6_small", raw_text="25.00", normalized_text="25.00", raw_score=0.60, latency_ms=10.0),
        ]
        d_full = engine.evaluate_burst(
            low_conf_readings,
            slot_profile=slot_ok,
            product_id="beras_25kg",
            expected_slots=4,
            active_layers={"L3", "L1", "L2", "L4"},
        )
        self.assertEqual(d_full.decision, DecisionState.KONFIRMASI)
        self.assertEqual(d_full.trigger_layer, "L4")

    def test_harness_unified_755_schema_with_temp_fixture(self):
        class _DummyRec:
            def predict(self, crop):
                return ReadingContract(
                    model_name="dummy",
                    raw_text="25.00",
                    normalized_text="25.00",
                    raw_score=0.95,
                    latency_ms=5.0,
                )

        with tempfile.TemporaryDirectory() as tmp:
            uji_dir = os.path.join(tmp, "dataset_uji")
            img_dir = os.path.join(uji_dir, "images")
            os.makedirs(img_dir, exist_ok=True)
            cv2.imwrite(os.path.join(img_dir, "f1.png"), _make_digit_image(text="25.00"))
            cv2.imwrite(os.path.join(img_dir, "f2.png"), _make_digit_image(text="12.50"))

            manifest_uji = [
                {"id": "s1", "folder_id": "K0000", "source": "synthetic", "filename": "f1.png", "ground_truth": "25.00", "total_slots": 4},
                {"id": "s2", "folder_id": "sacha", "source": "sachaizadi_test_split", "filename": "f2.png", "ground_truth": "12.50", "total_slots": 4},
            ]
            with open(os.path.join(uji_dir, "manifest.json"), "w", encoding="utf-8") as f:
                json.dump(manifest_uji, f)

            locked_p = os.path.join(tmp, "locked_manifest.json")
            with open(locked_p, "w", encoding="utf-8") as f:
                json.dump([{"id": "K0000", "condition": "glare", "product_profile": "beras_25kg", "theme_key": "t1"}], f)

            harness = BenchmarkHarness(recognizer=_DummyRec(), base_dir=tmp)
            res = harness.run_unified_755(
                dataset_uji_dir=uji_dir,
                locked_manifest_path=locked_p,
                active_layers=set(),
            )

            self.assertEqual(res["summary"]["total_samples"], 2)
            self.assertIn("fsr_ci_95", res["summary"]["model_metrics"])
            self.assertIn("cer_ci_95", res["summary"]["model_metrics"])
            self.assertIn("glare", res["summary"]["by_condition"])
            self.assertIn("sachaizadi_real", res["summary"]["by_condition"])
            self.assertEqual(res["summary"]["model_metrics"]["fsr"], 50.0)

    def test_experiment_runner_helpers(self):
        from src.evaluation.edge_profiler import get_process_rss_mb
        from src.evaluation.experiment_runners import ABLATION_CONFIGS
        from src.evaluation.risk_coverage import RiskCoverageAnalyzer
        from src.models.registry import MODEL_ORDER

        self.assertEqual(len(MODEL_ORDER), 6)
        self.assertEqual(len(ABLATION_CONFIGS), 5)
        self.assertEqual(ABLATION_CONFIGS[1][1], {"L3"})
        rss = get_process_rss_mb()
        self.assertGreater(rss, 0.0)

        rc = RiskCoverageAnalyzer()
        op = rc.find_operating_threshold([0.99, 0.90, 0.80, 0.70], [1, 1, 0, 1], max_silent_error=0.01, min_coverage=0.50)
        self.assertGreaterEqual(op["achieved_coverage"], 0.50)


if __name__ == "__main__":
    unittest.main()
