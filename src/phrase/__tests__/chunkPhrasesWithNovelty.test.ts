import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkPhrasesWithNovelty } from "../chunkPhrases.ts";
import type { Token } from "../../tokenizer/schema.ts";

function mkToken(surface: string, pos: string, posDetail?: string): Token {
  return { surface, dictionaryForm: surface, reading: surface, pos, posDetail };
}

function particleTokens(labels: [string, string][]): Token[] {
  // labels: [contentSurface, splittingParticleSurface][] built from the
  // always-splitting particle set, so classification is unambiguous.
  const posDetailFor: Record<string, string> = {
    は: "係助詞", が: "格助詞", を: "格助詞", に: "格助詞", で: "格助詞", へ: "格助詞", まで: "副助詞",
  };
  const tokens: Token[] = [];
  for (const [content, particle] of labels) {
    tokens.push(mkToken(content, "名詞"));
    tokens.push(mkToken(particle, "助詞", posDetailFor[particle]));
  }
  return tokens;
}

test("no overflow (<=3 parts): every part is novel", () => {
  const tokens = [...particleTokens([["A", "は"], ["B", "を"]]), mkToken("C", "名詞")];
  const groups = chunkPhrasesWithNovelty(tokens);
  assert.deepEqual(groups, [{ parts: ["Aは", "Bを", "C"], novelParts: ["Aは", "Bを", "C"] }]);
});

test("6 parts (N%3==0): no overlap, both groups fully novel", () => {
  const tokens = particleTokens([["A", "は"], ["B", "を"], ["C", "に"], ["D", "で"], ["E", "へ"], ["F", "まで"]]);
  const groups = chunkPhrasesWithNovelty(tokens);
  assert.deepEqual(groups, [
    { parts: ["Aは", "Bを", "Cに"], novelParts: ["Aは", "Bを", "Cに"] },
    { parts: ["Dで", "Eへ", "Fまで"], novelParts: ["Dで", "Eへ", "Fまで"] },
  ]);
});

test("4 parts (N%3==1): final group has exactly 1 novel part, the rest are repeats", () => {
  const tokens = [...particleTokens([["A", "は"], ["B", "を"], ["C", "に"]]), mkToken("D", "名詞")];
  const groups = chunkPhrasesWithNovelty(tokens);
  assert.deepEqual(groups, [
    { parts: ["Aは", "Bを", "Cに"], novelParts: ["Aは", "Bを", "Cに"] },
    { parts: ["Bを", "Cに", "D"], novelParts: ["D"] },
  ]);
});

test("5 parts (N%3==2): final group has exactly 2 novel parts", () => {
  const tokens = [...particleTokens([["A", "は"], ["B", "を"], ["C", "に"], ["D", "で"]]), mkToken("E", "名詞")];
  const groups = chunkPhrasesWithNovelty(tokens);
  assert.deepEqual(groups, [
    { parts: ["Aは", "Bを", "Cに"], novelParts: ["Aは", "Bを", "Cに"] },
    { parts: ["Cに", "Dで", "E"], novelParts: ["Dで", "E"] },
  ]);
});

test("7 parts (N%3==1): third group has exactly 1 novel part", () => {
  const tokens = [
    ...particleTokens([["A", "は"], ["B", "を"], ["C", "に"], ["D", "で"], ["E", "へ"], ["F", "まで"]]),
    mkToken("G", "名詞"),
  ];
  const groups = chunkPhrasesWithNovelty(tokens);
  assert.deepEqual(groups, [
    { parts: ["Aは", "Bを", "Cに"], novelParts: ["Aは", "Bを", "Cに"] },
    { parts: ["Dで", "Eへ", "Fまで"], novelParts: ["Dで", "Eへ", "Fまで"] },
    { parts: ["Eへ", "Fまで", "G"], novelParts: ["G"] },
  ]);
});

test("8 parts (N%3==2): third group has exactly 2 novel parts", () => {
  const tokens = [
    ...particleTokens([["A", "は"], ["B", "を"], ["C", "に"], ["D", "で"], ["E", "へ"], ["F", "まで"], ["G", "は"]]),
    mkToken("H", "名詞"),
  ];
  const groups = chunkPhrasesWithNovelty(tokens);
  assert.deepEqual(groups, [
    { parts: ["Aは", "Bを", "Cに"], novelParts: ["Aは", "Bを", "Cに"] },
    { parts: ["Dで", "Eへ", "Fまで"], novelParts: ["Dで", "Eへ", "Fまで"] },
    { parts: ["Fまで", "Gは", "H"], novelParts: ["Gは", "H"] },
  ]);
});

test("novelty resets per sentence segment: a fresh segment's parts are all novel even after the previous segment overflowed", () => {
  const tokens = [
    // segment 1: 4 parts -> overflow, ends with a sentence terminator
    ...particleTokens([["A", "は"], ["B", "を"], ["C", "に"]]),
    mkToken("D", "名詞"),
    mkToken("。", "記号", "句点"),
    // segment 2: 2 parts, no overflow
    mkToken("E", "名詞"),
    mkToken("へ", "助詞", "格助詞"),
    mkToken("F", "名詞"),
  ];
  const groups = chunkPhrasesWithNovelty(tokens);
  assert.deepEqual(groups, [
    { parts: ["Aは", "Bを", "Cに"], novelParts: ["Aは", "Bを", "Cに"] },
    { parts: ["Bを", "Cに", "D。"], novelParts: ["D。"] },
    { parts: ["Eへ", "F"], novelParts: ["Eへ", "F"] },
  ]);
});
