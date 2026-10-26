# 00 — Project Brief

## Identitas
- Peneliti: Hilma Amalia Putri
- NPM: (diisi)
- Program Studi: S1 Teknik Informatika, Fakultas Teknik, Universitas Siliwangi
- Kelompok Bidang Keahlian: Informatika dan Sistem Inteligen (konfirmasi ke prodi)
- Pembimbing: (diisi)

## Topik
Pembacaan angka pada display tujuh segmen (LED/LCD) menggunakan model OCR mutakhir, dengan luaran berupa sistem pencatatan yang dapat menolak bacaan yang tidak layak dipercaya.

## Bentuk TA
Tiga varian yang mungkin, dipetakan di `docs/outline/varian-bentuk-ta.md`:
- Varian A — studi komparasi/eksplorasi
- Varian B — pembangunan/pengembangan sistem
- Varian C — pengembangan metode

## Masalah inti
1. OCR generik (Tesseract, ML Kit) dirancang untuk teks dokumen dan gagal pada geometri segmen: 0/12 exact match pada 12 percobaan di 2 citra timbangan nyata [S25]; kegagalan serupa dilaporkan pada literatur [S04].
2. Model deep learning untuk 7-segmen sudah banyak (CRNN-CTC, slot CNN, YOLO+CRNN, klasik), tetapi semuanya berhenti pada pelaporan akurasi di dataset sendiri [S01, S07, S08, S09].
3. Tidak ada studi yang melaporkan **silent error**: bacaan salah yang lolos tanpa peringatan. Padahal di pencatatan timbangan, satu bacaan salah lebih mahal daripada sepuluh bacaan yang ditolak.
4. Model terbaru (PP-OCRv6, Juni 2026) menyasar digital display tetapi belum diuji pada 7-segmen, dan belum ada yang memakai konteks fisik (rentang produk, toleransi, riwayat) untuk memverifikasi hasilnya.

## Batasan awal
- Karakter: `0`–`9` dan titik desimal; panjang 1–8 karakter.
- Objek: display 7-segmen LED atau LCD pada timbangan digital.
- Data uji: citra nyata yang tidak dipakai untuk training atau tuning.
- Sistem: satu lini produk, satu server lokal, tanpa integrasi ERP.

## Aset awal
Repo `skripsi-analisa-timbang` (dataset sintetis 1.000 label, pipeline CRNN, PWA) dipakai sebagai **bahan dan data**, bukan sebagai basis kode. Sistem baru dibangun dari nol.

## Pertanyaan yang harus dijawab riset
1. Sejauh mana model OCR 2026 (PP-OCRv6) mampu membaca display 7-segmen tanpa adaptasi?
2. Adaptasi minimum apa yang dibutuhkan (ganti kepala, fine-tune sebagian, atau penuh)?
3. Lapisan verifikasi apa yang paling efektif menekan silent error?
4. Berapa trade-off antara coverage dan akurasi pada bacaan yang diterima otomatis?
