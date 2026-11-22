"""RC6-32/20/16 (Ronald Rivest et al., 1998, AES Finalist) in pure Python."""

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


def rc6_setup(key_bytes, r=20):
    c = max(1, len(key_bytes) // 4)
    L = list(struct.unpack("<" + "I" * c, key_bytes[:c * 4]))
    t = 2 * r + 4
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


def rc6_encrypt_block(pt16, S, r=20):
    A, B, C, D = struct.unpack("<IIII", pt16)
    B = (B + S[0]) & 0xffffffff
    D = (D + S[1]) & 0xffffffff
    for i in range(1, r + 1):
        t = rotl32((B * (2 * B + 1)) & 0xffffffff, 5)
        u = rotl32((D * (2 * D + 1)) & 0xffffffff, 5)
        A = (rotl32(A ^ t, u) + S[2 * i]) & 0xffffffff
        C = (rotl32(C ^ u, t) + S[2 * i + 1]) & 0xffffffff
        A, B, C, D = B, C, D, A
    A = (A + S[2 * r + 2]) & 0xffffffff
    C = (C + S[2 * r + 3]) & 0xffffffff
    return struct.pack("<IIII", A, B, C, D)


def rc6_decrypt_block(ct16, S, r=20):
    A, B, C, D = struct.unpack("<IIII", ct16)
    C = (C - S[2 * r + 3]) & 0xffffffff
    A = (A - S[2 * r + 2]) & 0xffffffff
    for i in range(r, 0, -1):
        A, B, C, D = D, A, B, C
        u = rotl32((D * (2 * D + 1)) & 0xffffffff, 5)
        t = rotl32((B * (2 * B + 1)) & 0xffffffff, 5)
        C = rotr32((C - S[2 * i + 1]) & 0xffffffff, t) ^ u
        A = rotr32((A - S[2 * i]) & 0xffffffff, u) ^ t
    D = (D - S[1]) & 0xffffffff
    B = (B - S[0]) & 0xffffffff
    return struct.pack("<IIII", A, B, C, D)


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:16]  # 128-bit key


def rc6_encrypt(plaintext, password, r=20):
    key = derive_key(password)
    S = rc6_setup(key, r)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    # PKCS#7 padding to 16 bytes
    pad_len = 16 - (len(data) % 16)
    data = data + bytes([pad_len]) * pad_len
    out = bytearray()
    for i in range(0, len(data), 16):
        out += rc6_encrypt_block(data[i:i + 16], S, r)
    return bytes(out)


def rc6_decrypt(ciphertext, password, r=20):
    key = derive_key(password)
    S = rc6_setup(key, r)
    out = bytearray()
    for i in range(0, len(ciphertext), 16):
        out += rc6_decrypt_block(ciphertext[i:i + 16], S, r)
    pad_len = out[-1]
    if pad_len < 1 or pad_len > 16 or out[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("Invalid padding")
    return bytes(out[:-pad_len])


def cmd_demo(args):
    pw = "SecretRC6Key@2026"
    msg = "اختبار خوارزمية RC6 المتأهلة لنهائيات معيار التشفير المتقدم AES"
    ct = rc6_encrypt(msg, pw)
    pt = rc6_decrypt(ct, pw).decode("utf-8")
    print(f"RC6 Ciphertext (hex): {ct.hex()}")
    print(f"RC6 Decrypted: {pt}")
    print(f"Match: {msg == pt}")


def main():
    p = argparse.ArgumentParser(description="RC6 Cipher CLI")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("demo")
    args = p.parse_args()
    if args.cmd == "demo" or not args.cmd:
        cmd_demo(args)


if __name__ == "__main__":
    main()
