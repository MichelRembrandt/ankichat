import { z } from "zod";

const VocabWordSchema = z.object({
  word: z.string(),
  reading: z.string(),
  part_of_speech: z.string(),
  meaning: z.string(),
});

const VocabPhraseSchema = z.object({
  phrase: z.string(),
  words: z.array(VocabWordSchema),
  particles_excluded: z.array(z.string()),
  meaning: z.string(),
});

export const VocabularyDataSchema = z.object({
  vocabulary: z.array(VocabPhraseSchema),
});

export type VocabularyData = z.infer<typeof VocabularyDataSchema>;
export type VocabPhrase = z.infer<typeof VocabPhraseSchema>;
export type VocabWord = z.infer<typeof VocabWordSchema>;
