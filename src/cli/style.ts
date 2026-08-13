import chalk from 'chalk';
import type { Word } from '../vocab/types.ts';

export function highlightWordInPhrase(word: Word): string {
    const candidates = [
        word.writing,
        word.writing.slice(0, 1),
        word.writing.slice(0, 2),
    ].filter((c) => c.length > 0);

    if (!word.phrase) {
        return "error: source phrase was not populated";
    }

    for (const candidate of candidates) {
        const regex = new RegExp(`(${candidate})`, 'g');
        if (regex.test(word.phrase)) {
            regex.lastIndex = 0;
            return word.phrase.replace(
                regex,
                (match: string) => chalk.magenta(match)
            );
        }
    }
    return word.phrase;
}

export function highlight(text: string): string {
    return chalk.cyan(text);
}
