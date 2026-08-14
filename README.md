# ankichat

A CLI tool for Japanese vocabulary study. You paste in a piece of Japanese text, an LLM extracts the vocabulary from it, each word is enriched via Jisho, and you get quizzed on the reading and meaning of each word — a first step toward turning your own reading material into Anki-ready flashcards.

## How it works

1. You enter a Japanese sentence or paragraph at the prompt.
2. The text is sent to an LLM (via an OpenAI-compatible API), which extracts each phrase's vocabulary — words in dictionary form, excluding particles — as structured JSON.
3. The response is validated against a schema and flattened into a word list.
4. Each word is looked up on [Jisho](https://jisho.org) to fill in its reading, part of speech, translations, JLPT level, and commonness. Lookups are cached to disk (`.jisho-cache.json`) so repeat words don't hit the API again, and requests are throttled to be polite to the unofficial API.
5. Each word is quizzed one at a time: the source phrase is printed with the target word highlighted, and you're asked to type its reading (skipped if the writing is already kana-only) and then shown its meaning.

Anki card creation and export are not implemented yet — see [Roadmap](#roadmap).

## Setup

Requires Node.js 24+.

```bash
npm install
```

Create a `.env` file in the project root with your LLM API credentials (OpenAI-compatible), based on `.env.template`:

```
LLM_API_KEY=your-api-key
LLM_API_URL=http://127.0.0.1:1234/v1  # or a compatible endpoint
LLM_MODEL=gpt-4o-mini                   # or your preferred model
```

No credentials are needed for Jisho — it's called via its public, unauthenticated API.

## Usage

```bash
npx tsx src/index.ts
```

Enter Japanese text at the `「入力」：` prompt. Type `exit` or `q` to quit.

## Project structure

```
src/
  index.ts                 Main CLI loop
  prompt.ts                Prompt construction for vocabulary extraction (few-shot, using resources/)
  vocab/
    types.ts               Word type shared across the vocab pipeline
    ai/
      aiclient.ts           OpenAI-compatible chat client
      schema.ts             Zod schema for the extracted vocabulary JSON
      parser.ts             Parses/validates the raw LLM response into VocabularyData
      wordMapper.ts          Flattens phrases into a single Word list
    jisho/
      enrich.ts             Looks up each word on Jisho and merges results into Word, using the disk cache
      api.ts                Jisho HTTP client (throttled, retries on 429/5xx)
      match.ts              Picks the best Jisho entry when a lookup returns multiple results
      cache.ts              Reads/writes the .jisho-cache.json lookup cache
      throttle.ts           Rate limiting for the unofficial Jisho API
      types.ts              Jisho API response types
  cli/
    style.ts                Terminal highlighting of the quizzed word within its source phrase
  dev/
    responseLogger.ts       Dev-only: logs each stage's prompt/response to tmp/<stage>/
resources/
  input.json                Example input text used in the extraction few-shot prompt
  vocabshort.json           Example expected output used in the extraction few-shot prompt
  vocabulary.json           Additional example vocabulary output
  jishoexample.json         Example Jisho API response
```

## Roadmap

Based on the current implementation plan:

1. ~~**Word breakdown** — enrich each word via Jisho, validate against context, quiz kanji reading and meaning.~~ Jisho enrichment and quizzing are implemented; context-validated matching (currently a simple common/first-result fallback) is still to be improved.
2. **Card creation** — build Anki cards with the word and source sentence on the front, and reading, translation, sentence translation and an image on the back.
