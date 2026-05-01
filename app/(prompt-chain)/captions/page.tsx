import { Card, type CaptionEntry } from "@/components/Card";
import CaptionPageFilterControls from "@/components/CaptionPageFilterControls";
import Pagination from "@/components/Pagination";
import {
  PROMPT_CHAIN_PAGE_SIZE,
  clampPage,
  parseCaptionSortMode,
} from "@/lib/prompt-chain/listing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    sort?: string;
    humorFlavorId?: string;
  }>;
};

type CaptionRow = {
  id: string;
  image_id: string | null;
  content: string | null;
  created_datetime_utc: string;
  humor_flavor_id: number | null;
  like_count: number | null;
};

type HumorFlavorRow = {
  id: number;
  slug: string;
};

export default async function CaptionsPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sort = parseCaptionSortMode(resolvedSearchParams?.sort);
  const parsedHumorFlavorId = Number(resolvedSearchParams?.humorFlavorId);
  const selectedHumorFlavorId = Number.isFinite(parsedHumorFlavorId)
    ? parsedHumorFlavorId
    : null;

  const buildCaptionQuery = () => {
    let query = supabase
      .from("captions")
      .select(
        "id, image_id, content, created_datetime_utc, humor_flavor_id, like_count"
      )
      .not("content", "is", null)
      .neq("content", "");

    if (typeof selectedHumorFlavorId === "number") {
      query = query.eq("humor_flavor_id", selectedHumorFlavorId);
    }

    return query;
  };

  let countQuery = supabase
    .from("captions")
    .select("id", { count: "exact", head: true })
    .not("content", "is", null)
    .neq("content", "");

  if (typeof selectedHumorFlavorId === "number") {
    countQuery = countQuery.eq("humor_flavor_id", selectedHumorFlavorId);
  }

  const [
    { count: filteredCount, error: filteredCountError },
    { data: humorFlavors, error: humorFlavorsError },
  ] = await Promise.all([
    countQuery,
    supabase.from("humor_flavors").select("id, slug").order("slug", {
      ascending: true,
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil((filteredCount ?? 0) / PROMPT_CHAIN_PAGE_SIZE)
  );
  const currentPage = clampPage(resolvedSearchParams?.page, totalPages);
  const rangeStart = (currentPage - 1) * PROMPT_CHAIN_PAGE_SIZE;
  const rangeEnd = rangeStart + PROMPT_CHAIN_PAGE_SIZE - 1;

  let captionsQuery = buildCaptionQuery();

  if (sort === "most-likes" || sort === "least-likes") {
    captionsQuery = captionsQuery.order("like_count", {
      ascending: sort === "least-likes",
    });
  }

  const { data: captions, error: captionsError } = await captionsQuery
    .order("created_datetime_utc", {
      ascending: sort === "asc",
    })
    .range(rangeStart, rangeEnd);

  const captionRows = Array.isArray(captions) ? (captions as CaptionRow[]) : [];
  const imageIds = Array.from(
    new Set(
      captionRows
        .map((caption) => caption.image_id)
        .filter((imageId): imageId is string => typeof imageId === "string")
    )
  );

  const { data: images, error: imagesError } = imageIds.length
    ? await supabase.from("images").select("id, url").in("id", imageIds)
    : { data: [], error: null };

  const imagesById = new Map<string, string | null>();
  (Array.isArray(images) ? images : []).forEach((image) => {
    imagesById.set(
      String(image.id),
      typeof image.url === "string" ? image.url : null
    );
  });

  const humorFlavorOptions = (Array.isArray(humorFlavors)
    ? (humorFlavors as HumorFlavorRow[])
    : []
  ).map((flavor) => ({
    id: Number(flavor.id),
    slug: flavor.slug,
  }));

  const selectedFlavorSlug =
    typeof selectedHumorFlavorId === "number"
      ? humorFlavorOptions.find((flavor) => flavor.id === selectedHumorFlavorId)
          ?.slug ?? null
      : null;

  const errorMessage =
    filteredCountError?.message ??
    humorFlavorsError?.message ??
    captionsError?.message ??
    imagesError?.message;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--pc-accent-text)] [font-family:var(--font-heading)]">
            Library
          </p>

          <h1 className="mt-3 text-[2.75rem] leading-none uppercase tracking-[0.18em] text-[var(--pc-text)] sm:text-[3.25rem] lg:text-[3.75rem] [font-family:var(--font-heading)]">
            Captions
          </h1>

          <p className="mt-4 max-w-2xl text-sm text-[var(--pc-text-muted)]">
            Browse generated captions across all humor flavors or narrow the
            results to a single flavor.
            {selectedFlavorSlug ? ` Current filter: ${selectedFlavorSlug}.` : ""}
          </p>
        </div>

        <div className="lg:ml-auto lg:self-start">
          <CaptionPageFilterControls
            sort={sort}
            selectedHumorFlavorId={selectedHumorFlavorId}
            humorFlavors={humorFlavorOptions}
          />
        </div>
      </header>

      <section className="mt-10">
        {errorMessage ? (
          <p className="text-sm text-[var(--pc-danger-text)]">
            Failed to load captions: {errorMessage}
          </p>
        ) : captionRows.length === 0 ? (
          <p className="text-sm text-[var(--pc-text-faint)]">
            {selectedFlavorSlug
              ? `No captions found for ${selectedFlavorSlug}.`
              : "No captions found."}
          </p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {captionRows.map((caption) => {
                const captionEntry: CaptionEntry = {
                  id: caption.id,
                  content:
                    typeof caption.content === "string" ? caption.content : null,
                };
                const imageUrl =
                  typeof caption.image_id === "string"
                    ? imagesById.get(caption.image_id) ?? null
                    : null;
                const likeCount =
                  typeof caption.like_count === "number"
                    ? caption.like_count
                    : 0;
                const likeString = likeCount === 1 ? "Like" : "Likes";
                const likeTone =
                  likeCount > 0
                    ? "text-[var(--pc-success-text)] ring-[var(--pc-success-ring)]"
                    : likeCount < 0
                      ? "text-[var(--pc-danger-text)] ring-[var(--pc-danger-ring)]"
                      : "text-[var(--pc-text)] ring-[color:var(--pc-border)]";

                return (
                  <Card key={String(caption.id)} className="w-full">
                    <div
                      className={[
                        "absolute right-4 top-4 z-20 rounded-full bg-[var(--pc-surface-elevated)] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] ring-1 shadow-[0_10px_24px_rgba(0,0,0,0.2)]",
                        likeTone,
                      ].join(" ")}
                    >
                      {likeCount} {likeString}
                    </div>
                    {imageUrl ? (
                      <Card.Image src={imageUrl} alt="Caption image" />
                    ) : (
                      <div className="relative z-10 flex aspect-[16/9] w-full items-center justify-center bg-[var(--pc-placeholder-surface)] text-xs uppercase tracking-[0.32em] text-[var(--pc-placeholder-text)] sm:aspect-[7/4]">
                        Image unavailable
                      </div>
                    )}
                    <Card.Caption captions={[captionEntry]} />
                  </Card>
                );
              })}
            </div>

            <Pagination
              pathname="/captions"
              currentPage={currentPage}
              totalPages={totalPages}
              queryParams={{
                sort,
                humorFlavorId:
                  typeof selectedHumorFlavorId === "number"
                    ? String(selectedHumorFlavorId)
                    : undefined,
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
