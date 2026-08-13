import { VocabularyDataSchema, type VocabularyData } from "./schema.ts";

export function parseVocabulary(raw: string): VocabularyData {

  const cleaned = extractJson(raw).replace(/\\\"/, "");
  
  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse as JSON: ${(err as Error).message}`);
  }

  const result = VocabularyDataSchema.safeParse(json);
  if (!result.success) {
    console.error(result.error.format());
    throw new Error(`schema validation failed`);
  }

  return result.data;
}

/**
 * AI responses are sometimes wrapped in ```json ... ``` fences and can have \n and \; strip them if present.
 */
function extractJson(raw: string): string {

  const trimmed = raw.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  const braceMatch = trimmed.match(/[{[][\s\S]*[}\]]/);
  if (braceMatch) return braceMatch[0].trim();

  return trimmed;
}
