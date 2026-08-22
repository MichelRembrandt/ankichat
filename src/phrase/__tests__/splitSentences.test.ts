import { test } from "node:test";
import assert from "node:assert/strict";
import { splitSentences } from "../splitSentences.ts";

test("splits on 。", () => {
  assert.deepEqual(splitSentences("今日は晴れです。明日は雨です。"), [
    "今日は晴れです。",
    "明日は雨です。",
  ]);
});

test("splits on ASCII period", () => {
  assert.deepEqual(splitSentences("猫だ.犬だ."), ["猫だ.", "犬だ."]);
});

test("splits on \\n", () => {
  assert.deepEqual(splitSentences("一行目\n二行目"), ["一行目", "二行目"]);
});

test("splits on \\t", () => {
  assert.deepEqual(splitSentences("一つ目\t二つ目"), ["一つ目", "二つ目"]);
});

test("splits on halfwidth space", () => {
  assert.deepEqual(splitSentences("一文目 二文目"), ["一文目", "二文目"]);
});

test("splits on fullwidth space (U+3000)", () => {
  assert.deepEqual(splitSentences("一文目　二文目"), ["一文目", "二文目"]);
});

test("real input: 呼ばれた人は たやすく登れてしまう月の丘 (the case that motivated space-splitting) -> splits cleanly at the space instead of embedding it in the next sentence", () => {
  assert.deepEqual(splitSentences("呼ばれた人は たやすく登れてしまう月の丘"), [
    "呼ばれた人は",
    "たやすく登れてしまう月の丘",
  ]);
});

test("multiple consecutive spaces produce a single boundary, not empty sentences between them", () => {
  assert.deepEqual(splitSentences("一文目   二文目"), ["一文目", "二文目"]);
});

test("space mixed with other separators (space then newline) still just separates, no empty sentence", () => {
  assert.deepEqual(splitSentences("一文目 \n二文目"), ["一文目", "二文目"]);
});

test("splits on ！ and ？", () => {
  assert.deepEqual(splitSentences("本当！嘘でしょ？"), ["本当！", "嘘でしょ？"]);
});

test("combined terminal punctuation (！？) produces a single boundary, not an empty sentence between them", () => {
  assert.deepEqual(splitSentences("マジで！？知らなかった。"), [
    "マジで！？",
    "知らなかった。",
  ]);
});

test("combined terminal punctuation (？！) produces a single boundary", () => {
  assert.deepEqual(splitSentences("誰だ？！逃げろ。"), ["誰だ？！", "逃げろ。"]);
});

test("splits on halfwidth ! and ?", () => {
  assert.deepEqual(splitSentences("本当!嘘でしょ?"), ["本当!", "嘘でしょ?"]);
});

test("mixed halfwidth/fullwidth combo (!？) produces a single boundary", () => {
  assert.deepEqual(splitSentences("マジ!？知らなかった。"), ["マジ!？", "知らなかった。"]);
});

test("drops empty sentences from consecutive separators", () => {
  assert.deepEqual(splitSentences("一文目\n\n\n二文目"), ["一文目", "二文目"]);
});

test("trims surrounding whitespace from each sentence", () => {
  assert.deepEqual(splitSentences("  一文目。  \n  二文目。  "), ["一文目。", "二文目。"]);
});

test("empty input produces no sentences", () => {
  assert.deepEqual(splitSentences(""), []);
});

test("input with no terminal punctuation is returned as a single sentence", () => {
  assert.deepEqual(splitSentences("句読点なしの文"), ["句読点なしの文"]);
});

// --- Edge case: decimal numbers ---

test("decimal number does not trigger a split", () => {
  assert.deepEqual(splitSentences("価格は1.5倍になった。"), ["価格は1.5倍になった。"]);
});

test("multiple decimal numbers in one sentence do not split", () => {
  assert.deepEqual(splitSentences("1.5と2.75を比較する。"), ["1.5と2.75を比較する。"]);
});

test("period at end of sentence after a digit still splits (not mistaken for decimal)", () => {
  assert.deepEqual(splitSentences("値は5. 次の文."), ["値は5.", "次の文."]);
});

test("period after a digit still splits when not followed by another digit", () => {
  assert.deepEqual(splitSentences("残り5.まだある。"), ["残り5.", "まだある。"]);
});

// --- Edge case: ellipses ---

test("single-character ellipsis (…) produces exactly one boundary, not one per character", () => {
  assert.deepEqual(splitSentences("えっと…そうですね。"), ["えっと…", "そうですね。"]);
});

test("three-ASCII-period ellipsis (...) produces exactly one boundary", () => {
  assert.deepEqual(splitSentences("えっと...そうですね。"), ["えっと...", "そうですね。"]);
});

test("ellipsis between two digits is still an ellipsis, not swallowed by the decimal guard", () => {
  assert.deepEqual(splitSentences("3...4"), ["3...", "4"]);
});

// --- Edge case: closing bracket after sentence-end punctuation ---

test("closing bracket immediately after 。 attaches to the previous sentence instead of starting an empty one", () => {
  assert.deepEqual(splitSentences("「そうだ。」と言った。"), ["「そうだ。」", "と言った。"]);
});

test("multiple consecutive closing brackets after punctuation all attach to the previous sentence", () => {
  assert.deepEqual(splitSentences("彼は「本当？」）と聞いた。"), ["彼は「本当？」）", "と聞いた。"]);
});

test("closing bracket after ！ attaches to the previous sentence", () => {
  assert.deepEqual(splitSentences("彼は「危ない！」と叫んだ。"), ["彼は「危ない！」", "と叫んだ。"]);
});
