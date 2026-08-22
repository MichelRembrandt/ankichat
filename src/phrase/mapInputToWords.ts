import { splitSentences } from "./splitSentences.ts";
import { chunkPhrasesWithNovelty } from "./chunkPhrases.ts";
import { getTokenizer } from "../tokenizer/kuromojiTokenizer.ts";
import { mapToken } from "../tokenizer/mapToken.ts";
import { tokenizeAndLemmatize } from "../tokenizer/tokenize.ts";
import { logResponse } from "../dev/responseLogger.ts";
import type { Word } from "../vocab/types.ts";

// Deterministic replacement for the LLM-based splitAndTranslatePhrases +
// mapPhrasesToWords pair (see tmp/phrase-splitting-plan.md). Phrase
// boundaries come from splitSentences + chunkPhrases instead of an LLM call.
//
// Known limitation: chunkPhrases' overflow handling can make adjacent phrase
// groups overlap (share a part) to keep the final group at 3 parts. Word
// extraction only runs over each group's novelParts, so an overlapped word
// is never quizzed twice — but `phrase` (used for card-front display) is
// still the group's full 3-part text, so the same source text can appear as
// context on more than one word's card.
//
// Known gap: there is currently no deterministic-path source for a phrase
// translation (that came bundled with the LLM's old splitting+translation
// call, which this path replaces only the splitting half of — see the plan's
// "out of scope: LLM prompt changes downstream of phrase splitting"). Every
// Word from this path has phraseTranslation set to "" until a follow-up adds
// a dedicated translation step.
export async function mapInputToWordsDeterministically(userInput: string): Promise<Word[]> {
  const tokenizer = await getTokenizer();
  const words: Word[] = [];
  const debugPhrases: { phrase: string; novelText: string }[] = [];

  for (const sentence of splitSentences(userInput)) {
    const tokens = tokenizer.tokenize(sentence).map(mapToken);

    for (const { parts, novelParts } of chunkPhrasesWithNovelty(tokens)) {
      const phrase = parts.join("");
      const novelText = novelParts.join("");
      debugPhrases.push({ phrase, novelText });

      if (!novelText) continue;

      const novelTokens = await tokenizeAndLemmatize(novelText);
      for (const token of novelTokens) {
        words.push({
          writing: token.dictionaryForm,
          phrase,
          phraseTranslation: "",
        });
      }
    }
  }

  logResponse("phrase-split", userInput, { phrases: debugPhrases });

  return words;
}
