const BASE_URL = "https://api.almostcrackd.ai";
export const MAX_CAPTIONS_PER_IMAGE = 5;

type PresignedUrlResponse = {
  presignedUrl: string;
  cdnUrl: string;
};

type RegisterImageResponse = {
  imageId: string;
  now?: number;
};

export type CaptionRecord = Record<string, unknown>;

type GenerateCaptionsOptions = {
  humorFlavorId: number;
  captionCount?: number;
};

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function postJson<T>(
  path: string,
  token: string,
  body: Record<string, unknown>
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await readJsonSafe(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: unknown }).message ?? response.statusText)
        : response.statusText;
    throw new Error(`Request failed (${response.status}): ${message}`);
  }

  return data as T;
}

export async function generatePresignedUrl(
  token: string,
  contentType: string
) {
  return postJson<PresignedUrlResponse>("/pipeline/generate-presigned-url", token, {
    contentType,
  });
}

export async function uploadImageToPresignedUrl(
  presignedUrl: string,
  file: File,
  contentType: string
) {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}).`);
  }
}

export async function registerImageUrl(
  token: string,
  imageUrl: string,
  isCommonUse = false
) {
  return postJson<RegisterImageResponse>(
    "/pipeline/upload-image-from-url",
    token,
    {
      imageUrl,
      isCommonUse,
    }
  );
}

function buildGenerateCaptionBodies(
  imageId: string,
  options: GenerateCaptionsOptions
) {
  const captionCount = Math.min(
    MAX_CAPTIONS_PER_IMAGE,
    Math.max(1, options.captionCount ?? MAX_CAPTIONS_PER_IMAGE)
  );

  return [
    {
      imageId,
      humorFlavorId: options.humorFlavorId,
      captionCount,
    },
    {
      imageId,
      humor_flavor_id: options.humorFlavorId,
      caption_count: captionCount,
    },
    {
      imageId,
      humorFlavorId: options.humorFlavorId,
    },
  ];
}

export async function generateCaptions(
  token: string,
  imageId: string,
  options: GenerateCaptionsOptions
) {
  const bodies = buildGenerateCaptionBodies(imageId, options);
  let lastError: Error | null = null;

  for (const body of bodies) {
    try {
      return await postJson<CaptionRecord[]>("/pipeline/generate-captions", token, body);
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Failed to generate captions.");
    }
  }

  throw lastError ?? new Error("Failed to generate captions.");
}
