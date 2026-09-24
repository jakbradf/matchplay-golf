import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Native app shells (Capacitor) don't need a service worker or web manifest —
// that plugin is only for the browser-hosted PWA build.
const isCapacitorBuild = process.env.CAPACITOR === 'true';

export default defineConfig({
  base: '/',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // The native build has no VitePWA plugin (see below), so this virtual
      // module doesn't exist for it to resolve. main.jsx only ever imports
      // it behind a Capacitor.isNativePlatform() check, so it's never
      // actually requested at runtime in the native shell — externalizing
      // it here just lets the native build finish instead of failing to
      // resolve a module it will never load.
      external: isCapacitorBuild ? ['virtual:pwa-register'] : [],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase';
          if (id.includes('node_modules/react-router')) return 'router';
        },
      },
    },
  },
  plugins: [
    react(),
    !isCapacitorBuild && VitePWA({
      registerType: 'autoUpdate',
      // We call registerSW() ourselves in main.jsx (with an auto-reload-once
      // on activation) instead of relying on the plugin's bare injected
      // script, which just calls navigator.serviceWorker.register() with no
      // update/reload logic — so deployed updates weren't reaching anyone
      // who already had the app open or installed.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Golf Match',
        short_name: 'Golf Match',
        description: 'Real-time matchplay golf scoring with handicaps',
        theme_color: '#00a651',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Bake activation directly into the generated sw.js instead of only
        // reacting to a postMessage — registerType: 'autoUpdate' alone does
        // NOT make the worker skip waiting on its own (its message listener
        // only fires skipWaiting() when told to), so a worker that finished
        // installing while a tab was already open could sit in 'waiting'
        // indefinitely. main.jsx also nudges any such worker directly, as a
        // migration path for clients still running an older bundle that
        // predates this.
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ]
})
