# Sintesis Gap

> Basis: 25 sumber (S01–S25). Semua klaim di bawah punya ID. Yang tidak punya ID berarti belum diverifikasi.

## Ringkasan
Ruang "arsitektur baru untuk 7-segmen" sudah hampir penuh. Dalam tiga tahun terakhir sudah ada CRNN-CTC, slot CNN, YOLO per digit, DBNet+PARSeq, model klasik berbasis segmen, dan perbandingan VLM. Semua berhenti pada satu hal yang sama: melaporkan akurasi di dataset sendiri.

Yang belum ada: **pengukuran keandalan** dan **verifikasi memakai konteks di luar gambar**.

## 1. Klaim yang sudah diambil

| Klaim | Sumber | Tahun | Konsekuensi |
|---|---|---|---|
| CRNN-CTC untuk 7-seg desimal, exact 90,37%, CER 3,6% | S01 | 2025 | Tidak bisa jadi kebaruan |
| YOLOv8 + CRNN, 98% real-world, bobot terbuka | S17 | 2026 | Tidak bisa jadi kebaruan |
| Slot/digit CNN + data sintetis + stabilisasi temporal, 30 fps | S08 | 2023 | Tidak bisa jadi kebaruan |
| Model digit + model titik desimal terpisah, 96,8%, target low-spec | S07 | 2023 | Modul desimal terpisah bukan hal baru |
| Klasik: segment matching + Hamming di timbangan, 99,7%, 20 ms | S09 | 2026 | Deep learning tidak otomatis menang |
| YOLO untuk angka riil termasuk desimal | S16 | 2023 | Deteksi per digit bukan hal baru |
| VLM vs 5 mesin OCR pada alat ukur digital | S02 | 2026 | Komparasi VLM bukan kebaruan |
| Semi-supervised 7-seg LED + akuisisi data | S06 | 2026 | Pseudo-label bukan kebaruan |
| Koreksi iluminasi untuk meter digital | S10 | 2026 | Preprocessing cahaya bukan kebaruan |
| Generator sintetis 7-seg / DMD | S07, S15 | 2023, 2025 | Sintetis bukan kebaruan |
| DBNet + PARSeq di dataset 7Seg | S04 | 2024 | Kombinasi detektor-recognizer bukan kebaruan |

## 2. Gap yang tersisa

### G1 — Keandalan tidak pernah dilaporkan
Semua sumber melaporkan akurasi. Tidak ada yang melaporkan **silent error rate**, kurva risk–coverage, kalibrasi confidence, atau selective accuracy untuk 7-segmen. Padahal gate confidence dipakai di sistem nyata (contoh: ambang 0,80 di PWA) tanpa pernah divalidasi.
**Status: terbuka.** Tidak ditemukan padanan pada S01–S25.

### G2 — Tidak ada benchmark lintas dataset
Angka yang beredar tidak bisa dibandingkan: 90,37% [S01], 96,8% [S07], 97,8% [S08], 99,7% [S09], 98% [S17]. Semuanya dataset sendiri, dengan definisi "benar" yang berbeda. Tidak ada studi "latih di A, uji di B".
**Status: terbuka.**

### G3 — Verifikasi kontekstual tidak ada
Tidak ada sumber yang memakai konteks di luar gambar untuk memutuskan apakah bacaan layak dipercaya: rentang produk, toleransi, riwayat transaksi, konsistensi jumlah digit terhadap jumlah slot. Semua berhenti di confidence model.
**Status: terbuka.** Ini inti kandidat K1.

### G4 — Error digit berulang dan desimal hanya catatan anekdotal
CTC secara struktural butuh blank di antara dua karakter identik; kegagalan `1006.5` -> `106.5` didokumentasikan di README [S17]. Titik desimal hilang saat data sedikit [S07 memisahkan model desimal justru karena ini]. Tidak ada yang mengukur laju error per kategori atau mengusulkan perbaikan yang diuji.
**Status: terbuka sebagian.**

### G5 — Distilasi VLM ke model kecil untuk 7-segmen
Distilasi VLM sudah umum untuk dokumen, belum untuk 7-segmen. Model guru yang layak sudah ada: Gemini [S02], PaddleOCR-VL, Qwen3-VL.
**Status: terbuka.** Kandidat K4.

### G6 — PP-OCRv6 belum diuji pada 7-segmen
PP-OCRv6 (Juni 2026) menyebut digital display sebagai target [S14], tetapi belum ada publikasi yang mengujinya pada LED/LCD 7-segmen, apalagi membandingkan tier dan kepalanya.
**Status: terbuka.** Kebaruan model, bukan kebaruan metode.

## 3. Dua angka yang tampak bertentangan

| Sumber | Klaim | Konteks |
|---|---|---|
| S13 (MeasureBench, CVPR 2026) | VLM terbaik hanya **30,2%** pada 2.442 citra alat ukur | 26 jenis alat ukur, termasuk dial dan skala; butuh inferensi skala |
| S02 (BEEI 2026) | Gemini **93,85%** FSR pada display 7-segmen | Transkripsi digit murni, bukan inferensi skala |

Keduanya benar. Bedanya: membaca jarum yang menunjuk angka (butuh penalaran spasial) vs membaca angka yang sudah tertulis (transkripsi). Untuk domain ini, yang berlaku adalah S02.

**Implikasi untuk Bab II:** jangan menulis "VLM belum mampu membaca alat ukur". Yang benar: "VLM lemah pada inferensi skala, tetapi kuat pada transkripsi digit; karena itu pada domain ini VLM bukan pesaing akurasi, melainkan pesaing biaya."

## 4. Peringkat gap

| Gap | Kebaruan | Kelayakan S1 | Risiko | Kandidat |
|---|---|---|---|---|
| G3 verifikasi kontekstual | Sedang–tinggi | Tinggi | Rendah | K1 |
| G4 error digit berulang | Sedang | Tinggi | Sedang | K2 |
| G6 PP-OCRv6 pada 7-seg | Sedang | Tinggi | Rendah | K1, K2, K3 |
| G2 benchmark lintas dataset | Sedang | Sedang | Sedang | K3 |
| G1 keandalan/kalibrasi | Tinggi | Tinggi | Rendah | K1 (lapis 4) |
| G5 distilasi VLM | Tinggi | Sedang | Tinggi | K4 |


## 6. Dataset dan pembanding yang tersedia

| Sumber | Isi | Dipakai untuk |
|---|---|---|
| UFPR-AMR [S03] | 2.000 citra meter energi, split 800/400/800, 5 digit, 10.000 anotasi digit | Uji eksternal / pretrain |
| Dataset meter energi mentah [S12] | Citra mentah display 7-seg | Uji eksternal |
| 7-Segment Industrial Digits (Kaggle) | 1.692 citra, label di nama file | Uji eksternal |
| SSDI (KMITL) | 240 citra 1280×720 | Uji eksternal kecil |
| 7SEG_OCR (Hugging Face) | 3.333 citra sintetis berlabel string | Tambahan sintetis |
| LCD tensimeter [S05] | Preseden kamera ponsel untuk display medis | Argumen domain |
| Multi-tipe instrumen [S11] | Bukti panjang bacaan bervariasi bisa ditangani satu model | Pembanding metode |
| PP-OCRv5 [S22] | 5M parameter menyaingi VLM | Pembanding generasi sebelumnya |

Catatan: dataset publik di atas mayoritas **meter energi**, bukan timbangan. Tidak ada dataset publik timbangan dengan label string + titik desimal + metadata kondisi. Ini memperkuat G2 dan menjadi alasan dataset sendiri tetap diperlukan.

## 5. Kesimpulan
Dua kandidat yang paling seimbang antara kebaruan dan kelayakan adalah **K1 (verifikasi kontekstual)** dan **K3 (komparasi generasi model)**. K1 lebih kuat secara kontribusi; K3 lebih aman secara eksekusi. K2 menengah di keduanya. K4 hanya jika pembimbing menghendaki metode yang lebih ambisius.
