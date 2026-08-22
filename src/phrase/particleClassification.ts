import type { Token } from "../tokenizer/schema.ts";

export type ParticleClassification = "splitting" | "attaching";

type ClassificationRule =
  // Splits the current chunk regardless of kuromoji's POS subtype.
  | { kind: "always"; classification: ParticleClassification }
  // Splits only when kuromoji's pos_detail_1 subtype matches an entry here;
  // any other subtype (including ones not observed/listed) falls back to `otherwise`.
  | { kind: "bySubtype"; subtype: Record<string, ParticleClassification>; otherwise: ParticleClassification };

// Single source of truth for phrase-chunking boundaries (finalized rules §2
// of tmp/phrase-splitting-plan.md). Keyed on particle surface form; only
// 助詞 (particle) tokens are looked up here — see classifyParticle.
const PARTICLE_CLASSIFICATION_TABLE: Record<string, ClassificationRule> = {
  は: { kind: "always", classification: "splitting" },
  が: { kind: "always", classification: "splitting" },
  を: { kind: "always", classification: "splitting" },
  に: { kind: "always", classification: "splitting" },
  で: { kind: "always", classification: "splitting" },
  へ: { kind: "always", classification: "splitting" },
  まで: { kind: "always", classification: "splitting" },

  // と/から: dual role per the plan — splitting only as 格助詞 (case particle),
  // attaching as 接続助詞 (conjunctive particle).
  //
  // Observed kuromoji/IPADIC quirk beyond what the plan specifies: と directly
  // between two bare nouns (e.g. リンゴとバナナ, 犬と猫) is tagged 並立助詞
  // (parallel/listing particle), a third subtype the plan doesn't mention.
  // 並立助詞 falls through to `otherwise` (attaching) here, same as any other
  // unlisted subtype. Note kuromoji applies this tag purely from the
  // noun-と-noun surface pattern — it does NOT distinguish true coordination
  // ("apple and banana") from comitative "with" (友達と映画を見た, "watched a
  // movie with a friend") when と sits directly between two nouns; both come
  // back as 並立助詞 and both attach under this table. See phrase-splitting
  // plan Task 2 stop-point notes for the flagged tradeoff.
  と: {
    kind: "bySubtype",
    subtype: { 格助詞: "splitting", 接続助詞: "attaching" },
    otherwise: "attaching",
  },
  から: {
    kind: "bySubtype",
    subtype: { 格助詞: "splitting", 接続助詞: "attaching" },
    otherwise: "attaching",
  },
};

export function classifyParticle(token: Token): ParticleClassification {
  if (token.pos !== "助詞") return "attaching";

  const rule = PARTICLE_CLASSIFICATION_TABLE[token.surface];
  if (!rule) return "attaching";

  if (rule.kind === "always") return rule.classification;
  return rule.subtype[token.posDetail ?? ""] ?? rule.otherwise;
}
