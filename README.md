# ankichat

A CLI tool for Japanese vocabulary study. You paste in a piece of Japanese text, an LLM extracts the vocabulary from it, and you get quizzed on the readings of each word — a first step toward turning your own reading material into Anki-ready flashcards.

## How it works

1. You enter a Japanese sentence or paragraph at the prompt.
2. The text is sent to an LLM (via an OpenAI-compatible API), which extracts each phrase's vocabulary — word, reading, part of speech, and meaning — as structured JSON, excluding particles.
3. The response is validated against a schema and flattened into a word list.
4. Each word is quizzed one at a time: the source phrase is printed with the target word highlighted, and you're asked to type its reading (hiragana/katakana). Words that are already kana-only (no separate reading) are skipped.

Card creation, dictionary enrichment (e.g. Jisho), and export to Anki are not implemented yet — see [Roadmap](#roadmap).

## Setup

Requires Node.js 24+ (uses Node's native TypeScript support — no build step, no `ts-node`/`tsx`).

```bash
npm install
```

Create a `.env` file in the project root with your LLM API credentials (OpenAI-compatible):

```
LLM_API_KEY=your-api-key
LLM_API_URL=http://127.0.0.1:1234/v1  # or a compatible endpoint
LLM_MODEL=gpt-4o-mini                   # or your preferred model
```

## Usage

```bash
node src/index.ts
```

Enter Japanese text at the `テキスト入力：` prompt. Type `exit` or `q` to quit.

## Project structure

```
src/
  index.ts              Main CLI loop
  ai/
    aiclient.ts          OpenAI-compatible chat client
    prompt.ts            Prompt construction for vocabulary extraction (few-shot, using resources/)
  vocab/
    schema.ts            Zod schema for the extracted vocabulary JSON
    parser.ts            Parses/validates the raw LLM response into VocabularyData
    wordMapper.ts         Flattens phrases into a single Word list
  cli/
    style.ts             Terminal highlighting of the quizzed word within its source phrase
  dev/
    responseLogger.ts    Dev-only: logs each stage's prompt/response to tmp/<stage>/
resources/
  input.json             Example input text used in the extraction few-shot prompt
  vocabulary.json         Example expected output used in the extraction few-shot prompt
```

## Roadmap

Based on the current implementation plan:

1. **Word breakdown** — enrich each word via Jisho, validate against context, quiz kanji reading and meaning.
2. **Card creation** — build Anki cards with the word and source sentence on the front, and reading, translation, sentence translation and an image on the back.
