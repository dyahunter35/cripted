# مختبر التشفير وإخفاء البيانات (Crypto & Stego Lab)

منصة أكاديمية وتطبيقية تفاعلية شاملة لمقرر التعمية وتأمين البيانات لمرحلة الماجستير.
تجمع المنصة بين التطبيق البرمجي المتكامل لخوارزميات التشفير المتناظر (كتل وتدفق) من الصفر (Pure Python) وبالمكتبات المعيارية، مع تقنيات إخفاء البيانات السرية (Steganography) بالوسائط المتعددة (الصور الرقمية BMP والصوتيات WAV)، وتوفر واجهة ويب تفاعلية فائقة السرعة مع حزم تنزيل برمجية مباشرة لكل خوارزمية.

🌐 **رابط المنصة التفاعلية المباشر:** [https://dyahunter35.github.io/cripted/](https://dyahunter35.github.io/cripted/)

---

## تصنيف الخوارزميات (التصنيف الأكاديمي)

تم تنظيم الخوارزميات بدقة إلى فئتين لتسهيل المراجعة الأكاديمية والتقييم:

### 🏛️ الفئة الأولى: خوارزميات المنهج الأساسية (Core Curriculum)
الخوارزميات القياسية الإلزامية المعتمدة في خطة المقرر الدراسي:

1. **DES (Data Encryption Standard - FIPS 46-3):**
   - شبكة فيستل (Feistel) كلاسيكية مكونة من 16 دورة.
   - كتلة 64 بت، مفتاح 56 بت فعلي، وجداول التبديل الثابتة $IP, PC_1, PC_2, E, P$.
   - المسار: `des/des_manual.py` و `des/des_libs.py`.
2. **AES (Advanced Encryption Standard - FIPS 197):**
   - شبكة استبدال وتبديل (SPN Matrix) تعتمد حسابات حقول غالوا المنتهية $GF(2^8)$.
   - كتلة 128 بت، مفتاح 128 بت، و 10 دورات تشمل التحويلات الأربعة: SubBytes, ShiftRows, MixColumns, AddRoundKey.
   - تم توليد صندوق S-Box جبرياً من الصفر بدون جداول ثابتة عبر المعكوس الضربي $a^{254} \pmod{m(x)}$ والتحويل الأفيني.
   - المسار: `aes/aes_manual.py` و `aes/aes_libs.py`.
3. **RC5 (Rivest Cipher 5 - RC5-32/12/16):**
   - المعمارية المرنة المعتمدة على الدوران المعتمد على البيانات (Data-Dependent Rotations).
   - كتلة 64 بت (مسجلين $A$ و $B$)، مفتاح 128 بت، 12 دورة، وثوابت سحرية مشتقة من العدد النيبيري $e$ والنسبة الذهبية $\phi$.
   - المسار: `rc5/rc5_manual.py` و `rc5/rc5_libs.py`.
4. **IDEA (International Data Encryption Algorithm - Lai & Massey):**
   - الابتكار الرياضي القائم على دمج ثلاث زمر جبرية متعارضة ($\text{XOR}$ الثنائي، والجمع $\pmod{2^{16}}$، والضرب النمطي بعدد فيرما الأولي $\pmod{65537}$).
   - كتلة 64 بت، مفتاح 128 بت، 8.5 دورة (52 مفتاحاً فرعياً ومعكوساتها الجبرية لفك التشفير).
   - المسار: `idea/idea_manual.py` و `idea/idea_libs.py`.
5. **GOST Magma (GOST R 34.12-2015 / GOST 28147-89):**
   - المعيار الروسي الوطني القائم على شبكة فيستل ذات 32 دورة ومفتاح ضخم 256 بت مع 8 صناديق تعويض S-boxes.
   - المسار: `gost/gost_manual.py` و `gost/gost_libs.py`.

---

### ⚡ الفئة الثانية: خوارزميات التشفير الإضافية والمتقدمة (Additional Ciphers)
خوارزميات نوعية مضافة لتوسيع آفاق الدراسة المقارنة والتحليل الأمني:

6. **RC4 (ARC4 & RC4-drop):**
   - أشهر خوارزمية تشفير تدفقي (Stream Cipher) مع خوارزميتي تهيئة المفتاح KSA وتوليد المفاتيح PRGA، مع دعم نسخة RC4-drop768 لإلغاء الانحياز الإحصائي الأولي.
   - المسار: `rc4/rc4_manual.py` و `rc4/rc4_libs.py`.
7. **RC6 (RC6-32/20/16 - AES Finalist):**
   - المتأهلة لنهائيات مسابقة AES العالمية؛ تعتمد 4 مسجلات تشغيل، وعمليات الضرب النمطي والدوال التربيعية اللاخطية $f(x) = x(2x+1) \lll 5$ عبر 20 دورة.
   - المسار: `rc6/rc6_manual.py` و `rc6/rc6_libs.py`.
8. **CAST-128 (CAST5 - RFC 2144):**
   - خوارزمية كتل من 16 دورة فيستل، تعتمد 3 دوال دورية متباينة، واعتمدت افتراضياً في إصدارات PGP و GPG.
   - المسار: `cast/cast_manual.py` و `cast/cast_libs.py`.
9. **Blowfish (Bruce Schneier, 1993):**
   - خوارزمية فيستل سريعة ومفتوحة المصدر بكتلة 64 بت وصناديق تعويض معتمدة كلياً على المفتاح السري، مشتقة من الأرقام الكسرية لثابت النسبة $\pi$.
   - المسار: `blowfish/blowfish_manual.py` و `blowfish/blowfish_libs.py`.

---

## تقنية إخفاء البيانات (Steganography - LSB)

تحتوي جميع مجلدات الخوارزميات التسعة على تطبيق مستقل لتقنية إخفاء النصوص المشفرة:
- **في الصور الرقمية:** استبدال البت الأقل وزناً (LSB) في القنوات اللونية لملفات BMP 24-bit غير المضغوطة دون أي تشوه مرئي.
- **في الملفات الصوتية:** استبدال البت الأقل وزناً في عينات الصوت لملفات WAV (16-bit PCM mono/stereo) دون أي أثر سمعي.
- **ترويسة التحكم (Header):** إضافة 4 بايتات (32-bit Big-Endian) في بداية البث لحفظ طول الرسالة المشفرة بدقة، مما يتيح استخراجها بالكامل وعزلها عن نفايات الملف الحامل.

---

## تثبيت البيئة والمتطلبات (Installation)

```bash
# ترقية مدير الحزم
python3 -m pip install --upgrade pip

# تثبيت مكتبات التشفير والوسائط (PyCryptodome, Pillow, gostcrypto)
python3 -m pip install pycryptodome Pillow gostcrypto
```

للتحقق من سلامة البيئة:
```bash
python3 -c "import Crypto, PIL, gostcrypto; print('All libraries verified successfully!')"
```

---

## تشغيل العروض التجريبية (Demo Runs)

### 1. تشغيل خوارزميات المنهج الأساسية:
```bash
# تشغيل DES
python3 des/des_manual.py
python3 des/des_libs.py demo

# تشغيل AES (تطبيق يدوي بحسابات حقل غالوا ومكتبات)
python3 aes/aes_manual.py demo
python3 aes/aes_libs.py demo

# تشغيل RC5
python3 rc5/rc5_manual.py demo
python3 rc5/rc5_libs.py demo

# تشغيل IDEA (الزمر الجبرية الثلاث)
python3 idea/idea_manual.py demo
python3 idea/idea_libs.py demo

# تشغيل GOST Magma
python3 gost/gost_manual.py demo
python3 gost/gost_libs.py demo
```

### 2. تشغيل الخوارزميات الإضافية:
```bash
# تشغيل RC4
python3 rc4/rc4_manual.py demo
python3 rc4/rc4_libs.py demo

# تشغيل RC6
python3 rc6/rc6_manual.py demo
python3 rc6/rc6_libs.py demo

# تشغيل CAST-128
python3 cast/cast_libs.py demo

# تشغيل Blowfish
python3 blowfish/blowfish_libs.py demo
```

---

## أوامر إخفاء واستخراج البيانات (Steganography CLI)

يمكن تشغيل عمليات الإخفاء والاستخراج في أي خوارزمية (مثال باستخدام `aes_manual.py` أو `idea_manual.py`):

```bash
# إخفاء نص مشفر داخل صورة BMP
python3 aes/aes_manual.py image-hide sample.bmp secret.bmp "نص الماجستير السري" --key Pass@2026

# قراءة النص المخفي من الصورة وفك تشفيره
python3 aes/aes_manual.py image-show secret.bmp --key Pass@2026

# إخفاء نص مشفر داخل صوت WAV
python3 aes/aes_manual.py audio-hide sample.wav secret.wav "تسجيل بيانات سرية" --key Pass@2026

# قراءة النص المخفي من الصوت وفك تشفيره
python3 aes/aes_manual.py audio-show secret.wav --key Pass@2026
```

---

## تحسينات الأداء والسرعة (Speed & Performance Optimizations)

تم تحسين الموقع والصفحات التفاعلية بالكامل لضمان سرعة تصفح فائقة:
1. **إلغاء الحظر الشبكي للخطوط:** إزالة استدعاءات `@import` الثقيلة داخل ملف CSS واستبدالها بتحميل غير معطل (Non-blocking Preconnect) مع خطوط النظام البديلة الفورية.
2. **تسريع التصيير وإلغاء بطء التمرير:** إزالة خاصية `background-attachment: fixed` ومرشحات `backdrop-filter: blur(...)` التي كانت تستهلك معالجة كرت الشاشة (GPU Repaint)، واستبدالها بخلفيات داكنة مصمتة ذات تباين عالي و 120 FPS.
3. **تنظيم التصفح حسب الفئات:** تقسيم شريط التنقل العلوي والجداول وحزم التحميل إلى فئتي الأساسيات والإضافيات لتيسير الوصول دون إرباك.
4. **توفير حزم ZIP خفيفة:** تم ضغط الكود المصدري لكل خوارزمية مستقلاً لتنزيله بضغطة زر واحدة دون أي تأخير.
