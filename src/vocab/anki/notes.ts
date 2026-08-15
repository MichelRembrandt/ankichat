import { Word } from "../types.ts";
import { invoke } from "./client.ts";
import { ensureDeckExists } from "./connection.ts";

export interface AnkiNote {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
  options?: {
    allowDuplicate?: boolean;
    duplicateScope?: string;
  };
}

/**
 * Checks whether each note in a batch could be added (e.g. flags duplicates)
 * without actually creating anything. Useful before showing a draft to the user.
 */
export async function canAddNotes(notes: AnkiNote[]): Promise<boolean[]> {
  return invoke<boolean[]>("canAddNotes", { notes });
}

/** Converts a CardDraft into the AnkiNote shape AnkiConnect expects. */
export function draftToNote(
  word: Word,
  deckName: string,
  modelName = "Basic"
): AnkiNote {
  return {
    deckName,
    modelName,
    fields: {
      Front: `${word.writing}<br><br><i>${word.phrase}</i>`,
      Back: `${word.reading}<br>${word.translations}<br><br><i>${word.phraseTranslation}</i>`,
    },
    tags: ["anki-helper"],
    options: {
      allowDuplicate: false,
      duplicateScope: "deck",
    },
  };
}

/**
 * Adds a single accepted card draft to Anki.
 * Call this only after the user has confirmed the draft in the CLI workflow.
 */
export async function addCard(
  draft: Word,
  deckName = process.env.ANKI_DECK ?? 'not set',
  modelName = "Basic"
): Promise<number> {
  await ensureDeckExists(deckName);
  const note = draftToNote(draft, deckName, modelName);
  return invoke<number>("addNote", { note });
}
