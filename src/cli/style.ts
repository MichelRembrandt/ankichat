import chalk from 'chalk';
import type { Word } from '../vocab/wordMapper.ts';

export function highlightWordInPhrase(word: Word): string {
    const candidates = [
        word.word,
        word.word.slice(0, 1),
        word.word.slice(0, 2),
    ].filter((c) => c.length > 0);

    for (const candidate of candidates) {
        const regex = new RegExp(`(${candidate})`, 'g');
        if (regex.test(word.sourcePhrase)) {
            regex.lastIndex = 0;
            return word.sourcePhrase.replace(
                regex,
                (match: string) => chalk.magenta(match)
            );
        }
    }
    return word.sourcePhrase;
}
