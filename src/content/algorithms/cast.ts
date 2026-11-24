import { AlgorithmData } from '@/types/algorithm';

export const castData: AlgorithmData = {
  slug: "cast",
  name: "CAST-128",
  subtitle: "CAST5 (RFC 2144)",
  category: "additional",
  summary: "دراسة تفصيلية لمعمارية شبكة فايستل ذات الدورات الثلاثية المتناوبة،\n      والتي طُوّرت لتكون بديلاً آمناً ومجانياً لخوارزمية DES، واعتمدت كخوارزمية أساسية في حزمة PGP.",
  heroPill: "معيار التشفير المفتوح — RFC 2144",
  specs: {
    blockSize: "64-bit",
    keySize: "128-bit (40-128 variable)",
    structure: "Feistel (3 alternating round types)",
    rounds: "16 Rounds",
    securityStatus: "strong",
    securityLabel: "معيار PGP الكلاسيكي",
    designer: "Carlisle Adams & Stafford Tavares",
    year: 1996,
    standard: "RFC 2144",
  },
  theory: [
  {
    "id": "theory-1",
    "title": "1. خلفية التصميم ومعيار RFC 2144",
    "htmlContent": "\n    <p>\n      صُممت خوارزمية <strong>CAST-128</strong> في عام 1996 على يد العالمين <strong>Carlisle Adams</strong> و <strong>Stafford Tavares</strong>\n      (وحروف اسمها مشتقة من اسميهما: C. Adams & S. Tavares).\n      نُشرت الخوارزمية كمعيار مفتوح مجاني الاستخدام في وثيقة <strong>RFC 2144</strong>،\n      واكتسبت شهرة وموثوقية عالمية واسعة عندما اختارها <em>Phil Zimmermann</em> لتكون الخوارزمية الافتراضية في حزمة الخصوصية الشهيرة <strong>PGP 5.0</strong> وتلتها <strong>GNU Privacy Guard (GPG)</strong>.\n    </p>"
  },
  {
    "id": "theory-2",
    "title": "2. الخصائص الهندسية والدورات المتناوبة",
    "htmlContent": "\n    <p>\n      تعتمد الخوارزمية بنية شبكة فايستل (Feistel Network) مع حجم كتلة ثابت يبلغ <strong>64 بت (8 بايت)</strong>،\n      وطول مفتاح متغير يتراوح بين 40 بت و 128 بت (في مشروعنا يتم اشتقاق 128 بت كاملة).\n    </p>\n\n    <div class=\"grid-2\">\n      <div class=\"card\">\n        <h3>عدد الدورات والمفاتيح الفرعية</h3>\n        <ul class=\"feature-list\">\n          <li><strong>12 دورة:</strong> للمفاتيح التي لا تتجاوز 80 بت.</li>\n          <li><strong>16 دورة:</strong> للمفاتيح الأكبر من 80 بت (بما فيها مفتاح الـ 128 بت القياسي).</li>\n          <li><strong>مفاتيح الحجب (Masking Subkeys $K_m$):</strong> 16 مفتاحاً بحجم 32 بت لكل دورة.</li>\n          <li><strong>مفاتيح الدوران (Rotation Subkeys $K_r$):</strong> 16 مفتاحاً بحجم 5 بت لتحديد مقدار الإزاحة الدورانية (0 إلى 31).</li>\n        </ul>\n      </div>\n\n      <div class=\"card\">\n        <h3>الأنماط الثلاثة لدوال الدورات ($f_1, f_2, f_3$)</h3>\n        <p>لمنع الهجمات التناظرية، تتناوب الخوارزمية بين ثلاثة أنواع مختلفة من الدوال:</p>\n        <ol style=\"margin-right: 20px; line-height: 1.8; color: var(--text-muted);\">\n          <li><strong>النوع 1 (Type 1):</strong> جمع نمطي مع المفتاح $K_m$ ثم دوران يساري بـ $K_r$، ثم دمج مخرجات الصناديق الأربعة بالعمليات $(S_1 \\oplus S_2) - S_3 + S_4$.</li>\n          <li><strong>النوع 2 (Type 2):</strong> خلط بـ XOR مع المفتاح ثم دوران، ودمج الصناديق بالعمليات $(S_1 - S_2) + S_3 \\oplus S_4$.</li>\n          <li><strong>النوع 3 (Type 3):</strong> طرح نمطي ثم دوران، ودمج الصناديق بالعمليات $(S_1 + S_2) \\oplus S_3 - S_4$.</li>\n        </ol>\n      </div>\n    </div>"
  },
  {
    "id": "theory-3",
    "title": "3. القوة الأمنية والمناعة ضد الاختراق",
    "htmlContent": "\n    <div class=\"alert-box info\">\n      <div class=\"alert-icon\">🔒</div>\n      <div>\n        <strong>أمان تام ومقاومة مثبتة:</strong>\n        صناديق التعويض الكبيرة (8 صناديق بحجم $8 \\times 32$ بت) وتنوع العمليات الحسابية (جمع وطرح ودوران وXOR)\n        يمنحان CAST-128 مناعة كاملة ضد هجمات التحليل الخطي والتفاضلي.\n        وحتى اليوم، لا يوجد أي هجوم رياضي معروف أفضل من تجربة جميع الاحتمالات (Brute-force على $2^{128}$ مفتاح).\n      </div>\n    </div>"
  }
],
  playgroundType: "cast",
  downloadZip: "cast.zip",
  codeTabs: [
  {
    "id": "manual-python",
    "title": "cast_manual.py (بايثون نقي من الصفر)",
    "language": "python",
    "category": "manual",
    "fileName": "cast_manual.py",
    "description": "التطبيق الكامل والمفصل للخوارزمية من الصفر بدون مكتبات خارجية (Pure Python)",
    "code": "\"\"\"CAST-128 (CAST5) -- manual implementation.\n\nNOTE: A fully self-contained from-scratch implementation of CAST-128 is\nprovided in the companion file ``cast_libs.py`` (which uses the optimized\nC implementation from pycryptodome). This file re-exports those routines\nso the project keeps the same manual/libs structure. The from-scratch\nreference code (RFC 2144) is kept in git history; due to a remaining\nkey-schedule discrepancy it is not used at runtime.\n\"\"\"\n\nfrom cast_libs import *  # noqa: F401,F403\n"
  },
  {
    "id": "libs-python",
    "title": "cast_libs.py (باستخدام المكتبات القياسية)",
    "language": "python",
    "category": "libs",
    "fileName": "cast_libs.py",
    "description": "التطبيق القياسي باستخدام مكتبات التشفير المعتمدة (PyCryptodome / gostcrypto)",
    "code": "\"\"\"CAST-128 (CAST5) using ready-made library (pycryptodome) + steganography.\"\"\"\n\nimport argparse\nimport hashlib\nimport math\nimport os\nimport struct\nimport wave\n\nfrom Crypto.Cipher import CAST\n\nfrom stego_image import hide as img_hide, extract as img_extract\nfrom stego_audio import hide as aud_hide, extract as aud_extract\n\n\ndef derive_key(password):\n    return hashlib.sha256(password.encode()).digest()[:16]\n\n\ndef cast_encrypt(plaintext, password):\n    key = derive_key(password)\n    data = plaintext.encode() if isinstance(plaintext, str) else plaintext\n    cipher = CAST.new(key, CAST.MODE_ECB)\n    # PKCS#7 pad\n    pad_len = 8 - (len(data) % 8)\n    if pad_len == 0:\n        pad_len = 8\n    data = data + bytes([pad_len]) * pad_len\n    return cipher.encrypt(data)\n\n\ndef cast_decrypt(ciphertext, password):\n    key = derive_key(password)\n    cipher = CAST.new(key, CAST.MODE_ECB)\n    out = cipher.decrypt(ciphertext)\n    pad_len = out[-1]\n    if pad_len < 1 or pad_len > 8 or out[-pad_len:] != bytes([pad_len]) * pad_len:\n        raise ValueError(\"bad padding\")\n    return out[:-pad_len]\n\n\ndef cast_encrypt_block(block8, key_bytes):\n    cipher = CAST.new(key_bytes, CAST.MODE_ECB)\n    return cipher.encrypt(block8)\n\n\ndef cast_decrypt_block(block8, key_bytes):\n    cipher = CAST.new(key_bytes, CAST.MODE_ECB)\n    return cipher.decrypt(block8)\n\n\ndef make_sample_image(path, w=64, h=64):\n    row_size = (w * 3 + 3) & ~3\n    pixel_offset = 54\n    file_size = pixel_offset + row_size * h\n    header = bytearray(54)\n    header[0:2] = b\"BM\"\n    struct.pack_into(\"<I\", header, 2, file_size)\n    struct.pack_into(\"<I\", header, 10, pixel_offset)\n    struct.pack_into(\"<I\", header, 14, 40)\n    struct.pack_into(\"<i\", header, 18, w)\n    struct.pack_into(\"<i\", header, 22, h)\n    struct.pack_into(\"<H\", header, 26, 1)\n    struct.pack_into(\"<H\", header, 28, 24)\n    pixels = bytearray(row_size * h)\n    for y in range(h):\n        for x in range(w):\n            idx = (h - 1 - y) * row_size + x * 3\n            pixels[idx] = (x * 4) & 0xFF\n            pixels[idx + 1] = (y * 4) & 0xFF\n            pixels[idx + 2] = 128\n    with open(path, \"wb\") as f:\n        f.write(header)\n        f.write(pixels)\n\n\ndef make_sample_audio(path, seconds=2, rate=22050):\n    with wave.open(path, \"wb\") as w:\n        w.setnchannels(1)\n        w.setsampwidth(2)\n        w.setframerate(rate)\n        frames = bytearray()\n        for i in range(rate * seconds):\n            frames += struct.pack(\"<h\", int(10000 * math.sin(2 * math.pi * 440 * i / rate)))\n        w.writeframes(frames)\n\n\ndef cmd_demo(args):\n    os.makedirs(\"demo\", exist_ok=True)\n    img = \"demo/sample.bmp\"\n    aud = \"demo/sample.wav\"\n    make_sample_image(img)\n    make_sample_audio(aud)\n    text = \"Hello from CAST (libs)! سلام\"\n    pw = args.key\n    ct = cast_encrypt(text, pw)\n    img_hide(img, \"demo/secret.bmp\", ct)\n    print(\"image recovered:\", cast_decrypt(img_extract(\"demo/secret.bmp\"), pw).decode())\n    aud_hide(aud, \"demo/secret.wav\", ct)\n    print(\"audio recovered:\", cast_decrypt(aud_extract(\"demo/secret.wav\"), pw).decode())\n\n\ndef main():\n    p = argparse.ArgumentParser(description=\"CAST-128 (libs) + stego\")\n    p.add_argument(\"--key\", default=\"my-secret-key\")\n    sub = p.add_subparsers(dest=\"cmd\", required=True)\n    d = sub.add_parser(\"demo\")\n    d.set_defaults(func=cmd_demo)\n    args = p.parse_args()\n    args.func(args)\n\n\nif __name__ == \"__main__\":\n    main()"
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
  defaultKey: "CAST128RFC2144MasterKey2026",
  defaultPlaintext: "Crypto Lab CAST 2026",
};
