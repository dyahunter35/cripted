"""Blowfish (Bruce Schneier, 1993) implementation using pycryptodome + LSB steganography."""

import argparse
import hashlib
import os
import struct
from Crypto.Cipher import Blowfish
from Crypto.Util.Padding import pad, unpad
from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:16]


def blowfish_encrypt(plaintext, password):
    key = derive_key(password)
    cipher = Blowfish.new(key, Blowfish.MODE_ECB)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    return cipher.encrypt(pad(data, Blowfish.block_size))


def blowfish_decrypt(ciphertext, password):
    key = derive_key(password)
    cipher = Blowfish.new(key, Blowfish.MODE_ECB)
    return unpad(cipher.decrypt(ciphertext), Blowfish.block_size)


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
    struct.pack_into("<I", header, 34, row_size * h)
    body = bytearray()
    for y in range(h):
        row = bytearray()
        for x in range(w):
            row += bytes([(x * 4) % 256, (y * 4) % 256, 120])
        row += bytes(row_size - w * 3)
        body += row
    with open(path, "wb") as f:
        f.write(header + body)


def make_sample_audio(path, seconds=1, rate=22050):
    import wave
    import math
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        frames = bytearray()
        for i in range(rate * seconds):
            frames += struct.pack("<h", int(10000 * math.sin(2 * math.pi * 440 * i / rate)))
        w.writeframes(frames)


def cmd_demo(args):
    pw = "MasterSecretBlowfishKey2026"
    msg = "مرحبا بك في اختبار خوارزمية Blowfish التعليمية"
    ct = blowfish_encrypt(msg, pw)
    pt = blowfish_decrypt(ct, pw).decode("utf-8")
    print(f"Blowfish Ciphertext (hex): {ct.hex()}")
    print(f"Blowfish Decrypted: {pt}")
    print(f"Match: {msg == pt}")

    os.makedirs("demo", exist_ok=True)
    img_sample = "demo/sample.bmp"
    aud_sample = "demo/sample.wav"
    make_sample_image(img_sample)
    make_sample_audio(aud_sample)

    img_hide(img_sample, "demo/secret.bmp", ct)
    ext_ct = img_extract("demo/secret.bmp")
    print("Stego BMP Decrypted:", blowfish_decrypt(ext_ct, pw).decode())

    aud_hide(aud_sample, "demo/secret.wav", ct)
    ext_aud_ct = aud_extract("demo/secret.wav")
    print("Stego WAV Decrypted:", blowfish_decrypt(ext_aud_ct, pw).decode())


def main():
    p = argparse.ArgumentParser(description="Blowfish encryption using pycryptodome")
    p.add_argument("--key", default="MasterSecretBlowfishKey2026")
    sub = p.add_subparsers(dest="cmd", required=True)

    ih = sub.add_parser("image-hide")
    ih.add_argument("input"); ih.add_argument("output"); ih.add_argument("text")
    ih.set_defaults(func=lambda a: img_hide(a.input, a.output, blowfish_encrypt(a.text, a.key)) or print("done"))

    ish = sub.add_parser("image-show")
    ish.add_argument("input")
    ish.set_defaults(func=lambda a: print("secret:", blowfish_decrypt(img_extract(a.input), a.key).decode()))

    ah = sub.add_parser("audio-hide")
    ah.add_argument("input"); ah.add_argument("output"); ah.add_argument("text")
    ah.set_defaults(func=lambda a: aud_hide(a.input, a.output, blowfish_encrypt(a.text, a.key)) or print("done"))

    ash = sub.add_parser("audio-show")
    ash.add_argument("input")
    ash.set_defaults(func=lambda a: print("secret:", blowfish_decrypt(aud_extract(a.input), a.key).decode()))

    d = sub.add_parser("demo")
    d.set_defaults(func=cmd_demo)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
