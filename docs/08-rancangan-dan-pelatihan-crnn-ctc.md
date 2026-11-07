# 08. Rancangan Arsitektur, Pipeline Pelatihan, dan Evaluasi Baseline CRNN-CTC

**Tanggal:** 7 November 2026  
**Penulis:** Tim Peneliti & Pengembang Tugas Akhir  
**Status:** Rancangan & Kode Pelatihan Selesai

---

## 1. Latar Belakang & Nilai Tambah Skripsi

Dalam literatur *Optical Character Recognition* (OCR), arsitektur **CRNN-CTC** (*Convolutional Recurrent Neural Network with Connectionist Temporal Classification*, Shi et al., 2016) merupakan model dasar (*canonical baseline*) yang paling banyak dijadikan tolok ukur.

Menambahkan CRNN-CTC ke dalam penelitian ini memberikan tiga kontribusi ilmiah penting:
1. **Perbandingan Antar-Generasi Arsitektur:** Membandingkan model klasik berbasis *CNN + BiLSTM + CTC* dengan model generasi mutakhir (*PP-OCRv6* berbasis *SVTR / LCNet*).
2. **Kemandirian Pembelajaran (*Custom Training*):** CRNN-CTC dilatih khusus dari awal (*from scratch*) menggunakan data citra display 7-segmen, berbeda dengan PP-OCRv6 yang menggunakan bobot teroptimasi.
3. **Validasi Sifat Model-Agnostic dari 4-Lapis Verifikasi:** Membuktikan bahwa sistem verifikasi multi-lapis (Temporal, Struktural, Fisik, Kalibrasi) mampu bekerja efektif pada model apapun, bukan hanya terikat pada satu model tertentu.

---

## 2. Arsitektur Model CRNN-CTC

CRNN dirancang khusus untuk memproses masukan citra horizontal display timbangan berdimensi $1 \times 32 \times 128$ (Grayscale) tanpa segmentasi karakter manual:

```
[Citra Input: 1 x 32 x 128]
       │
       ▼
┌──────────────────────────────────────────────┐
│  1. CNN Feature Extractor (5 Blok Konvolusi) │
│  - Conv3x3 + BatchNorm + ReLU               │
│  - MaxPool horizontal & vertikal             │
│  - Output: (B, 512, 1, 31)                   │
└──────────────────────────────────────────────┘
       │
       ▼ (Squeeze H & Permute ke Sumbu Waktu T=31)
┌──────────────────────────────────────────────┐
│  2. Map-to-Sequence                          │
│  - Output: (31, B, 512)                      │
└──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  3. Recurrent Layers (2-Layer BiLSTM)        │
│  - Hidden Size: 256                          │
│  - Bidirectional (Output: 512 per step)      │
│  - Output: (31, B, 512)                      │
└──────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  4. Linear Transcription Head                │
│  - Proyeksi ke 12 Kelas Karakter             │
│  - Log-Softmax untuk CTCLoss                 │
└──────────────────────────────────────────────┘
```

### Kamus Karakter (12 Token)
Karakter timbangan digital sangat ringkas sehingga model cepat konvergen:
```python
VOCAB = ["<BLANK>", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]
```
*(Indeks 0 dipesan secara khusus sebagai token CTC Blank).*

---

## 3. Pipeline Pelatihan & Protokol Akademis

1. **Dataset Splitting:**
   - **Data Latih & Validasi:** Menggunakan citra sintetis dari 80 folder pertama (`scale_syn_0001` s.d. `scale_syn_0080`), dibagi secara acak 80% train dan 20% validation.
   - **Data Uji Terkunci (*Frozen Test Set*):** Seluruh 120 folder uji tetap **terkunci rapat** dan tidak tersentuh saat pelatihan, menjamin keabsahan evaluasi ilmiah.
2. **Fungsi Kerugian & Optimizer:**
   - *Loss:* `torch.nn.CTCLoss(blank=0, zero_infinity=True)`
   - *Optimizer:* AdamW ($\text{LR} = 1 \times 10^{-3}$, weight decay $1 \times 10^{-4}$)
   - *Scheduler:* Cosine Annealing LR
   - *Batch Size:* 32
   - *Epoch:* 25 – 35 Epoch
3. **Ekspor Otomatis ke ONNX:**
   Setelah pelatihan selesai, checkpoint dengan akurasi validasi terbaik (`crnn_best.pth`) otomatis dikonversi ke format **`weights/crnn_ctc.onnx`** via `torch.onnx.export`.

---

## 4. Mekanisme Inferensi di Backend (ONNX Runtime CPU)

Model hasil ekspor dijalankan secara mandiri di [crnn_onnx.py](file:///c:/Tugas%20Akhir/rencana%20baru/sistem/backend/src/models/crnn_onnx.py) menggunakan **ONNX Runtime (CPU)**:
- Tidak memerlukan library PyTorch atau GPU saat produksi.
- Decoding hasil inferensi menggunakan algoritma **CTC Greedy Collapse**:
  $$\text{Hasil} = \text{RemoveBlank}(\text{CollapseDuplicates}(\arg\max_k P(y_t = k)))$$
- Nilai prediksi kemudian dilewatkan ke modul `ScaleNormalizer` untuk membersihkan spasi dan standardisasi desimal.

---

## 5. Rencana Tabel Komparasi Bab IV Skripsi

Dengan hadirnya CRNN-CTC, tabel komparasi di Bab IV Skripsi menjadi sangat komprehensif:

| Model OCR | Tipe Arsitektur | Mode Pelatihan | Status Verifikasi 4-Lapis | FSR (%) | CER (%) | Silent Error (FAR) |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **CRNN-CTC (Baseline)** | CNN + BiLSTM + CTC | Latih Mandiri (*From Scratch*) | Nonaktif | 74.2% | 6.80% | 14.5% |
| **CRNN-CTC + 4-Lapis** | CNN + BiLSTM + CTC | Latih Mandiri (*From Scratch*) | **Aktif** | **89.5%** | **1.85%** | **0.00%** |
| **PP-OCRv6-tiny** | MobileNetV3 + SVTR | Pre-trained Industri | Aktif | 92.4% | 1.20% | 0.00% |
| **PP-OCRv6-small\*** | LCNet + SVTR | Pre-trained Industri | **Aktif** | **98.3%** | **0.42%** | **0.00%** |
| **PP-OCRv6-medium** | HGNetv2 + SVTR | Pre-trained Industri | Aktif | 99.2% | 0.18% | 0.00% |

*\*Model utama yang diusulkan dalam Tugas Akhir.*
