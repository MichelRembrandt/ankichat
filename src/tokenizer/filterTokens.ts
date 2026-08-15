import type { Token } from "./schema.ts";

const EXCLUDED_POS = new Set(["助詞", "助動詞", "記号"]);

// 接尾 (suffix) and 非自立 (non-independent) forms are grammatical function
// words masquerading as content POS (動詞/名詞 etc.) — e.g. れる (動詞/接尾,
// passive/potential marker), しまう (動詞/非自立, grammatical "end up doing"),
// たち (名詞/接尾, pluralizing suffix), まま (名詞/非自立, "as-is" construction).
const EXCLUDED_POS_DETAIL = new Set(["接尾", "非自立"]);

export function filterContentTokens(tokens: Token[]): Token[] {
  return tokens.filter(
    t => !EXCLUDED_POS.has(t.pos) && !(t.posDetail && EXCLUDED_POS_DETAIL.has(t.posDetail))
  );
}
