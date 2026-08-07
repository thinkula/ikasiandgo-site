# tools/

## check-vocab.js — Basque spelling gate

Validates every headword and example sentence in `vocabulary.json` against
**Xuxen**, the official Basque spellchecker. Its Hunspell dictionary is built
by IXA/UZEI from **Euskaltzaindia** (the Basque language academy) normative
morphology, so a rejected word-form is an authoritative signal that a form is
not standard Basque.

```bash
npm run check-vocab
```

- **Exit 0** — every word-form is either accepted by Xuxen or listed in
  `vocab-allowlist.txt`.
- **Exit 1** — one or more word-forms are neither. Each is printed with the
  entry it came from. Fix the entry, or, if the form is legitimate (a place or
  personal name, an accepted loanword, a solid compound), add it to
  `vocab-allowlist.txt` with a short note.

Run it after any change to `vocabulary.json` and before shipping a vocab update.
It pairs with `sync-vocab.js`: edit `vocabulary.json`, `npm run check-vocab`,
then build (the prebuild hook runs `sync-vocab.js`).

### Requirements

- **hunspell** on PATH — macOS: `brew install hunspell`
- The Basque dictionary is **downloaded automatically** on first run to
  `tools/.eu-dict/` (gitignored). It is GPL-2.0 data, so it is never committed
  to this repo or shipped in the app — only fetched locally for QA.

### Notes

- The tokenizer drops digits (years, numerals) and splits hyphenated compounds,
  and it ignores Hunspell word-break fragments that don't trace to a real token,
  so the reject list contains only actionable findings.
- This is a QA gate, not a build step: it needs network + hunspell and its
  reject list can include legitimate names, so it is intentionally not wired
  into `prebuild`.
