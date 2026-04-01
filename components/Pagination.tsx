import Link from "next/link";
import { FastForward, Rewind } from "lucide-react";
import { buildPageHref, buildPageItems } from "@/lib/prompt-chain/listing";

type PaginationProps = {
  pathname: string;
  currentPage: number;
  totalPages: number;
  queryParams: Record<string, string | undefined>;
};

export default function Pagination({
  pathname,
  currentPage,
  totalPages,
  queryParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-zinc-400/80"
      aria-label="Pagination"
    >
      <Link
        href={buildPageHref(
          pathname,
          Math.max(1, currentPage - 1),
          queryParams
        )}
        aria-disabled={currentPage === 1}
        aria-label="Previous page"
        className={[
          "rounded-full px-3 py-2 ring-1 ring-white/10 transition",
          currentPage === 1
            ? "pointer-events-none opacity-40"
            : "hover:text-orange-200 hover:ring-orange-400/60",
        ].join(" ")}
      >
        <Rewind className="h-4 w-4" aria-hidden="true" />
      </Link>

      {buildPageItems(currentPage, totalPages).map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-2">
              ...
            </span>
          );
        }

        const isActive = item === currentPage;

        return (
          <Link
            key={`page-${item}`}
            href={buildPageHref(pathname, item, queryParams)}
            aria-current={isActive ? "page" : undefined}
            className={[
              "inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-3 py-2 text-center ring-1 ring-white/10 transition",
              isActive
                ? "text-orange-200 ring-2 ring-orange-400/70 shadow-[0_0_16px_rgba(255,120,0,0.35)]"
                : "hover:text-orange-200 hover:ring-orange-400/60",
            ].join(" ")}
          >
            {item}
          </Link>
        );
      })}

      <Link
        href={buildPageHref(
          pathname,
          Math.min(totalPages, currentPage + 1),
          queryParams
        )}
        aria-disabled={currentPage === totalPages}
        aria-label="Next page"
        className={[
          "rounded-full px-3 py-2 ring-1 ring-white/10 transition",
          currentPage === totalPages
            ? "pointer-events-none opacity-40"
            : "hover:text-orange-200 hover:ring-orange-400/60",
        ].join(" ")}
      >
        <FastForward className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
