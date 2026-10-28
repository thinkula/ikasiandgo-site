#!/usr/bin/env node
/*
 * check-lessons.js
 * ----------------
 * Checks the guided lesson path in src/App.jsx against vocabulary.json.
 *
 * The lessons are the one part of the app with no other gate on them. Words go
 * through Xuxen (check-vocab) and the build goes through preflight, but a
 * lesson can promise a word it never teaches, explain a rule for a word that
 * is not in its own quiz, or tell the learner they have already met something
 * they have not, and nothing notices.
 *
 * Every check here exists because that exact thing was found in a real lesson:
 *
 *   - Counting Past Twenty said "you met hogei in the early numbers lesson".
 *     hogei is taught by Telling Time, and the counting lesson stops at ten.
 *   - Food and Drink laid out all six meal words, nouns and verbs, and four of
 *     them were taught by no lesson at all.
 *   - Getting Around built its whole question pattern on non dago, which was
 *     glossed in two different lessons and quizzed in neither.
 *   - Telling Time's note wrote "ordu bat da" while the word card for that
 *     same phrase read "Ordu bata da".
 *
 * The distinction that matters: a note may point FORWARD to a word that a
 * later lesson teaches, which is ordinary scaffolding. What it may not do is
 * gloss a word that no lesson ever teaches, or claim the learner has already
 * met one they could not have.
 *
 *   node tools/check-lessons.js        (or: npm run check-lessons)
 *
 * Accepted exceptions live in tools/lesson-allowlist.txt, one id per line.
 * Exit codes: 0 = clean, 1 = failures.
 */

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "src/App.jsx");
const VOCAB = path.join(ROOT, "vocabulary.json");
const ALLOWLIST = path.join(__dirname, "lesson-allowlist.txt");

let fails = 0, warns = 0;
const ok = (m, d) => console.log("  ✓ " + m + (d ? "  " + d : ""));
const warn = (m, d) => { warns++; console.log("  ! " + m + (d ? "  " + d : "")); };
const fail = (m, d) => { fails++; console.log("  ✗ " + m + (d ? "  " + d : "")); };

// "<lesson number>:<word id>" exempts that word in that lesson; a bare
// "<word id>" exempts it everywhere.
const allow = fs.existsSync(ALLOWLIST)
  ? new Set(fs.readFileSync(ALLOWLIST, "utf8").split("\n")
      .map(l => l.replace(/#.*/, "").trim()).filter(Boolean))
  : new Set();
const allowed = (num, wid) => allow.has(wid) || allow.has(num + ":" + wid);

/* ------------------------------------------------------------------ parsing */

const src = fs.readFileSync(APP, "utf8");
const vocab = JSON.parse(fs.readFileSync(VOCAB, "utf8")).vocabulary;
const byId = new Map(vocab.map(w => [w.id, w]));

const open = /\n(?:var|const) LESSONS\s*=\s*\[/.exec(src);
if (!open) { console.error("check-lessons: could not find the LESSONS array"); process.exit(1); }
let depth = 1, i = open.index + open[0].length;
const from = i;
while (depth) {
  if (src[i] === "[") depth++;
  else if (src[i] === "]") depth--;
  i++;
}
const block = src.slice(from, i - 1);

const unesc = s => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
                    .replace(/\\(.)/g, "$1");
const field = (chunk, name) => {
  const m = new RegExp("\\b" + name + ':"((?:[^"\\\\]|\\\\.)*)"').exec(chunk);
  return m ? unesc(m[1]) : "";
};

const lessons = [];
for (const chunk of block.split(/\n\s*\{\s*\n(?=\s*id:")/)) {
  if (!/id:"l\d+_/.test(chunk)) continue;
  const g = /grammar:\{title:"((?:[^"\\]|\\.)*)",body:"((?:[^"\\]|\\.)*)"\}/.exec(chunk);
  const w = /wordIds:\[([^\]]*)\]/.exec(chunk);
  lessons.push({
    id: /id:"(l\d+_\w+)"/.exec(chunk)[1],
    num: parseInt(/num:(\d+)/.exec(chunk)[1], 10),
    pro: /pro:true/.test(chunk),
    title: field(chunk, "title"),
    blurb: field(chunk, "blurb"),
    intro: field(chunk, "intro"),
    gtitle: g ? unesc(g[1]) : "",
    gbody: g ? unesc(g[2]) : "",
    wordIds: w ? (w[1].match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1)) : [],
  });
}
lessons.sort((a, b) => a.num - b.num);

const taughtBy = new Map();
for (const l of lessons) for (const w of l.wordIds) {
  if (!taughtBy.has(w)) taughtBy.set(w, []);
  taughtBy.get(w).push(l);
}

console.log("check-lessons: " + lessons.length + " lessons, " + vocab.length + " words");

/* --------------------------------------------------- the path's own skeleton */

console.log("\ncheck-lessons: the path");
{
  const nums = lessons.map(l => l.num);
  const want = Array.from({ length: lessons.length }, (_, k) => k + 1);
  if (String(nums) !== String(want)) fail("lesson numbers are not 1.." + lessons.length, String(nums));
  else ok("lesson numbers run 1.." + lessons.length + " with no gaps");

  const ids = lessons.map(l => l.id);
  const dupIds = ids.filter((x, k) => ids.indexOf(x) !== k);
  if (dupIds.length) fail("duplicate lesson ids", dupIds.join(", "));
  else ok("lesson ids unique");

  const empty = lessons.filter(l => !l.wordIds.length);
  if (empty.length) fail("lesson teaches nothing", empty.map(l => l.num + " " + l.title).join(", "));
  else ok("every lesson teaches at least one word");
}

/* ------------------------------------------------- word lists vs vocabulary */

console.log("\ncheck-lessons: word lists");
{
  let broken = [];
  for (const l of lessons) for (const w of l.wordIds) {
    if (!byId.has(w)) broken.push("L" + l.num + " " + w);
  }
  if (broken.length) fail("teaches a word that is not in vocabulary.json", broken.join(", "));
  else ok("every taught word exists in vocabulary.json");

  // The free tier is the whole A1 level. A free lesson that teaches anything
  // above it shows a locked word to someone who cannot open it.
  let leaks = [];
  for (const l of lessons) {
    if (l.pro) continue;
    for (const w of l.wordIds) {
      const v = byId.get(w);
      if (v && v.cefr !== "A1") leaks.push("L" + l.num + " " + w + " (" + v.cefr + ")");
    }
  }
  if (leaks.length) fail("free lesson teaches words outside the free tier", leaks.join(", "));
  else ok("no free lesson teaches a paid word");

  const dups = [...taughtBy].filter(([, ls]) => ls.length > 1);
  if (dups.length) {
    ok("words taught by more than one lesson", dups.length + " (allowed; reinforcement)");
    for (const [w, ls] of dups) {
      console.log("      " + w + ": " + ls.map(l => l.num + " " + l.title).join(", "));
    }
  } else ok("no word taught twice");
}

/* ------------------------------- prose that teaches what the quiz cannot reach */

console.log("\ncheck-lessons: what the prose promises");
{
  // Longest forms first so a phrase wins over the words inside it.
  const forms = vocab
    .map(w => [w.basque.replace(/[?!.…]+$/, "").trim().toLowerCase(), w.id])
    .filter(([f]) => f.length >= 3)
    .sort((a, b) => b[0].length - a[0].length);

  const CLAIMS_PRIOR = /\byou (?:met|already know|have met|learned|saw)\b|\bremember (?:from|that)\b|\bearlier lesson\b|\bfirst \w+ lesson\b/i;

  let unreachable = [], falseClaims = [], unglossed = [];

  for (const l of lessons) {
    const prose = [l.blurb, l.intro, l.gtitle, l.gbody].filter(Boolean).join("  ");
    if (!prose) continue;
    let left = prose.toLowerCase();

    for (const [form, wid] of forms) {
      const re = new RegExp("\\b" + form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
      if (!re.test(left)) continue;
      left = left.replace(new RegExp(re.source, "g"), " ");
      if (l.wordIds.includes(wid)) continue;
      if (allowed(l.num, wid)) continue;

      const where = taughtBy.get(wid) || [];
      if (where.some(t => t.num < l.num)) continue;   // legitimate callback

      // Does the prose gloss it? A parenthetical or an "X is/means Y" right
      // after the form is the lesson teaching the word, not mentioning it.
      const at = prose.toLowerCase().indexOf(form);
      const after = prose.slice(at + form.length, at + form.length + 40);
      const glossed = /^\s*\(/.test(after) || /^\s+(?:is|means)\b/.test(after);

      if (!where.length) {
        (glossed ? unreachable : unglossed).push("L" + l.num + " " + l.title + ": " + form + " (" + wid + ")");
      }
      // glossed + taught later is ordinary scaffolding, so nothing to say.

      const sentence = (prose.match(new RegExp("[^.]*\\b" + form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b[^.]*\\.", "i")) || [""])[0];
      if (CLAIMS_PRIOR.test(sentence)) {
        falseClaims.push("L" + l.num + " " + l.title + ": " + form +
          (where.length ? " is taught later, in L" + where[0].num + " " + where[0].title
                        : " is taught by no lesson") + "\n        “" + sentence.trim() + "”");
      }
    }
  }

  if (falseClaims.length) fail("tells the learner they have met a word they have not",
    "\n      " + falseClaims.join("\n      "));
  else ok("no lesson claims knowledge the learner cannot have");

  if (unreachable.length) fail("glosses a word no lesson ever teaches",
    "\n      " + unreachable.join("\n      "));
  else ok("every word the prose glosses is taught somewhere");

  if (unglossed.length) warn("mentions a word no lesson teaches",
    "\n      " + unglossed.join("\n      "));
  else ok("no lesson mentions an untaught word in passing");
}

/* -------------------------------------------- runs the curriculum should cover */

console.log("\ncheck-lessons: ordered runs");
{
  const RUNS = {
    "numbers 1-20": "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(" "),
    "months": "january february march april may june july august september october november december".split(" "),
    "days": "monday tuesday wednesday thursday friday saturday sunday".split(" "),
  };
  const taughtEnglish = new Set();
  for (const w of taughtBy.keys()) {
    const v = byId.get(w);
    if (v) taughtEnglish.add(v.english.trim().toLowerCase());
  }
  for (const [name, order] of Object.entries(RUNS)) {
    const missing = order.filter(e => !taughtEnglish.has(e));
    if (missing.length) warn(name + " is incomplete across the whole path", "missing " + missing.join(", "));
    else ok(name + " fully covered");
  }
}

/* ------------------------------------------------------------------ coverage */

console.log("\ncheck-lessons: coverage");
{
  const orphans = vocab.filter(w => !taughtBy.has(w.id));
  const pct = Math.round((vocab.length - orphans.length) / vocab.length * 100);
  console.log("  " + (vocab.length - orphans.length) + " of " + vocab.length +
    " words are taught by a lesson (" + pct + "%)");
  const byLevel = {};
  for (const w of orphans) byLevel[w.cefr] = (byLevel[w.cefr] || 0) + 1;
  console.log("  untaught by level: " +
    Object.keys(byLevel).sort().map(k => k + " " + byLevel[k]).join(", "));
}

console.log("\ncheck-lessons: " + (fails ? fails + " failures, " : "clean, ") + warns + " warnings.");
process.exit(fails ? 1 : 0);
