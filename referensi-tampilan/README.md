# Referensi tampilan tujuh segmen per merek

Folder ini berisi contoh tampilan panel dari empat merek yang umum dipakai di
industri beras, sebagai **bahan perancangan generator dataset sintetis**.

## Peringatan penggunaan

1. Gambar di sini berasal dari brosur dan halaman produk resmi pabrikan.
   Statusnya **referensi visual**, bukan data latih.
2. Jangan dipakai sebagai citra latih atau citra uji: labelnya tidak diketahui,
   resolusinya kecil, dan hak penggunaannya bukan milik peneliti.
3. Jangan disebarkan ulang di repositori publik atau lampiran skripsi.
4. Untuk data latih dan uji yang sah, foto tetap harus diambil sendiri.

## Perbandingan rancangan tampilan

| Merek | Jenis layar | Jumlah digit | Ciri khas | Dasar |
|---|---|---|---|---|
| Mettler Toledo (IND231/IND236) | LCD tujuh segmen, lampu latar putih | 7 digit | Tinggi karakter 40 mm; ikon status di bawah angka: nol, bersih, tare, kg, B/G, baterai | Brosur resmi IND231/IND236 |
| CAS (seri SW) | LED pada varian SW-II LED; LCD pada varian lain | 6 digit | Angka besar, tombol kuning di sisi kanan, label merek di atas layar | Brosur seri SW |
| A&D Weighing (seri SW) | LED tujuh segmen | 7 segmen | Tinggi karakter 14,6 mm; lampu pembanding merah/kuning/hijau di sisi kanan | Brosur seri SW |
| Kubota (seri KL) | LCD indikator | belum terbaca dari foto yang tersedia | Indikator bertiang, layar persegi panjang dengan tepi gelap | Halaman produk Kubota |

Empat merek itu memberi empat gaya digit yang berbeda: LCD berlampu latar
putih, LCD kontras rendah, LED merah besar, dan LED merah kecil. Perbedaan
inilah yang membuat satu generator saja tidak cukup.

## Kondisi yang terwakili, dan yang belum

| Kondisi | Status |
|---|---|
| Bersih, frontal, studio | **Ada** — semua foto pabrikan |
| Layar basah / terciprat | Sebagian (CAS seri washdown, A&D) |
| Layar berkabut / uap | Sebagian (A&D) |
| Pantulan matahari | **Belum ada** |
| Kemiringan 15-30 derajat | **Belum ada** |
| LCD pasif kontras rendah di bawah cahaya ruangan | **Belum ada** |
| Layar kotor, berdebu, tergores | **Belum ada** |
| Jarak jauh, panel kurang dari 40 persen bingkai | **Belum ada** |

Kondisi yang belum ada **harus** difoto sendiri di lapangan. Foto pabrikan tidak
bisa menggantikannya, karena semuanya diambil dengan pencahayaan studio.

## Merek lain yang perlu dipertimbangkan

Belum diverifikasi, hanya kandidat berdasarkan pemakaian umum di perdagangan
beras dan industri kecil:

- Excell dan Quattro (timbangan digital pasar, banyak di Indonesia)
- Newtop dan Sakura (timbangan lantai)
- Bizerba, Ohaus, Adam Equipment, Ishida (kelas industri dan laboratorium)

Kalau salah satu dipakai, tambahkan subfolder baru dan catat jenis layarnya
berdasarkan brosur resmi, bukan dari foto penjual.

## Cara memakai folder ini

1. Buka gambar, perhatikan bentuk segmen: tebal batang, sudut, jarak antar digit.
2. Catat mana yang perlu ditiru generator: ketebalan segmen, tinggi digit
   terhadap lebar panel, posisi titik desimal, ada tidaknya ikon.
3. Jangan menyalin gambar ke dataset; tiru **ciri**-nya, bukan pikselnya.
