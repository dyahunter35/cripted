"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  HardDrive,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  Sparkles,
  WifiOff,
} from "lucide-react";
import {
  getCachedPodcastsMeta,
  deleteCachedPodcast,
  clearAllCachedPodcasts,
  formatBytes,
  CachedPodcastMeta,
} from "@/lib/audio-cache";

export function AudioCacheManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [cachedItems, setCachedItems] = useState<CachedPodcastMeta[]>([]);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refreshCacheList = () => {
    setCachedItems(getCachedPodcastsMeta());
  };

  useEffect(() => {
    setMounted(true);
    refreshCacheList();

    const handleCacheUpdated = () => {
      refreshCacheList();
    };

    window.addEventListener("crypto-lab:cache-updated", handleCacheUpdated);
    return () =>
      window.removeEventListener("crypto-lab:cache-updated", handleCacheUpdated);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDelete = async (slug: string, audioFile: string) => {
    await deleteCachedPodcast(slug);
    refreshCacheList();
  };

  const handleClearAll = async () => {
    if (confirm("هل أنت متأكد من رغبتك في حذف كافة التسجيلات الصوتية المحفوظة محلياً؟")) {
      await clearAllCachedPodcasts();
      refreshCacheList();
    }
  };

  const totalBytes = cachedItems.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-border bg-card/60" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
          isOpen
            ? "border-primary bg-primary text-primary-foreground shadow-xs"
            : cachedItems.length > 0
            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        title="التسجيلات الصوتية المحفوظة في كاش المتصفح (Offline Podcasts)"
        aria-label="إدارة التخزين المؤقت للبودكاست"
      >
        <HardDrive className="h-4 w-4" />
        <span className="hidden lg:inline">الحفظ المؤقت</span>
        {cachedItems.length > 0 && (
          <span className="flex h-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold font-mono text-white shadow-2xs">
            {cachedItems.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 shadow-2xl z-50 text-right animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                  <WifiOff className="h-4 w-4 text-primary" />
                  <span>التسجيلات المحفوظة محلياً</span>
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                  Offline Ready
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                مخزنة في المتصفح للاستماع دون إنترنت
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Storage Summary Bar */}
          <div className="flex items-center justify-between py-2.5 px-3 my-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border text-xs">
            <span className="text-muted-foreground text-[11px]">المساحة المستهلكة:</span>
            <span className="font-mono font-bold text-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3 text-primary" />
              <span>{formatBytes(totalBytes)}</span>
              <span className="text-muted-foreground text-[10px]">({cachedItems.length} تسجيل)</span>
            </span>
          </div>

          {/* List of Cached Items */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {cachedItems.length === 0 ? (
              <div className="py-8 text-center space-y-2 px-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                  <HardDrive className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  لا توجد تسجيلات محفوظة حالياً
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  يتم حفظ البودكاست في الذاكرة المؤقتة تلقائياً عند الاستماع إليه، أو بالضغط على زر &quot;حفظ بدون إنترنت&quot; في مشغل البودكاست.
                </p>
              </div>
            ) : (
              cachedItems.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all shadow-2xs"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground text-xs uppercase font-mono">
                        {item.slug}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        • {item.duration}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.title}
                    </p>
                    <div className="text-[10px] text-primary font-mono font-semibold">
                      {formatBytes(item.sizeBytes)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/algorithms/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="استمع الآن"
                    >
                      <Play className="h-3.5 w-3.5 mr-0.5" />
                    </Link>

                    <button
                      onClick={() => handleDelete(item.slug, item.audioFile)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="حذف من الذاكرة المؤقتة"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {cachedItems.length > 0 && (
            <div className="pt-3 mt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-[10px] text-muted-foreground">
                يعمل بدون اتصال بالإنترنت 100%
              </span>
              <button
                onClick={handleClearAll}
                className="text-[11px] text-destructive hover:underline font-semibold"
              >
                مسح الكل
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
