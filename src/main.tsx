/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Check for service worker updates and force hard refresh if a new version is detected
const updateSW = registerSW({
  onNeedRefresh() {
    // A new version is available, hard refresh the page immediately
    updateSW(true);
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
