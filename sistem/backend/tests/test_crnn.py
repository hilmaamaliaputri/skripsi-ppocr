"""Unit Test untuk Arsitektur Model CRNN-CTC, Dataset Loader, dan Greedy Decoder."""

import unittest
import numpy as np
import torch

from src.training.crnn_model import CRNN, NUM_CLASSES, VOCAB
from src.training.dataset import CTCLabelConverter, ScaleDataset, crnn_collate_fn
from src.models.crnn_onnx import CRNNOnnxRecognizer


class TestCRNNPipeline(unittest.TestCase):
    def test_vocab_and_tokens(self):
        """Verifikasi bahwa token blank berada pada indeks 0 dan total token tepat 12."""
        self.assertEqual(VOCAB[0], "<BLANK>")
        self.assertEqual(NUM_CLASSES, 12)

    def test_ctc_encoder_decoder(self):
        """Uji encoding string bobot dan decoding greedy collapse."""
        target_str = "25.00"
        tokens = CTCLabelConverter.encode(target_str)
        self.assertTrue(len(tokens) > 0)

        # Simulasi logits untuk string 25.00
        # Time steps T=10, Classes=12
        T = 10
        logits = torch.zeros(T, NUM_CLASSES)

        # Set token 2 di t=1,2, blank di t=3, token 5 di t=4,5, dst.
        logits[1, CTCLabelConverter.encode("2")[0]] = 10.0
        logits[2, CTCLabelConverter.encode("2")[0]] = 10.0
        logits[3, 0] = 10.0  # Blank
        logits[4, CTCLabelConverter.encode("5")[0]] = 10.0
        logits[5, CTCLabelConverter.encode(".")[0]] = 10.0
        logits[6, CTCLabelConverter.encode("0")[0]] = 10.0

        decoded_text, conf = CTCLabelConverter.decode_greedy(logits)
        self.assertEqual(decoded_text, "25.0")
        self.assertGreater(conf, 0.5)

    def test_crnn_forward_shape(self):
        """Uji forward pass CRNN menghasilkan tensor (T=31, B=2, C=12)."""
        model = CRNN(num_classes=NUM_CLASSES)
        model.eval()

        dummy_input = torch.randn(2, 1, 32, 128)
        with torch.no_grad():
            output = model(dummy_input)

        T, B, C = output.size()
        self.assertEqual(B, 2)
        self.assertEqual(C, NUM_CLASSES)
        self.assertEqual(T, 31)

    def test_crnn_onnx_recognizer_empty(self):
        """Uji perilaku CRNNOnnxRecognizer saat citra kosong."""
        rec = CRNNOnnxRecognizer(model_path="non_existent.onnx")
        res = rec.predict(np.zeros((32, 128), dtype=np.uint8))
        self.assertEqual(res.raw_text, "")
        self.assertEqual(res.raw_score, 0.0)


if __name__ == "__main__":
    unittest.main()
