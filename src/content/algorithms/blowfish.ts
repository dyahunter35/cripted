import { AlgorithmData } from '@/types/algorithm';

export const blowfishData: AlgorithmData = {
  slug: "blowfish",
  name: "Blowfish",
  subtitle: "Bruce Schneier Feistel Cipher (1993)",
  category: "additional",
  summary: "دراسة تفصيلية لمعمارية شبكة فيستل ذات الـ 16 دورة، المتميزة بصناديق التعويض المعتمدة على المفتاح (Key-Dependent S-Boxes)\n      وثوابت التهيئة المشتقة من الأرقام الكسرية للنسبة الثابتة $\\pi$.",
  heroPill: "ابتكار بروس شناير (Bruce Schneier, 1993) — سرعة فائقة وحصانة استثنائية",
  specs: {
    blockSize: "64-bit",
    keySize: "128-bit (32-448 variable)",
    structure: "Feistel Network with Key-Dependent S-Boxes",
    rounds: "16 Rounds",
    securityStatus: "academic",
    securityLabel: "سريع / تاريخي",
    designer: "Bruce Schneier",
    year: 1993,
    standard: "Public Domain",
  },
  theory: [
  {
    "id": "theory-1",
    "title": "1. النشأة وفلسفة التصميم الحر (Public Domain)",
    "htmlContent": "\n    <p>\n      صمم خبير التشفير العالمي <strong>Bruce Schneier</strong> خوارزمية Blowfish عام 1993 كبديل مجاني وسريع ومفتوح المصدر بدون أي براءات اختراع.\n      حققت الخوارزمية انتشاراً هائلاً في برمجيات الحماية مثل OpenSSH و PuTTY و بروتوكولات VPN بفضل سرعتها المذهلة في التشفير البرمجي.\n    </p>"
  },
  {
    "id": "theory-2",
    "title": "2. معمارية شبكة فيستل وصناديق S-boxes المعتمدة على المفتاح",
    "htmlContent": "\n    <p>تعتمد Blowfish على شبكة فيستل متناظرة ذات 16 دورة:</p>\n\n    <div class=\"grid-2\">\n      <div class=\"card\">\n        <h3>المواصفات القياسية</h3>\n        <ul class=\"feature-list\">\n          <li><strong>حجم الكتلة:</strong> 64 بت (مقسمة إلى نصفين $L$ و $R$ بطول 32 بت).</li>\n          <li><strong>طول المفتاح:</strong> متغير ومرن من 32 بت حتى 448 بت (128 بت في تطبيقنا).</li>\n          <li><strong>عدد الدورات:</strong> 16 دورة فيستل متتالية.</li>\n          <li><strong>مصفوفة المفاتيح الفرعية P-array:</strong> تتكون من 18 كلمة بطول 32 بت.</li>\n        </ul>\n      </div>\n\n      <div class=\"card\">\n        <h3>ثوابت النسبة الثابتة $\\pi$ (Nothing Up My Sleeve)</h3>\n        <p>\n          تُهيأ مصفوفة $P$ وصناديق التعويض الأربعة $S_1, S_2, S_3, S_4$ بالقيم الست عشرية المشتقة من الكسر العشري للعدد $\\pi$:\n        </p>\n        <p style=\"font-family: var(--font-mono); color: var(--accent-cyan);\">\n          P1 = 0x243F6A88, P2 = 0x85A308D3, ...\n        </p>\n        <p>\n          يتم بعد ذلك تشفير مصفوفات الثوابت بواسطة المفتاح السري نفسه عبر مئات الدورات لتوليد صناديق تعويض مخصصة تماماً لكل مفتاح،\n          مما يجعل أي هجوم تحليل خطي أو تفاضلي مستحيلاً عملياً.\n        </p>\n      </div>\n    </div>"
  },
  {
    "id": "theory-3",
    "title": "3. دالة الدورات F في Blowfish",
    "htmlContent": "\n    <p>\n      تأخذ دالة الدورات $F(x)$ كلمة بطول 32 بت وتقسمها إلى أربعة بايتات $a, b, c, d$ (كل بايت 8 بت)، وتطبق المعادلة:\n    </p>\n    <p style=\"text-align: center; font-family: var(--font-mono); font-size: 1.15rem; color: var(--accent-emerald);\">\n      F(a, b, c, d) = ((S₁[a] + S₂[b] mod 2³²) ⊕ S₃[c]) + S₄[d] mod 2³²\n    </p>\n    <p>\n      تتميز هذه الدالة بكونها تجمع بين العمليات الحسابية غير الخطية (الجمع النمطي $2^{32}$) والعمليات المنطقية (XOR) وصناديق التعويض المتغيرة،\n      مما يوفر تأثيراً كاسحاً لنشر البتات (Avalanche Effect).\n    </p>"
  }
],
  playgroundType: "blowfish",
  downloadZip: "blowfish.zip",
  codeTabs: [
  {
    "id": "manual-python",
    "title": "blowfish_manual.py (بايثون نقي من الصفر)",
    "language": "python",
    "category": "manual",
    "fileName": "blowfish_manual.py",
    "description": "التطبيق الكامل والمفصل للخوارزمية من الصفر بدون مكتبات خارجية (Pure Python)",
    "code": "\"\"\"Blowfish (Bruce Schneier, 1993) -- manual and library interface wrapper.\"\"\"\n\nfrom blowfish_libs import (\n    blowfish_encrypt,\n    blowfish_decrypt,\n    derive_key,\n    main,\n)\n\nif __name__ == \"__main__\":\n    main()\n"
  },
  {
    "id": "libs-python",
    "title": "blowfish_libs.py (باستخدام المكتبات القياسية)",
    "language": "python",
    "category": "libs",
    "fileName": "blowfish_libs.py",
    "description": "التطبيق القياسي باستخدام مكتبات التشفير المعتمدة (PyCryptodome / gostcrypto)",
    "code": "\"\"\"Blowfish (Bruce Schneier, 1993) implementation using pycryptodome + LSB steganography.\"\"\"\n\nimport argparse\nimport hashlib\nimport os\nimport struct\nfrom Crypto.Cipher import Blowfish\nfrom Crypto.Util.Padding import pad, unpad\nfrom stego_image import hide as img_hide, extract as img_extract\nfrom stego_audio import hide as aud_hide, extract as aud_extract\n\n\ndef derive_key(password):\n    return hashlib.sha256(password.encode()).digest()[:16]\n\n\ndef blowfish_encrypt(plaintext, password):\n    key = derive_key(password)\n    cipher = Blowfish.new(key, Blowfish.MODE_ECB)\n    data = plaintext.encode() if isinstance(plaintext, str) else plaintext\n    return cipher.encrypt(pad(data, Blowfish.block_size))\n\n\ndef blowfish_decrypt(ciphertext, password):\n    key = derive_key(password)\n    cipher = Blowfish.new(key, Blowfish.MODE_ECB)\n    return unpad(cipher.decrypt(ciphertext), Blowfish.block_size)\n\n\ndef make_sample_image(path, w=64, h=64):\n    row_size = (w * 3 + 3) & ~3\n    pixel_offset = 54\n    file_size = pixel_offset + row_size * h\n    header = bytearray(54)\n    header[0:2] = b\"BM\"\n    struct.pack_into(\"<I\", header, 2, file_size)\n    struct.pack_into(\"<I\", header, 10, pixel_offset)\n    struct.pack_into(\"<I\", header, 14, 40)\n    struct.pack_into(\"<i\", header, 18, w)\n    struct.pack_into(\"<i\", header, 22, h)\n    struct.pack_into(\"<H\", header, 26, 1)\n    struct.pack_into(\"<H\", header, 28, 24)\n    struct.pack_into(\"<I\", header, 34, row_size * h)\n    body = bytearray()\n    for y in range(h):\n        row = bytearray()\n        for x in range(w):\n            row += bytes([(x * 4) % 256, (y * 4) % 256, 120])\n        row += bytes(row_size - w * 3)\n        body += row\n    with open(path, \"wb\") as f:\n        f.write(header + body)\n\n\ndef make_sample_audio(path, seconds=1, rate=22050):\n    import wave\n    import math\n    with wave.open(path, \"wb\") as w:\n        w.setnchannels(1)\n        w.setsampwidth(2)\n        w.setframerate(rate)\n        frames = bytearray()\n        for i in range(rate * seconds):\n            frames += struct.pack(\"<h\", int(10000 * math.sin(2 * math.pi * 440 * i / rate)))\n        w.writeframes(frames)\n\n\ndef cmd_demo(args):\n    pw = \"MasterSecretBlowfishKey2026\"\n    msg = \"مرحبا بك في اختبار خوارزمية Blowfish التعليمية\"\n    ct = blowfish_encrypt(msg, pw)\n    pt = blowfish_decrypt(ct, pw).decode(\"utf-8\")\n    print(f\"Blowfish Ciphertext (hex): {ct.hex()}\")\n    print(f\"Blowfish Decrypted: {pt}\")\n    print(f\"Match: {msg == pt}\")\n\n    os.makedirs(\"demo\", exist_ok=True)\n    img_sample = \"demo/sample.bmp\"\n    aud_sample = \"demo/sample.wav\"\n    make_sample_image(img_sample)\n    make_sample_audio(aud_sample)\n\n    img_hide(img_sample, \"demo/secret.bmp\", ct)\n    ext_ct = img_extract(\"demo/secret.bmp\")\n    print(\"Stego BMP Decrypted:\", blowfish_decrypt(ext_ct, pw).decode())\n\n    aud_hide(aud_sample, \"demo/secret.wav\", ct)\n    ext_aud_ct = aud_extract(\"demo/secret.wav\")\n    print(\"Stego WAV Decrypted:\", blowfish_decrypt(ext_aud_ct, pw).decode())\n\n\ndef main():\n    p = argparse.ArgumentParser(description=\"Blowfish encryption using pycryptodome\")\n    p.add_argument(\"--key\", default=\"MasterSecretBlowfishKey2026\")\n    sub = p.add_subparsers(dest=\"cmd\", required=True)\n\n    ih = sub.add_parser(\"image-hide\")\n    ih.add_argument(\"input\"); ih.add_argument(\"output\"); ih.add_argument(\"text\")\n    ih.set_defaults(func=lambda a: img_hide(a.input, a.output, blowfish_encrypt(a.text, a.key)) or print(\"done\"))\n\n    ish = sub.add_parser(\"image-show\")\n    ish.add_argument(\"input\")\n    ish.set_defaults(func=lambda a: print(\"secret:\", blowfish_decrypt(img_extract(a.input), a.key).decode()))\n\n    ah = sub.add_parser(\"audio-hide\")\n    ah.add_argument(\"input\"); ah.add_argument(\"output\"); ah.add_argument(\"text\")\n    ah.set_defaults(func=lambda a: aud_hide(a.input, a.output, blowfish_encrypt(a.text, a.key)) or print(\"done\"))\n\n    ash = sub.add_parser(\"audio-show\")\n    ash.add_argument(\"input\")\n    ash.set_defaults(func=lambda a: print(\"secret:\", blowfish_decrypt(aud_extract(a.input), a.key).decode()))\n\n    d = sub.add_parser(\"demo\")\n    d.set_defaults(func=cmd_demo)\n\n    args = p.parse_args()\n    args.func(args)\n\n\nif __name__ == \"__main__\":\n    main()\n"
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
  defaultKey: "BlowfishSchneierKey2026",
  defaultPlaintext: "Crypto Lab Blowfish 2026",
};
