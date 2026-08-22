import { test } from "node:test";
import assert from "node:assert/strict";
import { mapInputToWordsDeterministically } from "../mapInputToWords.ts";

test("basic single-sentence input produces words with phrase context and empty phraseTranslation (known gap: no translation source yet)", async () => {
  // 2 parts total (水は, 面白い) fit in one group (<=3), so both words share
  // that group's full joined text as `phrase`, not their individual part.
  const words = await mapInputToWordsDeterministically("水は面白い");
  assert.deepEqual(
    words.map(w => ({ writing: w.writing, phrase: w.phrase, phraseTranslation: w.phraseTranslation })),
    [
      { writing: "水", phrase: "水は面白い", phraseTranslation: "" },
      { writing: "面白い", phrase: "水は面白い", phraseTranslation: "" },
    ]
  );
});

test("overlap dedup end-to-end: a word inside an overlapped part is extracted only once, not once per phrase group it appears in", async () => {
  // 彼は東京から大阪まで新幹線で行った tokenizes to 5 splitting parts, which
  // overflows into two groups sharing "大阪まで" (see chunkPhrases tests).
  // 大阪 is a content word inside that shared part; it must appear exactly
  // once in the output, not twice, despite showing up in both groups' `parts`.
  const words = await mapInputToWordsDeterministically("彼は東京から大阪まで新幹線で行った");
  const writings = words.map(w => w.writing);
  assert.deepEqual(writings.filter(w => w === "大阪").length, 1, `expected 大阪 exactly once, got: ${JSON.stringify(writings)}`);
});

test("multi-sentence input never crosses a sentence boundary in word extraction (defensive backstop from chunkPhrases)", async () => {
  const words = await mapInputToWordsDeterministically("猫だ。今日は暑い");
  const writings = words.map(w => w.writing);
  assert.deepEqual(writings, ["猫", "今日", "暑い"]);
});
