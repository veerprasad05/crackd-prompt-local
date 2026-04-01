"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarUserMenu from "@/components/SidebarUserMenu";

const navItems = [
  { href: "/humor-flavors", label: "Humor Flavors" },
  { href: "/caption-tester", label: "Caption Tester" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col rounded-2xl bg-[#15151b]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_18px_50px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur">
      <div className="mb-5 text-center text-[0.7rem] uppercase tracking-[0.4em] text-orange-300/80 [font-family:var(--font-heading)]">
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
                "rounded-xl bg-black/40 px-4 py-3 text-center text-[0.7rem] uppercase tracking-[0.32em] text-zinc-300/80 ring-1 ring-white/10",
                "transition-colors hover:bg-black/60 hover:text-zinc-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50",
                active
                  ? "bg-orange-500/15 text-orange-200 ring-2 ring-orange-400/50 shadow-[0_0_24px_rgba(255,120,0,0.25)]"
                  : "",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <SidebarUserMenu />
      </div>
    </div>
  );
}
