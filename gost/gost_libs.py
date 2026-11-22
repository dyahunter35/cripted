"""GOST (Magma) using ready-made library gostcrypto + steganography."""

import argparse
import hashlib
import math
import os
import struct
import wave

from gostcrypto.gostcipher import GOST34122015Magma

from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()  # 32 bytes


def gost_encrypt(plaintext, password):
    key = derive_key(password)
    cipher = GOST34122015Magma(bytearray(key))
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    # PKCS#7 pad to 8
    pad_len = 8 - (len(data) % 8)
    if pad_len == 0:
        pad_len = 8
    data = data + bytes([pad_len]) * pad_len
    out = bytearray()
    for i in range(0, len(data), 8):
        out += cipher.encrypt(bytearray(data[i:i + 8]))
    return bytes(out)


def gost_decrypt(ciphertext, password):
    key = derive_key(password)
    cipher = GOST34122015Magma(bytearray(key))
    if len(ciphertext) % 8 != 0:
        raise ValueError("bad length")
    out = bytearray()
    for i in range(0, len(ciphertext), 8):
        out += cipher.decrypt(bytearray(ciphertext[i:i + 8]))
    pad_len = out[-1]
    if pad_len < 1 or pad_len > 8 or out[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("bad padding")
    return bytes(out[:-pad_len])


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
    text = "Hello from GOST (libs)! سلام"
    pw = args.key
    ct = gost_encrypt(text, pw)
    img_hide(img, "demo/secret.bmp", ct)
    print("image recovered:", gost_decrypt(img_extract("demo/secret.bmp"), pw).decode())
    aud_hide(aud, "demo/secret.wav", ct)
    print("audio recovered:", gost_decrypt(aud_extract("demo/secret.wav"), pw).decode())


def main():
    p = argparse.ArgumentParser(description="GOST (libs) + stego")
    p.add_argument("--key", default="my-secret-key")
    sub = p.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("demo")
    d.set_defaults(func=cmd_demo)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
