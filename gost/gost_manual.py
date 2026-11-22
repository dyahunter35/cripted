"""GOST (Magma, GOST R 34.12-2015) implemented from scratch + steganography."""

import argparse
import hashlib
import math
import os
import struct
import wave
from struct import pack

from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract

# ---------- S-boxes (from GOST R 34.12-2015 / gostcrypto) ----------
_S_BOX_MAGMA = (
    (0x0c, 0x04, 0x06, 0x02, 0x0a, 0x05, 0x0b, 0x09, 0x0e, 0x08, 0x0d, 0x07, 0x00, 0x03, 0x0f, 0x01),
    (0x06, 0x08, 0x02, 0x03, 0x09, 0x0a, 0x05, 0x0c, 0x01, 0x0e, 0x04, 0x07, 0x0b, 0x0d, 0x00, 0x0f),
    (0x0b, 0x03, 0x05, 0x08, 0x02, 0x0f, 0x0a, 0x0d, 0x0e, 0x01, 0x07, 0x04, 0x0c, 0x09, 0x06, 0x00),
    (0x0c, 0x08, 0x02, 0x01, 0x0d, 0x04, 0x0f, 0x06, 0x07, 0x00, 0x0a, 0x05, 0x03, 0x0e, 0x09, 0x0b),
    (0x07, 0x0f, 0x05, 0x0a, 0x08, 0x01, 0x06, 0x0d, 0x00, 0x09, 0x03, 0x0e, 0x0b, 0x04, 0x02, 0x0c),
    (0x05, 0x0d, 0x0f, 0x06, 0x09, 0x02, 0x0c, 0x0a, 0x0b, 0x07, 0x08, 0x01, 0x04, 0x03, 0x0e, 0x00),
    (0x08, 0x0e, 0x02, 0x05, 0x06, 0x09, 0x01, 0x0c, 0x0f, 0x04, 0x0b, 0x00, 0x0d, 0x0a, 0x03, 0x07),
    (0x01, 0x07, 0x0e, 0x0d, 0x00, 0x05, 0x08, 0x03, 0x04, 0x0f, 0x0a, 0x06, 0x09, 0x0c, 0x0b, 0x02),
)


def _expand_key(key_bytes):
    key = bytearray(key_bytes)
    iter_keys = []
    for _ in range(3):
        for j in range(8):
            ik = bytearray(4)
            for i in range(4):
                ik[i] = key[(j * 4) + i]
            iter_keys.append(ik)
    for j in range(8):
        ik = bytearray(4)
        for i in range(4):
            ik[i] = key[28 - (j * 4) + i]
        iter_keys.append(ik)
    return iter_keys


def _add32(a, b):
    a = bytearray(a); b = bytearray(b)
    internal = 0
    result = bytearray(4)
    for i in range(3, -1, -1):
        internal = a[i] + b[i] + (internal >> 8)
        result[i] = internal & 0xff
    return result


def _t(data):
    result = bytearray(4)
    data = bytearray(data)
    for i in range(4):
        first = data[i] & 0x0f
        sec = (data[i] & 0xf0) >> 4
        first = _S_BOX_MAGMA[(3 - i) * 2][first]
        sec = _S_BOX_MAGMA[(3 - i) * 2 + 1][sec]
        result[i] = (sec << 4) | first
    return result


def _g(k, a):
    internal = _add32(k, a)
    internal = _t(internal)
    val = 0
    for byte in internal:
        val = (val << 8) | byte
    val = ((val << 11) | (val >> 21)) & 0xffffffff
    return bytearray(pack(">I", val))


def _g_iter(k, block):
    a0 = bytearray(block[4:8])
    a1 = bytearray(block[0:4])
    gg = _g(k, a0)
    # xor a1
    for i in range(4):
        gg[i] ^= a1[i]
    return a0, a1, gg


def _g_prev(k, block):
    a0, a1, gg = _g_iter(k, block)
    a1 = a0
    a0 = gg
    result = bytearray(8)
    result[0:4] = a1
    result[4:8] = a0
    return result


def _g_fin(k, block):
    a0, a1, gg = _g_iter(k, block)
    a1 = gg
    result = bytearray(8)
    result[0:4] = a1
    result[4:8] = a0
    return result


def _encrypt_block(block8, key_bytes):
    keys = _expand_key(key_bytes)
    result = bytearray(block8)
    result = _g_prev(keys[0], result)
    for i in range(1, 31):
        result = _g_prev(keys[i], result)
    result = _g_fin(keys[31], result)
    return bytes(result)


def _decrypt_block(block8, key_bytes):
    keys = _expand_key(key_bytes)
    result = bytearray(block8)
    result = _g_prev(keys[31], result)
    for i in range(30, 0, -1):
        result = _g_prev(keys[i], result)
    result = _g_fin(keys[0], result)
    return bytes(result)


def _pkcs7_pad(data, bs=8):
    pad_len = bs - (len(data) % bs)
    if pad_len == 0:
        pad_len = bs
    return data + bytes([pad_len]) * pad_len


def _pkcs7_unpad(data):
    pad_len = data[-1]
    if pad_len < 1 or pad_len > 8 or data[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("bad padding")
    return data[:-pad_len]


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:32]


def gost_encrypt(plaintext, password):
    key = derive_key(password)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    data = _pkcs7_pad(data)
    out = bytearray()
    for i in range(0, len(data), 8):
        out += _encrypt_block(data[i:i + 8], key)
    return bytes(out)


def gost_decrypt(ciphertext, password):
    key = derive_key(password)
    if len(ciphertext) % 8 != 0:
        raise ValueError("bad length")
    out = bytearray()
    for i in range(0, len(ciphertext), 8):
        out += _decrypt_block(ciphertext[i:i + 8], key)
    return _pkcs7_unpad(bytes(out))


# ---- stego helpers ----
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
    text = "Hello from GOST! سلام"
    pw = args.key
    # image
    ct = gost_encrypt(text, pw)
    img_hide(img, "demo/secret.bmp", ct)
    ct2 = img_extract("demo/secret.bmp")
    print("image recovered:", gost_decrypt(ct2, pw).decode())
    # audio
    aud_hide(aud, "demo/secret.wav", ct)
    ct3 = aud_extract("demo/secret.wav")
    print("audio recovered:", gost_decrypt(ct3, pw).decode())


def main():
    p = argparse.ArgumentParser(description="GOST (manual) + stego")
    p.add_argument("--key", default="my-secret-key")
    sub = p.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("demo")
    d.set_defaults(func=cmd_demo)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
