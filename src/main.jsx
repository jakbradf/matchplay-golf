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

// Register the service worker ourselves so updates actually reach open tabs
// and installed home-screen icons (web build only — native app shells update
// through the app store instead). registerType: 'autoUpdate' makes the
// generated service worker skip waiting and claim clients as soon as a new
// version activates; this reload-once-on-takeover is what makes that
// visible instead of leaving the old JS running until the user thinks to
// force-refresh.
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    registerSW({
      immediate: true,
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        // Also poll for updates while the app stays open in the background.
        setInterval(() => registration.update(), 30 * 60 * 1000);
      },
      onRegisterError(err) {
        // Non-fatal — the app works fine without a service worker, it just
        // won't have offline caching or auto-updates for this session.
        console.warn('Service worker registration failed:', err);
      },
    });
  }).catch((err) => {
    console.warn('Could not load service worker registration module:', err);
  });
}
