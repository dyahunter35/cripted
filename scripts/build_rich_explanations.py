#!/usr/bin/env python3
"""Build comprehensive multi-tab code explanations for all 9 ciphers and steganography."""

import json
import os

SHARED_STEGO_IMAGE = [
    {
        "id": "stego-img-1",
        "role": "التحقق من ترويسة ملف BMP وسحب البكسلات الخام",
        "category": "stego",
        "badge": "BMP Header / 24-bit Raw Pixels",
        "inputs": "path (str): مسار ملف الصورة الحاملة BMP",
        "outputs": "width, height, pixel_offset, row_size, pixels (bytearray)",
        "snippet": "with open(path, \"rb\") as f:\n    data = f.read()\nif data[:2] != b\"BM\":\n    raise ValueError(\"not a BMP file\")\npixel_offset = struct.unpack_from(\"<I\", data, 10)[0]\nwidth = struct.unpack_from(\"<i\", data, 18)[0]\nheight = struct.unpack_from(\"<i\", data, 22)[0]\nbpp = struct.unpack_from(\"<H\", data, 28)[0]\nif bpp != 24:\n    raise ValueError(\"only uncompressed 24-bit BMP is supported\")",
        "explanation": "قراءة ترويسة ملف BMP واستخراج إحداثيات الصورة وموقع بيانات البكسلات الفعلي في الذاكرة مع التحقق من معيار 24 بت.",
        "htmlExplanation": "<strong>التحقق من ترويسة ملف BMP:</strong> قراءة أول بايتين للتحقق من التوقيع السحري <code>BM</code>، ثم استخراج إزاحة البكسلات (Offset) وأبعاد الصورة والتأكد من عمق الألوان 24 بت (3 بايت لكل بكسل R,G,B).",
        "math": "\\text{Offset} = \\text{struct.unpack}('<I', \\text{data}[10:14])",
        "security": "الصور غير المضغوطة 24-bit BMP لا تطبق خوارزميات ضغط فقود (مثل JPEG)، مما يجعلها الحامل الأمثل لإخفاء البيانات دون ضياع للبتات.",
        "examTip": "في الامتحانات: تذكر أن صفوف BMP تخضع لضبط المحاذاة (Padding) لتكون مضاعفات 4 بايتات: row_size = (width * 3 + 3) & ~3."
    },
    {
        "id": "stego-img-2",
        "role": "حساب السعة التخزينية القصوى للصورة الحاملة",
        "category": "stego",
        "badge": "Payload Capacity Matrix",
        "inputs": "width, height (أبعاد الصورة بالبكسل)",
        "outputs": "السعة القصوى المتاحة بالبايت (int)",
        "snippet": "def capacity_bytes(width, height):\n    return (width * height * 3) // 8 - 4  # 4 bytes reserved for length header",
        "explanation": "حساب عدد البايتات السرية الممكن إخفاؤها في القنوات اللونية الثلاث، مع حجز 4 بايتات أولية لتخزين طول الرسالة.",
        "math": "C = \\left\\lfloor \\frac{W \\times H \\times 3}{8} \\right\\rfloor - 4 \\text{ bytes}",
        "security": "محاولة حشو بيانات تفوق السعة النظرية يؤدي إلى فيض الذاكرة (Buffer Overflow) أو إتلاف بكسلات خارج النطاق.",
        "examTip": "كل بكسل يمتلك 3 قنوات (R, G, B)، وكل قناة تستقبل بتاً واحداً في LSB، أي 3 بتات لكل بكسل."
    },
    {
        "id": "stego-img-3",
        "role": "تضمين طول الرسالة وسلسلة البتات في LSB",
        "category": "stego",
        "badge": "Bitmasking (LSB Embedding)",
        "inputs": "payload_bytes (البيانات المشفرة المراد إخفاؤها)",
        "outputs": "len(payload_bytes) عدد البايتات المضمنة بنجاح",
        "snippet": "# إضافة ترويسة الطول (4 بايتات = 32 بت)\nfull = len(payload_bytes).to_bytes(4, \"big\") + payload_bytes\nbits = []\nfor b in full:\n    for i in range(7, -1, -1):\n        bits.append((b >> i) & 1)\n\n# دمج البتات في البكسلات عبر القناع المنطقي\nfor idx, bit in enumerate(bits):\n    pixels[idx] = (pixels[idx] & 0xFE) | bit",
        "explanation": "تصفير البت الأخير في كل بايت لوني عبر عملية AND مع القناع 0xFE ثم دمج بت البيانات بواسطة عملية OR.",
        "htmlExplanation": "<strong>تضمين البتات عبر القناع المنطقي:</strong> تصفير البت الأخير (LSB) بواسطة <code>pixel & 0xFE</code> ثم دمج البت السري بواسطة <code>| bit</code>. الترويسة 4 بايت تتيح للمستخرج معرفة طول الرسالة بدقة والتوقف عند نهايتها.",
        "math": "P'_{i} = (P_i \\wedge \\text{0xFE}) \\vee B_i",
        "security": "تغيير قيمة البكسل بمقدار $\\pm 1$ في المستوى اللوني (0-255) غير ملحوظ إطلاقاً للعين المجردة البشرية (Imperceptible).",
        "examTip": "0xFE ثنائياً هي 11111110، وتستخدم لتصفير خانة الآحاد فقط مع الحفاظ على البتات السبعة الأخرى سالمة."
    },
    {
        "id": "stego-img-4",
        "role": "استخراج البيانات السرية المخفية",
        "category": "stego",
        "badge": "LSB Extraction Pipeline",
        "inputs": "input_path (مسار صورة الستيجانو الحاملة)",
        "outputs": "bytes: البيانات المشفرة الأصلية المسترجعة",
        "snippet": "# 1. قراءة الـ 32 بت الأولى لاستخراج طول الرسالة\nlength = 0\nfor i in range(32):\n    length = (length << 1) | (pixels[i] & 1)\n\n# 2. قراءة بايتات الرسالة بدقة حتى الطول المستخرج\ntotal_bits = (4 + length) * 8\nout = bytearray()\ncur = 0; bit_count = 0\nfor i in range(32, total_bits):\n    cur = (cur << 1) | (pixels[i] & 1)\n    bit_count += 1\n    if bit_count == 8:\n        out.append(cur)\n        cur = 0; bit_count = 0\nreturn bytes(out)",
        "explanation": "سحب البت الأخير من كل بايت في مصفوفة البكسلات، تجميع الـ 32 بت الأولى لتحديد الطول، ثم سحب باقي البتات وبنائها في بايتات كاملة.",
        "htmlExplanation": "<strong>استخراج البيانات المخفية:</strong> قراءة البتات الأقل أهمية بترتيب Big-Endian، استعادة عدد البايتات المضمنة أولاً، ثم استخلاص البايتات بدقة متناهية دون قراءة بقية الصورة الفارغة.",
        "math": "L = \\sum_{i=0}^{31} (P_i \\wedge 1) \\cdot 2^{31-i}",
        "security": "بدون معرفة طريقة التشفير المسبقة (مثل AES أو Blowfish)، تظهر البيانات المستخرجة كضجيج عشوائي بحت (Pseudorandom Noise).",
        "examTip": "إذا كانت قيمة الطول المستخرجة أكبر من سعة الصورة، يتم إطلاق استثناء Invalid Data للدلالة على عدم وجود رسالة مخفية."
    }
]

SHARED_STEGO_AUDIO = [
    {
        "id": "stego-aud-1",
        "role": "تحميل عينات الإشارة الصوتية 16-bit PCM WAV",
        "category": "stego",
        "badge": "WAV PCM Unpacking",
        "inputs": "path (str): مسار ملف الصوت الحامل WAV",
        "outputs": "params, samples (list of 16-bit signed ints)",
        "snippet": "with wave.open(path, \"rb\") as w:\n    params = w.getparams()\n    frames = w.readframes(w.getnframes())\nif params.sampwidth != 2:\n    raise ValueError(\"only 16-bit PCM WAV is supported\")\ncount = len(frames) // 2\nsamples = list(struct.unpack(\"<\" + \"h\" * count, frames))",
        "explanation": "فتح ملف الصوت بنظام WAV وقراءة العينات بتردد أخذ العينات وحساب عينات PCM بعرض 16 بت (2 بايت للعينة).",
        "htmlExplanation": "<strong>تحميل عينات الصوت:</strong> التحقق من أن عرض العينة 2 بايت (16-bit)، ثم فك كبس الإطارات الثنائية إلى مصفوفة أعداد صحيحة موقعة (Signed 16-bit Integers) باستخدام دالة <code>struct.unpack</code>.",
        "math": "S \\in [-32768, 32767]",
        "security": "الصوت غير المضغوط PCM يحافظ على قيم العينات بدقة رياضية مطلقة، بينما ضغط MP3 يلغي الترددات غير المسموعة فيمحو البيانات المخفية.",
        "examTip": "sampwidth = 2 يعني عينة 16-bit، وهو المعيار الصوتي في أقراص CD الصوتية (Audio CD standard 44.1kHz)."
    },
    {
        "id": "stego-aud-2",
        "role": "حساب السعة الصوتية وحجز ترويسة الطول",
        "category": "stego",
        "badge": "Acoustic Capacity Calculation",
        "inputs": "params, samples (عينات الصوت)",
        "outputs": "int: عدد البايتات المتاحة للإخفاء",
        "snippet": "def capacity_bytes(params, samples):\n    return len(samples) // 8 - 4  # 4 bytes for 32-bit length",
        "explanation": "كل عينة صوتية (Sample) تستوعب بتاً واحداً في LSB، بالتالي كل 8 عينات تستوعب بايتاً واحداً مع طرح 4 بايتات للترويسة.",
        "math": "C = \\left\\lfloor \\frac{N_{\\text{samples}}}{8} \\right\\rfloor - 4 \\text{ bytes}",
        "security": "في ملف صوتي مدته دقيقة واحدة بتردد 44.1kHz مونو، هناك 2,646,000 عينة، مما يتيح إخفاء حوالي 330 كيلوبايت من البيانات المشفرة!",
        "examTip": "معدل الإخفاء الصوتي: ثانية واحدة من صوت CD تتيح إخفاء أكثر من 5.5 كيلوبايت بأمان كامل."
    },
    {
        "id": "stego-aud-3",
        "role": "تعديل البت الأقل أهمية في العينات الصوتية",
        "category": "stego",
        "badge": "PCM Sample LSB Modification",
        "inputs": "samples (قائمة العينات), payload_bytes",
        "outputs": "ملف صوتي WAV يحمل البيانات المخفية",
        "snippet": "full = len(payload_bytes).to_bytes(4, \"big\") + payload_bytes\nbits = []\nfor b in full:\n    for i in range(7, -1, -1):\n        bits.append((b >> i) & 1)\n\nfor idx, bit in enumerate(bits):\n    samples[idx] = (samples[idx] & ~1) | bit\n\nout_frames = struct.pack(\"<\" + \"h\" * len(samples), *samples)",
        "explanation": "تصفير البت الفردي في العينة الصوتية ثم دمج بت البيانات وإعادة حزم العينات كإطارات صوتية متوافقة مع مشغلات الصوت.",
        "htmlExplanation": "<strong>تعديل العينات الصوتية:</strong> العملية <code>(samples[idx] & ~1) | bit</code> تعدل قيمة العينة الصوتية بمقدار 1 كحد أقصى من أصل 65536 مستوى ديناميكي (نسبة تغير 0.0015%)، مما يجعل الإشارة الصوتية مطابقة للمصدر أذنياً.",
        "math": "S'_{i} = (S_i \\wedge \\sim 1) \\vee B_i",
        "security": "نسبة الإشارة إلى الضجيج الناتج (SNR) تتجاوز 90dB، وهي قيمة ممتازة تمنع أي اشتباه سمعي أو طيفي.",
        "examTip": "العامل <code>~1</code> في لغة بايثون للأعداد الصحيحة 16 بت يقوم بإنشاء قناع ثنائي ينتهي بالصفر (..11111110)."
    }
]

# Write out rich multi-tab data
def main():
    with open("src/content/code_explanations.json", "r") as f:
        existing = json.load(f)

    result = {}

    # 1. AES
    result["aes"] = {
        "manual-python": [
            {
                "id": "aes-m-1",
                "role": "الضرب في حقل غالوا GF(2^8) بخوارزمية الفلاح الروسي",
                "category": "algebraic",
                "badge": "Galois Field / Modulo 0x11b",
                "inputs": "a, b (uint8): عنصرا الحقل المراد ضربهما",
                "outputs": "p (uint8): حاصل الضرب الجبري",
                "snippet": "def gf_mul(a, b):\n    p = 0\n    for _ in range(8):\n        if b & 1: p ^= a\n        hi = a & 0x80\n        a = (a << 1) & 0xff\n        if hi: a ^= 0x1b\n        b >>= 1\n    return p",
                "explanation": "تنفيذ خوارزمية الفلاح الروسي لحساب حاصل ضرب عنصرين جبريين داخل الحقل النمطي GF(2^8)، مع اختزال القيمة بـ 0x1b عند حدوث فيض في البت الثامن.",
                "htmlExplanation": "<strong>الضرب في حقل غالوا $GF(2^8)$:</strong> تنفيذ خوارزمية الفلاح الروسي لحساب حاصل ضرب عنصرين جبريين داخل الحقل النمطي، مع اختزال القيمة بـ <code>0x1b</code> عند حدوث فيض في البت الثامن.",
                "math": "a(x) \\cdot b(x) \\pmod{x^8 + x^4 + x^3 + x + 1}",
                "security": "الضرب في الحقول المنتهية يوفر خصائص جبرية لاخطية تمنع هجمات التحليل الخطي والتفاضلي على التشفير.",
                "examTip": "0x1b تمثل كثير الحدود غير القابل للاختزال $x^8 + x^4 + x^3 + x + 1$ بعد إهمال البت التاسع."
            },
            {
                "id": "aes-m-2",
                "role": "حساب المعكوس الضربي الجبري والتحويل الأفيني لصندوق S-Box",
                "category": "algebraic",
                "badge": "Affine Transform / S-Box Generation",
                "inputs": "a (uint8): بايت الدخل",
                "outputs": "SBOX[i] (uint8): بايت التعويض غير الخطي",
                "snippet": "def gf_inv(a):\n    if a == 0: return 0\n    res = 1; base = a; exp = 254\n    while exp > 0:\n        if exp & 1: res = gf_mul(res, base)\n        base = gf_mul(base, base)\n        exp >>= 1\n    return res\n\ninv = gf_inv(i)\ns = inv ^ rot(inv,1) ^ rot(inv,2) ^ rot(inv,3) ^ rot(inv,4) ^ 0x63\nSBOX[i] = s & 0xff",
                "explanation": "توليد صناديق التعويض ديناميكياً بحساب المعكوس الضربي عبر مبرهنة فيرما a^254 ثم تطبيق التحويل الأفيني الخطي مع الثابت 0x63.",
                "htmlExplanation": "<strong>المعكوس الضربي والتحويل الأفيني:</strong> حساب $a^{-1} = a^{254}$ في حقل غالوا ثم خلط البتات بعمليات دوران وجمع XOR مع <code>0x63</code> لمنع وجود أي نقاط ثابتة $S(x) \\neq x$.",
                "math": "s_i = b_i \\oplus b_{(i+4)\\bmod 8} \\oplus b_{(i+5)\\bmod 8} \\oplus b_{(i+6)\\bmod 8} \\oplus b_{(i+7)\\bmod 8} \\oplus c_i",
                "security": "هذا التحويل يحقق أعلى درجات اللاخطية (Maximum Non-Linearity) ويمثل قلب أمان معيار AES.",
                "examTip": "يتم استخدام الثابت 0x63 لضمان عدم وجود نقطة ثابتة بحيث لا يكون S(0x00) = 0x00، بل S(0x00) = 0x63."
            },
            {
                "id": "aes-m-3",
                "role": "إزاحة الصفوف دورياً (ShiftRows)",
                "category": "round",
                "badge": "Linear Permutation / Diffusion",
                "inputs": "مصفوفة الحالة State 4x4",
                "outputs": "مصفوفة الحالة بعد تدوير الصفوف",
                "snippet": "def shift_rows(s):\n    s[1] = s[1][1:] + s[1][:1]\n    s[2] = s[2][2:] + s[2][:2]\n    s[3] = s[3][3:] + s[3][:3]",
                "explanation": "تدوير صفوف مصفوفة الحالة دورياً: الصف الأول دون إزاحة، الثاني بمقدار 1 بايت، الثالث 2 بايت، والرابع 3 بايتات.",
                "htmlExplanation": "<strong>إزاحة الصفوف دورياً:</strong> بعثرة المواضع الخطية للبايتات بنقل الصف الأول خطوة واحدة، والثاني خطوتين، والثالث 3 خطوات لليسار.",
                "math": "S'_{r, c} = S_{r, (c + r) \\bmod 4}",
                "security": "يوفر الانتشار الأفقي (Diffusion) عبر خلط بايتات الأعمدة في الصفوف المختلفة.",
                "examTip": "ShiftRows لا تغير قيم البايتات على الإطلاق، بل تغير مواقعها فقط داخل مصفوفة الحالة."
            },
            {
                "id": "aes-m-4",
                "role": "خلط الأعمدة الجبري (MixColumns)",
                "category": "round",
                "badge": "MDS Matrix Multiplication",
                "inputs": "أعمدة مصفوفة الحالة",
                "outputs": "أعمدة مخلوطة جبرياً في GF(2^8)",
                "snippet": "def mix_columns(s):\n    for c in range(4):\n        a0, a1, a2, a3 = s[0][c], s[1][c], s[2][c], s[3][c]\n        s[0][c] = gf_mul(2, a0) ^ gf_mul(3, a1) ^ a2 ^ a3\n        s[1][c] = a0 ^ gf_mul(2, a1) ^ gf_mul(3, a2) ^ a3\n        s[2][c] = a0 ^ a1 ^ gf_mul(2, a2) ^ gf_mul(3, a3)\n        s[3][c] = gf_mul(3, a0) ^ a1 ^ a2 ^ gf_mul(2, a3)",
                "explanation": "ضرب كل عمود في مصفوفة الحالة بمصفوفة ثابتة معيارية داخل حقل غالوا لتحقيق أقصى درجات الانتشار بين البايتات.",
                "htmlExplanation": "<strong>خلط الأعمدة في الحقل:</strong> ضرب كل عمود بمصفوفة MDS الدائرية <code>[[2,3,1,1],[1,2,3,1],[1,1,2,3],[3,1,1,2]]</code>.",
                "math": "\\begin{bmatrix} s'_{0,c} \\\\ s'_{1,c} \\\\ s'_{2,c} \\\\ s'_{3,c} \\end{bmatrix} = \\begin{bmatrix} 2 & 3 & 1 & 1 \\\\ 1 & 2 & 3 & 1 \\\\ 1 & 1 & 2 & 3 \\\\ 3 & 1 & 1 & 2 \\end{bmatrix} \\begin{bmatrix} s_{0,c} \\\\ s_{1,c} \\\\ s_{2,c} \\\\ s_{3,c} \\end{bmatrix}",
                "security": "مصفوفة MDS تضمن أن تغيير بايت واحد في الدخل يغير جميع بايتات العمود الأربعة في الخرج (Branch Number = 5).",
                "examTip": "MixColumns تحذف تماماً في الدورة العاشرة والأخيرة (Final Round) في AES-128 لتسهيل تصميم دوائر فك التشفير."
            },
            {
                "id": "aes-m-5",
                "role": "توسيع المفتاح واشتقاق مفاتيح الدورات (Key Expansion)",
                "category": "key",
                "badge": "Key Schedule / Rcon",
                "inputs": "key_bytes (16 بايت = 128 بت)",
                "outputs": "قائمة المفاتيح الموسعة w (44 كلمة = 176 بايت)",
                "snippet": "def key_expansion(key_bytes):\n    w = [struct.unpack('>I', key_bytes[4*i:4*(i+1)])[0] for i in range(4)]\n    for i in range(4, 44):\n        temp = w[i - 1]\n        if i % 4 == 0:\n            temp = sub_word(rot_word(temp)) ^ (RCON[i // 4] << 24)\n        w.append(w[i - 4] ^ temp)\n    return w",
                "explanation": "اشتقاق 11 مفتاحاً فرعياً للدورات (كل مفتاح 128 بت) باستخدام الدوران للكلمة والتعويض بـ S-Box وثوابت الدورات Rcon.",
                "htmlExplanation": "<strong>توسيع المفتاح إلى 44 كلمة:</strong> تطبيق دالة <code>rot_word</code> ثم <code>sub_word</code> والجمع XOR مع ثابت الدورة <code>RCON</code> لتوليد مفتاح جديد لكل دورة من الدورات العشر.",
                "math": "w[i] = w[i-4] \\oplus \\text{SubWord}(\\text{RotWord}(w[i-1])) \\oplus Rcon[i/4]",
                "security": "يمنع هجمات المفاتيح الضعيفة والمتناظرة ويضمن عدم إمكانية استنتاج مفتاح الدورة السابقة بسهولة.",
                "examTip": "ثابت Rcon يحتوي على أصفار في البايتات الثلاثة الأخيرة، والبتات النشطة تكون في البايت الأكثر أهمية فقط."
            }
        ],
        "libs-python": [
            {
                "id": "aes-l-1",
                "role": "استدعاء مكتبة التشفير القياسية PyCryptodome",
                "category": "cipher",
                "badge": "Hardware AES-NI Accelerated",
                "inputs": "None",
                "outputs": "Module Import",
                "snippet": "from Crypto.Cipher import AES\nfrom Crypto.Util.Padding import pad, unpad",
                "explanation": "استيراد وحدة التشفير القياسية المكتوبة بلغة C للاستفادة من تسريع العتاد AES-NI المدمج في المعالجات الحديثة.",
                "htmlExplanation": "<strong>استيراد مكتبة PyCryptodome:</strong> توفير تنفيذ عالي الكفاءة ومكتوب بلغة C مستفيداً من تعليمات العتاد AES-NI المدمجة في المعالجات الحديثة.",
                "math": "\\text{Throughput} > 3.5 \\text{ GB/sec with AES-NI}",
                "security": "التعليمات العتادية AES-NI تحمي تماماً من هجمات قياس التوقيت (Timing Attacks) لأنها تنفذ بزمن ثابت Constant-Time.",
                "examTip": "في المشاريع الحقيقية: لا تستخدم أبداً التطبيق اليدوي في بيئة الإنتاج لخطورة هجمات القنوات الجانبية (Side-Channel)."
            },
            {
                "id": "aes-l-2",
                "role": "تطبيق حشو الكتل PKCS#7 وتشفير الكتلة",
                "category": "padding",
                "badge": "PKCS#7 / 128-bit Alignment",
                "inputs": "key (16 bytes), data (bytes)",
                "outputs": "ct (bytes): النص المشفر كاملاً",
                "snippet": "def aes_encrypt(key, data):\n    cipher = AES.new(key, AES.MODE_ECB)\n    padded_data = pad(data, AES.block_size)\n    return cipher.encrypt(padded_data)",
                "explanation": "حشو النص الصريح ليصبح من مضاعفات 16 بايت وتشفير الكتل بنمط ECB التعليمي.",
                "htmlExplanation": "<strong>حشو البيانات والتشفير:</strong> دالة <code>pad</code> تضيف بايتات بقيمة عدد البايتات الناقصة (مثال: إذا نقص بايتان يضاف <code>\\x02\\x02</code>).",
                "math": "P_{\\text{padded}} = P \\parallel (B - (|P| \\bmod B))^k",
                "security": "إذا كانت الرسالة الأصلية من مضاعفات 16 بايت تماماً، فإن حشو PKCS#7 يضيف كتلة كاملة جديدة مكونة من 16 بايت بقيمة 0x10 لمنع الالتباس.",
                "examTip": "سؤال امتحاني شهير: ماذا يحدث إذا كان طول البيانات 16 بايت بالضبط؟ الجواب: يضاف حشو كامل من 16 بايت (كتلة جديدة)."
            },
            {
                "id": "aes-l-3",
                "role": "فك التشفير وإزالة الحشو والتحقق من السلامة",
                "category": "padding",
                "badge": "Decryption & Unpadding Check",
                "inputs": "key, ciphertext (bytes)",
                "outputs": "pt (bytes): النص الصريح الأصلي",
                "snippet": "def aes_decrypt(key, ciphertext):\n    cipher = AES.new(key, AES.MODE_ECB)\n    decrypted_padded = cipher.decrypt(ciphertext)\n    return unpad(decrypted_padded, AES.block_size)",
                "explanation": "فك تشفير الكتل المشفرة ثم فحص بايتات الحشو الأخيرة وإزالتها بأمان لاسترجاع النص الأصلي الصريح.",
                "htmlExplanation": "<strong>فك التشفير والتحقق من الحشو:</strong> استرجاع البايتات الصريحة ثم التحقق من تطابق كافة بايتات الحشو مع القيمة المحددة في البايت الأخير لمنع هجمات التلاعب.",
                "math": "P = \\text{unpad}(D_K(C), 16)",
                "security": "إذا كان الحشو غير صحيح، تطلق المكتبة خطأ <code>ValueError: Padding is incorrect</code>، ويجب معالجة الخطأ بزمن ثابت لمنع Padding Oracle Attack.",
                "examTip": "هجوم Padding Oracle يستغل رسائل الخطأ المختلفة لمعرفة البايت الأخير في الكتلة وفك التشفير دون معرفة المفتاح."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 2. DES
    result["des"] = {
        "manual-python": [
            {
                "id": "des-m-1",
                "role": "جداول التبديل الأولي والنهائي (IP & FP)",
                "category": "round",
                "badge": "Bit Permutation Matrix",
                "inputs": "block (64-bit integer)",
                "outputs": "permuted_block (64-bit integer)",
                "snippet": "def permute(block, table):\n    res = 0\n    for bit in table:\n        res = (res << 1) | ((block >> (64 - bit)) & 1)\n    return res",
                "explanation": "إعادة ترتيب بتات الكتلة (64 بت) طبقاً لجداول التبديل القياسية IP والتبديل المعكوس FP المعرفة في معيار NBS.",
                "htmlExplanation": "<strong>التبديل الأولي والنهائي:</strong> إعادة ترتيب مواضع البتات فيزيائياً بدون تغيير قيمها، حيث تم تصميمها عام 1977 لتسهيل تمرير الأسلاك في دوائر العتاد الصلب.",
                "math": "\\text{FP} = \\text{IP}^{-1}",
                "security": "التبديل الأولي لا يضيف أي قوة تشفيرية إضافية ضد هجمات التحليل الرياضي، بل كان لترتيب الناقلات في المعالجات القديمة.",
                "examTip": "في الامتحانات: التبديل النهائي FP هو المعكوس الرياضي التام للتبديل الأولي IP بحيث FP(IP(x)) = x."
            },
            {
                "id": "des-m-2",
                "role": "دالة الدورات F وصناديق S-Boxes الثمانية",
                "category": "round",
                "badge": "Non-linear 6-to-4 S-Boxes",
                "inputs": "R (32-bit right half), subkey (48-bit)",
                "outputs": "output (32-bit modified value)",
                "snippet": "def f_function(r, subkey):\n    # 1. Expansion table E (32 -> 48 bits)\n    expanded = permute_48(r, EXPANSION_TABLE)\n    # 2. XOR with 48-bit subkey\n    xored = expanded ^ subkey\n    # 3. Eight 6-to-4 S-boxes\n    sbox_out = 0\n    for i in range(8):\n        chunk = (xored >> (42 - 6 * i)) & 0x3F\n        row = ((chunk & 0x20) >> 4) | (chunk & 1)\n        col = (chunk >> 1) & 0x0F\n        sbox_out = (sbox_out << 4) | SBOXES[i][row][col]\n    # 4. Permutation P (32 bits)\n    return permute_32(sbox_out, P_TABLE)",
                "explanation": "قلب خوارزمية DES: توسيع النصف الأيمن من 32 إلى 48 بتاً، خلطه مع مفتاح الدورة، تمريره عبر 8 صناديق S-box غير خطية (تحول كل 6 بتات إلى 4)، ثم تبديله بجدول P.",
                "htmlExplanation": "<strong>دالة الدورات F وصناديق التعويض:</strong> المكون الوحيد غير الخطي في DES. كل صندوق يأخذ 6 بتات (البت الأول والأخير يحددان الصف، والبتات الأربعة الوسطى تحدد العمود) ليخرج 4 بتات.",
                "math": "F(R_{i-1}, K_i) = P(S(E(R_{i-1}) \\oplus K_i))",
                "security": "صناديق S-boxes هي التي تمنح DES مقاومة ضد هجمات التحليل التفاضلي (Differential Cryptanalysis) التي اكتشفتها IBM سراً.",
                "examTip": "كيفية قراءة صندوق DES: البت رقم 1 والبت رقم 6 يعطيان رقم الصف (من 0 إلى 3)، والبتات 2,3,4,5 تعطي رقم العمود (من 0 إلى 15)."
            },
            {
                "id": "des-m-3",
                "role": "شبكة فيستل وتبادل الأنصاف (Feistel Swapping)",
                "category": "round",
                "badge": "16-Round Feistel Structure",
                "inputs": "L, R (32-bit each), 16 Subkeys",
                "outputs": "Ciphertext Block (64 bits)",
                "snippet": "for i in range(16):\n    next_l = r\n    next_r = l ^ f_function(r, subkeys[i])\n    l, r = next_l, next_r\n# Final round: no swap\nreturn (r << 32) | l",
                "explanation": "تنفيذ 16 دورة فيستل متتالية، حيث يصبح النصف الأيمن هو النصف الأيسر للدورة التالية، بينما يخضع النصف الأيمن الجديد لعملية XOR مع ناتج الدالة F.",
                "htmlExplanation": "<strong>شبكة فيستل ذات الـ 16 دورة:</strong> ميزة شبكة فيستل العبقرية أن خوارزمية فك التشفير متطابقة تماماً مع خوارزمية التشفير، ويكفي فقط عكس ترتيب المفاتيح الفرعية <code>subkeys[::-1]</code> دون الحاجة لعكس الدالة F.",
                "math": "L_i = R_{i-1}, \\quad R_i = L_{i-1} \\oplus F(R_{i-1}, K_i)",
                "security": "تكرار شبكة فيستل 16 دورة يضمن انتشار كامل للبتات (Complete Avalanche Effect) بحيث يغير بت المدخل نصف بتات المخرج.",
                "examTip": "لاحظ أن الدورة السادسة عشرة لا تتضمن تبديلاً بين L و R (Pre-output Swap) لتمكين دالة فك التشفير من العمل مباشرة."
            }
        ],
        "libs-python": [
            {
                "id": "des-l-1",
                "role": "تشفير DES باستخدام مكتبة PyCryptodome",
                "category": "cipher",
                "badge": "Legacy DES Engine",
                "inputs": "key (8 bytes = 56 effective bits), data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "from Crypto.Cipher import DES\nfrom Crypto.Util.Padding import pad, unpad\n\ncipher = DES.new(key[:8], DES.MODE_ECB)\nct = cipher.encrypt(pad(data, DES.block_size))",
                "explanation": "تهيئة كائن DES القياسي بحجم كتلة 8 بايتات (64 بت) وحشو النص الصريح طبقاً لمعيار PKCS#7.",
                "htmlExplanation": "<strong>تشفير DES بالمكتبة:</strong> استخدام المحرك المحسن في C مع مفتاح 8 بايتات ونمط Electronic Codebook (ECB).",
                "math": "C = \\text{DES}_{K}(P)",
                "security": "مفتاح DES قصير جداً (56 بت فعلي)، ويمكن كسره بالكامل في أقل من 24 ساعة باستخدام أجهزة مخصصة مثل Deep Crack.",
                "examTip": "البت الثامن في كل بايت من مفتاح DES هو بت تحقق من الفردية (Parity Bit)، ولا يساهم في أمان المفتاح الفعلي."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 3. BLOWFISH
    result["blowfish"] = {
        "manual-python": [
            {
                "id": "bf-m-1",
                "role": "مصفوفة المفاتيح P-array وصناديق S-Boxes المستقلة",
                "category": "key",
                "badge": "Key-Dependent S-Boxes / Feistel",
                "inputs": "key (1 to 56 bytes)",
                "outputs": "P-array (18 subkeys), 4 S-boxes (4x256)",
                "snippet": "def initialize_p_and_s(key):\n    # Initialize P and S with fractional digits of Pi\n    p = list(INITIAL_P)\n    s = [list(box) for box in INITIAL_S]\n    # XOR key into P-array\n    for i in range(18):\n        p[i] ^= key_words[i % len(key_words)]\n    # Encrypt all zero block repeatedly to build key-dependent S-boxes\n    l, r = 0, 0\n    for i in range(0, 18, 2):\n        l, r = bf_round(l, r, p, s)\n        p[i], p[i+1] = l, r",
                "explanation": "تهيئة مصفوفات المفاتيح P-array وصناديق S-boxes بالأرقام الكسرية للعدد باي (Pi)، ثم تشفير كتلة صفرية لتوليد صناديق معتمدة على المفتاح كلياً.",
                "htmlExplanation": "<strong>صناديق S-box المعتمدة على المفتاح:</strong> ميزة خوارزمية بروس شناير العبقرية؛ الصناديق ليست ثابتة كـ DES بل تتغير بالكامل مع كل مفتاح سري جديد عبر 521 عملية تشفير أولية.",
                "math": "P_i = P_i \\oplus K_i, \\quad S_{i, j} = E_K(0)",
                "security": "الاعتماد على المفتاح في توليد الصناديق يمنع تماماً هجمات التحليل الخطي والتفاضلي الموجهة للصناديق الثابتة.",
                "examTip": "تكلفة تهيئة المفتاح (Key Setup) في Blowfish باهظة وتتطلب 521 تشفيراً، مما يجعلها ممتازة لحماية كلمات المرور (bcrypt)."
            },
            {
                "id": "bf-m-2",
                "role": "دالة الدورات F في Blowfish (الجمع والـ XOR)",
                "category": "round",
                "badge": "ARX-like 32-bit F Function",
                "inputs": "x (32-bit half block)",
                "outputs": "y (32-bit mixed value)",
                "snippet": "def f_function(x, s):\n    a = (x >> 24) & 0xff\n    b = (x >> 16) & 0xff\n    c = (x >> 8) & 0xff\n    d = x & 0xff\n    res = ((s[0][a] + s[1][b]) ^ s[2][c]) + s[3][d]\n    return res & 0xffffffff",
                "explanation": "تقسيم الكلمة 32 بت إلى 4 بايتات (a, b, c, d)، استخراج القيم من الصناديق الأربعة، وخلطها بالجمع النمطي Modulo 2^32 وعملية XOR.",
                "htmlExplanation": "<strong>دالة الدورات الفائقة F:</strong> دمج عمليتي الجمع والـ XOR المتعارضتين جبرياً <code>((S1 + S2) ^ S3) + S4</code>، مما يحقق خلطاً سريعاً جداً في دورة معالج واحدة.",
                "math": "F(x) = \\left( (S_1[a] + S_2[b] \\bmod 2^{32}) \\oplus S_3[c] \\right) + S_4[d] \\bmod 2^{32}",
                "security": "التعارض الجبري بين الجمع الحسابي والـ XOR يمنع تشكيل معادلات خطية جبرية لكسر الخوارزمية.",
                "examTip": "تذكر ترتيب العمليات في Blowfish: جمع الصندوقين الأولين، ثم XOR مع الثالث، ثم جمع مع الرابع."
            }
        ],
        "libs-python": [
            {
                "id": "bf-l-1",
                "role": "تشفير Blowfish عبر PyCryptodome",
                "category": "cipher",
                "badge": "PyCryptodome Blowfish Engine",
                "inputs": "key, data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "from Crypto.Cipher import Blowfish\nfrom Crypto.Util.Padding import pad, unpad\n\ncipher = Blowfish.new(key, Blowfish.MODE_ECB)\nreturn cipher.encrypt(pad(data, Blowfish.block_size))",
                "explanation": "تشفير البيانات بكتل 64 بت باستخدام مكتبة PyCryptodome السريعة مع حشو PKCS#7.",
                "htmlExplanation": "<strong>التشفير بالمكتبة:</strong> توظيف محرك فيستل المحسن المكتوب بلغة C بأداء يتجاوز التطبيق اليدوي بعشرات المرات.",
                "math": "C = \\text{Blowfish}_K(P)",
                "security": "حجم كتلة Blowfish هو 64 بت فقط، مما يجعله عرضة لهجمات Sweet32 عند تشفير كميات ضخمة من البيانات في نفس الجلسة.",
                "examTip": "سؤال امتحان: ما هو العيب الأمني الأكبر في Blowfish؟ الجواب: حجم الكتلة 64 بت المعرض لهجمات Sweet32 Birthday Attack."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 4. CAST-128
    result["cast"] = {
        "manual-python": [
            {
                "id": "cast-m-1",
                "role": "الدورات الـ 16 المتناوبة بأنواعها الثلاثة",
                "category": "round",
                "badge": "Alternating Feistel Rounds (RFC 2144)",
                "inputs": "L, R (32-bit halves), subkeys",
                "outputs": "Ciphertext (64 bits)",
                "snippet": "def cast_round(l, r, km, kr, round_type):\n    if round_type == 1:\n        # Type 1: I = ((Km + D) <<< Kr)\n        f = ((km + r) & 0xffffffff)\n        f = rotl32(f, kr)\n        f = ((S1[f >> 24] ^ S2[(f >> 16) & 0xff]) - S3[(f >> 8) & 0xff]) + S4[f & 0xff]\n    elif round_type == 2:\n        # Type 2: I = ((Km ^ D) <<< Kr)\n        f = (km ^ r)\n        f = rotl32(f, kr)\n        f = ((S1[f >> 24] - S2[(f >> 16) & 0xff]) + S3[(f >> 8) & 0xff]) ^ S4[f & 0xff]\n    # Type 3: I = ((Km - D) <<< Kr)\n    return r, l ^ (f & 0xffffffff)",
                "explanation": "تنفيذ دورات CAST-128 الست عشرة التي تتناوب بين ثلاثة أنواع مختلفة من دوال الدورات لمنع الهجمات المتماثلة.",
                "htmlExplanation": "<strong>الدورات الثلاث المتناوبة في CAST:</strong> ميزة RFC 2144؛ تبديل العمليات الحسابية (الجمع، الطرح، الـ XOR) بين الدورات، مما يحقق مناعة غير مسبوقة ضد هجمات التحليل التفاضلي.",
                "math": "\\text{Round 1: } (S_1 \\oplus S_2 - S_3) + S_4, \\quad \\text{Round 2: } (S_1 - S_2 + S_3) \\oplus S_4",
                "security": "التناوب بين العمليات يكسر أي تناظر في الخوارزمية ويمنع هجمات Slide Attacks و Reflection Attacks.",
                "examTip": "تستخدم CAST-128 نوعين من المفاتيح الفرعية في كل دورة: مفتاح حجب Km (Masking Key) ومفتاح دوران Kr (Rotation Key)."
            }
        ],
        "libs-python": [
            {
                "id": "cast-l-1",
                "role": "استدعاء CAST-128 القياسي بمكتبة PyCryptodome",
                "category": "cipher",
                "badge": "CAST5 (RFC 2144) Standard",
                "inputs": "key (16 bytes = 128 bits), data (bytes)",
                "outputs": "ct (bytes)",
                "snippet": "from Crypto.Cipher import CAST\n\ncipher = CAST.new(key, CAST.MODE_ECB)\npad_len = 8 - (len(data) % 8 or 8)\ndata = data + bytes([pad_len]) * pad_len\nreturn cipher.encrypt(data)",
                "explanation": "استخدام خوارزمية CAST5 المعتمدة كمعيار افتراضي في إصدارات PGP الكلاسيكية.",
                "htmlExplanation": "<strong>محرك CAST5 الرسمي:</strong> تشفير كتل 64 بت بمفتاح كامل 128 بت يحقق 16 دورة فيستل كاملة.",
                "math": "C = \\text{CAST5}_K(P)",
                "security": "معتمدة من الحكومة الكندية وموثقة في RFC 2144 بدون أي حقوق ملكية أو رسوم ترخيص.",
                "examTip": "CAST-128 كانت الخوارزمية الافتراضية في أداة PGP الشهيرة لتشفير رسائل البريد الإلكتروني."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 5. GOST (Magma)
    result["gost"] = {
        "manual-python": [
            {
                "id": "gost-m-1",
                "role": "دالة الدورة g وصناديق S-Boxes الثمانية الروسية",
                "category": "round",
                "badge": "GOST 28147-89 / Magma Round",
                "inputs": "a (32-bit right half), k (32-bit subkey)",
                "outputs": "transformed value (32-bit)",
                "snippet": "def gost_round(a, k):\n    # 1. Modular addition (a + k) mod 2^32\n    s = (a + k) & 0xffffffff\n    # 2. Eight 4-to-4 S-boxes\n    out = 0\n    for i in range(8):\n        nibble = (s >> (4 * i)) & 0x0f\n        out |= (GOST_SBOXES[i][nibble] << (4 * i))\n    # 3. 11-bit cyclic left rotation\n    return ((out << 11) & 0xffffffff) | (out >> 21)",
                "explanation": "جمع النصف الأيمن مع المفتاح نمطياً Modulo 2^32، تعويض كل نيبل (4 بت) بصناديق S-boxes، ثم تدوير الناتج دورياً بمقدار 11 بتاً لليسار.",
                "htmlExplanation": "<strong>دالة التحويل الروسية $g(a, k)$:</strong> البساطة والقوة الهندسية المعمارية؛ جمع نمطي بدون فحص فيض، 8 صناديق S-box متوازية، ودوران دوراني ثابت 11 بتاً لنشر التأثير.",
                "math": "g(a, k) = ((S(a + k \\bmod 2^{32})) \\lll 11)",
                "security": "الدوران بـ 11 بتاً هو عدد أولي نسبياً مع 32، مما يضمن خلط جميع مواضع البتات بعد عدد قليل من الدورات.",
                "examTip": "في المعيار السوفيتي GOST، عدد الدورات هو 32 دورة كاملة (ضعف عدد دورات DES)، مما يمنحه مناعة فائقة ضد كسر المفتاح."
            },
            {
                "id": "gost-m-2",
                "role": "جدول الـ 32 دورة ونظام استدعاء المفاتيح",
                "category": "key",
                "badge": "32 Rounds Key Schedule",
                "inputs": "key (256 bits = 8 words of 32 bits)",
                "outputs": "Subkeys order for 32 rounds",
                "snippet": "def get_subkey(key_words, round_idx):\n    if round_idx < 24:\n        # First 24 rounds: K0..K7 three times\n        return key_words[round_idx % 8]\n    else:\n        # Last 8 rounds: K7..K0 in reverse order\n        return key_words[7 - (round_idx % 8)]",
                "explanation": "استدعاء كلمات المفتاح الثمانية بالتوالي ثلاث مرات في الدورات الـ 24 الأولى، ثم استدعاؤها بترتيب معكوس في الدورات الثمانية الأخيرة.",
                "htmlExplanation": "<strong>جدول المفاتيح في GOST:</strong> استخدام المفاتيح الثمانية بشكل دوري K0 إلى K7 ثم عكس الترتيب في الدورات الأخيرة. هذا الترتيب يتيح لفك التشفير أن يتم ببساطة عبر عكس المفاتيح.",
                "math": "K_{\\text{order}} = [K_0..K_7, K_0..K_7, K_0..K_7, K_7..K_0]",
                "security": "طول المفتاح 256 بت كاملة، مما يوفر فضاء مفاتيح هائل 2^256 يستحيل فحصه بالقوة العمياء حتى مع الحواسيب الكمومية.",
                "examTip": "عدد دورات GOST هو 32 دورة، بينما DES هو 16 دورة و AES-128 هو 10 دورات."
            }
        ],
        "libs-python": [
            {
                "id": "gost-l-1",
                "role": "تشفير GOST Magma عبر مكتبة gostcrypto",
                "category": "cipher",
                "badge": "GOST R 34.12-2015 Magma Engine",
                "inputs": "key (32 bytes), data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "from gostcrypto import gostcipher\n\ncipher = gostcipher.new('magma', key, gostcipher.MODE_ECB)\nreturn cipher.encrypt(pad(data))",
                "explanation": "استخدام مكتبة gostcrypto الروسية الرسمية لتشفير كتل 64 بت بمفتاح 256 بت وفق أحدث المعايير الفيدرالية.",
                "htmlExplanation": "<strong>معيار ماجما Magma الرسمي:</strong> التشفير بنمط ECB مع الحشو القياسي GOST R 34.12-2015.",
                "math": "C = \\text{Magma}_{K}(P)",
                "security": "معتمد رسمياً في روسيا الاتحادية والدول المستقلة للاتصالات الحكومية والمصرفية المشفرة.",
                "examTip": "تم تحديث اسم معيار GOST 28147-89 رسمياً عام 2015 ليصبح GOST R 34.12-2015 Magma."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 6. IDEA
    result["idea"] = {
        "manual-python": [
            {
                "id": "idea-m-1",
                "role": "الضرب في حقل فيرما النمطي Modulo 2^16 + 1",
                "category": "algebraic",
                "badge": "Fermat Prime Field Modulo 65537",
                "inputs": "a, b (uint16)",
                "outputs": "res (uint16)",
                "snippet": "def mul_mod(a, b):\n    if a == 0: a = 0x10000\n    if b == 0: b = 0x10000\n    r = (a * b) % 0x10001\n    return 0 if r == 0x10000 else r",
                "explanation": "العملية الجبرية المركزية في IDEA: الضرب النمطي مع العدد الأولي لفيرما 65537، مع اعتبار الصفر مكافئاً لـ 2^16.",
                "htmlExplanation": "<strong>الضرب في حقل فيرما:</strong> استخدام العدد الأولي $2^{16}+1 = 65537$ لضمان أن كل عنصر يمتلك معكوساً ضربياً وحيداً دون أي قيم شاذة.",
                "math": "a \\odot b = (a \\cdot b) \\pmod{2^{16} + 1}",
                "security": "التعارض الرياضي التام بين الضرب النمطي والجمع النمطي Modulo 2^16 والـ XOR يلغي أي إمكانية للتحليل الخطي.",
                "examTip": "سؤال امتحان أساسي: لماذا يعتبر العدد 65537 مميزاً في IDEA؟ لأنه عدد أولي لفيرما Fermat Prime ($2^{16}+1$)."
            },
            {
                "id": "idea-m-2",
                "role": "بنية الدورة الكاملة وصندوق خلط الكتل (MA Structure)",
                "category": "round",
                "badge": "Multiplication-Addition (MA) Box",
                "inputs": "أربع كتل فرعية 16 بت (X1, X2, X3, X4) و 6 مفاتيح فرعية",
                "outputs": "أربع كتل مشفرة 16 بت",
                "snippet": "def idea_round(x1, x2, x3, x4, k):\n    x1 = mul_mod(x1, k[0])\n    x2 = (x2 + k[1]) & 0xffff\n    x3 = (x3 + k[2]) & 0xffff\n    x4 = mul_mod(x4, k[3])\n    # Multiplication-Addition Box\n    t0 = mul_mod(x1 ^ x3, k[4])\n    t1 = mul_mod((t0 + (x2 ^ x4)) & 0xffff, k[5])\n    t2 = (t0 + t1) & 0xffff\n    x1 ^= t1; x4 ^= t2; x2 ^= t2; x3 ^= t1\n    return x1, x3, x2, x4",
                "explanation": "تنفيذ دورة IDEA التي تدمج ثلاث عمليات جبرية متعارضة: الضرب النمطي، الجمع النمطي، والـ XOR بدون استخدام أي صناديق تعويض S-boxes نهائياً!",
                "htmlExplanation": "<strong>دورة IDEA وصندوق MA:</strong> خوارزمية شو ولاي العبقرية لعام 1991 التي استغنت تماماً عن S-boxes واعتمدت على خلط العمليات الجبرية المتعارضة.",
                "math": "X_1 \\odot K_1, \\quad X_2 \\boxplus K_2, \\quad X_3 \\boxplus K_3, \\quad X_4 \\odot K_4",
                "security": "لم يستطع أحد كسر خوارزمية IDEA حتى اليوم على الدورات الكاملة (8.5 دورة).",
                "examTip": "في IDEA لا يوجد أي صندوق S-box! الأمان نابع بالكامل من تضارب العمليات الجبرية الثلاث (Algebraic Incompatibility)."
            }
        ],
        "libs-python": [
            {
                "id": "idea-l-1",
                "role": "التطبيق المرجعي المعياري لخوارزمية IDEA",
                "category": "cipher",
                "badge": "Standard 128-bit Key Implementation",
                "inputs": "key (16 bytes = 128 bits), data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "from idea_manual import idea_encrypt, idea_decrypt\n\n# تشفير موثق بالمتجهات المرجعية الرسمية\nct = idea_encrypt(key, data)",
                "explanation": "تنفيذ خوارزمية IDEA بالمتجهات المرجعية المعتمدة من ETH Zurich.",
                "htmlExplanation": "<strong>المرجعية الأكاديمية لـ IDEA:</strong> معيار التشفير الأوروبي الذي اشتهر عالمياً بفضل اعتماده في برنامج PGP الكلاسيكي.",
                "math": "C = \\text{IDEA}_K(P)",
                "security": "مفتاح 128 بت و 52 مفتاحاً فرعياً مشتقاً يمنحان مناعة كاملة ضد هجمات القوة العمياء.",
                "examTip": "كانت IDEA محمية ببراءة اختراع سويسرية انتهت صلاحيتها عام 2012، وأصبحت الآن ملكية عامة (Public Domain)."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 7. RC4
    result["rc4"] = {
        "manual-python": [
            {
                "id": "rc4-m-1",
                "role": "خوارزمية جدولة المفتاح (KSA)",
                "category": "key",
                "badge": "Key-Scheduling Algorithm (KSA)",
                "inputs": "key (bytes 1 to 256)",
                "outputs": "S-box (256-byte permutation array)",
                "snippet": "def ksa(key):\n    s = list(range(256))\n    j = 0\n    for i in range(256):\n        j = (j + s[i] + key[i % len(key)]) % 256\n        s[i], s[j] = s[j], s[i]\n    return s",
                "explanation": "تهيئة مصفوفة الحالة S بالأعداد من 0 إلى 255 ثم بعثرة قيمها بالتبادل المعتمد على بايتات المفتاح السري.",
                "htmlExplanation": "<strong>خوارزمية KSA:</strong> خلط مصفوفة الحالة عبر 256 دورة تبادل. مصفوفة S تمثل تبديلاً كاملاً (Permutation) لجميع البايتات الممكنة.",
                "math": "j = (j + S[i] + K[i \\bmod L]) \\bmod 256, \\quad \\text{Swap}(S[i], S[j])",
                "security": "البايتات الأولى الناتجة عن KSA تظهر تحيزاً إحصائياً (Biased Fluhrer-Mantin-Shamir Attack)، مما سبب كسر بروتوكول WEP في Wi-Fi.",
                "examTip": "لهذا السبب في الأنظمة الحديثة (مثل RC4-drop[n]) يتم إهمال أول 768 أو 1024 بايت من تدفق المفتاح."
            },
            {
                "id": "rc4-m-2",
                "role": "خوارزمية توليد التدفق العشوائي الزائف (PRGA)",
                "category": "round",
                "badge": "Pseudo-Random Generation (PRGA)",
                "inputs": "S-box array, data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "def prga(s, data):\n    i = 0; j = 0\n    out = bytearray()\n    for byte in data:\n        i = (i + 1) % 256\n        j = (j + s[i]) % 256\n        s[i], s[j] = s[j], s[i]\n        t = (s[i] + s[j]) % 256\n        k = s[t]\n        out.append(byte ^ k)\n    return bytes(out)",
                "explanation": "توليد بايت عشوائي زائف k في كل خطوة وخلطه مع بايت البيانات الصريحة بعملية XOR المباشرة.",
                "htmlExplanation": "<strong>توليد المفتاح التدفقي PRGA:</strong> تحريك المؤشرين i و j، تبديل عناصر المصفوفة، واستخراج بايت التدفق <code>S[(S[i]+S[j]) % 256]</code> ثم دمجه مع النص الصريح.",
                "math": "z = S[(S[i] + S[j]) \\bmod 256], \\quad C_t = P_t \\oplus z",
                "security": "خوارزمية تدفقية نقية (Stream Cipher)؛ سريعة جداً في المعالجات القديمة ولكن محظورة حالياً في بروتوكولات TLS و WPA2.",
                "examTip": "فك التشفير في RC4 مطابق تماماً للتشفير: $C \\oplus z = (P \\oplus z) \\oplus z = P$."
            }
        ],
        "libs-python": [
            {
                "id": "rc4-l-1",
                "role": "استدعاء RC4 بمكتبة PyCryptodome (ARC4)",
                "category": "cipher",
                "badge": "Alleged RC4 (ARC4) Engine",
                "inputs": "key, data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "from Crypto.Cipher import ARC4\n\ncipher = ARC4.new(key)\nreturn cipher.encrypt(data)",
                "explanation": "استخدام محرك ARC4 المدمج في PyCryptodome لتوليد التشفير التدفقي بسرعة هائلة.",
                "htmlExplanation": "<strong>وحدة ARC4 القياسية:</strong> سُميت ARC4 (Alleged RC4) لأن الاسم التجاري RC4 كان علامة تجارية مسجلة لشركة RSA Data Security.",
                "math": "C = \\text{RC4}_K(P)",
                "security": "الخوارزمية محظورة رسمياً في RFC 7465 لجميع تطبيقات الويب الآمنة بسبب ثغرات التحيز الإحصائي في أول بايتات.",
                "examTip": "في الامتحانات: RC4 هي خوارزمية تشفير تدفقي (Stream Cipher) بينما الخوارزميات الثمانية الأخرى كتلية (Block Ciphers)."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 8. RC5
    result["rc5"] = {
        "manual-python": [
            {
                "id": "rc5-m-1",
                "role": "الدوران الدوراني المعتمد على البيانات (Data-Dependent Rotation)",
                "category": "round",
                "badge": "Data-Dependent Rotation Core",
                "inputs": "val, amount, bits=32",
                "outputs": "rotated value (uint32)",
                "snippet": "def rotl32(val, amount):\n    amount &= 31  # Only bottom 5 bits matter for 32-bit word\n    return ((val << amount) & 0xffffffff) | (val >> (32 - amount))",
                "explanation": "تدوير الكلمة 32 بت بعدد خانات يتم استخراجه ديناميكياً من قيمة الكلمة الأخرى نفسها (Data-Dependent Rotation).",
                "htmlExplanation": "<strong>الدوران المعتمد على البيانات:</strong> الابتكار الثوري لرونالد ريفست؛ عدد خانات الدوران ليس ثابتاً بل يتغير ديناميكياً بحسب البتات السفلى للبيانات الجاري تشفيرها، مما يمنع تشكيل مسارات تفاضلية ثابتة.",
                "math": "A = ((A \\oplus B) \\lll B) + S[2i]",
                "security": "الدوران المتغير يمنح RC5 مناعة مذهلة ضد هجمات التحليل التفاضلي والخطي بعد 12 دورة.",
                "examTip": "في معالجات 32 بت، يتم استخدام 5 بتات فقط لتحديد مقدار الإزاحة ($2^5 = 32$)."
            },
            {
                "id": "rc5-m-2",
                "role": "جدول المفاتيح الموسع باستخدام ثوابت أويلر والنسبة الذهبية",
                "category": "key",
                "badge": "Magic Constants P & Q (Euler / Phi)",
                "inputs": "key (bytes), w=32, r=12",
                "outputs": "S-table of 2(r+1) = 26 subkeys",
                "snippet": "# Thw magic constants for w=32:\n# P32 = Odd((e - 2) * 2^32) = 0xB7E15163\n# Q32 = Odd((phi - 1) * 2^32) = 0x9E3779B9\ndef setup_rc5_keys(key, r=12):\n    s = [(P32 + i * Q32) & 0xffffffff for i in range(2 * (r + 1))]\n    # Mixing key into S table via 3 * max(len(L), 2(r+1)) steps\n    ...",
                "explanation": "اشتقاق مصفوفة المفاتيح باستخدام الثوابت السحرية P و Q المشتقة من الأساس الطبيعي e والنسبة الذهبية Phi.",
                "htmlExplanation": "<strong>الثوابت الرياضية السحرية P و Q:</strong> توليد مفاتيح الدورات الـ 26 بالاعتماد على خصائص التوزيع المنتظم للنسبة الذهبية $\\phi$ وأساس اللوغاريتم الطبيعي $e$.",
                "math": "P_w = \\text{Odd}((e-2)2^w) = \\text{0xB7E15163}, \\quad Q_w = \\text{Odd}((\\phi-1)2^w) = \\text{0x9E3779B9}",
                "security": "يضمن عدم وجود أي مفاتيح متماثلة أو ضعيفة في مصفوفة المفاتيح الموسعة.",
                "examTip": "يتم تسمية RC5 بالصيغة RC5-w/r/b، حيث w حجم الكلمة (32)، r عدد الدورات (12)، و b طول المفتاح بالبايت (16)."
            }
        ],
        "libs-python": [
            {
                "id": "rc5-l-1",
                "role": "التطبيق المرجعي المعياري لخوارزمية RC5-32/12/16",
                "category": "cipher",
                "badge": "Standard RFC 2040 Specification",
                "inputs": "key, data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "from rc5_manual import rc5_encrypt, rc5_decrypt\n\n# تشفير كتل 64 بت في 12 دورة\nct = rc5_encrypt(key, data)",
                "explanation": "تنفيذ RC5 القياسي المتوافق مع مواصفات RFC 2040.",
                "htmlExplanation": "<strong>معيار RFC 2040:</strong> تشفير كتل 64 بت بمفتاح 128 بت و 12 دورة دوران معتمد على البيانات.",
                "math": "C = \\text{RC5}_{32/12/16}(P)",
                "security": "خوارزمية رائدة تم استخدامها في العديد من بروتوكولات الأمان لمرونتها الفائقة على المعالجات المدمجة.",
                "examTip": "خوارزمية RC5 كانت مرشحة أساسية، وشكلت الأساس المعماري لتطوير خوارزمية RC6 لمسابقة AES."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # 9. RC6
    result["rc6"] = {
        "manual-python": [
            {
                "id": "rc6-m-1",
                "role": "الدالة التربيعية غير الخطية f(x) = x(2x + 1) mod 2^32",
                "category": "round",
                "badge": "Quadratic Transform f(x) = x(2x+1)",
                "inputs": "x (uint32)",
                "outputs": "t (uint32 rotated)",
                "snippet": "def quadratic_function(x):\n    # f(x) = (x * (2*x + 1)) mod 2^32\n    # followed by cyclic rotation left by 5 bits\n    val = (x * ((2 * x + 1) & 0xffffffff)) & 0xffffffff\n    return rotl32(val, 5)",
                "explanation": "المعادلة الرياضية التربيعية العبقرية في RC6: حساب x(2x + 1) الذي يضمن تغييراً لكافة البتات ويجعل ناتج الدالة واحداً لواحد (One-to-One Permutation).",
                "htmlExplanation": "<strong>الدالة التربيعية غير الخطية $f(x)$:</strong> ابتكار ريفست لمسابقة معيار AES؛ ضرب العدد في ضعفه مضافاً إليه 1 يولد دالة غير خطية فائقة السرعة على معالجات البنتوم الحديثة مستفيدة من وحدات الضرب السريع في العتاد.",
                "math": "f(x) = (x(2x + 1) \\bmod 2^{32}) \\lll 5",
                "security": "الدالة التربيعية تضمن أن جميع بتات الدخل تؤثر على البتات الأكثر أهمية للدوران، مما يوفر انتشاراً غير خطي هائل ضد التحليل التفاضلي.",
                "examTip": "سؤال امتحان أساسي: لماذا تم اختيار الدالة $x(2x+1)$ في RC6؟ لأنها تقابل رياضي One-to-One Permutation في Modulo 2^w وتستفيد من عتاد الضرب السريع."
            },
            {
                "id": "rc6-m-2",
                "role": "المسجلات الأربعة (A, B, C, D) في الـ 20 دورة",
                "category": "round",
                "badge": "4-Register Feistel Structure (128-bit)",
                "inputs": "A, B, C, D (32-bit each = 128-bit block), 20 rounds keys",
                "outputs": "Ciphertext (128 bits)",
                "snippet": "# Pre-whitening\nB = (B + S[0]) & 0xffffffff\nD = (D + S[1]) & 0xffffffff\nfor i in range(1, 21):\n    t = rotl32((B * (2 * B + 1)) & 0xffffffff, 5)\n    u = rotl32((D * (2 * D + 1)) & 0xffffffff, 5)\n    A = (rotl32(A ^ t, u) + S[2 * i]) & 0xffffffff\n    C = (rotl32(C ^ u, t) + S[2 * i + 1]) & 0xffffffff\n    # Cyclic register swap (A, B, C, D) = (B, C, D, A)\n    A, B, C, D = B, C, D, A",
                "explanation": "معالجة كتلة كاملة 128 بت مقسمة على 4 مسجلات عبر 20 دورة متتالية مع التبييض الأولي والنهائي (Pre/Post Whitening).",
                "htmlExplanation": "<strong>معمارية المسجلات الأربعة:</strong> ميزة RC6 التي نافست في نهائيات مسابقة AES؛ استخدام مسجلين B و D لتدوير المسجلين الآخرين A و C عبر الدالة التربيعية.",
                "math": "A = ((A \\oplus t) \\lll u) + S_{2i}, \\quad C = ((C \\oplus u) \\lll t) + S_{2i+1}",
                "security": "وصلت للتصفيات النهائية الخمس لمسابقة معيار التشفير المتقدم (NIST AES Finalist 2000).",
                "examTip": "في RC6، الدوران يعتمد على متغيرين t و u مشتقين من الدالة التربيعية، مما يحقق خلطاً مزدوجاً في كل دورة."
            }
        ],
        "libs-python": [
            {
                "id": "rc6-l-1",
                "role": "التطبيق المرجعي لمعيار RC6-w/r/b",
                "category": "cipher",
                "badge": "NIST AES Finalist Specification",
                "inputs": "key, data (bytes)",
                "outputs": "ciphertext (bytes)",
                "snippet": "from rc6_manual import rc6_encrypt, rc6_decrypt\n\n# تشفير كتل 128 بت في 20 دورة كاملة\nct = rc6_encrypt(key, data)",
                "explanation": "تشفير كتل 128 بت بـ 20 دورة كاملة طبقاً لمواصفات ملف ترشيح NIST.",
                "htmlExplanation": "<strong>ملف الترشيح النهائي لمعيار AES:</strong> تشفير كتل 128 بت بمفتاح 128/192/256 بت مع مناعة كاملة ضد كافة الهجمات المعروفة.",
                "math": "C = \\text{RC6}_{32/20/16}(P)",
                "security": "واحدة من أقوى الخوارزميات في تاريخ التشفير المتناظر بفضل كفاءتها الرياضية الفائقة.",
                "examTip": "جاءت RC6 في المركز الثاني بعد ريندال (AES) في مسابقة NIST، وكان تفوق AES بسبب كفاءته الأعلى على البطاقات الذكية Smart Cards."
            }
        ],
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    # Shared fallback
    result["_shared"] = {
        "stego-image": SHARED_STEGO_IMAGE,
        "stego-audio": SHARED_STEGO_AUDIO
    }

    from explanation_sources import refresh_explanations
    from pathlib import Path
    refresh_explanations(result, Path(__file__).resolve().parents[1])
    with open("src/content/code_explanations.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("Successfully wrote rich multi-tab code explanations for all 9 ciphers!")

if __name__ == "__main__":
    main()
