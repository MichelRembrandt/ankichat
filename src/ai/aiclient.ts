import OpenAI from 'openai';

function createAIClient() {
  return new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_API_URL
  });
}

const ai = createAIClient();

export async function chat(message: string) {
    
    const response = await ai.responses.create({
        model: process.env.LLM_MODEL,
        input: message,
    });

   return response.output_text

}