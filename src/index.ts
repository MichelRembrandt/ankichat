import 'dotenv/config';
import { input } from '@inquirer/prompts';
import { splitAndTranslatePhrases } from './prompt.ts';
import type { PhraseSplit } from './vocab/ai/schema.ts';
import { parsePhraseSplit } from './vocab/ai/parser.ts';
import { mapPhrasesToWords } from './vocab/ai/phraseWordMapper.ts';
import { mapInputToWordsDeterministically } from './phrase/mapInputToWords.ts';
import { highlight, highlightWordInPhrase } from './cli/style.ts';
import { logResponse } from './dev/responseLogger.ts';
import { enrichWords } from './vocab/jisho/enrich.ts';
import type { Word } from './vocab/types.ts'
import { checkConnection } from './vocab/anki/connection.ts'
import { addCard } from './vocab/anki/notes.ts';
import { getTokenizer } from './tokenizer/kuromojiTokenizer.ts';
import { promptForImageUrl } from './vocab/image/attach.ts';

async function main() {
  console.log('\n\tアンキチャットへようこそ.「exit」まては「q」で終了します.\n');

  await getTokenizer();

  while (true) {
    
    checkConnection();

    const userPrompt: string = await input({ message: '「入力」：' });

    if (userPrompt.trim().toLowerCase() === 'exit' || userPrompt.trim().toLowerCase() === 'q') {
      console.log('\n\t終了します\n');
      break;
    }
    if (!userPrompt.trim()) continue;

    try {
      console.log('\n\t考え中…');

      let wordBases: Word[];
      if (process.env.DETERMINISTIC_PHRASE_SPLIT_ENABLED === 'true') {
        wordBases = await mapInputToWordsDeterministically(userPrompt);
      } else {
        const response = await splitAndTranslatePhrases(userPrompt);
        const phraseSplit: PhraseSplit = parsePhraseSplit(response);
        logResponse('select-words', userPrompt, phraseSplit);
        wordBases = await mapPhrasesToWords(phraseSplit, userPrompt);
      }

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
        
        const createCard: string = await input({message: 'Add card to anki? 「y/n」:'});
        if (!createCard.trim() || createCard.trim().toLowerCase() === 'y') {
          if (process.env.IMAGE_ATTACH_ENABLED === 'true') {
            word.imageUrl = await promptForImageUrl(word.writing);
          }
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