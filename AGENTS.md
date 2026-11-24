# AGENTS.md — Guidelines for AI Coding Agents in Crypto & Stego Lab

Welcome to **Crypto & Stego Lab**, an academic developer workspace for cryptography and steganography education.

## Core Directives & Architecture

1. **Framework & Stack**:
   - Next.js (App Router) + TypeScript + Tailwind CSS
   - Component library: Accessible UI components modeled after shadcn/ui patterns
   - Icons: Lucide Icons (`lucide-react`)
   - Syntax Highlighting: Shiki / Prism with line numbering, copy, download, and search
   - Themes: `next-themes` (light, dark, system) with zero flash on load
   - Math: KaTeX for LaTeX mathematical formulas

2. **Bilingual & Layout Rules**:
   - Arabic RTL primary interface (`dir="rtl"`, Cairo or Inter font stack)
   - Code blocks and mathematical symbols strictly LTR (`dir="ltr"`, JetBrains Mono / Fira Code font stack)
   - Responsive design: Mobile, Tablet, Desktop tested

3. **Algorithm Preservation**:
   - NEVER delete, remove, or modify the mathematical correctness of existing Python and JavaScript algorithm implementations.
   - All 9 ciphers (DES, AES, RC5, IDEA, GOST Magma, RC4, RC6, CAST-128, Blowfish) and steganography (BMP & WAV LSB) must remain intact.
   - Pure Python and library implementations must match established reference vectors.

4. **Zero-Bandwidth Podcast Rules**:
   - Audio must NEVER preload (`preload="none"`).
   - Audio `src` attribute MUST remain unset until the user explicitly clicks the Play button.
   - No external Gemini API calls in the browser; podcasts are pre-generated statically into `podcasts.json` and served locally.
   - 0 KB initial audio payload on page load.

5. **Static Export & GitHub Pages**:
   - Next.js static export (`output: "export"`) with `basePath: "/cripted"`.
   - All dynamic routes must implement `generateStaticParams`.
