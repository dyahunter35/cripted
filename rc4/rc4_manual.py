"""RC4 (Rivest Cipher 4) implemented from scratch + steganography."""

import argparse
import hashlib
import math
import os
import struct
import wave

from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract


def _ksa(key):
    key = list(key)
    S = list(range(256))
    j = 0
    for i in range(256):
        j = (j + S[i] + key[i % len(key)]) % 256
        S[i], S[j] = S[j], S[i]
    return S


def _prga(S, n):
    i = j = 0
    out = bytearray()
    for _ in range(n):
        i = (i + 1) % 256
        j = (j + S[i]) % 256
        S[i], S[j] = S[j], S[i]
        out.append(S[(S[i] + S[j]) % 256])
    return out


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()


def _rc4(data, password):
    key = derive_key(password)
    data = data.encode() if isinstance(data, str) else data
    ks = _prga(_ksa(key), len(data))
    return bytes(b ^ k for b, k in zip(data, ks))


def rc4_encrypt(plaintext, password):
    return _rc4(plaintext, password)


def rc4_decrypt(ciphertext, password):
    return _rc4(ciphertext, password)


def make_sample_image(path, w=64, h=64):
    row_size = (w * 3 + 3) & ~3
    pixel_offset = 54
    file_size = pixel_offset + row_size * h
    header = bytearray(54)
    header[0:2] = b"BM"
    struct.pack_into("<I", header, 2, file_size)
    struct.pack_into("<I", header, 10, pixel_offset)
    struct.pack_into("<I", header, 14, 40)
    struct.pack_into("<i", header, 18, w)
    struct.pack_into("<i", header, 22, h)
    struct.pack_into("<H", header, 26, 1)
    struct.pack_into("<H", header, 28, 24)
    pixels = bytearray(row_size * h)
    for y in range(h):
        for x in range(w):
            idx = (h - 1 - y) * row_size + x * 3
            pixels[idx] = (x * 4) & 0xFF
            pixels[idx + 1] = (y * 4) & 0xFF
            pixels[idx + 2] = 128
    with open(path, "wb") as f:
        f.write(header)
        f.write(pixels)


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
    os.makedirs("demo", exist_ok=True)
    img = "demo/sample.bmp"
    aud = "demo/sample.wav"
    make_sample_image(img)
    make_sample_audio(aud)
    text = "Hello from RC4! سلام"
    pw = args.key
    ct = rc4_encrypt(text, pw)
    img_hide(img, "demo/secret.bmp", ct)
    print("image recovered:", rc4_decrypt(img_extract("demo/secret.bmp"), pw).decode(errors="replace"))
    aud_hide(aud, "demo/secret.wav", ct)
    print("audio recovered:", rc4_decrypt(aud_extract("demo/secret.wav"), pw).decode(errors="replace"))


def main():
    p = argparse.ArgumentParser(description="RC4 (manual) + stego")
    p.add_argument("--key", default="my-secret-key")
    sub = p.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("demo")
    d.set_defaults(func=cmd_demo)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
