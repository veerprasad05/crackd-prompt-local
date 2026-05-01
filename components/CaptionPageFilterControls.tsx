"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CAPTION_SORT_OPTIONS, type CaptionSortMode } from "@/lib/prompt-chain/listing";

type HumorFlavorOption = {
  id: number;
  slug: string;
};

type CaptionPageFilterControlsProps = {
  sort: CaptionSortMode;
  selectedHumorFlavorId?: number | null;
  humorFlavors: HumorFlavorOption[];
};

export default function CaptionPageFilterControls({
  sort,
  selectedHumorFlavorId,
  humorFlavors,
}: CaptionPageFilterControlsProps) {
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

  const selectClassName =
    "w-40 rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface-elevated)] px-3 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]";

  return (
    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
      <label className="flex items-center gap-3 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text-muted)] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <span>Sort By</span>
        <select
          value={sort}
          onChange={(event) =>
            pushParams({
              sort: event.target.value,
            })
          }
          className={selectClassName}
          aria-label="Sort order"
        >
          {CAPTION_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-[var(--pc-border)] bg-[var(--pc-surface)] px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text-muted)] shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <span>Humor Flavor</span>
        <select
          value={
            typeof selectedHumorFlavorId === "number"
              ? String(selectedHumorFlavorId)
              : ""
          }
          onChange={(event) =>
            pushParams({
              humorFlavorId:
                event.target.value.length > 0 ? event.target.value : undefined,
            })
          }
          className={selectClassName}
          aria-label="Filter captions by humor flavor"
        >
          <option value="">All flavors</option>
          {humorFlavors.map((flavor) => (
            <option key={flavor.id} value={String(flavor.id)}>
              {flavor.slug}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
