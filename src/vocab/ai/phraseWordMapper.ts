import type { PhraseSplit } from "./schema.ts";
import type { Word } from "../types.ts";
import { tokenizeAndLemmatize } from "../../tokenizer/tokenize.ts";

export async function mapPhrasesToWords(phraseSplit: PhraseSplit, originalInput: string): Promise<Word[]> {
  const words: Word[] = [];

  for (const { phrase, meaning } of phraseSplit.phrases) {
    if (!originalInput.includes(phrase)) {
      throw new Error(`AI returned phrase "${phrase}", which is not a verbatim substring of the original input`);
    }

    const tokens = await tokenizeAndLemmatize(phrase);

    for (const token of tokens) {
      words.push({
        writing: token.dictionaryForm,
        phrase,
        phraseTranslation: meaning,
      });
    }
  }

  return words;
}
