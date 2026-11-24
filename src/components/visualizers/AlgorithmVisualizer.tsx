"use client";

import React, { useState } from "react";
import { ArrowRight, RotateCcw, Shuffle, Sparkles, Activity, Layers, Play } from "lucide-react";

interface AlgorithmVisualizerProps {
  algorithmSlug: string;
  algorithmName: string;
}

export function AlgorithmVisualizer({
  algorithmSlug,
  algorithmName,
}: AlgorithmVisualizerProps) {
  const [roundStep, setRoundStep] = useState(1);

  // Maximum rounds depending on cipher family
  const getMaxRounds = () => {
    switch (algorithmSlug) {
      case "aes":
        return 10;
      case "des":
        return 16;
      case "blowfish":
        return 16;
      case "cast":
        return 16;
      case "gost":
        return 32;
      case "idea":
        return 8;
      case "rc5":
        return 12;
      case "rc6":
        return 20;
      case "rc4":
        return 16;
      default:
        return 16;
    }
  };

  const maxRounds = getMaxRounds();

  const nextRound = () => {
    setRoundStep((prev) => (prev >= maxRounds ? 1 : prev + 1));
  };

  const prevRound = () => {
    setRoundStep((prev) => (prev <= 1 ? maxRounds : prev - 1));
  };

  const resetRounds = () => {
    setRoundStep(1);
  };

  const isFeistel = ["des", "blowfish", "cast", "gost"].includes(algorithmSlug);
  const isSPN = algorithmSlug === "aes";
  const isStream = algorithmSlug === "rc4";
  const isAlgebraic = algorithmSlug === "idea";
  const isRotations = ["rc5", "rc6"].includes(algorithmSlug);

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-5 sm:p-6 shadow-sm space-y-5">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-foreground text-sm sm:text-base">
              محاكي المعمارية الهندسية ومسار الدورات (Architecture Visualizer)
            </h3>
            <p className="text-xs text-muted-foreground">
              مخطط مفاهيمي لخطوات {algorithmName}؛ الرموز توضح البنية ولا تمثل قيماً محسوبة للنص أو المفتاح
            </p>
          </div>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetRounds}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
            title="إعادة التعيين للدورة الأولى"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={prevRound}
            className="flex items-center gap-1 rounded-lg border border-border bg-secondary/80 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>{isStream ? "الموضع السابق" : "الدورة السابقة"}</span>
          </button>
          <div className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs">
            <span className="text-muted-foreground text-[10px]">{isStream ? "الموضع الرمزي" : "الدورة"}</span>
            <span className="text-primary font-bold">{roundStep}</span>
            <span className="text-muted-foreground text-[10px]">/ {maxRounds}</span>
          </div>
          <button
            onClick={nextRound}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors"
          >
            <span>{isStream ? "الموضع التالي" : "الدورة التالية"}</span>
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Architecture Visualizer Body - Theme Adaptive */}
      {isFeistel && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 text-foreground font-mono text-xs dir-ltr shadow-xs">
            <div className="text-center text-primary font-bold mb-4 text-xs sm:text-sm">
              === Feistel Network Round {roundStep} of {maxRounds} ===
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              {/* Left Half */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-950/20 p-3 text-center space-y-2">
                <div className="text-cyan-700 dark:text-cyan-300 font-bold">L_{roundStep - 1} (32-bit)</div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 p-2 text-[11px] text-cyan-600 dark:text-cyan-300 font-mono shadow-xs">
                  {`L[${roundStep - 1}]`}
                </div>
              </div>

              {/* Right Half */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 p-3 text-center space-y-2">
                <div className="text-emerald-700 dark:text-emerald-300 font-bold">R_{roundStep - 1} (32-bit)</div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 p-2 text-[11px] text-emerald-600 dark:text-emerald-300 font-mono shadow-xs">
                  {`R[${roundStep - 1}]`}
                </div>
              </div>
            </div>

            {/* F-Function and Swap Path */}
            <div className="my-4 flex flex-col items-center justify-center space-y-2">
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-700 dark:text-amber-300 text-center font-bold text-xs shadow-xs">
                F-Function: S-Boxes & Subkey K_{roundStep}
              </div>
              <div className="text-muted-foreground text-[11px]">
                L_{roundStep} = R_{roundStep - 1} &nbsp;&nbsp;|&nbsp;&nbsp; R_{roundStep} = L_{roundStep - 1} ⊕ F(R_{roundStep - 1}, K_{roundStep})
              </div>
            </div>

            {/* Results of Current Round */}
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="rounded-lg border border-emerald-500/30 bg-white dark:bg-slate-900 p-2.5 text-center shadow-xs">
                <span className="text-[10px] text-muted-foreground block">العلاقة للأيسر L_{roundStep}:</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {`R[${roundStep - 1}]`}
                </span>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-white dark:bg-slate-900 p-2.5 text-center shadow-xs">
                <span className="text-[10px] text-muted-foreground block">العلاقة للأيمن R_{roundStep}:</span>
                <span className="text-cyan-700 dark:text-cyan-300 font-bold">
                  {`L[${roundStep - 1}] ⊕ F(R[${roundStep - 1}], K[${roundStep}])`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSPN && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-5 text-foreground font-mono text-xs dir-ltr shadow-xs">
            <div className="text-center text-primary font-bold mb-3 text-xs sm:text-sm">
              === AES-128 State Matrix (4×4 Bytes) — Round {roundStep} / 10 ===
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center my-4">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2.5">
                <div className="text-cyan-700 dark:text-cyan-300 font-bold mb-1">1. SubBytes</div>
                <p className="text-[10px] text-muted-foreground">GF(2^8) Non-linear S-Box Inversion</p>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5">
                <div className="text-blue-700 dark:text-blue-300 font-bold mb-1">2. ShiftRows</div>
                <p className="text-[10px] text-muted-foreground">Cyclic shifts (0, 1, 2, 3 bytes)</p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                <div className="text-emerald-700 dark:text-emerald-300 font-bold mb-1">{roundStep === 10 ? "3. لا توجد MixColumns" : "3. MixColumns"}</div>
                <p className="text-[10px] text-muted-foreground">{roundStep === 10 ? "الدورة الأخيرة تستثني خلط الأعمدة" : "MDS matrix polynomial diffusion"}</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                <div className="text-amber-700 dark:text-amber-300 font-bold mb-1">4. AddRoundKey</div>
                <p className="text-[10px] text-muted-foreground">Bitwise XOR with Subkey {roundStep}</p>
              </div>
            </div>

            {/* 4x4 State Grid */}
            <div className="max-w-xs mx-auto border border-border rounded-xl p-3 bg-card shadow-xs">
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const r = idx % 4;
                  const c = Math.floor(idx / 4);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg bg-primary/10 border border-primary/20 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                      title={`State[${r},${c}]`}
                    >
                      {`s${r},${c}`}
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
          <div className="rounded-xl border border-border bg-muted/30 p-5 text-foreground font-mono text-xs dir-ltr shadow-xs">
            <div className="text-center text-primary font-bold mb-3 text-xs sm:text-sm">
              === RC4: مخطط رمزي لأول 16 موضعاً من S ===
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto my-3">
              {Array.from({ length: 16 }).map((_, idx) => {
                const isI = idx === (roundStep % 16);
                const isJ = idx === ((roundStep * 3) % 16);
                return (
                  <div
                    key={idx}
                    className={`h-9 w-9 flex flex-col items-center justify-center rounded-lg border font-mono text-xs ${
                      isI
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold"
                        : isJ
                        ? "border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <span className="text-[9px] text-muted-foreground">{idx}</span>
                    <span>{`S[${idx}]`}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-muted-foreground">
              مؤشر <span className="text-cyan-600 dark:text-cyan-400 font-bold">i</span> ومؤشر <span className="text-amber-600 dark:text-amber-400 font-bold">j</span> يوضحان مواضع رمزية؛ الحالة الفعلية تُحسب بخوارزميتي KSA وPRGA.
            </div>
          </div>
        </div>
      )}

      {isAlgebraic && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-5 text-foreground font-mono text-xs dir-ltr shadow-xs">
            <div className="text-center text-primary font-bold mb-3 text-xs sm:text-sm">
              === IDEA Group Mixer: 3 Incompatible Algebraic Operations ===
            </div>
            <p className="text-center text-muted-foreground mb-3">ثماني دورات تليها مرحلة إخراج بأربعة مفاتيح فرعية؛ مجموع المفاتيح 52.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center my-3 max-w-xl mx-auto">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                <div className="text-base text-cyan-700 dark:text-cyan-300 font-bold mb-1">XOR (⊕)</div>
                <div className="text-[11px] text-muted-foreground">الزمرة الثنائية (GF(2)^16)</div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="text-base text-emerald-700 dark:text-emerald-300 font-bold mb-1">ADD (⊞ mod 2^16)</div>
                <div className="text-[11px] text-muted-foreground">زمرة الجمع النمطي للأعداد الصحيحة</div>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                <div className="text-base text-purple-700 dark:text-purple-300 font-bold mb-1">MUL (⊙ mod 65537)</div>
                <div className="text-[11px] text-muted-foreground">زمرة الضرب بعدد فيرما الأولي F4</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRotations && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-5 text-foreground font-mono text-xs dir-ltr shadow-xs">
            <div className="text-center text-primary font-bold mb-3 text-xs sm:text-sm">
              === Data-Dependent Word Rotations & Non-linear Mixing ===
            </div>
            <div className="max-w-md mx-auto rounded-xl border border-border bg-card p-4 text-center space-y-2 shadow-xs">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold font-mono">
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
