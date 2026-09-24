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
// through the app store instead).
//
// registerType: 'autoUpdate' does NOT make the generated service worker
// skip waiting on its own — the sw.js it produces only calls skipWaiting()
// when it receives a {type:'SKIP_WAITING'} postMessage. vite-plugin-pwa's
// own registerSW() only sends that message in reaction to an 'installed'/
// 'waiting' event fired *during this page load*; a worker that was already
// sitting in the waiting state from an earlier visit (e.g. a tab that's
// been open across several deploys) is never nudged, so it can stay stuck
// there indefinitely while everyone keeps running the old cached JS. We
// message any pre-existing waiting worker ourselves on load, and do the
// same for every future install, as a belt-and-suspenders on top of
// registerSW()'s own handling.
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const skipWaitingIfAny = (registration) => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  navigator.serviceWorker.getRegistration().then((registration) => {
    if (!registration) return;
    skipWaitingIfAny(registration);
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') skipWaitingIfAny(registration);
      });
    });
  }).catch(() => {});

  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        skipWaitingIfAny(registration);
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
