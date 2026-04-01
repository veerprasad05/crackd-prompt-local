"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SortDropdown from "@/components/SortDropdown";
import {
  DEFAULT_SORT_OPTIONS,
  type SortOrder,
} from "@/lib/prompt-chain/listing";

type HumorFlavorFilterControlsProps = {
  mineOnly: boolean;
  sort: SortOrder;
};

export default function HumorFlavorFilterControls({
  mineOnly,
  sort,
}: HumorFlavorFilterControlsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const pushParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
      <SortDropdown value={sort} options={DEFAULT_SORT_OPTIONS} />

      <button
        type="button"
        onClick={() => pushParams({ mine: mineOnly ? undefined : "true" })}
        aria-pressed={mineOnly}
        className={[
          "rounded-2xl px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
          mineOnly
            ? "bg-orange-500/15 text-orange-200 ring-2 ring-orange-400/50 shadow-[0_0_24px_rgba(255,120,0,0.2)]"
            : "bg-black/40 text-zinc-300/80 ring-1 ring-white/10 hover:bg-black/60 hover:text-zinc-100",
        ].join(" ")}
      >
        Created By Me
      </button>
    </div>
  );
}
