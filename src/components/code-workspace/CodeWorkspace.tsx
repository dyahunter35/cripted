"use client";

import React, { useState, useMemo, useRef, useEffect, useId } from "react";
import {
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  Search,
  WrapText,
  FileCode,
  Terminal,
  ChevronDown,
  ChevronUp,
  Info,
  BookOpen,
  Code2,
  Sparkles,
  Layers,
  ShieldCheck,
  Cpu,
  GraduationCap,
  ArrowRightLeft,
  Binary,
} from "lucide-react";
import { CodeTabItem } from "@/types/algorithm";
import codeExplanationsData from "@/content/code_explanations.json";
import { MathRenderer } from "@/components/algorithms/MathRenderer";

interface CodeWorkspaceProps {
  tabs: CodeTabItem[];
  defaultTabId?: string;
  algorithmSlug: string;
}

interface ExplanationItem {
  id?: string;
  role?: string;
  category?: string;
  badge?: string;
  inputs?: string;
  outputs?: string;
  snippet: string;
  explanation: string;
  htmlExplanation: string;
  math?: string;
  security?: string;
  examTip?: string;
}

/**
 * Tokenize a line of Python code and return rich syntax-colored React spans.
 */
function highlightPythonLine(line: string): React.ReactNode {
  if (!line) return <span>&nbsp;</span>;

  // Check if line is purely comment
  const trimmed = line.trimStart();
  if (trimmed.startsWith("#")) {
    return (
      <span className="text-slate-400 dark:text-slate-500 italic">
        {line}
      </span>
    );
  }

  // Tokenization regular expression
  // 1: comment
  // 2: triple or double/single quotes string
  // 3: hex/bin/numeric literal
  // 4: language keywords
  // 5: built-in functions & standard modules
  // 6: booleans & None
  // 7: function definition or function call
  // 8: bitwise / arithmetic / comparison operators
  const tokenRegex =
    /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b0x[0-9a-fA-F]+\b|\b0b[01]+\b|\b\d+\b)|(\b(?:def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|in|is|not|and|or|lambda|pass|break|continue|yield|raise|assert|async|await)\b)|(\b(?:range|len|print|int|str|bytes|bytearray|list|dict|set|tuple|open|ord|chr|hex|bin|round|abs|sum|min|max|enumerate|zip|isinstance|struct|hashlib|sys|os|math|wave|Crypto)\b)|(\b(?:True|False|None)\b)|(\b[a-zA-Z_]\w*(?=\s*\())|([+\-*/%^&|~=<>!]+)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    // Add raw text before the match
    if (match.index > lastIndex) {
      elements.push(
        <span key={`txt-${lastIndex}`} className="text-slate-800 dark:text-slate-200">
          {line.substring(lastIndex, match.index)}
        </span>
      );
    }

    const key = `tok-${match.index}`;

    if (match[1]) {
      // 1. Comment
      elements.push(
        <span key={key} className="text-slate-400 dark:text-slate-500 italic">
          {match[1]}
        </span>
      );
    } else if (match[2]) {
      // 2. String
      elements.push(
        <span key={key} className="text-emerald-600 dark:text-emerald-400 font-medium">
          {match[2]}
        </span>
      );
    } else if (match[3]) {
      // 3. Hex / Number
      elements.push(
        <span key={key} className="text-amber-600 dark:text-orange-400 font-semibold font-mono">
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      // 4. Keyword
      elements.push(
        <span key={key} className="text-purple-600 dark:text-purple-400 font-bold">
          {match[4]}
        </span>
      );
    } else if (match[5]) {
      // 5. Built-in
      elements.push(
        <span key={key} className="text-cyan-600 dark:text-cyan-400 font-semibold">
          {match[5]}
        </span>
      );
    } else if (match[6]) {
      // 6. Bool / None
      elements.push(
        <span key={key} className="text-amber-500 dark:text-amber-300 font-bold">
          {match[6]}
        </span>
      );
    } else if (match[7]) {
      // 7. Function Call / Def
      elements.push(
        <span key={key} className="text-blue-600 dark:text-amber-300 font-semibold">
          {match[7]}
        </span>
      );
    } else if (match[8]) {
      // 8. Operators
      elements.push(
        <span key={key} className="text-sky-600 dark:text-sky-300 font-bold">
          {match[8]}
        </span>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Add trailing text
  if (lastIndex < line.length) {
    elements.push(
      <span key={`tail-${lastIndex}`} className="text-slate-800 dark:text-slate-200">
        {line.substring(lastIndex)}
      </span>
    );
  }

  return <>{elements}</>;
}

export function CodeWorkspace({
  tabs,
  defaultTabId,
  algorithmSlug,
}: CodeWorkspaceProps) {
  const workspaceId = useId();
  // 1. Top File Tabs state
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : "")
  );

  // 2. Full Code Accordion state
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // 3. Line-by-Line selected snippet index
  const [selectedExplainIndex, setSelectedExplainIndex] = useState(0);

  // Full code tools
  const [copied, setCopied] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const lines = useMemo(() => {
    if (!activeTab?.code) return [];
    return activeTab.code.split("\n");
  }, [activeTab]);

  // Line-by-line explanations DYNAMICALLY resolving per active tab!
  const explanations = useMemo((): ExplanationItem[] => {
    const rawData = codeExplanationsData as Record<string, any>;
    const algoData = rawData[algorithmSlug];
    if (!algoData) return [];

    // Tab-specific check
    if (algoData[activeTabId] && Array.isArray(algoData[activeTabId])) {
      return algoData[activeTabId];
    }

    // Check category fallback (e.g. libs-python vs libs)
    if (activeTabId.includes("libs") && algoData["libs-python"]) {
      return algoData["libs-python"];
    }
    if (activeTabId.includes("manual") && algoData["manual-python"]) {
      return algoData["manual-python"];
    }

    // Shared stego fallback
    if (activeTabId === "stego-image" && rawData["_shared"]?.["stego-image"]) {
      return rawData["_shared"]["stego-image"];
    }
    if (activeTabId === "stego-audio" && rawData["_shared"]?.["stego-audio"]) {
      return rawData["_shared"]["stego-audio"];
    }

    // If algoData is a raw flat array
    if (Array.isArray(algoData)) {
      return algoData;
    }

    // Fallback to manual
    if (algoData["manual-python"] && Array.isArray(algoData["manual-python"])) {
      return algoData["manual-python"];
    }

    return [];
  }, [algorithmSlug, activeTabId]);

  const activeExplanation = useMemo((): ExplanationItem | null => {
    if (explanations.length === 0) return null;
    return explanations[selectedExplainIndex] || explanations[0];
  }, [explanations, selectedExplainIndex]);

  const handleCopyFull = async () => {
    if (!activeTab?.code) return;
    try {
      await navigator.clipboard.writeText(activeTab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopySnippet = async (snippet: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (!activeTab?.code) return;
    const blob = new Blob([activeTab.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeTab.fileName || `${algorithmSlug}_code.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-primary/20 bg-card shadow-lg overflow-hidden space-y-0 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none p-4 bg-background overflow-y-auto"
          : ""
      }`}
    >
      {/* 1. TOP TABS: File Switcher */}
      <div className="border-b border-border bg-muted/40 px-4 pt-3 pb-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                aria-pressed={isActive}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setSelectedExplainIndex(0);
                }}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all border-t border-x ${
                  isActive
                    ? "bg-card border-border text-primary border-b-2 border-b-primary shadow-xs"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span className="font-mono dir-ltr">{tab.fileName}</span>
                <span className="text-[10px] opacity-80 font-normal">
                  {tab.category === "manual"
                    ? "(تطبيق من الصفر)"
                    : tab.category === "libs"
                    ? "(المكتبات القياسية)"
                    : tab.category === "wrapper"
                    ? "(واجهة توافق)"
                    : tab.category === "stego"
                    ? "(إخفاء بيانات)"
                    : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={handleDownload}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            title="تنزيل الملف المصدري"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">تنزيل {activeTab?.fileName}</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-secondary transition-colors"
            title={isFullscreen ? "تصغير" : "ملء الشاشة"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. ACCORDION: عرض الكود بالكامل كاملاً مع تلوين الأكواد والبحث */}
      <div className="border-b border-border/80 bg-background/50">
        <button
          aria-expanded={isAccordionOpen}
          aria-controls={`${workspaceId}-code`}
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-xs font-bold text-foreground hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-primary" />
            <span>عرض واستعراض الكود المصدري كاملاً ({activeTab?.fileName})</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              {lines.length} سطر برمجياً
            </span>
          </div>
          <div className="flex items-center gap-2 text-primary text-xs">
            <span>{isAccordionOpen ? "طي الكود الكامل" : "استعراض الكود الكامل الملون"}</span>
            {isAccordionOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {/* Accordion Content */}
        {isAccordionOpen && (
          <div id={`${workspaceId}-code`} className="border-t border-border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 dir-ltr transition-colors">
            {/* Toolbar inside full code */}
            <div className="flex flex-wrap items-center justify-between border-b border-border bg-slate-100/90 dark:bg-slate-900 px-4 py-2.5 gap-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                <span className="text-foreground font-mono text-xs font-semibold">
                  {activeTab?.fileName}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-medium">
                  Python Syntax Highlighted
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search in code..."
                    aria-label="البحث في الكود المصدري"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-36 sm:w-48 rounded-md border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                {/* Wrap */}
                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={`flex h-7 items-center gap-1 rounded-md px-2 text-xs font-mono transition-colors ${
                    wordWrap
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                  title="Word Wrap"
                >
                  <WrapText className="h-3 w-3" />
                  <span>Wrap</span>
                </button>
                {/* Copy */}
                <button
                  onClick={handleCopyFull}
                  className="flex h-7 items-center gap-1 rounded-md bg-secondary text-foreground hover:bg-secondary/80 px-2.5 text-xs transition-colors font-mono font-medium border border-border/60"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy All"}</span>
                </button>
              </div>
            </div>

            {/* Code Body with Syntax Highlighting */}
            <div className="max-h-[480px] overflow-auto p-4 font-mono text-xs leading-relaxed">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const hasMatch =
                      searchQuery.trim().length > 0 &&
                      line.toLowerCase().includes(searchQuery.toLowerCase());
                    return (
                      <tr
                        key={idx}
                        className={
                          hasMatch
                            ? "bg-amber-500/25 ring-1 ring-amber-500/40"
                            : "hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors"
                        }
                      >
                        <td className="w-12 pr-4 pl-1 text-right text-slate-400 dark:text-slate-500 select-none align-top font-mono text-[11px]">
                          {lineNum}
                        </td>
                        <td
                          className={`text-left pl-2 align-top ${
                            wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                          }`}
                        >
                          {highlightPythonLine(line)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. LINE-BY-LINE EXPLANATION: القائمة الجانبية للشرح وتتبع الكود سطر بسطر */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              تحليل وشرح الأسطر البرمجية سطر بسطر (Interactive Code Inspector)
            </h4>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary font-bold">
              {explanations.length} مقاطع مشروحة في {activeTab?.fileName}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            اضغط على أي دالة أو سطر في القائمة لتشريح أثره الرياضي والأمني
          </span>
        </div>

        {explanations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
            {/* القائمة الجانبية على اليمين (RTL): المقاطع والدوال */}
            <div className="lg:col-span-4 space-y-2 border-b lg:border-b-0 lg:border-l border-border/70 lg:pl-5 pb-4 lg:pb-0 max-h-[640px] overflow-y-auto">
              <span className="text-[11px] font-bold text-muted-foreground block mb-2">
                دوال ومقاطع {activeTab?.fileName}:
              </span>

              <div className="space-y-2">
                {explanations.map((item, idx) => {
                  const isSelected = idx === selectedExplainIndex;
                  const firstLine = item.snippet.split("\n")[0];
                  return (
                    <button
                      key={item.id || idx}
                      onClick={() => setSelectedExplainIndex(idx)}
                      className={`w-full text-right rounded-xl p-3.5 transition-all border text-xs flex flex-col gap-2 relative overflow-hidden ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 text-foreground hover:bg-secondary/70 hover:border-border"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-primary" />
                      )}

                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-xs font-bold dir-ltr text-left line-clamp-1 text-foreground">
                          {firstLine}
                        </span>
                        <span className="text-[10px] font-mono rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">
                          #{idx + 1}
                        </span>
                      </div>

                      {item.role && (
                        <div className="text-[11px] font-semibold text-primary/90 flex items-center gap-1.5">
                          <Layers className="h-3 w-3" />
                          <span className="line-clamp-1">{item.role}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.explanation}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* مساحة العرض على اليسار: بطاقة الشرح الأكاديمي الاحترافية (Inspector) */}
            <div className="lg:col-span-8 space-y-4">
              {activeExplanation && (
                <div className="space-y-4 rounded-2xl border border-border/90 bg-card p-5 sm:p-6 shadow-sm">
                  {/* 1. Header Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5" />
                        <span>{activeExplanation.role || "المقطع قيد التحليل"}</span>
                      </span>
                      {activeExplanation.badge && (
                        <span className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-mono font-medium text-foreground">
                          {activeExplanation.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground dir-ltr">
                      {activeTab?.fileName}
                    </div>
                  </div>

                  {/* 2. Interactive macOS Code Chrome Box with Syntax Coloring */}
                  <div className="space-y-1.5">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950 overflow-hidden shadow-xs transition-colors">
                      {/* Window Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                          </div>
                          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold pl-2">
                            {activeTab?.fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopySnippet(activeExplanation.snippet)}
                          className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 hover:text-foreground font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md shadow-2xs transition-colors"
                        >
                          {snippetCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>نسخ المقطع</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code body with line-by-line syntax highlighting */}
                      <div className="p-4 font-mono text-xs leading-relaxed dir-ltr text-left overflow-x-auto">
                        <table className="w-full border-collapse">
                          <tbody>
                            {activeExplanation.snippet
                              .split("\n")
                              .map((snipLine, sIdx) => (
                                <tr key={sIdx} className="hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors">
                                  <td className="w-8 pr-3 text-right text-slate-400 dark:text-slate-500 select-none align-top font-mono text-[11px]">
                                    {sIdx + 1}
                                  </td>
                                  <td className="whitespace-pre align-top pl-1">
                                    {highlightPythonLine(snipLine)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* 3. Deep Technical Analysis Grid (4-pillar analysis) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                    {/* I/O Specifications */}
                    {(activeExplanation.inputs || activeExplanation.outputs) && (
                      <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
                          <span>المدخلات والمخرجات (I/O Specification)</span>
                        </div>
                        <div className="space-y-1 font-mono text-xs">
                          {activeExplanation.inputs && (
                            <div>
                              <span className="text-muted-foreground text-[11px] font-sans">المدخل: </span>
                              <span className="text-blue-500 dark:text-blue-400">{activeExplanation.inputs}</span>
                            </div>
                          )}
                          {activeExplanation.outputs && (
                            <div>
                              <span className="text-muted-foreground text-[11px] font-sans">المخرج: </span>
                              <span className="text-emerald-600 dark:text-emerald-400">{activeExplanation.outputs}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mathematical Formula (KaTeX) */}
                    {activeExplanation.math && (
                      <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <Binary className="h-3.5 w-3.5 text-purple-500" />
                          <span>المعادلة والأساس الرياضي (KaTeX)</span>
                        </div>
                        <div className="text-xs text-foreground py-1">
                          <MathRenderer html={`$${activeExplanation.math}$`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Purpose & Detailed Academic Explanation */}
                  <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Info className="h-4 w-4 text-emerald-500" />
                      <span>الشرح التحليلي والمنطق البرمجي</span>
                    </div>
                    <div
                      className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{ __html: activeExplanation.htmlExplanation }}
                    />
                  </div>

                  {/* Security Significance & Exam Note */}
                  {(activeExplanation.security || activeExplanation.examTip) && (
                    <div className="space-y-3">
                      {activeExplanation.security && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span>الأثر الأمني والتشفيري (Security & Cryptanalysis)</span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {activeExplanation.security}
                          </p>
                        </div>
                      )}

                      {activeExplanation.examTip && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <GraduationCap className="h-4 w-4" />
                            <span>إرشادات لطلاب الماجستير والامتحانات العملية (Academic Tip)</span>
                          </div>
                          <p className="text-xs text-foreground/85 leading-relaxed">
                            {activeExplanation.examTip}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            قم بفتح الكود الكامل أعلاه لمراجعة كافة أسطر وتعليمات هذا الملف.
          </div>
        )}
      </div>
    </div>
  );
}
