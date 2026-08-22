import chalk from "chalk";
import type { Word } from "../types.ts";
import { invoke } from "./client.ts";
import { ensureDeckExists } from "./connection.ts";
import { checkImageReachable } from "../image/reachability.ts";
import { logResponse } from "../../dev/responseLogger.ts";

export interface AnkiNotePicture {
  url: string;
  filename: string;
  fields: string[];
}

export interface AnkiNote {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
  options?: {
    allowDuplicate?: boolean;
    duplicateScope?: string;
  };
  picture?: AnkiNotePicture[];
}

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif)$/i;

/** Extracts the image extension from a validated image URL (falls back to jpg). */
function getImageExtension(url: string): string {
  const match = new URL(url).pathname.match(IMAGE_EXTENSION_PATTERN);
  return match ? match[1].toLowerCase() : "jpg";
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
      Back: `${word.reading}<br>${word.translations}<br><br><i>${word.phraseTranslation}</i><br><br>`,
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

  if (draft.imageUrl) {
    const check = await checkImageReachable(draft.imageUrl);
    if (check.reachable) {
      const filename = `${draft.writing}-${Date.now()}.${getImageExtension(draft.imageUrl)}`;
      note.picture = [{ url: draft.imageUrl, filename, fields: ["Back"] }];
    } else {
      console.log(
        chalk.yellow(
          `\n\tImage for "${draft.writing}" could not be attached (${check.detail}). Creating card without it.\n`
        )
      );
      await logResponse("image-attach", draft.writing, {
        imageUrl: draft.imageUrl,
        ...check,
      });
    }
  }

  return invoke<number>("addNote", { note });
}
