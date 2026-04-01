"use client";

import * as React from "react";
import { Laptop, Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "crackd-prompt-chain-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  const resolvedTheme =
    mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;

  root.dataset.themeSetting = mode;
  root.dataset.theme = resolvedTheme;
}

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  Icon: typeof Sun;
}> = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Laptop },
];

export default function ThemeToggle() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("system");

  React.useEffect(() => {
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
        ? storedTheme
        : (root.dataset.themeSetting as ThemeMode | undefined) ?? "system";

    setThemeMode(nextTheme);
    applyTheme(nextTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme =
        (document.documentElement.dataset.themeSetting as ThemeMode | undefined) ??
        "system";

      if (currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  React.useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target || !containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const activeOption =
    themeOptions.find((option) => option.value === themeMode) ?? themeOptions[2];
  const ActiveIcon = activeOption.Icon;

  const handleSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    setMenuOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Theme menu. Current theme: ${activeOption.label}`}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] text-[color:var(--pc-text-muted)] transition hover:text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]"
      >
        <ActiveIcon className="h-5 w-5" />
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className="absolute bottom-14 left-1/2 z-20 w-44 -translate-x-1/2 rounded-2xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-strong)] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <div className="space-y-2">
            {themeOptions.map((option) => {
              const Icon = option.Icon;
              const isActive = option.value === themeMode;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => handleSelect(option.value)}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[0.65rem] uppercase tracking-[0.28em] transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]",
                    isActive
                      ? "bg-[var(--pc-accent-soft)] text-[var(--pc-accent-text)] ring-1 ring-[var(--pc-accent-ring)]"
                      : "bg-[var(--pc-surface-soft)] text-[var(--pc-text-muted)] ring-1 ring-[color:var(--pc-border)] hover:text-[var(--pc-text)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
