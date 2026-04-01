"use client";

import * as React from "react";
import {
  MAX_CAPTIONS_PER_IMAGE,
  generateCaptions,
  generatePresignedUrl,
  registerImageUrl,
  uploadImageToPresignedUrl,
  type CaptionRecord,
} from "@/lib/prompt-chain/caption-pipeline";
import {
  ACCEPT_ATTR,
  MAX_UPLOAD_IMAGES,
  resolveContentType,
} from "@/lib/prompt-chain/image-upload";
import { Card, type CaptionEntry } from "@/components/Card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type HumorFlavorOption = {
  id: number;
  slug: string;
};

type CaptionTesterWorkspaceProps = {
  humorFlavors: HumorFlavorOption[];
};

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  fileName: string;
  status: string | null;
  error: string | null;
  captions: string[];
  isWorking: boolean;
};

function toCaptionText(record: CaptionRecord) {
  const candidate =
    typeof record.content === "string"
      ? record.content
      : typeof record.caption === "string"
        ? record.caption
        : typeof record.text === "string"
          ? record.text
          : typeof record.caption_text === "string"
            ? record.caption_text
            : null;

  if (candidate && candidate.trim().length > 0) {
    return candidate;
  }

  return JSON.stringify(record);
}

export default function CaptionTesterWorkspace({
  humorFlavors,
}: CaptionTesterWorkspaceProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const itemUrlsRef = React.useRef<string[]>([]);
  const [selectedFlavorId, setSelectedFlavorId] = React.useState<string>(
    humorFlavors[0] ? String(humorFlavors[0].id) : ""
  );
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!humorFlavors.length) {
      setSelectedFlavorId("");
      return;
    }

    setSelectedFlavorId((current) =>
      current.length > 0 ? current : String(humorFlavors[0].id)
    );
  }, [humorFlavors]);

  React.useEffect(() => {
    itemUrlsRef.current = items.map((item) => item.previewUrl);
  }, [items]);

  React.useEffect(() => {
    return () => {
      itemUrlsRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, []);

  const updateItem = React.useCallback(
    (itemId: string, updates: Partial<UploadItem>) => {
      setItems((current) =>
        current.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  const handlePickImages = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (nextFiles.length === 0) {
      return;
    }

    setError(null);

    if (nextFiles.length > MAX_UPLOAD_IMAGES) {
      setError(`You can upload at most ${MAX_UPLOAD_IMAGES} images at once.`);
      return;
    }

    const nextItems: UploadItem[] = [];

    for (const file of nextFiles) {
      const contentType = resolveContentType(file);

      if (!contentType) {
        setError(
          "Unsupported file type. Please upload jpeg, jpg, png, webp, gif, or heic."
        );
        nextItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        return;
      }

      nextItems.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        status: null,
        error: null,
        captions: [],
        isWorking: false,
      });
    }

    setItems((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return nextItems;
    });
  };

  const handleRemoveImage = (itemId: string) => {
    if (isSubmitting) {
      return;
    }

    setItems((current) => {
      const item = current.find((entry) => entry.id === itemId);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return current.filter((entry) => entry.id !== itemId);
    });
  };

  const handleGenerateCaptions = async () => {
    if (isSubmitting) {
      return;
    }

    if (!selectedFlavorId) {
      setError("Select a humor flavor before generating captions.");
      return;
    }

    if (items.length === 0) {
      setError("Upload at least one image before generating captions.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("You need to sign in before generating captions.");
      }

      for (const item of items) {
        const contentType = resolveContentType(item.file);

        if (!contentType) {
          updateItem(item.id, {
            error: "Unsupported file type.",
            status: null,
            isWorking: false,
          });
          continue;
        }

        try {
          updateItem(item.id, {
            error: null,
            captions: [],
            status: "Requesting upload URL...",
            isWorking: true,
          });

          const { presignedUrl, cdnUrl } = await generatePresignedUrl(
            token,
            contentType
          );

          updateItem(item.id, {
            status: "Uploading image...",
          });

          await uploadImageToPresignedUrl(
            presignedUrl,
            item.file,
            contentType
          );

          updateItem(item.id, {
            status: "Registering image...",
          });

          const { imageId } = await registerImageUrl(token, cdnUrl, false);

          updateItem(item.id, {
            status: "Generating captions...",
          });

          const captionRecords = await generateCaptions(token, imageId, {
            humorFlavorId: Number(selectedFlavorId),
            captionCount: MAX_CAPTIONS_PER_IMAGE,
          });

          const nextCaptions = Array.isArray(captionRecords)
            ? captionRecords.map(toCaptionText).slice(0, MAX_CAPTIONS_PER_IMAGE)
            : [];

          updateItem(item.id, {
            captions: nextCaptions,
            status: null,
            isWorking: false,
          });
        } catch (nextError) {
          updateItem(item.id, {
            error:
              nextError instanceof Error
                ? nextError.message
                : "Failed to generate captions.",
            status: null,
            isWorking: false,
          });
        }
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to generate captions."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasItems = items.length > 0;

  return (
    <section>
      <div className="rounded-[2rem] border border-white/10 bg-[#15151b]/85 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
        <p className="text-[0.7rem] uppercase tracking-[0.5em] text-orange-300/80 [font-family:var(--font-heading)]">
          Workspace
        </p>
        <h2 className="mt-3 text-[2rem] leading-none uppercase tracking-[0.16em] text-zinc-100 sm:text-[2.5rem] [font-family:var(--font-heading)]">
          Caption Tester
        </h2>
        <p className="mt-4 max-w-3xl text-sm text-zinc-300/75">
          Select a humor flavor, upload up to {MAX_UPLOAD_IMAGES} images, and
          generate up to {MAX_CAPTIONS_PER_IMAGE} captions per image using the
          prompt-chain API pipeline.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <label className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-[0.65rem] uppercase tracking-[0.28em] text-zinc-300/80">
            <span>Humor Flavor</span>
            <select
              value={selectedFlavorId}
              onChange={(event) => setSelectedFlavorId(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#101016] px-3 py-3 text-[0.7rem] uppercase tracking-[0.2em] text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
              disabled={humorFlavors.length === 0 || isSubmitting}
            >
              {humorFlavors.length === 0 ? (
                <option value="">No humor flavors available</option>
              ) : (
                humorFlavors.map((flavor) => (
                  <option key={flavor.id} value={String(flavor.id)}>
                    {flavor.slug}
                  </option>
                ))
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={handlePickImages}
            disabled={isSubmitting}
            className="rounded-2xl bg-black/40 px-5 py-4 text-[0.65rem] uppercase tracking-[0.28em] text-zinc-300/80 ring-1 ring-white/10 transition hover:bg-black/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasItems ? "Replace Images" : "Upload Images"}
          </button>

          <button
            type="button"
            onClick={handleGenerateCaptions}
            disabled={
              isSubmitting || !hasItems || selectedFlavorId.length === 0
            }
            className="rounded-2xl bg-orange-500/15 px-5 py-4 text-[0.65rem] uppercase tracking-[0.28em] text-orange-200 ring-2 ring-orange-400/50 shadow-[0_0_24px_rgba(255,120,0,0.2)] transition-colors hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Generating..." : "Generate Captions"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {error ? (
          <p className="mt-4 text-sm text-rose-200/90">{error}</p>
        ) : null}
      </div>

      <div className="mt-8">
        {!hasItems ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#15151b]/85 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
            <p className="text-sm text-zinc-400/80">
              Upload a batch of images to start testing a humor flavor.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[2rem] border border-white/10 bg-[#15151b]/85 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] uppercase tracking-[0.28em] text-zinc-500">
                      Image
                    </p>
                    <h3 className="mt-2 text-lg uppercase tracking-[0.14em] text-zinc-100 [font-family:var(--font-heading)]">
                      {item.fileName}
                    </h3>
                    {item.status ? (
                      <p className="mt-3 text-[0.65rem] uppercase tracking-[0.32em] text-orange-200/80">
                        {item.status}
                      </p>
                    ) : null}
                    {item.error ? (
                      <p className="mt-3 text-sm text-rose-200/90">{item.error}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(item.id)}
                    disabled={isSubmitting || item.isWorking}
                    className="rounded-2xl bg-black/40 px-4 py-3 text-[0.65rem] uppercase tracking-[0.28em] text-zinc-300/80 ring-1 ring-white/10 transition hover:bg-black/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>

                {item.captions.length === 0 ? (
                  <div className="mt-6 max-w-sm overflow-hidden rounded-2xl ring-1 ring-white/10">
                    <img
                      src={item.previewUrl}
                      alt={item.fileName}
                      className="mx-auto h-44 w-full bg-black object-contain"
                    />
                  </div>
                ) : null}

                <div className="mt-6">
                  {item.captions.length === 0 ? (
                    <p className="text-sm text-zinc-400/80">
                      Generated captions for this image will appear here.
                    </p>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {item.captions.map((caption, index) => {
                        const captionEntry: CaptionEntry = {
                          id: `${item.id}-${index}`,
                          content: caption,
                        };

                        return (
                          <Card
                            key={`${item.id}-${index}-${caption.slice(0, 12)}`}
                            className="w-full"
                          >
                            <Card.Image src={item.previewUrl} alt={item.fileName} />
                            <Card.Caption captions={[captionEntry]} />
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
