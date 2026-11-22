/**
 * Crypto Lab - Interactive UI and Client-side Cryptographic Helper
 * Educational platform for learning DES, GOST, RC4, CAST-128 & Steganography
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

  // --- Educational Stream Cipher (RC4) ---
  function rc4Crypt(keyBytes, textBytes) {
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

  // --- Educational Feistel Core (Used for interactive visualizer) ---
  function feistelSimulation(dataBytes, keyBytes, rounds, mode) {
    // Pads to 8 bytes block
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
        
        // Non-linear round function F (XOR, rot, S-box simulation)
        let F = (R ^ subkey) >>> 0;
        F = ((F << 11) | (F >>> 21)) ^ 0x5a5a5a5a;

        const nextR = (L ^ F) >>> 0;
        L = R;
        R = nextR;

        if (r < 2 || r === rounds - 1) {
          trace.push(`  دورة ${r + 1}: L=${(L >>> 0).toString(16).padStart(8, '0')}, R=${(R >>> 0).toString(16).padStart(8, '0')}`);
        }
      }

      // Final swap
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
      } else {
        const rounds = cipherType === 'gost' ? 32 : (cipherType === 'cast' ? 16 : 16);
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
        } else {
          // Feistel symmetric reverse
          const rounds = cipherType === 'gost' ? 32 : 16;
          const { out, trace } = feistelSimulation(ctBytes, keyHash, rounds, 'dec');
          // unpad PKCS7
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

    // Draw colorful pattern
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

        // Encode length (32-bit big endian) + string bytes
        const textBytes = new TextEncoder().encode(text);
        const total = new Uint8Array(4 + textBytes.length);
        const len = textBytes.length;
        total[0] = (len >>> 24) & 255;
        total[1] = (len >>> 16) & 255;
        total[2] = (len >>> 8) & 255;
        total[3] = len & 255;
        total.set(textBytes, 4);

        // Embed into LSB of RGB channels
        let byteIdx = 0;
        let bitIdx = 7;
        let pixelIdx = 0;

        while (byteIdx < total.length && pixelIdx < data.length) {
          if (pixelIdx % 4 !== 3) { // Skip alpha
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
        // Read 32-bit length
        let len = 0;
        for (let b = 0; b < 32; b++) {
          while (pixelIdx % 4 === 3) pixelIdx++; // skip alpha
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

  // --- Initialize on DOM ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initCodeCopy();
    initPlayground();
    initStegoCanvas();
  });
})();
