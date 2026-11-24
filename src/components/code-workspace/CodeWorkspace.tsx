"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
} from "lucide-react";
import { CodeTabItem } from "@/types/algorithm";
import codeExplanationsData from "@/content/code_explanations.json";

interface CodeWorkspaceProps {
  tabs: CodeTabItem[];
  defaultTabId?: string;
  algorithmSlug: string;
}

export function CodeWorkspace({
  tabs,
  defaultTabId,
  algorithmSlug,
}: CodeWorkspaceProps) {
  // 1. Top File Tabs state
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : "")
  );

  // 2. Full Code Accordion state
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // 3. Line-by-Line selected snippet state
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

  // Line-by-line explanations for this algorithm
  const explanations = useMemo(() => {
    const data = (codeExplanationsData as Record<string, any[]>)[algorithmSlug];
    return Array.isArray(data) && data.length > 0 ? data : [];
  }, [algorithmSlug]);

  const activeExplanation = useMemo(() => {
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
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none p-4 bg-background overflow-y-auto" : ""
      }`}
    >
      {/* 1. TOP TABS: File Switcher */}
      <div className="border-b border-border bg-muted/40 px-4 pt-3 pb-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isPy = tab.language === "python";
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setSelectedExplainIndex(0);
                }}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-2 text-xs font-bold transition-all border-t border-x ${
                  isActive
                    ? "bg-card border-border text-primary border-b-2 border-b-primary shadow-xs"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span className="font-mono dir-ltr">{tab.fileName}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  {tab.category === "manual"
                    ? "(يدوي)"
                    : tab.category === "libs"
                    ? "(مكتبات)"
                    : tab.category === "stego"
                    ? "(إخفاء)"
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
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. ACCORDION: عرض الكود بالكامل كاملاً بين التابس وشرح الأكواد */}
      <div className="border-b border-border/80 bg-background/50">
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-xs font-bold text-foreground hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span>عرض الكود المصدري كاملاً ({activeTab?.fileName})</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
              {lines.length} سطر
            </span>
          </div>
          <div className="flex items-center gap-2 text-primary text-xs">
            <span>{isAccordionOpen ? "طي الكود الكامل" : "فتح واستعراض الكود الكامل"}</span>
            {isAccordionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {/* Accordion Content */}
        {isAccordionOpen && (
          <div className="border-t border-border bg-[#0d1117] text-[#c9d1d9] dir-ltr">
            {/* Toolbar inside full code */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#30363d] bg-[#161b22] px-4 py-2.5 gap-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                <span className="text-white font-mono text-xs font-semibold">{activeTab?.fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search in code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 w-36 sm:w-48 rounded-md border border-[#30363d] bg-[#0d1117] pl-8 pr-3 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                {/* Wrap */}
                <button
                  onClick={() => setWordWrap(!wordWrap)}
                  className={`flex h-7 items-center gap-1 rounded-md px-2 text-xs font-mono transition-colors ${
                    wordWrap ? "bg-primary text-white" : "bg-[#21262d] text-[#8b949e] hover:text-white"
                  }`}
                  title="Word Wrap"
                >
                  <WrapText className="h-3 w-3" />
                  <span>Wrap</span>
                </button>
                {/* Copy */}
                <button
                  onClick={handleCopyFull}
                  className="flex h-7 items-center gap-1 rounded-md bg-[#21262d] px-2.5 text-xs text-white hover:bg-[#30363d] transition-colors font-mono"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed">
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const hasMatch =
                      searchQuery.trim().length > 0 &&
                      line.toLowerCase().includes(searchQuery.toLowerCase());
                    return (
                      <tr key={idx} className={hasMatch ? "bg-amber-500/20" : "hover:bg-white/5"}>
                        <td className="w-12 pr-4 pl-1 text-right text-[#484f58] select-none align-top font-mono text-[11px]">
                          {lineNum}
                        </td>
                        <td
                          className={`text-left pl-2 align-top ${
                            wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                          }`}
                        >
                          {line || " "}
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

      {/* 3. LINE-BY-LINE EXPLANATION: القائمة الجانبية للشرح وتتبع الكود */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border/70 pb-3">
          <BookOpen className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">
            تحليل وشرح الأسطر البرمجية سطر بسطر (Line-by-Line Breakdown)
          </h4>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary font-bold">
            {explanations.length} مقاطع مشروحة
          </span>
        </div>

        {explanations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[420px]">
            {/* القائمة الجانبية على اليمين (RTL): المقاطع والأسطر */}
            <div className="lg:col-span-5 space-y-2 border-b lg:border-b-0 lg:border-l border-border/70 lg:pl-4 pb-4 lg:pb-0 max-h-[500px] overflow-y-auto">
              <span className="text-[11px] font-bold text-muted-foreground block mb-2">
                اختر السطر / الدالة لتتبع عملها وشرحها بالتفصيل:
              </span>

              <div className="space-y-1.5">
                {explanations.map((item, idx) => {
                  const isSelected = idx === selectedExplainIndex;
                  const firstLine = item.snippet.split("\n")[0];
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedExplainIndex(idx)}
                      className={`w-full text-right rounded-xl p-3 transition-all border text-xs flex flex-col gap-1.5 ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border/60 bg-card/60 text-foreground hover:bg-secondary hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-xs font-bold dir-ltr text-left line-clamp-1">
                          {firstLine}
                        </span>
                        <span className="text-[10px] font-mono rounded bg-secondary px-1.5 py-0.5 text-muted-foreground">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.explanation}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* مساحة العرض على اليسار: الكود سطر بسطر + الشرح المفصل */}
            <div className="lg:col-span-7 space-y-4">
              {activeExplanation && (
                <div className="space-y-4 rounded-xl border border-border/80 bg-background/60 p-5">
                  {/* Snippet box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary flex items-center gap-1.5">
                        <Code2 className="h-4 w-4" />
                        <span>المقطع البرمجي قيد التحليل:</span>
                      </span>
                      <button
                        onClick={() => handleCopySnippet(activeExplanation.snippet)}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-mono"
                      >
                        {snippetCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>نسخ المقطع</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 text-[#58a6ff] font-mono text-xs leading-relaxed dir-ltr text-left overflow-x-auto shadow-inner">
                      <pre className="whitespace-pre">{activeExplanation.snippet}</pre>
                    </div>
                  </div>

                  {/* Purpose & Detailed Academic Explanation */}
                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Info className="h-4 w-4 text-emerald-500" />
                      <span>ماذا يفعل هذا السطر وكيف يخدم الخوارزمية؟</span>
                    </div>
                    <div
                      className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{ __html: activeExplanation.htmlExplanation }}
                    />
                  </div>
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
