"""Matriks Komparasi Multi-Model Berbasis Hasil Eksperimen Riil (755 Citra Uji Terkunci).

Membaca luaran resmi batch evaluasi Tahap A (`data/results/tahap_a_summary.csv`),
profil komputasi edge (`data/results/edge_profile.json`), dan data kalibrasi.
"""

import csv
import json
import os
from typing import Any, Dict, List

MODEL_META: Dict[str, Dict[str, str]] = {
    "tiny": {
        "name": "PP-OCRv6 Tiny",
        "size": "6.0 MB (ONNX)",
        "params": "1.50M",
        "arch": "PP-LCNet + SVTR",
    },
    "tiny_ft": {
        "name": "PP-OCRv6 Tiny (Fine-Tuned)",
        "size": "5.8 MB (ONNX)",
        "params": "1.50M",
        "arch": "PP-LCNet + SVTR (FT 12-cls)",
    },
    "small": {
        "name": "PP-OCRv6 Small",
        "size": "18.0 MB (ONNX)",
        "params": "7.70M",
        "arch": "PP-LCNetV2 + Multi-Head SVTR",
    },
    "medium": {
        "name": "PP-OCRv6 Medium",
        "size": "45.0 MB (ONNX)",
        "params": "34.5M",
        "arch": "PP-HGNet + Global Context SVTR",
    },
    "ppocrv5": {
        "name": "PP-OCRv5 Mobile",
        "size": "15.9 MB (ONNX)",
        "params": "4.11M",
        "arch": "PPLCNetV3 + SVTR-HGNet",
    },
    "crnn": {
        "name": "CRNN-CTC (Baseline 2016)",
        "size": "24.3 MB (ONNX)",
        "params": "0.85M / 6.35M",
        "arch": "CNN 5-Block + BiLSTM 2-Layer + CTC",
    },
    "dbnet_parseq": {
        "name": "DBNet + PARSeq (2-Stage)",
        "size": "101.5 MB (ONNX)",
        "params": "26.30M",
        "arch": "DBNet++ ResNet/LC + Permutation LM",
    },
}


def _count_ghost8_passes(results_dir: str, model_key: str, mode: str) -> str:
    """Menghitung kasus digit hantu '8' berlebih atau kegagalan L1 pada 755 citra."""
    fp = os.path.join(results_dir, f"tahap_a_{model_key}_{mode}.json")
    if not os.path.exists(fp):
        return "-"
    with open(fp, "r", encoding="utf-8") as f:
        samples = json.load(f).get("sample_results", [])
    ghost_count = sum(
        1
        for s in samples
        if s.get("decision") == "TERIMA"
        and not s.get("is_correct")
        and len(str(s.get("prediction", ""))) > len(str(s.get("ground_truth", "")))
        and "8" in str(s.get("prediction", ""))
    )
    return f"{ghost_count} sampel lolos"


def get_all_model_comparisons(results_dir: str = "") -> List[Dict[str, Any]]:
    """Mengembalikan tabel komparasi riil 6 model (Mentah vs 4-Lapis Verifikasi)."""
    if not results_dir:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        results_dir = os.path.join(base_dir, "data", "results")

    summary_csv = os.path.join(results_dir, "tahap_a_summary.csv")
    if not os.path.exists(summary_csv):
        return []

    with open(summary_csv, "r", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    edge_map: Dict[str, Dict[str, Any]] = {}
    edge_json = os.path.join(results_dir, "edge_profile.json")
    if os.path.exists(edge_json):
        with open(edge_json, "r", encoding="utf-8") as f:
            edge_map = {r["model"]: r for r in json.load(f)}

    raw_rows = [r for r in rows if r["mode"] == "raw"]
    best_edge = min(
        (r for r in raw_rows if float(r["latency_p95_ms"]) <= 50.0),
        key=lambda r: (-float(r["fsr_pct"]), float(r["latency_p95_ms"])),
        default=None,
    )
    champ_key = best_edge["model"] if best_edge else "tiny"

    matrix: List[Dict[str, Any]] = []
    for r in rows:
        m_key = r["model"]
        meta = MODEL_META.get(m_key, {"name": m_key, "size": "-", "params": "-", "arch": "-"})
        is_verif = r["mode"] == "verified_4layer"
        verif_tag = "+ 4-Lapis Verifikasi" if is_verif else "(Baseline Mentah)"
        em = edge_map.get(m_key, {})

        is_champ = is_verif and m_key == champ_key
        rec_note = (
            f"Champion Edge (n={r['n']}; p95 {r['latency_p95_ms']} ms, AURC {r['aurc']})"
            if is_champ
            else (
                f"Silent error turun -> {r['silent_error_pct']}% pada n={r['n']}"
                if is_verif
                else f"Baseline mentah tanpa guard (Silent Error {r['silent_error_pct']}%)"
            )
        )

        matrix.append({
            "variantKey": m_key,
            "variantName": f"{meta['name']} {verif_tag}",
            "tierLabel": f"{meta['name']} {'Terverifikasi' if is_verif else 'Mentah'}",
            "size": meta["size"],
            "paramCount": str(em.get("param_count") or meta["params"]),
            "latency": f"{r['latency_p50_ms']} ms (p95: {r['latency_p95_ms']} ms)",
            "verifMode": "Aktif (Fail-Fast L3->L1->L2->L4)" if is_verif else "Nonaktif",
            "unlitFilter": "Aktif" if is_verif else "Nonaktif",
            "fsr": f"{r['fsr_pct']}% [{r['fsr_ci95_low']}–{r['fsr_ci95_high']}%]",
            "cer": f"{r['cer_pct']}%",
            "false8": _count_ghost8_passes(results_dir, m_key, r["mode"]),
            "silentError": f"{r['silent_error_pct']}%",
            "coverage": f"{r['coverage_pct']}%",
            "selectiveAcc": f"{r['selective_acc_pct']}%",
            "aurc": str(r["aurc"]),
            "recommendation": rec_note,
            "isThesisChoice": is_champ,
            "architecture": meta["arch"],
        })
    return matrix
