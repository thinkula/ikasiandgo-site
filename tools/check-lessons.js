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
const { readLessons, readChapters } = require("./lessons");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "src/App.jsx");
const VOCAB = path.join(ROOT, "vocabulary.json");
const ALLOWLIST = path.join(__dirname, "lesson-allowlist.txt");

let fails = 0, warns = 0;
const ok = (m, d) => console.log("  ✓ " + m + (d ? "  " + d : ""));
const warn = (m, d) => { warns++; console.log("  ! " + m + (d ? "  " + d : "")); };
const fail = (m, d) => { fails++; console.log("  ✗ " + m + (d ? "  " + d : "")); };

// "<lesson id>:<word id>" exempts that word in that lesson; a bare "<word id>"
// exempts it everywhere. Keyed on the lesson id, not its number, because the
// numbers move: resequencing the path by level silently invalidated every
// number-keyed entry the first time it was tried.
const allow = fs.existsSync(ALLOWLIST)
  ? new Set(fs.readFileSync(ALLOWLIST, "utf8").split("\n")
      .map(l => l.replace(/#.*/, "").trim()).filter(Boolean))
  : new Set();
const allowed = (id, wid) => allow.has(wid) || allow.has(id + ":" + wid);

/* ------------------------------------------------------------------ parsing */

const vocabData = JSON.parse(fs.readFileSync(VOCAB, "utf8"));
const vocab = vocabData.vocabulary;
const byId = new Map(vocab.map(w => [w.id, w]));

let lessons, chapters;
try {
  lessons = readLessons(APP);
  chapters = readChapters(APP);
} catch (e) {
  console.error("check-lessons: " + e.message);
  process.exit(1);
}

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

  // The lesson list renders chapter by chapter, so a lesson whose num falls in
  // no CHAPTERS range draws no card at all and one in two ranges draws two.
  // Both arrays have been rewritten by hand several times; nothing checked that
  // they still agreed.
  const cover = new Map();
  for (const c of chapters) {
    for (let n = c.from; n <= c.to; n++) {
      if (!cover.has(n)) cover.set(n, []);
      cover.get(n).push(c.n + " " + c.name);
    }
  }
  const missing = lessons.filter(l => !cover.has(l.num));
  const twice = lessons.filter(l => (cover.get(l.num) || []).length > 1);
  const emptyCh = chapters.filter(c => !lessons.some(l => l.num >= c.from && l.num <= c.to));
  if (missing.length) {
    fail("lesson is in no chapter, so it never renders",
      missing.map(l => l.num + " " + l.title).join(", "));
  } else if (twice.length) {
    fail("lesson is in two chapters, so it renders twice",
      twice.map(l => l.num + " " + l.title + " [" + cover.get(l.num).join(" | ") + "]").join(", "));
  } else if (emptyCh.length) {
    fail("chapter contains no lessons", emptyCh.map(c => c.n + " " + c.name).join(", "));
  } else {
    ok("every lesson sits in exactly one of the " + chapters.length + " chapters");
  }
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
      if (allowed(l.id, wid)) continue;

      const where = taughtBy.get(wid) || [];
      if (where.some(t => t.num < l.num)) continue;   // legitimate callback

      // Does the prose gloss it? A parenthetical, or an "X is/means Y" right
      // after the form, is the lesson teaching the word rather than naming it.
      // Check every mention, not just the first: a note often names the word in
      // its heading and glosses it a sentence later. Match on word boundaries,
      // or a longer word containing the form moves the position being read.
      let glossed = false;
      const scan = new RegExp("\\b" + form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
      for (let mm; (mm = scan.exec(prose.toLowerCase())) !== null; ) {
        const after = prose.slice(mm.index + form.length, mm.index + form.length + 40);
        if (/^\s*\(/.test(after) || /^\s+(?:is|means)\b/.test(after)) { glossed = true; break; }
      }

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

  // The word-level test above only fires when the word is taught later or
  // never, so it is blind to the original bug: Counting Past Twenty said "you
  // met hogei in the early numbers lesson" while hogei was taught by Telling
  // Time. An earlier lesson did teach it, so the test passed, and the counting
  // lesson it actually named stops at ten. Verified: restoring that exact
  // sentence still reported clean.
  //
  // There is no way to check which lesson a sentence means. So the rule is
  // simply that a claim about prior knowledge may not point at a lesson, by
  // the word "lesson" or by another lesson's title. Say where the learner met
  // the thing instead ("from the clock"), which cannot go stale when the path
  // is resequenced, as it has been twice.
  const titles = lessons.map(l => l.title).filter(t => t.length > 6);
  let namedClaims = [];
  for (const l of lessons) {
    const prose = [l.blurb, l.intro, l.gtitle, l.gbody].filter(Boolean).join("  ");
    for (const sentence of prose.split(/(?<=\.)\s+/)) {
      if (!CLAIMS_PRIOR.test(sentence)) continue;
      const other = titles.find(t => t !== l.title && sentence.includes(t));
      if (/\blessons?\b/i.test(sentence) || other) {
        namedClaims.push("L" + l.num + " " + l.title + ": points at " +
          (other ? "the lesson \"" + other + "\"" : "a lesson") +
          "\n        “" + sentence.trim() + "”");
      }
    }
  }

  if (falseClaims.length) fail("tells the learner they have met a word they have not",
    "\n      " + falseClaims.join("\n      "));
  else ok("no lesson claims knowledge the learner cannot have");

  if (namedClaims.length) fail("a claim about prior knowledge names a lesson",
    "\n      " + namedClaims.join("\n      "));
  else ok("no claim about prior knowledge points at another lesson");

  if (unreachable.length) fail("glosses a word no lesson ever teaches",
    "\n      " + unreachable.join("\n      "));
  else ok("every word the prose glosses is taught somewhere");

  if (unglossed.length) warn("mentions a word no lesson teaches",
    "\n      " + unglossed.join("\n      "));
  else ok("no lesson mentions an untaught word in passing");
}

/* --------------------------------------- a note's Basque vs the word card */

// Telling Time's note wrote "ordu bat da (it is one o'clock)" while the card
// for that phrase read "Ordu bata da". Both look right in isolation; only
// holding them side by side shows the lesson teaching a form the app does not
// use. Found by hand, so here it is mechanically.
//
// The signal is a parenthetical gloss: when a note writes "<basque> (<english>)"
// and some card carries that English, the Basque in the note should be that
// card's headword. Two things stop this from being noise. A note citing a bare
// root is normal, because the card carries the article and the article can
// double a consonant (haur -> haurra), so a card form that is the cited form
// plus at most two letters is fine. And a gloss often fits a different word
// entirely (a note says "ongi (well)" while the card for "well" is Ondo), so
// only a near miss counts: one edit, or two once the phrase is long enough that
// two unrelated words are unlikely to land that close.
console.log("\ncheck-lessons: notes against the word cards");
{
  const norm = s => String(s).toLowerCase().replace(/[.!?,;:]+$/, "").replace(/\s+/g, " ").trim();
  const byGloss = new Map();
  for (const w of vocab) {
    for (const part of String(w.english).split("/")) {
      const g = norm(part);
      if (!g) continue;
      if (!byGloss.has(g)) byGloss.set(g, []);
      byGloss.get(g).push(w);
    }
  }
  const lev = (a, b) => {
    let prev = [...Array(b.length + 1).keys()];
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  };
  const GLOSSED = /([A-Za-zÀ-ÿñÑ][A-Za-zÀ-ÿñÑ'’-]*(?:\s+[A-Za-zÀ-ÿñÑ][A-Za-zÀ-ÿñÑ'’-]*){0,4})\s*\(([^)]{2,40})\)/g;

  let wrong = [];
  for (const l of lessons) {
    const prose = [l.intro, l.gtitle, l.gbody].filter(Boolean).join("  ");
    for (const m of prose.matchAll(GLOSSED)) {
      const cards = byGloss.get(norm(m[2]));
      if (!cards) continue;
      const words = norm(m[1]).split(" ");
      const suffixes = [];
      for (let k = 1; k <= Math.min(5, words.length); k++) suffixes.push(words.slice(-k).join(" "));
      const forms = cards.map(c => norm(c.basque));
      if (suffixes.some(s => forms.some(f => f === s || (f.startsWith(s) && f.length - s.length <= 2)))) continue;
      let best = null;
      for (const s of suffixes) {
        if (s.length < 4) continue;
        for (const f of forms) {
          const d = lev(s, f), limit = s.length >= 8 ? 2 : 1;
          if (d <= limit && (best === null || d < best.d)) best = { d, s, card: cards[0] };
        }
      }
      if (best) {
        wrong.push("L" + l.num + " " + l.title + ": the note writes “" + best.s +
          " (" + m[2] + ")” but the card " + best.card.id + " reads “" +
          best.card.basque + "”");
      }
    }
  }
  if (wrong.length) fail("a note spells a word differently from its card", "\n      " + wrong.join("\n      "));
  else ok("every glossed phrase matches the card it glosses");
}

/* ------------------------------------------------------------- house style */

// The listing and the lessons are written in US English, and the copy uses no
// em dashes. Both have been fixed by hand twice: once in the 1.5 spelling pass
// (practise, realise, recognise) and again after 47 lessons were written in one
// go and let through labour, theatre, grey, apologising, travelling, memorise
// and neighbour. A rule nobody checks is a rule that drifts.
console.log("\ncheck-lessons: house style");
{
  const BRITISH = [
    [/\btravell(?:ed|ing|er)\b/i, "traveled / traveling / traveler"],
    [/\bcancell(?:ed|ing)\b/i, "canceled / canceling"],
    [/\bmemoris\w*\b/i, "memorize"], [/\bapologis\w*\b/i, "apologize"],
    [/\brecognis\w*\b/i, "recognize"], [/\borganis\w*\b/i, "organize"],
    [/\bpractis\w*\b/i, "practice"], [/\brealis\w*\b/i, "realize"],
    [/\bneighbour\w*\b/i, "neighbor"], [/\blabour\w*\b/i, "labor"],
    [/\bcolour\w*\b/i, "color"], [/\bfavour\w*\b/i, "favor"],
    [/\bhonour\w*\b/i, "honor"], [/\bharbour\w*\b/i, "harbor"],
    [/\btheatre\b/i, "theater"], [/\bcentre\b/i, "center"],
    [/\bgrey\b/i, "gray"], [/\bwhilst\b/i, "while"], [/\bamongst\b/i, "among"],
    [/\blearnt\b/i, "learned"], [/\bspelt\b/i, "spelled"],
  ];
  // Every piece of English the app ships, not just the lesson prose. The word
  // notes are by far the larger body and were carrying memorising and
  // favourably the whole time this read only the 97 lessons.
  const english = [];
  for (const l of lessons) {
    const w = "L" + l.num + " " + l.title;
    english.push([w, "title", l.title], [w, "blurb", l.blurb], [w, "intro", l.intro],
                 [w, "note", l.gtitle + " " + l.gbody]);
  }
  for (const v of vocab) {
    english.push([v.id, "english", v.english], [v.id, "notes", v.notes || ""],
                 [v.id, "example", v.example && v.example.english]);
  }
  for (const st of vocabData.stories || []) {
    english.push([st.id, "story-intro", st.intro || ""], [st.id, "story-title", st.titleEn || ""]);
    for (const line of st.lines || []) english.push([st.id, "story-line", line.tr || ""]);
  }

  let style = [];
  for (const [where, field, text] of english) {
    if (!text) continue;
    for (const [re, want] of BRITISH) {
      const hit = re.exec(text);
      if (hit) style.push(where + " (" + field + "): " + hit[0] + "  ->  " + want);
    }
    if (/—/.test(text)) style.push(where + " (" + field + "): em dash");
  }
  if (style.length) fail("not US English, or uses an em dash", "\n      " + style.join("\n      "));
  else ok("US spelling throughout, no em dashes");
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
