"use client";

import * as React from "react";
import { startTransition } from "react";
import { Copy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  applyInsertAuditFields,
  getAuthenticatedUserId,
} from "@/lib/supabase/audit";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type HumorFlavorStepToDuplicate = {
  orderBy: number;
  stepTypeId: number;
  modelId: number;
  inputTypeId: number;
  outputTypeId: number;
  llmTemperature: number | null;
  description: string | null;
  llmUserPrompt: string | null;
  llmSystemPrompt: string | null;
};

type HumorFlavorDuplicateModalProps = {
  sourceSlug: string;
  sourceDescription: string | null;
  steps: HumorFlavorStepToDuplicate[];
  existingSlugs: string[];
};

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function buildDuplicateSlug(sourceSlug: string, existingSlugs: string[]) {
  const trimmedSourceSlug = sourceSlug.trim();
  const rootSlug =
    trimmedSourceSlug.length > 0 ? `${trimmedSourceSlug}-copy` : "copy";
  const normalizedSlugs = new Set(existingSlugs.map(normalizeSlug));

  if (!normalizedSlugs.has(normalizeSlug(rootSlug))) {
    return rootSlug;
  }

  let suffix = 2;

  while (normalizedSlugs.has(normalizeSlug(`${rootSlug}-${String(suffix)}`))) {
    suffix += 1;
  }

  return `${rootSlug}-${String(suffix)}`;
}

export default function HumorFlavorDuplicateModal({
  sourceSlug,
  sourceDescription,
  steps,
  existingSlugs,
}: HumorFlavorDuplicateModalProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [nextSlug, setNextSlug] = React.useState(() =>
    buildDuplicateSlug(sourceSlug, existingSlugs)
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isWorking, setIsWorking] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setNextSlug(buildDuplicateSlug(sourceSlug, existingSlugs));
      setError(null);
    }
  }, [existingSlugs, isOpen, sourceSlug]);

  const closeModal = () => {
    if (isWorking) {
      return;
    }

    setIsOpen(false);
    setError(null);
  };

  const handleDuplicate = async () => {
    const trimmedSlug = nextSlug.trim();

    if (trimmedSlug.length === 0) {
      setError("Slug is required.");
      return;
    }

    const slugAlreadyExists = existingSlugs.some(
      (slug) => normalizeSlug(slug) === normalizeSlug(trimmedSlug)
    );

    if (slugAlreadyExists) {
      setError("Slug must be unique.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let createdFlavorId: number | null = null;

    try {
      setIsWorking(true);
      setError(null);

      const timestamp = new Date().toISOString();
      const userId = await getAuthenticatedUserId(supabase);

      const { data: createdFlavor, error: insertFlavorError } = await supabase
        .from("humor_flavors")
        .insert(
          applyInsertAuditFields(
            {
              slug: trimmedSlug,
              description: sourceDescription,
            },
            {
              timestamp,
              userId,
            }
          )
        )
        .select("id")
        .single();

      if (insertFlavorError) {
        throw new Error(insertFlavorError.message);
      }

      const parsedFlavorId = Number(createdFlavor?.id);

      if (!Number.isFinite(parsedFlavorId)) {
        throw new Error("Failed to determine the duplicated humor flavor id.");
      }

      createdFlavorId = parsedFlavorId;

      if (steps.length > 0) {
        const duplicatedSteps = steps.map((step) =>
          applyInsertAuditFields(
            {
              humor_flavor_id: parsedFlavorId,
              order_by: step.orderBy,
              humor_flavor_step_type_id: step.stepTypeId,
              llm_model_id: step.modelId,
              llm_input_type_id: step.inputTypeId,
              llm_output_type_id: step.outputTypeId,
              llm_temperature: step.llmTemperature,
              description: step.description,
              llm_user_prompt: step.llmUserPrompt,
              llm_system_prompt: step.llmSystemPrompt,
            },
            {
              timestamp,
              userId,
            }
          )
        );

        const { error: insertStepsError } = await supabase
          .from("humor_flavor_steps")
          .insert(duplicatedSteps);

        if (insertStepsError) {
          throw new Error(insertStepsError.message);
        }
      }

      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (nextError) {
      let cleanupSuffix = "";

      if (createdFlavorId !== null) {
        const { error: cleanupError } = await supabase
          .from("humor_flavors")
          .delete()
          .eq("id", createdFlavorId);

        if (cleanupError) {
          cleanupSuffix = " Cleanup may be required.";
        }
      }

      setError(
        `${
          nextError instanceof Error
            ? nextError.message
            : "Failed to duplicate humor flavor."
        }${cleanupSuffix}`
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] text-[var(--pc-text-muted)] transition hover:text-[var(--pc-accent-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]"
        aria-label={`Duplicate humor flavor ${sourceSlug}`}
      >
        <Copy className="h-4 w-4" />
      </button>

      {isMounted && isOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--pc-overlay)] px-6 py-8 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-[2rem] border border-[color:var(--pc-border)] bg-[var(--pc-surface-elevated)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--pc-accent-text)] [font-family:var(--font-heading)]">
                      Humor Flavors
                    </p>
                    <h2 className="mt-3 text-3xl uppercase tracking-[0.16em] text-[var(--pc-text)] [font-family:var(--font-heading)]">
                      Duplicate Humor Flavor
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isWorking}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] text-[var(--pc-text-muted)] transition hover:text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Close duplicate humor flavor modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-6 text-sm text-[var(--pc-text-muted)]">
                  Duplicate "{sourceSlug}" and copy all of its steps into a new
                  humor flavor.
                </p>

                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text-faint)]">
                      New Slug
                    </span>
                    <input
                      type="text"
                      value={nextSlug}
                      onChange={(event) => setNextSlug(event.target.value)}
                      className="rounded-2xl border border-[color:var(--pc-border)] bg-[var(--pc-input-surface)] px-4 py-3 text-sm text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]"
                    />
                  </label>

                  <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[var(--pc-text-faint)]">
                    {steps.length} {steps.length === 1 ? "step" : "steps"} will
                    be copied.
                  </p>
                </div>

                {error ? (
                  <p className="mt-4 text-sm text-[var(--pc-danger-text)]">
                    {error}
                  </p>
                ) : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isWorking}
                    className="rounded-xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--pc-text-muted)] transition-colors hover:text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    disabled={isWorking}
                    className="rounded-xl bg-[var(--pc-accent-soft)] px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--pc-accent-text)] ring-2 ring-[var(--pc-accent-ring)] shadow-[0_0_24px_rgba(255,120,0,0.12)] transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isWorking ? "Duplicating..." : "Duplicate"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
