"""Modul Normalisasi String Hasil OCR (C4).

Mengacu pada Bab IV Pasal 4.4 Spesifikasi Arsitektur.
"""

import re
from typing import Optional


class StringNormalizer:
    """Melakukan standardisasi format teks angka timbangan."""

    @staticmethod
    def normalize(raw: Optional[str]) -> str:
        """Menormalisasi string mentah menjadi format numerik baku.

        Aturan:
        1. Mengganti koma (,) menjadi titik (.)
        2. Menghapus satuan (kg, g, lbs, net, tare, gross) case-insensitive
        3. Menghapus karakter spasi, tanda kutip, dan simbol non-numerik kecuali titik desimal
        4. Mempertahankan leading zero jika ada pada tampilan
        """
        if not raw or not isinstance(raw, str):
            return ""

        # 1. Lowercase dan konversi koma ke titik
        cleaned = raw.strip().lower().replace(",", ".")

        # 2. Hapus satuan dan teks penanda umum timbangan
        for unit in ["kg", "lbs", "lb", "gram", "g", "net", "tare", "gross", "hold", "zero"]:
            cleaned = re.sub(rf"\b{unit}\b", "", cleaned)

        # 3. Hapus spasi dan karakter non-digit kecuali titik
        # Hanya pertahankan digit '0'-'9' dan '.'
        filtered_chars = [ch for ch in cleaned if ch.isdigit() or ch == "."]
        result = "".join(filtered_chars)

        # 4. Tangani multi-titik desimal (hanya pertahankan titik pertama jika lebih dari satu)
        if result.count(".") > 1:
            parts = result.split(".")
            result = parts[0] + "." + "".join(parts[1:])

        return result

    @staticmethod
    def is_valid_format(normalized: str, max_length: int = 8) -> bool:
        """Memeriksa apakah string hasil normalisasi memiliki format yang sah."""
        if not normalized:
            return False
        if len(normalized) > max_length:
            return False
        # Harus mengandung setidaknya satu digit angka
        if not any(ch.isdigit() for ch in normalized):
            return False
        # Titik desimal tidak boleh lebih dari satu
        if normalized.count(".") > 1:
            return False
        return True
