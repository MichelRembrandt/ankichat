import kuromoji from "kuromoji";
import { resolveKuromojiDictPath } from "./dictPath.ts";

type IpadicTokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

let tokenizerPromise: Promise<IpadicTokenizer> | null = null;

export function getTokenizer(): Promise<IpadicTokenizer> {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({ dicPath: resolveKuromojiDictPath() })
        .build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
    });
  }
  return tokenizerPromise;
}
