# مختبر التشفير وإخفاء البيانات (Crypto & Stego Lab)

مشروع تعليمي متقدم لمرحلة الماجستير يطبق خوارزميات التشفير المتناظر (كتل وتدفق) من الصفر (Pure Python) وباستخدام المكتبات المعيارية (PyCryptodome و gostcrypto)، مع إخفاء النص المشفر داخل الصور (BMP 24-bit) والصوت (WAV 16-bit PCM) عبر تقنية LSB (Least Significant Bit).

الموقع التفاعلي المباشر: [https://dyahunter35.github.io/cripted/](https://dyahunter35.github.io/cripted/)

---

## الخوارزميات المشمولة (9 خوارزميات)

1. **DES (Data Encryption Standard - FIPS 46-3):** شبكة فيستل كلاسيكية من 16 دورة، كتلة 64 بت ومفتاح 56 بت.
2. **AES (Advanced Encryption Standard - FIPS 197):** معيار ريندال السيادي، شبكة استبدال وتبديل (SPN) وحسابات حقول غالوا GF(2^8).
3. **IDEA (International Data Encryption Algorithm):** ابتكار لاي وماسي بخلط 3 زمر جبرية متعارضة (XOR، جمع mod 2^16، وضرب mod 65537) مع 52 مفتاحاً فرعياً.
4. **GOST Magma (GOST R 34.12-2015):** المعيار الروسي، شبكة فيستل 32 دورة مع مفتاح 256 بت و 8 صناديق S-box.
5. **RC4 (ARC4 & RC4-drop):** التشفير التدفقي الشهير مع خوارزميتي KSA و PRGA ونسخة drop768.
6. **RC5 (RC5-32/12/16):** التشفير القائم على الدوران المعتمد على البيانات والثوابت السحرية e و phi.
7. **RC6 (RC6-32/20/16):** المتأهلة لنهائيات AES، تعتمد 4 مسجلات ودالة تربيعية غير خطية مع 20 دورة.
8. **CAST-128 (CAST5 - RFC 2144):** شبكة فيستل من 16 دورة مع 3 دوال دورية وصناديق تعويض متباينة.
9. **Blowfish (Bruce Schneier 1993):** شبكة فيستل 16 دورة ذات صناديق تعويض معتمدة على المفتاح مشتقة من أرقام النسبة الثابتة pi.

---

## تثبيت المكتبات (Installation)

```bash
python3 -m pip install --upgrade pip
python3 -m pip install pycryptodome Pillow gostcrypto
```

للتحقق من سلامة التثبيت:
```bash
python3 -c "import Crypto, PIL, gostcrypto; print('All libraries verified successfully!')"
```

---

## هيكل المجلدات

```
cripted/
├── des/        # كود DES من الصفر والمكتبات + الإخفاء
├── aes/        # كود AES-128 من الصفر (Galois Field GF(2^8)) والمكتبات + الإخفاء
├── idea/       # كود IDEA من الصفر (Mixed Algebraic Groups) والمكتبات + الإخفاء
├── gost/       # كود GOST Magma من الصفر والمكتبات + الإخفاء
├── rc4/        # كود RC4 و RC4-drop من الصفر والمكتبات + الإخفاء
├── rc5/        # كود RC5 من الصفر والمكتبات + الإخفاء
├── rc6/        # كود RC6 من الصفر والمكتبات + الإخفاء
├── cast/       # كود CAST-128 والمكتبات + الإخفاء
├── blowfish/   # كود Blowfish والمكتبات + الإخفاء
├── docs/       # صفحات الويب التفاعلية (GitHub Pages) وحزم التحميل ZIP
└── requirements.txt
```

---

## أوامر التشغيل التجريبية (Demo Execution)

```bash
# AES (من الصفر وبالمكتبة)
python3 aes/aes_manual.py demo
python3 aes/aes_libs.py demo

# IDEA (من الصفر)
python3 idea/idea_manual.py demo

# Blowfish
python3 blowfish/blowfish_libs.py demo

# DES
python3 des/des_manual.py
python3 des/des_libs.py demo

# GOST
python3 gost/gost_manual.py demo

# RC4 / RC5 / RC6 / CAST
python3 rc4/rc4_manual.py demo
python3 rc5/rc5_manual.py demo
python3 rc6/rc6_manual.py demo
python3 cast/cast_libs.py demo
```

---

## أوامر إخفاء واسترجاع البيانات (Steganography CLI)

في أي مجلد خوارزمية (مثل `aes/` أو `idea/`):
```bash
# إخفاء نص مشفر داخل صورة BMP
python3 aes_manual.py image-hide sample.bmp secret.bmp "نص سري للغاية" --key mypassword

# استخراج وفك تشفير النص من الصورة
python3 aes_manual.py image-show secret.bmp --key mypassword

# إخفاء نص مشفر داخل ملف صوتي WAV
python3 aes_manual.py audio-hide sample.wav secret.wav "نص سري للغاية" --key mypassword

# استخراج وفك تشفير النص من ملف الصوت
python3 aes_manual.py audio-show secret.wav --key mypassword
```
