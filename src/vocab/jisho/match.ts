import type { JishoEntry, JishoJapanese } from "./types.ts";

export function resolveMatch(
  writing: string,
  data: JishoEntry[]
): { entry: JishoEntry; japanese: JishoJapanese; matchType: "exact" | "fallback" } | null {
  if (data.length === 0) return null;

  if (data.length === 1) {
    const entry = data[0];
    return { entry, japanese: entry.japanese[0], matchType:"exact" };
  }

  // Fallback 1
  const writingMatches = data.filter((e) => e.japanese[0].word === writing);
  if (writingMatches.length === 1) {
    const entry = writingMatches[0];
    return { entry, japanese: entry.japanese[0], matchType:"exact" };
  }

  // Fallback 2: to replace with AI prompt
  const common = data.find((e) => e.is_common);
  const entry = common ?? data[0];

  return { entry, japanese: entry.japanese[0], matchType: "fallback" };
}
