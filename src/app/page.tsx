import React from "react";
import Link from "next/link";
import {
  Shield,
  Layers,
  Terminal,
  Download,
  BookOpen,
  Headphones,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Cpu,
  Lock,
  ArrowLeft,
  Zap,
  Activity,
  Code2,
} from "lucide-react";
import { coreAlgorithms, additionalAlgorithms, allAlgorithms } from "@/content/algorithms";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { StegoStudio } from "@/components/steganography/StegoStudio";
import { AvalancheEffectLab } from "@/components/visualizers/AvalancheEffectLab";

export default function HomePage() {
  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-20">
      {/* Futuristic Cyber-Academic Hero Section */}
      <section className="relative text-center space-y-6 pt-8 sm:pt-16 overflow-hidden">
        {/* Ambient bioluminescent glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-xs">
          <Sparkles className="h-4 w-4" />
          <span>منصة أكاديمية وهندسية تفاعلية لمقرر التعمية وتأمين البيانات لمرحلة الماجستير</span>
        </div>

        <h1 className="relative text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          دراسة وتطبيق <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">خوارزميات التشفير</span> وإخفاء البيانات
        </h1>

        <p className="relative text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          دليل علمي وتطبيقي شامل يجمع بين معمارية التشفير المتناظر (كتل وتدفق)،
          وتقنيات إخفاء الرسائل السرية بالوسائط المتعددة (BMP & WAV)،
          مع تطبيق برمجي مطابق من الصفر (Pure Python) وبالمكتبات المعيارية وبودكاست تعليمي حواري.
        </p>

        {/* Live Metrics Grid */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto pt-4">
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-md hover:border-primary/50 transition-colors">
            <div className="font-mono text-3xl font-black text-primary">9</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">خوارزميات تشفير متناظر</div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-md hover:border-emerald-500/50 transition-colors">
            <div className="font-mono text-3xl font-black text-emerald-500">100%</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">بايثون نقي بدون مكتبات</div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-md hover:border-cyan-500/50 transition-colors">
            <div className="font-mono text-3xl font-black text-cyan-400">BMP & WAV</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">إخفاء البيانات السرية LSB</div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-md hover:border-amber-500/50 transition-colors">
            <div className="font-mono text-3xl font-black text-amber-500">0 KB</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">استهلاك البودكاست عند الفتح</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative flex flex-wrap items-center justify-center gap-3 pt-4">
          <a
            href={`${basePath}/downloads/crypto_lab_full.zip`}
            download
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-cyan-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/20 hover:scale-102 active:scale-98 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>تحميل حزمة الكود الشاملة (crypto_lab_full.zip)</span>
          </a>
          <Link
            href="/steganography"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-6 py-3.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary transition-colors shadow-xs"
          >
            <Layers className="h-4 w-4 text-emerald-500" />
            <span>مختبر إخفاء البيانات (Steganography)</span>
          </Link>
        </div>
      </section>

      {/* Avalanche Effect Interactive Laboratory */}
      <section className="space-y-4">
        <AvalancheEffectLab />
      </section>

      {/* Category 1: Core Master Curriculum */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                القسم الأول: خوارزميات المنهج الأساسية (Core Curriculum)
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                الخوارزميات القياسية الإلزامية المعتمدة في خطة مقرر الماجستير للتعمية وتأمين البيانات
              </p>
            </div>
          </div>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary font-mono">
            5 Core Ciphers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreAlgorithms.map((algo) => (
            <Card
              key={algo.slug}
              className="group flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md bg-card/90 backdrop-blur-xs rounded-2xl"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary group-hover:text-cyan-400 transition-colors">
                    {algo.slug.toUpperCase()}
                  </span>
                  <Badge
                    variant={
                      algo.specs.securityStatus === "strong"
                        ? "strong"
                        : algo.specs.securityStatus === "insecure"
                        ? "insecure"
                        : "academic"
                    }
                  >
                    {algo.specs.securityLabel}
                  </Badge>
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {algo.name} — {algo.subtitle}
                </CardTitle>
                <CardDescription className="line-clamp-2 leading-relaxed">
                  {algo.summary}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground block font-sans">الكتلة:</span>
                    <span className="font-bold text-foreground">{algo.specs.blockSize}</span>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground block font-sans">المفتاح:</span>
                    <span className="font-bold text-primary">{algo.specs.keySize}</span>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground block font-sans">الهيكل:</span>
                    <span className="font-bold text-foreground line-clamp-1">{algo.specs.structure}</span>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2.5">
                    <span className="text-[10px] text-muted-foreground block font-sans">الدورات:</span>
                    <span className="font-bold text-foreground">{algo.specs.rounds}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/60 pt-3.5">
                <Link
                  href={`/algorithms/${algo.slug}`}
                  className="text-xs font-bold text-primary group-hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>استكشف بالتفصيل والمحاكاة</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={`${basePath}/downloads/${algo.downloadZip}`}
                  download
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title={`تحميل حزمة ${algo.name} ZIP`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Category 2: Additional Ciphers */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                القسم الثاني: خوارزميات التشفير الإضافية والمتقدمة (Additional Ciphers)
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                خوارزميات نوعية مضافة لتوسيع آفاق الدراسة المقارنة والتحليل الأمني
              </p>
            </div>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground font-mono">
            4 Extra Ciphers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {additionalAlgorithms.map((algo) => (
            <Card
              key={algo.slug}
              className="group flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md bg-card/90 backdrop-blur-xs rounded-2xl"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary group-hover:text-cyan-400 transition-colors">
                    {algo.slug.toUpperCase()}
                  </span>
                  <Badge
                    variant={
                      algo.specs.securityStatus === "strong"
                        ? "strong"
                        : algo.specs.securityStatus === "insecure"
                        ? "insecure"
                        : "academic"
                    }
                  >
                    {algo.specs.securityLabel}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold">{algo.name}</CardTitle>
                <CardDescription className="line-clamp-2 leading-relaxed">
                  {algo.summary}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-border/50 py-1">
                  <span className="text-muted-foreground">الكتلة:</span>
                  <span className="font-bold text-foreground">{algo.specs.blockSize}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 py-1">
                  <span className="text-muted-foreground">المفتاح:</span>
                  <span className="font-bold text-primary">{algo.specs.keySize}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">الدورات:</span>
                  <span className="font-bold text-foreground">{algo.specs.rounds}</span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/60 pt-3">
                <Link
                  href={`/algorithms/${algo.slug}`}
                  className="text-xs font-bold text-primary group-hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <span>استكشف بالتفصيل</span>
                  <ArrowLeft className="h-3 w-3" />
                </Link>
                <a
                  href={`${basePath}/downloads/${algo.downloadZip}`}
                  download
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  title={`تحميل حزمة ${algo.name} ZIP`}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Comprehensive Comparative Matrix */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            المقارنة المعيارية الشاملة بين الخوارزميات (Technical Matrix)
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-right font-mono">
                  <th className="p-3.5 font-bold">الخوارزمية</th>
                  <th className="p-3.5 font-bold">الفئة</th>
                  <th className="p-3.5 font-bold">حجم الكتلة</th>
                  <th className="p-3.5 font-bold">طول المفتاح</th>
                  <th className="p-3.5 font-bold">الهيكل المعماري</th>
                  <th className="p-3.5 font-bold">الدورات</th>
                  <th className="p-3.5 font-bold">الحالة الأمنية</th>
                  <th className="p-3.5 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allAlgorithms.map((algo) => (
                  <tr key={algo.slug} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      <Link href={`/algorithms/${algo.slug}`} className="hover:text-primary">
                        {algo.name}
                      </Link>
                    </td>
                    <td className="p-3.5">
                      {algo.category === "core" ? (
                        <span className="text-primary font-medium">المنهج الأساسي</span>
                      ) : (
                        <span className="text-muted-foreground">إضافية ومتقدمة</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono">{algo.specs.blockSize}</td>
                    <td className="p-3.5 font-mono text-primary font-bold">{algo.specs.keySize}</td>
                    <td className="p-3.5 font-mono">{algo.specs.structure}</td>
                    <td className="p-3.5 font-mono">{algo.specs.rounds}</td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          algo.specs.securityStatus === "strong"
                            ? "strong"
                            : algo.specs.securityStatus === "insecure"
                            ? "insecure"
                            : "academic"
                        }
                      >
                        {algo.specs.securityLabel}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Link
                        href={`/algorithms/${algo.slug}`}
                        className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors inline-block"
                      >
                        معاينة
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Steganography Studio Preview */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">
              مختبر إخفاء البيانات في الوسائط المتعددة (LSB Steganography)
            </h2>
          </div>
          <Link
            href="/steganography"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>فتح المختبر الكامل المستقل</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        <StegoStudio />
      </section>

      {/* Python Environment & Quickstart */}
      <section className="rounded-3xl border border-border bg-gradient-to-b from-card to-muted/30 p-6 sm:p-10 space-y-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            تشغيل واختبار المشروع عبر بيئة Python المحلية (CLI Verified)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
          كافة الخوارزميات تم التحقق منها وتعمل 100% بدون أي حاجة للإنترنت وبأعلى دقة حسابية:
        </p>
        <div className="rounded-2xl border border-border/80 bg-[#0a0e17] p-5 text-[#c9d1d9] font-mono text-xs dir-ltr space-y-2 overflow-x-auto shadow-inner">
          <div className="text-[#8b949e]"># 1. تثبيت المتطلبات الخفيفة</div>
          <div>pip install -r requirements.txt</div>
          <div className="text-[#8b949e] pt-2"># 2. تشغيل الاختبارات الأكاديمية التلقائية الشاملة</div>
          <div>python3 -m unittest discover -s tests</div>
          <div className="text-emerald-400 pt-2"># 3. تشغيل العروض التوضيحية (Demos)</div>
          <div>python3 aes/aes_manual.py demo</div>
          <div>python3 rc5/rc5_manual.py demo</div>
          <div>python3 idea/idea_manual.py demo</div>
        </div>
      </section>
    </main>
  );
}
