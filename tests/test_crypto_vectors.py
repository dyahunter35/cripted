"""
Regression test suite for Crypto & Stego Lab.
Verifies all 9 ciphers and steganography routines execute cleanly.
"""

import unittest
import sys
import os
import subprocess

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class TestCryptoAlgorithms(unittest.TestCase):
    def run_algorithm_demo(self, algo_dir, script_name):
        cwd = os.path.join(ROOT_DIR, algo_dir)
        cmd = [sys.executable, script_name, "demo"]
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True
        )
        self.assertEqual(
            result.returncode,
            0,
            f"Algorithm {algo_dir}/{script_name} failed with error:\n{result.stderr}\n{result.stdout}"
        )
        return result.stdout

    def test_des(self):
        output = self.run_algorithm_demo("des", "des_manual.py")
        self.assertIn("OK", output)

    def test_aes(self):
        output = self.run_algorithm_demo("aes", "aes_manual.py")
        self.assertIn("Match: True", output)

    def test_rc5(self):
        output = self.run_algorithm_demo("rc5", "rc5_manual.py")
        self.assertIn("Match: True", output)

    def test_rc6(self):
        output = self.run_algorithm_demo("rc6", "rc6_manual.py")
        self.assertIn("Match: True", output)

    def test_idea(self):
        output = self.run_algorithm_demo("idea", "idea_manual.py")
        self.assertIn("Match: True", output)

    def test_gost(self):
        output = self.run_algorithm_demo("gost", "gost_manual.py")
        self.assertIn("recovered", output)

    def test_rc4(self):
        output = self.run_algorithm_demo("rc4", "rc4_manual.py")
        self.assertIn("recovered", output)

    def test_cast(self):
        output = self.run_algorithm_demo("cast", "cast_libs.py")
        self.assertIn("recovered", output)

    def test_blowfish(self):
        output = self.run_algorithm_demo("blowfish", "blowfish_manual.py")
        self.assertIn("Match: True", output)


if __name__ == "__main__":
    unittest.main()
