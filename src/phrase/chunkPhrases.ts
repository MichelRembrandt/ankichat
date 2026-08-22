import type { Token } from "../tokenizer/schema.ts";
import { classifyParticle } from "./particleClassification.ts";
import { TERMINATORS } from "./splitSentences.ts";

// A phrase is capped at this many particle-separated parts (finalized rules §3).
const MAX_PARTS_PER_PHRASE = 3;

// chunkPhrases is contracted to receive a single sentence's tokens (already
// isolated by splitSentences upstream), so in normal operation this never
// matters. It exists as a defensive backstop: a "part" is never allowed to
// span a sentence-ending punctuation mark, and the overflow grouping below
// never overlaps across one — a short segment (e.g. a sentence's own trailing
// "猫だ。") stays short rather than being padded out to 3 by borrowing parts
// from a different sentence.
export function chunkPhrases(tokens: Token[]): string[][] {
  const segments = collectPartSegments(tokens);
  return segments.flatMap(groupIntoPhrases);
}

// A phrase group's parts (for display/translation context) alongside
// novelParts: the subset of `parts` not already returned by an earlier
// group from the same chunkPhrasesWithNovelty call. Only non-empty when
// the overflow overlap (see groupIndices) causes a group to repeat parts
// from the previous group within the same sentence segment — consumers
// that extract content (e.g. word selection) from phrase text should use
// novelParts instead of parts, to avoid processing overlapped content twice.
export interface PhraseGroup {
  parts: string[];
  novelParts: string[];
}

export function chunkPhrasesWithNovelty(tokens: Token[]): PhraseGroup[] {
  const segments = collectPartSegments(tokens);
  const groups: PhraseGroup[] = [];

  for (const segment of segments) {
    const seen = new Set<number>();
    for (const indices of groupIndices(segment.length)) {
      const parts = indices.map(i => segment[i]!);
      const novelParts = indices.filter(i => !seen.has(i)).map(i => segment[i]!);
      for (const i of indices) seen.add(i);
      groups.push({ parts, novelParts });
    }
  }

  return groups;
}

function collectPartSegments(tokens: Token[]): string[][] {
  const segments: string[][] = [];
  let segment: string[] = [];
  let buffer = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    buffer += token.surface;

    const endsSentence =
      isSentenceTerminatorToken(token) && !isSentenceTerminatorToken(tokens[i + 1]);

    if (endsSentence) {
      segment.push(buffer);
      buffer = "";
      segments.push(segment);
      segment = [];
      continue;
    }

    if (classifyParticle(token) === "splitting") {
      segment.push(buffer);
      buffer = "";
    }
  }

  if (buffer.length > 0) segment.push(buffer);
  if (segment.length > 0) segments.push(segment);

  return segments;
}

// A token is a sentence terminator when it's a symbol made up entirely of
// the same punctuation splitSentences.ts treats as sentence-ending (。！？
// etc.) — mirrors that module's TERMINATORS rather than duplicating it.
function isSentenceTerminatorToken(token: Token | undefined): boolean {
  return token !== undefined && token.pos === "記号" && [...token.surface].every(ch => TERMINATORS.has(ch));
}

function groupIntoPhrases(parts: string[]): string[][] {
  return groupIndices(parts.length).map(indices => indices.map(i => parts[i]!));
}

// Groups indices [0, length) sequentially into groups of MAX_PARTS_PER_PHRASE,
// except the final group: if fewer than MAX_PARTS_PER_PHRASE indices remain
// for it, it instead takes the last MAX_PARTS_PER_PHRASE indices overall,
// overlapping backward with the previous group rather than trailing short.
function groupIndices(length: number): number[][] {
  if (length <= MAX_PARTS_PER_PHRASE) {
    return length > 0 ? [Array.from({ length }, (_, i) => i)] : [];
  }

  const groups: number[][] = [];
  let i = 0;
  while (i < length) {
    if (length - i < MAX_PARTS_PER_PHRASE) {
      const start = length - MAX_PARTS_PER_PHRASE;
      groups.push(Array.from({ length: MAX_PARTS_PER_PHRASE }, (_, k) => start + k));
      break;
    }
    groups.push(Array.from({ length: MAX_PARTS_PER_PHRASE }, (_, k) => i + k));
    i += MAX_PARTS_PER_PHRASE;
  }
  return groups;
}
