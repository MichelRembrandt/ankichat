import type { Word } from "../types.ts";
import { loadCache, saveCache } from "./cache.ts";
import { fetchJisho } from "./api.ts";
import { resolveMatch } from "./match.ts";

/**
 * Look up a single word and return the fields your Anki card needs.
 * Results are cached to disk across CLI runs.
 */
async function enrichWord(writing: string): Promise<Word> {
  const c = await loadCache();
  if (c[writing]) return c[writing];

  const response = await fetchJisho(writing);
  const match = resolveMatch(writing, response.data);

  const result: Word = match
    ? {
        writing: writing,
        reading: match.japanese.reading ?? null,
        partsOfSpeech: match.entry.senses[0]?.parts_of_speech ?? [],
        translations: match.entry.senses[0]?.english_definitions ?? [],
        isCommon: match.entry.is_common ?? false,
        jlpt: match.entry.jlpt,
        matchType: match.matchType,
      }
    : {
        writing: writing,
        reading: null,
        partsOfSpeech: [],
        translations: [],
        isCommon: false,
        jlpt: [],
        matchType: "none",
      };

  c[writing] = result;
  await saveCache();
  return result;
}

/**
 * Enrich a batch of words sequentially (throttled internally).
 * Sequential is intentional: it respects MIN_INTERVAL_MS and keeps
 * behavior predictable for an unofficial API with no documented limits.
 */
export async function enrichWords(wordBases: Word[]): Promise<Word[]> {
  const results: Word[] = [];
  for (const wordBase of wordBases) {
    let result: Word = await enrichWord(wordBase.writing);
    result.phrase = wordBase.phrase;
    result.phraseTranslation = wordBase.phraseTranslation;
    results.push(result);
  }
  return results;
}
