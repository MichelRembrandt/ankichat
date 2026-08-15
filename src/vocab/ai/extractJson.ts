/**
 * AI responses are sometimes wrapped in ```json ... ``` fences and can have \n and \; strip them if present.
 */
export function extractJson(raw: string): string {
  const trimmed = raw.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  const braceMatch = trimmed.match(/[{[][\s\S]*[}\]]/);
  if (braceMatch) return braceMatch[0].trim();

  return trimmed;
}
