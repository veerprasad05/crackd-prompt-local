"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabItems = [
  { href: "/humor-flavors", label: "Humor Flavors" },
  { href: "/caption-tester", label: "Caption Tester" },
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
              "rounded-2xl px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
              isActive
                ? "bg-orange-500/15 text-orange-200 ring-2 ring-orange-400/50 shadow-[0_0_24px_rgba(255,120,0,0.2)]"
                : "bg-black/40 text-zinc-300/80 ring-1 ring-white/10 hover:bg-black/60 hover:text-zinc-100",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
