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
} from "lucide-react";
import { coreAlgorithms, additionalAlgorithms, allAlgorithms } from "@/content/algorithms";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { StegoStudio } from "@/components/steganography/StegoStudio";

export default function HomePage() {
  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          <span>منصة أكاديمية وتطبيقية تفاعلية شاملة لمقرر التعمية وتأمين البيانات</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          دراسة وتطبيق <span className="text-primary">خوارزميات التشفير</span> وإخفاء البيانات
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          دليل علمي وعملي مفصل يجمع بين دراسة معماريات التشفير المتناظر (كتل وتدفق)،
          وتقنيات إخفاء الرسائل السرية (Steganography) بالوسائط المتعددة (BMP & WAV)،
          مع تطبيق كامل من الصفر (Pure Python) وبالمكتبات المعيارية وبودكاست تعليمي حواري.
        </p>

        {/* Highlights banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-4">
          <div className="rounded-xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="font-mono text-2xl font-black text-primary">9</div>
            <div className="text-xs text-muted-foreground mt-1">خوارزميات تشفير متناظر</div>
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
            <div className="text-xs text-muted-foreground mt-1">بايثون نقي بدون مكتبات</div>
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="font-mono text-2xl font-black text-blue-600 dark:text-blue-400">BMP & WAV</div>
            <div className="text-xs text-muted-foreground mt-1">إخفاء البيانات السرية LSB</div>
          </div>
          <div className="rounded-xl border border-border bg-card/80 p-4 shadow-2xs">
            <div className="font-mono text-2xl font-black text-amber-500">0 KB</div>
            <div className="text-xs text-muted-foreground mt-1">استهلاك البودكاست عند الفتح</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={`${basePath}/downloads/crypto_lab_full.zip`}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>تحميل الحزمة الشاملة (crypto_lab_full.zip)</span>
          </a>
          <Link
            href="/steganography"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Layers className="h-4 w-4 text-emerald-500" />
            <span>مختبر إخفاء البيانات (Steganography)</span>
          </Link>
        </div>
      </section>

      {/* Category 1: Core Curriculum */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            5 خوارزميات قياسية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreAlgorithms.map((algo) => (
            <Card key={algo.slug} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{algo.slug.toUpperCase()}</span>
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
                  <div className="rounded-md bg-secondary/50 p-2">
                    <span className="text-[10px] text-muted-foreground block">الكتلة:</span>
                    <span className="font-semibold text-foreground">{algo.specs.blockSize}</span>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2">
                    <span className="text-[10px] text-muted-foreground block">المفتاح:</span>
                    <span className="font-semibold text-foreground">{algo.specs.keySize}</span>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2">
                    <span className="text-[10px] text-muted-foreground block">الهيكل:</span>
                    <span className="font-semibold text-foreground line-clamp-1">{algo.specs.structure}</span>
                  </div>
                  <div className="rounded-md bg-secondary/50 p-2">
                    <span className="text-[10px] text-muted-foreground block">الدورات:</span>
                    <span className="font-semibold text-foreground">{algo.specs.rounds}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/60 pt-3">
                <Link
                  href={`/algorithms/${algo.slug}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>استكشف {algo.name} بالتفصيل</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={`${basePath}/downloads/${algo.downloadZip}`}
                  download
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
            4 خوارزميات نوعية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {additionalAlgorithms.map((algo) => (
            <Card key={algo.slug} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{algo.slug.toUpperCase()}</span>
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
                  <span className="font-semibold text-foreground">{algo.specs.blockSize}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 py-1">
                  <span className="text-muted-foreground">المفتاح:</span>
                  <span className="font-semibold text-foreground">{algo.specs.keySize}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">الدورات:</span>
                  <span className="font-semibold text-foreground">{algo.specs.rounds}</span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/60 pt-3">
                <Link
                  href={`/algorithms/${algo.slug}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>استكشف بالتفصيل</span>
                  <ArrowLeft className="h-3 w-3" />
                </Link>
                <a
                  href={`${basePath}/downloads/${algo.downloadZip}`}
                  download
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-right">
                  <th className="p-3 font-semibold">الخوارزمية</th>
                  <th className="p-3 font-semibold">الفئة</th>
                  <th className="p-3 font-semibold">حجم الكتلة</th>
                  <th className="p-3 font-semibold">طول المفتاح</th>
                  <th className="p-3 font-semibold">الهيكل المعماري</th>
                  <th className="p-3 font-semibold">الدورات</th>
                  <th className="p-3 font-semibold">الحالة الأمنية</th>
                  <th className="p-3 font-semibold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {allAlgorithms.map((algo) => (
                  <tr key={algo.slug} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-foreground">
                      <Link href={`/algorithms/${algo.slug}`} className="hover:text-primary">
                        {algo.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      {algo.category === "core" ? (
                        <span className="text-primary font-medium">المنهج الأساسي</span>
                      ) : (
                        <span className="text-muted-foreground">إضافية ومتقدمة</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{algo.specs.blockSize}</td>
                    <td className="p-3 font-mono text-primary">{algo.specs.keySize}</td>
                    <td className="p-3 font-mono">{algo.specs.structure}</td>
                    <td className="p-3 font-mono">{algo.specs.rounds}</td>
                    <td className="p-3">
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
                    <td className="p-3 text-center">
                      <Link
                        href={`/algorithms/${algo.slug}`}
                        className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors inline-block"
                      >
                        عرض
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
      <section className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            تشغيل المشروع عبر بيئة Python المحلية (Quickstart)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
          يمكنك تشغيل واختبار جميع الخوارزميات والتأكد من تطابق نتائج التشفير وفك التشفير مع المتجهات المرجعية القياسية:
        </p>
        <div className="rounded-xl border border-border/80 bg-[#0d1117] p-4 text-[#c9d1d9] font-mono text-xs dir-ltr space-y-2 overflow-x-auto">
          <div className="text-[#8b949e]"># 1. تثبيت متطلبات بيئة بايثون</div>
          <div>pip install -r requirements.txt</div>
          <div className="text-[#8b949e] pt-2"># 2. تشغيل الاختبارات التجريبية لكافة الخوارزميات والتأكد من سلامتها</div>
          <div>python3 aes/aes_manual.py demo</div>
          <div>python3 des/des_manual.py demo</div>
          <div>python3 rc5/rc5_manual.py demo</div>
        </div>
      </section>
    </main>
  );
}
