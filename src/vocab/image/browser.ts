import { execFile } from "child_process";

/** Opens a URL in the OS default browser. macOS-only for now (`open`). */
export function openInBrowser(url: string): void {
  execFile("open", [url]);
}

/** Builds a Google Images search URL for the given word. */
export function buildImageSearchUrl(word: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${word} イラスト`)}&tbm=isch`;
}
