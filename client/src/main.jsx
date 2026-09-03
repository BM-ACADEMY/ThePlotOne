import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA — auto-reload the page once a new
// version activates so users always land on the latest build without
// needing to manually clear cache/unregister the service worker.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000) // check for a new version hourly
  },
  onNeedReload() {
    window.location.reload()
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <App />
  </StrictMode>,
)
