export interface Word {
  writing: string;
  reading?: string | null;
  partsOfSpeech?: string[];
  translations?: string[];
  isCommon?: boolean;
  jlpt?: string[];
  matchType?: "exact" | "fallback" | "none",
  phrase?: string;
  phraseTranslation?: string;
}