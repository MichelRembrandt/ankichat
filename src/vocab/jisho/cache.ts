import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Word } from "../types.ts";

const CACHE_PATH = ".jisho-cache.json";
let cache: Record<string, Word> | null = null;

export async function loadCache(): Promise<Record<string, Word>> {
  if (cache) return cache;
  try {
    const raw = await readFile(CACHE_PATH, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache!;
}

export async function saveCache(): Promise<void> {
  if (!cache) return;
  await mkdir(dirname(CACHE_PATH), { recursive: true }).catch(() => {});
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}
