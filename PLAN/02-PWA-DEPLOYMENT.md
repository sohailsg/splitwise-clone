# Phase 1: PWA Deployment ✅ COMPLETE — DEPLOYED

## Goal
Deploy existing React app as a Progressive Web App that works on both
Android and iOS. Users install it from the browser.

## Live URL
https://splitwise-clone-gold.vercel.app

## Steps

### Step 1: Add PWA Meta Tags to index.html
File: `splitwise-clone/index.html`

Add to `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#22c55e" />
<meta name="description" content="Split bills with friends" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Splitwise" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/favicon.svg" />
```

### Step 2: Create manifest.json
File: `splitwise-clone/public/manifest.json` (NEW)

```json
{
  "name": "Splitwise Clone",
  "short_name": "Splitwise",
  "description": "Split bills with friends",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### Step 3: Create Service Worker
File: `splitwise-clone/public/sw.js` (NEW)

```javascript
const CACHE_NAME = 'splitwise-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Firebase API calls - always go to network
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase')) {
    return;
  }

  // Cache-first for static assets
  if (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for navigation
  event.respondWith(
    fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    }).catch(() => {
      return caches.match(request);
    })
  );
});
```

### Step 4: Register Service Worker
File: `splitwise-clone/src/main.jsx`

Add at the end:
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
```

### Step 5: Deploy to Vercel
1. Push code to GitHub repository
2. Go to vercel.com → New Project
3. Import GitHub repo
4. Framework: Vite
5. Root directory: `splitwise-clone`
6. Build command: `npm run build`
7. Output directory: `dist`
8. Add environment variables (all VITE_FIREBASE_* from .env)
9. Deploy

### Step 6: Share with Users
- Share the Vercel URL with 14 users
- Android: Open URL → tap "Add to Home Screen"
- iOS: Open URL → tap Share → "Add to Home Screen"
- App icon appears on home screen, works offline

## Result
- App works on both Android and iOS
- Installable from browser
- Offline support via service worker
- Zero build complexity for updates (push to GitHub = auto-deploy)
