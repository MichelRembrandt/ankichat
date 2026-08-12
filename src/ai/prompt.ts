import { chat } from './aiclient.ts'
import exampleUserInput from '../../resources/input.json' with {type: 'json'};
import exampleJson from '../../resources/vocabulary.json' with { type: 'json' };


export async function extractVocab(userInput: string) {
    const exampleInput : string = exampleUserInput.input;
    const exampleOutput : string = JSON.stringify(exampleJson);

    const prompt: string = `
Create a list of all words (excluding particles) used in the provided paragraph,
so I can use it for extensive vocabulary study for learning Japanese. 
Return the list in json format according to the following example:

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
