"""Convertit les maquettes Claude Design (.dc.html) en pages HTML statiques rendables.

Usage : python3 scripts/maquettes-statiques.py  → docs/v1/maquettes-ciel/rendu/<nom>.html
Les maquettes sont statiques (aucune boucle ni variable) : on remonte le contenu de <helmet>
dans <head> et on retire le runtime et le script du composant.
"""

import pathlib
import re

SRC = pathlib.Path(__file__).resolve().parent.parent / "docs/v1/maquettes-ciel"
OUT = SRC / "rendu"
OUT.mkdir(exist_ok=True)

for path in sorted(SRC.glob("*.dc.html")):
    html = path.read_text(encoding="utf-8")
    helmet = re.search(r"<helmet>(.*?)</helmet>", html, re.S)
    body = re.search(r"<x-dc>(.*?)</x-dc>", html, re.S)
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    if not body:
        continue
    content = re.sub(r"<helmet>.*?</helmet>", "", body.group(1), flags=re.S)
    content = re.sub(r'href="([A-Za-z0-9-]+)\.dc\.html"', r'href="\1.html"', content)
    page = (
        '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        f"<title>{title.group(1) if title else path.stem}</title>\n"
        f"{helmet.group(1) if helmet else ''}\n</head>\n<body>\n{content}\n</body>\n</html>\n"
    )
    (OUT / (path.name.removesuffix(".dc.html") + ".html")).write_text(page, encoding="utf-8")
    print(path.name)
