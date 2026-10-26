# Kandidat K3 — Komparasi Generasi Model 2026

> Status: KANDIDAT (belum dipilih). Gap anchor: G2, G6.
> Sumber kunci: S01, S02, S09, S14, S17, S18.

## A. Judul (kandidat)
**Komparasi PP-OCRv6, CRNN, Model Klasik, dan VLM untuk Pembacaan Display Tujuh Segmen**

## B. Bidang Ilmu
Computer Vision / studi komparasi.

## C. Permasalahan

### C1. Latar belakang
- Angka akurasi yang beredar tidak dapat dibandingkan: 90,37% [S01], 97,8% [S08], 99,7% [S09], 98% [S17], 93,85% [S02]. Semuanya dataset sendiri.
- Model 2026 menawarkan tiga pendekatan berbeda: OCR khusus kecil (PP-OCRv6, 1,5M–34,5M) [S14], VLM (Gemini/Qwen) [S02], dan klasik berbasis segmen [S09].
- Belum ada yang membandingkannya pada data yang sama, dengan metrik yang sama, termasuk biaya dan latensi.

### C2. Rumusan masalah
1. Mana yang paling akurat pada data 7-segmen nyata?
2. Berapa biaya (parameter, latensi, ukuran) untuk mencapai akurasi tersebut?
3. Pada kondisi apa masing-masing metode gagal?

### C3. Tujuan
Menghasilkan tabel perbandingan yang adil dan dapat direproduksi, plus rekomendasi pemilihan metode berdasarkan batasan biaya.

### C4. Batasan
- Empat metode: PP-OCRv6 (zero-shot + fine-tune), CRNN [S19], ssocr [S18], Qwen3-VL-2B atau Gemini [S02].
- Tiga dataset: sintetis, publik, nyata sendiri.
- Metrik sama untuk semua.

## D. Penyelesaian

### D1. Usulan
Benchmark kecil yang terkontrol: satu test set nyata (200 citra), satu protokol evaluasi, empat metode, tiga kondisi (bersih, glare, miring).

### D2. Langkah
1. Siapkan test set + metadata kondisi.
2. Jalankan keempat metode, simpan output mentah.
3. Hitung metrik dengan skrip yang sama.
4. Analisis error per kondisi.
5. Hitung biaya: parameter, ukuran, latensi, biaya API per 1.000 citra.

## E. Rancangan eksperimen

| # | Metode | Adaptasi |
|---|---|---|
| E1 | PP-OCRv6 small | zero-shot + fine-tune |
| E2 | CRNN | latih dari nol / sintetis |
| E3 | ssocr | tanpa training |
| E4 | VLM | zero-shot + prompt terstruktur |

## F. Metrik
FSR, CER, akurasi desimal, latensi p50/p95, parameter, ukuran, biaya per 1.000 citra, CI 95%.

## G. Pustaka kunci
S01, S02, S09, S14, S17, S18, S19.

## Catatan eksekusi
- Paling aman: apa pun hasilnya, selalu ada tabel.
- Novelty paling rendah: ini "hanya" evaluasi. Tapi justru inilah yang dibutuhkan literatur (G2).
- Butuh disiplin: test set tidak boleh dipakai untuk memilih prompt atau ambang.
