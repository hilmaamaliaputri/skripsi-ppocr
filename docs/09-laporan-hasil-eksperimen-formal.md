# Laporan Hasil Eksperimen Formal Bab IV (Terkunci 23 November 2026 — Pasca Fine-Tuning PP-OCRv6 Tiny)

Seluruh eksperimen pada dokumen ini dieksekusi luring (`CPU-only ONNX Runtime`) dengan pemisahan ketat di bawah folder terpadu `dataset/`:
- **Dataset Latih Terpadu Bersih** ([dataset/01_latih/manifest.json](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/01_latih/manifest.json), $n = 2.268$ citra unik: `400` sintetis frontal/glare/tilt/low-contrast + `200` sintetis bezel gudang + `1.200` korpus 7-segmen + `468` foto SachaIZADI [`419` ROI LCD terpotong bersih], **0 duplikat & 0 kebocoran SHA256/crop/dHash ke uji/kalibrasi**),
- **Dataset Kalibrasi Terpisah** ([dataset/02_kalibrasi/meta.jsonl](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/02_kalibrasi/meta.jsonl), $n = 600$ bingkai dari $120$ burst `K0000`–`K0119`),
- **Dataset Uji Terkunci** ([dataset/03_uji_755/manifest.json](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/03_uji_755/manifest.json), $n = 755$ citra, dan [dataset/04_uji_burst_120/burst_manifest.json](file:///c:/Tugas%20Akhir/rencana%20baru/dataset/04_uji_burst_120/burst_manifest.json), $n = 120$ burst),
- **Arsip Draf Tanpa Label** (`dataset/99_arsip_draft_tanpa_label/`, `3.000` file `U0000`–`U0599` non-eksperimen).

---

## 1. Kalibrasi Matematis & Efisiensi Komputasi Edge (`EXP-11`, `EXP-12`, `EXP-22`)

Kalibrasi suhu tunggal $T^*$ dan ambang selektif $\tau$ dilakukan eksklusif di `dataset/02_kalibrasi/` ($n = 600$). Sumber: [tabel_3_kalibrasi_dan_edge.csv](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_3_kalibrasi_dan_edge.csv).

| Model | Mode Pelatihan Lokal (`01_latih`) | $n_{\text{calib}}$ | $T^*$ | $\tau$ Terkunci | ECE Awal $\to$ Akhir | Cold Load (ms) | RSS (MB) | Calib p50 / p95 (ms) |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **PP-OCRv6 Tiny (Fine-Tuned)** | **32 epoch** (*EarlyStop*, `Best=22`) | 600 | 10.0 | **0.5604** | 0.7251 $\to$ **0.4159** | **86.98** | 200.32 | 7.12 / 13.12 |
| **CRNN-CTC** | **50 epoch** (`Best=48`) | 600 | 10.0 | 0.5541 | 0.7403 $\to$ **0.4283** | 262.80 | 223.54 | 11.23 / 13.44 |
| **PP-OCRv6 Tiny (Zero-Shot)** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5170 | 0.5348 $\to$ **0.4126** | 257.32 | 202.75 | 4.82 / 6.03 |
| **PP-OCRv6 Small (Zero-Shot)** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5425 | 0.5774 $\to$ **0.3416** | 806.04 | 236.15 | 23.88 / 26.09 |
| **PP-OCRv6 Medium (Zero-Shot)** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5419 | 0.5511 $\to$ **0.3087** | 984.01 | 289.79 | 99.16 / 110.50 |
| **PP-OCRv5 Mobile (Zero-Shot)** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5172 | 0.5835 $\to$ **0.4746** | 882.23 | 233.57 | 22.87 / 24.93 |
| **DBNet + PARSeq (Zero-Shot)** | 0 epoch (Pretrained) | 600 | 10.0 | 0.5557 | 0.8408 $\to$ **0.5442** | 11425.50 | 357.78 | 425.68 / 677.71 |

---

## 2. Tahap A: Perbandingan Lintas-Model pada 755 Citra Uji Terkunci (`EXP-14`, `EXP-15`)

Sumber: [tabel_1_tahap_a.csv](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_1_tahap_a.csv) ($n = 755$, Bootstrap 95% CI 1.000 iterasi):

| Model | FSR Mentah [95% CI] | CER Mentah [95% CI] | Silent Err. Mentah | Coverage Verif. | Silent Err. Verif. | Selective Acc. Verif. | AURC Verif. | Latensi p50 / p95 (ms) |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **PP-OCRv6 Tiny (Fine-Tuned · Champion)** | **49.54%** [45.70–53.11] | **16.65%** [15.03–17.97] | **50.46%** | **40.53%** | 3.97% | **90.20%** | **0.2182** | **5.12 / 8.58** |
| **CRNN-CTC (Domain-Trained)** | 33.91% [30.73–37.48] | 26.68% [24.80–28.42] | 66.09% | 33.38% | 8.08% | 75.79% | 0.3836 | 12.84 / 16.85 |
| **PP-OCRv6 Tiny (Zero-Shot)** | **9.93%** [7.68–11.92] | 48.48% [46.08–50.99] | 90.07% | 9.01% | 1.32% | 85.29% | 0.7087 | 5.59 / 9.73 |
| **PP-OCRv6 Small (Zero-Shot)** | 8.21% [6.23–10.07] | 51.33% [50.68–55.45] | 91.79% | 7.55% | 0.79% | 89.47% | 0.7366 | 26.90 / 39.79 |
| **PP-OCRv6 Medium (Zero-Shot)** | 6.89% [5.16–8.61] | 54.07% [53.76–58.10] | 93.11% | 6.23% | 0.66% | 89.36% | 0.7653 | 105.08 / 141.11 |
| **DBNet + PARSeq (Zero-Shot)** | 2.12% [1.19–3.18] | 51.30% [49.14–53.99] | 97.88% | 2.78% | 0.79% | 71.43% | 0.9090 | 508.80 / 1492.89 |
| **PP-OCRv5 Mobile (Zero-Shot)** | 1.99% [1.06–3.05] | 69.94% [69.17–74.14] | 98.01% | 2.91% | 1.06% | 63.64% | 0.9095 | 24.01 / 29.66 |

**Temuan Kunci Tahap A (`EXP-14` & `EXP-15`):**
1. **Bukti Ketidakcukupan Zero-Shot & Dampak Adaptasi Domain PP-OCRv6:** Tanpa pelatihan lokal, model terbaik keluarga PP-OCRv6 (`PP-OCRv6 Tiny`) hanya meraih `9.93%` FSR. Setelah dilakukan *end-to-end fine-tuning* + pemetaan kepala CTC 12-token pada dataset bersih `01_latih` (`Val FSR = 79.77%`, `Val CER = 7.54%` di epoch ke-22), **`PP-OCRv6 Tiny (Fine-Tuned)` melompat 5× lipat ke `49.54%` FSR (`+39.61` poin)** pada uji terkunci `n = 755`!
2. **Komparasi *Apple-to-Apple* (`PP-OCRv6 Tiny FT` vs `CRNN-CTC`):** Saat keduanya dilatih pada korpus `2.268` citra yang sama, **`PP-OCRv6 Tiny (Fine-Tuned)` unggul telak di setiap metrik utama**: FSR **`49.54%` vs `33.91%`**, CER **`16.65%` vs `26.68%`**, Coverage terverifikasi **`40.53%` vs `33.38%`**, Selective Accuracy **`90.20%` vs `75.79%`**, AURC **`0.2182` vs `0.3836`**, dan latensi `p95` **`8.58 ms` vs `16.85 ms`**.
3. **Kelebihan Khusus Kondisi Lapangan (`tabel_4_kondisi_khusus_tiny_ft.csv`):** Pada sudut miring `15–30°`, `PP-OCRv6 Tiny (FT)` mencetak **`26.0%`** (Selective Acc **`89.47%`**) vs `CRNN-CTC` `2.0%`; pada `clean_frontal` & `dusty_scratched` meraih **Selective Accuracy `100.0%` (`Silent Error = 0.0%`)**.

---

## 3. Tahap B: Uji Ablasi Fail-Fast (`EXP-16` s/d `EXP-18`)

Urutan ablasi mengikuti eksekusi *fail-fast* `DecisionEngine`: `Baseline -> +Temporal (L3) -> +Struktural (L1) -> +Fisik (L2) -> +Kalibrasi (L4)` ([tabel_2_tahap_b_ablasi.csv](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_2_tahap_b_ablasi.csv)).

### A. Ablasi pada 120 Burst Multi-Frame (`dataset/04_uji_burst_120/burst_manifest.json`)

| Konfigurasi | Coverage (`Tiny-FT` / `CRNN` / `Small`) | Silent Error (`Tiny-FT` / `CRNN` / `Small`) | Selective Acc. (`Tiny-FT` / `CRNN` / `Small`) | AURC (`Tiny-FT` / `CRNN` / `Small`) |
| :--- | ---: | ---: | ---: | ---: |
| **Tanpa Verifikasi** | 100.0% / 100.0% / 100.0% | 46.67% / 62.50% / 90.83% | 53.33% / 37.50% / 9.17% | 0.7347 / 0.6351 / 0.8721 |
| **+ Temporal (`L3`)** | 81.67% / 47.50% / 43.33% | 32.50% / 20.83% / 40.83% | 60.20% / 56.14% / 5.77% | 0.6537 / 0.5474 / 0.9331 |
| **+ Struktural (`L3+L1`)** | 49.17% / 32.50% / 23.33% | **0.00%** / 5.83% / 20.83% | **100.0%** / 82.05% / 10.71% | **0.0912** / 0.3042 / 0.8852 |
| **+ Fisik (`L3+L1+L2`)** | 45.83% / 22.50% / 1.67% | **0.00%** / 0.83% / **0.00%** | **100.0%** / 96.30% / **100.0%** | 0.0999 / 0.3137 / 0.7817 |
| **+ Kalibrasi (`L3+L1+L2+L4`)** | **43.33%** / 21.67% / 1.67% | **0.00%** / 0.83% / **0.00%** | **100.0%** / 96.15% / **100.0%** | **0.0999** / 0.3137 / 0.7817 |

### B. Ringkasan Pemilihan Model Produksi Operator

Berdasarkan hasil empiris di atas ([champion_selection.json](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/champion_selection.json)), **`PP-OCRv6 Tiny (Fine-Tuned)` + Verifikasi 4-Lapis** resmi dipilih sebagai model produksi utama di **Web Operator**, karena mampu mengotomatiskan **`43,33%`** transaksi *burst* (`2×` lebih produktif daripada `CRNN-CTC` & `26×` lebih produktif daripada `PP-OCRv6 Small` *zero-shot*) dengan **`Silent Error = 0,00%`**, **`Selective Accuracy = 100,0%`**, **`AURC = 0,0999`**, serta latensi CPU tercepat **`p95 = 8,58 ms`**.

---

## 4. Artefak Beku Bab IV

- Grafik 300 DPI: [fig1_komparasi_6_model.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig1_komparasi_6_model.png), [fig2_ablasi_tiny_ft.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig2_ablasi_tiny_ft.png), [fig2_ablasi_crnn.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig2_ablasi_crnn.png), [fig2_ablasi_small.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig2_ablasi_small.png), [fig3_reliability_tiny_ft.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig3_reliability_tiny_ft.png), [fig3_reliability_crnn.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig3_reliability_crnn.png), [fig3_reliability_small.png](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/figures/fig3_reliability_small.png).
- Tabel LaTeX siap kutip: [tabel_1_tahap_a.tex](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_1_tahap_a.tex), [tabel_2_tahap_b_ablasi.tex](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_2_tahap_b_ablasi.tex), [tabel_3_kalibrasi_dan_edge.tex](file:///c:/Tugas%20Akhir/rencana%20baru/docs/hasil_eksperimen/tabel_3_kalibrasi_dan_edge.tex).
- Histori epoch pelatihan: [ppocrv6_tiny_ft_history.json](file:///c:/Tugas%20Akhir/rencana%20baru/sistem/backend/config/ppocrv6_tiny_ft_history.json) & [crnn_training_history.json](file:///c:/Tugas%20Akhir/rencana%20baru/sistem/backend/config/crnn_training_history.json).
