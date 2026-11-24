"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Lock, FileCode, Layers, Menu, X, Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const coreCiphers = [
  { name: "DES", slug: "des", desc: "64-bit / Feistel" },
  { name: "AES", slug: "aes", desc: "128-bit / SPN" },
  { name: "RC5", slug: "rc5", desc: "32/12/16 Rotations" },
  { name: "IDEA", slug: "idea", desc: "Lai-Massey / Mod 65537" },
  { name: "GOST", slug: "gost", desc: "Magma 256-bit" },
];

const extraCiphers = [
  { name: "RC4", slug: "rc4", desc: "Stream / PRGA" },
  { name: "RC6", slug: "rc6", desc: "AES Finalist" },
  { name: "CAST-128", slug: "cast", desc: "PGP Classic" },
  { name: "Blowfish", slug: "blowfish", desc: "Pi S-Boxes" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground tracking-tight text-lg">Crypto Lab</span>
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  v3.0 Academic
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">منصة دراسة التعمية وإخفاء البيانات</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              pathname === "/" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            الرئيسية
          </Link>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Core group */}
          <span className="text-xs font-semibold text-primary px-1">المنهج الأساسي:</span>
          {coreCiphers.map((c) => (
            <Link
              key={c.slug}
              href={`/algorithms/${c.slug}`}
              className={`rounded-lg px-2.5 py-1 transition-colors text-xs font-mono uppercase ${
                pathname.includes(`/algorithms/${c.slug}`)
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {c.name}
            </Link>
          ))}

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Extra group */}
          <span className="text-xs font-semibold text-muted-foreground px-1">إضافية:</span>
          {extraCiphers.map((c) => (
            <Link
              key={c.slug}
              href={`/algorithms/${c.slug}`}
              className={`rounded-lg px-2 py-1 transition-colors text-xs font-mono uppercase ${
                pathname.includes(`/algorithms/${c.slug}`)
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {c.name}
            </Link>
          ))}

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Steganography */}
          <Link
            href="/steganography"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors text-xs font-medium ${
              pathname.includes("/steganography")
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
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
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <GithubIcon className="h-4 w-4" />
            <span>المستودع</span>
          </a>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-card/95 backdrop-blur-md px-4 py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              🏠 الرئيسية
            </Link>
            <Link
              href="/steganography"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-secondary"
            >
              🖼️ مختبر إخفاء البيانات (Steganography LSB)
            </Link>
          </div>

          <div>
            <div className="text-xs font-bold text-primary mb-2">🏛️ خوارزميات المنهج الأساسية:</div>
            <div className="grid grid-cols-2 gap-2">
              {coreCiphers.map((c) => (
                <Link
                  key={c.slug}
                  href={`/algorithms/${c.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md border border-border/60 bg-background/50 p-2 text-xs font-mono hover:border-primary transition-colors"
                >
                  <span className="font-bold text-foreground">{c.name}</span>
                  <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2">⚡ الخوارزميات الإضافية:</div>
            <div className="grid grid-cols-2 gap-2">
              {extraCiphers.map((c) => (
                <Link
                  key={c.slug}
                  href={`/algorithms/${c.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md border border-border/60 bg-background/50 p-2 text-xs font-mono hover:border-primary transition-colors"
                >
                  <span className="font-bold text-foreground">{c.name}</span>
                  <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex justify-between items-center">
            <a
              href="https://github.com/dyahunter35/cripted"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <GithubIcon className="h-4 w-4" /> GitHub Repository
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
