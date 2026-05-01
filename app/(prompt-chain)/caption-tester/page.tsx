import CaptionTesterWorkspace from "@/components/CaptionTesterWorkspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CaptionTesterPage() {
  const supabase = await createSupabaseServerClient();
  const { data: humorFlavors, error } = await supabase
    .from("humor_flavors")
    .select("id, slug")
    .order("slug", { ascending: true });

  const flavorOptions = Array.isArray(humorFlavors)
    ? humorFlavors.map((flavor) => ({
        id: Number(flavor.id),
        slug: flavor.slug,
      }))
    : [];

  return (
    <>
      {error ? (
        <p className="mb-6 text-sm text-[var(--pc-danger-text)]">
          Failed to load humor flavors: {error.message}
        </p>
      ) : null}
      <CaptionTesterWorkspace humorFlavors={flavorOptions} />
    </>
  );
}
