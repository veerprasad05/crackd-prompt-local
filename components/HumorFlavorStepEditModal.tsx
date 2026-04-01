"use client";

import * as React from "react";
import { startTransition } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  applyInsertAuditFields,
  applyUpdateAuditFields,
  getAuthenticatedUserId,
} from "@/lib/supabase/audit";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SelectOption = {
  id: number;
  label: string;
};

type StepDraft = {
  id: number;
  humorFlavorId: number;
  stepTypeId: number;
  modelId: number;
  inputTypeId: number;
  outputTypeId: number;
  llmTemperature: number | null;
  description: string | null;
  llmUserPrompt: string | null;
  llmSystemPrompt: string | null;
};

type HumorFlavorStepEditModalProps = {
  step?: StepDraft;
  defaultHumorFlavorId?: number;
  defaultHumorFlavorLabel?: string;
  defaultOrderBy?: number;
  flavorOptions: SelectOption[];
  stepTypeOptions: SelectOption[];
  modelOptions: SelectOption[];
  inputTypeOptions: SelectOption[];
  outputTypeOptions: SelectOption[];
  triggerIcon?: "edit" | "create";
  triggerAriaLabel?: string;
};

function buildInitialDraft(
  step: StepDraft | undefined,
  defaultHumorFlavorId: number | undefined
) {
  return {
    humorFlavorId:
      typeof defaultHumorFlavorId === "number"
        ? String(defaultHumorFlavorId)
        : step
          ? String(step.humorFlavorId)
          : "",
    stepTypeId: step ? String(step.stepTypeId) : "",
    modelId: step ? String(step.modelId) : "",
    inputTypeId: step ? String(step.inputTypeId) : "",
    outputTypeId: step ? String(step.outputTypeId) : "",
    llmTemperature:
      step && typeof step.llmTemperature === "number"
        ? String(step.llmTemperature)
        : "",
    description: step?.description ?? "",
    llmUserPrompt: step?.llmUserPrompt ?? "",
    llmSystemPrompt: step?.llmSystemPrompt ?? "",
  };
}

export default function HumorFlavorStepEditModal({
  step,
  defaultHumorFlavorId,
  defaultHumorFlavorLabel,
  defaultOrderBy,
  flavorOptions,
  stepTypeOptions,
  modelOptions,
  inputTypeOptions,
  outputTypeOptions,
  triggerIcon = "edit",
  triggerAriaLabel,
}: HumorFlavorStepEditModalProps) {
  const router = useRouter();
  const isCreateMode = !step;
  const [isMounted, setIsMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(() =>
    buildInitialDraft(step, defaultHumorFlavorId)
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isWorking, setIsWorking] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setDraft(buildInitialDraft(step, defaultHumorFlavorId));
      setError(null);
    }
  }, [defaultHumorFlavorId, isOpen, step]);

  const closeModal = () => {
    if (isWorking) {
      return;
    }

    setIsOpen(false);
    setError(null);
  };

  const handleSave = async () => {
    const parsedHumorFlavorId = Number(draft.humorFlavorId);
    const parsedStepTypeId = Number(draft.stepTypeId);
    const parsedModelId = Number(draft.modelId);
    const parsedInputTypeId = Number(draft.inputTypeId);
    const parsedOutputTypeId = Number(draft.outputTypeId);
    const parsedTemperature =
      draft.llmTemperature.trim().length > 0
        ? Number(draft.llmTemperature)
        : null;

    if (
      !Number.isFinite(parsedHumorFlavorId) ||
      !Number.isFinite(parsedStepTypeId) ||
      !Number.isFinite(parsedModelId) ||
      !Number.isFinite(parsedInputTypeId) ||
      !Number.isFinite(parsedOutputTypeId)
    ) {
      setError("Choose all required step fields before saving.");
      return;
    }

    if (parsedTemperature !== null && !Number.isFinite(parsedTemperature)) {
      setError("Temperature must be numeric when provided.");
      return;
    }

    if (isCreateMode && (!Number.isFinite(defaultOrderBy) || !defaultOrderBy)) {
      setError("A valid next step position is required to create a step.");
      return;
    }

    try {
      setIsWorking(true);
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const timestamp = new Date().toISOString();
      const userId = await getAuthenticatedUserId(supabase);
      const basePayload = {
        humor_flavor_id: parsedHumorFlavorId,
        humor_flavor_step_type_id: parsedStepTypeId,
        llm_model_id: parsedModelId,
        llm_input_type_id: parsedInputTypeId,
        llm_output_type_id: parsedOutputTypeId,
        llm_temperature: parsedTemperature,
        description:
          draft.description.trim().length > 0
            ? draft.description.trim()
            : null,
        llm_user_prompt:
          draft.llmUserPrompt.trim().length > 0
            ? draft.llmUserPrompt
            : null,
        llm_system_prompt:
          draft.llmSystemPrompt.trim().length > 0
            ? draft.llmSystemPrompt
            : null,
      };

      if (isCreateMode) {
        const { error: insertError } = await supabase
          .from("humor_flavor_steps")
          .insert(
            applyInsertAuditFields(
              {
                ...basePayload,
                order_by: defaultOrderBy,
              },
              {
                timestamp,
                userId,
              }
            )
          );

        if (insertError) {
          throw new Error(insertError.message);
        }
      } else {
        const { error: updateError } = await supabase
          .from("humor_flavor_steps")
          .update(
            applyUpdateAuditFields(basePayload, {
              modifiedAtField: "modified_datetime_utc",
              timestamp,
              userId,
            })
          )
          .eq("id", step.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      setIsOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : isCreateMode
            ? "Failed to create humor flavor step."
            : "Failed to update humor flavor step."
      );
    } finally {
      setIsWorking(false);
    }
  };

  const renderSelect = (
    label: string,
    value: string,
    options: SelectOption[],
    onChange: (value: string) => void
  ) => (
    <label className="grid gap-2">
      <span className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={`${label}-${option.id}`} value={String(option.id)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-orange-200 ring-1 ring-orange-400/40 transition hover:bg-orange-500/15 hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70"
        aria-label={
          triggerAriaLabel ??
          (isCreateMode
            ? "Create humor flavor step"
            : `Edit step ${step?.id}`)
        }
      >
        {triggerIcon === "create" ? (
          <Plus className="h-4 w-4" />
        ) : (
          <Pencil className="h-4 w-4" />
        )}
      </button>

      {isMounted && isOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 py-8 backdrop-blur-sm">
              <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-[2rem] border border-white/10 bg-[#15151b]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.7)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.5em] text-orange-300/80 [font-family:var(--font-heading)]">
                      Humor Flavor Steps
                    </p>
                    <h2 className="mt-3 text-3xl uppercase tracking-[0.16em] text-zinc-100 [font-family:var(--font-heading)]">
                      {isCreateMode ? "Create Step" : "Edit Step"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isWorking}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-zinc-300 ring-1 ring-white/10 transition hover:bg-black/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Close step modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
                  {isCreateMode && defaultHumorFlavorLabel ? (
                    <p className="mb-4 text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                      New step for {defaultHumorFlavorLabel}. It will be created
                      as step {String(defaultOrderBy ?? "")}.
                    </p>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {isCreateMode && defaultHumorFlavorLabel ? (
                      <label className="grid gap-2">
                        <span className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-400">
                          Humor Flavor
                        </span>
                        <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100">
                          {defaultHumorFlavorLabel}
                        </div>
                      </label>
                    ) : (
                      renderSelect(
                        "Humor Flavor",
                        draft.humorFlavorId,
                        flavorOptions,
                        (value) =>
                          setDraft((current) => ({
                            ...current,
                            humorFlavorId: value,
                          }))
                      )
                    )}

                    <label className="grid gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-400">
                        Temperature
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        value={draft.llmTemperature}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            llmTemperature: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                      />
                    </label>

                    {renderSelect(
                      "Step Type",
                      draft.stepTypeId,
                      stepTypeOptions,
                      (value) =>
                        setDraft((current) => ({
                          ...current,
                          stepTypeId: value,
                        }))
                    )}

                    {renderSelect(
                      "Model",
                      draft.modelId,
                      modelOptions,
                      (value) =>
                        setDraft((current) => ({
                          ...current,
                          modelId: value,
                        }))
                    )}

                    {renderSelect(
                      "Input Type",
                      draft.inputTypeId,
                      inputTypeOptions,
                      (value) =>
                        setDraft((current) => ({
                          ...current,
                          inputTypeId: value,
                        }))
                    )}

                    {renderSelect(
                      "Output Type",
                      draft.outputTypeId,
                      outputTypeOptions,
                      (value) =>
                        setDraft((current) => ({
                          ...current,
                          outputTypeId: value,
                        }))
                    )}
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-400">
                        Description
                      </span>
                      <textarea
                        value={draft.description}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        rows={4}
                        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-400">
                        User Prompt
                      </span>
                      <textarea
                        value={draft.llmUserPrompt}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            llmUserPrompt: event.target.value,
                          }))
                        }
                        rows={6}
                        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-400">
                        System Prompt
                      </span>
                      <textarea
                        value={draft.llmSystemPrompt}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            llmSystemPrompt: event.target.value,
                          }))
                        }
                        rows={6}
                        className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                      />
                    </label>
                  </div>

                  {error ? (
                    <p className="mt-4 text-sm text-rose-200/90">{error}</p>
                  ) : null}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isWorking}
                    className="rounded-xl bg-black/40 px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-zinc-300/80 ring-1 ring-white/10 transition-colors hover:bg-black/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isWorking}
                    className="rounded-xl bg-orange-500/15 px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-orange-200 ring-2 ring-orange-400/50 shadow-[0_0_24px_rgba(255,120,0,0.2)] transition-colors hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isWorking
                      ? isCreateMode
                        ? "Creating..."
                        : "Saving..."
                      : isCreateMode
                        ? "Create"
                        : "Save"}
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
