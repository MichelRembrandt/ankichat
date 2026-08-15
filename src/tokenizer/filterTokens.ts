import type { Token } from "./schema.ts";

const EXCLUDED_POS = new Set(["助詞", "助動詞", "記号"]);

export function filterContentTokens(tokens: Token[]): Token[] {
  return tokens.filter(t => !EXCLUDED_POS.has(t.pos));
}
