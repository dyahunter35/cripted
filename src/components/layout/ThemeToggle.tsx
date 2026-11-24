"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md border border-border bg-card/50" />
    );
  }

  return (
    <div className="flex items-center rounded-lg border border-border bg-card/60 p-0.5 text-muted-foreground backdrop-blur-sm">
      <button
        onClick={() => setTheme("light")}
        className={`rounded-md p-1.5 transition-colors ${
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "hover:text-foreground"
        }`}
        title="الوضع النهاري (Light)"
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`rounded-md p-1.5 transition-colors ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "hover:text-foreground"
        }`}
        title="الوضع الليلي (Dark)"
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`rounded-md p-1.5 transition-colors ${
          theme === "system"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "hover:text-foreground"
        }`}
        title="تلقائي حسب النظام (System)"
        aria-label="System mode"
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
