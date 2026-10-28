# 02 — Rencana Mingguan sampai Desember 2026

> Status: RENCANA KERJA AKTIF.
> Basis keputusan bimbingan 27 Oktober 2026: kandidat **K1** (verifikasi kontekstual), bentuk TA **sistem (Varian B)**.
> Kebijakan data: **data latih sintetis**, **test set tetap memuat foto nyata**.
> Target: seluruh pengujian selesai dan hasil keluar pada **Desember 2026**.

## A. Asumsi dan batas rencana

| Hal | Nilai |
|---|---|
| Mulai | Senin, 26 Oktober 2026 |
| Total minggu | 10 minggu (W1–W10) |
| Hasil eksperimen inti keluar | akhir W7 (13 Desember) |
| Seluruh eksperimen selesai | akhir W8 (20 Desember) |
| Naskah utuh | 31 Desember |
| Buffer | **nol** |

Rencana ini tidak memiliki kelonggaran. Konsekuensinya ada di bagian E.

## B. Rencana per minggu

### W1 — 26 Oktober – 1 November: kunci kerangka dan spesifikasi data

| Isi | Luaran |
|---|---|
| Finalkan rumusan masalah, tujuan, batasan dari K1 | `kandidat-K1` naik status dari KANDIDAT ke FINAL |
| Susun spesifikasi dataset: jumlah citra, variasi, kondisi sulit, format label | `docs/03-spesifikasi-dataset.md` |
| Tetapkan target metrik dan ambang lulus | tertulis di spesifikasi |
| Jadwalkan sesi foto nyata (tanggal, lokasi, unit timbangan) | tanggal pasti, bukan "nanti" |

**Kondisi sulit yang wajib ada di test set** (alasannya: pada kondisi inilah lapisan verifikasi punya pekerjaan, dan pada kondisi inilah sistem tanpa gerbang paling mungkin gagal tanpa memberi tahu):

1. Bersih, frontal, kontras tinggi
2. Pantulan cahaya pada layar
3. Sudut miring (15–30 derajat)
4. LCD pasif berkontras rendah
5. Digit terhalang sebagian
6. Panjang 7–8 karakter

**Gate W1:** spesifikasi dataset selesai dan tanggal sesi foto sudah pasti. Tanpa ini, W2 dan W4 akan bergeser.

### W2 — 2–8 November: bangun generator dan test set sintetis

| Isi | Luaran |
|---|---|
| Bangun generator sintetis berparameter (font segmen, warna LED merah/hijau/biru, ketebalan, kontras LCD pasif, sudut, blur, noise) | `scripts/generate_synthetic.py` |
| Hasilkan train 8.000–12.000 citra, val 1.000, test sintetis terkontrol 600 (100 per kondisi) | `data/synthetic/` + `labels.csv` |
| Unit test: label benar, jumlah slot tercatat, posisi desimal tercatat | `tests/` |

Prinsip yang menentukan: **variasi lebih penting daripada jumlah**. Lima ratus citra bervariasi lebih berguna daripada lima ribu citra yang mirip semua. Riwayat latihan sebelumnya mandek di 50,0% pada 1.000 citra sintetis karena variasinya sempit, bukan karena jumlahnya kurang.

**Gate W2:** 20 citra sampel diperiksa manual — label, jumlah slot, dan posisi desimal benar semua.

### W3 — 9–15 November: baseline zero-shot (E1)

| Isi | Luaran |
|---|---|
| Jalankan PP-OCRv6 tiny, small, medium secara zero-shot pada test sintetis [S14] | `results/E1/` |
| Simpan JSON mentah per citra, bukan hanya ringkasan | arsip output |
| Hitung FSR, CER, akurasi posisi desimal, interval kepercayaan 95% | tabel E1 |

Aturan yang tidak boleh dilanggar: **tidak ada tuning apa pun** sebelum E1 dijalankan. Hasil E1 adalah ukuran apa adanya.

**Gate W3:** tabel E1 keluar lengkap dengan n sampel dan CI.

### W4 — 16–22 November: foto nyata (dikunci) dan L1 ganti kepala (E2)

| Isi | Luaran |
|---|---|
| Ambil 60–100 citra nyata: 5 merek, 3 kondisi cahaya, 3 sudut; rekam video 2–3 detik per pembacaan | `data/real/` |
| Kunci test set nyata: catat hash, bekukan, larang perubahan | `data/real/LOCKED.md` |
| L1: ganti kepala 18.714 → 12 kelas, latih bagian output saja di data sintetis | `models/l1/` |
| Evaluasi pada test sintetis dan test nyata | tabel E2 |

Video 2–3 detik per pembacaan wajib: lapis verifikasi temporal di W7 membutuhkan beberapa bingkai dari pembacaan yang sama. Tanpa video, lapis 3 tidak bisa diuji dan harus kembali ke lapangan.

**Gate W4:** test set nyata terkunci dan dibekukan. Setelah dikunci, tidak boleh dipakai untuk memilih ambang, memilih prompt, atau menyetel preprocessing.

### W5 — 23–29 November: lapis 1 struktural (E3)

| Isi | Luaran |
|---|---|
| Implementasi verifikasi struktural: jumlah digit vs jumlah slot, posisi desimal yang sah | `src/verify_structural.py` |
| Ukur penurunan silent error dan perubahan coverage | tabel E3 |

Lapis ini menjawab pola kegagalan yang terdokumentasi: pada CTC, dua karakter identik berurutan membutuhkan *blank* di antaranya, sehingga "1006.5" dapat terbaca "106.5" [S17, S20].

**Gate W5:** dampak lapis 1 terukur. Bila tidak menurunkan apa pun, dicatat sebagai temuan, bukan dihapus.

### W6 — 30 November – 6 Desember: lapis 2 fisik (E4)

| Isi | Luaran |
|---|---|
| Definisikan 5–8 produk contoh beserta rentang berat sah dan toleransi | `config/produk.yaml` |
| Implementasi aturan fisik: rentang produk, toleransi, selisih terhadap riwayat | `src/verify_physical.py` |
| Ukur dampak terhadap silent error dan coverage | tabel E4 |

**Gate W6:** tabel E4 selesai. Ini lapis yang paling bergantung pada keputusan domain, bukan pada model — pastikan definisi produk sudah final sebelum diukur.

### W7 — 7–13 Desember: lapis 3 temporal, lapis 4 kalibrasi, kurva risk–coverage (E5)

| Isi | Luaran |
|---|---|
| Verifikasi temporal: agreement antar bingkai dari video | `src/verify_temporal.py` |
| Kalibrasi confidence memakai **split kalibrasi terpisah** dari test set | `src/calibrate.py` |
| Hitung AURC, selective accuracy, kurva risk–coverage | tabel E5 + gambar |

**Gate W7 adalah gate hasil utama.** Bila angka E5 belum keluar pada 13 Desember, target Desember berisiko. Lihat bagian E.

### W8 — 14–20 Desember: sistem penuh dan uji black-box (E6)

| Isi | Luaran |
|---|---|
| Rangkai alur satu transaksi: foto → OCR → 4 lapis → terima/tolak/konfirmasi → simpan | sistem berjalan |
| Uji fungsional: instalasi, mode offline (mode pesawat, tab Network harus nol permintaan), simpan blob, pemindaian | tabel lulus/tidak |
| Ukur tingkat koreksi operator dan waktu per transaksi p50/p95 | tabel E6 |

**Gate W8:** seluruh eksperimen E1–E6 selesai, hasil di tangan.

### W9 — 21–27 Desember: analisis dan Bab IV

| Isi | Luaran |
|---|---|
| Analisis error per kategori: digit berulang, titik desimal, panjang bacaan, kondisi citra | sub-bab analisis |
| Periksa ulang seluruh interval kepercayaan dan n sampel | tabel final |
| Susun Bab IV | draf Bab IV |

### W10 — 28–31 Desember: Bab V dan konsolidasi naskah

| Isi | Luaran |
|---|---|
| Bab V: kesimpulan, keterbatasan, saran | draf Bab V |
| Daftar pustaka final, cek 5 butir `[PERLU CEK]` pada S01 | naskah utuh Bab I–V |

## C. Peta eksperimen ke minggu

| Eksperimen | Isi | Minggu |
|---|---|---|
| E1 | Zero-shot tiny/small/medium [S14] | W3 |
| E2 | Ganti kepala 12 kelas | W4 |
| E3 | Verifikasi struktural | W5 |
| E4 | Verifikasi fisik | W6 |
| E5 | Temporal + kalibrasi, risk–coverage | W7 |
| E6 | Sistem penuh, black-box, dampak ke operator | W8 |

## D. Yang harus selalu dijaga

1. Test set dikunci setelah W4. Tidak ada tuning setelah itu.
2. Split kalibrasi terpisah dari test set. Confidence tidak boleh dikalibrasi di data yang dipakai menilai.
3. Setiap persentase disertai n dan interval kepercayaan. Dengan n = 100, CI sekitar ±10%.
4. Output mentah disimpan. Ringkasan saja tidak cukup untuk menjawab pertanyaan sidang.
5. Hasil negatif dilaporkan sebagai hasil.

## E. Aturan bila meleset

Rencana ini tanpa buffer, jadi geseran harus dibayar dengan pemangkasan lingkup, bukan dengan menunda target.

| Bila meleset | Potong ini | Jangan potong ini |
|---|---|---|
| W2 lewat 3 hari | Turunkan jumlah citra sintetis, pertahankan variasi | Jumlah kondisi sulit (tetap 6) |
| W4 gagal ambil foto | Turunkan ke 40 citra nyata, sebutkan n kecil + CI lebar | Keberadaan test set nyata |
| W5–W6 lambat | Gabungkan lapis 1 dan 2 jadi satu eksperimen | Pengukuran silent error |
| W7 lewat 4 hari | Lepas baris pembanding CRNN [S19] dan ssocr [S18] | Kurva risk–coverage |
| W8 lambat | Pakai antarmuka minimal, bukan PWA lengkap | Uji offline dan waktu per transaksi |

Aturan terakhir: bila W7 tidak selesai pada 13 Desember, **target Desember tidak tercapai** — dan itu harus dilaporkan ke pembimbing segera, bukan ditutupi.
