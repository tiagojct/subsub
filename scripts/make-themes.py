#!/usr/bin/env python3
"""Write pi themes for Sub-Sub from Gam design-system sources.

    python3 scripts/make-themes.py NAME SOURCE.json VSCODE-DARK.json VSCODE-LIGHT.json

SOURCE.json is the design system's single source (modes, palette). The VS Code
themes that Gam generates supply the syntax colours per mode. Output:
themes/subsub-NAME-dark.json and themes/subsub-NAME-light.json.

The accent (the design system's one mark) is kept for the few places that need a
mark: the banner, the active border, bash mode and the highest thinking level.
Headings, bullets and borders use the cool tones.
"""

import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "themes"


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    """t = 0 gives a, t = 1 gives b."""
    ra, rb = hexrgb(a), hexrgb(b)
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(ra, rb))


def token(vs, scope):
    for tc in vs.get("tokenColors", []):
        sc = tc.get("scope")
        scopes = [sc] if isinstance(sc, str) else sc
        if scope in scopes:
            return tc["settings"]["foreground"].lower()
    raise KeyError(scope)


def tone(m, part):
    """try-works calls the cool tones sea-*, Glauca tint-*."""
    for prefix in ("sea", "tint"):
        k = f"{prefix}{'-' + part if part else ''}"
        if k in m:
            return m[k].lower()
    raise KeyError(part)


def theme(name, scheme, m, vs):
    dark = scheme == "dark"
    c = vs["colors"]
    v = {
        "bg": m["bg"], "surface": m["surface"], "raised": m["surface-raised"],
        "text": m["text"], "muted": m["text-muted"], "line": m["border"],
        "mark": m["accent"], "markBright": m["accent-bright"], "markDeep": m["accent-deep"],
        "toneDeep": tone(m, "deep"), "tone": tone(m, ""), "toneBright": tone(m, "bright"), "tonePale": tone(m, "pale"),
        "green": token(vs, "markup.inserted"), "red": c["terminal.ansiRed"].lower(),
        "yellow": c["terminal.ansiYellow"].lower(), "violet": token(vs, "constant.numeric"),
        "link": token(vs, "entity.name.function"),
    }
    v = {k: val.lower() for k, val in v.items()}
    v["dim"] = mix(v["muted"], v["bg"], 0.35)
    v["select"] = c["list.activeSelectionBackground"].lower()
    v["okBg"] = mix(v["surface"], v["green"], 0.14)
    v["errBg"] = mix(v["surface"], v["red"], 0.16)
    heading = "tonePale" if dark else "tone"
    colors = {
        "accent": "mark", "border": "toneBright", "borderAccent": "mark", "borderMuted": "line",
        "success": "green", "error": "red", "warning": "yellow",
        "muted": "muted", "dim": "dim", "text": "text", "thinkingText": "muted",
        "selectedBg": "select", "scrollbarTrack": "line", "scrollbarThumb": "muted",
        "searchMatchBg": "select", "searchMatchText": "text",
        "userMessageBg": "raised", "userMessageText": "text",
        "customMessageBg": "surface", "customMessageText": "text", "customMessageLabel": heading,
        "toolPendingBg": "surface", "toolSuccessBg": "okBg", "toolErrorBg": "errBg",
        "toolTitle": "text", "toolOutput": "muted",
        "mdHeading": heading, "mdLink": "link", "mdLinkUrl": "dim", "mdCode": "green",
        "mdCodeBlock": "text", "mdCodeBlockBorder": "line", "mdQuote": "muted", "mdQuoteBorder": "toneBright",
        "mdHr": "line", "mdListBullet": "toneBright",
        "toolDiffAdded": "green", "toolDiffRemoved": "red", "toolDiffContext": "muted",
        "syntaxComment": token(vs, "comment"), "syntaxKeyword": token(vs, "keyword"),
        "syntaxFunction": token(vs, "entity.name.function"), "syntaxVariable": token(vs, "variable"),
        "syntaxString": token(vs, "string"), "syntaxNumber": token(vs, "constant.numeric"),
        "syntaxType": token(vs, "entity.name.type"), "syntaxOperator": token(vs, "keyword.operator"),
        "syntaxPunctuation": token(vs, "punctuation"),
        "thinkingOff": "line", "thinkingMinimal": "dim", "thinkingLow": "toneBright", "thinkingMedium": heading,
        "thinkingHigh": "violet", "thinkingXhigh": "markBright", "thinkingMax": "mark",
        "bashMode": "mark",
    }
    return {
        "$schema": "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
        "name": name,
        "vars": v,
        "colors": colors,
        "export": {"pageBg": v["bg"], "cardBg": v["surface"], "infoBg": v["raised"]},
    }


def main():
    name, source, vs_dark, vs_light = sys.argv[1:5]
    src = json.loads(Path(source).read_text())
    modes = src["modes"]
    by_scheme = {m["scheme"]: m for m in modes.values()}
    OUT.mkdir(exist_ok=True)
    for scheme, vs_path in (("dark", vs_dark), ("light", vs_light)):
        vs = json.loads(Path(vs_path).read_text())
        tname = f"subsub-{name}-{scheme}"
        t = theme(tname, scheme, by_scheme[scheme], vs)
        (OUT / f"{tname}.json").write_text(json.dumps(t, indent="\t") + "\n")
        print(OUT / f"{tname}.json", f"({by_scheme[scheme].get('label', scheme)})")


if __name__ == "__main__":
    main()
