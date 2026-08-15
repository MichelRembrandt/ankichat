import { z } from "zod";

const PhraseTranslationSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
});

export const PhraseSplitSchema = z.object({
  phrases: z.array(PhraseTranslationSchema),
});

export type PhraseSplit = z.infer<typeof PhraseSplitSchema>;
export type PhraseTranslation = z.infer<typeof PhraseTranslationSchema>;
