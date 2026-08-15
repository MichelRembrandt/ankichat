import { getTokenizer } from "./kuromojiTokenizer.ts";
import { mapToken } from "./mapToken.ts";
import { filterContentTokens } from "./filterTokens.ts";
import { logResponse } from "../dev/responseLogger.ts";
import type { Token } from "./schema.ts";

export async function tokenizeAndLemmatize(text: string): Promise<Token[]> {
  const tokenizer = await getTokenizer();
  const raw = tokenizer.tokenize(text);
  const mapped = raw.map(mapToken);
  const filtered = filterContentTokens(mapped);

  logResponse("tokenize", text, { allTokens: mapped, filteredTokens: filtered });

  return filtered;
}
