import { execFile } from "child_process";
import { promisify } from "util";
import { input } from "@inquirer/prompts";
import chalk from "chalk";
import { ImageUrlSchema } from "./schema.ts";
import { buildImageSearchUrl, openInBrowser } from "./browser.ts";

const execFileAsync = promisify(execFile);

const SKIP_KEYWORD = "skip";

async function readClipboard(): Promise<string> {
  const { stdout } = await execFileAsync("pbpaste");
  return stdout.trim();
}

/**
 * Opens a Google Images search for `word`, then prompts the user to copy an
 * image URL onto the clipboard. Re-prompts on invalid clipboard contents.
 * Returns the validated URL, or undefined if the user skips.
 */
export async function promptForImageUrl(word: string): Promise<string | undefined> {
  openInBrowser(buildImageSearchUrl(word));

  while (true) {
    const answer = await input({
      message: `\tClick into the image preview pane (not the thumbnail grid), copy its URL, then press Enter — or type "${SKIP_KEYWORD}" to skip:`,
    });

    if (answer.trim().toLowerCase() === SKIP_KEYWORD) {
      return undefined;
    }

    const clipboard = await readClipboard();
    const result = ImageUrlSchema.safeParse(clipboard);

    if (!result.success) {
      console.log(
        chalk.yellow(
          `\n\tClipboard doesn't look like an image URL: ${result.error.issues[0].message}\n`
        )
      );
      continue;
    }

    return result.data;
  }
}
