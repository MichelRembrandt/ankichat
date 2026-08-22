// Halfwidth (U+0020) and fullwidth (U+3000) space are treated the same as
// \n/\t: a plain separator between sentences, not retained in the output.
const SEPARATORS = new Set(["\n", "\t", " ", "　"]);

// Sentence-ending punctuation, both fullwidth and halfwidth forms, plus the
// single-character ellipsis (…). A run of any of these collapses to one
// boundary via the same run-collection logic used for combos like "！？".
// Exported so chunkPhrases.ts can recognize the same characters defensively
// (see its sentence-segment-boundary handling).
export const TERMINATORS = new Set([".", "。", "！", "？", "…", "!", "?"]);

const CLOSING_BRACKETS = new Set(["」", "』", "】", ")", "）", "]", "｝", "》", "〉", "\"", "'", "”", "’"]);

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= "0" && ch <= "9";
}

function pushIfNonEmpty(sentences: string[], candidate: string): void {
  const trimmed = candidate.trim();
  if (trimmed.length > 0) sentences.push(trimmed);
}

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = "";
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;

    if (SEPARATORS.has(ch)) {
      pushIfNonEmpty(sentences, current);
      current = "";
      i++;
      continue;
    }

    if (TERMINATORS.has(ch)) {
      const isDecimalPoint = ch === "." && isDigit(text[i - 1]) && isDigit(text[i + 1]);
      if (isDecimalPoint) {
        current += ch;
        i++;
        continue;
      }

      while (i < text.length && TERMINATORS.has(text[i]!)) {
        current += text[i];
        i++;
      }
      while (i < text.length && CLOSING_BRACKETS.has(text[i]!)) {
        current += text[i];
        i++;
      }

      pushIfNonEmpty(sentences, current);
      current = "";
      continue;
    }

    current += ch;
    i++;
  }

  pushIfNonEmpty(sentences, current);
  return sentences;
}
