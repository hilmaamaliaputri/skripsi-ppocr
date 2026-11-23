# Peta Induk Dataset Resmi Tugas Akhir

Seluruh data dikelompokkan dalam **satu direktori utama (`dataset/`)** agar mudah ditelusuri, bersih dari duplikasi, dan bebas kebocoran uji ($D_{\text{train}} \cap D_{\text{calib}} \cap D_{\text{test}} = \emptyset$):

| Folder | Peran Ilmiah | Isi & Jumlah Sampel | Status Kebocoran / Label |
| :--- | :--- | :--- | :--- |
| **`01_latih/`** | **Dataset Latih Model (`train` + `val`)** | **2.268 citra unik** (`400` display timbangan industri + `200` bezel gudang + `1.200` korpus CRNN + `468` foto riil `SachaIZADI` train) | Berlabel penuh (`manifest.json`, `labels.csv`); **`0`** tumpang tindih SHA256/dHash ke `02_kalibrasi` maupun `03_uji_755`. |
| **`02_kalibrasi/`** | **Dataset Kalibrasi Terpisah** | **120 burst / 600 frame** (`K0000`–`K0119`) | Berlabel lengkap per frame (`meta.jsonl`, `labels.csv`, `frame_ground_truths`, `frame_roi_bboxes`). Khusus untuk mencari suhu $T^*$ dan ambang $\tau$. |
| **`03_uji_755/`** | **Dataset Uji Terkunci Utama (Tahap A & B)** | **755 citra berlabel** (`600` frame sintetis 7 tema + `155` foto riil `SachaIZADI` test split) | **Terkunci mutlak** (`manifest.json`, `labels.csv`). Dilarang dipakai untuk pelatihan maupun penyetelan ambang. |
| **`04_uji_burst_120/`** | **Dataset Burst Uji Multi-Frame (L3 Temporal)** | **120 folder x 5 frame = 600 frame** (`scale_syn_0001`–`0120`) + `burst_manifest.json` | **Terkunci mutlak** mencakup 6 kondisi lapangan (`clean_frontal`, `glare`, `tilt_15_30`, `low_contrast_passive`, `wet_foggy`, `dusty_scratched`). |
| **`99_arsip_draft_tanpa_label/`** | **Arsip Draf Awal Tanpa Label** | `3.000` foto adegan gudang lama (`U0000`–`U0599`) | Tidak memiliki `ground_truth`/`roi_bbox`; diarsipkan agar folder kerja inti tetap rapi & ringan. |

> **Kompatibilitas Backend:** Folder `sistem/data/{dataset_latih, calib, dataset_uji, synthetic}` terhubung sebagai tautan langsung (*NTFS Junction*) ke folder bernomor di atas, sehingga seluruh skrip backend dan API FastAPI membaca sumber tunggal yang sama tanpa duplikasi berkas di disk.
