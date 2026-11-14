import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Everything that can go wrong before this point is handled by the inline
// guard in appshell/index.html, which is installed while the page is parsed.
// This catches the one case the guard cannot wait out: the mount itself
// refusing, with a missing root node or a createRoot that throws. Nothing
// rendered and nothing is going to, so there is no reason to sit out its
// timer.
try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
} catch (e) {
  try { console.error("Ikasi could not mount:", e); } catch (e2) { /* nothing left */ }
  if (window.__ikasiStartupFailed) window.__ikasiStartupFailed()
}
