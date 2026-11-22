"""AES-128 (Rijndael) pure educational implementation in Python.
Computes GF(2^8) Galois Field arithmetic dynamically (no hardcoded copyrighted tables).
"""

import argparse
import hashlib
import os
import struct
from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract


def gf_mul(a, b):
    """Multiplication in GF(2^8) modulo irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11b)."""
    p = 0
    for _ in range(8):
        if b & 1:
            p ^= a
        hi = a & 0x80
        a = (a << 1) & 0xff
        if hi:
            a ^= 0x1b
        b >>= 1
    return p


def gf_inv(a):
    """Multiplicative inverse in GF(2^8) via Fermat's Little Theorem (a^254 mod m)."""
    if a == 0:
        return 0
    res = 1
    base = a
    exp = 254
    while exp > 0:
        if exp & 1:
            res = gf_mul(res, base)
        base = gf_mul(base, base)
        exp >>= 1
    return res


# Dynamic construction of Rijndael S-Box and Inverse S-Box
SBOX = [0] * 256
for i in range(256):
    inv = gf_inv(i)
    s = inv ^ ((inv << 1) | (inv >> 7)) ^ ((inv << 2) | (inv >> 6)) ^ ((inv << 3) | (inv >> 5)) ^ ((inv << 4) | (inv >> 4)) ^ 0x63
    SBOX[i] = s & 0xff

INV_SBOX = [SBOX.index(i) for i in range(256)]

RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36]


def sub_word(w):
    return ((SBOX[(w >> 24) & 0xff] << 24) |
            (SBOX[(w >> 16) & 0xff] << 16) |
            (SBOX[(w >> 8) & 0xff] << 8) |
            (SBOX[w & 0xff]))


def rot_word(w):
    return (((w << 8) & 0xffffffff) | (w >> 24))


def key_expansion(key_bytes):
    w = [0] * 44
    for i in range(4):
        w[i] = (key_bytes[4 * i] << 24) | (key_bytes[4 * i + 1] << 16) | (key_bytes[4 * i + 2] << 8) | key_bytes[4 * i + 3]
    for i in range(4, 44):
        temp = w[i - 1]
        if i % 4 == 0:
            temp = sub_word(rot_word(temp)) ^ (RCON[i // 4] << 24)
        w[i] = w[i - 4] ^ temp
    return w


def sub_bytes(s):
    for r in range(4):
        for c in range(4):
            s[r][c] = SBOX[s[r][c]]


def inv_sub_bytes(s):
    for r in range(4):
        for c in range(4):
            s[r][c] = INV_SBOX[s[r][c]]


def shift_rows(s):
    s[1] = s[1][1:] + s[1][:1]
    s[2] = s[2][2:] + s[2][:2]
    s[3] = s[3][3:] + s[3][:3]


def inv_shift_rows(s):
    s[1] = s[1][3:] + s[1][:3]
    s[2] = s[2][2:] + s[2][:2]
    s[3] = s[3][1:] + s[3][:1]


def mix_columns(s):
    for c in range(4):
        a0, a1, a2, a3 = s[0][c], s[1][c], s[2][c], s[3][c]
        s[0][c] = gf_mul(2, a0) ^ gf_mul(3, a1) ^ a2 ^ a3
        s[1][c] = a0 ^ gf_mul(2, a1) ^ gf_mul(3, a2) ^ a3
        s[2][c] = a0 ^ a1 ^ gf_mul(2, a2) ^ gf_mul(3, a3)
        s[3][c] = gf_mul(3, a0) ^ a1 ^ a2 ^ gf_mul(2, a3)


def inv_mix_columns(s):
    for c in range(4):
        a0, a1, a2, a3 = s[0][c], s[1][c], s[2][c], s[3][c]
        s[0][c] = gf_mul(14, a0) ^ gf_mul(11, a1) ^ gf_mul(13, a2) ^ gf_mul(9, a3)
        s[1][c] = gf_mul(9, a0) ^ gf_mul(14, a1) ^ gf_mul(11, a2) ^ gf_mul(13, a3)
        s[2][c] = gf_mul(13, a0) ^ gf_mul(9, a1) ^ gf_mul(14, a2) ^ gf_mul(11, a3)
        s[3][c] = gf_mul(11, a0) ^ gf_mul(13, a1) ^ gf_mul(9, a2) ^ gf_mul(14, a3)


def add_round_key(s, w, rnd):
    for c in range(4):
        k = w[rnd * 4 + c]
        s[0][c] ^= (k >> 24) & 0xff
        s[1][c] ^= (k >> 16) & 0xff
        s[2][c] ^= (k >> 8) & 0xff
        s[3][c] ^= k & 0xff


def aes_encrypt_block(blk, w):
    s = [[blk[r + 4 * c] for c in range(4)] for r in range(4)]
    add_round_key(s, w, 0)
    for rnd in range(1, 10):
        sub_bytes(s)
        shift_rows(s)
        mix_columns(s)
        add_round_key(s, w, rnd)
    sub_bytes(s)
    shift_rows(s)
    add_round_key(s, w, 10)
    out = bytearray(16)
    for r in range(4):
        for c in range(4):
            out[r + 4 * c] = s[r][c]
    return bytes(out)


def aes_decrypt_block(blk, w):
    s = [[blk[r + 4 * c] for c in range(4)] for r in range(4)]
    add_round_key(s, w, 10)
    for rnd in range(9, 0, -1):
        inv_shift_rows(s)
        inv_sub_bytes(s)
        add_round_key(s, w, rnd)
        inv_mix_columns(s)
    inv_shift_rows(s)
    inv_sub_bytes(s)
    add_round_key(s, w, 0)
    out = bytearray(16)
    for r in range(4):
        for c in range(4):
            out[r + 4 * c] = s[r][c]
    return bytes(out)


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:16]


def aes_encrypt(plaintext, password):
    key = derive_key(password)
    w = key_expansion(key)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    pad_len = 16 - (len(data) % 16)
    data = data + bytes([pad_len]) * pad_len
    out = bytearray()
    for i in range(0, len(data), 16):
        out += aes_encrypt_block(data[i:i + 16], w)
    return bytes(out)


def aes_decrypt(ciphertext, password):
    key = derive_key(password)
    w = key_expansion(key)
    out = bytearray()
    for i in range(0, len(ciphertext), 16):
        out += aes_decrypt_block(ciphertext[i:i + 16], w)
    pad_len = out[-1]
    if pad_len < 1 or pad_len > 16 or out[-pad_len:] != bytes([pad_len]) * pad_len:
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
            row += bytes([(x * 4) % 256, (y * 4) % 256, 150])
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
    pw = "MasterSecretAESKey2026"
    msg = "مرحبا بك في اختبار خوارزمية AES-128 المتقدمة"
    ct = aes_encrypt(msg, pw)
    pt = aes_decrypt(ct, pw).decode("utf-8")
    print(f"AES Ciphertext (hex): {ct.hex()}")
    print(f"AES Decrypted: {pt}")
    print(f"Match: {msg == pt}")

    os.makedirs("demo", exist_ok=True)
    img_sample = "demo/sample.bmp"
    aud_sample = "demo/sample.wav"
    make_sample_image(img_sample)
    make_sample_audio(aud_sample)

    img_hide(img_sample, "demo/secret.bmp", ct)
    ext_ct = img_extract("demo/secret.bmp")
    print("Stego BMP Decrypted:", aes_decrypt(ext_ct, pw).decode())

    aud_hide(aud_sample, "demo/secret.wav", ct)
    ext_aud_ct = aud_extract("demo/secret.wav")
    print("Stego WAV Decrypted:", aes_decrypt(ext_aud_ct, pw).decode())


def main():
    p = argparse.ArgumentParser(description="AES-128 from scratch")
    p.add_argument("--key", default="MasterSecretAESKey2026")
    sub = p.add_subparsers(dest="cmd", required=True)

    ih = sub.add_parser("image-hide")
    ih.add_argument("input"); ih.add_argument("output"); ih.add_argument("text")
    ih.set_defaults(func=lambda a: img_hide(a.input, a.output, aes_encrypt(a.text, a.key)) or print("done"))

    ish = sub.add_parser("image-show")
    ish.add_argument("input")
    ish.set_defaults(func=lambda a: print("secret:", aes_decrypt(img_extract(a.input), a.key).decode()))

    ah = sub.add_parser("audio-hide")
    ah.add_argument("input"); ah.add_argument("output"); ah.add_argument("text")
    ah.set_defaults(func=lambda a: aud_hide(a.input, a.output, aes_encrypt(a.text, a.key)) or print("done"))

    ash = sub.add_parser("audio-show")
    ash.add_argument("input")
    ash.set_defaults(func=lambda a: print("secret:", aes_decrypt(aud_extract(a.input), a.key).decode()))

    d = sub.add_parser("demo")
    d.set_defaults(func=cmd_demo)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
