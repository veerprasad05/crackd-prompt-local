"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabItems = [
  { href: "/humor-flavors", label: "Humor Flavors" },
  { href: "/caption-tester", label: "Caption Tester" },
  { href: "/captions", label: "Captions" },
];

export default function PromptChainTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-3"
      aria-label="Prompt chain sections"
    >
      {tabItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-2xl border border-[color:var(--pc-border)] px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]",
              isActive
                ? "bg-[var(--pc-accent-soft)] text-[var(--pc-accent-text)] ring-2 ring-[var(--pc-accent-ring)] shadow-[0_0_24px_rgba(255,120,0,0.12)]"
                : "bg-[var(--pc-surface-soft)] text-[var(--pc-text-muted)] hover:text-[var(--pc-text)]",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
