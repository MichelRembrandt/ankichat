import { z } from "zod";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

/** Strong signal, not a hard requirement — some valid image URLs have no
 * extension or a query string after it. */
export function hasPlausibleImageExtension(url: string): boolean {
  let path: string;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return false;
  }
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/** Validates a raw clipboard string as a plausible image URL. This is a
 * boundary — clipboard contents are untrusted user input. Requires a
 * recognized image extension; anything else is treated as invalid. */
export const ImageUrlSchema = z
  .string()
  .url()
  .refine(hasPlausibleImageExtension, {
    message: `URL does not end in a recognized image extension (${IMAGE_EXTENSIONS.join(", ")})`,
  });

export type ImageUrl = z.infer<typeof ImageUrlSchema>;
