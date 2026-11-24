"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Layers, Eye, EyeOff, ShieldCheck, Download, RefreshCw, Volume2, Image as ImageIcon, Sparkles } from "lucide-react";

import { embedImage, extractImage } from "@/lib/steganography";

export function StegoStudio() {
  const fieldId = useId();
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "audio">("image");
  const [secretText, setSecretText] = useState("Crypto Lab 2026 — رسالة سرية مشفرة");
  const [extractedText, setExtractedText] = useState("");
  const [embedStatus, setEmbedStatus] = useState<string>("");
  const [embedError, setEmbedError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  // Initialize canvas with gradient pattern or load image
  const initCanvas = (imageUrl?: string) => {
    setEmbedError(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = 240;
        canvas.height = 160;
        ctx.drawImage(img, 0, 0, 240, 160);
        setEmbedStatus("تم تحميل صورة العينة (Sample Image) بنجاح كحامل!");
        setExtractedText("");
      };
      img.onerror = () => { setEmbedError(true); setEmbedStatus("تعذر تحميل صورة العينة؛ حاول مرة أخرى."); };
      img.src = imageUrl;
      return;
    }

    canvas.width = 240;
    canvas.height = 160;

    const grad = ctx.createLinearGradient(0, 0, 240, 160);
    grad.addColorStop(0, "#0284c7");
    grad.addColorStop(0.5, "#6366f1");
    grad.addColorStop(1, "#a855f7");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 160);

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc((i * 37) % 240, (i * 29) % 160, (i % 15) + 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("صورة حاملة (Carrier 24-bit)", 120, 85);

    setEmbedStatus("");
    setExtractedText("");
  };

  useEffect(() => {
    initCanvas();
    setReady(true);
  }, []);

  const handleHide = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const text = secretText;
    if (!text.trim()) {
      setEmbedError(true);
      setEmbedStatus("يرجى إدخال نص سري لإخفائه أولاً.");
      return;
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const textBytes = new TextEncoder().encode(text);
    try {
      imgData.data.set(embedImage(data, textBytes));
      ctx.putImageData(imgData, 0, 0);
      setExtractedText("");
      setEmbedError(false);
      setEmbedStatus(`✔ تم إخفاء ${textBytes.length} بايت بنجاح.`);
    } catch (error) {
      setEmbedError(true);
      setEmbedStatus(error instanceof Error ? error.message : "تعذر إخفاء الرسالة");
    }
  };

  const handleExtract = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    try {
      const payload = extractImage(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      setExtractedText(new TextDecoder("utf-8", { fatal: true }).decode(payload) || "الرسالة المخفية فارغة.");
    } catch (error) {
      setExtractedText(error instanceof Error ? error.message : "تعذر استخراج الرسالة");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Mode Switcher */}
      <div className="flex border-b border-border gap-2 pb-3">
        <button
          onClick={() => setActiveTab("image")}
          aria-pressed={activeTab === "image"}
          aria-controls={`${fieldId}-image`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "image"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>إخفاء في الصور الرقمية (BMP LSB)</span>
        </button>
        <button
          onClick={() => setActiveTab("audio")}
          aria-pressed={activeTab === "audio"}
          aria-controls={`${fieldId}-audio`}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "audio"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Volume2 className="h-4 w-4" />
          <span>إخفاء في الملفات الصوتية (WAV LSB)</span>
        </button>
      </div>

      <div id={`${fieldId}-image`} hidden={activeTab !== "image"} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Controls */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor={fieldId} className="text-xs font-semibold text-foreground">
                  الرسالة السرية المراد تضمينها (Secret Message):
                </label>
                <textarea
                  disabled={!ready}
                  id={fieldId}
                  value={secretText}
                  onChange={(e) => setSecretText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="أدخل النص السري هنا..."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleHide}
                  disabled={!ready}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs"
                >
                  <EyeOff className="h-4 w-4" />
                  <span>إخفاء الرسالة داخل البكسلات (Embed LSB)</span>
                </button>

                <button
                  onClick={handleExtract}
                  disabled={!ready}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>استخراج الرسالة من الصورة (Extract LSB)</span>
                </button>

                <button
                  onClick={() => initCanvas(`${basePath}/images/sample.png`)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  title="تحميل صورة العينة المرفقة بالمشروع"
                >
                  🖼️ عينة المشروع
                </button>

                <button
                  onClick={() => initCanvas()}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title="إعادة تعيين الصورة"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {embedStatus && (
                <div role={embedError ? "alert" : "status"} aria-live="polite" className={`rounded-lg border p-3 text-xs font-medium ${embedError ? "border-destructive/30 bg-destructive/10 text-red-700 dark:text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                  {embedStatus}
                </div>
              )}

              {extractedText && (
                <div className="rounded-lg border border-border bg-background p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    الرسالة المستخرجة (Extracted Secret):
                  </span>
                  <p className="font-mono text-xs text-primary font-bold break-all whitespace-pre-wrap max-h-48 overflow-y-auto">{extractedText}</p>
                </div>
              )}
            </div>

            {/* Canvas Preview */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground">
                معاينة البكسلات الحية (HTML5 Canvas 24-bit):
              </span>
              <div className="max-w-full rounded-lg border border-border shadow-md overflow-hidden bg-background">
                <canvas ref={canvasRef} className="block max-w-full h-auto" />
              </div>
              <p className="text-[11px] text-muted-foreground text-center max-w-xs">
                يتم تعديل البت الأقل وزناً في كل قناة لونية ($R, G, B$)، مما ينتج عنه فارق لوني لا يتجاوز $1/256$ غير قابل للملاحظة بالعين البشرية.
              </p>
            </div>
          </div>

          {/* Stego Diagram SVG */}
          <div className="pt-4 border-t border-border">
            <span className="text-xs font-bold text-muted-foreground block mb-2">
              المخطط الهندسي لآلية حقن البتات (Bit Injection Diagram):
            </span>
            <div className="rounded-xl overflow-hidden border border-border bg-slate-100 dark:bg-slate-900/60 p-3">
              <img
                src={`${basePath}/images/stego-diagram.svg`}
                alt="LSB Steganography Diagram"
                className="w-full max-h-56 object-contain"
              />
            </div>
          </div>
        </div>
        <div id={`${fieldId}-audio`} hidden={activeTab !== "audio"} className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              <span>تقنية إخفاء البيانات في الصوت الرقمي (WAV 16-bit PCM LSB)</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تعتمد ملفات الصوت غير المضغوطة (WAV PCM) على تخزين شدة الموجة الصوتية كعينات رقمية موقعة بـ 16 بتاً
              (نطاق القيم من -32,768 إلى +32,767). في هذه التقنية:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-center">
                <div className="font-mono text-base font-bold text-foreground">16-bit</div>
                <div className="text-[11px] text-muted-foreground">دقة عينات الصوت (PCM Sample)</div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-center">
                <div className="font-mono text-base font-bold text-emerald-500">±1 Sample</div>
                <div className="text-[11px] text-muted-foreground">أقصى انحراف ترددي (&lt; 0.003%)</div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-center">
                <div className="font-mono text-base font-bold text-primary">32-bit Header</div>
                <div className="text-[11px] text-muted-foreground">ترويسة تحديد طول الرسالة بدقة</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 text-slate-800 dark:text-slate-200 font-mono text-xs dir-ltr space-y-2">
            <div className="text-slate-500 dark:text-slate-400"># استبدال البت الأقل وزناً في عينة الصوت (Python logic):</div>
            <div>new_sample = (original_sample & ~1) | secret_bit</div>
            <div className="text-emerald-600 dark:text-emerald-400"># العينات الناتجة تظل متطابقة سمعياً 100% دون أي تشويش أو نقر صوتي.</div>
          </div>
        </div>
    </div>
  );
}
