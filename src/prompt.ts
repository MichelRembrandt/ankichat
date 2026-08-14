import { chat } from './vocab/ai/aiclient.ts'
import exampleUserInput from '../resources/input.json' with {type: 'json'};
import exampleJson from '../resources/vocabshort.json' with { type: 'json' };


export async function extractVocab(userInput: string) {
    const exampleInput : string = exampleUserInput.input;
    const exampleOutput : string = JSON.stringify(exampleJson);

    const prompt: string = `
Create a list of all words (excluding particles) used in the provided paragraph,
so I can use it for extensive vocabulary study for learning Japanese. 
Return the list in json format according to the following example:

RULES (follow strictly):
1. Copy the source text EXACTLY as written for the "phrase" field — do not correct, reinterpret, or "fix" any characters, kanji, or spelling from the original input. The "phrase" field must include any trailing particles that belong to it (e.g. if the source has "...人は", write "phrase": "...人は", NOT "...人" with は stripped off).
2. Each entry in "words" must be ONE single word only — never a multi-word chunk. If a phrase contains multiple words, list each as its own array element.
3. Convert every word to its DICTIONARY FORM (辞書形/lemma):
   - Verbs: plain non-past form (e.g. 登られてしまう → 登る, 生きてきた → 生きる, 潜んだ → 潜む)
   - Do not merge a verb with an auxiliary (しまう, いる, くる, etc.) into one string
   - い-adjectives: end in い, not く/かった/くない (e.g. たやすく → たやすい, 濡れて → 濡れる is actually a verb — but 高く → 高い, 大きく → 大きい)
   - な-adjectives: base form without な (e.g. 静かな → 静か)
   - Strip auxiliary/grammar suffixes (てしまう, てきた, まま, etc.) — these are not vocabulary and should not appear in "words" or "particles_excluded" at all.
4. Particles (は, が, を, に, で, の, と, etc.) go in "particles_excluded", not "words".
5. EVERY object in "vocabulary" MUST contain all four fields: "phrase", "words", "particles_excluded", "meaning". Never omit "meaning" — if unsure, give your best concise translation, but the field must always be present and non-empty.
6. Self-check before returning: for each entry, verify (a) all four fields are present, (b) no "words" entry contains more than one word, (c) no "words" entry is in a conjugated/non-dictionary form, (d) "phrase" is a verbatim substring of the original input including its particles.

Example input:
${exampleInput}

Example output:
${exampleOutput}

Paragraph:
${userInput}
`;

    return chat(prompt);
}
