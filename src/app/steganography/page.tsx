import React from "react";
import Link from "next/link";
import { Layers, Image as ImageIcon, Volume2, ShieldCheck, Download, Sparkles, Terminal } from "lucide-react";
import { StegoStudio } from "@/components/steganography/StegoStudio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export const metadata = {
  title: "مختبر إخفاء البيانات (Steganography LSB) — Crypto Lab",
  description:
    "دراسة وتطبيق تقنيات إخفاء الرسائل المشفرة داخل الصور النقطية BMP 24-bit وملفات الصوت الترددية WAV 16-bit PCM عبر استبدال البت الأقل وزناً LSB.",
};

export default function SteganographyPage() {
  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Breadcrumb & Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Link href="/" className="hover:text-primary transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">إخفاء البيانات (Steganography)</span>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-card/60 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>تقنية إخفاء البيانات بالوسائط المتعددة (LSB Steganography)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            مختبر إخفاء البيانات في الصور الرقمية والصوتيات
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
            دراسة أكاديمية وتطبيقية لتقنيات إخفاء النصوص والرسائل المشفرة داخل الوسائط الرقمية عبر
            استبدال البت الأقل وزناً (Least Significant Bit - LSB). تشمل المنصة معالجة ملفات الصور النقطية
            (BMP 24-bit غير المضغوطة) وملفات الصوت الترددية (WAV 16-bit PCM) مع ترويسة تحكم Big-Endian بحجم 4 بايت.
          </p>
        </div>
      </section>

      {/* Interactive Studio */}
      <section className="space-y-3">
        <StegoStudio />
      </section>

      {/* Theory & Architecture Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">إخفاء البيانات في الصور (BMP 24-bit LSB)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              في الصور ذات العمق اللوني 24 بت، يمثل كل بكسل بثلاثة بايتات للقنوات اللونية (Red, Green, Blue).
              عند استبدال البت الأقل وزناً (LSB) في كل قناة، فإن أقصى تغير في قيمة اللون هو ±1 من أصل 256 مستوى،
              وهو فارق يستحيل على العين البشرية ملاحظته (Imperceptible).
            </p>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-foreground font-mono dir-ltr">
              <div className="text-muted-foreground text-[11px]"># بايثون نقي لتعديل بت البكسل:</div>
              <div className="text-primary font-semibold">pixel_byte = (pixel_byte & ~1) | secret_bit</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base font-bold">إخفاء البيانات في الصوت (WAV 16-bit PCM LSB)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              تخزن ملفات الصوت الترددية غير المضغوطة (WAV) الموجة الصوتية كسلسلة من العينات (Samples) بدقة 16 بتاً
              (بين -32768 و +32767). استبدال البت الأخير في العينة يغير سعتها بمقدار وحدة واحدة فقط،
              وهو ما يمثل تغيراً أقل من 0.003% يقع تماماً تحت عتبة الإدراك السمعي للأذن البشرية (Auditory Masking).
            </p>
            <div className="rounded-md border border-border bg-muted/50 p-3 text-foreground font-mono dir-ltr">
              <div className="text-muted-foreground text-[11px]"># بايثون نقي لتعديل عينة الصوت:</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">sample = (sample & ~1) | secret_bit</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Protocol Specifications */}
      <section className="rounded-xl border border-border bg-muted/20 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">ترويسة التحكم وتفادي نفايات الملف الحامل (32-bit Header)</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          لمنع استخراج بايتات عشوائية بعد نهاية الرسالة السرية، تم تطبيق بروتوكول موحد في جميع مجلدات الخوارزميات
          (ملفات <code>stego_image.py</code> و <code>stego_audio.py</code>):
          يتم حقن 4 بايتات في بداية البث تمثل طول الرسالة السرية بنظام Big-Endian.
          عند الاستخراج، يقرأ المستخرج أول 32 بتاً لمعرفة الطول الدقيق $L$ ثم يقرأ $L \times 8$ بتاً فقط ويتوقف فوراً.
        </p>
      </section>
    </main>
  );
}
