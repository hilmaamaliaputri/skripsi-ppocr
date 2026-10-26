# Kandidat K2 — Dekoding CTC Terbimbing Geometri

> Status: KANDIDAT (belum dipilih). Gap anchor: G4, G6.
> Sumber kunci: S01, S14, S17, S19, S20.

## A. Judul (kandidat)
**Dekoding CTC Terbimbing Geometri untuk Pembacaan Display Tujuh Segmen**

## B. Bidang Ilmu
Computer Vision / pengenalan pola.

## C. Permasalahan

### C1. Latar belakang
- CTC mengasumsikan segmentasi tidak diketahui. Akibatnya, dua karakter identik berurutan hanya bisa dihasilkan jika ada blank di antaranya.
- Pada praktiknya ini gagal: `1006.5` terbaca `106.5`; kegagalan didokumentasikan di [S17].
- Titik desimal juga rawan: ukurannya 3–5 px, dan pada T yang kecil ia tidak mendapat timestep sendiri. Sebagian peneliti memisahkan model desimal [S07].
- Pada display 7-segmen, geometri justru **diketahui**: jumlah slot, pitch, dan posisi titik desimal bisa dihitung dari profil proyeksi.
- Belum ada yang memakai geometri itu untuk membatasi alignment CTC.

### C2. Rumusan masalah
1. Bagaimana memanfaatkan posisi slot digit untuk membatasi alignment CTC?
2. Seberapa besar penurunan error pada digit berulang dan titik desimal?
3. Apakah penambahan penalti saat training lebih baik daripada pembatasan saat inferensi saja?

### C3. Tujuan
Mengusulkan dan mengevaluasi dekoding CTC terbimbing geometri, dengan ablation yang jelas terhadap greedy dan beam search.

### C4. Batasan
- Model basis: PP-OCRv6 small (CTC head) dan CRNN [S19] sebagai pembanding.
- Geometri diambil dari profil proyeksi vertikal; tanpa model deteksi tambahan.
- Evaluasi pada data nyata dan sintetis.

### C5. Penelitian terkait
S01 (CRNN-CTC 7-seg), S17 (kegagalan CTC), S19/S20 (dasar), S14 (PP-OCRv6).

## D. Penyelesaian

### D1. Usulan
Tiga komponen:
1. **Ekstraksi slot**: profil proyeksi -> jumlah digit N dan batas x setiap slot.
2. **Constrained decoding**: setiap slot hanya boleh menghasilkan satu emisi (atau blank); titik desimal hanya boleh muncul di antara slot.
3. **Soft penalty** saat training: penalti jika satu slot menghasilkan lebih dari satu karakter.

### D2. Langkah
1. Implementasi ekstraksi slot + unit test pada 50 citra.
2. Implementasi decoder: greedy, beam, constrained, constrained+beam.
3. Ukur ablation pada model yang sudah ada (tanpa retraining).
4. Tambah soft penalty, latih ulang, bandingkan.
5. Analisis error per kategori: digit berulang, desimal, sisip/hapus.

## E. Rancangan eksperimen

| # | Konfigurasi | Yang diukur |
|---|---|---|
| E1 | Greedy CTC | FSR, error digit berulang |
| E2 | Beam search | FSR, latensi |
| E3 | Constrained (inferensi saja) | FSR, error digit berulang, akurasi desimal |
| E4 | Constrained + soft penalty (retrain) | FSR, latensi |
| E5 | Perbandingan dengan CRNN | FSR, parameter |

## F. Metrik
FSR, CER, **laju error digit berulang**, akurasi posisi desimal, latensi, jumlah parameter.

## G. Pustaka kunci
S01, S14, S17, S19, S20, S24.

## Catatan eksekusi
- Ini kandidat paling teknis. Kalau implementasi decoder macet, tidak ada hasil sama sekali — beda dengan K1 yang tetap menghasilkan sesuatu walau verifikasi gagal.
- Perlu unit test untuk ekstraksi slot; kalau slot salah, seluruh eksperimen ikut salah.
- Risiko hasil negatif cukup besar: bisa saja constrained decoding tidak menambah apa-apa. Itu tetap temuan, tapi harus disiapkan secara mental.
