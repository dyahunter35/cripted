import pathlib
import random
import struct
import tempfile
import unittest
from cipher_fixture import load_cipher, fixtures, ROOT
from Crypto.Cipher import CAST, Blowfish

class ReferenceVectors(unittest.TestCase):
    def test_known_answers(self):
        aes=load_cipher("aes")
        self.assertEqual(aes.aes_encrypt_block(bytes.fromhex("00112233445566778899aabbccddeeff"),aes.key_expansion(bytes(range(16)))).hex(),"69c4e0d86a7b0430d8cdb78070b4c55a")
        des=load_cipher("des")
        self.assertEqual(des.encrypt_block(bytes.fromhex("0123456789abcdef"),bytes.fromhex("133457799bbcdff1")).hex(),"85e813540f0ab405")
        idea=load_cipher("idea")
        self.assertEqual(idea.idea_crypt_block(bytes.fromhex("0000000100020003"),idea.idea_expand_key(bytes.fromhex("00010002000300040005000600070008"))).hex(),"11fbed2b01986de5")
        for algo,size,expected in [("rc5",8,"21a5dbee154b8f6d"),("rc6",16,"8fc3a53656b1f778c129df4e9848a41e")]:
            m=load_cipher(algo)
            self.assertEqual(getattr(m,algo+"_encrypt_block")(bytes(size),getattr(m,algo+"_setup")(bytes(16))).hex(),expected)
        gost=load_cipher("gost")
        self.assertEqual(gost._encrypt_block(bytes.fromhex("fedcba9876543210"),bytes.fromhex("ffeeddccbbaa99887766554433221100f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff")).hex(),"4ee901e5c2d8ca3d")
        rc4=load_cipher("rc4")
        stream=rc4._prga(rc4._ksa(b"Key"),9)
        self.assertEqual(bytes(a^b for a,b in zip(b"Plaintext",stream)).hex(),"bbf316e8d940af0ad3")

    def test_cast_and_blowfish_independent_blocks(self):
        cast=load_cipher("cast");bf=load_cipher("blowfish")
        for key,expected in [("0123456712345678234567893456789a","238b4fe5847e44b2"),("01234567123456782345","eb6a711a2c02271b"),("0123456712","7ac816d16e9b302e")]:
            p=bytes.fromhex("0123456789abcdef")
            self.assertEqual(cast.cast_encrypt_block(p,bytes.fromhex(key)).hex(),expected)
            self.assertEqual(cast.cast_decrypt_block(bytes.fromhex(expected),bytes.fromhex(key)),p)
        self.assertEqual(bf.Blowfish(bytes(8)).crypt_block(bytes(8)).hex(),"4ef997456198dd78")
        rng=random.Random(2144)
        for n in range(5,17):
            key=rng.randbytes(n);block=rng.randbytes(8)
            expected=CAST.new(key,CAST.MODE_ECB).encrypt(block)
            self.assertEqual(cast.cast_encrypt_block(block,key),expected)
            self.assertEqual(cast.cast_decrypt_block(expected,key),block)
        for n in [4,8,16,24,32,56]:
            key=rng.randbytes(n);cipher=bf.Blowfish(key)
            for _ in range(8):
                block=rng.randbytes(8);expected=Blowfish.new(key,Blowfish.MODE_ECB).encrypt(block)
                self.assertEqual(cipher.crypt_block(block),expected)
                self.assertEqual(cipher.crypt_block(expected,True),block)

    def test_python_password_api_against_fixtures(self):
        for case in fixtures():
            algo=case["algo"];m=load_cipher(algo)
            enc=m.encrypt if algo=="des" else getattr(m,algo+"_encrypt")
            dec=m.decrypt if algo=="des" else getattr(m,algo+"_decrypt")
            key=m.derive_key(case["password"]) if algo=="des" else case["password"]
            with self.subTest(algo=algo,text=case["text"]):
                ct=enc(case["text"],key)
                self.assertEqual(ct.hex(),case["hex"])
                self.assertEqual(dec(ct,key),case["text"].encode())

class StegoBoundaries(unittest.TestCase):
    def test_top_down_and_small_bmp_all_copies(self):
        import importlib.util
        for directory in ["aes","des","rc5","rc6","rc4","gost","idea","cast","blowfish"]:
            path=ROOT/directory/"stego_image.py"
            spec=importlib.util.spec_from_file_location(directory+"_image",path)
            m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
            with tempfile.TemporaryDirectory() as temp:
                source=pathlib.Path(temp)/"source.bmp";out=pathlib.Path(temp)/"out.bmp"
                data=bytearray((ROOT/"aes/demo/sample.bmp").read_bytes())
                struct.pack_into("<i",data,22,-64);source.write_bytes(data)
                payload="رسالة UTF-8".encode();m.hide(source,out,payload)
                with self.subTest(copy=directory):
                    self.assertEqual(m.extract(out),payload)
                    with self.assertRaises(ValueError):m.hide(source,out,bytes(m.capacity_bytes(64,-64)+1))
                    source.write_bytes(data[:30])
                    with self.assertRaises(ValueError):m.extract(source)

    def test_wav_payload_capacity_and_small_header(self):
        import importlib.util
        import wave
        for directory in ["aes","des","rc5","rc6","rc4","gost","idea","cast","blowfish"]:
            spec=importlib.util.spec_from_file_location(directory+"_audio",ROOT/directory/"stego_audio.py")
            m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
            with tempfile.TemporaryDirectory() as temp:
                source=pathlib.Path(temp)/"source.wav";out=pathlib.Path(temp)/"out.wav"
                def create(samples):
                    with wave.open(str(source),"wb") as wav:
                        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(22050);wav.writeframes(bytes(samples*2))
                create(160)
                payload=bytes(range(16));m.hide(str(source),str(out),payload)
                self.assertEqual(m.extract(str(out)),payload)
                with self.assertRaises(ValueError):m.hide(str(source),str(out),bytes(17))
                create(8)
                with self.assertRaises(ValueError):m.extract(str(source))
