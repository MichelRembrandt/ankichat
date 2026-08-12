import { VocabularyData, VocabPhrase, VocabWord } from "./schema.js";

export interface Word {
  word: string;
  reading: string;
  part_of_speech: string;
  meaning: string;
  sourcePhrase: string;
  sourcePhraseMeaning: string;
}

export function mapToWords(data : VocabularyData): Word[] {

    return data.vocabulary.flatMap((vocabPhrase : VocabPhrase) =>
    vocabPhrase.words.map((w : VocabWord) => ({
      ...w,
      sourcePhrase: vocabPhrase.phrase,
      sourcePhraseMeaning: vocabPhrase.meaning,
    }))
  );

}