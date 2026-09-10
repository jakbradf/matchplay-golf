# Matchplay Golf PWA

Real-time 4-ball better ball matchplay golf scoring with handicaps.

**Live:** https://matchplay.bradford.no

## Tech Stack

- React 19 + Vite 8
- Firebase Firestore (real-time listeners)
- React Router v7
- vite-plugin-pwa (service worker, installable)
- Capacitor (native iOS/Android shell)
- Plain CSS (no Tailwind)

## Setup

### 1. Firebase Configuration

Edit `src/firebase/config.js` and replace the placeholder values with your Firebase project credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Firebase Firestore Rules

In the Firebase console, set your Firestore security rules. For development/testing:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameCode} {
      allow read, write: if true;
    }
    match /scores/{gameCode}/holes/{hole} {
      allow read, write: if true;
    }
  }
}
```

For production, tighten these rules as needed.

### 3. Development

```bash
npm install
npm run dev
```

### 4. Build & Deploy

```bash
npm run build
npm run deploy   # deploys to GitHub Pages
```

Make sure your GitHub repo has GitHub Pages enabled, pointing to the `gh-pages` branch.

## Native App (iOS / Android via Capacitor)

The app is wrapped with [Capacitor](https://capacitorjs.com) so it can ship as a real iOS/Android
app in addition to the web PWA. The `ios/` and `android/` folders are native projects checked
into this repo — treat them like any other native project (open, build, sign in Xcode / Android
Studio).

```bash
npm run cap:open:ios      # builds a native-flavored bundle, syncs it, opens Xcode (needs macOS)
npm run cap:open:android  # builds a native-flavored bundle, syncs it, opens Android Studio
```

`cap:open:*` always runs `build:native` first, which builds with `CAPACITOR=true` so the
service worker / web manifest (`vite-plugin-pwa`) is skipped — that's web-only and not needed
inside a native shell. If you ever run `npx cap sync` directly, run `npm run build:native`
first so it doesn't pick up a PWA-flavored `dist/`.

**Before your first store submission:**
- `capacitor.config.json`'s `appId` (`no.bradford.matchplay`) becomes the iOS Bundle ID /
  Android package name — it **cannot be changed after you publish**, so confirm it before
  submitting.
- App icons/splash screens aren't generated yet — use
  [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) to generate the full
  icon/splash set from one source image and place them in `ios/App/App/Assets.xcassets` and
  `android/app/src/main/res`.
- **Google Sign-In will not work in the native build as-is.** `signInWithPopup` (used in
  `src/firebase/authService.js`) relies on browser popups, which don't work inside the native
  WebView, and Google blocks OAuth entirely in embedded webviews. To support Google Sign-In
  natively you'll need a native auth plugin (e.g. `@capacitor-firebase/authentication`) plus
  `GoogleService-Info.plist` (iOS) / `google-services.json` (Android) from the Firebase console
  and matching OAuth client IDs — none of that is wired up yet.
- Apple Developer Program ($99/yr) + App Store Connect record for iOS; Google Play Console
  ($25 one-time) for Android. Both require a privacy policy URL, screenshots, and a completed
  data-safety/privacy questionnaire (this app stores game/user data in Firestore).
- iOS builds require a Mac with Xcode — Capacitor doesn't remove that requirement.

## Features

- **4-ball better ball** matchplay with handicap stroke allocation
- **Real-time scoring** — all players see updates instantly via Firestore
- **Par 3 closest to pin** bonus point system
- **Running match score** displayed live
- **Full scorecard** with gross/net scores and hole-by-hole results
- **PWA** — installable on iOS/Android, works offline for static assets
- **Mobile-first** design with large touch targets

## Game Flow

1. Creator starts a game at `/create` → gets a 6-character game code
2. Other players join at `/join` using the code
3. Creator starts the game from the lobby
4. Scorer enters hole-by-hole scores
5. All players see the live scorecard and match status
6. Finish game on hole 18 → results page

## Scoring Rules

- Handicap strokes: player receives 1 stroke on holes where `strokeIndex ≤ handicap`
- For handicaps > 18: player receives 2 strokes on holes where `strokeIndex ≤ (handicap - 18)`
- Best net score per team wins the hole
- Par 3 closest to pin: bonus point if closest team also wins the hole; hole halved if different teams
- Tied net scores on par 3 with closest: 1 point for closest team

## Project Structure

```
src/
  components/     Reusable UI components
  data/           Course data (Strömstads GK)
  firebase/       Firestore config + service functions
  hooks/          useGame real-time hook
  pages/          Route-level page components
  utils/          Scoring logic + game code generator
```
