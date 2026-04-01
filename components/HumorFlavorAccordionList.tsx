"use client";

import * as React from "react";
import { startTransition } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import HumorFlavorEditModal from "@/components/HumorFlavorEditModal";
import HumorFlavorStepEditModal from "@/components/HumorFlavorStepEditModal";
import {
  applyUpdateAuditFields,
  getAuthenticatedUserId,
} from "@/lib/supabase/audit";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatReadableDate } from "@/lib/prompt-chain/listing";

type SelectOption = {
  id: number;
  label: string;
};

type HumorFlavorStep = {
  id: number;
  humorFlavorId: number;
  orderBy: number;
  stepTypeId: number;
  stepTypeName: string;
  modelId: number;
  modelName: string;
  inputTypeId: number;
  inputTypeName: string;
  outputTypeId: number;
  outputTypeName: string;
  llmTemperature: number | null;
  description: string | null;
  llmUserPrompt: string | null;
  llmSystemPrompt: string | null;
};

type HumorFlavor = {
  id: number;
  slug: string;
  description: string | null;
  createdAt: string;
  createdByUserId: string;
  steps: HumorFlavorStep[];
};

type HumorFlavorAccordionListProps = {
  flavors: HumorFlavor[];
  flavorOptions: SelectOption[];
  stepTypeOptions: SelectOption[];
  modelOptions: SelectOption[];
  inputTypeOptions: SelectOption[];
  outputTypeOptions: SelectOption[];
};

export default function HumorFlavorAccordionList({
  flavors,
  flavorOptions,
  stepTypeOptions,
  modelOptions,
  inputTypeOptions,
  outputTypeOptions,
}: HumorFlavorAccordionListProps) {
  const router = useRouter();
  const [flavorItems, setFlavorItems] = React.useState(flavors);
  const [openFlavorIds, setOpenFlavorIds] = React.useState<
    Record<string, boolean>
  >({});
  const [deletingFlavorId, setDeletingFlavorId] = React.useState<number | null>(
    null
  );
  const [deletingStepId, setDeletingStepId] = React.useState<number | null>(
    null
  );
  const [reorderingFlavorId, setReorderingFlavorId] = React.useState<
    number | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);
  const stepRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    setFlavorItems(flavors);
  }, [flavors]);

  const getStepRefKey = (flavorId: number, stepId: number) =>
    `${String(flavorId)}:${String(stepId)}`;

  const captureStepPositions = (flavorId: number) => {
    const positions = new Map<string, number>();
    const flavor = flavorItems.find((entry) => entry.id === flavorId);

    if (!flavor) {
      return positions;
    }

    flavor.steps.forEach((step) => {
      const node = stepRefs.current[getStepRefKey(flavorId, step.id)];

      if (node) {
        positions.set(String(step.id), node.getBoundingClientRect().top);
      }
    });

    return positions;
  };

  const animateStepSwap = (
    nextFlavors: HumorFlavor[],
    flavorId: number,
    previousPositions: Map<string, number>
  ) => {
    requestAnimationFrame(() => {
      const flavor = nextFlavors.find((entry) => entry.id === flavorId);

      if (!flavor) {
        return;
      }

      flavor.steps.forEach((step) => {
        const node = stepRefs.current[getStepRefKey(flavorId, step.id)];
        const previousTop = previousPositions.get(String(step.id));

        if (!node || typeof previousTop !== "number") {
          return;
        }

        const nextTop = node.getBoundingClientRect().top;
        const delta = previousTop - nextTop;

        if (Math.abs(delta) < 1) {
          return;
        }

        node.style.transition = "transform 0s";
        node.style.transform = `translateY(${String(delta)}px)`;

        requestAnimationFrame(() => {
          node.style.transition = "transform 360ms ease";
          node.style.transform = "translateY(0)";

          const cleanup = () => {
            node.style.transition = "";
            node.style.transform = "";
            node.removeEventListener("transitionend", cleanup);
          };

          node.addEventListener("transitionend", cleanup, { once: true });
        });
      });
    });
  };

  const swapStepsInFlavors = (
    currentFlavors: HumorFlavor[],
    flavorId: number,
    fromIndex: number,
    toIndex: number
  ) =>
    currentFlavors.map((flavor) => {
      if (flavor.id !== flavorId) {
        return flavor;
      }

      const nextSteps = [...flavor.steps];
      const currentStep = nextSteps[fromIndex];
      const adjacentStep = nextSteps[toIndex];

      if (!currentStep || !adjacentStep) {
        return flavor;
      }

      nextSteps[fromIndex] = {
        ...adjacentStep,
        orderBy: currentStep.orderBy,
      };
      nextSteps[toIndex] = {
        ...currentStep,
        orderBy: adjacentStep.orderBy,
      };

      return {
        ...flavor,
        steps: nextSteps,
      };
    });

  const toggleFlavor = (flavorId: number) => {
    setOpenFlavorIds((current) => ({
      ...current,
      [String(flavorId)]: !current[String(flavorId)],
    }));
  };

  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    flavorId: number,
    slug: string
  ) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Delete the humor flavor "${slug}" and all of its steps?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingFlavorId(flavorId);
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("humor_flavors")
        .delete()
        .eq("id", flavorId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to delete humor flavor."
      );
    } finally {
      setDeletingFlavorId(null);
    }
  };

  const handleStepDelete = async (
    stepId: number,
    orderBy: number,
    flavorSlug: string
  ) => {
    const confirmed = window.confirm(
      `Delete step ${String(orderBy)} from "${flavorSlug}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingStepId(stepId);
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("humor_flavor_steps")
        .delete()
        .eq("id", stepId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to delete humor flavor step."
      );
    } finally {
      setDeletingStepId(null);
    }
  };

  const handleStepReorder = async (
    flavorId: number,
    stepIndex: number,
    direction: "up" | "down"
  ) => {
    if (reorderingFlavorId !== null) {
      return;
    }

    const flavor = flavorItems.find((entry) => entry.id === flavorId);

    if (!flavor) {
      return;
    }

    const targetIndex = direction === "up" ? stepIndex - 1 : stepIndex + 1;
    const currentStep = flavor.steps[stepIndex];
    const adjacentStep = flavor.steps[targetIndex];

    if (!currentStep || !adjacentStep) {
      return;
    }

    const previousPositions = captureStepPositions(flavorId);
    const previousFlavors = flavorItems;
    const nextFlavors = swapStepsInFlavors(
      previousFlavors,
      flavorId,
      stepIndex,
      targetIndex
    );

    setError(null);
    setReorderingFlavorId(flavorId);
    setFlavorItems(nextFlavors);
    animateStepSwap(nextFlavors, flavorId, previousPositions);

    try {
      const supabase = createSupabaseBrowserClient();
      const timestamp = new Date().toISOString();
      const userId = await getAuthenticatedUserId(supabase);
      const [currentUpdate, adjacentUpdate] = await Promise.all([
        supabase
          .from("humor_flavor_steps")
          .update(
            applyUpdateAuditFields(
              {
                order_by: adjacentStep.orderBy,
              },
              {
                modifiedAtField: "modified_datetime_utc",
                timestamp,
                userId,
              }
            )
          )
          .eq("id", currentStep.id),
        supabase
          .from("humor_flavor_steps")
          .update(
            applyUpdateAuditFields(
              {
                order_by: currentStep.orderBy,
              },
              {
                modifiedAtField: "modified_datetime_utc",
                timestamp,
                userId,
              }
            )
          )
          .eq("id", adjacentStep.id),
      ]);

      if (currentUpdate.error || adjacentUpdate.error) {
        throw new Error(
          currentUpdate.error?.message ??
            adjacentUpdate.error?.message ??
            "Failed to reorder humor flavor steps."
        );
      }
    } catch (nextError) {
      setFlavorItems(previousFlavors);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to reorder humor flavor steps."
      );
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setReorderingFlavorId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-200/90">{error}</p> : null}

      {flavorItems.map((flavor) => {
        const isOpen = openFlavorIds[String(flavor.id)] === true;
        const isDeleting = deletingFlavorId === flavor.id;

        return (
          <div
            key={String(flavor.id)}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#15151b]/85 shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleFlavor(flavor.id)}
                className="flex w-full items-start gap-4 px-6 py-6 pr-40 text-left transition hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400/60"
                aria-expanded={isOpen}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                      Humor Flavor
                    </p>
                    <span className="rounded-full bg-black/40 px-3 py-1 text-[0.6rem] uppercase tracking-[0.28em] text-zinc-300/80 ring-1 ring-white/10">
                      {flavor.steps.length} {flavor.steps.length === 1 ? "Step" : "Steps"}
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl uppercase tracking-[0.16em] text-zinc-100 [font-family:var(--font-heading)]">
                    {flavor.slug}
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm text-zinc-300/80">
                    {flavor.description ?? "No description."}
                  </p>

                  <p className="mt-4 text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                    Created {formatReadableDate(flavor.createdAt)}
                  </p>
                </div>
              </button>

              <div className="absolute right-5 top-5 flex items-center gap-2">
                <HumorFlavorStepEditModal
                  defaultHumorFlavorId={flavor.id}
                  defaultHumorFlavorLabel={flavor.slug}
                  defaultOrderBy={
                    flavor.steps.length > 0
                      ? Math.max(...flavor.steps.map((step) => step.orderBy)) + 1
                      : 1
                  }
                  flavorOptions={flavorOptions}
                  stepTypeOptions={stepTypeOptions}
                  modelOptions={modelOptions}
                  inputTypeOptions={inputTypeOptions}
                  outputTypeOptions={outputTypeOptions}
                  triggerIcon="create"
                  triggerAriaLabel={`Create step for humor flavor ${flavor.slug}`}
                />

                <HumorFlavorEditModal
                  flavorId={flavor.id}
                  slug={flavor.slug}
                  description={flavor.description}
                />

                <button
                  type="button"
                  onClick={(event) =>
                    handleDelete(event, flavor.id, flavor.slug)
                  }
                  disabled={isDeleting}
                  aria-label={`Delete humor flavor ${flavor.slug}`}
                  className={[
                    "rounded-full p-2.5 transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
                    isDeleting
                      ? "cursor-not-allowed bg-rose-500/10 text-rose-200/60 ring-1 ring-rose-400/20"
                      : "bg-black/40 text-zinc-300/80 ring-1 ring-white/10 hover:bg-rose-500/15 hover:text-rose-200 hover:ring-rose-400/40",
                  ].join(" ")}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => toggleFlavor(flavor.id)}
                  aria-label={
                    isOpen
                      ? `Collapse humor flavor ${flavor.slug}`
                      : `Expand humor flavor ${flavor.slug}`
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-zinc-300/80 ring-1 ring-white/10 transition hover:bg-black/60 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                >
                  <ChevronDown
                    className={[
                      "h-4 w-4 transition-transform",
                      isOpen ? "rotate-180 text-orange-200" : "",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            {isOpen ? (
              <div className="border-t border-white/10 bg-black/20 px-6 py-5">
                {flavor.steps.length === 0 ? (
                  <p className="text-sm text-zinc-400/80">No steps found.</p>
                ) : (
                  <div className="space-y-4">
                    {flavor.steps.map((step, stepIndex) => (
                      <div
                        key={String(step.id)}
                        ref={(node) => {
                          stepRefs.current[getStepRefKey(flavor.id, step.id)] = node;
                        }}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4 transition-transform duration-300 ease-out"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-orange-400/60 bg-[#15151b] text-sm font-semibold text-orange-200 shadow-[0_0_18px_rgba(255,120,0,0.18)]">
                              {step.orderBy}
                            </span>
                            <span className="rounded-full bg-black/40 px-3 py-1 text-[0.6rem] uppercase tracking-[0.28em] text-zinc-300/80 ring-1 ring-white/10">
                              {step.stepTypeName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <HumorFlavorStepEditModal
                              step={step}
                              flavorOptions={flavorOptions}
                              stepTypeOptions={stepTypeOptions}
                              modelOptions={modelOptions}
                              inputTypeOptions={inputTypeOptions}
                              outputTypeOptions={outputTypeOptions}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleStepDelete(
                                  step.id,
                                  step.orderBy,
                                  flavor.slug
                                )
                              }
                              disabled={deletingStepId === step.id}
                              aria-label={`Delete step ${String(step.orderBy)}`}
                              className={[
                                "rounded-full p-2.5 transition",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
                                deletingStepId === step.id
                                  ? "cursor-not-allowed bg-rose-500/10 text-rose-200/60 ring-1 ring-rose-400/20"
                                  : "bg-black/40 text-zinc-300/80 ring-1 ring-white/10 hover:bg-rose-500/15 hover:text-rose-200 hover:ring-rose-400/40",
                              ].join(" ")}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>

                            {stepIndex > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepReorder(flavor.id, stepIndex, "up")
                                }
                                disabled={reorderingFlavorId === flavor.id}
                                aria-label={`Move step ${String(step.orderBy)} up`}
                                className={[
                                  "rounded-full p-2.5 transition",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
                                  reorderingFlavorId === flavor.id
                                    ? "cursor-not-allowed bg-black/30 text-zinc-500 ring-1 ring-white/5"
                                    : "bg-black/40 text-zinc-300/80 ring-1 ring-white/10 hover:bg-orange-500/15 hover:text-orange-200 hover:ring-orange-400/40",
                                ].join(" ")}
                              >
                                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}

                            {stepIndex < flavor.steps.length - 1 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepReorder(flavor.id, stepIndex, "down")
                                }
                                disabled={reorderingFlavorId === flavor.id}
                                aria-label={`Move step ${String(step.orderBy)} down`}
                                className={[
                                  "rounded-full p-2.5 transition",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
                                  reorderingFlavorId === flavor.id
                                    ? "cursor-not-allowed bg-black/30 text-zinc-500 ring-1 ring-white/5"
                                    : "bg-black/40 text-zinc-300/80 ring-1 ring-white/10 hover:bg-orange-500/15 hover:text-orange-200 hover:ring-orange-400/40",
                                ].join(" ")}
                              >
                                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                              Model
                            </p>
                            <p className="mt-2 text-sm text-zinc-100">
                              {step.modelName}
                            </p>
                          </div>

                          <div>
                            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                              Input
                            </p>
                            <p className="mt-2 text-sm text-zinc-100">
                              {step.inputTypeName}
                            </p>
                          </div>

                          <div>
                            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                              Output
                            </p>
                            <p className="mt-2 text-sm text-zinc-100">
                              {step.outputTypeName}
                            </p>
                          </div>

                          <div>
                            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                              Temperature
                            </p>
                            <p className="mt-2 text-sm text-zinc-100">
                              {step.llmTemperature ?? "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                            Description
                          </p>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-100">
                            {step.description ?? "No description."}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                              User Prompt
                            </p>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-100">
                              {step.llmUserPrompt ?? "No user prompt."}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                              System Prompt
                            </p>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-100">
                              {step.llmSystemPrompt ?? "No system prompt."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
