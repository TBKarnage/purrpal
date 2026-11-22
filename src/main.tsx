import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Register Service Worker for offline play on iPadOS 17 Home Screen PWA
registerSW({ immediate: true })

// Request persistent storage so iPadOS Safari does not evict save data after inactivity
if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {
    // Non-fatal in unsupported browsers or private mode
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
