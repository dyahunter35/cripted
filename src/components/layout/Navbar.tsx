"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Layers,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Cpu,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const coreCiphers = [
  { name: "DES", slug: "des", desc: "معيار فيدرالي كلاسيكي (Feistel / 64-bit)" },
  { name: "AES", slug: "aes", desc: "المعيار السيادي العالمي (SPN / 128-bit)" },
  { name: "RC5", slug: "rc5", desc: "الدوران المعتمد على البيانات (32/12/16)" },
  { name: "IDEA", slug: "idea", desc: "خلط الزمر الجبرية الثلاث (Lai & Massey)" },
  { name: "GOST Magma", slug: "gost", desc: "المعيار الروسي القومي (256-bit Key)" },
];

const extraCiphers = [
  { name: "RC4", slug: "rc4", desc: "التشفير التدفقي الكلاسيكي و RC4-drop" },
  { name: "RC6", slug: "rc6", desc: "مرشح نهائي لمعيار AES ودالة تربيعية" },
  { name: "CAST-128", slug: "cast", desc: "شبكة فيستل ثلاثية معتمدة في PGP" },
  { name: "Blowfish", slug: "blowfish", desc: "صناديق S-boxes معتمدة على المفتاح وثابت Pi" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [algoMenuOpen, setAlgoMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAlgoMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary border border-primary/30 transition-all group-hover:scale-105">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-foreground tracking-tight text-lg">Crypto Lab</span>
                <span className="rounded-md bg-primary/15 border border-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  v3.0 Academic
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                مختبر التعمية وهندسة إخفاء البيانات
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation with Menu -> Submenu */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
          <Link
            href="/"
            className={`rounded-lg px-3 py-2 transition-colors ${
              pathname === "/"
                ? "bg-secondary text-primary font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            الرئيسية
          </Link>

          {/* Algorithms Dropdown Menu with Submenus */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAlgoMenuOpen(!algoMenuOpen)}
              onMouseEnter={() => setAlgoMenuOpen(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                pathname.includes("/algorithms") || algoMenuOpen
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <span>خوارزميات التشفير</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${algoMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Submenu Dropdown Panel */}
            {algoMenuOpen && (
              <div
                onMouseLeave={() => setAlgoMenuOpen(false)}
                className="absolute right-0 top-full mt-1.5 w-[580px] rounded-2xl border border-border/80 bg-card/95 p-5 shadow-2xl backdrop-blur-xl grid grid-cols-2 gap-4 animate-in fade-in-50 zoom-in-95 duration-150 z-50 text-right"
              >
                {/* Submenu 1: Core Curriculum */}
                <div className="space-y-2 border-l border-border/60 pl-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary">خوارزميات المنهج الأساسية</span>
                  </div>
                  <div className="space-y-1">
                    {coreCiphers.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/algorithms/${c.slug}`}
                        onClick={() => setAlgoMenuOpen(false)}
                        className={`group block rounded-lg p-2 transition-colors ${
                          pathname === `/algorithms/${c.slug}`
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-secondary/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">FIPS/RFC</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {c.desc}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Submenu 2: Additional Ciphers */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                    <Cpu className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold text-foreground">خوارزميات إضافية ومتقدمة</span>
                  </div>
                  <div className="space-y-1">
                    {extraCiphers.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/algorithms/${c.slug}`}
                        onClick={() => setAlgoMenuOpen(false)}
                        className={`group block rounded-lg p-2 transition-colors ${
                          pathname === `/algorithms/${c.slug}`
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-secondary/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-foreground group-hover:text-primary">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">Advanced</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {c.desc}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Steganography Direct Link */}
          <Link
            href="/steganography"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
              pathname.includes("/steganography")
                ? "bg-secondary text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
            <span>إخفاء البيانات (LSB)</span>
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <a
            href="https://github.com/dyahunter35/cripted"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors shadow-2xs"
          >
            <GithubIcon className="h-4 w-4" />
            <span>مستودع GitHub</span>
          </a>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-bold hover:bg-secondary"
            >
              🏠 الصفحة الرئيسية
            </Link>
            <Link
              href="/steganography"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-500 hover:bg-secondary"
            >
              🖼️ مختبر إخفاء البيانات (Steganography LSB)
            </Link>
          </div>

          <div>
            <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>خوارزميات المنهج الأساسية:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {coreCiphers.map((c) => (
                <Link
                  key={c.slug}
                  href={`/algorithms/${c.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs font-mono hover:border-primary transition-colors"
                >
                  <span className="font-bold text-foreground block">{c.name}</span>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{c.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span>الخوارزميات الإضافية والمتقدمة:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {extraCiphers.map((c) => (
                <Link
                  key={c.slug}
                  href={`/algorithms/${c.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs font-mono hover:border-primary transition-colors"
                >
                  <span className="font-bold text-foreground block">{c.name}</span>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{c.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
