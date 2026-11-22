"""AES-128 implementation using standard library (pycryptodome) + LSB steganography."""

import argparse
import hashlib
import os
import struct
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from stego_image import hide as img_hide, extract as img_extract
from stego_audio import hide as aud_hide, extract as aud_extract


def derive_key(password):
    return hashlib.sha256(password.encode()).digest()[:16]


def aes_encrypt(plaintext, password):
    key = derive_key(password)
    cipher = AES.new(key, AES.MODE_ECB)
    data = plaintext.encode() if isinstance(plaintext, str) else plaintext
    return cipher.encrypt(pad(data, AES.block_size))


def aes_decrypt(ciphertext, password):
    key = derive_key(password)
    cipher = AES.new(key, AES.MODE_ECB)
    return unpad(cipher.decrypt(ciphertext), AES.block_size)


def cmd_demo(args):
    pw = "MasterSecretAESKey2026"
    msg = "مرحبا بك في اختبار خوارزمية AES (المكتبة الجاهزة)"
    ct = aes_encrypt(msg, pw)
    pt = aes_decrypt(ct, pw).decode("utf-8")
    print(f"AES (Libs) Ciphertext (hex): {ct.hex()}")
    print(f"AES (Libs) Decrypted: {pt}")
    print(f"Match: {msg == pt}")


def main():
    p = argparse.ArgumentParser(description="AES-128 using ready-made libs")
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
