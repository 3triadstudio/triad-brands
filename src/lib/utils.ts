import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function optimizeImageUrl(src: string, width: number, quality = 72) {
  const objectPath = "/storage/v1/object/public/";
  if (!src.includes(objectPath)) return src;

  const url = new URL(src, "http://localhost");
  url.pathname = url.pathname.replace(objectPath, "/storage/v1/render/image/public/");
  url.searchParams.set("width", String(width));
  url.searchParams.set("quality", String(quality));
  url.searchParams.set("format", "webp");
  return src.startsWith("/") ? `${url.pathname}${url.search}` : url.toString();
}

export function responsiveImageSrcSet(src: string, widths: number[], quality = 72) {
  return widths.map((width) => `${optimizeImageUrl(src, width, quality)} ${width}w`).join(", ");
}
