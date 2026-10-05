// Entry shim. The Vite root is appshell/ so that the repo root's index.html
// can stay the ikasiandgo.com landing page, but the app's real source lives in
// ../src. An HTML <script src> pointing outside the root is not rewritten by
// the dev server, so the browser asks for /src/main.jsx, gets the SPA fallback
// HTML back, and the page renders blank. A module import is resolved on the
// filesystem instead of by URL, so going through this file works in both
// `vite` and `vite build`.
import '../src/main.jsx'
