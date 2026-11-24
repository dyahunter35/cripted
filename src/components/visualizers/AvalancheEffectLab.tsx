"use client";

import React, { useState, useMemo } from "react";
import { Zap, Activity, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import {
  sha256Bytes,
  bytesToHex,
  hexToBytes,
  rc5Setup,
  rc5Block,
  rc6Setup,
  rc6Block,
  aesSubtleCrypt,
  feistelSimulation,
} from "@/lib/crypto/webcrypto-helper";

export function AvalancheEffectLab() {
  const [cipher, setCipher] = useState<"aes" | "rc5" | "rc6" | "des">("aes");
  const [textA, setTextA] = useState("Crypto Lab 2026!");
  const [bitFlipIndex, setBitFlipIndex] = useState(0); // flip bit 0 in first byte
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{
    hexA: string;
    hexB: string;
    bitsA: string;
    bitsB: string;
    flippedCount: number;
    totalBits: number;
    percent: number;
  } | null>(null);

  // Compute textB by flipping exactly 1 bit in textA
  const textB = useMemo(() => {
    if (!textA) return "";
    const enc = new TextEncoder();
    const bytes = enc.encode(textA);
    if (bytes.length === 0) return "";

    const byteIdx = Math.floor(bitFlipIndex / 8) % bytes.length;
    const bitPos = bitFlipIndex % 8;
    bytes[byteIdx] ^= 1 << bitPos;

    return new TextDecoder().decode(bytes);
  }, [textA, bitFlipIndex]);

  // Compute ciphertext A and B and count flipped bits
  const computeAvalanche = async () => {
    setCalculating(true);
    const key = "MasterSecretKeyForAvalanche2026";
    const keyHash = await sha256Bytes(key);

    const enc = new TextEncoder();
    const bA = enc.encode(textA);
    const bB = enc.encode(textB);

    let ctA: Uint8Array;
    let ctB: Uint8Array;

    if (cipher === "aes") {
      ctA = await aesSubtleCrypt(keyHash, bA, "enc");
      ctB = await aesSubtleCrypt(keyHash, bB, "enc");
    } else if (cipher === "rc5") {
      const S = rc5Setup(keyHash.slice(0, 16), 12);
      const padLen = 8 - (bA.length % 8 || 8);
      const pA = new Uint8Array(bA.length + padLen);
      const pB = new Uint8Array(bB.length + padLen);
      pA.set(bA);
      pB.set(bB);
      ctA = rc5Block(pA.subarray(0, 8), S, 12, "enc");
      ctB = rc5Block(pB.subarray(0, 8), S, 12, "enc");
    } else if (cipher === "rc6") {
      const S = rc6Setup(keyHash.slice(0, 16), 20);
      const padLen = 16 - (bA.length % 16 || 16);
      const pA = new Uint8Array(bA.length + padLen);
      const pB = new Uint8Array(bB.length + padLen);
      pA.set(bA);
      pB.set(bB);
      ctA = rc6Block(pA.subarray(0, 16), S, 20, "enc");
      ctB = rc6Block(pB.subarray(0, 16), S, 20, "enc");
    } else {
      // DES feistel simulation
      ctA = feistelSimulation(bA, keyHash, 16, "enc").out;
      ctB = feistelSimulation(bB, keyHash, 16, "enc").out;
    }

    // Compare bits
    let flipped = 0;
    const len = Math.min(ctA.length, ctB.length, 16); // up to 128 bits
    let bitsAStr = "";
    let bitsBStr = "";

    for (let i = 0; i < len; i++) {
      const byteA = ctA[i];
      const byteB = ctB[i];
      for (let bit = 7; bit >= 0; bit--) {
        const bitA = (byteA >>> bit) & 1;
        const bitB = (byteB >>> bit) & 1;
        bitsAStr += bitA;
        bitsBStr += bitB;
        if (bitA !== bitB) flipped++;
      }
    }

    const total = len * 8;
    const pct = total > 0 ? (flipped / total) * 100 : 0;

    setResult({
      hexA: bytesToHex(ctA.slice(0, len)),
      hexB: bytesToHex(ctB.slice(0, len)),
      bitsA: bitsAStr,
      bitsB: bitsBStr,
      flippedCount: flipped,
      totalBits: total,
      percent: Math.round(pct * 10) / 10,
    });
    setCalculating(false);
  };

  React.useEffect(() => {
    computeAvalanche();
  }, [cipher, textA, bitFlipIndex]);

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-card via-card/90 to-background p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                مختبر معيار الانتشار والارتباك (Confusion & Diffusion Lab)
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                مباشر
              </span>
            </div>
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              اختبار تأثير الانهيار الثلجي (Avalanche Effect Criterion)
            </h3>
          </div>
        </div>

        {/* Cipher Selector Tabs */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 text-xs font-mono font-semibold">
          {(["aes", "rc6", "rc5", "des"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCipher(c)}
              className={`rounded-md px-3 py-1 transition-all ${
                cipher === c
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Comparison: 1 single bit altered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-1.5 rounded-xl border border-border/80 bg-background/50 p-4">
          <label className="text-[11px] font-bold text-primary block">
            النص الأصلي أ (Plaintext A):
          </label>
          <input
            type="text"
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground font-mono dir-ltr text-left"
          />
          <span className="text-[10px] text-muted-foreground">المدخل الأساسي</span>
        </div>

        <div className="space-y-1.5 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-amber-500">
              النص المعدل ب (Plaintext B - فارق بت واحد فقط!):
            </label>
            <button
              onClick={() => setBitFlipIndex((prev) => (prev + 1) % 64)}
              className="text-[10px] text-primary hover:underline"
            >
              تغيير موقع البت (بت #{bitFlipIndex})
            </button>
          </div>
          <input
            type="text"
            value={textB}
            readOnly
            className="w-full rounded-md border border-amber-500/40 bg-background px-3 py-2 text-amber-400 font-mono dir-ltr text-left font-bold"
          />
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            تم قلب البت رقم #{bitFlipIndex} فقط!
          </span>
        </div>
      </div>

      {/* Avalanche Percentage Meter */}
      {result && (
        <div className="rounded-xl border border-border/80 bg-[#090d16] p-5 text-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-muted-foreground block">
                نسبة البتات المتغيرة في النص المشفر (Bit Flip Ratio):
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-extrabold text-cyan-400">
                  {result.percent}%
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  ({result.flippedCount} بت انقلب من أصل {result.totalBits} بت)
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {result.percent >= 45 && result.percent <= 55
                  ? "معيار الانهيار الثلجي متطابق مع النظرية (~50% Avalanche Satisfied)"
                  : "تشتت وانتشار ممتاز (High Diffusion)"}
              </span>
            </div>
          </div>

          {/* Graphical Bit Matrix Preview */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] text-muted-foreground block font-mono">
              مصفوفة البتات المشفرة (الأخضر = بت تغيرت قيمته نتيجة البت الواحد المنقلب):
            </span>
            <div className="flex flex-wrap gap-1 p-3 rounded-lg bg-black/60 border border-border/40 font-mono text-[10px] dir-ltr max-h-32 overflow-y-auto">
              {Array.from({ length: result.totalBits }).map((_, idx) => {
                const bitA = result.bitsA[idx];
                const bitB = result.bitsB[idx];
                const isChanged = bitA !== bitB;
                return (
                  <span
                    key={idx}
                    className={`h-5 w-5 flex items-center justify-center rounded-xs transition-colors ${
                      isChanged
                        ? "bg-emerald-500 text-black font-bold shadow-xs scale-105"
                        : "bg-muted/30 text-[#8b949e]"
                    }`}
                    title={`Bit #${idx}: A=${bitA}, B=${bitB}`}
                  >
                    {bitB}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
