#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bangun draft usulan penelitian dalam format .docx dari berkas LaTeX.

Sumber tunggal isi tetap berkas .tex di ../laporan-latex/bab/.
Jalankan:  python build_docx.py
Hasil   :  draft-usulan-penelitian.docx
"""
from __future__ import annotations

import pathlib
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION, WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

HERE = Path(__file__).resolve().parent
BAB = HERE  # tex tunggal ada di folder ini
GAMBAR = HERE / "gambar"
BIB = HERE / "references.bib"
KELUAR = pathlib.Path(r"C:/Users/hilma/AppData/Local/hermes/cache/scratch/outline-build.docx")

JUDUL = ("VERIFIKASI BERLAPIS DAN KOMPARASI MODEL "
         "PADA TAMPILAN TUJUH SEGMEN TIMBANGAN DIGITAL")
NAMA = "Hilma Amalia Putri"
NPM = "[NPM]"
PEMBIMBING_1 = "[Nama Pembimbing I]"
PEMBIMBING_2 = "[Nama Pembimbing II]"
BULAN_TAHUN = "[Bulan] 2026"
FONT = "Times New Roman"

ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"]


# --------------------------------------------------------------- pustaka
def baca_bib(path: Path) -> dict[str, dict[str, str]]:
    teks = path.read_text(encoding="utf-8")
    entri: dict[str, dict[str, str]] = {}
    for blok in teks.split("\n@"):
        blok = "@" + blok if not blok.startswith("@") else blok
        m = re.match(r"@\w+\{([^,]+),", blok.strip())
        if not m:
            continue
        kunci = m.group(1).strip()
        isi: dict[str, str] = {}
        for f in ("author", "year", "title"):
            mm = re.search(rf"{f}\s*=\s*\{{(.*?)\}}\s*,?\s*\n", blok, re.S)
            if mm:
                isi[f] = re.sub(r"\s+", " ", mm.group(1)).strip()
        entri[kunci] = isi
    return entri


def nama_akhir(author: str) -> list[str]:
    hasil = []
    for orang in re.split(r"\s+and\s+", author):
        orang = orang.strip()
        if not orang:
            continue
        hasil.append(orang.split(",")[0].strip() if "," in orang else orang.split()[-1])
    return hasil


def sitasi(entri: dict[str, dict[str, str]], kunci: str) -> tuple[str, str]:
    """Kembalikan (bentuk dalam kurung, bentuk sebagai subjek kalimat)."""
    d = entri.get(kunci)
    if not d:
        return ("[?]", "[?]")
    nama = nama_akhir(d.get("author", ""))
    tahun = d.get("year", "t.t.").strip() or "t.t."
    if len(nama) == 1:
        dasar = nama[0]
    elif len(nama) == 2:
        dasar = f"{nama[0]} dan {nama[1]}"
    else:
        dasar = f"{nama[0]} dkk."
    return (f"{dasar}, {tahun}", f"{dasar} ({tahun})")


# ------------------------------------------------------------- konversi
def baris_bersih(teks: str) -> str:
    """Bersihkan markup LaTeX sebaris."""
    t = teks
    t = t.replace("---", "\u2014").replace("--", "\u2013")
    t = t.replace("``", "\u201c").replace("''", "\u201d")
    t = t.replace("~", " ")
    t = re.sub(r"\\(%|&|_|#|\$)", r"\1", t)
    t = re.sub(r"\\textbf\{([^{}]*)\}", r"\1", t)
    t = re.sub(r"\\textit\{([^{}]*)\}", r"\1", t)
    t = re.sub(r"\\emph\{([^{}]*)\}", r"\1", t)
    t = re.sub(r"\\isian\{([^{}]*)\}", r"[belum diisi: \1]", t)
    t = t.replace("\\%", "%").replace("\\&", "&")
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def ganti_sitasi(teks: str, entri) -> str:
    def sub_paren(m):
        kunci = [k.strip() for k in m.group(1).split(",") if k.strip()]
        return "(" + "; ".join(sitasi(entri, k)[0] for k in kunci) + ")"

    def sub_teks(m):
        kunci = [k.strip() for k in m.group(1).split(",") if k.strip()]
        if len(kunci) == 1:
            return sitasi(entri, kunci[0])[1]
        return "(" + "; ".join(sitasi(entri, k)[0] for k in kunci) + ")"

    teks = re.sub(r"\\parencite\{([^}]*)\}", sub_paren, teks)
    teks = re.sub(r"\\textcite\{([^}]*)\}", sub_teks, teks)
    teks = re.sub(r"\\citep\{([^}]*)\}", sub_paren, teks)
    teks = re.sub(r"\\citet\{([^}]*)\}", sub_teks, teks)
    return teks


# --------------------------------------------------------- baca .tex
def ganti_ref(teks: str, peta: dict[str, str]) -> str:
    return re.sub(r"\\ref\{([^}]*)\}", lambda m: peta.get(m.group(1), ""), teks)


def baca_tex(path: Path, entri) -> list[tuple]:
    blok: list[tuple] = []
    if not path.exists():
        return blok
    baris = path.read_text(encoding="utf-8").splitlines()
    i = 0
    par: list[str] = []

    def tutup_par():
        nonlocal par
        if par:
            isi = ganti_sitasi(" ".join(par), entri)
            isi = baris_bersih(isi)
            if isi:
                blok.append(("para", isi))
        par = []

    while i < len(baris):
        ln = baris[i]
        s = ln.strip()

        if s.startswith("%") or s == "":
            tutup_par()
            i += 1
            continue

        m = re.match(r"\\chapter\{(.*)\}", s)
        if m:
            tutup_par()
            blok.append(("chapter", baris_bersih(m.group(1))))
            i += 1
            continue

        m = re.match(r"\\section\{(.*)\}", s)
        if m:
            tutup_par()
            blok.append(("section", baris_bersih(m.group(1))))
            i += 1
            continue

        m = re.match(r"\\subsection\{(.*)\}", s)
        if m:
            tutup_par()
            blok.append(("subsection", baris_bersih(m.group(1))))
            i += 1
            continue

        if s.startswith("\\begin{poin}") or s.startswith("\\begin{urut}"):
            tutup_par()
            jenis = "poin" if "poin" in s else "urut"
            i += 1
            butir = []
            while i < len(baris) and not baris[i].strip().startswith("\\end{"):
                b = baris[i].strip()
                if b.startswith("\\item"):
                    butir.append(b[5:].strip())
                elif b and not b.startswith("%"):
                    butir[-1] += " " + b
                i += 1
            blok.append((jenis, [baris_bersih(ganti_sitasi(x, entri)) for x in butir]))
            i += 1
            continue

        if s.startswith("\\begin{table}") or s.startswith("\\begin{longtable}"):
            tutup_par()
            caption, rows, spec, label = "", [], "", ""
            i += 1
            while i < len(baris) and not baris[i].strip().startswith("\\end{table}") and not baris[i].strip().startswith("\\end{longtable}"):
                b = baris[i].strip()
                mc = re.match(r"\\caption\{(.*)\}", b)
                if mc:
                    caption = baris_bersih(mc.group(1))
                ml = re.match(r"\\label\{(.*)\}", b)
                if ml:
                    label = ml.group(1)
                if b.startswith("\\begin{tabularx}") or b.startswith("\\begin{longtable}"):
                    spec = b
                    kumpul = ""
                    i += 1
                    while i < len(baris) and not baris[i].strip().startswith("\\end{tabularx}") and not baris[i].strip().startswith("\\end{longtable}"):
                        r = baris[i].strip()
                        abaikan = ("\\toprule", "\\midrule", "\\bottomrule", "\\hline", "\\end", "\\caption", "\\label", "\\begin", "\\addlinespace")
                        if not r or r.startswith(abaikan):
                            i += 1
                            continue
                        akhir = r.endswith("\\\\")
                        if akhir:
                            r = r[:-2].strip()
                        kumpul = (kumpul + " " + r).strip()
                        if akhir:
                            if "&" in kumpul:
                                sel = [baris_bersih(ganti_sitasi(x, entri))
                                       for x in kumpul.split("&")]
                                rows.append(sel)
                            kumpul = ""
                        i += 1
                i += 1
            blok.append(("table", caption, rows, spec, label))
            i += 1
            continue

        if s.startswith("\\begin{figure}"):
            tutup_par()
            caption, berkas, label = "", "alur.png", ""
            i += 1
            while i < len(baris) and not baris[i].strip().startswith("\\end{figure}"):
                b = baris[i].strip()
                mc = re.match(r"\\caption\{(.*)\}", b)
                if mc:
                    caption = baris_bersih(mc.group(1))
                ml = re.match(r"\\label\{(.*)\}", b)
                if ml:
                    label = ml.group(1)
                mg = re.search(r"includegraphics\[[^]]*\]\{([^}]*)\}", b)
                if mg:
                    berkas = mg.group(1).split("/")[-1]
                i += 1
            blok.append(("figure", caption, berkas, label))
            i += 1
            continue

        if s.startswith("\\begin{") or s.startswith("\\end{") or s.startswith("\\["):
            i += 1
            continue

        par.append(s)
        i += 1

    tutup_par()
    return blok


# --------------------------------------------------------------- docx
def atur_paragraf(par, *, align=WD_ALIGN_PARAGRAPH.JUSTIFY, indent=True,
                  space_before=0, space_after=0, line=2.0):
    pf = par.paragraph_format
    pf.alignment = align
    pf.first_line_indent = Cm(1.27) if indent else Cm(0)
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line


def tulis(par, teks: str, *, bold=False, italic=False, size=12):
    run = par.add_run(teks)
    run.font.name = FONT
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    return run


def bidang_halaman(par, awalan=""):
    if awalan:
        tulis(par, awalan)
    r1 = par.add_run()
    fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), "begin")
    r1._r.append(fc)
    r2 = par.add_run()
    it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve")
    it.text = " PAGE "
    r2._r.append(it)
    r3 = par.add_run()
    fc2 = OxmlElement("w:fldChar"); fc2.set(qn("w:fldCharType"), "separate")
    r3._r.append(fc2)
    tulis(par, "1")
    r4 = par.add_run()
    fc3 = OxmlElement("w:fldChar"); fc3.set(qn("w:fldCharType"), "end")
    r4._r.append(fc3)


def nomor_halaman_mulai(section, mulai=1, fmt="decimal"):
    sectPr = section._sectPr
    lama = sectPr.find(qn("w:pgNumType"))
    if lama is not None:
        sectPr.remove(lama)
    el = OxmlElement("w:pgNumType")
    el.set(qn("w:fmt"), fmt)
    el.set(qn("w:start"), str(mulai))
    sectPr.append(el)


def bingkai_tabel(tabel):
    """Garis horizontal saja: atas, bawah, dan garis kepala tabel."""
    tbl = tabel._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for sisi, ukuran in (("top", 8), ("bottom", 8), ("insideH", 4),
                         ("left", 0), ("right", 0), ("insideV", 0)):
        el = OxmlElement(f"w:{sisi}")
        el.set(qn("w:val"), "single" if ukuran else "none")
        el.set(qn("w:sz"), str(ukuran))
        el.set(qn("w:color"), "000000")
        borders.append(el)
    tblPr.append(borders)


def lebar_kolom(spec: str, jumlah: int, total_cm: float) -> list[float]:
    angka = [float(x) for x in re.findall(r"[LpX]\{([\d.]+)cm\}", spec)]
    if not angka:
        return [total_cm / jumlah] * jumlah
    sisa = total_cm - sum(angka) - 0.6
    if len(angka) < jumlah:
        angka = angka + [max(sisa, 2.0)] * (jumlah - len(angka))
    # kolom sempit membuat kata terpotong: naikkan ke minimum 1,6 cm
    for i, w in enumerate(angka):
        if w < 1.6:
            terbesar = angka.index(max(angka))
            angka[terbesar] = angka[terbesar] - (1.6 - w)
            angka[i] = 1.6
    return angka


def tambah_tabel(doc, caption, rows, spec, nomor):
    if caption:
        p = doc.add_paragraph()
        atur_paragraf(p, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, line=1.0)
        p.paragraph_format.keep_with_next = True
        tulis(p, f"{nomor}  {caption}", bold=True, size=10)

    jumlah = max(len(r) for r in rows)
    t = doc.add_table(rows=len(rows), cols=jumlah)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    bingkai_tabel(t)
    lebar = lebar_kolom(spec, jumlah, 14.0)

    # Tata letak tetap: tanpa ini Word mengabaikan lebar kolom yang disetel.
    tblPr = t._tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblPr.append(layout)
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW")
        tblPr.append(tblW)
    tblW.set(qn("w:type"), "dxa")
    tblW.set(qn("w:w"), str(int(sum(lebar) * 567)))

    for gc, w in zip(t._tbl.tblGrid.findall(qn("w:gridCol")), lebar):
        gc.set(qn("w:w"), str(int(w * 567)))

    for ri, baris in enumerate(rows):
        for ci in range(jumlah):
            sel = t.cell(ri, ci)
            sel.width = Cm(lebar[ci])
            sel.text = ""
            p = sel.paragraphs[0]
            atur_paragraf(p, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, line=1.0)
            isi = baris[ci] if ci < len(baris) else ""
            tulis(p, isi, bold=(ri == 0), size=10)

    # Baris tidak boleh terpotong antar halaman; baris kepala diulang.
    for ri, row in enumerate(t.rows):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(OxmlElement("w:cantSplit"))
        if ri == 0:
            trPr.append(OxmlElement("w:tblHeader"))
        for ci in range(jumlah):
            row.cells[ci].width = Cm(lebar[ci])

    doc.add_paragraph()


def bangun():
    entri = baca_bib(BIB)
    doc = Document()

    gaya = doc.styles["Normal"]
    gaya.font.name = FONT
    gaya.font.size = Pt(12)
    gaya.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    gaya.paragraph_format.line_spacing = 2.0
    gaya.paragraph_format.space_after = Pt(0)

    for nama_gaya, ukuran, rata, tebal in (
        ("Heading 1", 12, WD_ALIGN_PARAGRAPH.CENTER, True),
        ("Heading 2", 12, WD_ALIGN_PARAGRAPH.LEFT, True),
        ("Heading 3", 12, WD_ALIGN_PARAGRAPH.LEFT, True),
    ):
        g = doc.styles[nama_gaya]
        g.font.name = FONT
        g.font.size = Pt(ukuran)
        g.font.bold = tebal
        g.font.color.rgb = RGBColor(0, 0, 0)
        g.paragraph_format.alignment = rata
        g.paragraph_format.first_line_indent = Cm(0)
        g.paragraph_format.line_spacing = 2.0
        g.paragraph_format.space_before = Pt(12)
        g.paragraph_format.space_after = Pt(0)
        g.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin, sec.top_margin = Cm(4), Cm(4)
    sec.right_margin, sec.bottom_margin = Cm(3), Cm(3)
    sec.header_distance, sec.footer_distance = Cm(1.5), Cm(1.5)

    # ---------------- sampul (tanpa nomor halaman)
    p = doc.add_paragraph(); atur_paragraf(p, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False)
    p.paragraph_format.space_before = Pt(60)
    tulis(p, JUDUL, bold=True)
    for teks, jarak in (("OUTLINE PENELITIAN", 36), ("TUGAS AKHIR", 0), ("Oleh:", 36)):
        p = doc.add_paragraph(); atur_paragraf(p, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False)
        p.paragraph_format.space_before = Pt(jarak)
        tulis(p, teks, bold=True)
    for teks in (f"Nama: {NAMA}", f"NPM: {NPM}"):
        p = doc.add_paragraph(); atur_paragraf(p, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, line=1.5)
        tulis(p, teks)
    for teks, jarak in (("JURUSAN INFORMATIKA", 48),
                        ("FAKULTAS TEKNIK UNIVERSITAS SILIWANGI", 0),
                        ("TASIKMALAYA", 0),
                        (BULAN_TAHUN, 30)):
        p = doc.add_paragraph(); atur_paragraf(p, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False)
        p.paragraph_format.space_before = Pt(jarak)
        tulis(p, teks, bold=True)

    # ---------------- bagian awal (angka romawi kecil)
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    nomor_halaman_mulai(sec, 1, "lowerRoman")
    sec.header.is_linked_to_previous = False
    sec.footer.is_linked_to_previous = False
    fp = sec.footer.paragraphs[0]
    atur_paragraf(fp, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, line=1.0)
    bidang_halaman(fp)

    for berkas, judul in (("abstrak.tex", "ABSTRAK"), ("kata-pengantar.tex", "KATA PENGANTAR")):
        h = doc.add_paragraph()
        atur_paragraf(h, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False)
        h.style = doc.styles["Heading 1"]
        tulis(h, judul, bold=True)
        for b in baca_tex(BAB / berkas, entri):
            if b[0] == "para":
                par = doc.add_paragraph(); atur_paragraf(par)
                tulis(par, b[1])
            elif b[0] in ("poin", "urut"):
                for n, butir in enumerate(b[1]):
                    par = doc.add_paragraph(); atur_paragraf(par, indent=False)
                    par.paragraph_format.left_indent = Cm(1.27)
                    tanda = f"{chr(97 + n)}." if b[0] == "poin" else f"{n + 1}."
                    tulis(par, f"{tanda}\t{butir}")
        doc.add_page_break()

    # daftar isi
    h = doc.add_paragraph()
    h.style = doc.styles["Heading 1"]
    atur_paragraf(h, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False)
    tulis(h, "DAFTAR ISI", bold=True)
    par = doc.add_paragraph()
    r = par.add_run()
    fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), "begin"); fc.set(qn("w:dirty"), "true")
    r._r.append(fc)
    r2 = par.add_run()
    it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve")
    it.text = ' TOC \\o "1-3" \\h \\z \\u '
    r2._r.append(it)
    r3 = par.add_run()
    fc2 = OxmlElement("w:fldChar"); fc2.set(qn("w:fldCharType"), "separate")
    r3._r.append(fc2)
    r3b = par.add_run("Daftar isi akan terisi setelah diperbarui di Word "
                      "(klik kanan, Update Field).")
    r3b.font.name = FONT
    r3b.font.size = Pt(12)
    r4 = par.add_run()
    fc3 = OxmlElement("w:fldChar"); fc3.set(qn("w:fldCharType"), "end")
    r4._r.append(fc3)

    # ---------------- bagian isi: satu bagian per bab
    bab_berkas = ["main.tex"]
    isi_bab = {idx: baca_tex(BAB / b, entri) for idx, b in enumerate(bab_berkas, start=1)}

    # Peta label -> nomor, supaya \ref di teks menjadi "Tabel II.1" dsb.
    peta: dict[str, str] = {}
    for idx, blok in isi_bab.items():
        nt = nf = 0
        bab_ke = 0
        for b in blok:
            if b[0] == "chapter":
                bab_ke += 1
                nt = nf = 0
            elif b[0] == "table":
                nt += 1
                if b[4]:
                    peta[b[4]] = f"{bab_ke}.{nt}"
            elif b[0] == "figure":
                nf += 1
                if b[3]:
                    peta[b[3]] = f"{bab_ke}.{nf}"

    for idx, berkas in enumerate(bab_berkas, start=1):
        sec = doc.add_section(WD_SECTION.NEW_PAGE)
        nomor_halaman_mulai(sec, 1, "decimal")
        sec.different_first_page_header_footer = True

        sec.header.is_linked_to_previous = False
        hp = sec.header.paragraphs[0]
        atur_paragraf(hp, align=WD_ALIGN_PARAGRAPH.RIGHT, indent=False, line=1.0)
        bidang_halaman(hp, "")

        sec.footer.is_linked_to_previous = False
        fp = sec.footer.paragraphs[0]
        atur_paragraf(fp, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, line=1.0)
        fp.text = ""   # halaman isi: nomor hanya di kanan atas, bukan di footer

        sec.first_page_header.is_linked_to_previous = False
        sec.first_page_header.paragraphs[0].text = ""
        sec.first_page_footer.is_linked_to_previous = False
        ffp = sec.first_page_footer.paragraphs[0]
        for r in list(ffp.runs):
            r._r.getparent().remove(r._r)
        atur_paragraf(ffp, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, line=1.0)
        bidang_halaman(ffp, "")

        nomor_sec, nomor_sub = 0, 0
        nomor_tabel = 0
        nomor_gambar = 0
        bab_ke = 0
        for b in isi_bab[idx]:
            jenis = b[0]
            if jenis == "chapter":
                bab_ke += 1
                nomor_sec = nomor_sub = 0
                nomor_tabel = 0
                nomor_gambar = 0
                h = doc.add_paragraph()
                h.style = doc.styles["Heading 1"]
                tulis(h, b[1].upper(), bold=True)
            elif jenis == "section":
                nomor_sec += 1
                nomor_sub = 0
                h = doc.add_paragraph()
                h.style = doc.styles["Heading 2"]
                tulis(h, f"{bab_ke}.{nomor_sec} {b[1]}", bold=True)
            elif jenis == "subsection":
                nomor_sub += 1
                h = doc.add_paragraph()
                h.style = doc.styles["Heading 3"]
                tulis(h, f"{bab_ke}.{nomor_sec}.{nomor_sub} {b[1]}", bold=True)
            elif jenis == "para":
                par = doc.add_paragraph()
                atur_paragraf(par)
                tulis(par, ganti_ref(b[1], peta))
            elif jenis in ("poin", "urut"):
                for n, butir in enumerate(b[1]):
                    par = doc.add_paragraph()
                    atur_paragraf(par, indent=False)
                    par.paragraph_format.left_indent = Cm(1.27)
                    tanda = f"{chr(97 + n)}." if jenis == "poin" else f"{n + 1}."
                    tulis(par, f"{tanda}\t{ganti_ref(butir, peta)}")
            elif jenis == "table":
                nomor_tabel += 1
                tambah_tabel(doc, b[1], b[2], b[3],
                             f"Tabel {bab_ke}.{nomor_tabel}")
            elif jenis == "figure":
                lebar_penuh = "-lebar" in b[2]
                if lebar_penuh:
                    sec = doc.add_section(WD_SECTION.NEW_PAGE)
                    sec.orientation = WD_ORIENT.LANDSCAPE
                    sec.page_width, sec.page_height = Cm(29.7), Cm(21.0)
                    sec.top_margin = sec.bottom_margin = Cm(1.6)
                    sec.left_margin = sec.right_margin = Cm(1.6)
                par = doc.add_paragraph()
                atur_paragraf(par, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, line=1.0)
                lebar_gambar = Cm(25.8) if lebar_penuh else Cm(14.0)
                par.add_run().add_picture(str(GAMBAR / b[2]), width=lebar_gambar)
                cap = doc.add_paragraph()
                atur_paragraf(cap, align=WD_ALIGN_PARAGRAPH.CENTER, indent=False, line=1.0)
                nomor_gambar += 1
                tulis(cap, f"Gambar {bab_ke}.{nomor_gambar}  {b[1]}",
                      bold=True, size=10)
                if lebar_penuh:
                    sec2 = doc.add_section(WD_SECTION.NEW_PAGE)
                    sec2.orientation = WD_ORIENT.PORTRAIT
                    sec2.page_width, sec2.page_height = Cm(21.0), Cm(29.7)
                    sec2.top_margin = Cm(4.0)
                    sec2.bottom_margin = Cm(3.0)
                    sec2.left_margin = Cm(4.0)
                    sec2.right_margin = Cm(3.0)

    doc.save(KELUAR)
    print(f"tersimpan: {KELUAR}")


if __name__ == "__main__":
    bangun()
