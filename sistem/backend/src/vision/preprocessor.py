"""Modul Pra-Pemrosesan Citra Display Timbangan (C2).

Fokus pada perbaikan kontras, reduksi silau (glare), dan ekstraksi ROI.
"""

from typing import List, Optional, Tuple, Union
import cv2
import numpy as np


class ImagePreprocessor:
    """Menyediakan fungsi transformasi citra sebelum inferensi dan profiling."""

    def __init__(self, clip_limit: float = 2.5, tile_grid_size: Tuple[int, int] = (8, 8)):
        self.clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)

    def crop_roi(
        self, image: np.ndarray, bbox: Optional[Union[List[int], Tuple[int, int, int, int]]] = None
    ) -> np.ndarray:
        """Memotong area Region of Interest (ROI) display berdasarkan koordinat [x1, y1, x2, y2]."""
        if bbox is None:
            return image

        x1, y1, x2, y2 = bbox
        h, w = image.shape[:2]
        x1 = max(0, min(int(x1), w - 1))
        y1 = max(0, min(int(y1), h - 1))
        x2 = max(x1 + 1, min(int(x2), w))
        y2 = max(y1 + 1, min(int(y2), h))
        return image[y1:y2, x1:x2]

    def enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Meningkatkan kontras lokal menggunakan CLAHE untuk display berkontras rendah."""
        if len(image.shape) == 2:
            return self.clahe.apply(image)

        # Ubah ke LAB color space untuk menyamakan luminansi
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        enhanced_l = self.clahe.apply(l)
        enhanced_lab = cv2.merge((enhanced_l, a, b))
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    def reduce_glare(self, image: np.ndarray) -> np.ndarray:
        """Meredam pantulan cahaya menggunakan bilateral filter."""
        return cv2.bilateralFilter(image, d=9, sigmaColor=75, sigmaSpace=75)

    def binarize(self, image: np.ndarray, invert: bool = False) -> np.ndarray:
        """Melakukan binarisasi adaptif Otsu untuk segmentasi segmen aktif."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Otsu thresholding
        thresh_type = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY
        _, binary = cv2.threshold(blurred, 0, 255, thresh_type + cv2.THRESH_OTSU)
        return binary
