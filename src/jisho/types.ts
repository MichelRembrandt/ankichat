export interface WordEnrichment {
  word: string;
  reading: string | null;
  partsOfSpeech: string[];
  translations: string[];
  isCommon: boolean;
  jlpt: string[];
  matchType: "exact" | "fallback" | "none";
}
