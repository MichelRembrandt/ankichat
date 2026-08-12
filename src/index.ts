import 'dotenv/config';
import { input } from '@inquirer/prompts';
import { extractVocab } from './ai/prompt.js';
import { VocabularyData } from './vocab/schema.js';
import { parseVocabulary } from './vocab/parser.js';



async function main() {
  console.log('アンキチャットへようこそ.「exit」まては「q」で終了します.\nEnter text to start Anki card creation...');

  while (true) {
    const userPrompt : string = await input({ message: 'テキスト入力：' });

    if (userPrompt.toLowerCase() === 'exit' || userPrompt.toLowerCase() === 'q') {
      console.log('終了します');
      break;
    }

    if (!userPrompt.trim()) continue;

    try {
        console.log('\n考え中…')

        const response : string = await extractVocab(userPrompt);
        const extractedVocab : VocabularyData = parseVocabulary(response, "AI response");

        
        
        // const words : Word[] = ...

//  prompt AI
// enrich with jisho

        // console.log('\nVocab quiz:')

        // const extractedWords = await ... flatmap of words

        // const readingAnswer = await input({ message: '「読み」：'});

        // if (readingAnswer)


        // const meaningAnswer = await input({ message: '「意味」：'});


        // 1: AI defines words that could be interesting
        //      verbs, nouns, etc. (anything that is not a particle or character name)
        //      words that are new (implement with Get from Anki)
        //      limit to ... new words per session
        //      display input text color coded with selected words and prompt for continu (add option to prompt AI to finetune selection)

        // 2: Break down of words one by one
        //      Retrieve word info for Jisho, validate against context, add own translation if needed (with disclaimer)
        //      漢字? Quiz ひらがな
        //      Quiz meaning
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
        console.error(`\n Error:${error.message}\n`);
    }
  }
}

main();