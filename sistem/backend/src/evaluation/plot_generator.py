"""Generator Grafik Publikasi Bab IV (PNG 300 DPI) dari Artefak Eksperimen Nyata."""

import csv
import json
import os
from typing import Any, Dict, List

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from .report_freezer import MODEL_LABELS


def generate_all_figures(base_dir: str, backend_dir: str, docs_out_dir: str, champion_key: str = "small") -> List[str]:
    """Menghasilkan grafik formal Bab IV dari hasil JSON & CSV eksperimen riil."""
    res_dir = os.path.join(base_dir, "data", "results")
    fig_dir = os.path.join(docs_out_dir, "figures")
    os.makedirs(fig_dir, exist_ok=True)
    generated: List[str] = []

    plt.rcParams.update({"font.size": 9, "axes.grid": True, "grid.alpha": 0.25})

    # Fig 1: Komparasi 6 Model Tahap A (Silent Error Mentah vs Terverifikasi + FSR)
    csv_a = os.path.join(res_dir, "tahap_a_summary.csv")
    if os.path.exists(csv_a):
        with open(csv_a, "r", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        raw_m = {r["model"]: r for r in rows if r["mode"] == "raw"}
        ver_m = {r["model"]: r for r in rows if r["mode"] == "verified_4layer"}
        keys = [k for k in MODEL_LABELS if k in raw_m]
        labels = [MODEL_LABELS[k] for k in keys]
        raw_se = [float(raw_m[k]["silent_error_pct"]) for k in keys]
        ver_se = [float(ver_m[k]["silent_error_pct"]) for k in keys]
        raw_fsr = [float(raw_m[k]["fsr_pct"]) for k in keys]

        x = np.arange(len(keys))
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11.5, 4.3))
        ax1.bar(x - 0.18, raw_se, width=0.35, label="Baseline Mentah", color="#dc2626")
        ax1.bar(x + 0.18, ver_se, width=0.35, label="+ 4-Lapis Verifikasi", color="#16a34a")
        ax1.set_title("Silent Error (%) pada 755 Citra Uji Terkunci")
        ax1.set_xticks(x, labels, rotation=22, ha="right")
        ax1.set_ylabel("Silent Error (%)")
        ax1.legend()

        lats = [float(raw_m[k]["latency_p95_ms"]) for k in keys]
        ax2.scatter(lats, raw_fsr, s=90, color="#2563eb", zorder=3)
        for lx, ly, lb in zip(lats, raw_fsr, labels):
            ax2.annotate(lb, (lx, ly), textcoords="offset points", xytext=(5, 4), fontsize=8)
        ax2.axvline(50.0, color="#ea580c", linestyle="--", linewidth=1, label="Batas Edge 50 ms")
        ax2.set_title("Trade-off FSR Mentah (%) vs Latensi p95 CPU (ms)")
        ax2.set_xlabel("Latensi p95 (ms)")
        ax2.set_ylabel("FSR Mentah (%)")
        ax2.legend()

        fig.tight_layout()
        p1 = os.path.join(fig_dir, "fig1_komparasi_6_model.png")
        fig.savefig(p1, dpi=300)
        plt.close(fig)
        generated.append(p1)

    # Fig 2: Progres Ablasi Tahap B (Burst 120 vs Unified 755)
    csv_b = os.path.join(res_dir, "tahap_b_ablation.csv")
    if os.path.exists(csv_b):
        with open(csv_b, "r", encoding="utf-8") as f:
            b_rows = [r for r in csv.DictReader(f) if r["model"] == champion_key]
        if b_rows:
            stages = ["Tanpa Verif.", "+Temporal", "+Struktural", "+Fisik", "+Kalibrasi"]
            burst = [r for r in b_rows if r["scope"] == "burst_120"]
            u755 = [r for r in b_rows if r["scope"] == "unified_755"]

            fig, ax = plt.subplots(figsize=(8.2, 4.3))
            if len(burst) == 5:
                xb = np.arange(5)
                ax.plot(xb, [float(r["silent_error_pct"]) for r in burst], marker="o", linewidth=2, color="#dc2626", label="Silent Error (Burst 120)")
                ax.plot(xb, [float(r["coverage_pct"]) for r in burst], marker="s", linewidth=2, color="#2563eb", label="Coverage (Burst 120)")
            if len(u755) == 5:
                xb = np.arange(5)
                ax.plot(xb, [float(r["silent_error_pct"]) for r in u755], marker="^", linestyle="--", color="#991b1b", label="Silent Error (755 Citra)")
                ax.plot(xb, [float(r["coverage_pct"]) for r in u755], marker="d", linestyle="--", color="#1e40af", label="Coverage (755 Citra)")
            ax.set_xticks(np.arange(5), stages)
            ax.set_ylabel("Persentase (%)")
            ax.set_title(f"Kurva Ablasi Tahap B ({MODEL_LABELS.get(champion_key, champion_key)})")
            ax.legend()
            fig.tight_layout()
            p2 = os.path.join(fig_dir, f"fig2_ablasi_{champion_key}.png")
            fig.savefig(p2, dpi=300)
            plt.close(fig)
            generated.append(p2)

    # Fig 3: Reliability Diagram Sebelum vs Sesudah Kalibrasi
    cal_p = os.path.join(backend_dir, "config", "calibration_params.json")
    if os.path.exists(cal_p):
        with open(cal_p, "r", encoding="utf-8") as f:
            cal = json.load(f)
        if champion_key in cal and "reliability_bins_before" in cal[champion_key]:
            b_bef = cal[champion_key]["reliability_bins_before"]
            b_aft = cal[champion_key]["reliability_bins_after"]
            fig, ax = plt.subplots(figsize=(6.4, 4.8))
            ax.plot([0, 1], [0, 1], "--", color="gray", label="Kalibrasi Ideal")
            ax.plot([b["confidence"] for b in b_bef if b["count"] > 0], [b["accuracy"] for b in b_bef if b["count"] > 0],
                    marker="o", color="#dc2626", label=f"Sebelum (ECE={cal[champion_key]['ece_before']})")
            ax.plot([b["confidence"] for b in b_aft if b["count"] > 0], [b["accuracy"] for b in b_aft if b["count"] > 0],
                    marker="s", color="#16a34a", label=f"Sesudah T*={cal[champion_key]['optimal_temperature']} (ECE={cal[champion_key]['ece_after']})")
            ax.set_title(f"Reliability Diagram Kalibrasi ({MODEL_LABELS.get(champion_key, champion_key)}, n=600)")
            ax.set_xlabel("Confidence Rata-Rata Bin")
            ax.set_ylabel("Akurasi Empiris Bin")
            ax.set_xlim(0, 1)
            ax.set_ylim(0, 1)
            ax.legend()
            fig.tight_layout()
            p3 = os.path.join(fig_dir, f"fig3_reliability_{champion_key}.png")
            fig.savefig(p3, dpi=300)
            plt.close(fig)
            generated.append(p3)

    return generated
