# تشفير + إخفاء (Steganography) — DES و GOST

مشروع تعليمي (Python) يطبق خوارزميات تشفير block ciphers (DES, GOST/Magma) من الصفر
وأيضاً باستخدام مكتبات جاهزة، مع إخفاء النص المشفر داخل صورة (BMP) أو صوت (WAV) عبر LSB.

> ⚠️ DES (56-bit) قديمة وغير آمنة. GOST/Magma (256-bit) أقوى. للمحاكاة/التعليم.

## تثبيت المكتبات (Install)
```bash
# Python 3.8+
python3 -m pip install --upgrade pip

# DES (libs) + CAST (libs)
python3 -m pip install pycryptodome Pillow

# GOST (libs)
python3 -m pip install gostcrypto

# (اختياري) تحقق
python3 -c "import Crypto, PIL, gostcrypto; print('OK')"
```

## الهيكل
```
cripted/
├── des/
│   ├── des_manual.py   # DES من الصفر (بدون مكتبات)
│   ├── des_libs.py     # DES + stego باستخدام pycryptodome + Pillow
│   ├── stego_image.py
│   └── stego_audio.py
├── gost/
│   ├── gost_manual.py  # GOST/Magma من الصفر
│   ├── gost_libs.py    # GOST/Magma باستخدام gostcrypto
│   ├── stego_image.py
│   └── stego_audio.py
├── rc4/
│   ├── rc4_manual.py   # RC4 من الصفر
│   ├── rc4_libs.py     # RC4 باستخدام pycryptodome
│   ├── stego_image.py
│   └── stego_audio.py
├── cast/
│   ├── cast_manual.py  # CAST-128 (wrapper over libs)
│   ├── cast_libs.py    # CAST-128 باستخدام pycryptodome
│   ├── stego_image.py
│   └── stego_audio.py
└── README.md
```

## تشغيل DES
```bash
cd des
python3 des_libs.py demo
python3 des_libs.py image-hide in.bmp out.bmp "نص سري" --key mypass
python3 des_libs.py image-show out.bmp --key mypass
python3 des_libs.py audio-hide in.wav out.wav "نص صوتي" --key mypass
python3 des_libs.py audio-show out.wav --key mypass
```
للتحقق من DES من الصفر:
```bash
cd des
python3 -c "import des_manual as d; print(d.encrypt_block(bytes.fromhex('0123456789ABCDEF'), bytes.fromhex('133457799BBCDFF1')).hex())"
# 85e813540f0ab405
```

## تشغيل GOST (Magma)
```bash
cd gost
python3 gost_manual.py demo
python3 gost_libs.py demo
```

## تشغيل RC4
```bash
cd rc4
python3 rc4_manual.py demo
python3 rc4_libs.py demo
```

## تشغيل CAST-128
```bash
cd cast
python3 cast_libs.py demo
```

## ملاحظات
- DES manual == des_libs (تم التحقق مقابل pycryptodome).
- GOST manual == gost_libs (تم التحقق مقابل gostcrypto).
- صيغ مدعومة: BMP 24-bit غير مضغوط، WAV 16-bit PCM.
- Padding: PKCS#7.
