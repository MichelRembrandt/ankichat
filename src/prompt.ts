import { chat } from './vocab/ai/aiclient.ts'
import exampleUserInput from '../resources/input.json' with {type: 'json'};
import exampleJson from '../resources/vocabshort.json' with { type: 'json' };

export async function splitAndTranslatePhrases(userInput: string) {
    const prompt: string = `
You are helping a Japanese learner study vocabulary from a paragraph they encountered.

Your ONLY job is:
1. Split the paragraph into natural phrases or clauses (e.g. at commas, conjunctions, or clause-final verb/adjective forms) — not into individual words.
2. Provide a natural, idiomatic English translation for each phrase.

You do NOT extract individual words, you do NOT normalize or lemmatize anything, and you do NOT decide which words are worth studying — that is handled separately downstream from your output. Every word in the paragraph will be used, so do not omit any part of the input.

RULES (follow strictly):
1. Copy each "phrase" EXACTLY as written in the source — do not correct, reinterpret, or "fix" any characters, kanji, spelling, or particles from the original input.
2. The phrases, concatenated in order, must reconstruct the entire original paragraph (aside from incidental whitespace) — do not skip or drop any part of the input.
3. "meaning" must be a natural, idiomatic English translation of that phrase (not a literal word-for-word gloss), and must always be present.
4. Self-check before returning: every "phrase" you return must be a verbatim substring of the original input, and the phrases together must cover the whole input.

Example input:
${exampleUserInput.input}

Example output:
${JSON.stringify({ phrases: exampleJson.vocabulary.map(v => ({ phrase: v.phrase, meaning: v.meaning })) })}

Return JSON in this exact shape:
{"phrases": [{"phrase": "...", "meaning": "..."}]}

Paragraph:
${userInput}
`;

    return chat(prompt);
}
