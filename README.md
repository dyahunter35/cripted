# مختبر التشفير وإخفاء البيانات (Crypto & Stego Lab)
### Academic Developer Workspace for Cryptography & Steganography

منصة أكاديمية وتطبيقية تفاعلية شاملة لمقرر التعمية وتأمين البيانات لمرحلة الماجستير.
تجمع المنصة بين التطبيق البرمجي المتكامل لـ 9 خوارزميات تشفير متناظر (كتل وتدفق) من الصفر (Pure Python) وبالمكتبات المعيارية، مع تقنيات إخفاء البيانات السرية (Steganography) بالوسائط المتعددة (الصور الرقمية BMP والصوتيات WAV)، وتوفر واجهة ويب تفاعلية حديثة مبنية بـ **Next.js (App Router)**، ونظام مساحة عمل برمجية متكاملة (`CodeWorkspace`)، وبودكاست تعليمي حواري مع ميزة **Zero-Bandwidth Audio Loading** (0 KB عند الفتح).

🌐 **رابط المنصة التفاعلية المباشر:** [https://dyahunter35.github.io/cripted/](https://dyahunter35.github.io/cripted/)

---

## بنية المشروع والتقنيات المستخدمة

- **Next.js App Router (v15+) + TypeScript**: هيكل الصفحات الثابتة والتوجيه السريع.
- **Tailwind CSS + shadcn/ui Design Tokens**: تصميم Academic Developer Dashboard هادئ ومتطور.
- **next-themes**: دعم الوضع الليلي والنهاري والتلقائي بدون وميض (Zero-flash theme toggle).
- **KaTeX**: تصيير المعادلات والتحويلات الرياضية لحقول غالوا والزمر الجبرية بدون حظر شبكي.
- **CodeWorkspace**: مساحة عمل برمجية تفاعلية بتبويبات عمودية، تلوين الأكواد، ترقيم الأسطر، البحث المباشر، النسخ، والتنزيل، ووضع ملء الشاشة.
- **Zero-Bandwidth Podcast Player**: بودكاست تعليمي حواري لكل خوارزمية باستهلاك بيانات 0 KB عند فتح الصفحة؛ لا يتم تعيين `src` ولا يبدأ التحميل إلا بعد النقر الصريح على زر التشغيل.
- **GitHub Pages Static Export**: تصدير الموقع بالكامل كملفات ثابتة فائقة السرعة مع مسار `/cripted`.

---

## تصنيف الخوارزميات (التصنيف الأكاديمي)

### 🏛️ الفئة الأولى: خوارزميات المنهج الأساسية (Core Curriculum)
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
- **في الملفات الصوتية:** استبدال البت الأقل وزناً في عينات الصوت لملفات WAV (16-bit PCM) دون أي أثر سمعي.
- **ترويسة التحكم (Header):** إضافة 4 بايتات (32-bit Big-Endian) في بداية البث لحفظ طول الرسالة بدقة ومنع قراءة نفايات الملف الحامل.

---

## تشغيل واختبار المشروع

### 1. بيئة الويب وتطوير Next.js:
```bash
# تثبيت حزم Node.js
npm install

# تشغيل خادم التطوير المحلي
npm run dev

# بناء وتصدير الموقع الثابت لـ GitHub Pages
npm run build
```

### 2. بيئة بايثون واختبارات الخوارزميات:
```bash
# تثبيت المتطلبات
pip install -r requirements.txt

# تشغيل مجموعة الاختبارات الشاملة (9 خوارزميات + إخفاء البيانات)
python3 -m unittest discover -s tests
```

### 3. تشغيل العروض التجريبية المباشرة (Demo CLI):
```bash
python3 aes/aes_manual.py demo
python3 des/des_manual.py demo
python3 rc5/rc5_manual.py demo
python3 idea/idea_manual.py demo
python3 gost/gost_manual.py demo
python3 rc4/rc4_manual.py demo
python3 rc6/rc6_manual.py demo
python3 cast/cast_libs.py demo
python3 blowfish/blowfish_manual.py demo
```

### 4. توليد البودكاست باستخدام Gemini (اختياري / Offline Generator):
```bash
# إضافة مفتاح GEMINI_API_KEY داخل .env.local
npm run generate-podcasts
```

---

## رخصة المشروع

المشروع مفتوح المصدر ومتاح للأغراض الأكاديمية والتعليمية والبحثية بموجب ترخيص MIT License.
جميع الأكواد المرجعية تم التحقق من سلامتها وتطابقها الكامل مع المتجهات القياسية (Standard Reference Vectors).
