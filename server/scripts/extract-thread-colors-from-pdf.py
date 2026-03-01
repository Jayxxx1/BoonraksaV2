#!/usr/bin/env python3
"""Extract thread color names/codes from a PDF into JSON.

Usage:
  python scripts/extract-thread-colors-from-pdf.py "<pdf_path>" "<output_json>"
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


CODE_PATTERN = re.compile(r"([PA]?\d{2,5})", re.IGNORECASE)


def extract_rows(pdf_path: Path) -> list[dict[str, str]]:
    reader = PdfReader(str(pdf_path))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)

    rows: list[dict[str, str]] = []
    seen_codes: set[str] = set()

    for raw in text.splitlines():
      normalized = raw.replace("\x00", "").replace(" ", "").strip()
      if not normalized:
          continue

      match = CODE_PATTERN.search(normalized)
      if not match:
          continue

      code = match.group(1).upper()
      name = normalized[: match.start()].strip("-:")
      if not code or not name:
          continue
      if code in seen_codes:
          continue

      seen_codes.add(code)
      rows.append(
          {
              "code": code,
              "name": name,
              "sourcePdf": pdf_path.name,
          }
      )

    return rows


def main() -> int:
    if len(sys.argv) < 3:
        print(
            "Usage: python scripts/extract-thread-colors-from-pdf.py "
            '"<pdf_path>" "<output_json>"'
        )
        return 1

    pdf_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()

    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}")
        return 1

    rows = extract_rows(pdf_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"Extracted {len(rows)} rows -> {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
