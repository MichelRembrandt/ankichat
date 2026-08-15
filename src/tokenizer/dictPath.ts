import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

export function resolveKuromojiDictPath(): string {
  const kuromojiPkgPath = require.resolve("kuromoji/package.json");
  return path.join(path.dirname(kuromojiPkgPath), "dict");
}
