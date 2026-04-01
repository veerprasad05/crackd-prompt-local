export const PROMPT_CHAIN_PAGE_SIZE = 20;

export type SortOrder = "asc" | "desc";
export type SelectOption = {
  value: string;
  label: string;
};
export type CaptionSortMode = SortOrder | "most-likes" | "least-likes";

export const DEFAULT_SORT_OPTIONS: SelectOption[] = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

export const CAPTION_SORT_OPTIONS: SelectOption[] = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
  { value: "most-likes", label: "Most likes" },
  { value: "least-likes", label: "Least likes" },
];

export function parseSortOrder(value?: string): SortOrder {
  return value === "asc" ? "asc" : "desc";
}

export function parseCaptionSortMode(value?: string): CaptionSortMode {
  if (value === "asc") {
    return "asc";
  }

  if (value === "most-likes" || value === "most-votes") {
    return "most-likes";
  }

  if (value === "least-likes" || value === "least-votes") {
    return "least-likes";
  }

  return "desc";
}

export function parseBooleanSearchParam(value?: string) {
  return value === "true";
}

export function clampPage(value: string | undefined, totalPages: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  if (parsed > totalPages) {
    return totalPages;
  }

  return parsed;
}

export function buildPageItems(current: number, total: number) {
  if (total <= 1) {
    return [1];
  }

  const items: Array<number | "ellipsis"> = [];
  const range = 2;
  const start = Math.max(2, current - range);
  const end = Math.min(total - 1, current + range);

  items.push(1);

  if (start > 2) {
    items.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < total - 1) {
    items.push("ellipsis");
  }

  items.push(total);

  return items;
}

export function buildPageHref(
  pathname: string,
  page: number,
  queryParams: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  params.set("page", String(page));

  Object.entries(queryParams).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  });

  return `${pathname}?${params.toString()}`;
}

export function formatReadableDate(value: string | null | undefined) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
