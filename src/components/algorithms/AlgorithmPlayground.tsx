"use client";

import React, { useState, useId, useEffect } from "react";
import { Lock, Unlock, RefreshCw, Copy, Check, FlaskConical, Terminal } from "lucide-react";
import { bytesToHex, hexToBytes } from "@/lib/crypto/webcrypto-helper";
import { crypt, isCipherId } from "@/lib/crypto/engine";

interface AlgorithmPlaygroundProps {
  cipherType: string; // 'des' | 'aes' | 'rc5' | 'rc6' | 'idea' | 'gost' | 'rc4' | 'cast' | 'blowfish'
  defaultPlaintext: string;
  defaultKey: string;
  cipherName: string;
}

export function AlgorithmPlayground({
  cipherType,
  defaultPlaintext,
  defaultKey,
  cipherName,
}: AlgorithmPlaygroundProps) {
  const fieldId = useId();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [plainInput, setPlainInput] = useState(defaultPlaintext);
  const [keyInput, setKeyInput] = useState(defaultKey);
  const [output, setOutput] = useState("");
  const [trace, setTrace] = useState("");
  const [status, setStatus] = useState<"idle" | "encrypting" | "decrypting">("idle");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const runCipher = async (decrypt: boolean) => {
    if (!keyInput || !isCipherId(cipherType)) {
      setTrace("يرجى إدخال مفتاح صالح واختيار خوارزمية معروفة.");
      return;
    }
    setStatus(decrypt ? "decrypting" : "encrypting");
    setTrace("");
    try {
      const input = decrypt ? hexToBytes(output.trim()) : new TextEncoder().encode(plainInput);
      if (decrypt && !input.length) throw new Error("لا يوجد نص مشفر لفكّه");
      const result = await crypt(cipherType, input, keyInput, decrypt);
      setOutput(decrypt ? new TextDecoder("utf-8", { fatal: true }).decode(result) : bytesToHex(result));
      setTrace(`${decrypt ? "فك تشفير" : "تشفير"} ${cipherName}: ${input.length} بايت ← ${result.length} بايت\n` +
        (cipherType === "rc4" ? "RC4: تيار XOR، دون حشو." : "كتل ECB مع حشو PKCS#7، مطابق لواجهة Python التعليمية.") +
        "\nاشتقاق المفتاح: SHA-256 لكلمة المرور، ثم اختيار طول المفتاح الخاص بالخوارزمية.");
    } catch (error) {
      setTrace(`تعذر ${decrypt ? "فك التشفير" : "التشفير"}: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
    } finally {
      setStatus("idle");
    }
  };
  const handleEncrypt = () => runCipher(false);
  const handleDecrypt = () => runCipher(true);

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              المختبر التفاعلي المباشر لخوارزمية {cipherName}
            </h3>
            <p className="text-xs text-muted-foreground">
              تجربة فورية للتشفير وفك التشفير محلياً في المتصفح، بنتائج مطابقة للأكواد التعليمية
            </p>
          </div>
        </div>
        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-mono font-medium text-foreground">
          {cipherType.toUpperCase()} Engine
        </span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plaintext Input */}
        <div className="space-y-1.5">
          <label htmlFor={`${fieldId}-plaintext`} className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>النص الأصلي (Plaintext):</span>
            <span className="text-[10px] text-muted-foreground font-mono">{plainInput.length} chars</span>
          </label>
          <textarea
            disabled={!ready}
            id={`${fieldId}-plaintext`}
            value={plainInput}
            onChange={(e) => setPlainInput(e.target.value)}
            rows={3}
            placeholder="أدخل النص الأصلي هنا..."
            className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono dir-ltr text-left"
          />
        </div>

        {/* Key Input & Controls */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor={`${fieldId}-key`} className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>المفتاح السري (Key / Password):</span>
              <span className="text-[10px] text-muted-foreground font-mono">{keyInput.length} chars</span>
            </label>
            <input
              disabled={!ready}
              type="text"
              id={`${fieldId}-key`}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="أدخل المفتاح هنا..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono dir-ltr text-left"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleEncrypt}
              disabled={!ready || status !== "idle"}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{status === "encrypting" ? "جاري التشفير..." : "🔒 تشفير الكتلة (Encrypt)"}</span>
            </button>

            <button
              onClick={handleDecrypt}
              disabled={!ready || status !== "idle"}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>{status === "decrypting" ? "جاري فك التشفير..." : "🔓 فك التشفير (Decrypt)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div className="space-y-2 rounded-lg border border-border/70 bg-background/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            الناتج المشفر / المسترجع (Output / Hex Dump):
          </span>
          {output && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>نسخ الناتج</span>
                </>
              )}
            </button>
          )}
        </div>

        <output aria-label="نتيجة التشفير" className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3 font-mono text-xs text-blue-600 dark:text-blue-400 break-all dir-ltr text-left min-h-[48px] flex items-center shadow-xs">
          {output || <span className="text-muted-foreground italic">في انتظار إدخال البيانات والضغط على تشفير...</span>}
        </output>

        {trace && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Terminal className="h-3.5 w-3.5 text-emerald-500" />
              <span>تفاصيل العملية (Operation Details):</span>
            </div>
            <pre role="status" aria-live="polite" className="rounded-md border border-border/40 bg-muted/30 p-2.5 font-mono text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap dir-ltr text-left max-h-40 overflow-y-auto">
              {trace}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
