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
| `npm run check-vocab` | Validates `vocabulary.json` against Xuxen |
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
