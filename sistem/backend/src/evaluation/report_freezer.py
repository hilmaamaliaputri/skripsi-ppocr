"""Modul Pembekuan Artefak Akademik Bab IV (Tabel LaTeX, CSV, dan Pemilihan Champion)."""

import csv
import json
import os
from typing import Any, Dict, List, Optional, Tuple


MODEL_LABELS: Dict[str, str] = {
    "tiny": "PP-OCRv6 Tiny",
    "small": "PP-OCRv6 Small",
    "medium": "PP-OCRv6 Medium",
    "ppocrv5": "PP-OCRv5 Mobile",
    "crnn": "CRNN-CTC (Baseline)",
    "dbnet_parseq": "DBNet + PARSeq",
}

ABLATION_LABELS: Dict[str, Tuple[str, str]] = {
    "baseline_raw": ("Tanpa Verifikasi", "None (Baseline)"),
    "stage1_temporal": ("+ Uji Temporal", "L3 (Stabilitas 3-5 frame)"),
    "stage2_temporal_structural": ("+ Uji Struktur", "L3 + L1 (Slot ROI & Desimal)"),
    "stage3_temporal_structural_physical": ("+ Uji Fisik", "L3 + L1 + L2 (Rentang & Toleransi)"),
    "stage4_full_4layer": ("+ Uji Kalibrasi", "L3 + L1 + L2 + L4 (Suhu T* & tau)"),
}

CONDITION_LABELS: Dict[str, str] = {
    "clean_frontal": "Bersih Frontal (Clean)",
    "glare": "Pantulan Cahaya (Glare)",
    "tilt_15_30": "Sudut Miring 15-30 Derajat",
    "low_contrast_passive": "LCD Pasif Kontras Rendah",
    "wet_foggy": "Basah / Berkabut",
    "dusty_scratched": "Berdebu / Tergores",
    "sachaizadi_real": "Citra Riil SachaIZADI",
}


def _save_csv(path: str, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def _tex_escape(val: Any) -> str:
    return str(val).replace("_", "\\_").replace("%", "\\%").replace("&", "\\&")


def _write_latex_table(path: str, caption: str, label: str, headers: List[str], rows: List[List[Any]]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    col_spec = "l" + "r" * (len(headers) - 1)
    lines = [
        "\\begin{table}[htbp]",
        "\\centering",
        f"\\caption{{{caption}}}",
        f"\\label{{{label}}}",
        f"\\begin{{tabular}}{{{col_spec}}}",
        "\\hline",
        " & ".join(_tex_escape(h) for h in headers) + " \\\\",
        "\\hline",
    ]
    for row in rows:
        lines.append(" & ".join(_tex_escape(c) for c in row) + " \\\\")
    lines.extend(["\\hline", "\\end{tabular}", "\\end{table}"])
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def select_champion(summary_rows: List[Dict[str, Any]], max_edge_p95_ms: float = 50.0) -> Dict[str, Any]:
    """Memilih Champion objektif: FSR tertinggi di antara model layak edge (p95 <= batas)."""
    raw_rows = [r for r in summary_rows if r.get("mode") == "raw"]
    if not raw_rows:
        return {"champion_edge": "small", "champion_overall": "small", "tahap_b_models": ["small"]}

    by_fsr = sorted(raw_rows, key=lambda r: (-float(r["fsr_pct"]), float(r["latency_p95_ms"])))
    overall = by_fsr[0]["model"]
    edge_candidates = [r for r in by_fsr if float(r["latency_p95_ms"]) <= max_edge_p95_ms]
    edge_champ = edge_candidates[0]["model"] if edge_candidates else by_fsr[0]["model"]

    tahap_b = []
    for candidate in (edge_champ, "small", overall):
        if candidate not in tahap_b:
            tahap_b.append(candidate)

    return {
        "champion_edge": edge_champ,
        "champion_overall": overall,
        "edge_threshold_p95_ms": max_edge_p95_ms,
        "tahap_b_models": tahap_b[:2] if edge_champ == overall else tahap_b[:3],
    }


def freeze_all_reports(base_dir: str, backend_dir: str, docs_out_dir: str) -> Dict[str, Any]:
    """Membekukan seluruh artefak hasil eksperimen menjadi JSON, CSV, dan tabel LaTeX Bab IV."""
    res_dir = os.path.join(base_dir, "data", "results")
    os.makedirs(docs_out_dir, exist_ok=True)

    with open(os.path.join(backend_dir, "config", "calibration_params.json"), "r", encoding="utf-8") as f:
        calib_map = json.load(f)

    edge_rows: List[Dict[str, Any]] = []
    edge_p = os.path.join(res_dir, "edge_profile.json")
    if os.path.exists(edge_p):
        with open(edge_p, "r", encoding="utf-8") as f:
            edge_rows = json.load(f)
    edge_by_model = {r["model"]: r for r in edge_rows}

    summary_a: List[Dict[str, Any]] = []
    csv_a_p = os.path.join(res_dir, "tahap_a_summary.csv")
    if os.path.exists(csv_a_p):
        with open(csv_a_p, "r", encoding="utf-8") as f:
            summary_a = list(csv.DictReader(f))

    # Tabel 1: Komparasi 6 Model Tahap A (755 citra)
    raw_by_m = {r["model"]: r for r in summary_a if r["mode"] == "raw"}
    ver_by_m = {r["model"]: r for r in summary_a if r["mode"] == "verified_4layer"}
    t1_rows: List[Dict[str, Any]] = []
    t1_tex: List[List[Any]] = []
    for m_key, label in MODEL_LABELS.items():
        if m_key not in raw_by_m:
            continue
        rm, vm = raw_by_m[m_key], ver_by_m.get(m_key, {})
        em = edge_by_model.get(m_key, {})
        fsr_ci = f"{rm['fsr_pct']}% [{rm['fsr_ci95_low']}–{rm['fsr_ci95_high']}]"
        cer_ci = f"{rm['cer_pct']}% [{rm['cer_ci95_low']}–{rm['cer_ci95_high']}]"
        t1_rows.append({
            "Model": label,
            "Param": em.get("param_count", "-"),
            "n": rm["n"],
            "Raw_FSR_CI95": fsr_ci,
            "Raw_CER_CI95": cer_ci,
            "Raw_SilentErr_pct": rm["silent_error_pct"],
            "Verif_Coverage_pct": vm.get("coverage_pct", "-"),
            "Verif_SilentErr_pct": vm.get("silent_error_pct", "-"),
            "Verif_SelectiveAcc_pct": vm.get("selective_acc_pct", "-"),
            "AURC": vm.get("aurc", "-"),
            "p50_ms": rm["latency_p50_ms"],
            "p95_ms": rm["latency_p95_ms"],
        })
        t1_tex.append([
            label, fsr_ci, cer_ci,
            f"{rm['silent_error_pct']}%",
            f"{vm.get('coverage_pct', '-')}%",
            f"{vm.get('silent_error_pct', '-')}%",
            f"{vm.get('selective_acc_pct', '-')}%",
            f"{rm['latency_p50_ms']} / {rm['latency_p95_ms']}",
        ])

    _save_csv(os.path.join(docs_out_dir, "tabel_1_tahap_a.csv"), t1_rows)
    _write_latex_table(
        os.path.join(docs_out_dir, "tabel_1_tahap_a.tex"),
        "Perbandingan Enam Model OCR (Mode Mentah vs 4-Lapis Verifikasi) pada 755 Citra Uji Terkunci",
        "tab:tahap_a_komparasi",
        ["Model", "FSR Mentah [95% CI]", "CER Mentah [95% CI]", "Silent Err. Mentah", "Coverage Verif.", "Silent Err. Verif.", "Sel. Acc.", "Latensi p50/p95 (ms)"],
        t1_tex,
    )

    # Tabel 2: Ablasi Tahap B
    csv_b_p = os.path.join(res_dir, "tahap_b_ablation.csv")
    t2_rows: List[Dict[str, Any]] = []
    t2_tex: List[List[Any]] = []
    if os.path.exists(csv_b_p):
        with open(csv_b_p, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                lbl, detail = ABLATION_LABELS.get(r["ablation_stage"], (r["ablation_stage"], ""))
                t2_rows.append({
                    "Model": MODEL_LABELS.get(r["model"], r["model"]),
                    "Scope": r["scope"],
                    "Stage": lbl,
                    "Active_Layers": detail,
                    "n": r["n"],
                    "Coverage_pct": r["coverage_pct"],
                    "Rejection_pct": round(100.0 - float(r["coverage_pct"]), 2),
                    "SilentErr_pct": r["silent_error_pct"],
                    "SelectiveAcc_pct": r["selective_acc_pct"],
                    "AURC": r["aurc"],
                })
                t2_tex.append([
                    MODEL_LABELS.get(r["model"], r["model"]),
                    r["scope"], lbl,
                    f"{r['coverage_pct']}%",
                    f"{r['silent_error_pct']}%",
                    f"{r['selective_acc_pct']}%",
                    r["aurc"],
                ])
    _save_csv(os.path.join(docs_out_dir, "tabel_2_tahap_b_ablasi.csv"), t2_rows)
    _write_latex_table(
        os.path.join(docs_out_dir, "tabel_2_tahap_b_ablasi.tex"),
        "Hasil Uji Ablasi Verifikasi 4-Lapis (Urutan Fail-Fast: Temporal -> Struktural -> Fisik -> Kalibrasi)",
        "tab:tahap_b_ablasi",
        ["Model", "Dataset", "Tahap", "Coverage", "Silent Error", "Sel. Acc.", "AURC"],
        t2_tex,
    )

    # Tabel 3: Kalibrasi & Profil Edge
    t3_rows: List[Dict[str, Any]] = []
    t3_tex: List[List[Any]] = []
    for m_key, label in MODEL_LABELS.items():
        cm = calib_map.get(m_key, {})
        em = edge_by_model.get(m_key, {})
        t3_rows.append({
            "Model": label,
            "Calib_n": cm.get("samples", 0),
            "T_star": cm.get("optimal_temperature", "-"),
            "Tau_locked": cm.get("locked_threshold", "-"),
            "ECE_before": cm.get("ece_before", "-"),
            "ECE_after": cm.get("ece_after", "-"),
            "Cold_Load_ms": em.get("cold_load_ms", "-"),
            "RSS_After_MB": em.get("rss_after_mb", "-"),
            "Calib_p50_ms": em.get("latency_p50_ms", "-"),
            "Calib_p95_ms": em.get("latency_p95_ms", "-"),
        })
        t3_tex.append([
            label, cm.get("optimal_temperature", "-"), cm.get("locked_threshold", "-"),
            cm.get("ece_before", "-"), cm.get("ece_after", "-"),
            em.get("cold_load_ms", "-"), em.get("rss_after_mb", "-"),
            f"{em.get('latency_p50_ms', '-')}/{em.get('latency_p95_ms', '-')}",
        ])
    _save_csv(os.path.join(docs_out_dir, "tabel_3_kalibrasi_dan_edge.csv"), t3_rows)
    _write_latex_table(
        os.path.join(docs_out_dir, "tabel_3_kalibrasi_dan_edge.tex"),
        "Hasil Kalibrasi Suhu (n=600) dan Profil Efisiensi Komputasi Edge CPU",
        "tab:kalibrasi_edge",
        ["Model", "T*", "Tau", "ECE Awal", "ECE Akhir", "Load (ms)", "RSS (MB)", "p50/p95 (ms)"],
        t3_tex,
    )

    champ_info = select_champion(summary_a)
    with open(os.path.join(docs_out_dir, "champion_selection.json"), "w", encoding="utf-8") as f:
        json.dump(champ_info, f, indent=2)
    return {"champion": champ_info, "tabel_1_count": len(t1_rows), "tabel_2_count": len(t2_rows)}
