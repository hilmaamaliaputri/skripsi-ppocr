"""Modul Analisis Profil Proyeksi Slot Tujuh Segmen OpenCV (C2).

Mengidentifikasi jumlah slot digit fisik aktif dan keberadaan titik desimal
berdasarkan analisis proyeksi horizontal dan vertikal.
"""

from typing import Optional, Tuple
import cv2
import numpy as np
from scipy.signal import find_peaks

from ..pipeline.schema import SlotProfile
from .preprocessor import ImagePreprocessor


class SlotProfiler:
    """Melakukan profiling geometri slot digit pada citra display 7-segmen."""

    def __init__(self, preprocessor: Optional[ImagePreprocessor] = None):
        self.prep = preprocessor or ImagePreprocessor()

    def profile(
        self, crop_image: np.ndarray, expected_slots: int = 6
    ) -> SlotProfile:
        """Menganalisis citra crop display untuk mendeteksi slot aktif dan titik desimal."""
        if crop_image is None or crop_image.size == 0:
            return SlotProfile(detected_slots=0, expected_slots=expected_slots, has_decimal_point=False)

        h, w = crop_image.shape[:2]
        gray = cv2.cvtColor(crop_image, cv2.COLOR_BGR2GRAY) if len(crop_image.shape) == 3 else crop_image

        # 1. Binarisasi adaptif untuk memisahkan latar belakang dan segmen
        # Cek apakah segmen lebih terang (LED) atau lebih gelap (LCD)
        mean_border = (
            float(np.mean(gray[0, :]))
            + float(np.mean(gray[-1, :]))
            + float(np.mean(gray[:, 0]))
            + float(np.mean(gray[:, -1]))
        ) / 4.0
        mean_center = np.mean(gray[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4])
        is_led = mean_center > mean_border

        thresh_flag = cv2.THRESH_BINARY if is_led else cv2.THRESH_BINARY_INV
        _, binary = cv2.threshold(gray, 0, 255, thresh_flag + cv2.THRESH_OTSU)

        # 2. Proyeksi vertikal V(x): jumlah piksel putih per kolom
        vertical_proj = np.sum(binary == 255, axis=0).astype(np.float32)

        # Normalisasi profil vertikal
        max_v = np.max(vertical_proj)
        if max_v > 0:
            norm_v = vertical_proj / max_v
        else:
            norm_v = vertical_proj

        # 3. Deteksi lembah dan puncak untuk mengidentifikasi digit
        # Lebar minimum digit diperkirakan dari lebar citra dibagi jumlah slot yang diharapkan
        min_digit_width = max(int(w / (expected_slots * 2.5)), 5)
        peaks, properties = find_peaks(norm_v, height=0.25, distance=min_digit_width)

        detected_count = len(peaks)
        if detected_count == 0:
            detected_count = expected_slots

        # 4. Deteksi Titik Desimal pada 35% area bawah citra
        bottom_region = binary[int(h * 0.65) : h, :]
        bottom_proj = np.sum(bottom_region == 255, axis=0).astype(np.float32)
        has_decimal = False
        decimal_pos: Optional[int] = None

        # Temukan kontur kecil di sepertiga bawah
        contours, _ = cv2.findContours(bottom_region, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            x_c, y_c, w_c, h_c = cv2.boundingRect(cnt)
            # Titik desimal biasanya memiliki rasio aspek mendekati 1:1 dan ukuran kecil
            if 4 <= area <= (h * w * 0.05) and 0.5 <= (w_c / float(h_c + 1e-5)) <= 2.2:
                has_decimal = True
                # Hitung posisi relatif dari kanan terhadap digit
                dot_center_x = x_c + w_c / 2.0
                digits_to_right = sum(1 for p in peaks if p > dot_center_x)
                decimal_pos = max(1, digits_to_right)
                break

        return SlotProfile(
            detected_slots=detected_count,
            expected_slots=expected_slots,
            has_decimal_point=has_decimal,
            decimal_position_from_right=decimal_pos,
            confidence=0.95 if detected_count > 0 else 0.5,
        )
