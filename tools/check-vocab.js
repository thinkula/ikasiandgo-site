#!/usr/bin/env node
/*
 * check-vocab.js
 * --------------
 * Spellchecks every piece of Basque the app ships against Xuxen, the official
 * Basque spellchecker whose Hunspell dictionary is built from Euskaltzaindia
 * (the Basque language academy) normative morphology. That means:
 *
 *   - every headword and example sentence in vocabulary.json
 *   - every line of the 12 stories, which ride in the same file under
 *     data.stories and went unchecked while this read only data.vocabulary
 *   - the Basque subtitle on each lesson, which lives in src/App.jsx and so
 *     was never seen by any gate at all until it was added here
 *
 * What is still not covered: Basque words quoted inside the English grammar
 * notes. There is no reliable way to tell those from English without marking
 * them up, so they are checked by hand.
 *
 * A rejected word-form is a deterministic signal: either a genuine error
 * (a misspelling or non-standard form) or a legitimate token the dictionary
 * does not carry (a place/personal name, an accepted loanword, a solid
 * compound). Legitimate rejects go in tools/vocab-allowlist.txt so the gate
 * stays green; anything else is reported and fails the run.
 *
 *   node tools/check-vocab.js        (or: npm run check-vocab)
 *
 * Requirements:
 *   - hunspell on PATH            (macOS: brew install hunspell)
 *   - the Basque dictionary       (auto-downloaded on first run to
 *                                  tools/.eu-dict/, which is gitignored;
 *                                  GPL-2.0 data, never committed or shipped)
 *
 * Exit codes: 0 = clean (only allowlisted rejects), 1 = unrecognized rejects
 * or a setup problem.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const https = require("https");
const { readLessons } = require("./lessons");

const ROOT = path.resolve(__dirname, "..");
const VOCAB = path.join(ROOT, "vocabulary.json");
const APP = path.join(ROOT, "src/App.jsx");
const DICT_DIR = path.join(__dirname, ".eu-dict");
const DIC = path.join(DICT_DIR, "eu.dic");
const AFF = path.join(DICT_DIR, "eu.aff");
const ALLOWLIST = path.join(__dirname, "vocab-allowlist.txt");
// Xuxen-derived Hunspell dictionary (GPL-2.0), from the wooorm/dictionaries
// distribution which sources it from xuxen.eus.
const SRC = "https://raw.githubusercontent.com/wooorm/dictionaries/main/dictionaries/eu";

function fail(msg) { console.error("check-vocab: " + msg); process.exit(1); }

// ---- ensure hunspell ----
try {
  execFileSync("hunspell", ["--version"], { stdio: "ignore" });
} catch (e) {
  fail("hunspell not found on PATH. Install it (macOS: brew install hunspell) and re-run.");
}

// ---- ensure dictionary (download once) ----
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error("HTTP " + res.statusCode + " for " + url)); return; }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    }).on("error", (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function ensureDict() {
  if (fs.existsSync(DIC) && fs.existsSync(AFF)) return;
  fs.mkdirSync(DICT_DIR, { recursive: true });
  console.log("check-vocab: downloading Basque (Xuxen) dictionary to tools/.eu-dict/ ...");
  try {
    await download(SRC + "/index.dic", DIC);
    await download(SRC + "/index.aff", AFF);
  } catch (e) {
    fail("could not download the dictionary (" + e.message + "). Check your connection and retry.");
  }
}

// ---- tokenize ----
// Split on whitespace, hyphens, and punctuation. Drop empties and any token
// containing a digit (years/numerals and their split artifacts are not
// lexical words to spellcheck).
function tokenize(text) {
  return String(text)
    .split(/[\s.,!?;:()"'«»¿¡\/\-–—]+/)
    .filter((t) => t && !/[0-9]/.test(t));
}

function loadAllowlist() {
  const set = new Set();
  if (!fs.existsSync(ALLOWLIST)) return set;
  for (const line of fs.readFileSync(ALLOWLIST, "utf8").split("\n")) {
    const t = line.split("#")[0].trim();
    if (t) set.add(t.toLowerCase());
  }
  return set;
}

(async function main() {
  await ensureDict();

  const data = JSON.parse(fs.readFileSync(VOCAB, "utf8"));
  const vocab = data.vocabulary;
  const allow = loadAllowlist();

  // token -> Set("field:id") for reporting provenance
  const provenance = new Map();
  const uniq = new Set();
  const take = (field, id, text) => {
    for (const tok of tokenize(text)) {
      uniq.add(tok);
      const key = tok.toLowerCase();
      if (!provenance.has(key)) provenance.set(key, new Set());
      provenance.get(key).add(field + ":" + id);
    }
  };

  for (const w of vocab) {
    take("headword", w.id, w.basque);
    take("example", w.id, w.example.basque);
  }

  // The stories ride in the same file under a different key, and for a long
  // time this check read only data.vocabulary, so 120 lines of Basque went
  // unspellchecked. Each line is an array of [basque, english] pairs.
  const stories = Array.isArray(data.stories) ? data.stories : [];
  for (const s of stories) {
    if (s.title) take("story-title", s.id, s.title);
    for (const line of s.lines || []) {
      for (const pair of line.w || []) take("story", s.id, pair[0]);
    }
  }

  // And the lesson subtitles, which live in src/App.jsx rather than here.
  // Parse failures raise rather than returning nothing: a silent empty list
  // here once meant 97 subtitles stopped being checked while the run still
  // printed "clean".
  let subtitles;
  try {
    subtitles = readLessons(APP).filter(l => l.titleEu).map(l => ({ id: l.id, text: l.titleEu }));
  } catch (e) {
    fail("could not read the lesson subtitles from src/App.jsx: " + e.message);
  }
  for (const l of subtitles) take("lesson", l.id, l.text);

  // run hunspell -l once over all unique tokens
  const res = spawnSync("hunspell", ["-d", path.join(DICT_DIR, "eu"), "-l"],
    { input: [...uniq].join("\n") + "\n", encoding: "utf8" });
  if (res.status !== 0 && res.error) fail("hunspell failed: " + res.error.message);

  // Keep only rejects that trace back to a real token we submitted. Hunspell's
  // internal word-break rules can emit sub-fragments (e.g. "oa" from a hyphen
  // compound) that were never in our input; those have no provenance and are
  // not actionable findings.
  const rejects = [...new Set(res.stdout.split("\n").map((s) => s.trim()).filter(Boolean))]
    .filter((r) => provenance.has(r.toLowerCase()));
  const unknown = rejects.filter((r) => !allow.has(r.toLowerCase()));

  const total = uniq.size;
  const pass = total - rejects.length;
  console.log(
    "check-vocab: " + vocab.length + " entries, " + stories.length + " stories, " +
    subtitles.length + " lesson subtitles.");
  console.log(
    "check-vocab: " + total + " unique word-forms, " +
    pass + " accepted by Xuxen (" + ((pass / total) * 100).toFixed(1) + "%).");
  console.log("check-vocab: " + rejects.length + " rejected, " +
    (rejects.length - unknown.length) + " allowlisted, " + unknown.length + " to review.");

  if (unknown.length === 0) {
    console.log("check-vocab: clean.");
    process.exit(0);
  }

  console.error("\ncheck-vocab: unrecognized rejects (fix the entry, or add to tools/vocab-allowlist.txt if legitimate):");
  for (const r of unknown.sort()) {
    const where = [...(provenance.get(r.toLowerCase()) || [])].join(", ");
    console.error("  " + r + "   [" + where + "]");
  }
  process.exit(1);
})();
