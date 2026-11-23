# Laporan Hasil Eksperimen Formal Bab IV (Terkunci 23 November 2026)

Seluruh eksperimen pada dokumen ini dieksekusi luring (`CPU-only ONNX Runtime`) dengan pemisahan ketat di bawah folder terpadu `dataset/`:
- **Dataset Latih Terpadu Bersih** ([dataset/01_latih/manifest.json](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/01_latih/manifest.json), $n = 2.268$ citra unik: `400` sintetis frontal/glare/tilt/low-contrast + `200` sintetis bezel gudang (`SCALEPRO DS-33`, `XK-57`) + `1.200` korpus 7-segmen + `468` foto timbangan nyata SachaIZADI [`419` ROI LCD dipotong bersih], **0 duplikat & 0 kebocoran SHA256/crop/dHash ke uji/kalibrasi**),
- **Dataset Kalibrasi Terpisah** ([dataset/02_kalibrasi/meta.jsonl](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/02_kalibrasi/meta.jsonl), $n = 600$ bingkai dari $120$ burst `K0000`–`K0119`),
- **Dataset Uji Terkunci** ([dataset/03_uji_755/manifest.json](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/03_uji_755/manifest.json), $n = 755$ citra, dan [dataset/04_uji_burst_120/burst_manifest.json](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/04_uji_burst_120/burst_manifest.json), $n = 120$ burst),
- **Arsip Draf Tanpa Label** (`dataset/99_arsip_draft_tanpa_label/`, `3.000` file `U0000`–`U0599` non-eksperimen).

---

## 1. Kalibrasi Matematis & Efisiensi Komputasi Edge (`EXP-11`, `EXP-12`, `EXP-22`)

Kalibrasi suhu tunggal $T^*$ dan ambang selektif $\tau$ (prioritas `risk <= 1%` pada `coverage >= 50%`) dilakukan eksklusif di `dataset/02_kalibrasi/` ($n = 600$). Sumber: [tabel_3_kalibrasi_dan_edge.csv](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_3_kalibrasi_dan_edge.csv).

| Model | Mode Latih Lokal | $n_{\text{calib}}$ | $T^*$ | $\tau$ Terkunci | ECE Awal $\to$ Akhir | Cold Load (ms) | RSS (MB) | Calib p50 / p95 (ms) |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **PP-OCRv6 Tiny** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5170 | 0.5348 $\to$ **0.4126** | 299.17 | 178.06 | 4.97 / 7.32 |
| **PP-OCRv6 Small** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5425 | 0.5774 $\to$ **0.3416** | 803.36 | 208.98 | 25.84 / 41.95 |
| **PP-OCRv6 Medium** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5419 | 0.5511 $\to$ **0.3087** | 936.36 | 266.12 | 100.69 / 119.15 |
| **PP-OCRv5 Mobile** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5172 | 0.5835 $\to$ **0.4746** | 818.27 | 207.83 | 24.48 / 28.75 |
| **CRNN-CTC** | **50 epoch** (`Best=48`) | 600 | 10.0 | 0.5541 | 0.7403 $\to$ **0.4283** | **178.56** | 215.89 | 11.43 / 12.83 |
| **DBNet + PARSeq** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5557 | 0.8408 $\to$ **0.5442** | 12533.82 | 333.08 | 419.13 / 640.86 |

---

## 2. Tahap A: Perbandingan 6 Model pada 755 Citra Uji Terkunci (`EXP-14`, `EXP-15`)

Sumber: [tabel_1_tahap_a.csv](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_1_tahap_a.csv) ($n = 755$, Bootstrap 95% CI 1.000 iterasi):

| Model | FSR Mentah [95% CI] | CER Mentah [95% CI] | Silent Err. Mentah | Coverage Verif. | Silent Err. Verif. | Selective Acc. Verif. | AURC Verif. | Latensi p50 / p95 (ms) |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **CRNN-CTC (Retrained 50ep)** | **33.91%** [30.73–37.48] | **26.68%** [24.80–28.42] | **66.09%** | **33.38%** | 8.08% | 75.79% | **0.3836** | 12.84 / 16.85 |
| **PP-OCRv6 Tiny** | **9.93%** [7.68–11.92] | 48.48% [46.08–50.99] | 90.07% | 9.01% | 1.32% | 85.29% | 0.7087 | **5.59 / 9.73** |
| **PP-OCRv6 Small** | 8.21% [6.23–10.07] | 51.33% [50.68–55.45] | 91.79% | 7.55% | **0.79%** | **89.47%** | 0.7366 | **26.90 / 39.79** |
| **PP-OCRv6 Medium** | 6.89% [5.16–8.61] | 54.07% [53.76–58.10] | 93.11% | 6.23% | 0.66% | 89.36% | 0.7653 | 105.08 / 141.11 |
| **DBNet + PARSeq** | 2.12% [1.19–3.18] | 51.30% [49.14–53.99] | 97.88% | 2.78% | **0.79%** | 71.43% | 0.9090 | 508.80 / 1492.89 |
| **PP-OCRv5 Mobile** | 1.99% [1.06–3.05] | 69.94% [69.17–74.14] | 98.01% | 2.91% | 1.06% | 63.64% | 0.9095 | 24.01 / 29.66 |

**Temuan Kunci Tahap A (`EXP-14` & `EXP-15`):**
1. Setelah pembersihan duplikat/kebocoran + pengayaan bezel gudang + *crop* ROI LCD SachaIZADI (`2.268` citra latih bersih, **50 epoch**, `Val FSR = 87.10%`, `Val CER = 5.73%` di epoch ke-48), **CRNN-CTC** unggul jauh di atas seluruh model *pretrained zero-shot* pada akurasi urutan penuh (`33.91%` vs `1.99%–9.93%`), `AURC = 0.3836`, rasio otomatisasi (*Coverage* **`33.38%`**), dan latensi stabil (`p50 = 12.84 ms`, `p95 = 16.85 ms`).
2. Untuk kategori *zero-shot pretrained* berkecepatan Edge tercepat (`p95 <= 50 ms`), **PP-OCRv6 Tiny** mencatat FSR & AURC terbaik (`9.93%`, `p95 = 9.73 ms`), sementara **PP-OCRv6 Small** meraih *Selective Accuracy* tertinggi (`89.47%`) serta Silent Error `0.79%`.

---

## 3. Tahap B: Uji Ablasi Fail-Fast & Bukti Kasus Khusus (`EXP-16` s/d `EXP-18`)

Urutan ablasi mengikuti eksekusi *fail-fast* `DecisionEngine`: `Baseline -> +Temporal (L3) -> +Struktural (L1) -> +Fisik (L2) -> +Kalibrasi (L4)` pada **CRNN-CTC**, **PP-OCRv6 Tiny**, dan **PP-OCRv6 Small** ([tabel_2_tahap_b_ablasi.csv](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_2_tahap_b_ablasi.csv)).

### A. Ablasi pada 120 Burst Multi-Frame (`dataset/04_uji_burst_120/burst_manifest.json`)

| Konfigurasi | Coverage (`CRNN` / `Tiny` / `Small`) | Silent Error (`CRNN` / `Tiny` / `Small`) | Selective Acc. (`CRNN` / `Tiny` / `Small`) | AURC (`CRNN` / `Tiny` / `Small`) |
| :--- | ---: | ---: | ---: | ---: |
| **Tanpa Verifikasi** | 100.0% / 100.0% / 100.0% | 62.50% / 88.33% / 90.83% | 37.50% / 11.67% / 9.17% | 0.6351 / 0.8237 / 0.8721 |
| **+ Temporal (`L3`)** | 47.50% / 35.0% / 43.33% | 20.83% / 31.67% / 40.83% | 56.14% / 9.52% / 5.77% | 0.5474 / 0.8678 / 0.9331 |
| **+ Struktural (`L3+L1`)** | 32.50% / 14.17% / 23.33% | 5.83% / 10.83% / 20.83% | 82.05% / 23.53% / 10.71% | **0.3042** / 0.8169 / 0.8852 |
| **+ Fisik (`L3+L1+L2`)** | **22.50%** / 3.33% / 1.67% | **0.83%** / **0.00%** / **0.00%** | **96.30%** / **100.0%** / **100.0%** | **0.3137** / 0.7289 / 0.7817 |
| **+ Kalibrasi (`L3+L1+L2+L4`)** | **21.67%** / 3.33% / 1.67% | **0.83%** / **0.00%** / **0.00%** | **96.15%** / **100.0%** / **100.0%** | **0.3137** / 0.7289 / 0.7817 |

### B. Ringkasan Ablasi pada 755 Citra Uji Terpadu & Mitigasi Digit Hantu `8` (`EXP-17`)

- Pada `unified_755`, **CRNN-CTC** dengan 4-Lapis Verifikasi mempertahankan Coverage **`33.38%`** sekaligus menekan Silent Error dari **`66.09% -> 8.08%`** (`Selective Acc = 75.79%`), sedangkan pada skenario *burst* multi-frame `120` folder, Silent Error **CRNN-CTC** turun drastis dari **`62.50% -> 0.83%`** dengan *Selective Accuracy* **`96.15%`**.
- **PP-OCRv6 Small** menekan Silent Error `unified_755` hingga **`0.79%`** (`Selective Acc = 89.47%`), sementara pada kasus digit hantu `scale_syn_0001_frame_01` (`clean_frontal`, GT `"25.00"`), bacaan `"882500"` (`Tiny`) ditolak **L1 Struktural** dan `"8825.00"` (`Small`) ditolak **L2 Fisik**, menurunkan Silent Error `clean_frontal` ($n=100$) dan `tilt_15_30` ($n=100$) ke **`0.0%`**.

---

## 4. Artefak Beku Bab IV

- Grafik 300 DPI: [fig1_komparasi_6_model.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig1_komparasi_6_model.png), [fig2_ablasi_crnn.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig2_ablasi_crnn.png), [fig2_ablasi_tiny.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig2_ablasi_tiny.png), [fig2_ablasi_small.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig2_ablasi_small.png), [fig3_reliability_crnn.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig3_reliability_crnn.png), [fig3_reliability_tiny.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig3_reliability_tiny.png), [fig3_reliability_small.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig3_reliability_small.png).
- Tabel LaTeX siap kutip: [tabel_1_tahap_a.tex](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_1_tahap_a.tex), [tabel_2_tahap_b_ablasi.tex](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_2_tahap_b_ablasi.tex), [tabel_3_kalibrasi_dan_edge.tex](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_3_kalibrasi_dan_edge.tex).
- Histori epoch pelatihan CRNN-CTC asli: [crnn_training_history.json](file:///c:/Tugas%20Akhir/rencana%20baru/sistem/backend/config/crnn_training_history.json).
