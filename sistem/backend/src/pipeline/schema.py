"""Kontrak Data dan Skema Sistem Verifikasi Timbangan 7-Segmen.

Mengacu pada Bab IV Spesifikasi Arsitektur (spesifikasi/main.tex).
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DecisionState(str, Enum):
    """Empat status keputusan akhir sistem."""
    TERIMA = "TERIMA"
    TOLAK = "TOLAK"
    KONFIRMASI = "KONFIRMASI"
    BATAL = "BATAL"


class ReadingContract(BaseModel):
    """Kontrak data keluaran pengenal teks OCR."""
    model_name: str = Field(..., description="Nama model inferensi, e.g. ppocrv6_small")
    raw_text: str = Field(..., description="String mentah keluaran OCR")
    normalized_text: str = Field(..., description="String hasil normalisasi baku")
    raw_score: float = Field(..., ge=0.0, le=1.0, description="Rata-rata confidence mentah")
    latency_ms: float = Field(..., ge=0.0, description="Waktu inferensi satu bacaan (ms)")
    param_count: int = Field(default=7700000, description="Estimasi jumlah parameter model")
    version: str = Field(default="6.1.0", description="Versi model dan arsitektur")


class SlotProfile(BaseModel):
    """Hasil analisis visual profil slot OpenCV (C2)."""
    detected_slots: int = Field(..., ge=0, description="Jumlah slot digit aktif/terdeteksi")
    expected_slots: int = Field(..., ge=0, description="Jumlah slot acuan dari profil perangkat")
    has_decimal_point: bool = Field(default=False, description="Apakah titik desimal terdeteksi")
    decimal_position_from_right: Optional[int] = Field(
        default=None, description="Posisi titik desimal dihitung dari digit terkanan"
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class LayerResult(BaseModel):
    """Hasil evaluasi dari satu lapis verifikasi."""
    layer_id: str = Field(..., description="ID Lapis: L1, L2, L3, atau L4")
    passed: bool = Field(..., description="Status kelulusan lapis")
    reason: str = Field(..., description="Keterangan singkat hasil pengujian")
    details: Dict[str, Any] = Field(default_factory=dict, description="Metrik detail pendukung")


class DecisionContract(BaseModel):
    """Kontrak keputusan verifikasi (spesifikasi/main.tex Bab IV)."""
    reading: str = Field(..., description="String berat yang disetujui atau dievaluasi")
    decision: DecisionState = Field(..., description="Status keputusan: TERIMA/TOLAK/KONFIRMASI/BATAL")
    trigger_layer: Optional[str] = Field(
        default=None, description="Lapis pertama yang memicu penolakan/konfirmasi (L1/L2/L3/L4)"
    )
    reason: str = Field(..., description="Alasan keputusan yang dapat dibaca operator")
    calibrated_score: float = Field(..., ge=0.0, le=1.0, description="Skor setelah Temperature Scaling")
    threshold_applied: float = Field(..., ge=0.0, le=1.0, description="Nilai ambang yang berlaku")
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="Cap waktu ISO 8601"
    )
    product_id: Optional[str] = Field(default=None, description="ID produk aktif")
    device_id: Optional[str] = Field(default=None, description="ID perangkat display timbangan")
    layer_results: List[LayerResult] = Field(default_factory=list, description="Rincian hasil seluruh lapis")
