import { invoke } from "./client.ts";

/** Verifies Anki is running and reachable. Throws a friendly error if not. */
export async function checkConnection(): Promise<void> {
  const version = await invoke<number>("version");
  if (!version) {
    throw new Error("Unexpected empty response from AnkiConnect.");
  }
}

/** Returns all existing deck names. */
export async function getDeckNames(): Promise<string[]> {
  return invoke<string[]>("deckNames");
}

/** Creates a deck if it doesn't already exist (no-op otherwise). */
export async function ensureDeckExists(deckName: string): Promise<void> {
  const decks = await getDeckNames();
  if (!decks.includes(deckName)) {
    await invoke("createDeck", { deck: deckName });
  }
}

/** Returns the field names for a given note type (e.g. "Basic" -> ["Front","Back"]). */
export async function getModelFieldNames(modelName: string): Promise<string[]> {
  return invoke<string[]>("modelFieldNames", { modelName });
}
