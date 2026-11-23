"""Uji End-to-End FastAPI Endpoint (Evaluator & Operator Workstation + Audit SQLite)."""

import base64
import os
import tempfile
import unittest
import cv2
import numpy as np
from fastapi.testclient import TestClient

import main as api_main
from src.engine.audit_logger import AuditLogger
from src.pipeline.schema import DecisionContract, DecisionState


def _encode_png_b64(text: str = "25.00") -> str:
    img = np.full((48, 160, 3), 245, dtype=np.uint8)
    cv2.putText(img, text, (10, 36), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (15, 15, 15), 2)
    ok, buf = cv2.imencode(".png", img)
    assert ok
    return "data:image/png;base64," + base64.b64encode(buf.tobytes()).decode("ascii")


class TestFastAPIEndpoints(unittest.TestCase):
    """Menguji API Evaluator & Operator (4 status keputusan + SQLite Audit Log)."""

    def setUp(self):
        self._tmp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self._orig_logger = api_main.audit_logger
        api_main.audit_logger = AuditLogger(audit_dir=self._tmp_dir.name)
        self.client = TestClient(api_main.app)

    def tearDown(self):
        api_main.audit_logger = self._orig_logger
        import gc
        gc.collect()
        self._tmp_dir.cleanup()

    def test_health_and_configs(self):
        r_health = self.client.get("/api/health")
        self.assertEqual(r_health.status_code, 200)
        self.assertEqual(r_health.json()["status"], "online")

        r_prod = self.client.get("/api/config/products")
        r_dev = self.client.get("/api/config/devices")
        self.assertEqual(r_prod.status_code, 200)
        self.assertEqual(r_dev.status_code, 200)
        self.assertIn("beras_25kg", r_prod.json())
        self.assertTrue(len(r_dev.json()) > 0)

    def test_comparison_matrix_and_static_ui(self):
        r_mat = self.client.get("/api/eval/comparison-matrix")
        self.assertEqual(r_mat.status_code, 200)
        self.assertGreaterEqual(len(r_mat.json()), 4)

        r_hist = self.client.get("/api/eval/training-history")
        self.assertEqual(r_hist.status_code, 200)
        self.assertIn("pretrained_models", r_hist.json())

        r_ov = self.client.get("/api/eval/experiment-overview")
        self.assertEqual(r_ov.status_code, 200)
        self.assertIn("tahap_a", r_ov.json())

        r_eval_html = self.client.get("/")
        r_op_html = self.client.get("/operator")
        self.assertEqual(r_eval_html.status_code, 200)
        self.assertEqual(r_op_html.status_code, 200)

    def test_process_burst_and_audit_summary(self):
        b64 = _encode_png_b64("25.00")
        resp = self.client.post(
            "/api/process-burst",
            json={
                "frames_base64": [b64, b64, b64],
                "product_id": "beras_25kg",
                "device_id": "mettler_lcd_white",
                "model_variant": "tiny",
            },
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn(body["decision"], {"TERIMA", "TOLAK", "KONFIRMASI", "BATAL"})
        self.assertEqual(len(body["frames"]), 3)

        # Catat 4 skenario keputusan ke AuditLogger sementara lalu verifikasi summary
        for idx, state in enumerate(
            (DecisionState.TERIMA, DecisionState.TOLAK, DecisionState.KONFIRMASI, DecisionState.BATAL)
        ):
            api_main.audit_logger.log_decision(
                DecisionContract(
                    reading="25.00" if state != DecisionState.BATAL else "",
                    decision=state,
                    trigger_layer=None if state == DecisionState.TERIMA else "L1",
                    reason=f"Uji E2E {state.value}",
                    calibrated_score=0.95 if state == DecisionState.TERIMA else 0.4,
                    threshold_applied=0.54,
                    product_id="beras_25kg",
                    device_id="mettler_lcd_white",
                )
            )
        summary = self.client.get("/api/transactions/summary").json()
        self.assertGreaterEqual(summary.get("total", 0), 5)
        for key in ("terima", "tolak", "konfirmasi", "batal"):
            self.assertGreaterEqual(summary.get(key, 0), 1)


if __name__ == "__main__":
    unittest.main()
