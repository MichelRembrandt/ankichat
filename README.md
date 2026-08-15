# ankichat

A CLI tool for Japanese vocabulary study. You paste in a piece of Japanese text, it's split into phrases and translated by an LLM, each phrase is deterministically tokenized and lemmatized with kuromoji, each resulting word is enriched via Jisho, and you get quizzed on the reading and meaning of each word before optionally saving it as an Anki card via AnkiConnect.

## How it works

1. You enter a Japanese sentence or paragraph at the prompt.
2. The text is sent to an LLM (via an OpenAI-compatible API), whose only job is to split the paragraph into natural phrases/clauses and provide a natural English translation for each — it does not extract words, normalize forms, or decide what's worth studying.
3. The response is validated against a schema. Each returned phrase is checked to be a verbatim substring of the original input; a non-verbatim (hallucinated) phrase fails loudly rather than being silently used.
4. Each phrase is tokenized and lemmatized locally with [kuromoji](https://github.com/takuyaa/kuromoji.js) (IPADIC). Particles, auxiliary verbs, and grammatical function forms (suffix/non-independent parts of speech) are filtered out; every remaining content word becomes a card candidate, in its dictionary form as determined by kuromoji — never invented by the LLM.
5. Each word is looked up on [Jisho](https://jisho.org) to fill in its reading, part of speech, translations, JLPT level, and commonness. Lookups are cached to disk (`.jisho-cache.json`) so repeat words don't hit the API again, and requests are throttled to be polite to the unofficial API.
6. Each word is quizzed one at a time: the source phrase is printed with the target word highlighted, and you're asked to type its reading (skipped if the writing is already kana-only) and then shown its meaning.
7. After each word, you can choose to save it as an Anki card via [AnkiConnect](https://foosoft.net/projects/anki-connect/) — Anki must be running locally with the AnkiConnect add-on installed (add-on code `2055492159`). The target deck (from `ANKI_DECK`) is created automatically if it doesn't exist.

## Setup

Requires Node.js 24+.

```bash
npm install
```

Create a `.env` file in the project root with your LLM API credentials (OpenAI-compatible) and target Anki deck, based on `.env.template`:

```
LLM_API_KEY=your-api-key
LLM_API_URL=http://127.0.0.1:1234/v1  # or a compatible endpoint
LLM_MODEL=gpt-4o-mini                   # or your preferred model
ANKI_DECK=your-deck-name
```

No credentials are needed for Jisho — it's called via its public, unauthenticated API. Anki card creation requires Anki to be running locally with the [AnkiConnect](https://foosoft.net/projects/anki-connect/) add-on installed.

## Usage

```bash
npx tsx src/index.ts
```

Enter Japanese text at the `「入力」：` prompt. Type `exit` or `q` to quit.

## Project structure

```
src/
  index.ts                 Main CLI loop
  prompt.ts                Prompt construction for phrase splitting/translation (few-shot, using resources/)
  tokenizer/
    dictPath.ts             Resolves kuromoji's dictionary path regardless of cwd
    kuromojiTokenizer.ts     Lazily-built, singleton kuromoji tokenizer
    schema.ts                Zod schema for a tokenized/lemmatized Token
    mapToken.ts               Maps kuromoji's raw IpadicFeatures to a validated Token
    filterTokens.ts           Drops particles, auxiliary verbs, and grammatical suffix/non-independent forms
    tokenize.ts                Top-level tokenize + lemmatize entry point, with debug logging
    __tests__/                Regression tests against known kuromoji tokenization edge cases
  vocab/
    types.ts                 Word type shared across the vocab pipeline
    ai/
      aiclient.ts             OpenAI-compatible chat client
      schema.ts                Zod schema for the phrase-split/translation JSON
      parser.ts                 Parses/validates the raw LLM response into PhraseSplit
      extractJson.ts             Strips code fences/surrounding text from raw LLM responses
      phraseWordMapper.ts        Tokenizes each AI-returned phrase and maps its content tokens to Words
    jisho/
      enrich.ts                Looks up each word on Jisho and merges results into Word, using the disk cache
      api.ts                    Jisho HTTP client (throttled, retries on 429/5xx)
      match.ts                  Picks the best Jisho entry when a lookup returns multiple results
      cache.ts                  Reads/writes the .jisho-cache.json lookup cache
      throttle.ts               Rate limiting for the unofficial Jisho API
      types.ts                  Jisho API response types
    anki/
      client.ts                 Thin typed client for the local AnkiConnect HTTP API
      connection.ts              Connection check, deck listing/creation, model field lookup
      notes.ts                   Builds an AnkiConnect note from a Word and adds it to a deck
  cli/
    style.ts                  Terminal highlighting of the quizzed word within its source phrase
  dev/
    responseLogger.ts         Dev-only: logs each stage's prompt/response to tmp/<stage>/
resources/
  input.json                  Example input text used in the phrase-split few-shot prompt
  vocabshort.json              Example expected output used in the phrase-split few-shot prompt
  vocabulary.json               Additional example vocabulary output
  jishoexample.json             Example Jisho API response
```

## Known gaps

- **Potential-form verbs often don't get a Jisho match.** kuromoji's IPADIC dictionary lexicalizes potential-form verbs (e.g. 登れる, "to be able to climb") as their own dictionary entries rather than deriving them from their plain form (登る), and Jisho/JMdict doesn't always index the potential form separately. There's no fallback that retries the lookup against a de-conjugated candidate — doing so reliably would require dictionary-lookup confirmation (a blind suffix rewrite misfires on genuine ichidan verbs that happen to share the same surface pattern, e.g. 忘れる, 疲れる, 現れる), which would mean extending the Jisho lookup/matching layer.
- **The LLM can occasionally return a non-verbatim phrase.** Its only job is splitting the input into phrases and translating them, but it can still drift from the source text (e.g. inserting or dropping a character). This is caught by a boundary check before tokenization — the pipeline fails loudly with a clear error rather than silently tokenizing corrupted text — but there's no automatic retry; the user has to re-enter the input.
- **kuromoji's IPADIC dictionary is static.** It can over/under-segment compounds (e.g. 英訳する splits into 英訳 + する instead of being treated as one verb) and doesn't know modern vocabulary, slang, or many proper nouns.
- **`src/vocab/anki/notes.ts` has a pre-existing, unrelated bug**: it imports `Word` as a value instead of `import type { Word }`, which breaks at runtime under Node's native TypeScript type-stripping. This currently prevents running the CLI end-to-end and predates the tokenizer work above; it wasn't fixed as it falls outside that work's scope.

## Roadmap

Based on the current implementation plan:

1. ~~**Word breakdown** — enrich each word via Jisho, validate against context, quiz kanji reading and meaning.~~ Jisho enrichment and quizzing are implemented; context-validated matching (currently a simple common/first-result fallback) is still to be improved.
2. ~~**Card creation** — build Anki cards with the word and source sentence on the front, and reading, translation, sentence translation and an image on the back.~~ Anki card creation via AnkiConnect is implemented (word, source phrase, reading, translations, phrase translation); an image on the back is not yet implemented.
