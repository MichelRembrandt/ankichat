import { throttle } from "./throttle.ts";
import type { JishoResponse } from "./types.ts";

export async function fetchJisho(keyword: string, retries = 2): Promise<JishoResponse> {
  await throttle();

  const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
  const res = await fetch(url);

  if (!res.ok) {
    if (retries > 0 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 1000));
      return fetchJisho(keyword, retries - 1);
    }
    throw new Error(`Jisho request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<JishoResponse>;
}
