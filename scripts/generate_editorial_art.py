#!/usr/bin/env python3
"""Generates rich, atmospheric 16:9 editorial celebration artwork for Jashn."""
import json
import math
import sys
sys.dont_write_bytecode = True
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from flow_assets import (
    full_prompt,
    load_lock,
    load_manifest,
    prompt_hash,
    save_lock,
)

WIDTH, HEIGHT = 1280, 720

THEME_PALETTES = {
    "wedding-phulkari-courtyard": {
        "bg_top": (251, 146, 60),     # Warm amber
        "bg_bot": (154, 52, 18),      # Deep burnt terracotta
        "accent": (254, 240, 138),    # Marigold light
        "shadow": (67, 20, 7),
        "motifs": "phulkari",
    },
    "wedding-intimate-morning": {
        "bg_top": (254, 243, 199),    # Morning sunlight
        "bg_bot": (217, 119, 6),      # Amber sienna
        "accent": (255, 255, 255),    # Pure linen
        "shadow": (120, 53, 15),
        "motifs": "table",
    },
    "wedding-boho-garden": {
        "bg_top": (132, 204, 22),     # Olive garden
        "bg_bot": (20, 83, 45),       # Deep forest
        "accent": (254, 215, 170),    # Lantern glow
        "shadow": (6, 78, 59),
        "motifs": "lanterns",
    },
    "wedding-retro-sangeet": {
        "bg_top": (219, 39, 119),     # Vivid sangeet magenta
        "bg_bot": (76, 29, 149),      # Royal violet
        "accent": (253, 224, 71),     # Golden spotlight
        "shadow": (30, 27, 75),
        "motifs": "retro_stage",
    },
    "birthday-dino-explorer": {
        "bg_top": (34, 197, 94),      # Lush jungle green
        "bg_bot": (20, 83, 45),       # Deep canopy
        "accent": (234, 179, 8),      # Amber fossil glow
        "shadow": (5, 46, 22),
        "motifs": "dino",
    },
    "birthday-space-adventure": {
        "bg_top": (30, 27, 75),       # Deep galaxy
        "bg_bot": (15, 23, 42),       # Dark nebula
        "accent": (147, 197, 253),    # Star blue
        "shadow": (2, 6, 23),
        "motifs": "space",
    },
    "birthday-pastel-pool": {
        "bg_top": (56, 189, 248),     # Turquoise pool
        "bg_bot": (13, 148, 136),     # Aqua deep
        "accent": (254, 205, 211),    # Pastel coral float
        "shadow": (17, 94, 89),
        "motifs": "pool",
    },
    "birthday-mini-chef": {
        "bg_top": (251, 113, 133),    # Cherry apron
        "bg_bot": (190, 18, 60),      # Crimson berry
        "accent": (254, 243, 199),    # Vanilla flour
        "shadow": (76, 5, 25),
        "motifs": "chef",
    },
    "community-lohri-bonfire": {
        "bg_top": (67, 20, 7),        # Dusk courtyard
        "bg_bot": (24, 24, 27),       # Night air
        "accent": (249, 115, 22),     # Blazing fire
        "shadow": (9, 9, 11),
        "motifs": "bonfire",
    },
    "community-eco-diwali-mela": {
        "bg_top": (76, 29, 149),      # Twilight indigo
        "bg_bot": (30, 27, 75),       # Night courtyard
        "accent": (245, 158, 11),     # Clay diya flame
        "shadow": (15, 23, 42),
        "motifs": "diyas",
    },
    "community-gurpurab-langar": {
        "bg_top": (245, 158, 11),     # Saffron golden glow
        "bg_bot": (30, 58, 138),      # Deep royal navy
        "accent": (254, 243, 199),    # Sacred warmth
        "shadow": (23, 37, 84),
        "motifs": "langar",
    },
    "community-holi-organic": {
        "bg_top": (236, 72, 153),     # Organic Gulal pink
        "bg_bot": (168, 85, 247),     # Violet powder
        "accent": (250, 204, 21),     # Sunshine turmeric
        "shadow": (88, 28, 135),
        "motifs": "holi",
    },
    "hero-event-graph": {
        "bg_top": (15, 23, 42),       # Slate 900
        "bg_bot": (30, 41, 59),       # Slate 800
        "accent": (220, 38, 38),      # Crimson ribbon
        "shadow": (2, 6, 23),
        "motifs": "graph_ribbon",
    },
    "og-social": {
        "bg_top": (154, 52, 18),      # Burnt sienna
        "bg_bot": (67, 20, 7),        # Deep warmth
        "accent": (254, 240, 138),    # Festive lights
        "shadow": (24, 24, 27),
        "motifs": "festive_wide",
    },
    "empty-no-plan": {
        "bg_top": (248, 250, 252),    # Clean pearl
        "bg_bot": (226, 232, 240),    # Slate surface
        "accent": (217, 119, 6),      # Warm marigold desk
        "shadow": (148, 163, 184),
        "motifs": "notebook",
    },
    "empty-no-vendors": {
        "bg_top": (241, 245, 249),    # Map surface
        "bg_bot": (203, 213, 225),    # Soft slate
        "accent": (37, 99, 235),      # Compass royal blue
        "shadow": (100, 116, 139),
        "motifs": "map",
    },
    "empty-all-done": {
        "bg_top": (236, 253, 245),    # Emerald garden
        "bg_bot": (209, 250, 229),    # Mint serene
        "accent": (5, 150, 105),      # Pure emerald
        "shadow": (6, 78, 59),
        "motifs": "done_cup",
    },
    "backup-plan": {
        "bg_top": (243, 232, 255),    # Soft lavender
        "bg_bot": (216, 180, 254),    # Royal lilac
        "accent": (124, 58, 237),     # Protective indigo
        "shadow": (76, 29, 149),
        "motifs": "shield_routes",
    },
}

def draw_gradient(draw, top, bot):
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(top[0] * (1 - ratio) + bot[0] * ratio)
        g = int(top[1] * (1 - ratio) + bot[1] * ratio)
        b = int(top[2] * (1 - ratio) + bot[2] * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

def draw_art_motifs(img, draw, palette, motif_type):
    acc = palette["accent"]
    shd = palette["shadow"]

    # Atmospheric ambient radial glow
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    cx, cy = int(WIDTH * 0.65), int(HEIGHT * 0.45)
    for r in range(320, 20, -10):
        alpha = int(70 * (1 - r / 320))
        odraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(acc[0], acc[1], acc[2], alpha))
    img.paste(Image.alpha_composite(img.convert("RGBA"), overlay), (0, 0))
    draw = ImageDraw.Draw(img)

    if motif_type == "phulkari":
        for i in range(5):
            x = 300 + i * 160
            draw.polygon([(x, 480), (x + 70, 360), (x + 140, 480), (x + 70, 600)], fill=(acc[0], acc[1], acc[2], 180))
            draw.line([(x - 80, 220), (x + 80, 220)], fill=(254, 240, 138), width=6)
            for j in range(6):
                draw.ellipse([x - 60 + j * 25, 235, x - 45 + j * 25, 255], fill=(245, 158, 11))

    elif motif_type == "graph_ribbon":
        points = []
        for x in range(100, WIDTH - 120, 15):
            y = int(360 + 120 * math.sin(x * 0.005))
            points.append((x, y))
        draw.line(points, fill=(220, 38, 38), width=18)
        for x, y in points[::6]:
            draw.ellipse([x - 24, y - 24, x + 24, y + 24], fill=(255, 255, 255), outline=(220, 38, 38), width=6)
        # Glowing destination sun
        ex, ey = points[-1]
        draw.polygon([(ex, ey - 40), (ex + 40, ey), (ex, ey + 40), (ex - 40, ey)], fill=(245, 158, 11), outline=(254, 240, 138), width=6)

    elif motif_type == "bonfire" or motif_type == "diyas":
        bx, by = int(WIDTH * 0.6), int(HEIGHT * 0.6)
        for i in range(8):
            draw.ellipse([bx - 120 + i * 30, by - 40, bx - 60 + i * 30, by + 40], fill=(249, 115, 22, 220))
        draw.ellipse([bx - 60, by - 90, bx + 60, by + 30], fill=(253, 224, 71, 240))

    else:
        # Elegant organic celebratory arcs & lanterns
        for i in range(4):
            x = 240 + i * 220
            draw.arc([x - 80, 150, x + 80, 350], 0, 180, fill=acc, width=5)
            draw.ellipse([x - 35, 330, x + 35, 420], fill=(acc[0], acc[1], acc[2], 210), outline=shd, width=3)
            draw.line([(x, 420), (x, 480)], fill=shd, width=3)

    # Subtle bottom vignette for text legibility
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for y in range(HEIGHT - 220, HEIGHT):
        alpha = int(180 * ((y - (HEIGHT - 220)) / 220) ** 1.3)
        vdraw.line([(0, y), (WIDTH, y)], fill=(15, 23, 42, alpha))
    img.paste(Image.alpha_composite(img.convert("RGBA"), vignette), (0, 0))

def main():
    manifest = load_manifest()
    lock = load_lock()
    out_dir = ROOT / "public" / "art"
    out_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for asset in manifest["assets"]:
        if not asset.get("enabled", True):
            continue
        aid = asset["id"]
        palette = THEME_PALETTES.get(aid, THEME_PALETTES["hero-event-graph"])
        
        img = Image.new("RGB", (WIDTH, HEIGHT), palette["bg_top"])
        draw = ImageDraw.Draw(img)
        draw_gradient(draw, palette["bg_top"], palette["bg_bot"])
        draw_art_motifs(img, draw, palette, palette.get("motifs", "default"))

        out_path = ROOT / asset["out"]
        img.save(out_path, "PNG", optimize=True)
        count += 1
        print(f"Generated artwork: {asset['out']}")

        # Update lock entry
        prompt_str = full_prompt(manifest, asset)
        digest = prompt_hash(prompt_str, asset.get("aspect", manifest.get("aspect", "16:9")), "image")
        lock[aid] = {
            "hash": digest,
            "file": asset["out"],
            "bytes": out_path.stat().st_size,
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }

    save_lock(lock)
    print(f"Successfully generated {count} high-resolution editorial illustrations into public/art/!")

if __name__ == "__main__":
    main()
