import { test } from "node:test";
import assert from "node:assert/strict";
import { getTokenizer } from "../kuromojiTokenizer.ts";
import { mapToken } from "../mapToken.ts";
import { filterContentTokens } from "../filterTokens.ts";

async function tokenize(text: string) {
  const tokenizer = await getTokenizer();
  return tokenizer.tokenize(text).map(mapToken);
}

test("速く -> 速い (く-form i-adjective normalization)", async () => {
  const tokens = await tokenize("速く");
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0]?.dictionaryForm, "速い");
});

test("食べました -> 食べる (polite past verb, auxiliaries filtered out)", async () => {
  const tokens = await tokenize("食べました");
  // Kuromoji tokenizes at the morpheme level: 食べ+まし+た, not a single fused
  // "食べました" token. まし/た are 助動詞 and get filtered out entirely, so only
  // the verb stem's dictionaryForm (食べる) survives filtering.
  const filtered = filterContentTokens(tokens);
  assert.deepEqual(filtered.map(t => t.dictionaryForm), ["食べる"]);
});

test("飲んで -> 飲む (te-form verb -> dictionary form)", async () => {
  const tokens = await tokenize("飲んで");
  assert.equal(tokens[0]?.dictionaryForm, "飲む");
});

test("私は学校に行った -> filtered tokens exclude は and た (particle/auxiliary filtering)", async () => {
  const tokens = await tokenize("私は学校に行った");
  const filtered = filterContentTokens(tokens);
  assert.ok(!filtered.some(t => t.surface === "は"));
  assert.ok(!filtered.some(t => t.surface === "た"));
  assert.deepEqual(filtered.map(t => t.dictionaryForm), ["私", "学校", "行く"]);
});

test("real input: これまで綴ってきた歌詞が英訳され", async () => {
  const tokens = await tokenize("これまで綴ってきた歌詞が英訳され");
  const filtered = filterContentTokens(tokens);
  const forms = filtered.map(t => t.dictionaryForm);
  // き(くる, 動詞/非自立) and れ(れる, 動詞/接尾) are grammatical/auxiliary-functioning
  // forms, excluded by the 接尾/非自立 posDetail rule alongside 助詞/助動詞/記号.
  assert.deepEqual(forms, ["これ", "綴る", "歌詞", "英訳", "する"]);
});

test("real input: 呼ばれた人は たやすく登れてしまう月の丘", async () => {
  const tokens = await tokenize("呼ばれた人は たやすく登れてしまう月の丘");
  const filtered = filterContentTokens(tokens);
  const forms = filtered.map(t => t.dictionaryForm);
  // れる(動詞/接尾) and しまう(動詞/非自立) excluded as grammatical function forms.
  assert.deepEqual(forms, ["呼ぶ", "人", "たやすい", "登れる", "月", "丘"]);
});

test("real input: アンキチャットへようこそ", async () => {
  const tokens = await tokenize("アンキチャットへようこそ");
  const filtered = filterContentTokens(tokens);
  const forms = filtered.map(t => t.dictionaryForm);
  assert.deepEqual(forms, ["アンキチャット", "ようこそ"]);
  assert.ok(!filtered.some(t => t.surface === "へ"));
});

test("real input: あの子はまだわたしたち幾つも約束をしたまま", async () => {
  const tokens = await tokenize("あの子はまだわたしたち幾つも約束をしたまま");
  const filtered = filterContentTokens(tokens);
  const forms = filtered.map(t => t.dictionaryForm);
  // たち(名詞/接尾) and まま(名詞/非自立) excluded alongside は/も/を particles and た auxiliary.
  assert.deepEqual(forms, ["あの", "子", "まだ", "わたし", "幾つ", "約束", "する"]);
});
