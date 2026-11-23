"""Modul Profiling Efisiensi Edge (Memori RSS, Waktu Muat, Latensi CPU) untuk EXP-22."""

import csv
import ctypes
from ctypes import wintypes
import json
import os
import time
from typing import Any, Dict, List, Sequence
import numpy as np

from ..models.registry import MODEL_ORDER, create_recognizer


class _PROCESS_MEMORY_COUNTERS(ctypes.Structure):
    _fields_ = [
        ("cb", wintypes.DWORD),
        ("PageFaultCount", wintypes.DWORD),
        ("PeakWorkingSetSize", ctypes.c_size_t),
        ("WorkingSetSize", ctypes.c_size_t),
        ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
        ("QuotaPagedPoolUsage", ctypes.c_size_t),
        ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
        ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
        ("PagefileUsage", ctypes.c_size_t),
        ("PeakPagefileUsage", ctypes.c_size_t),
    ]


def get_process_rss_mb() -> float:
    """Mengambil konsumsi memori Working Set (RSS) proses aktif dalam satuan MB."""
    if os.name == "nt":
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel32.GetCurrentProcess.restype = wintypes.HANDLE
        k32_mem = getattr(kernel32, "K32GetProcessMemoryInfo", None)
        if k32_mem is None:
            k32_mem = ctypes.WinDLL("psapi", use_last_error=True).GetProcessMemoryInfo
        k32_mem.argtypes = [wintypes.HANDLE, ctypes.POINTER(_PROCESS_MEMORY_COUNTERS), wintypes.DWORD]
        k32_mem.restype = wintypes.BOOL

        counters = _PROCESS_MEMORY_COUNTERS()
        counters.cb = ctypes.sizeof(counters)
        if k32_mem(kernel32.GetCurrentProcess(), ctypes.byref(counters), counters.cb):
            return round(counters.WorkingSetSize / (1024 * 1024), 2)
    else:
        try:
            import resource
            return round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024.0, 2)
        except Exception:
            pass
    return 0.0


def run_edge_profile(
    base_dir: str,
    crops: List[np.ndarray],
    models: Sequence[str] = MODEL_ORDER,
) -> List[Dict[str, Any]]:
    """Mengukur cold load ms, RSS RAM MB, dan latensi p50/p95 CPU pada daftar crop kalibrasi."""
    out_dir = os.path.join(base_dir, "data", "results")
    os.makedirs(out_dir, exist_ok=True)
    rows: List[Dict[str, Any]] = []

    for model_key in models:
        rss_before = get_process_rss_mb()
        t0 = time.perf_counter()
        rec = create_recognizer(model_key)
        load_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        if crops:
            _ = rec.predict(crops[0])
        rss_after = get_process_rss_mb()

        latencies = [rec.predict(c).latency_ms for c in crops]
        sample_contract = rec.predict(crops[0]) if crops else None
        rows.append({
            "model": model_key,
            "param_count": sample_contract.param_count if sample_contract else 0,
            "cold_load_ms": load_ms,
            "rss_before_mb": rss_before,
            "rss_after_mb": rss_after,
            "rss_delta_mb": round(max(0.0, rss_after - rss_before), 2),
            "n_crops": len(crops),
            "latency_p50_ms": round(float(np.percentile(latencies, 50)) if latencies else 0.0, 2),
            "latency_p95_ms": round(float(np.percentile(latencies, 95)) if latencies else 0.0, 2),
        })

    json_p = os.path.join(out_dir, "edge_profile.json")
    merged = {}
    if os.path.exists(json_p):
        with open(json_p, "r", encoding="utf-8") as f:
            merged = {r["model"]: r for r in json.load(f)}
    for r in rows:
        merged[r["model"]] = r
    ordered_rows = [merged[m] for m in MODEL_ORDER if m in merged]

    with open(json_p, "w", encoding="utf-8") as f:
        json.dump(ordered_rows, f, indent=2)

    if ordered_rows:
        with open(os.path.join(out_dir, "edge_profile.csv"), "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(ordered_rows[0].keys()))
            writer.writeheader()
            writer.writerows(ordered_rows)
    return ordered_rows
