# 02 — Riset Frontend & Desain Bebas AI Slop (Industrial Workstation UI)

> **Tanggal:** 6 November 2026  
> **Peneliti:** Hilma Amalia Putri (NPM: 237006010)  
> **Status:** Riset Desain Antarmuka & Frontend  
> **Prinsip Utama:** Bebas AI Slop, Berorientasi Operator Gudang/Pabrik, Cepat, Kepadatan Informasi Tinggi, Tahan Kontras Rendah/Tinggi.

---

## 1. Identifikasi & Pencegahan Pola "AI Slop" pada UI/UX

Berdasarkan aturan pada keahlian `antislop-ui`, `antislop-human`, dan `antislop-layoutmobile`, antarmuka hasil kecerdasan buatan sering memiliki pola generik yang mengorbankan fungsi nyata demi estetika dekoratif tanpa arah.

### 1.1 Tanda-Tanda Umum AI Slop (Yang Wajib Dihindari)
1. **Gradien Biru-Ungu / Cyan-Pink Mengambang:** Menggunakan gradien halus acak sebagai latar belakang atau tombol utama tanpa kaitan dengan identitas produk industri.
2. **Kartu Mengambang dengan Bayangan Berlebihan (*Floating Cards Everywhere*):** Membungkus setiap elemen kecil ke dalam *card* dengan bayangan besar (*soft shadow*), sudut melengkung ekstrem (*pill shape / large border-radius*), dan efek kaca (*glassmorphism / backdrop-filter*). Hal ini membuat hierarki visual runtuh dan memboroskan ruang layar.
3. **Penyebaran Efek *Glow* & Partikel Tak Berarti:** Memberikan efek pendar (*glow*) pada tombol, tepi kartu, atau status tanpa fungsi hierarki yang jelas.
4. **Grid Latar Belakang "Sok Teknis" (*Stock Blueprint Grid*):** Menempatkan garis-garis kotak samar di latar belakang hanya agar terlihat modern, yang justru mengaburkan teks tabel angka.
5. **Kepadatan Informasi Rendah:** Spasi padding yang terlalu renggang sehingga operator harus menggulir (*scroll*) berulang kali hanya untuk membaca 3 baris riwayat timbang.

### 1.2 Arah Desain yang Tepat: *Industrial Precision Interface*
Antarmuka untuk pembacaan timbangan industri beras/pabrik menuntut kepraktisan, kecepatan respons, dan kejelasan absolut bagi operator di lapangan:
- **Permukaan Padat & Datar (*Matte & Solid Surfaces*):** Menghilangkan efek blur dan bayangan mengambang. Struktur dipisahkan oleh garis batas tipis yang tegas (*1px solid subtle border*).
- **Tipografi Fungsional & Angka Monospace:** Angka display timbangan ditampilkan dengan font monospaced (seperti JetBrains Mono, Roboto Mono, atau font 7-segmen khas metrologi) agar posisi koma dan digit selalu sejajar secara vertikal.
- **Kepadatan Informasi Terkalibrasi (*Calibrated Data Density*):** Tabel transaksi ringkas, mudah dibaca sekilas, dengan tombol aksi besar yang jelas untuk pengoperasian dengan sarung tangan atau layar sentuh.
- **Pewarnaan Semantik Tegas (Maksimal 2-3 Warna Inti + Aksen Status):**
  - Netral: Abu-abu gelap / Slate / Off-white untuk struktur dasar.
  - Hijau Metrologi: Transaksi `TERIMA` (diterima sah).
  - Merah Amber: Transaksi `TOLAK` (di luar batas fisik / struktur cacat).
  - Kuning Industri: Status `KONFIRMASI` (butuh potret ulang 1 bingkai).
  - Aksen Netral: Status `BATAL`.
- **Dukungan Aksesibilitas & Keyboard:** Operator gudang sering menggunakan tombol fisik (`Enter` untuk rekam, `Space` untuk potret ulang, `Esc` untuk batal), bukan hanya klik mouse.

---

## 2. Analisis Pilihan *Tech Stack* Frontend

Untuk menghubungkan model Python (PP-OCRv6 + OpenCV + Verifikasi) dengan antarmuka pengguna:

| Opsi Stack | Arsitektur | Kelebihan | Keterbatasan | Kesesuaian |
|---|---|---|---|---|
| **Opsi A: React / Next.js / Vite + Tailwind + FastAPI** | Terpisah (Frontend SPA/PWA + Backend API) | • Arsitektur modern modular industri<br>• Kontrol penuh atas styling antislop (Tailwind utility tanpa komponen slop)<br>• Siap dijadikan PWA (luring di ponsel)<br>• Kerapatan komponen tinggi | Memerlukan dua runtime (Node.js dan Python) saat pengembangan | **Sangat Tinggi (Pilihan Standar TA Modern)** |
| **Opsi B: Streamlit Dashboard** | Terpadu (Python murni) | • Sangat cepat dibangun<br>• Satu bahasa (Python saja) | • Tampilan bawaan kaku dan sulit melepaskan diri dari gaya generic AI/dashboard cards<br>• Sulit menangani feed kamera multi-frame real-time berlatensi rendah | Rendah untuk produk akhir, cukup untuk demo laboratorium |
| **Opsi C: Tauri + React / Svelte** | Desktop Native Ringan | • Sangat cepat, ukuran binary kecil, offline murni | Memerlukan kompilasi Rust dan konfigurasi build yang lebih kompleks | Sedang |

---

## 3. Komponen Utama Antarmuka

Antarmuka dirancang modular dengan pemisahan komponen tunggal (*anti-monolith*):
1. **`CameraViewfinder`**: Menampilkan pratinjau kamera, penanda batas kotak ROI display 7-segmen, dan status akuisisi 3–5 bingkai.
2. **`ReadingInspector`**: Menampilkan perbandingan antara citra panel mentah, hasil binarisasi/proyeksi slot OpenCV, dan string hasil inferensi PP-OCRv6.
3. **`VerificationPipelineStatus`**: Menampilkan 4 lampu status lapis verifikasi (L3 Temporal, L1 Struktur, L2 Fisik, L4 Kalibrasi) yang menunjukkan lapis mana yang meloloskan atau menolak.
4. **`DecisionBanner`**: Kartu keputusan besar dengan status tegas (`TERIMA`, `TOLAK`, `KONFIRMASI`, `BATAL`) beserta alasan operasional yang ringkas.
5. **`TransactionAuditTable`**: Tabel jejak audit transaksi terkini dengan fitur pencarian dan ekspor log JSONL.
