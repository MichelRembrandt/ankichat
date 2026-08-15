import type { IpadicFeatures } from "kuromoji";
import { TokenSchema, type Token } from "./schema.ts";

export function mapToken(f: IpadicFeatures): Token {
  const dictionaryForm =
    f.basic_form && f.basic_form !== "*" ? f.basic_form : f.surface_form;
  const reading = f.reading ?? f.surface_form;

  return TokenSchema.parse({
    surface: f.surface_form,
    dictionaryForm,
    reading,
    pos: f.pos,
    posDetail: f.pos_detail_1 !== "*" ? f.pos_detail_1 : undefined,
  });
}
