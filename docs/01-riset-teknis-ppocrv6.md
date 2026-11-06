# 01 — Riset Teknis: Model PP-OCRv6, Visi Komputer, Kalibrasi, dan Lab Evaluasi

> **Tanggal:** 6 November 2026  
> **Peneliti:** Hilma Amalia Putri (NPM: 237006010)  
> **Status:** Riset Pra-Implementasi (Tahap Model & Verifikasi)  
> **Tujuan:** Dokumentasi komprehensif tech stack, pustaka, formula matematis, dan arsitektur modular sistem pengenalan display 7-segmen timbangan industri.

---

## 1. Riset Model: PP-OCRv6

### 1.1 Arsitektur & Karakteristik
PP-OCRv6 (Zhang dkk., Juni 2026, *arXiv:2606.13108*) adalah keluarga model *universal text recognition* mutakhir yang dioptimalkan untuk karakter industri dan display digital.
- **Detektor Teks:** Menggunakan tulang punggung *PP-LCNetV4* dengan leher *C2f / PAN-FPN* yang sangat cepat dan presisi melokalisasi kotak teks.
- **Pengenal Teks (*Recognizer*):** Memadukan *PP-LCNetV4* dengan modul pengode spasial *EncoderWithLightSVTR* dan kepala ganda (*CTC* dan *NRTR*). Pada fase inferensi runtime, sistem hanya mengeksekusi kepala *CTC* untuk efisiensi latensi.
- **Tingkat Model (*Tiers*):**
  - **Tiny:** ~1,5 juta parameter (sangat ringan, cocok untuk perangkat tepi ultra-hemat).
  - **Small:** ~5,2M – 7,7M parameter (kandidat utama paling seimbang antara kecepatan dan akurasi).
  - **Medium:** ~19M – 34,5M parameter (tingkat akurasi tertinggi, server/workstation).

### 1.2 Status Lingkungan & Aset Lokal
Pustaka `paddleocr 3.7.0` dan runtime `onnxruntime 1.31.1` telah terpasang di Python 3.12. Model resmi ONNX dari PaddlePaddle telah terunduh di direktori cache lokal (`~/.paddlex/official_models/`):
- `PP-OCRv6_tiny_det_onnx` & `PP-OCRv6_tiny_rec_onnx`
- `PP-OCRv6_small_det_onnx` & `PP-OCRv6_small_rec_onnx`
- `PP-OCRv6_medium_det_onnx` & `PP-OCRv6_medium_rec_onnx`

Hal ini menjamin inferensi dapat berjalan **100% luring (*offline*)**, tanpa ketergantungan API pihak ketiga atau unduhan jaringan saat pengujian.

---

## 2. Visi Komputer: Deteksi Slot & Titik Desimal (OpenCV)

### 2.1 Latar Belakang Masalah
Model berbasis CTC memiliki sifat *blank collapsing* di mana dua karakter identik yang berurutan memerlukan pemisah *blank*. Jika transisi antar segmen buram atau silau, angka kembar sering terhapus (contoh: `1006.5` terbaca `106.5`).

### 2.2 Metode Penanganan
1. **Ekstraksi ROI & Penajaman Kontras:**
   - Deteksi area layar menggunakan segmentasi kontur/bounding box OpenCV.
   - Penajaman kontras menggunakan *CLAHE* (*Contrast Limited Adaptive Histogram Equalization*) dan *Bilateral Filter* untuk meredam pantulan cahaya (*glare*).
2. **Profil Proyeksi Vertikal ($V(x)$):**
   $$V(x) = \sum_{y} I_{\text{bin}}(x, y)$$
   Puncak dan lembah profil kolom digunakan untuk menghitung jumlah slot digit fisik ($N_{\text{slot}}$) yang tersedia pada panel.
3. **Pendeteksian Titik Desimal:**
   Komponen kecil di dasar batas antar-slot dideteksi sebagai kandidat desimal valid untuk memverifikasi keluaran model OCR.

---

## 3. Empat Lapis Verifikasi Kontekstual

Sistem menerapkan arsitektur *fail-fast* berurutan:

```
Hasil OCR Mentah
       │
       ▼
[Normalisasi String] ──> Standarisasi koma ke titik, strip spasi/satuan
       │
       ▼
[1. Uji Temporal (L3)] ──> Konsistensi antar 3-5 bingkai (misal ≥ 4 dari 5 cocok)
       │ (Lolos)
       ▼
[2. Uji Struktur (L1)] ──> Panjang digit == Jumlah slot fisik; desimal valid
       │ (Lolos)
       ▼
[3. Uji Fisik (L2)] ────> Berat dalam batas min-max produk & toleransi riwayat
       │ (Lolos)
       ▼
[4. Uji Kalibrasi (L4)] ─> Skor terkalibrasi ≥ Ambang keyakinan terkunci
       │
       ▼
[Engine Keputusan] ─────> TERIMA / TOLAK / KONFIRMASI / BATAL
```

### 3.1 Kalibrasi Keyakinan (*Temperature Scaling*)
Skor mentah pengenal cenderung terlalu optimis (*overconfident*). Diterapkan *Temperature Scaling* (Guo dkk., 2017):
$$p_i(T) = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$
Parameter suhu tunggal $T > 0$ dioptimalkan menggunakan *Negative Log-Likelihood* (NLL) melalui SciPy `minimize(method='L-BFGS-B')` pada 120 sampel citra kalibrasi (`data/calib`).

### 3.2 Kurva Risk-Coverage & Evaluasi Keandalan (Geifman & El-Yaniv, 2017)
- Bacaan diurutkan menurun berdasarkan keyakinan terkalibrasi $\hat{p}_{\sigma(1)} \ge \dots \ge \hat{p}_{\sigma(N)}$.
- Tingkat risiko pada cakupan $\kappa = k / N$:
  $$r(\kappa) = \frac{1}{k} \sum_{i=1}^k \mathbf{1}[\hat{y}_{\sigma(i)} \ne y_{\sigma(i)}]$$
- Luas daerah di bawah kurva:
  $$\text{AURC} = \int_0^1 r(\kappa) \, d\kappa \approx \frac{1}{N} \sum_{k=1}^N r\left(\frac{k}{N}\right)$$

---

## 4. Lab Evaluasi & Metrik Pengujian

Evaluasi dilakukan dari jejak audit luring terhadap **Data Uji Terkunci** (`sistem/data/test`, 600 sampel) menggunakan skrip harness tunggal:

| Metrik | Tahap | Definisi & Tujuan |
|---|---|---|
| **FSR** (*Full Sequence Reading*) | Model | Persentase bacaan yang benar seluruh karakternya. |
| **CER** (*Character Error Rate*) | Model | Rasio kesalahan karakter (Levenshtein distance / total karakter label). |
| **Akurasi Desimal** | Model | Ketepatan deteksi ada/tidaknya dan posisi titik desimal. |
| **Latensi p50 & p95** | Model & Biaya | Kecepatan inferensi per sampel pada persentil ke-50 dan ke-95. |
| **Kesalahan Senyap (*Silent Error*)** | Verifikasi | Persentase bacaan salah yang diterima otomatis tanpa peringatan (harus $\le 1\%$). |
| **Coverage** | Verifikasi | Persentase total transaksi yang disetujui otomatis oleh sistem. |
| **Selective Accuracy** | Verifikasi | Akurasi pembacaan khusus pada himpunan data yang diterima otomatis ($1 - \text{risk}$). |
| **AURC** | Verifikasi | Ringkasan kinerja selektif dalam satu angka (makin kecil makin baik). |
