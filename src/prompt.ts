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

Rule: All verbs and i-adjectives in "words" must be in dictionary (辞書形) form 
— the plain, non-conjugated form you'd look up in a dictionary. 
Convert passive/potential/causative/te-form/past/auxiliary conjugations back to their base form.
Examples: 呼ばれた→呼ぶ, 登れる→登る, した→する, 食べて→食べる, 大きな→大きい

Rule: Each entry in "words" must be a single dictionary-form word. 
Do not merge a verb with an auxiliary (しまう, いる, くる, etc.) into one string

Example input:
${exampleInput}

Example output:
\`\`\`json
${exampleOutput}
\`\`\`

Paragraph:
${userInput}
`;

    return chat(prompt);
}
