# Progress Log

## 2026-10-24
- Rapid review 25 sumber (S01–S25), fokus 2023–2026.
- Peta gap: 6 celah, 4 kandidat outline.
- Keputusan: belum ada. Menunggu bimbingan.

## 2026-10-27
- Bimbingan terlaksana. Empat kandidat diajukan.
- **Keputusan: kandidat K1 dipilih** (verifikasi kontekstual, bentuk TA sistem/Varian B).
- **Keputusan data: data latih boleh sintetis, test set tetap memuat foto nyata.**
- Belum diputuskan: judul final, batas sistem, ambang target metrik, daftar pembanding.
- Berikutnya: finalisasi kerangka (W1) dan spesifikasi dataset. Lihat `docs/02-rencana-mingguan.md`.
- Draf laporan untuk pembimbing: `docs/laporan/draft-laporan-01.md`.

## 2026-10-29
- **Fokus dipersempit ke lapisan model.** Kandidat yang dipakai: **K1 dan K3**.
- K2 dan K4 tidak dipakai; berkasnya dihapus dari `docs/outline/`.
- Tahap A (K3): komparasi enam model pada data dan metrik yang sama.
- Tahap B (K1): verifikasi empat lapis pada model terpilih.
- Sistem (antarmuka, basis data, uji operator) **ditunda** ke tahap terpisah.
- Rancangan lengkap: `outline-model/main.tex` — LaTeX 25 halaman dan Word 24 halaman.

## 2026-11-06
- **Yang dikerjakan:**
  1. Riset teknis PP-OCRv6, OpenCV slot profiling, temperature scaling, dan prinsip anti-slop industrial UI (`docs/01-...`, `docs/02-...`, `docs/03-...`).
  2. Implementasi **Fase 1: Backend Pipeline Modular & Verifikasi 4-Lapis** (`sistem/backend/`) berbasis FastAPI + ONNX Runtime PP-OCRv6 + OpenCV:
     - 10 modul independen (<300 baris per berkas, modular anti-monolit).
     - 10/10 unit tests berhasil lolos di `tests/test_all_modules.py`.
     - Dokumentasi lengkap di `docs/04-hasil-implementasi-fase1-backend.md`.
  3. Implementasi **Fase 2: Frontend Evaluator Riset Skripsi** (`sistem/frontend/evaluator/`) berbasis React + TypeScript + Tailwind CSS:
     - Palet matte industrial presisi tanpa artefak AI slop.
     - Visualisasi SVG interaktif untuk Kurva Risk-Coverage (AURC) dan Reliability Diagram (ECE sebelum vs sesudah penskalaan suhu $T^*$).
     - Inspektur sampel dengan drill-down diagnosa 4 lapis (L1 Struktur, L2 Fisik, L3 Temporal, L4 Kalibrasi).
     - Generator dan ekspor tabel format LaTeX siap pakai untuk Bab IV Skripsi.
     - Kompilasi build lulus 100% (0 error, build 4.89s).
     - Dokumentasi di `docs/05-hasil-implementasi-fase2-evaluator.md`.
  4. Implementasi **Fase 3: Frontend Operator Workstation** (`sistem/frontend/operator/`):
     - Viewfinder akuisisi kamera dengan reticle panduan ROI, penanda slot dinamis, dan shutter flash burst 5-frame (150 ms).
     - Readout display bobot digital 7-segmen besar dengan banner keputusan kontras tinggi (`TERIMA`, `TOLAK`, `KONFIRMASI`, `BATAL`).
     - Rel verifikasi 4-lapis real-time dan jejak audit transaksi SQLite lokal.
     - Kendali tanpa mouse via pintasan keyboard (`Space` Ambil, `M` Manual Confirm, `Esc` Reset).
     - Kompilasi build lulus 100% (0 error, build 3.28s).
     - Dokumentasi di `docs/06-hasil-implementasi-fase3-operator.md`.
- **Keputusan:**
  - Protokol integritas akademik: dataset uji terkunci (`sistem/data/locked_test_set` dan `sistem/data/test`) dibekukan; penyetelan ambang keyakinan hanya dilakukan pada dataset kalibrasi (`sistem/data/calib`).
  - Arsitektur monorepo modular terpisah: `backend/`, `frontend/evaluator/`, dan `frontend/operator/`.
- **Blocker:** Tidak ada. Seluruh pengujian backend dan kompilasi build frontend selesai tanpa error.
- **Berikutnya:** Demonstrasi sistem dan persiapan penulisan draf laporan akhir.

## Template entri
```
## YYYY-MM-DD
- Yang dikerjakan:
- Keputusan:
- Blocker:
- Berikutnya:
```
