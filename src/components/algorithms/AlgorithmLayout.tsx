"use client";

import React from "react";
import Link from "next/link";
import { Download, BookOpen, Layers, Shield, Sparkles, Terminal, Activity } from "lucide-react";
import { AlgorithmData } from "@/types/algorithm";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PodcastPlayer } from "@/components/podcast/PodcastPlayer";
import { CodeWorkspace } from "@/components/code-workspace/CodeWorkspace";
import { AlgorithmPlayground } from "@/components/algorithms/AlgorithmPlayground";
import { MathRenderer } from "@/components/algorithms/MathRenderer";
import { AlgorithmVisualizer } from "@/components/visualizers/AlgorithmVisualizer";

interface AlgorithmLayoutProps {
  algorithm: AlgorithmData;
}

export function AlgorithmLayout({ algorithm }: AlgorithmLayoutProps) {
  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH !== undefined
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : process.env.NODE_ENV === "production"
      ? "/cripted"
      : "";

  const downloadUrl = `${basePath}/downloads/${algorithm.downloadZip}`;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Breadcrumb & Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Link href="/" className="hover:text-primary transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <span>الخوارزميات</span>
          <span>/</span>
          <span className="text-foreground font-bold">{algorithm.name}</span>
        </div>

        <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-b from-card via-card/80 to-background p-6 sm:p-10 shadow-lg overflow-hidden space-y-5">
          {/* Subtle cyber background glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{algorithm.heroPill}</span>
            </span>
            <Badge
              variant={
                algorithm.specs.securityStatus === "strong"
                  ? "strong"
                  : algorithm.specs.securityStatus === "insecure"
                  ? "insecure"
                  : "academic"
              }
            >
              {algorithm.specs.securityLabel}
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                خوارزمية {algorithm.name} ({algorithm.subtitle})
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                {algorithm.summary}
              </p>
            </div>

            <div className="shrink-0">
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-cyan-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/20 hover:scale-102 active:scale-98 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>تحميل حزمة {algorithm.name} (ZIP)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications Matrix */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            المواصفات الفنية والمعمارية القياسية
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1 hover:border-primary/40 transition-colors">
            <span className="text-[11px] text-muted-foreground font-medium">حجم الكتلة:</span>
            <p className="font-mono text-sm font-bold text-foreground">{algorithm.specs.blockSize}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1 hover:border-primary/40 transition-colors">
            <span className="text-[11px] text-muted-foreground font-medium">طول المفتاح:</span>
            <p className="font-mono text-sm font-bold text-primary">{algorithm.specs.keySize}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1 hover:border-primary/40 transition-colors">
            <span className="text-[11px] text-muted-foreground font-medium">الهيكل المعماري:</span>
            <p className="font-mono text-xs font-semibold text-foreground line-clamp-1">{algorithm.specs.structure}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1 hover:border-primary/40 transition-colors">
            <span className="text-[11px] text-muted-foreground font-medium">عدد الدورات:</span>
            <p className="font-mono text-sm font-bold text-foreground">{algorithm.specs.rounds}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1 hover:border-primary/40 transition-colors">
            <span className="text-[11px] text-muted-foreground font-medium">سنة التصميم / المطور:</span>
            <p className="text-xs font-semibold text-foreground line-clamp-1">
              {algorithm.specs.year} · {algorithm.specs.designer}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-1 hover:border-primary/40 transition-colors">
            <span className="text-[11px] text-muted-foreground font-medium">المعيار الرسمي:</span>
            <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
              {algorithm.specs.standard}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Visual Architecture Engine (Feistel/SPN/Stream Stepper) */}
      <section className="space-y-3">
        <AlgorithmVisualizer
          algorithmSlug={algorithm.slug}
          algorithmName={algorithm.name}
        />
      </section>

      {/* Podcast Section (Zero-Bandwidth) */}
      <section className="space-y-3">
        <PodcastPlayer algorithmSlug={algorithm.slug} />
      </section>

      {/* Interactive Code Workspace (RTL Vertical Tabs, Syntax, Search, Line Numbers, Fullscreen) */}
      <section className="space-y-3">
        <CodeWorkspace
          tabs={algorithm.codeTabs}
          defaultTabId="manual-python"
          algorithmSlug={algorithm.slug}
        />
      </section>

      {/* Interactive Live Playground */}
      <section className="space-y-3">
        <AlgorithmPlayground
          cipherType={algorithm.playgroundType}
          defaultPlaintext={algorithm.defaultPlaintext}
          defaultKey={algorithm.defaultKey}
          cipherName={algorithm.name}
        />
      </section>

      {/* Mathematical & Theoretical Sections with KaTeX Math Rendering */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">الدراسة الأكاديمية والتحليل الرياضي المعمق</h2>
        </div>

        <div className="space-y-6">
          {algorithm.theory.map((theory, idx) => (
            <Card key={theory.id || idx} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/60 py-3.5 px-5">
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                  {theory.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 text-sm text-foreground/90 leading-relaxed">
                <MathRenderer html={theory.htmlContent} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
