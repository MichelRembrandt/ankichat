import chalk from 'chalk';
import { Word } from '../vocab/wordMapper.js';

export function highlightWordInPhrase(word: Word): string {
    const regex = new RegExp(`(${word.word})`, 'g');
    return word.sourcePhrase.replace(
        regex,
        (match : string) => chalk.magenta(match)
    );
}
