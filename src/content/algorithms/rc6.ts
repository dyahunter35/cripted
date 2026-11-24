import { AlgorithmData } from '@/types/algorithm';

export const rc6Data: AlgorithmData = {
  slug: "rc6",
  name: "RC6",
  subtitle: "Rivest Cipher 6 (RC6-32/20/16)",
  category: "additional",
  summary: "دراسة هندسية معمقة لخوارزمية RC6 المتطورة، التي تجمع بين أربعة مسجلات تشغيل (128-bit Block)\n      ودالة تربيعية لاخطية $f(x) = x(2x + 1) \\lll 5$ لتأمين أعلى معدلات الحصانة والسرعة.",
  heroPill: "مرشحة نهائيات المعيار المتقدم — AES Finalist (1998)",
  specs: {
    blockSize: "128-bit (4 × 32-bit words)",
    keySize: "128-bit",
    structure: "4 Working Registers + Quadratic Function",
    rounds: "20 Rounds",
    securityStatus: "strong",
    securityLabel: "مرشح نهائي لمعيار AES",
    designer: "Ronald Rivest, Matt Robshaw, Ray Sidney, Yiqun Lisa Yin",
    year: 1998,
    standard: "AES Finalist Candidate",
  },
  theory: [
  {
    "id": "theory-1",
    "title": "1. خلفية التصميم ومسابقة معيار AES",
    "htmlContent": "\n    <p>\n      قُدمت خوارزمية <strong>RC6</strong> عام 1998 كمرشحة رسمية لمسابقة اختيار معيار التشفير المتقدم (AES)\n      التي أطلقها المعهد الوطني للمعايير والتقنية الأمريكي (NIST) لاستبدال خوارزمية DES المتقادمة.\n      صمم الخوارزمية نخبة من علماء التشفير في شركة RSA: <strong>Ronald Rivest, Matt Robshaw, Ray Sidney, و Yiqun Lisa Yin</strong>.\n    </p>\n    <p>\n      نجحت RC6 في اجتياز كافة مراحل التقييم الصارمة لتصل إلى المرحلة النهائية كواحدة من أفضل 5 خوارزميات في العالم\n      (إلى جانب Rijndael و Twofish و Serpent و MARS)، وأشادت لجان التحكيم بسرعتها الفائقة وتصميمها الرياضي الأنيق.\n    </p>"
  },
  {
    "id": "theory-2",
    "title": "2. المعمارية الهندسية ومسجلات العمل الأربعة",
    "htmlContent": "\n    <p>\n      صُممت RC6 كترقية جوهرية لمعمارية RC5، حيث تغلبت على هجمات التحليل التفاضلي عبر الانتقال من مسجلين إلى أربعة مسجلات وإضافة عملية الضرب الحسابي:\n    </p>\n\n    <div class=\"grid-2\">\n      <div class=\"card\">\n        <h3>المواصفات القياسية (RC6-32/20/16)</h3>\n        <ul class=\"feature-list\">\n          <li><strong>حجم الكتلة:</strong> 128 بت كاملة، مقسمة إلى أربع كلمات ذات 32 بت: $(A, B, C, D)$.</li>\n          <li><strong>عدد الدورات:</strong> 20 دورة تكرارية ($r = 20$).</li>\n          <li><strong>طول المفتاح:</strong> يدعم 128 أو 192 أو 256 بت (16 بايت في التطبيق القياسي للمشروع).</li>\n          <li><strong>عدد المفاتيح الفرعية:</strong> $2r + 4 = 44$ كلمة مفتاحية بحجم 32 بت لكل منها.</li>\n        </ul>\n      </div>\n\n      <div class=\"card\">\n        <h3>الدالة التربيعية غير الخطية $f(x)$</h3>\n        <p>لتوليد دوران معتمد على البيانات شديد التعقيد، تستخدم RC6 دالة تربيعية لاخطية سريعة:</p>\n        <div class=\"alert-box info\" style=\"margin: 10px 0;\">\n          $$f(x) = (x \\times (2x + 1)) \\lll 5 \\pmod{2^{32}}$$\n        </div>\n        <p style=\"color: var(--text-muted); font-size: 0.9rem;\">\n          الضرب في $(2x + 1)$ يضمن أن الناتج فردي دائماً، وبالتالي تظل جميع البتات محتفظة بإنتروبيا عالية وتمنع أي انحيازات صفرية.\n        </p>\n      </div>\n    </div>"
  },
  {
    "id": "theory-3",
    "title": "3. خوارزمية التشفير في الـ 20 دورة",
    "htmlContent": "\n    <p>تسير خطوات التشفير لكتلة 128 بت $(A, B, C, D)$ كالتالي:</p>\n\n    <ul class=\"step-list\">\n      <li>\n        <h4>التهيئة الأولية (Pre-whitening):</h4>\n        <p>\n          <code>B = (B + S[0]) mod 2^32</code>\n          <br>\n          <code>D = (D + S[1]) mod 2^32</code>\n        </p>\n      </li>\n      <li>\n        <h4>الدورات الـ 20 التكرارية:</h4>\n        <p>في كل دورة $i$ من 1 إلى 20:\n          <br>\n          1. حساب دالة التحويل التربيعي: <code>t = ((B * (2B + 1)) mod 2^32) ⋘ 5</code>\n          <br>\n          2. حساب دالة التحويل للمسجل الرابع: <code>u = ((D * (2D + 1)) mod 2^32) ⋘ 5</code>\n          <br>\n          3. تعديل المسجل الأول: <code>A = ((A ⊕ t) ⋘ u) + S[2i] mod 2^32</code>\n          <br>\n          4. تعديل المسجل الثالث: <code>C = ((C ⊕ u) ⋘ t) + S[2i + 1] mod 2^32</code>\n          <br>\n          5. تدوير المسجلات دورياً: <code>(A, B, C, D) = (B, C, D, A)</code>\n        </p>\n      </li>\n      <li>\n        <h4>المعالجة الختامية (Post-whitening):</h4>\n        <p>\n          <code>A = (A + S[2r + 2]) mod 2^32</code>\n          <br>\n          <code>C = (C + S[2r + 3]) mod 2^32</code>\n        </p>\n      </li>\n    </ul>"
  },
  {
    "id": "theory-4",
    "title": "4. التحليل الأمني ومقاومة التحليل الرياضي",
    "htmlContent": "\n    <div class=\"alert-box info\">\n      <div class=\"alert-icon\">💎</div>\n      <div>\n        <strong>حصانة استثنائية:</strong>\n        خلال اختبارات NIST المكثفة لمسابقة AES، أثبتت RC6 مناعة كاملة ضد هجمات التحليل التفاضلي والخطي.\n        عملية الضرب الحسابي التربيعي $x(2x+1)$ تلغي أي احتمالية لوجود فروق بتية خطية يمكن للمهاجم استغلالها عبر الدورات الـ 20.\n      </div>\n    </div>"
  }
],
  playgroundType: "rc6",
  downloadZip: "rc6.zip",
  codeTabs: [
  {
    "id": "manual-python",
    "title": "rc6_manual.py (بايثون نقي من الصفر)",
    "language": "python",
    "category": "manual",
    "fileName": "rc6_manual.py",
    "description": "التطبيق الكامل والمفصل للخوارزمية من الصفر بدون مكتبات خارجية (Pure Python)",
    "code": "\"\"\"RC6-32/20/16 (Ronald Rivest et al., 1998, AES Finalist) in pure Python.\"\"\"\n\nimport argparse\nimport hashlib\nimport struct\nfrom stego_image import hide as img_hide, extract as img_extract\nfrom stego_audio import hide as aud_hide, extract as aud_extract\n\n# Magic constants for word size w=32\nP32 = 0xb7e15163\nQ32 = 0x9e3779b9\n\n\ndef rotl32(x, y):\n    y = y & 31\n    return (((x << y) & 0xffffffff) | (x >> (32 - y))) & 0xffffffff\n\n\ndef rotr32(x, y):\n    y = y & 31\n    return ((x >> y) | ((x << (32 - y)) & 0xffffffff)) & 0xffffffff\n\n\ndef rc6_setup(key_bytes, r=20):\n    c = max(1, len(key_bytes) // 4)\n    L = list(struct.unpack(\"<\" + \"I\" * c, key_bytes[:c * 4]))\n    t = 2 * r + 4\n    S = [0] * t\n    S[0] = P32\n    for i in range(1, t):\n        S[i] = (S[i - 1] + Q32) & 0xffffffff\n\n    i = j = A = B = 0\n    loops = 3 * max(t, c)\n    for _ in range(loops):\n        A = S[i] = rotl32((S[i] + A + B) & 0xffffffff, 3)\n        B = L[j] = rotl32((L[j] + A + B) & 0xffffffff, (A + B) & 31)\n        i = (i + 1) % t\n        j = (j + 1) % c\n    return S\n\n\ndef rc6_encrypt_block(pt16, S, r=20):\n    A, B, C, D = struct.unpack(\"<IIII\", pt16)\n    B = (B + S[0]) & 0xffffffff\n    D = (D + S[1]) & 0xffffffff\n    for i in range(1, r + 1):\n        t = rotl32((B * (2 * B + 1)) & 0xffffffff, 5)\n        u = rotl32((D * (2 * D + 1)) & 0xffffffff, 5)\n        A = (rotl32(A ^ t, u) + S[2 * i]) & 0xffffffff\n        C = (rotl32(C ^ u, t) + S[2 * i + 1]) & 0xffffffff\n        A, B, C, D = B, C, D, A\n    A = (A + S[2 * r + 2]) & 0xffffffff\n    C = (C + S[2 * r + 3]) & 0xffffffff\n    return struct.pack(\"<IIII\", A, B, C, D)\n\n\ndef rc6_decrypt_block(ct16, S, r=20):\n    A, B, C, D = struct.unpack(\"<IIII\", ct16)\n    C = (C - S[2 * r + 3]) & 0xffffffff\n    A = (A - S[2 * r + 2]) & 0xffffffff\n    for i in range(r, 0, -1):\n        A, B, C, D = D, A, B, C\n        u = rotl32((D * (2 * D + 1)) & 0xffffffff, 5)\n        t = rotl32((B * (2 * B + 1)) & 0xffffffff, 5)\n        C = rotr32((C - S[2 * i + 1]) & 0xffffffff, t) ^ u\n        A = rotr32((A - S[2 * i]) & 0xffffffff, u) ^ t\n    D = (D - S[1]) & 0xffffffff\n    B = (B - S[0]) & 0xffffffff\n    return struct.pack(\"<IIII\", A, B, C, D)\n\n\ndef derive_key(password):\n    return hashlib.sha256(password.encode()).digest()[:16]  # 128-bit key\n\n\ndef rc6_encrypt(plaintext, password, r=20):\n    key = derive_key(password)\n    S = rc6_setup(key, r)\n    data = plaintext.encode() if isinstance(plaintext, str) else plaintext\n    # PKCS#7 padding to 16 bytes\n    pad_len = 16 - (len(data) % 16)\n    data = data + bytes([pad_len]) * pad_len\n    out = bytearray()\n    for i in range(0, len(data), 16):\n        out += rc6_encrypt_block(data[i:i + 16], S, r)\n    return bytes(out)\n\n\ndef rc6_decrypt(ciphertext, password, r=20):\n    key = derive_key(password)\n    S = rc6_setup(key, r)\n    out = bytearray()\n    for i in range(0, len(ciphertext), 16):\n        out += rc6_decrypt_block(ciphertext[i:i + 16], S, r)\n    pad_len = out[-1]\n    if pad_len < 1 or pad_len > 16 or out[-pad_len:] != bytes([pad_len]) * pad_len:\n        raise ValueError(\"Invalid padding\")\n    return bytes(out[:-pad_len])\n\n\ndef cmd_demo(args):\n    pw = \"SecretRC6Key@2026\"\n    msg = \"اختبار خوارزمية RC6 المتأهلة لنهائيات معيار التشفير المتقدم AES\"\n    ct = rc6_encrypt(msg, pw)\n    pt = rc6_decrypt(ct, pw).decode(\"utf-8\")\n    print(f\"RC6 Ciphertext (hex): {ct.hex()}\")\n    print(f\"RC6 Decrypted: {pt}\")\n    print(f\"Match: {msg == pt}\")\n\n\ndef main():\n    p = argparse.ArgumentParser(description=\"RC6 Cipher CLI\")\n    sub = p.add_subparsers(dest=\"cmd\")\n    sub.add_parser(\"demo\")\n    args = p.parse_args()\n    if args.cmd == \"demo\" or not args.cmd:\n        cmd_demo(args)\n\n\nif __name__ == \"__main__\":\n    main()\n"
  },
  {
    "id": "libs-python",
    "title": "rc6_libs.py (باستخدام المكتبات القياسية)",
    "language": "python",
    "category": "libs",
    "fileName": "rc6_libs.py",
    "description": "التطبيق القياسي باستخدام مكتبات التشفير المعتمدة (PyCryptodome / gostcrypto)",
    "code": "\"\"\"RC6 (RC6-32/20/16, AES Finalist) Library Wrapper interface.\"\"\"\nfrom rc6_manual import (\n    rc6_setup,\n    rc6_encrypt_block,\n    rc6_decrypt_block,\n    derive_key,\n    rc6_encrypt,\n    rc6_decrypt,\n    main,\n)\n\nif __name__ == \"__main__\":\n    main()\n"
  },
  {
    "id": "stego-image",
    "title": "stego_image.py (إخفاء LSB بالصور)",
    "language": "python",
    "category": "stego",
    "fileName": "stego_image.py",
    "description": "إخفاء النص المشفر داخل البت الأقل وزناً (LSB) لملفات الصور النقطية BMP 24-bit",
    "code": "\"\"\"LSB steganography for 24-bit BMP images (no external dependencies).\"\"\"\n\nimport struct\n\n\ndef _read_bmp(path):\n    with open(path, \"rb\") as f:\n        data = f.read()\n    if data[:2] != b\"BM\":\n        raise ValueError(\"not a BMP file\")\n    pixel_offset = struct.unpack_from(\"<I\", data, 10)[0]\n    width = struct.unpack_from(\"<i\", data, 18)[0]\n    height = struct.unpack_from(\"<i\", data, 22)[0]\n    bpp = struct.unpack_from(\"<H\", data, 28)[0]\n    compression = struct.unpack_from(\"<I\", data, 30)[0]\n    if bpp != 24 or compression != 0:\n        raise ValueError(\"only uncompressed 24-bit BMP is supported\")\n    # row size padded to multiple of 4 bytes\n    row_size = (width * 3 + 3) & ~3\n    abs_h = abs(height)\n    pixels = bytearray()\n    for y in range(abs_h):\n        # BMP stores bottom-up unless height negative\n        if height > 0:\n            row_start = pixel_offset + (abs_h - 1 - y) * row_size\n        else:\n            row_start = pixel_offset + y * row_size\n        pixels += data[row_start:row_start + width * 3]\n    return width, height, pixel_offset, row_size, abs_h, data, pixels\n\n\ndef capacity_bytes(width, height):\n    return (width * height * 3) // 8 - 4  # 4 bytes length header\n\n\ndef hide(input_path, output_path, payload_bytes):\n    width, height, pixel_offset, row_size, abs_h, data, pixels = _read_bmp(input_path)\n    if len(payload_bytes) > capacity_bytes(width, height):\n        raise ValueError(\"payload too large for this image\")\n    # prepend 32-bit length\n    full = len(payload_bytes).to_bytes(4, \"big\") + payload_bytes\n    bits = []\n    for b in full:\n        for i in range(7, -1, -1):\n            bits.append((b >> i) & 1)\n    # embed\n    for idx, bit in enumerate(bits):\n        pixels[idx] = (pixels[idx] & 0xFE) | bit\n    # write back\n    out = bytearray(data)\n    for y in range(abs_h):\n        if height > 0:\n            row_start = pixel_offset + (abs_h - 1 - y) * row_size\n        else:\n            row_start = pixel_offset + y * row_size\n        out[row_start:row_start + width * 3] = pixels[y * width * 3:(y + 1) * width * 3]\n    with open(output_path, \"wb\") as f:\n        f.write(out)\n    return len(payload_bytes)\n\n\ndef extract(input_path):\n    width, height, pixel_offset, row_size, abs_h, data, pixels = _read_bmp(input_path)\n    # read 32-bit length\n    length_bits = 32\n    length = 0\n    for i in range(length_bits):\n        length = (length << 1) | (pixels[i] & 1)\n    if length > capacity_bytes(width, height) or length < 0:\n        raise ValueError(\"invalid or no hidden data\")\n    total_bits = (4 + length) * 8\n    out = bytearray()\n    cur = 0\n    bit_count = 0\n    for i in range(32, total_bits):\n        cur = (cur << 1) | (pixels[i] & 1)\n        bit_count += 1\n        if bit_count == 8:\n            out.append(cur)\n            cur = 0\n            bit_count = 0\n    return bytes(out)\n"
  },
  {
    "id": "stego-audio",
    "title": "stego_audio.py (إخفاء LSB بالصوت)",
    "language": "python",
    "category": "stego",
    "fileName": "stego_audio.py",
    "description": "إخفاء النص المشفر داخل عينات ملفات الصوت الترددية WAV 16-bit PCM",
    "code": "\"\"\"LSB steganography for WAV audio (16-bit PCM, stdlib wave).\"\"\"\n\nimport wave\nimport struct\n\n\ndef _read_wav(path):\n    with wave.open(path, \"rb\") as w:\n        params = w.getparams()\n        frames = w.readframes(w.getnframes())\n    if params.sampwidth != 2:\n        raise ValueError(\"only 16-bit PCM WAV is supported\")\n    # unpack samples\n    count = len(frames) // 2\n    samples = list(struct.unpack(\"<\" + \"h\" * count, frames))\n    return params, samples\n\n\ndef capacity_bytes(params, samples):\n    return len(samples) // 8 - 4\n\n\ndef hide(input_path, output_path, payload_bytes):\n    params, samples = _read_wav(input_path)\n    if len(payload_bytes) > capacity_bytes(params, samples):\n        raise ValueError(\"payload too large for this audio\")\n    full = len(payload_bytes).to_bytes(4, \"big\") + payload_bytes\n    bits = []\n    for b in full:\n        for i in range(7, -1, -1):\n            bits.append((b >> i) & 1)\n    for idx, bit in enumerate(bits):\n        samples[idx] = (samples[idx] & ~1) | bit\n    out_frames = struct.pack(\"<\" + \"h\" * len(samples), *samples)\n    with wave.open(output_path, \"wb\") as w:\n        w.setparams(params)\n        w.writeframes(out_frames)\n    return len(payload_bytes)\n\n\ndef extract(input_path):\n    params, samples = _read_wav(input_path)\n    # read length\n    length = 0\n    for i in range(32):\n        length = (length << 1) | (samples[i] & 1)\n    if length > capacity_bytes(params, samples) or length < 0:\n        raise ValueError(\"invalid or no hidden data\")\n    total_bits = (4 + length) * 8\n    out = bytearray()\n    cur = 0\n    bit_count = 0\n    for i in range(32, total_bits):\n        cur = (cur << 1) | (samples[i] & 1)\n        bit_count += 1\n        if bit_count == 8:\n            out.append(cur)\n            cur = 0\n            bit_count = 0\n    return bytes(out)\n"
  }
],
  defaultKey: "RC6AESFinalistSecretKey2026",
  defaultPlaintext: "Crypto Lab RC6 2026",
};
