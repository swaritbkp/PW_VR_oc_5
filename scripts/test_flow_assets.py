import subprocess
import sys
import tempfile
import unittest
from argparse import Namespace
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import flow_assets as fa  # noqa: E402

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 32
MANIFEST = {
    "style": "Flat illustration, no text.",
    "aspect": "16:9",
    "assets": [
        {"id": "one", "prompt": "A courtyard at dusk.", "alt": "A courtyard at dusk in warm light.", "out": "public/art/one.png"},
        {"id": "clip", "prompt": "Slow push in.", "alt": "Short silent teaser clip of a table.", "out": "public/art/clip.mp4", "kind": "video"},
    ],
}


class FakeResult:
    def __init__(self, code=0):
        self.returncode, self.stdout, self.stderr = code, "", ""


def writing_runner(calls):
    def runner(command, env, timeout):
        calls.append(command)
        out = Path(env["GFLOW_CLI_OUTPUT_DIR"])
        suffix = ".mp4" if command[1] == "video" else ".png"
        (out / f"result{suffix}").write_bytes(PNG)
        return FakeResult(0)
    return runner


class FlowAssetsTest(unittest.TestCase):
    """AC28: the Flow art pipeline is optional, validated, idempotent and never a runtime dependency."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def run_one(self, asset, lock, runner, **options):
        base = {"force": False, "dry_run": False, "allow_video": False}
        base.update(options)
        return fa.generate_one(asset, MANIFEST, lock, base, runner, self.root)

    def test_generates_copies_and_records_lock(self):
        calls, lock = [], {}
        self.assertEqual(self.run_one(MANIFEST["assets"][0], lock, writing_runner(calls)), "generated")
        self.assertTrue((self.root / "public/art/one.png").exists())
        self.assertEqual(lock["one"]["bytes"], len(PNG))
        self.assertEqual(calls[0][:3], ["gflow", "image", "t2i"])
        self.assertIn("--aspect", calls[0])

    def test_is_idempotent_until_the_prompt_changes_or_force(self):
        calls, lock = [], {}
        runner = writing_runner(calls)
        self.run_one(MANIFEST["assets"][0], lock, runner)
        self.assertEqual(self.run_one(MANIFEST["assets"][0], lock, runner), "skipped")
        self.assertEqual(len(calls), 1)
        self.assertEqual(self.run_one(MANIFEST["assets"][0], lock, runner, force=True), "generated")
        changed = dict(MANIFEST["assets"][0], prompt="A different scene.")
        self.assertEqual(self.run_one(changed, lock, runner), "generated")

    def test_dry_run_never_calls_gflow(self):
        calls = []
        self.assertEqual(self.run_one(MANIFEST["assets"][0], {}, writing_runner(calls), dry_run=True), "planned")
        self.assertEqual(calls, [])

    def test_video_needs_an_explicit_flag(self):
        calls = []
        video = MANIFEST["assets"][1]
        self.assertEqual(self.run_one(video, {}, writing_runner(calls)), "skipped")
        self.assertEqual(self.run_one(video, {}, writing_runner(calls), allow_video=True), "generated")
        self.assertEqual(calls[0][:3], ["gflow", "video", "t2v"])

    def test_known_exit_codes_give_actionable_hints(self):
        for code, word in ((23, "selector"), (14, "Chrome"), (1, "error output")):
            with self.assertRaises(fa.AssetError) as ctx:
                self.run_one(MANIFEST["assets"][0], {}, lambda c, e, t, code=code: FakeResult(code))
            self.assertIn(word, str(ctx.exception))

    def test_missing_binary_timeout_and_empty_output(self):
        def missing(*_):
            raise FileNotFoundError
        def slow(command, env, timeout):
            raise subprocess.TimeoutExpired(command, timeout)
        for runner, word in ((missing, "uv tool install"), (slow, "timed out"), (lambda c, e, t: FakeResult(0), "no image")):
            with self.assertRaises(fa.AssetError) as ctx:
                self.run_one(MANIFEST["assets"][0], {}, runner)
            self.assertIn(word, str(ctx.exception))

    def test_prompt_and_manifest_validation(self):
        self.assertTrue(fa.validate_prompt("a Disney castle"))
        self.assertTrue(fa.validate_prompt("x" * 900))
        self.assertEqual(fa.validate_prompt("A courtyard at dusk."), [])
        bad = {"aspect": "4:3", "assets": [dict(MANIFEST["assets"][0], out="elsewhere/one.png", alt="short"), dict(MANIFEST["assets"][0])]}
        problems = " ".join(fa.validate_manifest(bad))
        for word in ("aspect", "out must", "alt text", "duplicate"):
            self.assertIn(word, problems)
        self.assertIn("no assets", fa.validate_manifest({"assets": []}))

    def test_the_shipped_manifest_is_valid_and_complete(self):
        manifest = fa.load_manifest()
        self.assertGreaterEqual(len(manifest["assets"]), 18)
        ids = {a["id"] for a in manifest["assets"]}
        for needed in ("wedding-phulkari-courtyard", "community-lohri-bonfire", "hero-event-graph", "backup-plan"):
            self.assertIn(needed, ids)

    def test_check_strict_fails_on_missing_and_cli_end_to_end(self):
        self.assertEqual(fa.missing_assets(MANIFEST, self.root), ["one", "clip"])
        with mock.patch.object(fa, "load_manifest", return_value=MANIFEST):
            self.assertEqual(fa.cmd_check(Namespace(strict=False), self.root), 0)
            self.assertEqual(fa.cmd_check(Namespace(strict=True), self.root), 1)
            calls = []
            args = Namespace(only="one", force=False, dry_run=False, allow_video=False)
            with mock.patch.object(fa, "LOCK", self.root / "lock.json"):
                self.assertEqual(fa.cmd_generate(args, writing_runner(calls), self.root), 0)
                self.assertEqual(fa.cmd_status(None, self.root), 0)
            self.assertEqual(len(calls), 1)
            with self.assertRaises(fa.AssetError):
                fa.cmd_generate(Namespace(only="nope", force=False, dry_run=True, allow_video=False), writing_runner([]), self.root)

    def test_main_reports_errors_with_exit_code_one(self):
        with mock.patch.object(fa, "load_manifest", side_effect=fa.AssetError("boom")):
            self.assertEqual(fa.main(["status"]), 1)
        self.assertEqual(fa.main(["check"]), 0)

    def test_newest_file_picks_latest_matching_extension(self):
        (self.root / "a.png").write_bytes(PNG)
        (self.root / "b.txt").write_text("x")
        self.assertEqual(fa.newest_file(self.root, fa.IMAGE_EXTENSIONS).name, "a.png")
        self.assertIsNone(fa.newest_file(self.root, fa.VIDEO_EXTENSIONS))


if __name__ == "__main__":
    unittest.main()
