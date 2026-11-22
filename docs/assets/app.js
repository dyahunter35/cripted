/**
 * Crypto Lab - Interactive UI and Client-side Cryptographic Helper
 * Educational platform for learning DES, GOST, RC4, RC5, RC6, CAST-128 & Steganography
 */

(function () {
  'use strict';

  // --- Copy Code to Clipboard ---
  function initCodeCopy() {
    const codeBlocks = document.querySelectorAll('.code-container');
    codeBlocks.forEach(block => {
      const btn = block.querySelector('.btn-copy');
      const code = block.querySelector('pre.code-body');
      if (btn && code) {
        btn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(code.innerText.trim());
            const origText = btn.innerHTML;
            btn.innerHTML = '✔ تم النسخ!';
            btn.style.borderColor = 'var(--accent-emerald)';
            btn.style.color = 'var(--accent-emerald)';
            setTimeout(() => {
              btn.innerHTML = origText;
              btn.style.borderColor = '';
              btn.style.color = '';
            }, 2000);
          } catch (err) {
            console.error('Copy failed', err);
          }
        });
      }
    });
  }

  // --- Lightweight Client-side Hash Helper (SHA-256 via SubtleCrypto) ---
  async function sha256Bytes(str) {
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuf);
  }

  // --- Bitwise 32-bit Rotations ---
  function rotl32(x, y) {
    y = y & 31;
    return (((x << y) | (x >>> (32 - y))) >>> 0);
  }
  function rotr32(x, y) {
    y = y & 31;
    return (((x >>> y) | (x << (32 - y))) >>> 0);
  }

  // --- RC4 / RC4-drop Stream Cipher ---
  function rc4Crypt(keyBytes, textBytes, drop = 0) {
    const S = new Uint8Array(256);
    for (let i = 0; i < 256; i++) S[i] = i;

    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + keyBytes[i % keyBytes.length]) & 255;
      const tmp = S[i];
      S[i] = S[j];
      S[j] = tmp;
    }

    let i = 0;
    j = 0;
    // Discard initial bytes if drop is requested (RC4-drop)
    for (let d = 0; d < drop; d++) {
      i = (i + 1) & 255;
      j = (j + S[i]) & 255;
      const tmp = S[i];
      S[i] = S[j];
      S[j] = tmp;
    }

    const out = new Uint8Array(textBytes.length);
    for (let k = 0; k < textBytes.length; k++) {
      i = (i + 1) & 255;
      j = (j + S[i]) & 255;
      const tmp = S[i];
      S[i] = S[j];
      S[j] = tmp;
      const K = S[(S[i] + S[j]) & 255];
      out[k] = textBytes[k] ^ K;
    }
    return out;
  }

  // --- RC5 Core (RC5-32/12/16) ---
  function rc5Setup(keyBytes, r = 12) {
    const P32 = 0xb7e15163 >>> 0;
    const Q32 = 0x9e3779b9 >>> 0;
    const c = Math.max(1, Math.floor(keyBytes.length / 4));
    const L = new Uint32Array(c);
    for (let i = 0; i < c; i++) {
      L[i] = (keyBytes[i * 4] | (keyBytes[i * 4 + 1] << 8) | (keyBytes[i * 4 + 2] << 16) | (keyBytes[i * 4 + 3] << 24)) >>> 0;
    }
    const t = 2 * (r + 1);
    const S = new Uint32Array(t);
    S[0] = P32;
    for (let i = 1; i < t; i++) {
      S[i] = (S[i - 1] + Q32) >>> 0;
    }
    let i = 0, j = 0, A = 0, B = 0;
    const loops = 3 * Math.max(t, c);
    for (let l = 0; l < loops; l++) {
      A = S[i] = rotl32((S[i] + A + B) >>> 0, 3);
      B = L[j] = rotl32((L[j] + A + B) >>> 0, (A + B) & 31);
      i = (i + 1) % t;
      j = (j + 1) % c;
    }
    return S;
  }

  function rc5Block(pt8, S, r = 12, mode = 'enc') {
    let A = (pt8[0] | (pt8[1] << 8) | (pt8[2] << 16) | (pt8[3] << 24)) >>> 0;
    let B = (pt8[4] | (pt8[5] << 8) | (pt8[6] << 16) | (pt8[7] << 24)) >>> 0;

    if (mode === 'enc') {
      A = (A + S[0]) >>> 0;
      B = (B + S[1]) >>> 0;
      for (let i = 1; i <= r; i++) {
        A = (rotl32(A ^ B, B) + S[2 * i]) >>> 0;
        B = (rotl32(B ^ A, A) + S[2 * i + 1]) >>> 0;
      }
    } else {
      for (let i = r; i >= 1; i--) {
        B = rotr32((B - S[2 * i + 1]) >>> 0, A) ^ A;
        A = rotr32((A - S[2 * i]) >>> 0, B) ^ B;
      }
      B = (B - S[1]) >>> 0;
      A = (A - S[0]) >>> 0;
    }

    const out = new Uint8Array(8);
    out[0] = A & 255; out[1] = (A >>> 8) & 255; out[2] = (A >>> 16) & 255; out[3] = (A >>> 24) & 255;
    out[4] = B & 255; out[5] = (B >>> 8) & 255; out[6] = (B >>> 16) & 255; out[7] = (B >>> 24) & 255;
    return out;
  }

  // --- RC6 Core (RC6-32/20/16, AES Finalist) ---
  function rc6Setup(keyBytes, r = 20) {
    const P32 = 0xb7e15163 >>> 0;
    const Q32 = 0x9e3779b9 >>> 0;
    const c = Math.max(1, Math.floor(keyBytes.length / 4));
    const L = new Uint32Array(c);
    for (let i = 0; i < c; i++) {
      L[i] = (keyBytes[i * 4] | (keyBytes[i * 4 + 1] << 8) | (keyBytes[i * 4 + 2] << 16) | (keyBytes[i * 4 + 3] << 24)) >>> 0;
    }
    const t = 2 * r + 4;
    const S = new Uint32Array(t);
    S[0] = P32;
    for (let i = 1; i < t; i++) {
      S[i] = (S[i - 1] + Q32) >>> 0;
    }
    let i = 0, j = 0, A = 0, B = 0;
    const loops = 3 * Math.max(t, c);
    for (let l = 0; l < loops; l++) {
      A = S[i] = rotl32((S[i] + A + B) >>> 0, 3);
      B = L[j] = rotl32((L[j] + A + B) >>> 0, (A + B) & 31);
      i = (i + 1) % t;
      j = (j + 1) % c;
    }
    return S;
  }

  function rc6Block(pt16, S, r = 20, mode = 'enc') {
    let A = (pt16[0] | (pt16[1] << 8) | (pt16[2] << 16) | (pt16[3] << 24)) >>> 0;
    let B = (pt16[4] | (pt16[5] << 8) | (pt16[6] << 16) | (pt16[7] << 24)) >>> 0;
    let C = (pt16[8] | (pt16[9] << 8) | (pt16[10] << 16) | (pt16[11] << 24)) >>> 0;
    let D = (pt16[12] | (pt16[13] << 8) | (pt16[14] << 16) | (pt16[15] << 24)) >>> 0;

    if (mode === 'enc') {
      B = (B + S[0]) >>> 0;
      D = (D + S[1]) >>> 0;
      for (let i = 1; i <= r; i++) {
        const t = rotl32(Math.imul(B, (2 * B + 1) >>> 0), 5);
        const u = rotl32(Math.imul(D, (2 * D + 1) >>> 0), 5);
        A = (rotl32(A ^ t, u) + S[2 * i]) >>> 0;
        C = (rotl32(C ^ u, t) + S[2 * i + 1]) >>> 0;
        const tmp = A; A = B; B = C; C = D; D = tmp;
      }
      A = (A + S[2 * r + 2]) >>> 0;
      C = (C + S[2 * r + 3]) >>> 0;
    } else {
      C = (C - S[2 * r + 3]) >>> 0;
      A = (A - S[2 * r + 2]) >>> 0;
      for (let i = r; i >= 1; i--) {
        const tmp = D; D = C; C = B; B = A; A = tmp;
        const u = rotl32(Math.imul(D, (2 * D + 1) >>> 0), 5);
        const t = rotl32(Math.imul(B, (2 * B + 1) >>> 0), 5);
        C = (rotr32((C - S[2 * i + 1]) >>> 0, t) ^ u) >>> 0;
        A = (rotr32((A - S[2 * i]) >>> 0, u) ^ t) >>> 0;
      }
      D = (D - S[1]) >>> 0;
      B = (B - S[0]) >>> 0;
    }

    const out = new Uint8Array(16);
    out[0] = A & 255; out[1] = (A >>> 8) & 255; out[2] = (A >>> 16) & 255; out[3] = (A >>> 24) & 255;
    out[4] = B & 255; out[5] = (B >>> 8) & 255; out[6] = (B >>> 16) & 255; out[7] = (B >>> 24) & 255;
    out[8] = C & 255; out[9] = (C >>> 8) & 255; out[10] = (C >>> 16) & 255; out[11] = (C >>> 24) & 255;
    out[12] = D & 255; out[13] = (D >>> 8) & 255; out[14] = (D >>> 16) & 255; out[15] = (D >>> 24) & 255;
    return out;
  }

  // --- IDEA Core (Lai & Massey, 1991) ---
  function mulModIdea(a, b) {
    a = a === 0 ? 65536 : a;
    b = b === 0 ? 65536 : b;
    const r = (a * b) % 65537;
    return r === 65536 ? 0 : r;
  }
  function invMulIdea(a) {
    if (a === 0) return 0;
    let res = 1, base = a, exp = 65535;
    while (exp > 0) {
      if (exp & 1) res = (res * base) % 65537;
      base = (base * base) % 65537;
      exp >>= 1;
    }
    return res;
  }
  function invAddIdea(a) { return (-a) & 0xffff; }

  function ideaExpandKey(keyBytes) {
    let keyInt = 0n;
    for (let i = 0; i < 16; i++) {
      keyInt = (keyInt << 8n) | BigInt(keyBytes[i]);
    }
    const subkeys = [];
    const mask128 = (1n << 128n) - 1n;
    for (let i = 0; i < 52; i++) {
      const shift = BigInt(128 - 16 * (i % 8) - 16);
      subkeys.push(Number((keyInt >> shift) & 0xffffn));
      if ((i % 8) === 7) {
        keyInt = ((keyInt << 25n) & mask128) | (keyInt >> (128n - 25n));
      }
    }
    return subkeys;
  }

  function ideaInvertKeys(ek) {
    const dk = new Array(52);
    dk[0] = invMulIdea(ek[48]);
    dk[1] = invAddIdea(ek[49]);
    dk[2] = invAddIdea(ek[50]);
    dk[3] = invMulIdea(ek[51]);
    dk[4] = ek[46];
    dk[5] = ek[47];
    for (let r = 1; r < 8; r++) {
      const s = 48 - r * 6;
      dk[r * 6] = invMulIdea(ek[s]);
      dk[r * 6 + 1] = invAddIdea(ek[s + 2]);
      dk[r * 6 + 2] = invAddIdea(ek[s + 1]);
      dk[r * 6 + 3] = invMulIdea(ek[s + 3]);
      dk[r * 6 + 4] = ek[s - 2];
      dk[r * 6 + 5] = ek[s - 1];
    }
    dk[48] = invMulIdea(ek[0]);
    dk[49] = invAddIdea(ek[1]);
    dk[50] = invAddIdea(ek[2]);
    dk[51] = invMulIdea(ek[3]);
    return dk;
  }

  function ideaCryptBlock(block8, subkeys) {
    let x1 = (block8[0] << 8) | block8[1];
    let x2 = (block8[2] << 8) | block8[3];
    let x3 = (block8[4] << 8) | block8[5];
    let x4 = (block8[6] << 8) | block8[7];

    for (let r = 0; r < 8; r++) {
      const k = r * 6;
      x1 = mulModIdea(x1, subkeys[k]);
      x2 = (x2 + subkeys[k + 1]) & 0xffff;
      x3 = (x3 + subkeys[k + 2]) & 0xffff;
      x4 = mulModIdea(x4, subkeys[k + 3]);

      const a = x1 ^ x3;
      const b = x2 ^ x4;
      const c = mulModIdea(a, subkeys[k + 4]);
      const d = (b + c) & 0xffff;
      const e = mulModIdea(d, subkeys[k + 5]);
      const f = (c + e) & 0xffff;

      x1 ^= e;
      x4 ^= f;
      const x2_new = x3 ^ e;
      const x3_new = x2 ^ f;
      x2 = x2_new;
      x3 = x3_new;
    }

    const tmp = x2; x2 = x3; x3 = tmp;
    const y1 = mulModIdea(x1, subkeys[48]);
    const y2 = (x2 + subkeys[49]) & 0xffff;
    const y3 = (x3 + subkeys[50]) & 0xffff;
    const y4 = mulModIdea(x4, subkeys[51]);

    const out = new Uint8Array(8);
    out[0] = (y1 >>> 8) & 255; out[1] = y1 & 255;
    out[2] = (y2 >>> 8) & 255; out[3] = y2 & 255;
    out[4] = (y3 >>> 8) & 255; out[5] = y3 & 255;
    out[6] = (y4 >>> 8) & 255; out[7] = y4 & 255;
    return out;
  }

  // --- Native Web Crypto AES (AES-CBC deterministic zero IV for demo) ---
  async function aesSubtleCrypt(keyBytes, dataBytes, mode = 'enc') {
    const key = await crypto.subtle.importKey('raw', keyBytes.slice(0, 16), { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']);
    const iv = new Uint8Array(16);
    if (mode === 'enc') {
      const ctBuf = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, dataBytes);
      return new Uint8Array(ctBuf);
    } else {
      const ptBuf = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, dataBytes);
      return new Uint8Array(ptBuf);
    }
  }

  // --- Educational Feistel Core (DES / GOST / CAST visualizer) ---
  function feistelSimulation(dataBytes, keyBytes, rounds, mode) {
    const padLen = 8 - (dataBytes.length % 8 || 8);
    let totalLen = dataBytes.length + (mode === 'enc' ? (padLen === 0 ? 8 : padLen) : 0);
    const padded = new Uint8Array(totalLen);
    padded.set(dataBytes);
    if (mode === 'enc') {
      for (let p = dataBytes.length; p < totalLen; p++) padded[p] = padLen === 0 ? 8 : padLen;
    }

    const out = new Uint8Array(padded.length);
    const trace = [];

    for (let b = 0; b < padded.length; b += 8) {
      let L = (padded[b] << 24) | (padded[b + 1] << 16) | (padded[b + 2] << 8) | padded[b + 3];
      let R = (padded[b + 4] << 24) | (padded[b + 5] << 16) | (padded[b + 6] << 8) | padded[b + 7];

      trace.push(`[كتلة ${Math.floor(b / 8) + 1}] L0=${(L >>> 0).toString(16).padStart(8, '0')}, R0=${(R >>> 0).toString(16).padStart(8, '0')}`);

      for (let r = 0; r < rounds; r++) {
        const subkey = (keyBytes[(r * 4) % keyBytes.length] << 24) |
                       (keyBytes[(r * 4 + 1) % keyBytes.length] << 16) |
                       (keyBytes[(r * 4 + 2) % keyBytes.length] << 8) |
                       (keyBytes[(r * 4 + 3) % keyBytes.length]);
        
        let F = (R ^ subkey) >>> 0;
        F = ((F << 11) | (F >>> 21)) ^ 0x5a5a5a5a;

        const nextR = (L ^ F) >>> 0;
        L = R;
        R = nextR;

        if (r < 2 || r === rounds - 1) {
          trace.push(`  دورة ${r + 1}: L=${(L >>> 0).toString(16).padStart(8, '0')}, R=${(R >>> 0).toString(16).padStart(8, '0')}`);
        }
      }

      out[b] = (R >>> 24) & 255;
      out[b + 1] = (R >>> 16) & 255;
      out[b + 2] = (R >>> 8) & 255;
      out[b + 3] = R & 255;
      out[b + 4] = (L >>> 24) & 255;
      out[b + 5] = (L >>> 16) & 255;
      out[b + 6] = (L >>> 8) & 255;
      out[b + 7] = L & 255;
    }

    return { out, trace };
  }

  // --- Hex Utilities ---
  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function hexToBytes(hex) {
    hex = hex.replace(/[^0-9a-fA-F]/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // --- Interactive Playground Handler ---
  function initPlayground() {
    const playBox = document.querySelector('.playground-box');
    if (!playBox) return;

    const cipherType = playBox.dataset.cipher || 'des';
    const textInput = playBox.querySelector('#plain-input');
    const keyInput = playBox.querySelector('#key-input');
    const btnEnc = playBox.querySelector('#btn-encrypt');
    const btnDec = playBox.querySelector('#btn-decrypt');
    const outputBox = playBox.querySelector('#output-box');
    const traceBox = playBox.querySelector('#trace-box');

    if (!btnEnc || !textInput || !keyInput || !outputBox) return;

    btnEnc.addEventListener('click', async () => {
      const text = textInput.value.trim();
      const pwd = keyInput.value.trim();
      if (!text || !pwd) {
        outputBox.innerText = 'يرجى إدخال النص والمفتاح أولاً.';
        return;
      }

      outputBox.innerText = 'جاري التشفير...';
      const keyHash = await sha256Bytes(pwd);
      const textBytes = new TextEncoder().encode(text);

      if (cipherType === 'rc4') {
        const ct = rc4Crypt(keyHash, textBytes);
        const hex = bytesToHex(ct);
        outputBox.innerText = hex;
        if (traceBox) {
          traceBox.innerHTML = `تم توليد تيار المفاتيح عبر KSA و PRGA بنجاح.<br>طول النص: ${textBytes.length} بايت<br>Ciphertext (Hex): <code>${hex}</code>`;
        }
      } else if (cipherType === 'rc4-drop') {
        const ct = rc4Crypt(keyHash, textBytes, 768);
        const hex = bytesToHex(ct);
        outputBox.innerText = hex;
        if (traceBox) {
          traceBox.innerHTML = `تم تطبيق خوارزمية RC4-drop768 بنجاح (تم إهمال أول 768 بايت لإلغاء الانحياز الإحصائي).<br>Ciphertext (Hex): <code>${hex}</code>`;
        }
      } else if (cipherType === 'rc5') {
        const S = rc5Setup(keyHash.slice(0, 16), 12);
        const padLen = 8 - (textBytes.length % 8);
        const padded = new Uint8Array(textBytes.length + padLen);
        padded.set(textBytes);
        for (let p = textBytes.length; p < padded.length; p++) padded[p] = padLen;

        const out = new Uint8Array(padded.length);
        for (let b = 0; b < padded.length; b += 8) {
          const blk = rc5Block(padded.subarray(b, b + 8), S, 12, 'enc');
          out.set(blk, b);
        }
        const hex = bytesToHex(out);
        outputBox.innerText = hex;
        if (traceBox) {
          traceBox.innerHTML = `تشفير RC5-32/12/16 مع دورات معتمدة على البيانات (Data-dependent Rotations).<br>عدد الكتل: ${padded.length / 8}<br>Ciphertext (Hex): <code>${hex}</code>`;
        }
      } else if (cipherType === 'rc6') {
        const S = rc6Setup(keyHash.slice(0, 16), 20);
        const padLen = 16 - (textBytes.length % 16);
        const padded = new Uint8Array(textBytes.length + padLen);
        padded.set(textBytes);
        for (let p = textBytes.length; p < padded.length; p++) padded[p] = padLen;

        const out = new Uint8Array(padded.length);
        for (let b = 0; b < padded.length; b += 16) {
          const blk = rc6Block(padded.subarray(b, b + 16), S, 20, 'enc');
          out.set(blk, b);
        }
        const hex = bytesToHex(out);
        outputBox.innerText = hex;
        if (traceBox) {
          traceBox.innerHTML = `تشفير RC6-32/20/16 المتأهل لنهائيات AES (4 سجلات ودالة تربيعية غير خطية).<br>عدد الكتل (128-bit): ${padded.length / 16}<br>Ciphertext (Hex): <code>${hex}</code>`;
        }
      } else if (cipherType === 'aes') {
        const ct = await aesSubtleCrypt(keyHash, textBytes, 'enc');
        const hex = bytesToHex(ct);
        outputBox.innerText = hex;
        if (traceBox) {
          traceBox.innerHTML = `تشفير AES-128 (شبكة استبدال وتبديل SPN مكونة من 10 دورات كاملة: SubBytes, ShiftRows, MixColumns, AddRoundKey).<br>طول النص المشفر: ${ct.length} بايت (${ct.length / 16} كتلة 128-بت)<br>Ciphertext (Hex): <code>${hex}</code>`;
        }
      } else if (cipherType === 'idea') {
        const ek = ideaExpandKey(keyHash.slice(0, 16));
        const padLen = 8 - (textBytes.length % 8);
        const padded = new Uint8Array(textBytes.length + padLen);
        padded.set(textBytes);
        for (let p = textBytes.length; p < padded.length; p++) padded[p] = padLen;

        const out = new Uint8Array(padded.length);
        for (let b = 0; b < padded.length; b += 8) {
          const blk = ideaCryptBlock(padded.subarray(b, b + 8), ek);
          out.set(blk, b);
        }
        const hex = bytesToHex(out);
        outputBox.innerText = hex;
        if (traceBox) {
          traceBox.innerHTML = `تشفير IDEA (Lai-Massey) عبر خلط 3 زمر جبرية متعارضة (XOR, + mod 2^16, × mod 65537) مع 52 مفتاحاً فرعياً.<br>عدد كتل (64-بت): ${padded.length / 8}<br>Ciphertext (Hex): <code>${hex}</code>`;
        }
      } else {
        const rounds = cipherType === 'gost' ? 32 : (cipherType === 'blowfish' ? 16 : (cipherType === 'cast' ? 16 : 16));
        const { out, trace } = feistelSimulation(textBytes, keyHash, rounds, 'enc');
        const hex = bytesToHex(out);
        outputBox.innerText = hex;
        if (traceBox) {
          traceBox.innerHTML = trace.join('<br>');
        }
      }
    });

    if (btnDec) {
      btnDec.addEventListener('click', async () => {
        const hex = outputBox.innerText.trim();
        const pwd = keyInput.value.trim();
        if (!hex || !pwd || hex.includes(' ')) {
          outputBox.innerText = 'يرجى توفير نص مشفر بصيغة Hex ومفتاح صالح.';
          return;
        }

        const keyHash = await sha256Bytes(pwd);
        const ctBytes = hexToBytes(hex);

        if (cipherType === 'rc4') {
          const pt = rc4Crypt(keyHash, ctBytes);
          outputBox.innerText = new TextDecoder().decode(pt);
          if (traceBox) traceBox.innerHTML = 'تم فك التشفير التدفقي (XOR متناظر)';
        } else if (cipherType === 'rc4-drop') {
          const pt = rc4Crypt(keyHash, ctBytes, 768);
          outputBox.innerText = new TextDecoder().decode(pt);
          if (traceBox) traceBox.innerHTML = 'تم فك تشفير RC4-drop768 بنجاح';
        } else if (cipherType === 'rc5') {
          const S = rc5Setup(keyHash.slice(0, 16), 12);
          const out = new Uint8Array(ctBytes.length);
          for (let b = 0; b < ctBytes.length; b += 8) {
            const blk = rc5Block(ctBytes.subarray(b, b + 8), S, 12, 'dec');
            out.set(blk, b);
          }
          const pad = out[out.length - 1];
          const unpadded = (pad > 0 && pad <= 8) ? out.slice(0, out.length - pad) : out;
          outputBox.innerText = new TextDecoder().decode(unpadded);
          if (traceBox) traceBox.innerHTML = 'تم فك تشفير RC5 بنجاح';
        } else if (cipherType === 'rc6') {
          const S = rc6Setup(keyHash.slice(0, 16), 20);
          const out = new Uint8Array(ctBytes.length);
          for (let b = 0; b < ctBytes.length; b += 16) {
            const blk = rc6Block(ctBytes.subarray(b, b + 16), S, 20, 'dec');
            out.set(blk, b);
          }
          const pad = out[out.length - 1];
          const unpadded = (pad > 0 && pad <= 16) ? out.slice(0, out.length - pad) : out;
          outputBox.innerText = new TextDecoder().decode(unpadded);
          if (traceBox) traceBox.innerHTML = 'تم فك تشفير RC6 بنجاح';
        } else if (cipherType === 'aes') {
          try {
            const pt = await aesSubtleCrypt(keyHash, ctBytes, 'dec');
            outputBox.innerText = new TextDecoder().decode(pt);
            if (traceBox) traceBox.innerHTML = 'تم فك تشفير AES-128 بنجاح عبر التحويلات العكسية (InvShiftRows, InvSubBytes, InvMixColumns)';
          } catch (e) {
            outputBox.innerText = 'خطأ في فك تشفير AES (تأكد من صحة المفتاح وبنية الكتل)';
          }
        } else if (cipherType === 'idea') {
          const ek = ideaExpandKey(keyHash.slice(0, 16));
          const dk = ideaInvertKeys(ek);
          const out = new Uint8Array(ctBytes.length);
          for (let b = 0; b < ctBytes.length; b += 8) {
            const blk = ideaCryptBlock(ctBytes.subarray(b, b + 8), dk);
            out.set(blk, b);
          }
          const pad = out[out.length - 1];
          const unpadded = (pad > 0 && pad <= 8) ? out.slice(0, out.length - pad) : out;
          outputBox.innerText = new TextDecoder().decode(unpadded);
          if (traceBox) traceBox.innerHTML = 'تم فك تشفير IDEA بنجاح بحساب معكوسات الزمر الجبرية (Mod 65537 multiplicative inverses & Mod 65536 additive inverses)';
        } else {
          const rounds = cipherType === 'gost' ? 32 : 16;
          const { out, trace } = feistelSimulation(ctBytes, keyHash, rounds, 'dec');
          const pad = out[out.length - 1];
          const unpadded = (pad > 0 && pad <= 8) ? out.slice(0, out.length - pad) : out;
          outputBox.innerText = new TextDecoder().decode(unpadded);
          if (traceBox) traceBox.innerHTML = 'تم فك تشفير الكتل بنجاح.';
        }
      });
    }
  }

  // --- Interactive Steganography Canvas Demo ---
  function initStegoCanvas() {
    const canvas = document.getElementById('stego-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;

    const grad = ctx.createLinearGradient(0, 0, 160, 120);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#a855f7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 160, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('صورة حاملة (Carrier)', 80, 65);

    const btnHide = document.getElementById('btn-stego-hide');
    const btnExtract = document.getElementById('btn-stego-extract');
    const stegoInput = document.getElementById('stego-text');
    const stegoOut = document.getElementById('stego-result');

    if (btnHide && stegoInput) {
      btnHide.addEventListener('click', () => {
        const text = stegoInput.value.trim();
        if (!text) {
          stegoOut.innerText = 'يرجى إدخال نص سري لإخفائه.';
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const textBytes = new TextEncoder().encode(text);
        const total = new Uint8Array(4 + textBytes.length);
        const len = textBytes.length;
        total[0] = (len >>> 24) & 255;
        total[1] = (len >>> 16) & 255;
        total[2] = (len >>> 8) & 255;
        total[3] = len & 255;
        total.set(textBytes, 4);

        let byteIdx = 0;
        let bitIdx = 7;
        let pixelIdx = 0;

        while (byteIdx < total.length && pixelIdx < data.length) {
          if (pixelIdx % 4 !== 3) {
            const bit = (total[byteIdx] >>> bitIdx) & 1;
            data[pixelIdx] = (data[pixelIdx] & ~1) | bit;
            bitIdx--;
            if (bitIdx < 0) {
              bitIdx = 7;
              byteIdx++;
            }
          }
          pixelIdx++;
        }

        ctx.putImageData(imgData, 0, 0);
        stegoOut.innerHTML = `<span style="color:var(--accent-emerald);">✔ تم إخفاء (${textBytes.length}) بايت بنجاح داخل LSB للصورة دون أي تشويه مرئي!</span>`;
      });
    }

    if (btnExtract) {
      btnExtract.addEventListener('click', () => {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let pixelIdx = 0;
        let len = 0;
        for (let b = 0; b < 32; b++) {
          while (pixelIdx % 4 === 3) pixelIdx++;
          const bit = data[pixelIdx] & 1;
          len = (len << 1) | bit;
          pixelIdx++;
        }

        if (len <= 0 || len > 5000) {
          stegoOut.innerText = 'لم يتم العثور على رسالة مخفية صالحة.';
          return;
        }

        const payload = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          let byteVal = 0;
          for (let bit = 7; bit >= 0; bit--) {
            while (pixelIdx % 4 === 3) pixelIdx++;
            byteVal = (byteVal << 1) | (data[pixelIdx] & 1);
            pixelIdx++;
          }
          payload[i] = byteVal;
        }

        const recovered = new TextDecoder().decode(payload);
        stegoOut.innerHTML = `<strong>الرسالة المستخرجة:</strong> <span style="color:var(--accent-cyan); font-family:var(--font-mono);">${recovered}</span>`;
      });
    }
  }

  // --- Tab Switching Logic ---
  function initTabs() {
    document.querySelectorAll('.tab-container').forEach(container => {
      const navButtons = container.querySelectorAll('.tab-btn');
      const panes = container.querySelectorAll('.tab-pane');
      navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          navButtons.forEach(b => b.classList.remove('active'));
          panes.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const targetPane = container.querySelector('#' + target);
          if (targetPane) targetPane.classList.add('active');
        });
      });
    });
  }

  // --- KaTeX Auto-Render for Mathematical Formulas ---
  function initKaTeX() {
    function tryRender() {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
          ignoredClasses: ['code-body', 'code-container', 'trace-log', 'output-box'],
          throwOnError: false
        });
        return true;
      }
      return false;
    }

    if (!tryRender()) {
      window.addEventListener('load', tryRender);
      setTimeout(tryRender, 200);
      setTimeout(tryRender, 600);
      setTimeout(tryRender, 1500);
    }
  }

  // --- Initialize on DOM ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initKaTeX();
    initCodeCopy();
    initPlayground();
    initStegoCanvas();
    initTabs();
  });
})();
