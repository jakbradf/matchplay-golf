import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import './index.css'
import App from './App.jsx'

if (Capacitor.isNativePlatform()) {
  // Dark green header needs light (white) status bar icons/text.
  StatusBar.setStyle({ style: Style.Light })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
