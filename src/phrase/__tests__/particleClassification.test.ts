import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyParticle } from "../particleClassification.ts";
import type { Token } from "../../tokenizer/schema.ts";

function mkToken(surface: string, pos: string, posDetail?: string): Token {
  return { surface, dictionaryForm: surface, reading: surface, pos, posDetail };
}

// --- Always-splitting particles (surface match only, subtype irrelevant) ---

test("は splits (係助詞, as kuromoji actually tags it)", () => {
  assert.equal(classifyParticle(mkToken("は", "助詞", "係助詞")), "splitting");
});

test("が splits (格助詞)", () => {
  assert.equal(classifyParticle(mkToken("が", "助詞", "格助詞")), "splitting");
});

test("を splits (格助詞)", () => {
  assert.equal(classifyParticle(mkToken("を", "助詞", "格助詞")), "splitting");
});

test("に splits (格助詞)", () => {
  assert.equal(classifyParticle(mkToken("に", "助詞", "格助詞")), "splitting");
});

test("で splits (格助詞)", () => {
  assert.equal(classifyParticle(mkToken("で", "助詞", "格助詞")), "splitting");
});

test("へ splits (格助詞)", () => {
  assert.equal(classifyParticle(mkToken("へ", "助詞", "格助詞")), "splitting");
});

test("まで splits (副助詞, as kuromoji actually tags it — not 格助詞)", () => {
  assert.equal(classifyParticle(mkToken("まで", "助詞", "副助詞")), "splitting");
});

test("always-splitting particles split even under an unexpected subtype", () => {
  // The "always" rule ignores posDetail entirely by design.
  assert.equal(classifyParticle(mkToken("が", "助詞", "格助詞")), "splitting");
  assert.equal(classifyParticle(mkToken("は", "助詞", undefined)), "splitting");
});

// --- と/から dual-role classification: highest-risk area, most coverage ---

test("と splits when tagged 格助詞 (case particle, e.g. 彼と話した / 田中さんと会う)", () => {
  assert.equal(classifyParticle(mkToken("と", "助詞", "格助詞")), "splitting");
});

test("と attaches when tagged 接続助詞 (conjunctive, e.g. 映画を見ると楽しい)", () => {
  assert.equal(classifyParticle(mkToken("と", "助詞", "接続助詞")), "attaching");
});

test("quotative と (だと言う/と思う) is tagged 格助詞 at the pos_detail_1 level kuromoji exposes, so it splits", () => {
  // Raw kuromoji distinguishes 格助詞/引用 (quotation) from 格助詞/一般 via
  // pos_detail_2, but this project's Token schema only carries pos_detail_1
  // (see src/tokenizer/mapToken.ts), which is "格助詞" for both. Both split.
  assert.equal(classifyParticle(mkToken("と", "助詞", "格助詞")), "splitting");
});

test("と attaches when tagged 並立助詞 (listing/parallel, e.g. リンゴとバナナ, 犬と猫) — an observed kuromoji subtype outside the plan's binary と rule", () => {
  assert.equal(classifyParticle(mkToken("と", "助詞", "並立助詞")), "attaching");
});

test("と attaches under any other/unrecognized subtype (defensive default)", () => {
  assert.equal(classifyParticle(mkToken("と", "助詞", "未知区分")), "attaching");
  assert.equal(classifyParticle(mkToken("と", "助詞", undefined)), "attaching");
});

test("から splits when tagged 格助詞 (case particle, e.g. 東京から来た / 朝から働く)", () => {
  assert.equal(classifyParticle(mkToken("から", "助詞", "格助詞")), "splitting");
});

test("から attaches when tagged 接続助詞 (conjunctive, e.g. 疲れたから帰る)", () => {
  assert.equal(classifyParticle(mkToken("から", "助詞", "接続助詞")), "attaching");
});

test("から attaches under any other/unrecognized subtype (defensive default)", () => {
  assert.equal(classifyParticle(mkToken("から", "助詞", "未知区分")), "attaching");
  assert.equal(classifyParticle(mkToken("から", "助詞", undefined)), "attaching");
});

// --- Attaching tokens ---

test("auxiliaries (だ/です/ます) attach — they are 助動詞, not 助詞, so they never reach the particle table", () => {
  assert.equal(classifyParticle(mkToken("だ", "助動詞")), "attaching");
  assert.equal(classifyParticle(mkToken("です", "助動詞")), "attaching");
  assert.equal(classifyParticle(mkToken("ます", "助動詞")), "attaching");
});

test("sentence-final particles (よ/ね/か/な) attach — not in the splitting table", () => {
  assert.equal(classifyParticle(mkToken("よ", "助詞", "終助詞")), "attaching");
  assert.equal(classifyParticle(mkToken("ね", "助詞", "終助詞")), "attaching");
  assert.equal(classifyParticle(mkToken("な", "助詞", "終助詞")), "attaching");
});

test("か attaches even with kuromoji's ambiguous compound subtype tag (副助詞／並立助詞／終助詞, as actually observed)", () => {
  assert.equal(classifyParticle(mkToken("か", "助詞", "副助詞／並立助詞／終助詞")), "attaching");
});

test("て (te-form conjunctive particle) attaches — not in the always-splitting list", () => {
  assert.equal(classifyParticle(mkToken("て", "助詞", "接続助詞")), "attaching");
});

test("other unlisted particles (も, し, けど, たり) attach by default", () => {
  assert.equal(classifyParticle(mkToken("も", "助詞", "係助詞")), "attaching");
  assert.equal(classifyParticle(mkToken("し", "助詞", "接続助詞")), "attaching");
  assert.equal(classifyParticle(mkToken("けど", "助詞", "接続助詞")), "attaching");
  assert.equal(classifyParticle(mkToken("たり", "助詞", "並立助詞")), "attaching");
});

test("non-particle content tokens (nouns, verbs) attach trivially", () => {
  assert.equal(classifyParticle(mkToken("学校", "名詞", "一般")), "attaching");
  assert.equal(classifyParticle(mkToken("行く", "動詞", "自立")), "attaching");
  assert.equal(classifyParticle(mkToken("速い", "形容詞", "自立")), "attaching");
});
