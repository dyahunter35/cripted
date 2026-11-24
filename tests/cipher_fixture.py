"""Read-only cross-language fixtures. Libraries are independent oracles where available."""
import importlib.util
import pathlib
import sys
import hashlib
import json

ROOT = pathlib.Path(__file__).resolve().parents[1]

def load_cipher(algo, suffix="manual"):
    sys.path.insert(0, str(ROOT / algo))
    try:
        spec = importlib.util.spec_from_file_location(f"{algo}_{suffix}", ROOT / algo / f"{algo}_{suffix}.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        sys.path.pop(0)

def fixtures():
    from Crypto.Cipher import AES, DES, CAST, Blowfish, ARC4
    from Crypto.Util.Padding import pad
    from gostcrypto import gostcipher
    password = "اختبار key 🔐"
    key = hashlib.sha256(password.encode()).digest()
    items = []
    for text in ["", "first block! another block! نهاية  ", "1234567812345678"]:
        data = text.encode()
        for algo, lib in [("aes", AES),("des", DES),("cast",CAST),("blowfish",Blowfish)]:
            k = key[:8] if algo == "des" else key[:16]
            ct = lib.new(k,lib.MODE_ECB).encrypt(pad(data,lib.block_size))
            items.append(dict(algo=algo,password=password,text=text,hex=ct.hex()))
        ct = gostcipher.new("magma",bytearray(key),gostcipher.MODE_ECB).encrypt(bytearray(pad(data,8)))
        items.append(dict(algo="gost",password=password,text=text,hex=bytes(ct).hex()))
        items.append(dict(algo="rc4",password=password,text=text,hex=ARC4.new(key).encrypt(data).hex()))
        for algo in ["rc5","rc6","idea"]:
            m = load_cipher(algo)
            items.append(dict(algo=algo,password=password,text=text,hex=getattr(m,algo+"_encrypt")(data,password).hex()))
    return items

if __name__ == "__main__":
    print(json.dumps(fixtures(),ensure_ascii=False))
