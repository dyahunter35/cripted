"use client";

import React, { useState, useRef, useEffect } from "react";
import { Layers, Eye, EyeOff, ShieldCheck, Download, RefreshCw, Volume2, Image as ImageIcon, Sparkles } from "lucide-react";

export function StegoStudio() {
  const [activeTab, setActiveTab] = useState<"image" | "audio">("image");
  const [secretText, setSecretText] = useState("Crypto Lab 2026 — رسالة سرية مشفرة");
  const [extractedText, setExtractedText] = useState("");
  const [embedStatus, setEmbedStatus] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  // Initialize canvas with gradient pattern or load image
  const initCanvas = (imageUrl?: string) => {
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
  }, []);

  const handleHide = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const text = secretText.trim();
    if (!text) {
      setEmbedStatus("يرجى إدخال نص سري لإخفائه أولاً.");
      return;
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const textBytes = new TextEncoder().encode(text);
    const total = new Uint8Array(4 + textBytes.length);
    const len = textBytes.length;

    // 4-byte Big-Endian length header (exact match with stego_image.py)
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
    setEmbedStatus(`✔ تم بنجاح إخفاء (${textBytes.length}) بايت داخل LSB لقنوات الألوان دون أي تشوه بصري!`);
  };

  const handleExtract = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      setExtractedText("لم يتم العثور على رسالة مخفية صالحة (تأكد من الضغط على إخفاء أولاً).");
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
    setExtractedText(recovered);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Mode Switcher */}
      <div className="flex border-b border-border gap-2 pb-3">
        <button
          onClick={() => setActiveTab("image")}
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

      {activeTab === "image" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Controls */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  الرسالة السرية المراد تضمينها (Secret Message):
                </label>
                <textarea
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs"
                >
                  <EyeOff className="h-4 w-4" />
                  <span>إخفاء الرسالة داخل البكسلات (Embed LSB)</span>
                </button>

                <button
                  onClick={handleExtract}
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
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {embedStatus}
                </div>
              )}

              {extractedText && (
                <div className="rounded-lg border border-border bg-background p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    الرسالة المستخرجة (Extracted Secret):
                  </span>
                  <p className="font-mono text-xs text-primary font-bold">{extractedText}</p>
                </div>
              )}
            </div>

            {/* Canvas Preview */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground">
                معاينة البكسلات الحية (HTML5 Canvas 24-bit):
              </span>
              <div className="rounded-lg border border-border shadow-md overflow-hidden bg-background">
                <canvas ref={canvasRef} className="block" />
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
            <div className="rounded-xl overflow-hidden border border-border/80 bg-black/40 p-2">
              <img
                src={`${basePath}/images/stego-diagram.svg`}
                alt="LSB Steganography Diagram"
                className="w-full max-h-56 object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
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

          <div className="rounded-lg border border-border/80 bg-[#0d1117] p-4 text-[#c9d1d9] font-mono text-xs dir-ltr space-y-2">
            <div className="text-[#8b949e]"># استبدال البت الأقل وزناً في عينة الصوت (Python logic):</div>
            <div>new_sample = (original_sample & ~1) | secret_bit</div>
            <div className="text-emerald-400"># العينات الناتجة تظل متطابقة سمعياً 100% دون أي تشويش أو نقر صوتي.</div>
          </div>
        </div>
      )}
    </div>
  );
}
