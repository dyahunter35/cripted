"use client";

import React, { useState } from "react";
import { Cpu, RotateCcw, Play, ArrowRight, Layers, Sparkles, Activity } from "lucide-react";

interface AlgorithmVisualizerProps {
  algorithmSlug: string;
  algorithmName: string;
}

export function AlgorithmVisualizer({
  algorithmSlug,
  algorithmName,
}: AlgorithmVisualizerProps) {
  const [roundStep, setRoundStep] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("interactive");

  // Determine architecture family
  const isFeistel = ["des", "gost", "cast", "blowfish"].includes(algorithmSlug);
  const isSPN = algorithmSlug === "aes";
  const isStream = algorithmSlug === "rc4";
  const isAlgebraic = algorithmSlug === "idea";
  const isRotations = ["rc5", "rc6"].includes(algorithmSlug);

  const maxRounds =
    algorithmSlug === "des"
      ? 16
      : algorithmSlug === "gost"
      ? 32
      : algorithmSlug === "aes"
      ? 10
      : algorithmSlug === "rc6"
      ? 20
      : algorithmSlug === "rc5"
      ? 12
      : 16;

  const nextRound = () => {
    setRoundStep((prev) => (prev >= maxRounds ? 1 : prev + 1));
  };

  const resetRound = () => {
    setRoundStep(1);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/90 via-card to-background p-5 sm:p-6 shadow-lg backdrop-blur-md space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary border border-primary/30 shadow-xs">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                المختبر البصري الهندسي (Visual Architecture Engine)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-2.5 w-2.5" /> تفاعلي حي
              </span>
            </div>
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              المحاكاة البصرية للمعمارية الهندسية الداخلية — {algorithmName}
            </h3>
          </div>
        </div>

        {/* Round Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetRound}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="إعادة تعيين للدورة الأولى"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-foreground font-semibold">
            <span className="text-muted-foreground text-[11px]">الدورة:</span>
            <span className="text-primary font-bold">{roundStep}</span>
            <span className="text-muted-foreground text-[10px]">/ {maxRounds}</span>
          </div>
          <button
            onClick={nextRound}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors"
          >
            <span>الدورة التالية</span>
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Architecture Visualizer Body */}
      {isFeistel && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-[#0a0e17] p-5 text-white font-mono text-xs dir-ltr">
            <div className="text-center text-cyan-400 font-bold mb-4">
              === Feistel Network Round {roundStep} of {maxRounds} ===
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              {/* Left Half */}
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-3 text-center space-y-2">
                <div className="text-cyan-300 font-bold">L_{roundStep - 1} (32-bit)</div>
                <div className="rounded bg-black/60 p-2 text-[11px] text-cyan-200">
                  {`0x${((roundStep * 0x12345678) >>> 0).toString(16).padStart(8, "0")}`}
                </div>
              </div>

              {/* Right Half */}
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3 text-center space-y-2">
                <div className="text-emerald-300 font-bold">R_{roundStep - 1} (32-bit)</div>
                <div className="rounded bg-black/60 p-2 text-[11px] text-emerald-200">
                  {`0x${((roundStep * 0x87654321) >>> 0).toString(16).padStart(8, "0")}`}
                </div>
              </div>
            </div>

            {/* F-Function and Swap Path */}
            <div className="my-4 flex flex-col items-center justify-center space-y-2">
              <div className="rounded-md border border-amber-500/40 bg-amber-950/30 px-4 py-2 text-amber-300 text-center font-bold text-xs shadow-md">
                F-Function: S-Boxes & Subkey K_{roundStep}
              </div>
              <div className="text-muted-foreground text-[11px]">
                L_{roundStep} = R_{roundStep - 1} &nbsp;&nbsp;|&nbsp;&nbsp; R_{roundStep} = L_{roundStep - 1} ⊕ F(R_{roundStep - 1}, K_{roundStep})
              </div>
            </div>

            {/* Results of Current Round */}
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-2 border-t border-border/40">
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground block">الناتج الأيسر الجديد L_{roundStep}:</span>
                <span className="text-emerald-300 font-bold">
                  {`0x${((roundStep * 0x87654321) >>> 0).toString(16).padStart(8, "0")}`}
                </span>
              </div>
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-2.5 text-center">
                <span className="text-[10px] text-muted-foreground block">الناتج الأيمن الجديد R_{roundStep}:</span>
                <span className="text-cyan-300 font-bold">
                  {`0x${(((roundStep * 0x12345678) ^ 0x5a5a5a5a) >>> 0).toString(16).padStart(8, "0")}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSPN && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-[#0a0e17] p-5 text-white font-mono text-xs dir-ltr">
            <div className="text-center text-cyan-400 font-bold mb-3">
              === AES-128 State Matrix (4×4 Bytes) — Round {roundStep} / 10 ===
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center my-4">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2.5">
                <div className="text-cyan-400 font-bold mb-1">1. SubBytes</div>
                <p className="text-[10px] text-muted-foreground">GF(2^8) Non-linear S-Box Inversion</p>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-2.5">
                <div className="text-blue-400 font-bold mb-1">2. ShiftRows</div>
                <p className="text-[10px] text-muted-foreground">Cyclic shifts (0, 1, 2, 3 bytes)</p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                <div className="text-emerald-400 font-bold mb-1">3. MixColumns</div>
                <p className="text-[10px] text-muted-foreground">MDS matrix polynomial diffusion</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5">
                <div className="text-amber-400 font-bold mb-1">4. AddRoundKey</div>
                <p className="text-[10px] text-muted-foreground">Bitwise XOR with Subkey {roundStep}</p>
              </div>
            </div>

            {/* 4x4 State Grid */}
            <div className="max-w-xs mx-auto border border-border/50 rounded-lg p-2 bg-black/50">
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const r = idx % 4;
                  const c = Math.floor(idx / 4);
                  const byteVal = ((roundStep * 17 + idx * 23) % 256)
                    .toString(16)
                    .padStart(2, "0");
                  return (
                    <div
                      key={idx}
                      className="rounded bg-primary/20 border border-primary/40 py-1.5 text-xs font-bold text-cyan-300 hover:bg-primary/40 transition-colors"
                      title={`State[${r},${c}]`}
                    >
                      {byteVal}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {isStream && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-[#0a0e17] p-5 text-white font-mono text-xs dir-ltr">
            <div className="text-center text-cyan-400 font-bold mb-3">
              === RC4 Stream Cipher: S-Box Permutation (256 Bytes State) ===
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto my-3">
              {Array.from({ length: 16 }).map((_, idx) => {
                const sVal = (idx * 16 + roundStep * 5) % 256;
                const isI = idx === (roundStep % 16);
                const isJ = idx === ((roundStep * 3) % 16);
                return (
                  <div
                    key={idx}
                    className={`h-9 w-9 flex flex-col items-center justify-center rounded border font-mono text-xs ${
                      isI
                        ? "border-cyan-400 bg-cyan-500/30 text-white font-bold"
                        : isJ
                        ? "border-amber-400 bg-amber-500/30 text-amber-200 font-bold"
                        : "border-border/40 bg-black/40 text-muted-foreground"
                    }`}
                  >
                    <span className="text-[9px] text-[#8b949e]">{idx}</span>
                    <span>{sVal.toString(16).padStart(2, "0")}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-muted-foreground">
              مؤشر <span className="text-cyan-400 font-bold">i</span> ومؤشر <span className="text-amber-400 font-bold">j</span> يتبادلان المواقع باستمرار لإنتاج تيار عشوائي كاذب PRGA.
            </div>
          </div>
        </div>
      )}

      {isAlgebraic && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-[#0a0e17] p-5 text-white font-mono text-xs dir-ltr">
            <div className="text-center text-cyan-400 font-bold mb-3">
              === IDEA Group Mixer: 3 Incompatible Algebraic Operations ===
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center my-3 max-w-xl mx-auto">
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/20 p-3">
                <div className="text-base text-cyan-300 font-bold mb-1">XOR (⊕)</div>
                <div className="text-[11px] text-muted-foreground">الزمرة الثنائية (GF(2)^16)</div>
              </div>
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3">
                <div className="text-base text-emerald-300 font-bold mb-1">ADD (⊞ mod 2^16)</div>
                <div className="text-[11px] text-muted-foreground">زمرة الجمع النمطي للأعداد الصحيحة</div>
              </div>
              <div className="rounded-lg border border-purple-500/40 bg-purple-950/20 p-3">
                <div className="text-base text-purple-300 font-bold mb-1">MUL (⊙ mod 65537)</div>
                <div className="text-[11px] text-muted-foreground">زمرة الضرب بعدد فيرما الأولي F4</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRotations && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-[#0a0e17] p-5 text-white font-mono text-xs dir-ltr">
            <div className="text-center text-cyan-400 font-bold mb-3">
              === Data-Dependent Word Rotations & Non-linear Mixing ===
            </div>
            <div className="max-w-md mx-auto rounded-lg border border-border/40 bg-black/60 p-4 text-center space-y-2">
              <div className="text-xs text-amber-300 font-bold">
                {algorithmSlug === "rc6"
                  ? "f(x) = (x × (2x + 1)) ⋘ 5"
                  : "A = ((A ⊕ B) ⋘ B) + S[2 × round]"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                مقدار الدوران الحلقي للبتات يتغير ديناميكياً بناءً على محتوى الكلمة المعالجة وليس ثابتاً، مما يحصن الخوارزمية ضد التحليل التفاضلي.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
