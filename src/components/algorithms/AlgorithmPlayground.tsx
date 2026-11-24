"use client";

import React, { useState } from "react";
import { Lock, Unlock, RefreshCw, Copy, Check, FlaskConical, Terminal } from "lucide-react";
import {
  sha256Bytes,
  bytesToHex,
  hexToBytes,
  rc4Crypt,
  rc5Setup,
  rc5Block,
  rc6Setup,
  rc6Block,
  ideaExpandKey,
  ideaInvertKeys,
  ideaCryptBlock,
  aesSubtleCrypt,
  feistelSimulation,
} from "@/lib/crypto/webcrypto-helper";

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

  const handleEncrypt = async () => {
    const text = plainInput.trim();
    const pwd = keyInput.trim();
    if (!text || !pwd) {
      setOutput("يرجى إدخال النص الأصلي والمفتاح السري أولاً.");
      return;
    }

    setStatus("encrypting");
    setOutput("جاري التشفير والحسابات الرياضية...");

    try {
      const keyHash = await sha256Bytes(pwd);
      const textBytes = new TextEncoder().encode(text);

      if (cipherType === "rc4") {
        const ct = rc4Crypt(keyHash, textBytes);
        const hex = bytesToHex(ct);
        setOutput(hex);
        setTrace(
          `✔ تم توليد تيار المفاتيح عبر KSA (256-byte State) و PRGA بنجاح.\n` +
            `طول النص: ${textBytes.length} بايت\n` +
            `Ciphertext (Hex): ${hex}`
        );
      } else if (cipherType === "rc5") {
        const S = rc5Setup(keyHash.slice(0, 16), 12);
        const padLen = 8 - (textBytes.length % 8);
        const padded = new Uint8Array(textBytes.length + padLen);
        padded.set(textBytes);
        for (let p = textBytes.length; p < padded.length; p++) padded[p] = padLen;

        const out = new Uint8Array(padded.length);
        for (let b = 0; b < padded.length; b += 8) {
          const blk = rc5Block(padded.subarray(b, b + 8), S, 12, "enc");
          out.set(blk, b);
        }
        const hex = bytesToHex(out);
        setOutput(hex);
        setTrace(
          `✔ تشفير RC5-32/12/16 مع دورات معتمدة على البيانات (Data-dependent Rotations).\n` +
            `عدد الكتل المعالجة: ${padded.length / 8} كتلة (64-بت)\n` +
            `Ciphertext (Hex): ${hex}`
        );
      } else if (cipherType === "rc6") {
        const S = rc6Setup(keyHash.slice(0, 16), 20);
        const padLen = 16 - (textBytes.length % 16);
        const padded = new Uint8Array(textBytes.length + padLen);
        padded.set(textBytes);
        for (let p = textBytes.length; p < padded.length; p++) padded[p] = padLen;

        const out = new Uint8Array(padded.length);
        for (let b = 0; b < padded.length; b += 16) {
          const blk = rc6Block(padded.subarray(b, b + 16), S, 20, "enc");
          out.set(blk, b);
        }
        const hex = bytesToHex(out);
        setOutput(hex);
        setTrace(
          `✔ تشفير RC6-32/20/16 المتأهل لنهائيات AES (4 سجلات ودالة تربيعية غير خطية f(x) = (x*(2x+1)) <<< 5).\n` +
            `عدد الكتل المعالجة (128-بت): ${padded.length / 16}\n` +
            `Ciphertext (Hex): ${hex}`
        );
      } else if (cipherType === "aes") {
        const ct = await aesSubtleCrypt(keyHash, textBytes, "enc");
        const hex = bytesToHex(ct);
        setOutput(hex);
        setTrace(
          `✔ تشفير AES-128 (شبكة استبدال وتبديل SPN مكونة من 10 دورات كاملة: SubBytes, ShiftRows, MixColumns, AddRoundKey).\n` +
            `طول النص المشفر: ${ct.length} بايت (${ct.length / 16} كتلة 128-بت)\n` +
            `Ciphertext (Hex): ${hex}`
        );
      } else if (cipherType === "idea") {
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
        setOutput(hex);
        setTrace(
          `✔ تشفير IDEA (Lai-Massey) عبر خلط 3 زمر جبرية متعارضة (XOR, + mod 2^16, × mod 65537) مع 52 مفتاحاً فرعياً.\n` +
            `عدد الكتل (64-بت): ${padded.length / 8}\n` +
            `Ciphertext (Hex): ${hex}`
        );
      } else {
        const rounds =
          cipherType === "gost" ? 32 : cipherType === "blowfish" ? 16 : cipherType === "cast" ? 16 : 16;
        const { out, trace: simTrace } = feistelSimulation(textBytes, keyHash, rounds, "enc");
        const hex = bytesToHex(out);
        setOutput(hex);
        setTrace(simTrace.join("\n"));
      }
    } catch (err: any) {
      setOutput(`حدث خطأ أثناء التشفير: ${err.message}`);
    } finally {
      setStatus("idle");
    }
  };

  const handleDecrypt = async () => {
    const hex = output.trim();
    const pwd = keyInput.trim();
    if (!hex || !pwd || hex.includes(" ") || hex.length % 2 !== 0) {
      setOutput("يرجى توفير نص مشفر صالح بصيغة Hex في حقل الناتج ومفتاح فك التشفير.");
      return;
    }

    setStatus("decrypting");

    try {
      const keyHash = await sha256Bytes(pwd);
      const ctBytes = hexToBytes(hex);

      if (cipherType === "rc4") {
        const pt = rc4Crypt(keyHash, ctBytes);
        setOutput(new TextDecoder().decode(pt));
        setTrace("✔ تم فك التشفير التدفقي المتناظر (XOR Stream Keystream) بنجاح.");
      } else if (cipherType === "rc5") {
        const S = rc5Setup(keyHash.slice(0, 16), 12);
        const out = new Uint8Array(ctBytes.length);
        for (let b = 0; b < ctBytes.length; b += 8) {
          const blk = rc5Block(ctBytes.subarray(b, b + 8), S, 12, "dec");
          out.set(blk, b);
        }
        const pad = out[out.length - 1];
        const unpadded = pad > 0 && pad <= 8 ? out.slice(0, out.length - pad) : out;
        setOutput(new TextDecoder().decode(unpadded));
        setTrace("✔ تم فك تشفير كتل RC5 بنجاح بحساب الدورات العكسية وإزالة الحشو.");
      } else if (cipherType === "rc6") {
        const S = rc6Setup(keyHash.slice(0, 16), 20);
        const out = new Uint8Array(ctBytes.length);
        for (let b = 0; b < ctBytes.length; b += 16) {
          const blk = rc6Block(ctBytes.subarray(b, b + 16), S, 20, "dec");
          out.set(blk, b);
        }
        const pad = out[out.length - 1];
        const unpadded = pad > 0 && pad <= 16 ? out.slice(0, out.length - pad) : out;
        setOutput(new TextDecoder().decode(unpadded));
        setTrace("✔ تم فك تشفير RC6 بنجاح عبر السجلات الأربعة.");
      } else if (cipherType === "aes") {
        const pt = await aesSubtleCrypt(keyHash, ctBytes, "dec");
        setOutput(new TextDecoder().decode(pt));
        setTrace(
          "✔ تم فك تشفير AES-128 بنجاح عبر التحويلات العكسية (InvShiftRows, InvSubBytes, InvMixColumns)."
        );
      } else if (cipherType === "idea") {
        const ek = ideaExpandKey(keyHash.slice(0, 16));
        const dk = ideaInvertKeys(ek);
        const out = new Uint8Array(ctBytes.length);
        for (let b = 0; b < ctBytes.length; b += 8) {
          const blk = ideaCryptBlock(ctBytes.subarray(b, b + 8), dk);
          out.set(blk, b);
        }
        const pad = out[out.length - 1];
        const unpadded = pad > 0 && pad <= 8 ? out.slice(0, out.length - pad) : out;
        setOutput(new TextDecoder().decode(unpadded));
        setTrace(
          "✔ تم فك تشفير IDEA بنجاح بحساب معكوسات الزمر الجبرية (Mod 65537 multiplicative inverses & Mod 65536 additive inverses)."
        );
      } else {
        const rounds = cipherType === "gost" ? 32 : 16;
        const { out } = feistelSimulation(ctBytes, keyHash, rounds, "dec");
        const pad = out[out.length - 1];
        const unpadded = pad > 0 && pad <= 8 ? out.slice(0, out.length - pad) : out;
        setOutput(new TextDecoder().decode(unpadded));
        setTrace("✔ تم فك تشفير شبكة فيستل بنجاح واستعادة النص الأصلي.");
      }
    } catch (err: any) {
      setOutput(`خطأ أثناء فك التشفير: ${err.message} (تأكد من صحة المفتاح والنص المشفر)`);
    } finally {
      setStatus("idle");
    }
  };

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
              تجربة فورية للتشفير وفك التشفير ورؤية التحويلات والمسجلات محلياً في المتصفح
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
          <label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span>النص الأصلي (Plaintext):</span>
            <span className="text-[10px] text-muted-foreground font-mono">{plainInput.length} chars</span>
          </label>
          <textarea
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
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>المفتاح السري (Key / Password):</span>
              <span className="text-[10px] text-muted-foreground font-mono">{keyInput.length} chars</span>
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="أدخل المفتاح هنا..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono dir-ltr text-left"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleEncrypt}
              disabled={status !== "idle"}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{status === "encrypting" ? "جاري التشفير..." : "🔒 تشفير الكتلة (Encrypt)"}</span>
            </button>

            <button
              onClick={handleDecrypt}
              disabled={status !== "idle"}
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

        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3 font-mono text-xs text-blue-600 dark:text-blue-400 break-all dir-ltr text-left min-h-[48px] flex items-center shadow-xs">
          {output || <span className="text-muted-foreground italic">في انتظار إدخال البيانات والضغط على تشفير...</span>}
        </div>

        {trace && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Terminal className="h-3.5 w-3.5 text-emerald-500" />
              <span>سجل التحويلات الرياضية والدورات (Execution Trace):</span>
            </div>
            <pre className="rounded-md border border-border/40 bg-muted/30 p-2.5 font-mono text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap dir-ltr text-left max-h-40 overflow-y-auto">
              {trace}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
