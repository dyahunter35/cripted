"use client";

import React, { useState, useMemo } from "react";
import { Zap, Activity, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { bytesToHex, sha256Bytes } from "@/lib/crypto/webcrypto-helper";
import { blockSize, createBlockCipher, flipBit } from "@/lib/crypto/engine";

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

  const bytesA = useMemo(() => new TextEncoder().encode(textA), [textA]);
  const bytesB = useMemo(() => flipBit(bytesA, bitFlipIndex), [bytesA, bitFlipIndex]);
  const textB = bytesToHex(bytesB);

  React.useEffect(() => {
    let cancelled = false;
    const compute = async () => {
      setCalculating(true);
      try {
        const key = await sha256Bytes("MasterSecretKeyForAvalanche2026");
        const size = blockSize(cipher);
        const encrypt = createBlockCipher(cipher, key);
        // Compare the block containing the flipped bit, without decoding binary as UTF-8.
        const offset = bytesA.length ? Math.floor((Math.floor(bitFlipIndex / 8) % bytesA.length) / size) * size : 0;
        const a = new Uint8Array(size), b = new Uint8Array(size);
        a.set(bytesA.subarray(offset, offset + size)); b.set(bytesB.subarray(offset, offset + size));
        const ctA = encrypt(a), ctB = encrypt(b);
        const bitsA = Array.from(ctA, v => v.toString(2).padStart(8, "0")).join("");
        const bitsB = Array.from(ctB, v => v.toString(2).padStart(8, "0")).join("");
        const flipped = Array.from(bitsA).filter((v, i) => v !== bitsB[i]).length;
        if (!cancelled) setResult(bytesA.length ? {
          hexA: bytesToHex(ctA), hexB: bytesToHex(ctB), bitsA, bitsB,
          flippedCount: flipped, totalBits: size * 8, percent: Math.round(flipped / (size * 8) * 1000) / 10,
        } : null);
      } finally {
        if (!cancelled) setCalculating(false);
      }
    };
    void compute().catch(() => { if (!cancelled) setResult(null); });
    return () => { cancelled = true; };
  }, [cipher, bytesA, bytesB, bitFlipIndex]);

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
              aria-pressed={cipher === c}
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
          <label htmlFor="avalanche-plaintext" className="text-[11px] font-bold text-primary block">
            النص الأصلي أ (Plaintext A):
          </label>
          <input
            type="text"
            id="avalanche-plaintext"
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground font-mono dir-ltr text-left"
          />
          <span className="text-[10px] text-muted-foreground">المدخل الأساسي</span>
        </div>

        <div className="space-y-1.5 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="avalanche-modified" className="text-[11px] font-bold text-amber-500">
              البايتات المعدلة ب (Hex - فارق بت واحد):
            </label>
            <button
              onClick={() => setBitFlipIndex((prev) => (prev + 1) % Math.max(1, bytesA.length * 8))}
              className="text-[10px] text-primary hover:underline"
            >
              تغيير موقع البت (بت #{bytesA.length ? bitFlipIndex % (bytesA.length * 8) : 0})
            </button>
          </div>
          <input
            type="text"
            id="avalanche-modified"
            value={textB}
            readOnly
            className="w-full rounded-md border border-amber-500/40 bg-background px-3 py-2 text-amber-400 font-mono dir-ltr text-left font-bold"
          />
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            {bytesA.length ? "يُشفّر البلوك الذي يحتوي على البت المعدل؛ يضاف صفر للبايتات الناقصة فقط." : "أدخل نصاً لبدء المقارنة."}
          </span>
        </div>
      </div>

      {/* Avalanche Percentage Meter */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-5 text-foreground space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-muted-foreground block">
                نسبة البتات المتغيرة في النص المشفر (Bit Flip Ratio):
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-extrabold text-primary">
                  {result.percent}%
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  ({result.flippedCount} بت انقلب من أصل {result.totalBits} بت)
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {result.percent >= 45 && result.percent <= 55
                  ? "هذه العينة قريبة من 50%؛ الحكم الإحصائي يتطلب عينات متعددة"
                  : "هذه العينة خارج نطاق 45–55%؛ لا تكفي وحدها للحكم على الخوارزمية"}
              </span>
            </div>
          </div>

          {/* Graphical Bit Matrix Preview */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] text-muted-foreground block font-mono">
              مصفوفة البتات المشفرة (الأخضر = بت تغيرت قيمته نتيجة البت الواحد المنقلب):
            </span>
            <div className="flex flex-wrap gap-1 p-3 rounded-lg bg-secondary/70 border border-border font-mono text-[10px] dir-ltr max-h-32 overflow-y-auto">
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
                        : "bg-muted/30 text-muted-foreground"
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
