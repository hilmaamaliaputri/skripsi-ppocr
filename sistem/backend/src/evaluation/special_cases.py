"""Ekstraksi Bukti Kuantitatif & Kasus Nyata EXP-17 (Unlit Segment, Glare, Ghost '8')."""

import csv
import json
import os
from typing import Any, Dict, List


def extract_special_case_evidence(
    base_dir: str, docs_out_dir: str, model_key: str = "small"
) -> Dict[str, Any]:
    """Membandingkan kinerja mentah vs +4-Lapis per kondisi lapangan & kasus ghost '8'."""
    res_dir = os.path.join(base_dir, "data", "results")
    raw_p = os.path.join(res_dir, f"tahap_a_{model_key}_raw.json")
    ver_p = os.path.join(res_dir, f"tahap_a_{model_key}_verified_4layer.json")
    if not os.path.exists(raw_p) or not os.path.exists(ver_p):
        return {"conditions": [], "ghost_examples": []}

    with open(raw_p, "r", encoding="utf-8") as f:
        raw_rep = json.load(f)
    with open(ver_p, "r", encoding="utf-8") as f:
        ver_rep = json.load(f)

    raw_conds = raw_rep["summary"]["by_condition"]
    ver_conds = ver_rep["summary"]["by_condition"]
    cond_rows: List[Dict[str, Any]] = []

    for cond, r_c in raw_conds.items():
        v_c = ver_conds.get(cond, {})
        cond_rows.append({
            "Model": model_key,
            "Kondisi": cond,
            "n": r_c["total_samples"],
            "FSR_Mentah_pct": r_c["model_metrics"]["fsr"],
            "SilentErr_Mentah_pct": r_c["verification_metrics"]["silent_error"],
            "Coverage_Verif_pct": v_c.get("verification_metrics", {}).get("coverage", 0.0),
            "SilentErr_Verif_pct": v_c.get("verification_metrics", {}).get("silent_error", 0.0),
            "SelectiveAcc_Verif_pct": v_c.get("verification_metrics", {}).get("selective_accuracy", 0.0),
        })

    # Ambil contoh kasus nyata digit hantu '8' atau salah baca akibat glare yang ditangkap guard
    ver_by_id = {s["id"]: s for s in ver_rep.get("sample_results", [])}
    ghost_examples: List[Dict[str, Any]] = []
    for s in raw_rep.get("sample_results", []):
        if s.get("is_correct"):
            continue
        vs = ver_by_id.get(s["id"], {})
        if vs.get("decision") in ("TOLAK", "KONFIRMASI"):
            is_ghost8 = ("8" in str(s.get("prediction", ""))) and len(str(s.get("prediction", ""))) > len(str(s.get("ground_truth", "")))
            if is_ghost8 or s.get("condition") in ("glare", "low_contrast_passive", "clean_frontal"):
                ghost_examples.append({
                    "sample_id": s["id"],
                    "condition": s["condition"],
                    "ground_truth": s["ground_truth"],
                    "raw_prediction": s["prediction"],
                    "raw_decision": s["decision"],
                    "verified_decision": vs.get("decision"),
                    "trigger_layer": vs.get("trigger_layer"),
                    "ghost8_pattern": is_ghost8,
                })

    os.makedirs(docs_out_dir, exist_ok=True)
    csv_path = os.path.join(docs_out_dir, f"tabel_4_kondisi_khusus_{model_key}.csv")
    if cond_rows:
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(cond_rows[0].keys()))
            w.writeheader()
            w.writerows(cond_rows)

    examples_path = os.path.join(docs_out_dir, f"kasus_khusus_examples_{model_key}.json")
    with open(examples_path, "w", encoding="utf-8") as f:
        json.dump(ghost_examples[:40], f, indent=2)

    return {
        "model": model_key,
        "conditions": cond_rows,
        "total_caught_cases": len(ghost_examples),
        "sample_cases": ghost_examples[:10],
    }
