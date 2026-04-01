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
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] text-zinc-300/80 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
      <span>Sort By</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-xl border border-white/10 bg-[#101016] px-3 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
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
