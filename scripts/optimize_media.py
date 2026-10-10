from __future__ import annotations

import re
import shutil
import subprocess
from pathlib import Path
from urllib.parse import unquote

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
INDEX = ROOT / "index.html"
POSTERS = ASSETS / "posters"
FFMPEG = shutil.which("ffmpeg") or "ffmpeg"


def safe_stem(source: str) -> str:
    stem = Path(unquote(source)).stem.lower()
    return re.sub(r"[^a-z0-9]+", "-", stem).strip("-") or "video"


def convert_image(source: Path, target: Path, *, quality: int, max_width: int | None = None) -> None:
    with Image.open(source) as image:
        image = image.convert("RGB")
        if max_width and image.width > max_width:
            height = round(image.height * max_width / image.width)
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "WEBP", quality=quality, method=6)


def make_poster(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    frame = target.with_suffix(".png")
    subprocess.run(
        [str(FFMPEG), "-y", "-ss", "0", "-i", str(source), "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", str(frame)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    with Image.open(frame) as image:
        image.convert("RGB").save(target, "WEBP", quality=85, method=6)
    frame.unlink(missing_ok=True)


def main() -> None:
    convert_image(ASSETS / "attestation.png", ASSETS / "attestation.webp", quality=90)
    convert_image(ASSETS / "images" / "projet-energy.jpg", ASSETS / "images" / "projet-energy.webp", quality=88)
    convert_image(ASSETS / "heliantha.jpg", ASSETS / "heliantha.webp", quality=85, max_width=1200)

    html = INDEX.read_text(encoding="utf-8")
    sources = sorted(set(re.findall(r'<video\b[^>]*\bdata-src="([^"]+)"', html)))
    for source in sources:
        source_path = ROOT / unquote(source)
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        make_poster(source_path, POSTERS / f"{safe_stem(source)}.webp")

    print(f"Converted 3 images and generated {len(sources)} video posters in {POSTERS}")


if __name__ == "__main__":
    main()
