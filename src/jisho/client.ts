/**
 * Jisho.org API client for enhancing word objects with reading,
 * part of speech, and translation data.
 *
 * API docs (unofficial): https://jisho.org/api/v1/search/words?keyword=酒
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { WordEnrichment } from "./types.ts";

// ---------- Types matching Jisho's actual response shape ----------

export interface JishoJapanese {
  word?: string; // absent when the entry is kana-only
  reading?: string;
}

export interface JishoSense {
  english_definitions: string[];
  parts_of_speech: string[];
}

export interface JishoEntry {
  slug: string;
  is_common?: boolean;
  jlpt: string[];
  japanese: JishoJapanese[];
  senses: JishoSense[];
}

export interface JishoResponse {
  meta: { status: number };
  data: JishoEntry[];
}

// ---------- Simple on-disk cache (avoid re-hitting the API) ----------

const CACHE_PATH = ".jisho-cache.json";
let cache: Record<string, WordEnrichment> | null = null;

async function loadCache(): Promise<Record<string, WordEnrichment>> {
  if (cache) return cache;
  try {
    const raw = await readFile(CACHE_PATH, "utf-8");
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache!;
}

async function saveCache(): Promise<void> {
  if (!cache) return;
  await mkdir(dirname(CACHE_PATH), { recursive: true }).catch(() => {});
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

// ---------- Rate limiting (be a polite unofficial-API citizen) ----------

let lastCallAt = 0;
const MIN_INTERVAL_MS = 350;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastCallAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastCallAt = Date.now();
}

// ---------- Core fetch with retry on transient failures ----------

async function fetchJisho(keyword: string, retries = 2): Promise<JishoResponse> {
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

// ---------- Match resolution: pick the right entry among several ----------

export function resolveMatch(
  word: string,
  data: JishoEntry[]
): { entry: JishoEntry; japanese: JishoJapanese; matchType: "exact" | "fallback" } | null {
  if (data.length === 0) return null;

  // 1. Exact match: an entry whose `japanese` list contains this literal word
  for (const entry of data) {
    const jp = entry.japanese.find((j) => j.word === word || j.reading === word);
    if (jp) return { entry, japanese: jp, matchType: "exact" };
  }

  // 2. Fallback: prefer the most common entry, otherwise the first result.
  //    (Jisho already ranks by relevance, so data[0] is a reasonable guess.)
  const common = data.find((e) => e.is_common);
  const entry = common ?? data[0];
  return { entry, japanese: entry.japanese[0], matchType: "fallback" };
}

// ---------- Public API ----------

/**
 * Look up a single word and return the fields your Anki card needs.
 * Results are cached to disk across CLI runs.
 */
export async function enrichWord(word: string): Promise<WordEnrichment> {
  const c = await loadCache();
  if (c[word]) return c[word];

  const response = await fetchJisho(word);
  const match = resolveMatch(word, response.data);

  const result: WordEnrichment = match
    ? {
        word,
        reading: match.japanese.reading ?? null,
        partsOfSpeech: match.entry.senses[0]?.parts_of_speech ?? [],
        translations: match.entry.senses[0]?.english_definitions ?? [],
        isCommon: match.entry.is_common ?? false,
        jlpt: match.entry.jlpt,
        matchType: match.matchType,
      }
    : {
        word,
        reading: null,
        partsOfSpeech: [],
        translations: [],
        isCommon: false,
        jlpt: [],
        matchType: "none",
      };

  c[word] = result;
  await saveCache();
  return result;
}

/**
 * Enrich a batch of words sequentially (throttled internally).
 * Sequential is intentional: it respects MIN_INTERVAL_MS and keeps
 * behavior predictable for an unofficial API with no documented limits.
 */
export async function enrichWords(words: string[]): Promise<WordEnrichment[]> {
  const results: WordEnrichment[] = [];
  for (const word of words) {
    results.push(await enrichWord(word));
  }
  return results;
}
