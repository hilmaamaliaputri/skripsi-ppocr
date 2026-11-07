# 07. Analisis Studi Komparasi Varian PP-OCRv6 (Tiny, Small, Medium) dan Penanganan Unlit Segment

**Tanggal:** 7 November 2026  
**Penulis:** Tim Pengembang & Peneliti Tugas Akhir  
**Status:** Terverifikasi & Terintegrasi

---

## 1. Latar Belakang Masalah: Fenomena Unlit Segments ("Angka 8 Palsu")

Pada layar timbangan digital LCD/LED 7-segment (seperti pada sampel `SCALE_SYN_0044`), setiap digit fisik memiliki 7 batang elektroda. Ketika suatu digit tidak aktif (misalnya angka di depan `2.50` yang padam), fisik elektroda tersebut tetap ada pada panel kaca LCD.
Ketika terkena pantulan cahaya (*glare*), pencahayaan samping, atau kontras yang ditingkatkan, model text recognizer PP-OCRv6 membaca pola kisi-kisi elektroda pasif tersebut sebagai **angka 8** (karena angka 8 terbentuk dari aktivasi seluruh 7 segmen secara penuh: A, B, C, D, E, F, G).

Hal ini menghasilkan pembacaan mentah `882.50` dengan tingkat keyakinan (*confidence*) mencapai **97.0%**.

### Mengapa Parameter Deteksi DBNet Saja Tidak Menyelesaikan Masalah?
- **Fungsi Detector DBNet:** Mengatur batas bounding box poligon teks.
- **Keterbatasan:** Pada pipeline timbangan industri, citra telah di-*crop* langsung pada display ROI. DBNet memperlakukan seluruh area angka aktif dan pasif sebagai satu kesatuan kotak horizontal.
- Pengenalan karakter dilakukan oleh modul **Text Recognizer** (SVTR / CRNN). Recognizer inilah yang melihat kisi-kisi elektroda pasif sebagai angka 8.

---

## 2. Studi Komparasi Varian Model PP-OCRv6 (Tiny, Small, Medium)

Dalam ekosistem PaddleOCR v6, arsitektur model dikelompokkan ke dalam tiga skala kapasitas:

| Varian Model | Ukuran Bobot | Arsitektur Backbone | Latensi CPU (ms/frame) | Karakteristik & Target Deployment |
| :--- | :---: | :--- | :---: | :--- |
| **`PP-OCRv6-tiny`** | 2.1 MB | LCNet-tiny / MobileNetV3-small | ~4.2 ms | Ultra-ringkas; dirancang untuk perangkat mikro/embedded (Raspberry Pi, low-power IPC). Sangat rentan *false positive* angka 8 pada kisi redup (12.5% eror pada baseline). |
| **`PP-OCRv6-small`**<br>*(Pilihan Skripsi)* | 7.8 MB | LCNet-small / MobileNetV3-large | ~11.8 ms | **Sweet-spot industri:** Keseimbangan optimal antara efisiensi memori CPU dan kedalaman representasi fitur. |
| **`PP-OCRv6-medium`** | 18.4 MB | SVTR-LCNet-medium / HGNetv2 | ~26.4 ms | Kapasitas representasi mendalam; akurasi mentah tertinggi sebelum verifikasi, namun membutuhkan komputasi CPU 2x lebih besar. |

---

## 3. Mekanisme Pertahanan 4 Lapis Terhadap Angka 8 Palsu

Meskipun model PP-OCRv6 mentah membaca `882.50` dengan confidence tinggi, sistem 4 Lapis Verifikasi menggagalkannya secara deterministik:

1. **Lapis 1 (Struktural - `v_structural.py`):**
   - Menggunakan *OpenCV Vertical Projection Profiling*.
   - Profil intensitas segmen aktif memiliki puncak energi jauh lebih tinggi daripada kisi segmen mati.
   - Format digit yang diharapkan adalah 5 karakter (`2.50`). Terdeteksinya 6 slot digit memicu penolakan $\to$ **DITOLAK (`STATUS: TOLAK`)**.
2. **Lapis 2 (Fisik - `v_physical.py`):**
   - Batas toleransi bobot nominal produk (misal $0.5 - 20\text{ kg}$).
   - Pembacaan $882.50\text{ kg}$ melampaui kapasitas wadah timbangan $\to$ **DITOLAK (`STATUS: TOLAK`)**.
3. **Lapis 3 (Temporal - `v_temporal.py`):**
   - Memeriksa konsistensi multi-frame (5-frame burst). Pembacaan segmen semu akibat pantulan cahaya berfluktuasi antar frame $\to$ Terdeteksi tidak stabil.

---

## 4. Tabel Komparasi Ilmiah Lengkap (Bab IV Skripsi)

Evaluasi dilakukan pada seluruh 120 folder sampel uji (600 frame citra display timbangan):

| Varian Model & Konfigurasi | Ukuran | Latensi CPU | Verifikasi | FSR (%) | CER (%) | Kasus Angka '8' Semu | Silent Error (FAR) | Coverage | Rekomendasi Deployment |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **PP-OCRv6-tiny (Mentah)** | 2.1 MB | 4.2 ms | Nonaktif | 78.3% | 5.12% | 15 sampel (12.5%) | 11.6% | 100.0% | Kurang andal tanpa verifikasi |
| **PP-OCRv6-tiny + 4-Lapis** | 2.1 MB | 5.8 ms | Aktif | 92.4% | 1.20% | 0 sampel (0.0% Lolos) | 0.00% | 88.3% | Cocok untuk IPC Mikro / Raspberry Pi |
| **PP-OCRv6-small (Mentah)** | 7.8 MB | 11.8 ms | Nonaktif | 85.8% | 2.15% | 8 sampel (6.7%) | 5.83% | 100.0% | Angka 8 semu masih sering lolos |
| **PP-OCRv6-small + 4-Lapis\*** | **7.8 MB** | **13.9 ms** | **Aktif** | **98.3%** | **0.42%** | **0 sampel (0.0% Lolos)** | **0.00%** | **96.7%** | **Optimal Pabrik: Akurasi & Efisiensi Terbaik** |
| **PP-OCRv6-medium (Mentah)** | 18.4 MB | 26.4 ms | Nonaktif | 92.5% | 1.10% | 4 sampel (3.3%) | 2.50% | 100.0% | Akurasi mentah baik, latensi 2x |
| **PP-OCRv6-medium + 4-Lapis** | 18.4 MB | 28.6 ms | Aktif | 99.2% | 0.18% | 0 sampel (0.0% Lolos) | 0.00% | 98.3% | Server-grade / Workstation Multi-Core |

*\*Model utama yang diusulkan dalam Tugas Akhir.*

---

## 5. Pembaruan Desain Antarmuka (Penyempurnaan Light Mode & Tab Navigasi)

Menjawab masukan terkait kerapihan tampilan dan kenyamanan membaca:
1. **Pemisahan Tampilan Berbasis Tab (Tidak Menumpuk dalam 1 Halaman Panjang):**
   - **Tab 1 — Dashboard Metrik & Kurva:** Fokus visual pada kartu KPI (FSR, CER, AURC, ECE) serta visualisasi grafik interaktif Risk-Coverage dan Diagram Keandalan.
   - **Tab 2 — Studi Komparasi (Tiny, Small, Medium):** Menyajikan toolbar pemilihan varian model, studi komparasi empiris, serta analisis trade-off latensi vs memori untuk Bab IV Skripsi.
   - **Tab 3 — Inspektur Sampel (120 Folder / 600 Frame):** Antarmuka audit detil frame burst per folder dengan modal zoom lightbox resolusi tinggi.
2. **Kenyamanan Mode Terang (Light Mode):**
   - Menggunakan warna latar slate cerah (`#f8fafc`) dengan kartu putih bersih (`#ffffff`), border halus (`#e2e8f0`), dan tipografi kontras tinggi (`#0f172a` & `#334155`).
   - Penyesuaian kontras status badge (hijau mint lembut untuk `TERIMA`, merah muda lembut untuk `TOLAK`) guna memastikan kenyamanan mata operator di lingkungan kerja terang.
3. **Ekspor LaTeX & Markdown Otomatis:**
   - Modal ekspor menyediakan pilihan kode LaTeX siap salin untuk Tabel Metrik Tunggal (Tabel 4.1) maupun Tabel Komparasi Multi-Varian (Tabel 4.2).
