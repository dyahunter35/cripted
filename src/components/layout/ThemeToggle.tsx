"use client";

import * as React from "react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-24 h-9 rounded-xl border border-border bg-card/60" />
    );
  }

  return (
    <div className="flex items-center rounded-xl border border-border bg-card p-1 text-muted-foreground shadow-xs">
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
          theme === "light"
            ? "bg-amber-500 text-white shadow-xs"
            : "hover:text-foreground hover:bg-secondary"
        }`}
        title="الوضع النهاري الواضح (Light)"
        aria-label="Light mode"
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">نهاري</span>
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "hover:text-foreground hover:bg-secondary"
        }`}
        title="الوضع الليلي التقني (Dark)"
        aria-label="Dark mode"
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">ليلي</span>
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold transition-all ${
          theme === "system"
            ? "bg-slate-700 text-white shadow-xs"
            : "hover:text-foreground hover:bg-secondary"
        }`}
        title="تلقائي حسب نظام التشغيل"
        aria-label="System mode"
      >
        <Laptop className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
