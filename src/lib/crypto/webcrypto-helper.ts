/**
 * Crypto Lab - Interactive Client-Side Cryptographic Helper
 * Pure TypeScript implementations of educational cryptographic algorithms
 */

export async function sha256Bytes(str: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuf);
}

export function rotl32(x: number, y: number): number {
  y = y & 31;
  return (((x << y) | (x >>> (32 - y))) >>> 0);
}

export function rotr32(x: number, y: number): number {
  y = y & 31;
  return (((x >>> y) | (x << (32 - y))) >>> 0);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  hex = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// --- RC4 & RC4-drop ---
export function rc4Crypt(keyBytes: Uint8Array, textBytes: Uint8Array, drop = 0): Uint8Array {
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
export function rc5Setup(keyBytes: Uint8Array, r = 12): Uint32Array {
  const P32 = 0xb7e15163 >>> 0;
  const Q32 = 0x9e3779b9 >>> 0;
  const c = Math.max(1, Math.floor(keyBytes.length / 4));
  const L = new Uint32Array(c);
  for (let i = 0; i < c; i++) {
    L[i] =
      (keyBytes[i * 4] |
        (keyBytes[i * 4 + 1] << 8) |
        (keyBytes[i * 4 + 2] << 16) |
        (keyBytes[i * 4 + 3] << 24)) >>>
      0;
  }
  const t = 2 * (r + 1);
  const S = new Uint32Array(t);
  S[0] = P32;
  for (let i = 1; i < t; i++) {
    S[i] = (S[i - 1] + Q32) >>> 0;
  }
  let i = 0,
    j = 0,
    A = 0,
    B = 0;
  const loops = 3 * Math.max(t, c);
  for (let l = 0; l < loops; l++) {
    A = S[i] = rotl32((S[i] + A + B) >>> 0, 3);
    B = L[j] = rotl32((L[j] + A + B) >>> 0, (A + B) & 31);
    i = (i + 1) % t;
    j = (j + 1) % c;
  }
  return S;
}

export function rc5Block(pt8: Uint8Array, S: Uint32Array, r = 12, mode: "enc" | "dec" = "enc"): Uint8Array {
  let A = (pt8[0] | (pt8[1] << 8) | (pt8[2] << 16) | (pt8[3] << 24)) >>> 0;
  let B = (pt8[4] | (pt8[5] << 8) | (pt8[6] << 16) | (pt8[7] << 24)) >>> 0;

  if (mode === "enc") {
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
  out[0] = A & 255;
  out[1] = (A >>> 8) & 255;
  out[2] = (A >>> 16) & 255;
  out[3] = (A >>> 24) & 255;
  out[4] = B & 255;
  out[5] = (B >>> 8) & 255;
  out[6] = (B >>> 16) & 255;
  out[7] = (B >>> 24) & 255;
  return out;
}

// --- RC6 Core (RC6-32/20/16, AES Finalist) ---
export function rc6Setup(keyBytes: Uint8Array, r = 20): Uint32Array {
  const P32 = 0xb7e15163 >>> 0;
  const Q32 = 0x9e3779b9 >>> 0;
  const c = Math.max(1, Math.floor(keyBytes.length / 4));
  const L = new Uint32Array(c);
  for (let i = 0; i < c; i++) {
    L[i] =
      (keyBytes[i * 4] |
        (keyBytes[i * 4 + 1] << 8) |
        (keyBytes[i * 4 + 2] << 16) |
        (keyBytes[i * 4 + 3] << 24)) >>>
      0;
  }
  const t = 2 * r + 4;
  const S = new Uint32Array(t);
  S[0] = P32;
  for (let i = 1; i < t; i++) {
    S[i] = (S[i - 1] + Q32) >>> 0;
  }
  let i = 0,
    j = 0,
    A = 0,
    B = 0;
  const loops = 3 * Math.max(t, c);
  for (let l = 0; l < loops; l++) {
    A = S[i] = rotl32((S[i] + A + B) >>> 0, 3);
    B = L[j] = rotl32((L[j] + A + B) >>> 0, (A + B) & 31);
    i = (i + 1) % t;
    j = (j + 1) % c;
  }
  return S;
}

export function rc6Block(pt16: Uint8Array, S: Uint32Array, r = 20, mode: "enc" | "dec" = "enc"): Uint8Array {
  let A = (pt16[0] | (pt16[1] << 8) | (pt16[2] << 16) | (pt16[3] << 24)) >>> 0;
  let B = (pt16[4] | (pt16[5] << 8) | (pt16[6] << 16) | (pt16[7] << 24)) >>> 0;
  let C = (pt16[8] | (pt16[9] << 8) | (pt16[10] << 16) | (pt16[11] << 24)) >>> 0;
  let D = (pt16[12] | (pt16[13] << 8) | (pt16[14] << 16) | (pt16[15] << 24)) >>> 0;

  if (mode === "enc") {
    B = (B + S[0]) >>> 0;
    D = (D + S[1]) >>> 0;
    for (let i = 1; i <= r; i++) {
      const t = rotl32(Math.imul(B, (2 * B + 1) >>> 0), 5);
      const u = rotl32(Math.imul(D, (2 * D + 1) >>> 0), 5);
      A = (rotl32(A ^ t, u) + S[2 * i]) >>> 0;
      C = (rotl32(C ^ u, t) + S[2 * i + 1]) >>> 0;
      const tmp = A;
      A = B;
      B = C;
      C = D;
      D = tmp;
    }
    A = (A + S[2 * r + 2]) >>> 0;
    C = (C + S[2 * r + 3]) >>> 0;
  } else {
    C = (C - S[2 * r + 3]) >>> 0;
    A = (A - S[2 * r + 2]) >>> 0;
    for (let i = r; i >= 1; i--) {
      const tmp = D;
      D = C;
      C = B;
      B = A;
      A = tmp;
      const u = rotl32(Math.imul(D, (2 * D + 1) >>> 0), 5);
      const t = rotl32(Math.imul(B, (2 * B + 1) >>> 0), 5);
      C = (rotr32((C - S[2 * i + 1]) >>> 0, t) ^ u) >>> 0;
      A = (rotr32((A - S[2 * i]) >>> 0, u) ^ t) >>> 0;
    }
    D = (D - S[1]) >>> 0;
    B = (B - S[0]) >>> 0;
  }

  const out = new Uint8Array(16);
  out[0] = A & 255;
  out[1] = (A >>> 8) & 255;
  out[2] = (A >>> 16) & 255;
  out[3] = (A >>> 24) & 255;
  out[4] = B & 255;
  out[5] = (B >>> 8) & 255;
  out[6] = (B >>> 16) & 255;
  out[7] = (B >>> 24) & 255;
  out[8] = C & 255;
  out[9] = (C >>> 8) & 255;
  out[10] = (C >>> 16) & 255;
  out[11] = (C >>> 24) & 255;
  out[12] = D & 255;
  out[13] = (D >>> 8) & 255;
  out[14] = (D >>> 16) & 255;
  out[15] = (D >>> 24) & 255;
  return out;
}

// --- IDEA Core ---
function mulModIdea(a: number, b: number): number {
  a = a === 0 ? 65536 : a;
  b = b === 0 ? 65536 : b;
  const r = (a * b) % 65537;
  return r === 65536 ? 0 : r;
}

function invMulIdea(a: number): number {
  if (a === 0) return 0;
  let res = 1,
    base = a,
    exp = 65535;
  while (exp > 0) {
    if (exp & 1) res = (res * base) % 65537;
    base = (base * base) % 65537;
    exp >>= 1;
  }
  return res;
}

function invAddIdea(a: number): number {
  return (-a) & 0xffff;
}

export function ideaExpandKey(keyBytes: Uint8Array): number[] {
  let keyInt = 0n;
  for (let i = 0; i < 16; i++) {
    keyInt = (keyInt << 8n) | BigInt(keyBytes[i]);
  }
  const subkeys: number[] = [];
  const mask128 = (1n << 128n) - 1n;
  for (let i = 0; i < 52; i++) {
    const shift = BigInt(128 - 16 * (i % 8) - 16);
    subkeys.push(Number((keyInt >> shift) & 0xffffn));
    if (i % 8 === 7) {
      keyInt = ((keyInt << 25n) & mask128) | (keyInt >> (128n - 25n));
    }
  }
  return subkeys;
}

export function ideaInvertKeys(ek: number[]): number[] {
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

export function ideaCryptBlock(block8: Uint8Array, subkeys: number[]): Uint8Array {
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

  const tmp = x2;
  x2 = x3;
  x3 = tmp;
  const y1 = mulModIdea(x1, subkeys[48]);
  const y2 = (x2 + subkeys[49]) & 0xffff;
  const y3 = (x3 + subkeys[50]) & 0xffff;
  const y4 = mulModIdea(x4, subkeys[51]);

  const out = new Uint8Array(8);
  out[0] = (y1 >>> 8) & 255;
  out[1] = y1 & 255;
  out[2] = (y2 >>> 8) & 255;
  out[3] = y2 & 255;
  out[4] = (y3 >>> 8) & 255;
  out[5] = y3 & 255;
  out[6] = (y4 >>> 8) & 255;
  out[7] = y4 & 255;
  return out;
}

// --- SubtleCrypto AES-CBC Helper ---
export async function aesSubtleCrypt(
  keyBytes: Uint8Array,
  dataBytes: Uint8Array,
  mode: "enc" | "dec" = "enc"
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.slice(0, 16) as BufferSource,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
  const iv = new Uint8Array(16);
  if (mode === "enc") {
    const ctBuf = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, dataBytes as BufferSource);
    return new Uint8Array(ctBuf);
  } else {
    const ptBuf = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, dataBytes as BufferSource);
    return new Uint8Array(ptBuf);
  }
}

// --- Feistel Simulation Engine (DES / GOST / Blowfish / CAST) ---
export function feistelSimulation(
  dataBytes: Uint8Array,
  keyBytes: Uint8Array,
  rounds: number,
  mode: "enc" | "dec"
): { out: Uint8Array; trace: string[] } {
  const padLen = 8 - (dataBytes.length % 8 || 8);
  const totalLen = dataBytes.length + (mode === "enc" ? (padLen === 0 ? 8 : padLen) : 0);
  const padded = new Uint8Array(totalLen);
  padded.set(dataBytes);
  if (mode === "enc") {
    for (let p = dataBytes.length; p < totalLen; p++) padded[p] = padLen === 0 ? 8 : padLen;
  }

  const out = new Uint8Array(padded.length);
  const trace: string[] = [];

  for (let b = 0; b < padded.length; b += 8) {
    let L = (padded[b] << 24) | (padded[b + 1] << 16) | (padded[b + 2] << 8) | padded[b + 3];
    let R = (padded[b + 4] << 24) | (padded[b + 5] << 16) | (padded[b + 6] << 8) | padded[b + 7];

    trace.push(
      `[كتلة ${Math.floor(b / 8) + 1}] L0=${(L >>> 0).toString(16).padStart(8, "0")}, R0=${(R >>> 0).toString(16).padStart(8, "0")}`
    );

    for (let r = 0; r < rounds; r++) {
      const subkey =
        (keyBytes[(r * 4) % keyBytes.length] << 24) |
        (keyBytes[(r * 4 + 1) % keyBytes.length] << 16) |
        (keyBytes[(r * 4 + 2) % keyBytes.length] << 8) |
        keyBytes[(r * 4 + 3) % keyBytes.length];

      let F = (R ^ subkey) >>> 0;
      F = ((F << 11) | (F >>> 21)) ^ 0x5a5a5a5a;

      const nextR = (L ^ F) >>> 0;
      L = R;
      R = nextR;

      if (r < 2 || r === rounds - 1) {
        trace.push(
          `  دورة ${r + 1}: L=${(L >>> 0).toString(16).padStart(8, "0")}, R=${(R >>> 0).toString(16).padStart(8, "0")}`
        );
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
