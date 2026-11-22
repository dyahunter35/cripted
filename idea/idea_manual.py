"""IDEA (International Data Encryption Algorithm - Lai & Massey, 1991).
Pure Python implementation from scratch based on mixed algebraic groups.
"""

import argparse
import hashlib
import os
import struct
from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract


def mul_mod(a, b):
    """Multiplication modulo 65537 (2^16 + 1, Fermat prime F4). 0 is treated as 2^16."""
    a = 65536 if a == 0 else a
    b = 65536 if b == 0 else b
    r = (a * b) % 65537
    return 0 if r == 65536 else r


def inv_mul(a):
    """Multiplicative inverse modulo 65537 via Fermat's Little Theorem."""
    if a == 0:
        return 0
    return pow(a, 65535, 65537)


def inv_add(a):
    """Additive inverse modulo 2^16 (65536)."""
    return (-a) & 0xffff


def idea_expand_key(key_bytes):
    """Expand 128-bit key into 52 16-bit subkeys via 25-bit cyclic rotations."""
    key_int = int.from_bytes(key_bytes, "big")
    subkeys = []
    for i in range(52):
        shift = (128 - 16 * (i % 8) - 16)
        subkeys.append((key_int >> shift) & 0xffff)
        if (i % 8) == 7:
            key_int = ((key_int << 25) & ((1 << 128) - 1)) | (key_int >> (128 - 25))
    return subkeys


def idea_invert_keys(ek):
    """Derive decryption subkeys from encryption subkeys."""
    dk = [0] * 52
    # Round 1
    dk[0] = inv_mul(ek[48])
    dk[1] = inv_add(ek[49])
    dk[2] = inv_add(ek[50])
    dk[3] = inv_mul(ek[51])
    dk[4] = ek[46]
    dk[5] = ek[47]
    # Rounds 2 to 8
    for r in range(1, 8):
        s = 48 - r * 6
        dk[r * 6] = inv_mul(ek[s])
        dk[r * 6 + 1] = inv_add(ek[s + 2])
        dk[r * 6 + 2] = inv_add(ek[s + 1])
        dk[r * 6 + 3] = inv_mul(ek[s + 3])
        dk[r * 6 + 4] = ek[s - 2]
        dk[r * 6 + 5] = ek[s - 1]
    # Round 9 (Output transformation)
    dk[48] = inv_mul(ek[0])
    dk[49] = inv_add(ek[1])
    dk[50] = inv_add(ek[2])
    dk[51] = inv_mul(ek[3])
    return dk


def idea_crypt_block(block8, subkeys):
    """Encrypt or decrypt an 8-byte block using 52 subkeys."""
    x1 = (block8[0] << 8) | block8[1]
    x2 = (block8[2] << 8) | block8[3]
    x3 = (block8[4] << 8) | block8[5]
    x4 = (block8[6] << 8) | block8[7]

    for r in range(8):
        k = r * 6
        x1 = mul_mod(x1, subkeys[k])
        x2 = (x2 + subkeys[k + 1]) & 0xffff
        x3 = (x3 + subkeys[k + 2]) & 0xffff
        x4 = mul_mod(x4, subkeys[k + 3])

        a = x1 ^ x3
        b = x2 ^ x4
        c = mul_mod(a, subkeys[k + 4])
        d = (b + c) & 0xffff
        e = mul_mod(d, subkeys[k + 5])
        f = (c + e) & 0xffff

        x1 ^= e
        x4 ^= f
        x2_new = x3 ^ e
        x3_new = x2 ^ f
        x2, x3 = x2_new, x3_new

    # Undo final swap between x2 and x3, then apply output transformation
    x2, x3 = x3, x2
    y1 = mul_mod(x1, subkeys[48])
    y2 = (x2 + subkeys[49]) & 0xffff
    y3 = (x3 + subkeys[50]) & 0xffff
    y4 = mul_mod(x4, subkeys[51])

    return bytes([
        y1 >> 8, y1 & 0xff,
        y2 >> 8, y2 & 0xff,
        y3 >> 8, y3 & 0xff,
        y4 >> 8, y4 & 0xff
    ])


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:16]


def idea_encrypt(plaintext, password):
    key = derive_key(password)
    ek = idea_expand_key(key)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    pad_len = 8 - (len(data) % 8)
    data = data + bytes([pad_len]) * pad_len
    out = bytearray()
    for i in range(0, len(data), 8):
        out += idea_crypt_block(data[i:i + 8], ek)
    return bytes(out)


def idea_decrypt(ciphertext, password):
    key = derive_key(password)
    ek = idea_expand_key(key)
    dk = idea_invert_keys(ek)
    out = bytearray()
    for i in range(0, len(ciphertext), 8):
        out += idea_crypt_block(ciphertext[i:i + 8], dk)
    pad_len = out[-1]
    if pad_len < 1 or pad_len > 8 or out[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("Invalid padding")
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
    struct.pack_into("<I", header, 34, row_size * h)
    body = bytearray()
    for y in range(h):
        row = bytearray()
        for x in range(w):
            row += bytes([(x * 4) % 256, (y * 4) % 256, 180])
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
    pw = "MasterSecretIDEAKey2026"
    msg = "مرحبا بك في اختبار خوارزمية IDEA التعليمية"
    ct = idea_encrypt(msg, pw)
    pt = idea_decrypt(ct, pw).decode("utf-8")
    print(f"IDEA Ciphertext (hex): {ct.hex()}")
    print(f"IDEA Decrypted: {pt}")
    print(f"Match: {msg == pt}")

    os.makedirs("demo", exist_ok=True)
    img_sample = "demo/sample.bmp"
    aud_sample = "demo/sample.wav"
    make_sample_image(img_sample)
    make_sample_audio(aud_sample)

    img_hide(img_sample, "demo/secret.bmp", ct)
    ext_ct = img_extract("demo/secret.bmp")
    print("Stego BMP Decrypted:", idea_decrypt(ext_ct, pw).decode())

    aud_hide(aud_sample, "demo/secret.wav", ct)
    ext_aud_ct = aud_extract("demo/secret.wav")
    print("Stego WAV Decrypted:", idea_decrypt(ext_aud_ct, pw).decode())


def main():
    p = argparse.ArgumentParser(description="IDEA from scratch")
    p.add_argument("--key", default="MasterSecretIDEAKey2026")
    sub = p.add_subparsers(dest="cmd", required=True)

    ih = sub.add_parser("image-hide")
    ih.add_argument("input"); ih.add_argument("output"); ih.add_argument("text")
    ih.set_defaults(func=lambda a: img_hide(a.input, a.output, idea_encrypt(a.text, a.key)) or print("done"))

    ish = sub.add_parser("image-show")
    ish.add_argument("input")
    ish.set_defaults(func=lambda a: print("secret:", idea_decrypt(img_extract(a.input), a.key).decode()))

    ah = sub.add_parser("audio-hide")
    ah.add_argument("input"); ah.add_argument("output"); ah.add_argument("text")
    ah.set_defaults(func=lambda a: aud_hide(a.input, a.output, idea_encrypt(a.text, a.key)) or print("done"))

    ash = sub.add_parser("audio-show")
    ash.add_argument("input")
    ash.set_defaults(func=lambda a: print("secret:", idea_decrypt(aud_extract(a.input), a.key).decode()))

    d = sub.add_parser("demo")
    d.set_defaults(func=cmd_demo)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
