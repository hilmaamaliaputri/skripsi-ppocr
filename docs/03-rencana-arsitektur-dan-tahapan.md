# 03 — Rencana Arsitektur Sistem, Tech Stack, dan Tahapan Eksekusi

> **Tanggal:** 6 November 2026  
> **Peneliti:** Hilma Amalia Putri (NPM: 237006010)  
> **Status:** Kesepakatan Desain (Hasil Sesi Grill-Me)  
> **Pedoman Visual:** Antislop Active (Mode: During) — Desain Industrial Presisi, Kepadatan Informasi Tinggi, Bebas Elemen AI Slop.

---

## 1. Ringkasan Keputusan Arsitektur

| Aspek | Keputusan Terpilih | Justifikasi |
|---|---|---|
| **Tech Stack Utama** | **React (Vite) + TypeScript + Tailwind CSS** (Frontend) & **FastAPI** (Backend Python) | Arsitektur terpisah, modular tinggi, penataan styling presisi tanpa template generic AI, serta integrasi mulus dengan pustaka visi dan model Python. |
| **Model OCR Utama** | **PP-OCRv6 (Small ONNX)** | ~5,2M parameter, seimbang antara latensi dan akurasi, berjalan 100% luring via ONNX Runtime CPU. |
| **Alur Akuisisi Kamera** | **Burst Capture (3–5 Bingkai)** | Operator memicu 1 kali rekam, browser mengambil rentetan 5 frame berurutan (~100 ms) dan mengirimnya sekaligus ke backend untuk verifikasi temporal. |
| **Penentuan ROI Display** | **Preset Profil Display + Panduan Viewfinder** | Operator memilih tipe timbangan aktif (5/6/7 slot) dengan overlay kotak ROI di antarmuka, diikuti auto-refinement kontur oleh OpenCV. |
| **Penanganan Keputusan** | **Fast-Action Banner & Keyboard Shortcuts** | Status tampil seketika di panel atas (`TERIMA`, `TOLAK`, `KONFIRMASI`, `BATAL`) dengan tombol aksi besar dan shortcut fisik (`Space` untuk foto ulang, `M` untuk manual input). |
| **Penyimpanan Jejak Audit** | **Local JSONL + SQLite Ringan + Ekspor UI** | Log transaksi append-only JSONL (sesuai spesifikasi audit) diindeks oleh SQLite lokal untuk pencarian/filter di antarmuka, dilengkapi ekspor CSV/JSON. |
| **Struktur Frontend** | **Dua Aplikasi Terpisah** | 1. **Evaluator App** (prioritas utama untuk penelitian & metrik skripsi).<br>2. **Operator App** (workstation operasional penimbangan lapangan). |

---

## 2. Struktur Direktori Modular Monorepo

```
c:\Tugas Akhir\rencana baru\
├── docs/                             # Dokumentasi penelitian dan arsitektur
│   ├── 01-riset-teknis-ppocrv6.md
│   ├── 02-riset-frontend-antislop.md
│   └── 03-rencana-arsitektur-dan-tahapan.md
├── AGENTS.md                         # Aturan kerja agen & kepatuhan skill antislop
└── sistem/
    ├── backend/                      # Python Engine & REST API
    │   ├── config/                   # Konfigurasi produk (produk.yaml) & display
    │   ├── src/
    │   │   ├── vision/               # OpenCV ROI extractor & vertical slot profiler
    │   │   ├── models/               # PP-OCRv6 ONNX Runtime wrapper
    │   │   ├── pipeline/             # Normalizer string & skema Pydantic
    │   │   ├── verification/         # 4 Lapis Verifikasi (v_temporal, v_structural, v_physical, v_calibration)
    │   │   ├── engine/               # Decision Engine & audit logger (SQLite + JSONL)
    │   │   └── evaluation/           # Temperature scaling, risk-coverage, & harness metrik
    │   ├── main.py                   # Entrypoint FastAPI
    │   └── requirements.txt
    ├── frontend/
    │   ├── evaluator-app/            # [TAHAP 2] React+Vite: Workbench Evaluasi, Kalibrasi T, & Visualisasi AURC
    │   └── operator-app/             # [TAHAP 3] React+Vite: Workstation Timbang Lapangan & Burst Kamera
    └── data/                         # Dataset eksperimen
        ├── synthetic/                # 120 sampel data sintetis
        ├── calib/                    # 120 sampel multi-frame kalibrasi
        ├── test/                     # 600 sampel data uji
        └── locked_test_set/          # Manifest data uji terkunci & quick_20.json
```

---

## 3. Urutan Eksekusi Bertahap

### Tahap 1: Fondasi Backend & Validasi Pipeline Model
1. Menyiapkan struktur modular di `sistem/backend/`.
2. Membangun modul inferensi `ppocrv6_onnx.py` dan mengujinya pada sampel `quick_20.json` (memastikan zero error & 100% luring).
3. Membangun modul visi komputer OpenCV `slot_profiler.py` (deteksi jumlah slot fisik & titik desimal).
4. Mengimplementasikan 4 berkas lapis verifikasi independen (`v_temporal.py`, `v_structural.py`, `v_physical.py`, `v_calibration.py`).
5. Mengimplementasikan `decision_engine.py` dan `audit_logger.py` (JSONL + SQLite).
6. Mengimplementasikan modul evaluasi: estimasi suhu $T$ (*Temperature Scaling*) pada 120 sampel `data/calib` dan kalkulasi kurva *Risk-Coverage*.
7. Membuka endpoints FastAPI:
   - `/api/eval/benchmark`: Menjalankan evaluasi batch pada dataset kalibrasi / uji.
   - `/api/eval/risk-coverage`: Mengembalikan data koordinat kurva risk-coverage & AURC.
   - `/api/eval/calibrate`: Mengoptimalkan suhu $T$ dan menetapkan ambang $\tau$.
   - `/api/process-burst`: Memproses 3–5 frame dan menghasilkan keputusan 4 keadaan.
   - `/api/transactions`: Mengambil riwayat audit dengan pagination/filter.

### Tahap 2: Evaluator App (Frontend Laboratorium Evaluasi)
1. Inisialisasi proyek React + Vite + TypeScript di `sistem/frontend/evaluator/`.
2. Menerapkan desain *industrial precision* bebas AI slop: tabel data monospaced dengan visualisasi perbedaan bacaan vs label ground truth.
3. Panel interaktif kalibrasi: slider penyesuaian ambang $\tau$ dengan kalkulasi real-time terhadap *silent error rate* dan *coverage*.
4. Komponen grafik kurva *Risk-Coverage* (menampilkan nilai AURC dan titik operasi ambang terkunci untuk Bab IV skripsi).
5. Generator ekspor laporan metrik (FSR, CER, Akurasi Desimal, Latensi p50/p95, Silent Error).

### Tahap 3: Operator App (Frontend Stasiun Timbang Lapangan)
1. Inisialisasi proyek React + Vite + TypeScript di `sistem/frontend/operator/`.
2. Viewfinder kamera dengan overlay panduan ROI presisi.
3. Pemicu *Burst Capture* 3–5 bingkai dan *Fast-Action Banner* (`TERIMA`, `TOLAK`, `KONFIRMASI`, `BATAL`).
4. Dukungan keyboard shortcuts industri (`Space` foto ulang, `M` input manual).
5. Tabel jejak audit transaksi lokal dengan tombol ekspor CSV.
