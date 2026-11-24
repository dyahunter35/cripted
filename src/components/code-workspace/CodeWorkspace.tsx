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
  Layers,
  ChevronDown,
  Info,
} from "lucide-react";
import { CodeTabItem } from "@/types/algorithm";

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
  const [activeTabId, setActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : "")
  );
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSelectOpen, setMobileSelectOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const lines = useMemo(() => {
    if (!activeTab?.code) return [];
    return activeTab.code.split("\n");
  }, [activeTab]);

  const searchMatchesCount = useMemo(() => {
    if (!searchQuery.trim() || !activeTab?.code) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = activeTab.code.match(regex);
    return matches ? matches.length : 0;
  }, [searchQuery, activeTab]);

  const handleCopy = async () => {
    if (!activeTab?.code) return;
    try {
      await navigator.clipboard.writeText(activeTab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  const handleDownload = () => {
    if (!activeTab?.code) return;
    const blob = new Blob([activeTab.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeTab.fileName || `${algorithmSlug}_code.txt`;
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
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border border-border bg-card shadow-sm transition-all overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none p-4 bg-background" : ""
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>مساحة العمل البرمجية (Code Workspace)</span>
              <span className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {lines.length} أسطر
              </span>
            </h3>
          </div>
        </div>

        {/* Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="بحث في الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-32 sm:w-44 rounded-md border border-border bg-background pr-8 pl-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <span className="absolute left-2 text-[10px] text-muted-foreground bg-muted px-1 rounded">
                {searchMatchesCount}
              </span>
            )}
          </div>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            title={wordWrap ? "إلغاء التفاف الأسطر" : "تفعيل التفاف الأسطر"}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
              wordWrap
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <WrapText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">التفاف</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
              copied
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-background text-foreground hover:bg-secondary"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">نسخ</span>
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            title="تنزيل الملف المصدري"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">تنزيل</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-secondary transition-colors"
            title={isFullscreen ? "تصغير الشاشة" : "ملء الشاشة"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Workspace Body: Right Vertical Tabs + Left Code Area */}
      <div className="flex flex-col md:flex-row min-h-[480px]">
        {/* Right Vertical Tabs (RTL Start) */}
        <div className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-l border-border bg-muted/20 p-3 space-y-2 shrink-0">
          <div className="text-xs font-bold text-muted-foreground px-2 py-1 flex items-center justify-between">
            <span>ملفات الأكواد المتوفرة</span>
            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono">{tabs.length} ملفات</span>
          </div>

          <div className="space-y-1.5">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isPy = tab.language === "python";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`w-full text-right rounded-lg p-2.5 transition-all flex flex-col gap-1 border ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border/60 bg-card/60 text-foreground hover:bg-secondary hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-semibold dir-ltr text-left">
                      {tab.fileName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isPy
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {tab.language.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 leading-normal">
                    {tab.description}
                  </p>
                </button>
              );
            })}
          </div>

          {activeTab && (
            <div className="mt-4 rounded-lg border border-border/80 bg-background/50 p-2.5 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>عن هذا الملف:</span>
              </div>
              <p>{activeTab.description}</p>
            </div>
          )}
        </div>

        {/* Left Code Display Panel (Strictly LTR) */}
        <div className="flex-1 flex flex-col bg-[#0d1117] text-[#c9d1d9] overflow-hidden dir-ltr">
          {/* File bar */}
          <div className="flex items-center justify-between border-b border-border/20 bg-[#161b22] px-4 py-2 text-xs font-mono text-[#8b949e]">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <span className="text-white font-medium">{activeTab?.fileName}</span>
              <span className="text-[10px] text-[#8b949e]">· {lines.length} lines</span>
            </div>
            <div className="text-[11px] text-[#8b949e]">UTF-8 · Python 3.x</div>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 overflow-auto max-h-[580px] p-4 font-mono text-xs leading-relaxed selection:bg-primary/30">
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
                      className={`hover:bg-white/5 transition-colors ${
                        hasMatch ? "bg-amber-500/20" : ""
                      }`}
                    >
                      {/* Line Number */}
                      <td className="w-10 pr-4 pl-1 text-right text-[#484f58] select-none align-top font-mono text-[11px]">
                        {lineNum}
                      </td>

                      {/* Code Content */}
                      <td
                        className={`text-left pl-2 align-top ${
                          wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                        }`}
                      >
                        {formatCodeLine(line, searchQuery)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple highlighter & search match visualizer
function formatCodeLine(line: string, query: string) {
  if (!line) return <span>&nbsp;</span>;

  // Search match highlight
  if (query.trim()) {
    const parts = line.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-400 text-black px-0.5 rounded-xs font-bold">
              {part}
            </mark>
          ) : (
            <span key={i}>{colorizeSyntax(part)}</span>
          )
        )}
      </span>
    );
  }

  return colorizeSyntax(line);
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function colorizeSyntax(text: string) {
  // If line starts with comment
  const trimmed = text.trim();
  if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
    return <span className="text-[#8b949e] italic">{text}</span>;
  }

  // Keywords
  const pyKeywords = [
    "def ",
    "class ",
    "import ",
    "from ",
    "return ",
    "for ",
    "while ",
    "if ",
    "elif ",
    "else:",
    "try:",
    "except",
    "with ",
    "as ",
    "lambda ",
    "yield ",
    "True",
    "False",
    "None",
    "self",
    "in ",
    "range",
    "bytes",
    "bytearray",
  ];

  return <span>{text}</span>;
}
