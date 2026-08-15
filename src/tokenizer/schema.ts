import { z } from "zod";

export const TokenSchema = z.object({
  surface: z.string(),
  dictionaryForm: z.string(),
  reading: z.string(),
  pos: z.string(),
  posDetail: z.string().optional(),
});
export type Token = z.infer<typeof TokenSchema>;
