"""DES + steganography using READY-MADE libraries (pycryptodome + Pillow).

Run with:  python3 des_libs.py demo
Requires:  pip install pycryptodome Pillow
"""

import argparse
import hashlib
import math
import os
import struct
import wave

from Crypto.Cipher import DES
from Crypto.Util.Padding import pad, unpad
from PIL import Image


# ---------------- DES (library) ----------------

def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:8]


def des_encrypt(plaintext, password):
    key = derive_key(password)
    cipher = DES.new(key, DES.MODE_ECB)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    return cipher.encrypt(pad(data, DES.block_size))


def des_decrypt(ciphertext, password):
    key = derive_key(password)
    cipher = DES.new(key, DES.MODE_ECB)
    return unpad(cipher.decrypt(ciphertext), DES.block_size)


# ---------------- Image stego (Pillow) ----------------

def _bytes_to_bits(data):
    bits = []
    for b in data:
        for i in range(7, -1, -1):
            bits.append((b >> i) & 1)
    return bits


def _bits_to_bytes(bits):
    out = bytearray()
    cur = 0
    n = 0
    for bit in bits:
        cur = (cur << 1) | bit
        n += 1
        if n == 8:
            out.append(cur)
            cur = 0
            n = 0
    return bytes(out)


def image_capacity(path):
    with Image.open(path) as im:
        w, h = im.size
    return (w * h * 3) // 8 - 4


def hide_image(input_path, output_path, payload_bytes):
    with Image.open(input_path) as im:
        im = im.convert("RGB")
        w, h = im.size
        pixels = list(im.get_flattened_data())
    full = len(payload_bytes).to_bytes(4, "big") + payload_bytes
    bits = _bytes_to_bits(full)
    if len(bits) > w * h * 3:
        raise ValueError("payload too large for image")
    idx = 0
    new_pixels = []
    for (r, g, b) in pixels:
        if idx < len(bits):
            r = (r & 0xFE) | bits[idx]; idx += 1
        if idx < len(bits):
            g = (g & 0xFE) | bits[idx]; idx += 1
        if idx < len(bits):
            b = (b & 0xFE) | bits[idx]; idx += 1
        new_pixels.append((r, g, b))
    out = Image.new("RGB", (w, h))
    out.putdata(new_pixels)
    out.save(output_path)
    return len(payload_bytes)


def extract_image(path):
    with Image.open(path) as im:
        im = im.convert("RGB")
        pixels = list(im.get_flattened_data())
    bits = []
    for (r, g, b) in pixels:
        bits.append(r & 1)
        bits.append(g & 1)
        bits.append(b & 1)
    length = int.from_bytes(_bits_to_bytes(bits[:32]), "big")
    if length < 0 or length > image_capacity(path):
        raise ValueError("invalid hidden data")
    return _bits_to_bytes(bits[32:32 + length * 8])


# ---------------- Audio stego (wave) ----------------

def audio_capacity(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes() * w.getnchannels()
    return n // 8 - 4


def hide_audio(input_path, output_path, payload_bytes):
    with wave.open(input_path, "rb") as w:
        params = w.getparams()
        frames = w.readframes(w.getnframes())
    if params.sampwidth != 2:
        raise ValueError("only 16-bit PCM WAV supported")
    samples = list(struct.unpack("<" + "h" * (len(frames) // 2), frames))
    full = len(payload_bytes).to_bytes(4, "big") + payload_bytes
    bits = _bytes_to_bits(full)
    if len(bits) > len(samples):
        raise ValueError("payload too large for audio")
    for i, bit in enumerate(bits):
        samples[i] = (samples[i] & ~1) | bit
    with wave.open(output_path, "wb") as w:
        w.setparams(params)
        w.writeframes(struct.pack("<" + "h" * len(samples), *samples))
    return len(payload_bytes)


def extract_audio(path):
    with wave.open(path, "rb") as w:
        frames = w.readframes(w.getnframes())
    samples = list(struct.unpack("<" + "h" * (len(frames) // 2), frames))
    bits = [s & 1 for s in samples]
    length = int.from_bytes(_bits_to_bytes(bits[:32]), "big")
    if length < 0 or length > audio_capacity(path):
        raise ValueError("invalid hidden data")
    return _bits_to_bytes(bits[32:32 + length * 8])


# ---------------- Demo helpers ----------------

def make_sample_image(path, w=128, h=128):
    im = Image.new("RGB", (w, h))
    px = []
    for y in range(h):
        for x in range(w):
            px.append(((x * 2) % 256, (y * 2) % 256, 100))
    im.putdata(px)
    im.save(path)


def make_sample_audio(path, seconds=2, rate=22050):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        frames = bytearray()
        for i in range(rate * seconds):
            frames += struct.pack("<h", int(10000 * math.sin(2 * math.pi * 440 * i / rate)))
        w.writeframes(frames)


def cmd_demo(args):
    os.makedirs("demo_lib", exist_ok=True)
    img = "demo_lib/sample.png"
    aud = "demo_lib/sample.wav"
    make_sample_image(img)
    make_sample_audio(aud)
    text = "Hello from DES (libs)! سلام"
    pw = args.key
    # image
    hide_image(img, "demo_lib/secret.png", des_encrypt(text, pw))
    ct = extract_image("demo_lib/secret.png")
    print("image recovered:", des_decrypt(ct, pw).decode())
    # audio
    hide_audio(aud, "demo_lib/secret.wav", des_encrypt(text, pw))
    ct = extract_audio("demo_lib/secret.wav")
    print("audio recovered:", des_decrypt(ct, pw).decode())


def main():
    p = argparse.ArgumentParser(description="DES + stego using ready-made libs")
    p.add_argument("--key", default="my-secret-key")
    sub = p.add_subparsers(dest="cmd", required=True)

    ih = sub.add_parser("image-hide")
    ih.add_argument("input"); ih.add_argument("output"); ih.add_argument("text")
    ih.set_defaults(func=lambda a: hide_image(a.input, a.output, des_encrypt(a.text, a.key)) or print("done"))

    ish = sub.add_parser("image-show")
    ish.add_argument("input")
    ish.set_defaults(func=lambda a: print("secret:", des_decrypt(extract_image(a.input), a.key).decode()))

    ah = sub.add_parser("audio-hide")
    ah.add_argument("input"); ah.add_argument("output"); ah.add_argument("text")
    ah.set_defaults(func=lambda a: hide_audio(a.input, a.output, des_encrypt(a.text, a.key)) or print("done"))

    ash = sub.add_parser("audio-show")
    ash.add_argument("input")
    ash.set_defaults(func=lambda a: print("secret:", des_decrypt(extract_audio(a.input), a.key).decode()))

    d = sub.add_parser("demo")
    d.set_defaults(func=cmd_demo)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
