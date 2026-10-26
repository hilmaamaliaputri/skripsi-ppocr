#!/usr/bin/env python3
"""Validasi ringan: ID sumber, duplikat, dan keberadaan DOI/URL di ledger."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "docs/research/source-ledger.md"
ID_ROW = re.compile(r"^\|\s*(S\d{2})\s*\|")
ID_USE = re.compile(r"\bS\d{2}\b")


def main() -> int:
    text = LEDGER.read_text(encoding="utf-8")
    rows = [ln for ln in text.splitlines() if ID_ROW.match(ln)]
    ids = [ID_ROW.match(ln).group(1) for ln in rows]

    errors = []

    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        errors.append(f"ID duplikat: {sorted(dupes)}")

    for ln in rows:
        sid = ID_ROW.match(ln).group(1)
        if not any(k in ln for k in ("10.", "http", "arXiv", "github")):
            errors.append(f"{sid}: tidak ada DOI/URL")

    used = set()
    for md in (ROOT / "docs").rglob("*.md"):
        if md == LEDGER:
            continue
        used |= set(ID_USE.findall(md.read_text(encoding="utf-8")))

    unknown = sorted(used - set(ids))
    if unknown:
        errors.append(f"ID dipakai tapi tidak ada di ledger: {unknown}")

    unused = sorted(set(ids) - used)

    print(f"ledger: {len(ids)} sumber")
    print(f"dipakai di dokumen: {len(used)}")
    if unused:
        print(f"belum dirujuk: {unused}")
    if errors:
        print("\nGAGAL:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
