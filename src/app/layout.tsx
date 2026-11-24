import type { Metadata } from "next";
import { Cairo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crypto & Stego Lab — منصة دراسة خوارزميات التشفير وإخفاء البيانات",
  description:
    "مختبر أكاديمي تفاعلي متكامل لدراسة وتطبيق 9 خوارزميات تشفير متناظرة وتقنيات إخفاء البيانات (Steganography) بالوسائط المتعددة، مع أكواد نقية بلغات Python و JavaScript وبودكاست تعليمي.",
  keywords: [
    "Cryptography",
    "Steganography",
    "DES",
    "AES",
    "RC5",
    "IDEA",
    "GOST",
    "RC4",
    "RC6",
    "CAST-128",
    "Blowfish",
    "تشفير",
    "إخفاء البيانات",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${jetbrainsMono.variable} font-sans min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
