#!/usr/bin/env python3
"""Build-time art pipeline for Jashn, driven by the UNOFFICIAL gflow-cli (Google Flow).

Flow is used only to produce static art that is committed to the repo. The running app never calls it,
CI never needs it, and every image has a CSS/SVG fallback, so a Flow outage cannot break a build.

  python scripts/flow_assets.py status                 what exists, what is missing
  python scripts/flow_assets.py plan                   print the gflow commands (changes nothing)
  python scripts/flow_assets.py generate [--only ID] [--force] [--dry-run]
  python scripts/flow_assets.py generate --allow-video   also render video assets (spends Flow credits)
  python scripts/flow_assets.py check [--strict]       verify manifest and files (strict: fail if any missing)

One-time setup (your own Google account, a real Chrome window):
  uv tool install gflow-cli
  uv tool run --from gflow-cli playwright install chromium
  gflow auth login --browser chrome
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
sys.dont_write_bytecode = True
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets" / "manifest.json"
LOCK = ROOT / "assets" / "lock.json"
IMAGE_EXTENSIONS = (".png", ".webp", ".jpg", ".jpeg")
VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov")
ALLOWED_ASPECTS = ("16:9", "9:16")
TIMEOUT_SECONDS = 600
MAX_PROMPT_CHARS = 700
MIN_ALT_CHARS = 20
OUTPUT_ROOT = "public/art/"
BANNED_PROMPT_WORDS = re.compile(
    r"\b(disney|marvel|pixar|nintendo|pokemon|barbie|frozen|cocomelon|peppa|logo|brand|celebrity)\b", re.I
)
EXIT_HINTS = {
    14: "Flow rejected the browser. Log in with real Chrome: gflow auth login --browser chrome",
    23: "Flow's page layout changed (selector drift). Update the tool: uv tool upgrade gflow-cli, then retry.",
}


class AssetError(Exception):
    """A problem with the manifest, a prompt, or a gflow run."""


def load_manifest(path=MANIFEST):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    problems = validate_manifest(data)
    if problems:
        raise AssetError("manifest invalid: " + "; ".join(problems))
    return data


def validate_prompt(text):
    problems = []
    if len(text) > MAX_PROMPT_CHARS:
        problems.append(f"prompt longer than {MAX_PROMPT_CHARS} characters")
    hit = BANNED_PROMPT_WORDS.search(text)
    if hit:
        problems.append(f"prompt mentions '{hit.group(0)}' (avoid third-party IP, brands and real people)")
    return problems


def validate_manifest(manifest):
    problems = []
    seen = set()
    for asset in manifest.get("assets", []):
        ident = asset.get("id", "?")
        if ident in seen:
            problems.append(f"duplicate id {ident}")
        seen.add(ident)
        if asset.get("aspect", manifest.get("aspect")) not in ALLOWED_ASPECTS:
            problems.append(f"{ident}: aspect must be one of {ALLOWED_ASPECTS}")
        if not str(asset.get("out", "")).startswith(OUTPUT_ROOT):
            problems.append(f"{ident}: out must live under {OUTPUT_ROOT}")
        if len(asset.get("alt", "")) < MIN_ALT_CHARS:
            problems.append(f"{ident}: alt text too short")
        problems += [f"{ident}: {p}" for p in validate_prompt(full_prompt(manifest, asset))]
    if not manifest.get("assets"):
        problems.append("no assets")
    return problems


def full_prompt(manifest, asset):
    return f"{manifest.get('style', '').strip()} {asset['prompt'].strip()}".strip()


def prompt_hash(text, aspect, kind):
    return hashlib.sha256(f"{kind}|{aspect}|{text}".encode("utf-8")).hexdigest()[:16]


def build_command(manifest, asset):
    kind = asset.get("kind", "image")
    aspect = asset.get("aspect", manifest.get("aspect", "16:9"))
    command = ["gflow", "video", "t2v"] if kind == "video" else ["gflow", "image", "t2i"]
    command += [full_prompt(manifest, asset), "--aspect", aspect]
    model = manifest.get("model")
    if model and kind == "image":
        command += ["--model", model]
    return command


def default_runner(command, env, timeout):
    return subprocess.run(command, env=env, capture_output=True, text=True, timeout=timeout, check=False)


def newest_file(directory, extensions):
    candidates = [p for p in Path(directory).rglob("*") if p.is_file() and p.suffix.lower() in extensions]
    return max(candidates, key=lambda p: p.stat().st_mtime) if candidates else None


def load_lock():
    return json.loads(LOCK.read_text(encoding="utf-8")) if LOCK.exists() else {}


def save_lock(lock):
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    LOCK.write_text(json.dumps(lock, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def is_current(asset, manifest, lock, root=ROOT):
    entry = lock.get(asset["id"])
    digest = prompt_hash(full_prompt(manifest, asset), asset.get("aspect", manifest.get("aspect")), asset.get("kind", "image"))
    return bool(entry) and entry.get("hash") == digest and (Path(root) / asset["out"]).exists()


def run_gflow(command, runner, directory):
    env = dict(os.environ, GFLOW_CLI_OUTPUT_DIR=str(directory))
    try:
        result = runner(command, env, TIMEOUT_SECONDS)
    except FileNotFoundError as error:
        raise AssetError("gflow is not installed. Run: uv tool install gflow-cli") from error
    except subprocess.TimeoutExpired as error:
        raise AssetError(f"gflow timed out after {TIMEOUT_SECONDS}s (first run warms Chromium; try again)") from error
    if result.returncode != 0:
        hint = EXIT_HINTS.get(result.returncode, "see gflow's own error output")
        raise AssetError(f"gflow exited {result.returncode}: {hint}")


def generate_one(asset, manifest, lock, options, runner=default_runner, root=ROOT):
    """Generates one asset. Returns 'skipped', 'planned' or 'generated'. Mutates lock on success."""
    kind = asset.get("kind", "image")
    if kind == "video" and not options.get("allow_video"):
        return "skipped"
    if not options.get("force") and is_current(asset, manifest, lock, root):
        return "skipped"
    command = build_command(manifest, asset)
    if options.get("dry_run"):
        print("  would run:", " ".join(repr(part) if " " in part else part for part in command))
        return "planned"
    extensions = VIDEO_EXTENSIONS if kind == "video" else IMAGE_EXTENSIONS
    with tempfile.TemporaryDirectory(prefix="gflow-") as tmp:
        run_gflow(command, runner, tmp)
        produced = newest_file(tmp, extensions)
        if produced is None:
            raise AssetError(f"{asset['id']}: gflow succeeded but wrote no {kind} file")
        target = Path(root) / asset["out"]
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(produced, target)
    digest = prompt_hash(full_prompt(manifest, asset), asset.get("aspect", manifest.get("aspect")), kind)
    lock[asset["id"]] = {
        "hash": digest,
        "file": asset["out"],
        "bytes": target.stat().st_size,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    return "generated"


def cmd_generate(args, runner=default_runner, root=ROOT):
    manifest = load_manifest()
    lock = load_lock()
    options = {"force": args.force, "dry_run": args.dry_run, "allow_video": args.allow_video}
    selected = [a for a in manifest["assets"] if args.only in (None, a["id"])]
    if args.only and not selected:
        raise AssetError(f"no asset with id {args.only}")
    counts = {"generated": 0, "skipped": 0, "planned": 0}
    for asset in selected:
        outcome = generate_one(asset, manifest, lock, options, runner, root)
        counts[outcome] += 1
        print(f"[{outcome}] {asset['id']}")
        if outcome == "generated":
            save_lock(lock)
    print(f"done: {counts}")
    return 0


def missing_assets(manifest, root=ROOT):
    return [a["id"] for a in manifest["assets"] if a.get("enabled", True) and not (Path(root) / a["out"]).exists()]


def cmd_status(_args, root=ROOT):
    manifest = load_manifest()
    lock = load_lock()
    for asset in manifest["assets"]:
        state = "ok" if is_current(asset, manifest, lock, root) else ("stale" if (Path(root) / asset["out"]).exists() else "missing")
        print(f"{state:8} {asset['id']}")
    return 0


def cmd_check(args, root=ROOT):
    manifest = load_manifest()
    missing = missing_assets(manifest, root)
    for ident in missing:
        print(f"missing: {ident}")
    print("assets: manifest valid" + (f", {len(missing)} missing (app uses CSS/SVG fallbacks)" if missing else ", all present"))
    return 1 if (missing and args.strict) else 0


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("status")
    sub.add_parser("plan")
    gen = sub.add_parser("generate")
    gen.add_argument("--only")
    gen.add_argument("--force", action="store_true")
    gen.add_argument("--dry-run", action="store_true")
    gen.add_argument("--allow-video", action="store_true", help="also render video (spends Flow credits)")
    chk = sub.add_parser("check")
    chk.add_argument("--strict", action="store_true")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        if args.command == "status":
            return cmd_status(args)
        if args.command == "plan":
            args.only, args.force, args.dry_run, args.allow_video = None, False, True, True
            return cmd_generate(args)
        if args.command == "generate":
            return cmd_generate(args)
        return cmd_check(args)
    except AssetError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
