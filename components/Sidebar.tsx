"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarUserMenu from "@/components/SidebarUserMenu";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/humor-flavors", label: "Humor Flavors" },
  { href: "/caption-tester", label: "Caption Tester" },
  { href: "/captions", label: "Captions" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[color:var(--pc-border)] bg-[var(--pc-surface)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mb-5 text-center text-[0.7rem] uppercase tracking-[0.4em] text-[var(--pc-accent-text)] [font-family:var(--font-heading)]">
        Crackd Prompt Chain
      </div>

      <nav className="flex flex-col gap-3">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "rounded-xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] px-4 py-3 text-center text-[0.7rem] uppercase tracking-[0.32em] text-[var(--pc-text-muted)]",
                "transition-colors hover:text-[var(--pc-text)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]",
                active
                  ? "bg-[var(--pc-accent-soft)] text-[var(--pc-accent-text)] ring-2 ring-[var(--pc-accent-ring)] shadow-[0_0_24px_rgba(255,120,0,0.12)]"
                  : "",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-center gap-3 pt-6">
        <ThemeToggle />
        <SidebarUserMenu />
      </div>
    </div>
  );
}
