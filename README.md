# ikasiandgo-site

Ikasi &amp; Go: the Basque vocabulary data, the iOS app source, and the web pages for ikasiandgo.com.

## Setup

```
npm install
```

Run this after cloning, and **before opening the Xcode project**. The Capacitor
SPM manifest at `ios/App/CapApp-SPM/Package.swift` references its plugin
packages by relative path inside `node_modules`, so Xcode cannot resolve its
dependencies until the install has run.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server at localhost:5173, with hot reload |
| `npm run build` | Builds the web app into `www/` |
| `npx cap sync ios` | Copies `www/` into `ios/App/App/public` |
| `npm run check-vocab` | Spellchecks every piece of Basque the app ships against Xuxen |
| `npm run check-lessons` | Checks the lesson path against `vocabulary.json`, and the house style |
| `npm run sync-vocab` | Regenerates the seed vocabulary and stamps site counts |
| `npm run preflight` | Everything that should be true before an archive goes to Apple |

`sync-vocab` also runs automatically before `dev` and `build`.

## Before you archive

Run `npm run preflight`. It builds the app, installs it on the newest iOS
simulator runtime you have, launches it, and checks it is still running eight
seconds later. It also checks the scene manifest, the build number, and whether
the staged App Store copy still quotes the right word counts.

Every check in it exists because that exact thing went wrong. Versions 1.1, 1.2
and 1.3 all shipped without a scene manifest and crashed on launch on iOS 27,
for three releases, because nothing ever launched the app on a current iOS. The
simulator that happened to be booted was iOS 26.2, where it ran fine.

`--quick` skips the build and launch when you only want the static checks.

## What check-vocab actually covers

Three places, because for a long time it was one. Headwords and example
sentences in `vocabulary.json`; the 12 stories, which ride in the same file
under `data.stories` and were skipped by a single line of code; and the Basque
subtitle on each lesson, which lives in `src/App.jsx` and so was never seen by
any gate at all. A reject names its source, so you know whether to open the
vocabulary, a story, or a lesson.

Basque words quoted inside the English grammar notes are **not** covered.
Separating them from the English around them is not reliable without marking
them up, and the heuristic version throws hundreds of false flags: English
inflections, the foreign etymology the notes quote on purpose, and bound
suffixes like `-tsu` and `-xka`, which are not words. Check those by hand.

## Before you change a lesson

Run `npm run check-lessons`. The lessons were the one part of the app with no
gate on them. Words go through Xuxen and builds go through preflight, but a
lesson could promise a word it never taught and nothing noticed.

It fails on:

- a word list pointing at a word that is not in `vocabulary.json`
- a free lesson teaching a paid word
- a lesson that sits in no chapter, so it never renders, or in two
- a note that glosses a word no lesson ever teaches
- a note telling the learner they have met a word taught later or not at all
- **a claim about prior knowledge that points at a lesson.** No check can tell
  which lesson a sentence means, so none may name one. Say where the learner
  met the thing instead, which does not go stale when the path is resequenced
- **a note spelling a word differently from its card**, caught by reading the
  parenthetical glosses: a note writing `ordu bat da (it is one o'clock)`
  against a card reading `Ordu bata da` is the lesson teaching a form the app
  does not use
- British spelling or an em dash, anywhere in the shipped English, which means
  the word notes and the stories as well as the lessons

A note may still point forward to a word a later lesson covers, which is
ordinary scaffolding.

The first sweep found nine words that notes explained and no quiz ever used,
including four of the six meal words and `non dago`, which two different
lessons glossed and neither taught. `tools/lesson-allowlist.txt` carries the
cases where a note cites a word to derive a different one, and is currently
empty, because teaching the word has so far always been the better answer.

## When a version goes live

Update `shipped.json` and push. The website advertises the lesson and chapter
counts recorded there, not whatever is on `main`.

That split matters because the two halves of the app reach people differently.
Words and stories travel over the air, so they are live the moment
`vocabulary.json` is published and the site can quote them immediately. Lessons
and chapters are compiled into the binary and exist for nobody until a release
ships. Counting them from `main` is how the site came to promise 50 lessons
while the App Store was still serving 38.

`npm run build` prints a note whenever `main` is ahead of `shipped.json`, so the
gap is visible while you work rather than on the live site.

## How the pieces fit

The Vite root is `appshell/`, which leaves the repo root's `index.html` free to
be the ikasiandgo.com landing page that GitHub Pages serves. The app's source
lives in `src/`, reached through `appshell/main.jsx`.

`vocabulary.json` is the single source of truth for the words. `sync-vocab.js`
regenerates the seed copy inside `src/App.jsx`, mirrors the file into `public/`
and `www/`, and stamps the live counts into `index.html` and `about.html` so
the site never advertises a number that has moved on. The app also fetches
`https://ikasiandgo.com/vocabulary.json` at launch, so corrections reach
installed copies without an App Store release.
