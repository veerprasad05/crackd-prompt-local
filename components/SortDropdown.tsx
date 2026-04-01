"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SelectOption } from "@/lib/prompt-chain/listing";

type SortDropdownProps = {
  value: string;
  options: SelectOption[];
};

export default function SortDropdown({ value, options }: SortDropdownProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (nextSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSort);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text-muted)] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <span>Sort By</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-strong)] px-3 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]"
        aria-label="Sort order"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
