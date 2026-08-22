import fs from 'fs';
import path from 'path';

export async function logResponse(
  stage: 'select-words' | 'card-draft' | 'feedback' | 'tokenize' | 'image-attach',
  prompt: string,
  response: any
): Promise<string> {
  const tmpDir = path.join(process.cwd(), 'tmp', stage);
  
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const filename = `${timestamp}.json`;
  const filepath = path.join(tmpDir, filename);
  
  const logData = {
    stage,
    timestamp: new Date().toISOString(),
    prompt,
    response,
  };
  
  fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
  
  return filepath;
}