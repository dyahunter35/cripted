import { AlgorithmData } from '@/types/algorithm';

export const rc5Data: AlgorithmData = {
  slug: "rc5",
  name: "RC5",
  subtitle: "Rivest Cipher 5 (RC5-32/12/16)",
  category: "core",
  summary: "دراسة تفصيلية لمعمارية التشفير البارامترية القائمة على الدوران المعتمد على البيانات (Data-Dependent Rotations)\n      والثوابت السحرية المستمدة من النسبة الذهبية والعدد النيبيري.",
  heroPill: "ابتكار رون ريفست (1994) — ثورة الدوران المتغير",
  specs: {
    blockSize: "64-bit (2 × 32-bit words)",
    keySize: "128-bit (16 bytes)",
    structure: "Data-Dependent Rotations",
    rounds: "12 Rounds",
    securityStatus: "academic",
    securityLabel: "أكاديمي / مرن",
    designer: "Ronald Rivest",
    year: 1994,
    standard: "RFC 2040",
  },
  theory: [
  {
    "id": "theory-1",
    "title": "1. النشأة وفلسفة التصميم المرن",
    "htmlContent": "\n    <p>\n      صمم عالم التعمية <strong>Ronald Rivest</strong> خوارزمية RC5 في عام 1994 لصالح مختبرات RSA Data Security.\n      جاءت الخوارزمية كاستجابة للحاجة إلى خوارزمية تشفير كتل فائقة السرعة، وبسيطة التركيب، وقابلة للتعديل والضبط (Parameterized).\n    </p>\n    <p>\n      تتميز RC5 بكونها تعتمد كلياً على العمليات الحسابية والمنطقية الأساسية المدمجة في المعالجات الحديثة:\n      (الجمع النمطي، عملية XOR، والإزاحة الدورانية)، دون الحاجة إلى جداول تبديل أو صناديق تعويض (S-boxes)،\n      مما جعلها مثالية للأجهزة ذات الذاكرة المحدودة والمعالجات الدقيقة.\n    </p>"
  },
  {
    "id": "theory-2",
    "title": "2. المعمارية الهندسية والمتغيرات الثلاثة (RC5-w/r/b)",
    "htmlContent": "\n    <p>تُعرف خوارزمية RC5 بمعاملاتها الثلاثة: $RC5-w/r/b$:</p>\n\n    <div class=\"grid-2\">\n      <div class=\"card\">\n        <h3>المعاملات القياسية (Parameters)</h3>\n        <ul class=\"feature-list\">\n          <li><strong>حجم الكلمة ($w$):</strong> 32 بت (وحجم الكتلة $2w = 64$ بت، مقسمة إلى مسجلين $A$ و $B$).</li>\n          <li><strong>عدد الدورات ($r$):</strong> 12 دورة قياسية (العدد الإجمالي للمفاتيح الفرعية $2r + 2 = 26$).</li>\n          <li><strong>طول المفتاح بالبايت ($b$):</strong> 16 بايت (128 بت في التطبيق القياسي للمشروع).</li>\n        </ul>\n      </div>\n\n      <div class=\"card\">\n        <h3>الثوابت السحرية الرياضية ($P_w$ و $Q_w$)</h3>\n        <p>تستخدم الخوارزمية ثابتين سحريين فريدين مشتقين من ثوابت رياضية غير نسبية:</p>\n        <ul style=\"margin-right: 20px; line-height: 1.8; color: var(--text-muted);\">\n          <li><strong>$P_{32} = \\text{0xb7e15163}$ :</strong> مشتق من العدد النيبيري $e = 2.71828...$ عبر المعادلة $\\text{Odd}((e-2)2^w)$.</li>\n          <li><strong>$Q_{32} = \\text{0x9e3779b9}$ :</strong> مشتق من النسبة الذهبية $\\phi = 1.61803...$ عبر المعادلة $\\text{Odd}((\\phi-1)2^w)$.</li>\n        </ul>\n      </div>\n    </div>"
  },
  {
    "id": "theory-3",
    "title": "3. خوارزمية التشفير والدوران المعتمد على البيانات",
    "htmlContent": "\n    <p>\n      الابتكار الأعظم في RC5 هو <strong>الدوران المعتمد على البيانات (Data-Dependent Rotation)</strong>،\n      حيث لا تكون مسافة الإزاحة الدورانية ثابتة في كل دورة، بل تتحدد ديناميكياً بناءً على القيمة اللحظية للبيانات في المسجل المقابل:\n    </p>\n\n    <ul class=\"step-list\">\n      <li>\n        <h4>التهيئة الأولية (Pre-whitening):</h4>\n        <p>يتم جمع المفتاحين الفرعيين الأولين مع نص الكتلة:\n          <br>\n          <code>A = (A + S[0]) mod 2^32</code>\n          <br>\n          <code>B = (B + S[1]) mod 2^32</code>\n        </p>\n      </li>\n      <li>\n        <h4>الدورات الـ 12 التكرارية:</h4>\n        <p>في كل دورة $i$ من 1 إلى $r$ يتم حساب:\n          <br>\n          <code>A = ((A ⊕ B) ⋘ B) + S[2i] mod 2^32</code>\n          <br>\n          <code>B = ((B ⊕ A) ⋘ A) + S[2i + 1] mod 2^32</code>\n          <br>\n          لاحظ أن مقدار الدوران في $A$ يعتمد على القيمة الحالية لـ $B$ (تحديداً أدنى 5 بتات في المعالجات ذات الـ 32 بت)، والعكس صحيح.\n        </p>\n      </li>\n      <li>\n        <h4>فك التشفير المعكوس:</h4>\n        <p>يتم عكس العمليات بدقة من الدورة $r$ نزولاً إلى 1 باستخدام الإزاحة الدورانية لليمين ($\\ggg$)، ثم طرح مفاتيح التهيئة الأولية.</p>\n      </li>\n    </ul>"
  },
  {
    "id": "theory-4",
    "title": "4. التحليل الأمني ومقاومة الهجمات",
    "htmlContent": "\n    <div class=\"alert-box info\">\n      <div class=\"alert-icon\">🔒</div>\n      <div>\n        <strong>الأمان العملي:</strong>\n        أثبتت الأبحاث الأكاديمية (مثل أبحاث Kaliski و Yin) أن استخدام 12 دورة مع مفتاح 128 بت يوفر حصانة عالية جداً ضد التحليلين التفاضلي والخطي.\n        عملية الدوران المعتمد على البيانات توفر تعقيداً غير خطي قوي يعوض غياب صناديق التعويض S-boxes.\n      </div>\n    </div>"
  }
],
  playgroundType: "rc5",
  downloadZip: "rc5.zip",
  codeTabs: [
  {
    "id": "manual-python",
    "title": "rc5_manual.py (بايثون نقي من الصفر)",
    "language": "python",
    "category": "manual",
    "fileName": "rc5_manual.py",
    "description": "التطبيق الكامل والمفصل للخوارزمية من الصفر بدون مكتبات خارجية (Pure Python)",
    "code": "\"\"\"RC5-32/12/16 (Ronald Rivest, 1994) implemented from scratch in pure Python.\"\"\"\n\nimport argparse\nimport hashlib\nimport struct\nfrom stego_image import hide as img_hide, extract as img_extract\nfrom stego_audio import hide as aud_hide, extract as aud_extract\n\n# Magic constants for word size w=32\nP32 = 0xb7e15163\nQ32 = 0x9e3779b9\n\n\ndef rotl32(x, y):\n    y = y & 31\n    return (((x << y) & 0xffffffff) | (x >> (32 - y))) & 0xffffffff\n\n\ndef rotr32(x, y):\n    y = y & 31\n    return ((x >> y) | ((x << (32 - y)) & 0xffffffff)) & 0xffffffff\n\n\ndef rc5_setup(key_bytes, r=12):\n    # Key expansion for RC5-32/12/16\n    c = max(1, len(key_bytes) // 4)\n    L = list(struct.unpack(\"<\" + \"I\" * c, key_bytes[:c * 4]))\n    t = 2 * (r + 1)\n    S = [0] * t\n    S[0] = P32\n    for i in range(1, t):\n        S[i] = (S[i - 1] + Q32) & 0xffffffff\n\n    i = j = A = B = 0\n    loops = 3 * max(t, c)\n    for _ in range(loops):\n        A = S[i] = rotl32((S[i] + A + B) & 0xffffffff, 3)\n        B = L[j] = rotl32((L[j] + A + B) & 0xffffffff, (A + B) & 31)\n        i = (i + 1) % t\n        j = (j + 1) % c\n    return S\n\n\ndef rc5_encrypt_block(pt8, S, r=12):\n    A, B = struct.unpack(\"<II\", pt8)\n    A = (A + S[0]) & 0xffffffff\n    B = (B + S[1]) & 0xffffffff\n    for i in range(1, r + 1):\n        A = (rotl32(A ^ B, B) + S[2 * i]) & 0xffffffff\n        B = (rotl32(B ^ A, A) + S[2 * i + 1]) & 0xffffffff\n    return struct.pack(\"<II\", A, B)\n\n\ndef rc5_decrypt_block(ct8, S, r=12):\n    A, B = struct.unpack(\"<II\", ct8)\n    for i in range(r, 0, -1):\n        B = rotr32((B - S[2 * i + 1]) & 0xffffffff, A) ^ A\n        A = rotr32((A - S[2 * i]) & 0xffffffff, B) ^ B\n    B = (B - S[1]) & 0xffffffff\n    A = (A - S[0]) & 0xffffffff\n    return struct.pack(\"<II\", A, B)\n\n\ndef derive_key(password):\n    return hashlib.sha256(password.encode()).digest()[:16]  # 128-bit key\n\n\ndef rc5_encrypt(plaintext, password, r=12):\n    key = derive_key(password)\n    S = rc5_setup(key, r)\n    data = plaintext.encode() if isinstance(plaintext, str) else plaintext\n    # PKCS#7 padding to 8 bytes\n    pad_len = 8 - (len(data) % 8)\n    data = data + bytes([pad_len]) * pad_len\n    out = bytearray()\n    for i in range(0, len(data), 8):\n        out += rc5_encrypt_block(data[i:i + 8], S, r)\n    return bytes(out)\n\n\ndef rc5_decrypt(ciphertext, password, r=12):\n    key = derive_key(password)\n    S = rc5_setup(key, r)\n    out = bytearray()\n    for i in range(0, len(ciphertext), 8):\n        out += rc5_decrypt_block(ciphertext[i:i + 8], S, r)\n    pad_len = out[-1]\n    if pad_len < 1 or pad_len > 8 or out[-pad_len:] != bytes([pad_len]) * pad_len:\n        raise ValueError(\"Invalid padding\")\n    return bytes(out[:-pad_len])\n\n\ndef cmd_demo(args):\n    pw = \"SecretRC5Key@2026\"\n    msg = \"مرحبا بك في اختبار خوارزمية RC5 التعليمية\"\n    ct = rc5_encrypt(msg, pw)\n    pt = rc5_decrypt(ct, pw).decode(\"utf-8\")\n    print(f\"RC5 Ciphertext (hex): {ct.hex()}\")\n    print(f\"RC5 Decrypted: {pt}\")\n    print(f\"Match: {msg == pt}\")\n\n\ndef main():\n    p = argparse.ArgumentParser(description=\"RC5 Cipher CLI\")\n    sub = p.add_subparsers(dest=\"cmd\")\n    sub.add_parser(\"demo\")\n    args = p.parse_args()\n    if args.cmd == \"demo\" or not args.cmd:\n        cmd_demo(args)\n\n\nif __name__ == \"__main__\":\n    main()\n"
  },
  {
    "id": "libs-python",
    "title": "rc5_libs.py (واجهة توافق للتطبيق اليدوي)",
    "language": "python",
    "category": "wrapper",
    "fileName": "rc5_libs.py",
    "description": "واجهة توافق تعيد تصدير التطبيق اليدوي ولا تعتمد على مكتبة تشفير مستقلة",
    "code": "\"\"\"RC5 (RC5-32/12/16) Library Wrapper interface.\"\"\"\nfrom rc5_manual import (\n    rc5_setup,\n    rc5_encrypt_block,\n    rc5_decrypt_block,\n    derive_key,\n    rc5_encrypt,\n    rc5_decrypt,\n    main,\n)\n\nif __name__ == \"__main__\":\n    main()\n"
  },
  {
    "id": "stego-image",
    "title": "stego_image.py (إخفاء LSB بالصور)",
    "language": "python",
    "category": "stego",
    "fileName": "stego_image.py",
    "description": "إخفاء النص المشفر داخل البت الأقل وزناً (LSB) لملفات الصور النقطية BMP 24-bit",
    "code": "\"\"\"LSB steganography for 24-bit BMP images (no external dependencies).\"\"\"\n\nimport struct\n\n\ndef _read_bmp(path):\n    with open(path, \"rb\") as f:\n        data = f.read()\n    if len(data) < 54 or data[:2] != b\"BM\":\n        raise ValueError(\"not a BMP file\")\n    pixel_offset = struct.unpack_from(\"<I\", data, 10)[0]\n    width = struct.unpack_from(\"<i\", data, 18)[0]\n    height = struct.unpack_from(\"<i\", data, 22)[0]\n    bpp = struct.unpack_from(\"<H\", data, 28)[0]\n    compression = struct.unpack_from(\"<I\", data, 30)[0]\n    if bpp != 24 or compression != 0:\n        raise ValueError(\"only uncompressed 24-bit BMP is supported\")\n    # row size padded to multiple of 4 bytes\n    row_size = (width * 3 + 3) & ~3\n    abs_h = abs(height)\n    if width <= 0 or abs_h == 0 or pixel_offset < 54 or pixel_offset + row_size * abs_h > len(data):\n        raise ValueError(\"invalid or truncated BMP\")\n    pixels = bytearray()\n    for y in range(abs_h):\n        # BMP stores bottom-up unless height negative\n        if height > 0:\n            row_start = pixel_offset + (abs_h - 1 - y) * row_size\n        else:\n            row_start = pixel_offset + y * row_size\n        pixels += data[row_start:row_start + width * 3]\n    return width, height, pixel_offset, row_size, abs_h, data, pixels\n\n\ndef capacity_bytes(width, height):\n    return (width * abs(height) * 3) // 8 - 4  # 4 bytes length header\n\n\ndef hide(input_path, output_path, payload_bytes):\n    width, height, pixel_offset, row_size, abs_h, data, pixels = _read_bmp(input_path)\n    if len(payload_bytes) > capacity_bytes(width, height):\n        raise ValueError(\"payload too large for this image\")\n    # prepend 32-bit length\n    full = len(payload_bytes).to_bytes(4, \"big\") + payload_bytes\n    bits = []\n    for b in full:\n        for i in range(7, -1, -1):\n            bits.append((b >> i) & 1)\n    # embed\n    for idx, bit in enumerate(bits):\n        pixels[idx] = (pixels[idx] & 0xFE) | bit\n    # write back\n    out = bytearray(data)\n    for y in range(abs_h):\n        if height > 0:\n            row_start = pixel_offset + (abs_h - 1 - y) * row_size\n        else:\n            row_start = pixel_offset + y * row_size\n        out[row_start:row_start + width * 3] = pixels[y * width * 3:(y + 1) * width * 3]\n    with open(output_path, \"wb\") as f:\n        f.write(out)\n    return len(payload_bytes)\n\n\ndef extract(input_path):\n    width, height, pixel_offset, row_size, abs_h, data, pixels = _read_bmp(input_path)\n    if len(pixels) < 32:\n        raise ValueError(\"image too small for length header\")\n    # read 32-bit length\n    length_bits = 32\n    length = 0\n    for i in range(length_bits):\n        length = (length << 1) | (pixels[i] & 1)\n    if length > capacity_bytes(width, height) or length < 0:\n        raise ValueError(\"invalid or no hidden data\")\n    total_bits = (4 + length) * 8\n    out = bytearray()\n    cur = 0\n    bit_count = 0\n    for i in range(32, total_bits):\n        cur = (cur << 1) | (pixels[i] & 1)\n        bit_count += 1\n        if bit_count == 8:\n            out.append(cur)\n            cur = 0\n            bit_count = 0\n    return bytes(out)\n"
  },
  {
    "id": "stego-audio",
    "title": "stego_audio.py (إخفاء LSB بالصوت)",
    "language": "python",
    "category": "stego",
    "fileName": "stego_audio.py",
    "description": "إخفاء النص المشفر داخل عينات ملفات الصوت الترددية WAV 16-bit PCM",
    "code": "\"\"\"LSB steganography for WAV audio (16-bit PCM, stdlib wave).\"\"\"\n\nimport wave\nimport struct\n\n\ndef _read_wav(path):\n    with wave.open(path, \"rb\") as w:\n        params = w.getparams()\n        frames = w.readframes(w.getnframes())\n    if params.sampwidth != 2:\n        raise ValueError(\"only 16-bit PCM WAV is supported\")\n    if len(frames) != params.nframes * params.nchannels * 2:\n        raise ValueError(\"truncated WAV frames\")\n    # unpack samples\n    count = len(frames) // 2\n    samples = list(struct.unpack(\"<\" + \"h\" * count, frames))\n    return params, samples\n\n\ndef capacity_bytes(params, samples):\n    return len(samples) // 8 - 4\n\n\ndef hide(input_path, output_path, payload_bytes):\n    params, samples = _read_wav(input_path)\n    if len(payload_bytes) > capacity_bytes(params, samples):\n        raise ValueError(\"payload too large for this audio\")\n    full = len(payload_bytes).to_bytes(4, \"big\") + payload_bytes\n    bits = []\n    for b in full:\n        for i in range(7, -1, -1):\n            bits.append((b >> i) & 1)\n    for idx, bit in enumerate(bits):\n        samples[idx] = (samples[idx] & ~1) | bit\n    out_frames = struct.pack(\"<\" + \"h\" * len(samples), *samples)\n    with wave.open(output_path, \"wb\") as w:\n        w.setparams(params)\n        w.writeframes(out_frames)\n    return len(payload_bytes)\n\n\ndef extract(input_path):\n    params, samples = _read_wav(input_path)\n    if len(samples) < 32:\n        raise ValueError(\"audio too small for length header\")\n    # read length\n    length = 0\n    for i in range(32):\n        length = (length << 1) | (samples[i] & 1)\n    if length > capacity_bytes(params, samples) or length < 0:\n        raise ValueError(\"invalid or no hidden data\")\n    total_bits = (4 + length) * 8\n    out = bytearray()\n    cur = 0\n    bit_count = 0\n    for i in range(32, total_bits):\n        cur = (cur << 1) | (samples[i] & 1)\n        bit_count += 1\n        if bit_count == 8:\n            out.append(cur)\n            cur = 0\n            bit_count = 0\n    return bytes(out)\n"
  }
],
  defaultKey: "RivestRC5MasterKey2026",
  defaultPlaintext: "Crypto Lab RC5 2026",
};
