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

type HumorFlavorEditModalProps = {
  flavorId?: number;
  slug?: string;
  description?: string | null;
  triggerIcon?: "edit" | "create";
  triggerAriaLabel?: string;
};

export default function HumorFlavorEditModal({
  flavorId,
  slug = "",
  description = null,
  triggerIcon = "edit",
  triggerAriaLabel,
}: HumorFlavorEditModalProps) {
  const router = useRouter();
  const isCreateMode = typeof flavorId !== "number";
  const [isMounted, setIsMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [nextSlug, setNextSlug] = React.useState(slug);
  const [nextDescription, setNextDescription] = React.useState(
    description ?? ""
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isWorking, setIsWorking] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setNextSlug(slug);
      setNextDescription(description ?? "");
      setError(null);
    }
  }, [description, isOpen, slug]);

  const closeModal = () => {
    if (isWorking) {
      return;
    }

    setIsOpen(false);
    setError(null);
  };

  const handleSave = async () => {
    const trimmedSlug = nextSlug.trim();

    if (trimmedSlug.length === 0) {
      setError("Slug is required.");
      return;
    }

    try {
      setIsWorking(true);
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const timestamp = new Date().toISOString();
      const userId = await getAuthenticatedUserId(supabase);
      const basePayload = {
        slug: trimmedSlug,
        description:
          nextDescription.trim().length > 0 ? nextDescription.trim() : null,
      };

      if (isCreateMode) {
        const { error: insertError } = await supabase
          .from("humor_flavors")
          .insert(
            applyInsertAuditFields(basePayload, {
              timestamp,
              userId,
            })
          );

        if (insertError) {
          throw new Error(insertError.message);
        }
      } else {
        const { error: updateError } = await supabase
          .from("humor_flavors")
          .update(
            applyUpdateAuditFields(basePayload, {
              modifiedAtField: "modified_datetime_utc",
              timestamp,
              userId,
            })
          )
          .eq("id", flavorId);

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
            ? "Failed to create humor flavor."
            : "Failed to update humor flavor."
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-orange-200 ring-1 ring-orange-400/40 transition hover:bg-orange-500/15 hover:text-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70"
        aria-label={
          triggerAriaLabel ??
          (isCreateMode
            ? "Create humor flavor"
            : `Edit humor flavor ${slug}`)
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
              <div className="w-full max-w-xl rounded-[2rem] border border-[color:var(--pc-border)] bg-[var(--pc-surface-strong)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.5em] text-[var(--pc-accent-text)] [font-family:var(--font-heading)]">
                      Humor Flavors
                    </p>
                    <h2 className="mt-3 text-3xl uppercase tracking-[0.16em] text-[var(--pc-text)] [font-family:var(--font-heading)]">
                      {isCreateMode ? "Create Humor Flavor" : "Edit Humor Flavor"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isWorking}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] text-[var(--pc-text-muted)] transition hover:text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Close humor flavor modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text-faint)]">
                      Slug
                    </span>
                    <input
                      type="text"
                      value={nextSlug}
                      onChange={(event) => setNextSlug(event.target.value)}
                      className="rounded-2xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] px-4 py-3 text-sm text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.28em] text-[var(--pc-text-faint)]">
                      Description
                    </span>
                    <textarea
                      value={nextDescription}
                      onChange={(event) =>
                        setNextDescription(event.target.value)
                      }
                      rows={5}
                      className="min-h-[8rem] rounded-2xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] px-4 py-3 text-sm text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]"
                    />
                  </label>
                </div>

                {error ? (
                  <p className="mt-4 text-sm text-[var(--pc-danger-text)]">{error}</p>
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
                    onClick={handleSave}
                    disabled={isWorking}
                    className="rounded-xl bg-[var(--pc-accent-soft)] px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--pc-accent-text)] ring-2 ring-[var(--pc-accent-ring)] shadow-[0_0_24px_rgba(255,120,0,0.12)] transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
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
