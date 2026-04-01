export const MAX_UPLOAD_IMAGES = 5;

export const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

export const ACCEPT_ATTR =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,.heic";

export function resolveContentType(file: File) {
  if (ALLOWED_CONTENT_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "jpeg":
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
      return "image/heic";
    default:
      return null;
  }
}
