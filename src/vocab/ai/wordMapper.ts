import type { VocabularyData, VocabPhrase } from "./schema.ts";
import type { Word } from "../types.ts"

export function mapToWords(data : VocabularyData): Word[] {

    return data.vocabulary.flatMap((vocabPhrase : VocabPhrase) =>
    vocabPhrase.words.map((w : string) => ({
      writing: w,
      phrase: vocabPhrase.phrase,
      phraseTranslation: vocabPhrase.meaning,
    }))
  );
}