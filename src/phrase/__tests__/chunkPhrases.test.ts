import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkPhrases } from "../chunkPhrases.ts";
import { getTokenizer } from "../../tokenizer/kuromojiTokenizer.ts";
import { mapToken } from "../../tokenizer/mapToken.ts";
import type { Token } from "../../tokenizer/schema.ts";

function mkToken(surface: string, pos: string, posDetail?: string): Token {
  return { surface, dictionaryForm: surface, reading: surface, pos, posDetail };
}

async function tokenizeUnfiltered(text: string): Promise<Token[]> {
  const tokenizer = await getTokenizer();
  return tokenizer.tokenize(text).map(mapToken);
}

// --- Worked example from the plan ---

test("worked example: 俺は一番になりたいんだ -> 俺は | 一番に | なりたいんだ", () => {
  const tokens = [
    mkToken("俺", "名詞", "代名詞"),
    mkToken("は", "助詞", "係助詞"),
    mkToken("一番", "名詞", "副詞可能"),
    mkToken("に", "助詞", "格助詞"),
    mkToken("なり", "動詞", "自立"),
    mkToken("たい", "助動詞"),
    mkToken("ん", "名詞", "非自立"),
    mkToken("だ", "助動詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [["俺は", "一番に", "なりたいんだ"]]);
});

// --- Overflow handling (finalized rules §3) ---

test("exactly 3 parts stays as a single phrase (cap boundary, not overflow)", () => {
  const tokens = [
    mkToken("A", "名詞"), mkToken("は", "助詞", "係助詞"),
    mkToken("B", "名詞"), mkToken("を", "助詞", "格助詞"),
    mkToken("C", "名詞"), mkToken("に", "助詞", "格助詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [["Aは", "Bを", "Cに"]]);
});

test("4 parts overflows into two phrases; the final phrase overlaps backward to stay at 3 parts instead of trailing with 1", () => {
  const tokens = [
    mkToken("A", "名詞"), mkToken("は", "助詞", "係助詞"),
    mkToken("B", "名詞"), mkToken("を", "助詞", "格助詞"),
    mkToken("C", "名詞"), mkToken("に", "助詞", "格助詞"),
    mkToken("D", "名詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [
    ["Aは", "Bを", "Cに"],
    ["Bを", "Cに", "D"],
  ]);
});

test("5 parts overflows into two phrases; the final phrase overlaps backward to stay at 3 parts instead of trailing with 2", () => {
  const tokens = [
    mkToken("A", "名詞"), mkToken("は", "助詞", "係助詞"),
    mkToken("B", "名詞"), mkToken("を", "助詞", "格助詞"),
    mkToken("C", "名詞"), mkToken("に", "助詞", "格助詞"),
    mkToken("D", "名詞"), mkToken("で", "助詞", "格助詞"),
    mkToken("E", "名詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [
    ["Aは", "Bを", "Cに"],
    ["Cに", "Dで", "E"],
  ]);
});

test("6 parts overflows into two full phrases (3 + 3)", () => {
  const tokens = [
    mkToken("A", "名詞"), mkToken("は", "助詞", "係助詞"),
    mkToken("B", "名詞"), mkToken("を", "助詞", "格助詞"),
    mkToken("C", "名詞"), mkToken("に", "助詞", "格助詞"),
    mkToken("D", "名詞"), mkToken("で", "助詞", "格助詞"),
    mkToken("E", "名詞"), mkToken("へ", "助詞", "格助詞"),
    mkToken("F", "名詞"), mkToken("まで", "助詞", "副助詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [
    ["Aは", "Bを", "Cに"],
    ["Dで", "Eへ", "Fまで"],
  ]);
});

test("7 parts overflows into three phrases; the final phrase overlaps backward to stay at 3 parts instead of trailing with 1", () => {
  const tokens = [
    mkToken("A", "名詞"), mkToken("は", "助詞", "係助詞"),
    mkToken("B", "名詞"), mkToken("を", "助詞", "格助詞"),
    mkToken("C", "名詞"), mkToken("に", "助詞", "格助詞"),
    mkToken("D", "名詞"), mkToken("で", "助詞", "格助詞"),
    mkToken("E", "名詞"), mkToken("へ", "助詞", "格助詞"),
    mkToken("F", "名詞"), mkToken("まで", "助詞", "副助詞"),
    mkToken("G", "名詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [
    ["Aは", "Bを", "Cに"],
    ["Dで", "Eへ", "Fまで"],
    ["Eへ", "Fまで", "G"],
  ]);
});

test("plan's own overflow example: 俺は一番になりたいんだと思う -> two phrases, final one overlapping backward to stay at 3 parts", () => {
  const tokens = [
    mkToken("俺", "名詞", "代名詞"),
    mkToken("は", "助詞", "係助詞"),
    mkToken("一番", "名詞", "副詞可能"),
    mkToken("に", "助詞", "格助詞"),
    mkToken("なり", "動詞", "自立"),
    mkToken("たい", "助動詞"),
    mkToken("ん", "名詞", "非自立"),
    mkToken("だ", "助動詞"),
    mkToken("と", "助詞", "格助詞"), // quotative と, splits (格助詞)
    mkToken("思う", "動詞", "自立"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [
    ["俺は", "一番に", "なりたいんだと"],
    ["一番に", "なりたいんだと", "思う"],
  ]);
});

// --- Compound particle sequences: no special-casing, each evaluated independently ---

test("とは compound (彼とは違う): と and は each end their own part -> two boundaries, not one", () => {
  const tokens = [
    mkToken("彼", "名詞", "代名詞"),
    mkToken("と", "助詞", "格助詞"),
    mkToken("は", "助詞", "係助詞"),
    mkToken("違う", "動詞", "自立"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [["彼と", "は", "違う"]]);
});

test("へは compound (京都へは行かない): へ and は each end their own part -> two boundaries", () => {
  const tokens = [
    mkToken("京都", "名詞", "固有名詞"),
    mkToken("へ", "助詞", "格助詞"),
    mkToken("は", "助詞", "係助詞"),
    mkToken("行か", "動詞", "自立"),
    mkToken("ない", "助動詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [["京都へ", "は", "行かない"]]);
});

// --- Structural edge cases ---

test("empty token list produces no phrases", () => {
  assert.deepEqual(chunkPhrases([]), []);
});

test("no splitting particles at all -> single part, single phrase", () => {
  const tokens = [mkToken("速い", "形容詞", "自立")];
  assert.deepEqual(chunkPhrases(tokens), [["速い"]]);
});

test("sentence ending exactly on a splitting particle produces no trailing empty part", () => {
  const tokens = [mkToken("水", "名詞", "一般"), mkToken("は", "助詞", "係助詞")];
  assert.deepEqual(chunkPhrases(tokens), [["水は"]]);
});

// --- と 並立助詞 (listing) attaches through the full chunker, not just the isolated classifier ---

test("並立助詞 と (リンゴとバナナを買った) stays merged in one part, per the favor-undersplitting decision", async () => {
  const tokens = await tokenizeUnfiltered("リンゴとバナナを買った");
  assert.deepEqual(chunkPhrases(tokens), [["リンゴとバナナを", "買った"]]);
});

// --- Real-input regression tests against actual prior LLM phrase-splitting behavior ---
// (from tmp/select-words/*.json logs of the old LLM-based splitter)

test("real input: これまで綴ってきた歌詞が英訳され -> deterministic, single stable split (LLM baseline was inconsistent across runs: sometimes split at が, sometimes not split at all)", async () => {
  const tokens = await tokenizeUnfiltered("これまで綴ってきた歌詞が英訳され");
  assert.deepEqual(chunkPhrases(tokens), [["これまで", "綴ってきた歌詞が", "英訳され"]]);
});

test("real input: 水は面白い -> splits at は, matching the LLM baseline's (correct, in this case) behavior", async () => {
  const tokens = await tokenizeUnfiltered("水は面白い");
  assert.deepEqual(chunkPhrases(tokens), [["水は", "面白い"]]);
});

test("real input: アンキチャットへようこそ -> splits at へ (finer-grained than the LLM baseline, which left it as one unsplit phrase)", async () => {
  const tokens = await tokenizeUnfiltered("アンキチャットへようこそ");
  assert.deepEqual(chunkPhrases(tokens), [["アンキチャットへ", "ようこそ"]]);
});

test("real input: 彼は東京から大阪まで新幹線で行った -> 5 parts overflows into two phrases, final one overlapping backward to stay at 3 parts", async () => {
  const tokens = await tokenizeUnfiltered("彼は東京から大阪まで新幹線で行った");
  assert.deepEqual(chunkPhrases(tokens), [
    ["彼は", "東京から", "大阪まで"],
    ["大阪まで", "新幹線で", "行った"],
  ]);
});

// --- Cross-sentence guard: groups must never span a sentence boundary ---
// (defensive backstop; chunkPhrases is contracted to receive one sentence's
// tokens, but this holds even if that contract is ever violated upstream)

test("a sentence-ending symbol (。) mid-stream forces a segment break instead of being buried inside a part", async () => {
  const tokens = await tokenizeUnfiltered("猫だ。今日は暑い");
  assert.deepEqual(chunkPhrases(tokens), [["猫だ。"], ["今日は", "暑い"]]);
});

test("a short trailing segment (2 parts) is never padded to 3 by borrowing from a different sentence's overflow, even when that sentence overflows right next to it", () => {
  const tokens = [
    mkToken("A", "名詞"), mkToken("は", "助詞", "係助詞"),
    mkToken("B", "名詞"), mkToken("を", "助詞", "格助詞"),
    mkToken("C", "名詞"), mkToken("に", "助詞", "格助詞"),
    mkToken("D", "名詞"), mkToken("。", "記号", "句点"),
    mkToken("E", "名詞"), mkToken("へ", "助詞", "格助詞"),
    mkToken("F", "名詞"),
  ];
  assert.deepEqual(chunkPhrases(tokens), [
    ["Aは", "Bを", "Cに"],
    ["Bを", "Cに", "D。"],
    ["Eへ", "F"],
  ]);
});
