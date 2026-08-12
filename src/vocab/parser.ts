import { VocabularyDataSchema, type VocabularyData } from "./schema.js";

export function parseVocabulary(raw: string, source = "input"): VocabularyData {
  // AI responses are sometimes wrapped in ```json ... ``` fences; strip them if present.
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse ${source} as JSON: ${(err as Error).message}`);
  }

  const result = VocabularyDataSchema.safeParse(json);
  if (!result.success) {
    console.error(result.error.format());
    throw new Error(`${source} failed schema validation`);
  }

  return result.data;
}