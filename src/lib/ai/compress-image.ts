"use client";
/**
 * Resize the longest edge to ≤ 1024px and export WebP @ 0.78 (typically < 150 KB).
 * Raw 4032×3024 phone photos never leave the device.
 */
export interface CompressedImage {
  blob: Blob;
  base64: string;
  mimeType: "image/webp" | "image/jpeg";
  width: number;
  height: number;
}

export const MAX_EDGE = 1024;
export const QUALITY = 0.78;

export function fitWithin(w: number, h: number, maxEdge = MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

async function loadBitmap(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ("createImageBitmap" in window) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

function toBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob(res, type, q));
}

export async function compressImage(file: Blob): Promise<CompressedImage> {
  const bmp = await loadBitmap(file);
  const { width, height } = fitWithin(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp.source, 0, 0, width, height);
  bmp.close();

  let blob = await toBlob(canvas, "image/webp", QUALITY);
  let mimeType: CompressedImage["mimeType"] = "image/webp";
  if (!blob || blob.type !== "image/webp") {
    // Safari < 17 can't encode WebP · fall back to JPEG.
    blob = await toBlob(canvas, "image/jpeg", QUALITY);
    mimeType = "image/jpeg";
  }
  if (!blob) throw new Error("Image encoding failed");
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { blob, base64: btoa(bin), mimeType, width, height };
}
