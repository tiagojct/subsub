"""Screenshots of the web view for the workshop slides: the conversation (1600 x 1100) and the
approval dialog, in English and Portuguese. stage-web.mjs stages the view; the papers are invented.

  uv run --with playwright --with pillow python -I site/scripts/screenshots.py [out_dir]

out_dir defaults to workshop/assets/img. Needs `npm run build` and ZLM_DIR (default
~/Projects/zotero-local-mcp) with a synced uv environment, as for the e2e tests.
"""

import io
import math
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent.parent / "workshop" / "assets" / "img"
ASK = {
    "en": ("What do I have on home spirometry? Anything recent that I am missing?", "Tag the two cohorts."),
    "pt": ("O que tenho sobre espirometria em casa? Há alguma coisa recente que me falte?", "Etiquete as duas coortes."),
}


def address(proc):
    for line in proc.stdout:
        if m := re.search(r"http://127\.0\.0\.1\S+", line):
            return m.group(0)
    sys.exit("the staged web view did not start")


def shoot(browser, url, lang):
    suffix = "-pt" if lang == "pt" else ""
    ctx = browser.new_context(viewport={"width": 1600, "height": 1100}, device_scale_factor=2, color_scheme="light")
    page = ctx.new_page()
    page.goto(url)
    page.wait_for_selector(".empty")
    page.evaluate("document.fonts.ready")
    page.fill("#input", ASK[lang][0])
    page.press("#input", "Enter")
    page.wait_for_selector(".md table")
    page.wait_for_function("!document.querySelector('.working')")
    page.wait_for_timeout(800)
    page.evaluate("document.activeElement.blur()")
    # Taken at 2x and scaled down: sharper text than a 1x capture.
    shot = Image.open(io.BytesIO(page.screenshot())).resize((1600, 1100), Image.LANCZOS)
    shot.save(OUT / f"web-view{suffix}-light.webp", quality=88, method=6)

    page.fill("#input", ASK[lang][1])
    page.press("#input", "Enter")
    dialog = page.wait_for_selector("#dialog[open]")
    page.wait_for_timeout(500)
    page.evaluate("document.activeElement.blur()")
    # Clip inside the dialog to the device pixel: an element screenshot rounds outwards and shows the page below.
    box = dialog.bounding_box()
    x0, y0 = math.ceil(box["x"] * 2) / 2, math.ceil(box["y"] * 2) / 2
    x1, y1 = math.floor((box["x"] + box["width"]) * 2) / 2, math.floor((box["y"] + box["height"]) * 2) / 2
    shot = page.screenshot(clip={"x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0})
    Image.open(io.BytesIO(shot)).save(OUT / f"web-approval{suffix}.webp", quality=90, method=6)
    page.keyboard.press("n")
    ctx.close()


with sync_playwright() as p:
    browser = p.chromium.launch()
    for lang in ("en", "pt"):
        proc = subprocess.Popen(["node", str(HERE / "stage-web.mjs"), lang], stdout=subprocess.PIPE, text=True)
        try:
            shoot(browser, address(proc), lang)
            print(f"{lang}: done")
        finally:
            proc.terminate()
            proc.wait()
    browser.close()
