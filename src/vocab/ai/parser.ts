import { PhraseSplitSchema, type PhraseSplit } from "./schema.ts";
import { extractJson } from "./extractJson.ts";

export function parsePhraseSplit(raw: string): PhraseSplit {

  const cleaned = extractJson(raw).replace(/\\\"/, "");

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse as JSON: ${(err as Error).message}`);
  }

  const result = PhraseSplitSchema.safeParse(json);
  if (!result.success) {
    console.error(result.error.format());
    throw new Error(`schema validation failed`);
  }

  return result.data;
}
