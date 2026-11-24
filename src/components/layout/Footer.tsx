import React from "react";
import Link from "next/link";
import { Shield, BookOpen, Download, Terminal } from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40 mt-20">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground">Crypto & Stego Lab</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              منصة أكاديمية وتطبيقية متكاملة لمقرر التعمية وتأمين البيانات لمرحلة الماجستير.
              تشمل 9 خوارزميات تشفير متناظرة (كتل وتدفق) مطبقة بالكامل يدوياً ومن الصفر بلغات Python و JavaScript،
              بالإضافة إلى تقنيات إخفاء البيانات السرية (LSB Steganography) وبودكاست تعليمي حواري.
            </p>
            <div className="text-xs text-muted-foreground pt-2">
              جميع الحقوق محفوظة © 2026 — مشروع أكاديمي مفتوح المصدر (MIT License)
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">المنهج الأساسي</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><Link href="/algorithms/des" className="hover:text-primary transition-colors">DES (FIPS 46-3)</Link></li>
              <li><Link href="/algorithms/aes" className="hover:text-primary transition-colors">AES (Rijndael / FIPS 197)</Link></li>
              <li><Link href="/algorithms/rc5" className="hover:text-primary transition-colors">RC5 (Rotations 32/12/16)</Link></li>
              <li><Link href="/algorithms/idea" className="hover:text-primary transition-colors">IDEA (Lai-Massey)</Link></li>
              <li><Link href="/algorithms/gost" className="hover:text-primary transition-colors">GOST Magma (ГОСТ)</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">خوارزميات وتقنيات إضافية</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li><Link href="/algorithms/rc4" className="hover:text-primary transition-colors">RC4 & RC4-drop768</Link></li>
              <li><Link href="/algorithms/rc6" className="hover:text-primary transition-colors">RC6 (AES Finalist)</Link></li>
              <li><Link href="/algorithms/cast" className="hover:text-primary transition-colors">CAST-128 (CAST5)</Link></li>
              <li><Link href="/algorithms/blowfish" className="hover:text-primary transition-colors">Blowfish (Pi S-Boxes)</Link></li>
              <li><Link href="/steganography" className="hover:text-primary transition-colors">إخفاء البيانات (BMP & WAV)</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Terminal className="h-3.5 w-3.5 text-emerald-500" />
              <span>Next.js 15 · TypeScript · Tailwind CSS · Pure Python Verified</span>
            </span>
          </div>
          <div>
            <a
              href="https://github.com/dyahunter35/cripted"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>dyahunter35/cripted</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
