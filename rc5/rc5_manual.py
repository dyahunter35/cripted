"""RC5-32/12/16 (Ronald Rivest, 1994) implemented from scratch in pure Python."""

import argparse
import hashlib
import struct
from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract

# Magic constants for word size w=32
P32 = 0xb7e15163
Q32 = 0x9e3779b9


def rotl32(x, y):
    y = y & 31
    return (((x << y) & 0xffffffff) | (x >> (32 - y))) & 0xffffffff


def rotr32(x, y):
    y = y & 31
    return ((x >> y) | ((x << (32 - y)) & 0xffffffff)) & 0xffffffff


def rc5_setup(key_bytes, r=12):
    # Key expansion for RC5-32/12/16
    c = max(1, len(key_bytes) // 4)
    L = list(struct.unpack("<" + "I" * c, key_bytes[:c * 4]))
    t = 2 * (r + 1)
    S = [0] * t
    S[0] = P32
    for i in range(1, t):
        S[i] = (S[i - 1] + Q32) & 0xffffffff

    i = j = A = B = 0
    loops = 3 * max(t, c)
    for _ in range(loops):
        A = S[i] = rotl32((S[i] + A + B) & 0xffffffff, 3)
        B = L[j] = rotl32((L[j] + A + B) & 0xffffffff, (A + B) & 31)
        i = (i + 1) % t
        j = (j + 1) % c
    return S


def rc5_encrypt_block(pt8, S, r=12):
    A, B = struct.unpack("<II", pt8)
    A = (A + S[0]) & 0xffffffff
    B = (B + S[1]) & 0xffffffff
    for i in range(1, r + 1):
        A = (rotl32(A ^ B, B) + S[2 * i]) & 0xffffffff
        B = (rotl32(B ^ A, A) + S[2 * i + 1]) & 0xffffffff
    return struct.pack("<II", A, B)


def rc5_decrypt_block(ct8, S, r=12):
    A, B = struct.unpack("<II", ct8)
    for i in range(r, 0, -1):
        B = rotr32((B - S[2 * i + 1]) & 0xffffffff, A) ^ A
        A = rotr32((A - S[2 * i]) & 0xffffffff, B) ^ B
    B = (B - S[1]) & 0xffffffff
    A = (A - S[0]) & 0xffffffff
    return struct.pack("<II", A, B)


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:16]  # 128-bit key


def rc5_encrypt(plaintext, password, r=12):
    key = derive_key(password)
    S = rc5_setup(key, r)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    # PKCS#7 padding to 8 bytes
    pad_len = 8 - (len(data) % 8)
    data = data + bytes([pad_len]) * pad_len
    out = bytearray()
    for i in range(0, len(data), 8):
        out += rc5_encrypt_block(data[i:i + 8], S, r)
    return bytes(out)


def rc5_decrypt(ciphertext, password, r=12):
    key = derive_key(password)
    S = rc5_setup(key, r)
    out = bytearray()
    for i in range(0, len(ciphertext), 8):
        out += rc5_decrypt_block(ciphertext[i:i + 8], S, r)
    pad_len = out[-1]
    if pad_len < 1 or pad_len > 8 or out[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("Invalid padding")
    return bytes(out[:-pad_len])


def cmd_demo(args):
    pw = "SecretRC5Key@2026"
    msg = "مرحبا بك في اختبار خوارزمية RC5 التعليمية"
    ct = rc5_encrypt(msg, pw)
    pt = rc5_decrypt(ct, pw).decode("utf-8")
    print(f"RC5 Ciphertext (hex): {ct.hex()}")
    print(f"RC5 Decrypted: {pt}")
    print(f"Match: {msg == pt}")


def main():
    p = argparse.ArgumentParser(description="RC5 Cipher CLI")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("demo")
    args = p.parse_args()
    if args.cmd == "demo" or not args.cmd:
        cmd_demo(args)


if __name__ == "__main__":
    main()
