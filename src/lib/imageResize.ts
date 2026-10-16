const PASSTHROUGH_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Phone photos are often 5–10 MB; shrink to a feed-friendly JPEG before uploading. */
export async function shrinkPhoto(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  if (file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("encode failed");
    return blob;
  } catch {
    if (PASSTHROUGH_TYPES.includes(file.type)) return file;
    throw new Error(`Couldn't read “${file.name}”. Try a JPG or PNG photo.`);
  }
}
