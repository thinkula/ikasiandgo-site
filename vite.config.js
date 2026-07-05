import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// The app's HTML entry lives in appshell/ so that the repo root's
// index.html can be the ikasiandgo.com landing page (GitHub Pages
// serves the repo root). The built app still outputs to www/ for
// Capacitor.
export default defineConfig({
  root: 'appshell',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'www'),
    // Wipe www/ on every build: prevents dead hashed bundles accumulating.
    // Safe because publicDir (vocabulary.json, fonts) is re-copied each build
    // and the prebuild hook keeps public/vocabulary.json current.
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  publicDir: resolve(__dirname, 'public'),
})
