"""CLI Runner Resmi untuk Eksekusi Eksperimen Skripsi (Kalibrasi, Tahap A, Tahap B, Edge)."""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.evaluation.experiment_runners import (
    run_calibration_stage,
    run_edge_profile,
    run_tahap_a,
    run_tahap_b,
)
from src.evaluation.plot_generator import generate_all_figures
from src.evaluation.report_freezer import freeze_all_reports
from src.evaluation.special_cases import extract_special_case_evidence
from src.models.registry import MODEL_ORDER


def main() -> None:
    parser = argparse.ArgumentParser(description="Runner Eksperimen Formal OCR Timbangan")
    parser.add_argument(
        "--stage",
        required=True,
        choices=["calib", "a", "b", "edge", "freeze", "all"],
        help="Tahap eksperimen: calib, a, b, edge, freeze (Bab IV), atau all",
    )
    parser.add_argument(
        "--models",
        default=",".join(MODEL_ORDER),
        help=f"Daftar model dipisahkan koma. Default: {','.join(MODEL_ORDER)}",
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=None,
        help="Batas sampel opsional untuk uji coba cepat (kosongkan untuk evaluasi penuh)",
    )
    parser.add_argument(
        "--max-silent-error",
        type=float,
        default=0.01,
        help="Batas silent error untuk penentuan ambang tau pada data kalibrasi (default: 0.01 = 1%%)",
    )
    args = parser.parse_args()

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.abspath(os.path.join(backend_dir, ".."))
    models = [m.strip() for m in args.models.split(",") if m.strip()]

    if args.stage in ("calib", "all"):
        print("[STAGE CALIB] Menjalankan kalibrasi T* & tau pada data/calib...")
        res = run_calibration_stage(
            base_dir=base_dir,
            backend_dir=backend_dir,
            models=models,
            max_silent_error=args.max_silent_error,
        )
        print(json.dumps(res, indent=2))

    if args.stage in ("a", "all"):
        print("[STAGE A] Menjalankan benchmark 6 model pada 755 citra terkunci...")
        rows_a = run_tahap_a(base_dir=base_dir, backend_dir=backend_dir, models=models, max_samples=args.max_samples)
        print(f"Selesai Tahap A: {len(rows_a)} baris ringkasan disimpan ke data/results/tahap_a_summary.csv")

    if args.stage in ("b", "all"):
        b_models = ["small"] if args.stage == "all" else models
        print(f"[STAGE B] Menjalankan uji ablasi 5 tingkat untuk model: {b_models}...")
        rows_b = run_tahap_b(base_dir=base_dir, backend_dir=backend_dir, models=b_models, max_samples=args.max_samples)
        print(f"Selesai Tahap B: {len(rows_b)} baris ablasi disimpan ke data/results/tahap_b_ablation.csv")

    if args.stage in ("edge", "all"):
        print("[STAGE EDGE] Menjalankan profiling memori & latensi CPU...")
        rows_edge = run_edge_profile(base_dir=base_dir, models=models)
        print(f"Selesai Edge Profile: {len(rows_edge)} model disimpan ke data/results/edge_profile.csv")

    if args.stage in ("freeze", "all"):
        repo_root = os.path.abspath(os.path.join(base_dir, ".."))
        docs_out_dir = os.path.join(repo_root, "docs", "hasil_eksperimen")
        summary = freeze_all_reports(base_dir=base_dir, backend_dir=backend_dir, docs_out_dir=docs_out_dir)
        champ = summary["champion"]["champion_edge"]
        figs = []
        for target_m in summary["champion"]["tahap_b_models"]:
            extract_special_case_evidence(base_dir=base_dir, docs_out_dir=docs_out_dir, model_key=target_m)
            figs.extend(generate_all_figures(base_dir=base_dir, backend_dir=backend_dir, docs_out_dir=docs_out_dir, champion_key=target_m))
        print(f"[STAGE FREEZE] Champion Edge={champ}; {len(set(figs))} grafik & tabel LaTeX dibekukan ke {docs_out_dir}")


if __name__ == "__main__":
    main()
