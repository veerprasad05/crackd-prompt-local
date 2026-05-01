import HumorFlavorAccordionList from "@/components/HumorFlavorAccordionList";
import HumorFlavorEditModal from "@/components/HumorFlavorEditModal";
import HumorFlavorFilterControls from "@/components/HumorFlavorFilterControls";
import Pagination from "@/components/Pagination";
import {
  parseSortOrder,
  PROMPT_CHAIN_PAGE_SIZE,
  clampPage,
  parseBooleanSearchParam,
} from "@/lib/prompt-chain/listing";
import { getPromptChainAccessState } from "@/lib/supabase/prompt-chain-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    mine?: string;
    sort?: string;
  }>;
};

type HumorFlavorRow = {
  id: number;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
  created_by_user_id: string;
};

type HumorFlavorStepRow = {
  id: number;
  humor_flavor_id: number;
  order_by: number;
  llm_temperature: number | string | null;
  description: string | null;
  llm_user_prompt: string | null;
  llm_system_prompt: string | null;
  humor_flavor_step_type_id: number;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
};

export default async function HumorFlavorsPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { user } = await getPromptChainAccessState();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const mineOnly = parseBooleanSearchParam(resolvedSearchParams?.mine);
  const sort = parseSortOrder(resolvedSearchParams?.sort);

  let countQuery = supabase
    .from("humor_flavors")
    .select("id", { count: "exact", head: true });

  if (mineOnly && user) {
    countQuery = countQuery.eq("created_by_user_id", user.id);
  }

  const { count, error: countError } = await countQuery;

  const totalPages = Math.max(
    1,
    Math.ceil((count ?? 0) / PROMPT_CHAIN_PAGE_SIZE)
  );
  const currentPage = clampPage(resolvedSearchParams?.page, totalPages);
  const rangeStart = (currentPage - 1) * PROMPT_CHAIN_PAGE_SIZE;
  const rangeEnd = rangeStart + PROMPT_CHAIN_PAGE_SIZE - 1;

  let flavorsQuery = supabase
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc, created_by_user_id")
    .order("created_datetime_utc", { ascending: sort === "asc" });

  if (mineOnly && user) {
    flavorsQuery = flavorsQuery.eq("created_by_user_id", user.id);
  }

  const { data: flavors, error: flavorsError } = await flavorsQuery.range(
    rangeStart,
    rangeEnd
  );

  const flavorRows = Array.isArray(flavors)
    ? (flavors as HumorFlavorRow[])
    : [];
  const flavorIds = flavorRows.map((flavor) => flavor.id);

  const [
    { data: allFlavors, error: allFlavorsError },
    { data: steps, error: stepsError },
    { data: stepTypes, error: stepTypesError },
    { data: models, error: modelsError },
    { data: inputTypes, error: inputTypesError },
    { data: outputTypes, error: outputTypesError },
  ] = await Promise.all([
    supabase.from("humor_flavors").select("id, slug").order("slug", {
      ascending: true,
    }),
    flavorIds.length
      ? supabase
          .from("humor_flavor_steps")
          .select(
            [
              "id",
              "humor_flavor_id",
              "order_by",
              "llm_temperature",
              "description",
              "llm_user_prompt",
              "llm_system_prompt",
              "humor_flavor_step_type_id",
              "llm_model_id",
              "llm_input_type_id",
              "llm_output_type_id",
            ].join(", ")
          )
          .in("humor_flavor_id", flavorIds)
          .order("order_by", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase.from("humor_flavor_step_types").select("id, slug"),
    supabase.from("llm_models").select("id, name"),
    supabase.from("llm_input_types").select("id, slug"),
    supabase.from("llm_output_types").select("id, slug"),
  ]);

  const stepRows = Array.isArray(steps) ? (steps as HumorFlavorStepRow[]) : [];
  const stepsByFlavorId = new Map<number, HumorFlavorStepRow[]>();
  const stepTypeNameById = new Map<number, string>();
  const modelNameById = new Map<number, string>();
  const inputTypeNameById = new Map<number, string>();
  const outputTypeNameById = new Map<number, string>();

  (Array.isArray(stepTypes) ? stepTypes : []).forEach((stepType) => {
    stepTypeNameById.set(Number(stepType.id), stepType.slug);
  });

  (Array.isArray(models) ? models : []).forEach((model) => {
    modelNameById.set(Number(model.id), model.name);
  });

  (Array.isArray(inputTypes) ? inputTypes : []).forEach((inputType) => {
    inputTypeNameById.set(Number(inputType.id), inputType.slug);
  });

  (Array.isArray(outputTypes) ? outputTypes : []).forEach((outputType) => {
    outputTypeNameById.set(Number(outputType.id), outputType.slug);
  });

  stepRows.forEach((step) => {
    const flavorId = Number(step.humor_flavor_id);
    const existing = stepsByFlavorId.get(flavorId) ?? [];
    existing.push(step);
    stepsByFlavorId.set(flavorId, existing);
  });

  const flavorsWithSteps = flavorRows.map((flavor) => ({
    id: Number(flavor.id),
    slug: flavor.slug,
    description: flavor.description,
    createdAt: flavor.created_datetime_utc,
    createdByUserId: flavor.created_by_user_id,
    steps: (stepsByFlavorId.get(Number(flavor.id)) ?? []).map((step) => ({
      id: Number(step.id),
      humorFlavorId: Number(step.humor_flavor_id),
      orderBy: Number(step.order_by),
      stepTypeId: Number(step.humor_flavor_step_type_id),
      stepTypeName:
        stepTypeNameById.get(Number(step.humor_flavor_step_type_id)) ??
        `Type ${String(step.humor_flavor_step_type_id)}`,
      modelId: Number(step.llm_model_id),
      modelName:
        modelNameById.get(Number(step.llm_model_id)) ??
        `Model ${String(step.llm_model_id)}`,
      inputTypeId: Number(step.llm_input_type_id),
      inputTypeName:
        inputTypeNameById.get(Number(step.llm_input_type_id)) ??
        `Input ${String(step.llm_input_type_id)}`,
      outputTypeId: Number(step.llm_output_type_id),
      outputTypeName:
        outputTypeNameById.get(Number(step.llm_output_type_id)) ??
        `Output ${String(step.llm_output_type_id)}`,
      llmTemperature:
        typeof step.llm_temperature === "number"
          ? step.llm_temperature
          : typeof step.llm_temperature === "string" &&
              Number.isFinite(Number(step.llm_temperature))
            ? Number(step.llm_temperature)
            : null,
      description: step.description,
      llmUserPrompt: step.llm_user_prompt,
      llmSystemPrompt: step.llm_system_prompt,
    })),
  }));

  const errorMessage =
    countError?.message ??
    flavorsError?.message ??
    allFlavorsError?.message ??
    stepsError?.message ??
    stepTypesError?.message ??
    modelsError?.message ??
    inputTypesError?.message ??
    outputTypesError?.message;

  return (
    <section>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <h2 className="text-[2rem] leading-none uppercase tracking-[0.16em] text-[var(--pc-text)] sm:text-[2.5rem] [font-family:var(--font-heading)]">
            Humor Flavors
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-[var(--pc-text-muted)]">
            Browse existing humor flavors, expand each flavor to inspect its
            ordered steps, and delete a flavor when it is no longer needed.
          </p>
        </div>

        <div className="flex items-start gap-3 lg:ml-auto lg:self-start">
          <HumorFlavorEditModal
            triggerIcon="create"
            triggerAriaLabel="Create humor flavor"
          />
          <HumorFlavorFilterControls mineOnly={mineOnly} sort={sort} />
        </div>
      </div>

      <div className="mt-10">
        {errorMessage ? (
          <p className="text-sm text-[var(--pc-danger-text)]">
            Failed to load humor flavors: {errorMessage}
          </p>
        ) : flavorRows.length === 0 ? (
          <p className="text-sm text-[var(--pc-text-faint)]">
            {mineOnly
              ? "No humor flavors created by you were found."
              : "No humor flavors found."}
          </p>
        ) : (
          <>
            <HumorFlavorAccordionList
              flavors={flavorsWithSteps}
              flavorOptions={(Array.isArray(allFlavors) ? allFlavors : []).map(
                (flavor) => ({
                  id: Number(flavor.id),
                  label: flavor.slug,
                })
              )}
              stepTypeOptions={(Array.isArray(stepTypes) ? stepTypes : []).map(
                (stepType) => ({
                  id: Number(stepType.id),
                  label: stepType.slug,
                })
              )}
              modelOptions={(Array.isArray(models) ? models : []).map((model) => ({
                id: Number(model.id),
                label: model.name,
              }))}
              inputTypeOptions={(Array.isArray(inputTypes) ? inputTypes : []).map(
                (inputType) => ({
                  id: Number(inputType.id),
                  label: inputType.slug,
                })
              )}
              outputTypeOptions={(Array.isArray(outputTypes) ? outputTypes : []).map(
                (outputType) => ({
                  id: Number(outputType.id),
                  label: outputType.slug,
                })
              )}
            />

            <Pagination
              pathname="/humor-flavors"
              currentPage={currentPage}
              totalPages={totalPages}
              queryParams={{
                mine: mineOnly ? "true" : undefined,
                sort,
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}
