#!/usr/bin/env bash
# Kompilasi dokumen LaTeX.
#   bash build.sh              -> main.tex
#   bash build.sh nama         -> nama.tex
#
# Mesin yang dipakai, berurutan:
#   1. tectonic (XeTeX, mandiri, menjalankan BibTeX sendiri)
#   2. latexmk + pdflatex + bibtex
#   3. pdflatex + bibtex berulang
#
# Setelah selesai, skrip memeriksa apakah sitasi benar-benar terpasang
# (menghitung jumlah \bibitem di berkas .bbl), bukan hanya "tidak error".
set -uo pipefail
cd "$(dirname "$0")"
BERKAS="${1:-main}"

TECTONIC="$HOME/tools/tectonic/tectonic.exe"
[ -x "$TECTONIC" ] || TECTONIC="$HOME/tools/tectonic/tectonic"

bersihkan() {
  rm -f "$BERKAS".aux "$BERKAS".bbl "$BERKAS".blg "$BERKAS".log \
        "$BERKAS".out "$BERKAS".toc "$BERKAS".lot "$BERKAS".lof \
        "$BERKAS".xdv "$BERKAS".fls "$BERKAS".fdb_latexmk
}

if [ -x "$TECTONIC" ]; then
  echo "[1/3] Kompilasi dengan tectonic (XeTeX)"
  "$TECTONIC" --keep-intermediates "$BERKAS.tex" || {
    echo "GAGAL: tectonic berhenti. Periksa pesan di atas."; exit 1; }
  "$TECTONIC" "$BERKAS.tex" >/dev/null || true
  "$TECTONIC" "$BERKAS.tex" >/dev/null || true
  n=$(grep -c 'bibitem' "$BERKAS.bbl" 2>/dev/null || echo 0)
  echo "[2/3] Entri daftar pustaka terpasang: $n"
  bersihkan
elif command -v latexmk >/dev/null 2>&1; then
  echo "[1/3] Kompilasi dengan latexmk + pdflatex"
  latexmk -pdf -interaction=nonstopmode "$BERKAS.tex" || {
    echo "GAGAL: latexmk berhenti. Periksa $BERKAS.log."; exit 1; }
  latexmk -c >/dev/null 2>&1
  n=$(grep -c 'bibitem' "$BERKAS.bbl" 2>/dev/null || echo 0)
  echo "[2/3] Entri daftar pustaka terpasang: $n"
elif command -v pdflatex >/dev/null 2>&1; then
  echo "[1/3] Kompilasi dengan pdflatex + bibtex"
  pdflatex --disable-installer -interaction=nonstopmode "$BERKAS.tex" >/dev/null || \
    { echo "GAGAL pada lintasan pertama."; exit 1; }
  bibtex "$BERKAS" >/dev/null || true
  pdflatex --disable-installer -interaction=nonstopmode "$BERKAS.tex" >/dev/null || true
  pdflatex --disable-installer -interaction=nonstopmode "$BERKAS.tex" >/dev/null || true
  n=$(grep -c 'bibitem' "$BERKAS.bbl" 2>/dev/null || echo 0)
  echo "[2/3] Entri daftar pustaka terpasang: $n"
else
  echo "Tidak ada mesin LaTeX yang ditemukan."
  echo "Pasang Tectonic di $HOME/tools/tectonic, atau MiKTeX/TeX Live."
  exit 1
fi

if [ -f "$BERKAS.pdf" ]; then
  echo "[3/3] Selesai: $BERKAS.pdf ($(wc -c < "$BERKAS.pdf") byte)"
else
  echo "[3/3] GAGAL: $BERKAS.pdf tidak terbentuk."
  exit 1
fi
