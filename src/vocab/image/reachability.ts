export interface ImageReachability {
  reachable: boolean;
  detail: string;
}

/**
 * Checks whether an image URL is fetchable before handing it to AnkiConnect.
 * AnkiConnect's own fetch failure (hotlink protection, dead link) doesn't
 * surface as a structured error — it appends the raw failure text onto the
 * note field instead, corrupting it. Checking first avoids ever handing
 * addNote a URL it can't fetch. HEAD only, no image bytes are downloaded.
 */
export async function checkImageReachable(
  url: string,
  timeoutMs = 5000
): Promise<ImageReachability> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    return { reachable: res.ok, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { reachable: false, detail: (err as Error).message };
  } finally {
    clearTimeout(timeout);
  }
}
