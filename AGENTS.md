# Aturan kerja repo ini

## Sumber
- Setiap klaim faktual di dokumen outline wajib merujuk ID `S##` yang ada di `docs/research/source-ledger.md`.
- Dilarang menambah entri ledger tanpa DOI/URL yang bisa dibuka.
- Angka dari sumber lain ditulis apa adanya, tanpa dibulatkan ke atas.
- Yang belum diverifikasi ditandai `[PERLU CEK]`, bukan dikarang.

## Bahasa
- Bahasa Indonesia. Istilah teknis boleh bahasa Inggris.
- Tanpa pembuka basa-basi, tanpa "delve", tanpa klaim berlebihan.
- Setiap persentase akurasi disertai jumlah sampel dan sumbernya.

## Git
- Commit author: `feb027 <febnawan.fatur@gmail.com>`.
- Pesan commit: `<area>: <perubahan>` (contoh: `outline: tambah kandidat K2`).
- Jangan commit data mentah, model, atau kredensial.

## Sebelum commit
```bash
python3 scripts/check_refs.py
```
