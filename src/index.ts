import 'dotenv/config';
import { input } from '@inquirer/prompts';
import { extractVocab } from './prompt.ts';
import type { VocabularyData } from './vocab/ai/schema.ts';
import { parseVocabulary } from './vocab/ai/parser.ts';
import { mapToWords } from './vocab/ai/wordMapper.ts';
import { highlight, highlightWordInPhrase } from './cli/style.ts';
import { logResponse } from './dev/responseLogger.ts';
import { enrichWords } from './vocab/jisho/enrich.ts';
import type { Word } from './vocab/types.ts'
import { checkConnection } from './vocab/anki/connection.ts'
import { addCard } from './vocab/anki/notes.ts';

async function main() {
  console.log('\n\tアンキチャットへようこそ.「exit」まては「q」で終了します.');

  while (true) {
    
    checkConnection();

    const userPrompt: string = await input({ message: '\n「入力」：' });

    if (userPrompt.toLowerCase() === 'exit' || userPrompt.toLowerCase() === 'q') {
      console.log('\n\t終了します\n');
      break;
    }
    if (!userPrompt.trim()) continue;

    try {
      console.log('\n\t考え中…');

      const response: string = await extractVocab(userPrompt);
      const extractedVocab: VocabularyData = parseVocabulary(response);
      logResponse('select-words', userPrompt, extractedVocab);
      const wordBases: Word[] = mapToWords(extractedVocab);

      console.log('\t処理中…')

      const words: Word[] = await enrichWords(wordBases);
      logResponse('card-draft', userPrompt, words);

      console.log('\n\t語彙クイズを始めます!');

      for (const word of words) {
        console.log('\n\t' + highlightWordInPhrase(word) + '\n');
        if (!word.phrase?.includes(word.writing)) {
          console.log('\t- ' + highlight(word.writing) + ' -\n')
        }

        if (word.writing !== word.reading) {
          const readingAnswer: string = await input({ message: '「読み」：' });

          if (readingAnswer === word.reading) {
            console.log('\n\t〇！\n');
          } else {
            console.log('\n\tX!\t読みは：「' + word.reading + '」\n');
          }
        }

        await input({message: '「意味」：'});
        console.log('\n\t意味は： ' + word.translations + '\n');
        
        console.log('Add card to anki? (y/n)');
        const createCard: string = await input({message: '「add?」；'});
        if (createCard.toLowerCase() === 'y') {
          await addCard(word);
        }
      }

      // 1: AI defines words that could be interesting
      //      words that are new (implement with Get from Anki)

      // 2: Break down of words one by one
      //      Ask: create anki card

      // 3: Card creation

      //      Front:
      //          Word
      //          Sentence from input

      //      Back:
      //          Hiragana
      //          Jisho translation of word
      //          AI translation of whole sentence
      //          (Jisho audio)
      //          First hit from duck duck go image search

    } catch (error: any) {
      console.error(`\n\tError:${error.message}\n`);
    }
  }
}

main();