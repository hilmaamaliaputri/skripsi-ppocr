# Kandidat K1 — Verifikasi Kontekstual Hasil OCR PP-OCRv6

> Status: KANDIDAT (belum dipilih). Gap anchor: G1, G3, G4, G6.
> Sumber kunci: S01, S02, S07, S08, S09, S13, S14, S17.

## A. Judul (kandidat)
**Verifikasi Kontekstual Hasil OCR PP-OCRv6 untuk Pembacaan Display Tujuh Segmen pada Sistem Pencatatan Timbangan**

Alternatif yang lebih pendek:
**Sistem Pencatatan Timbangan dengan Verifikasi Berlapis Pembacaan Display Tujuh Segmen**

## B. Bidang Ilmu
Computer Vision + Rekayasa Perangkat Lunak. KK Informatika dan Sistem Inteligen (konfirmasi ke prodi).

## C. Permasalahan

### C1. Latar belakang
- Pencatatan berat di gudang dan pabrik masih manual; kesalahan catat dan tidak adanya jejak audit menjadi masalah operasional.
- OCR generik gagal pada 7-segmen: Tesseract 0/12 exact match pada citra timbangan nyata [S25]; literatur melaporkan pola kegagalan yang sama [S04].
- Metode deep learning sudah banyak dan akurat: CRNN-CTC 90,37% [S01], slot CNN 97,8% [S08], klasik 99,7% [S09]. Tetapi semuanya berhenti di akurasi dataset sendiri.
- Model terbaru PP-OCRv6 (Juni 2026) menyasar digital display [S14], belum diuji pada 7-segmen.
- Tidak ada yang melaporkan **silent error**: bacaan salah yang lolos tanpa peringatan. Di transaksi timbang, satu bacaan salah lebih mahal daripada sepuluh penolakan.

### C2. Rumusan masalah
1. Sejauh mana PP-OCRv6 membaca display 7-segmen tanpa adaptasi, dan adaptasi minimum apa yang diperlukan?
2. Bagaimana merancang lapisan verifikasi kontekstual yang menekan silent error pada pembacaan 7-segmen?
3. Berapa trade-off coverage–akurasi yang dihasilkan, dan bagaimana dampaknya terhadap beban koreksi operator?

### C3. Tujuan
Menghasilkan sistem pembacaan 7-segmen dengan bukti kuantitatif keandalan: silent error rate, coverage, selective accuracy, dan tingkat koreksi operator.

### C4. Batasan
- Karakter `0`–`9` dan titik desimal, 1–8 karakter.
- Satu lini produk, 5 merek timbangan, server lokal, tanpa integrasi ERP.
- Model: PP-OCRv6 small (5,2M) sebagai utama; medium sebagai pembanding.
- Dataset uji: citra nyata yang tidak dipakai training/tuning.

### C5. Penelitian terkait (klaster)
- Metode 7-segmen: S01, S04, S07, S08, S09, S16, S17, S18.
- Model 2026: S02, S13, S14, S15.
- Dasar metode: S19, S20, S21, S24.

## D. Penyelesaian

### D1. Usulan
Pipeline empat lapis:

```
foto -> crop baris angka -> PP-OCRv6 -> kandidat "48.65", conf 0.91
                                            |
                        +-------------------+
                        | VERIFIKASI        |
                        | 1 struktural      |  jumlah digit vs slot, posisi desimal
                        | 2 fisik           |  rentang produk, toleransi, delta
                        | 3 temporal        |  agreement antar frame
                        | 4 statistik       |  confidence terkalibrasi
                        +---------+---------+
                                  |
                     terima / tolak / minta konfirmasi
```

Lapis 2 dan 3 hanya mungkin ada karena sistem menyimpan konteks (DB produk, multi-frame, riwayat). Inilah alasan kontribusinya tidak bisa direduksi menjadi "panggil model lalu tampilkan".

### D2. Langkah
1. Kumpulkan 200–300 citra nyata, 5 merek, 3 kondisi cahaya, 3 sudut.
2. L0: zero-shot PP-OCRv6 tiny/small/medium.
3. L1: ganti kepala 18.714 -> 12 kelas, latih output saja.
4. Bangun lapis verifikasi 1–2, ukur penurunan silent error.
5. Bangun sistem: endpoint, DB, UI, log.
6. Lapis 3–4 + kalibrasi, ukur coverage.
7. Uji black-box, ukur waktu per transaksi dan tingkat koreksi.

## E. Rancangan eksperimen

| # | Sistem | Pertanyaan | Metrik utama |
|---|---|---|---|
| E1 | Zero-shot tiny/small/medium | Sudah bisakah tanpa adaptasi? | FSR, jenis error |
| E2 | + kepala 12 kelas | Berapa tier minimum yang cukup? | FSR, akurasi desimal |
| E3 | + verifikasi struktural | Berapa silent error yang tertangkap? | silent error, coverage |
| E4 | + verifikasi fisik | Apa tambahan dari konteks produk? | silent error, coverage |
| E5 | + temporal + kalibrasi | Di mana titik seimbangnya? | AURC, selective accuracy |
| E6 | Sistem penuh vs baseline | Apa dampak ke operator? | tingkat koreksi, waktu/transaksi |

## F. Metrik
- **FSR** (full-string recognition): persentase string utuh benar.
- **CER**: character error rate.
- **Akurasi desimal**: persentase titik desimal pada posisi benar.
- **Silent error rate**: bacaan salah yang diterima sistem tanpa peringatan. *Metrik utama.*
- **Coverage**: persentase bacaan yang diterima otomatis.
- **Selective accuracy**: akurasi pada bacaan yang diterima.
- **AURC**: area under risk–coverage curve.
- **Latensi** p50/p95, ukuran model, tingkat koreksi operator.

## G. Pustaka kunci
S01, S02, S07, S08, S09, S13, S14, S17, S19, S20.

## Catatan eksekusi
- Risiko utama: data nyata. Tanpa 200 citra, E1–E6 tidak bisa jalan. Mulai dari sini.
- Kalau PP-OCRv6 zero-shot sudah >90%, kontribusi bergeser sepenuhnya ke lapis verifikasi — dan itu tetap sah.
- Lapis 2 butuh keputusan bisnis (rentang dan toleransi per produk). Siapkan wawancara singkat dengan pemilik gudang.
