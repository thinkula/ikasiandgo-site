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

`sync-vocab` also runs automatically before `dev` and `build`.

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
