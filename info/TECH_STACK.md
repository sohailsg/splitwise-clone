# Tech Stack

## Overview

Splitwise Clone is a **Progressive Web App (PWA)** for bill-splitting and expense tracking, built with modern JavaScript frameworks and Firebase backend.

---

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.2.7 | UI library — component-based architecture |
| **React DOM** | ^19.2.7 | DOM rendering for React |
| **React Router DOM** | ^7.18.1 | Client-side routing (SPA navigation) |
| **Tailwind CSS** | Latest (via `@tailwindcss/vite`) | Utility-first CSS framework |

### Build Tool

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | ^8.1.1 | Dev server, bundler, HMR |
| **@vitejs/plugin-react** | ^6.0.3 | React Fast Refresh for Vite |

### Linting

| Technology | Version | Purpose |
|------------|---------|---------|
| **oxlint** | ^1.71.0 | Fast Rust-based linter for React rules |

---

## Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Firebase** | ^12.15.0 | Backend-as-a-Service platform |

### Firebase Services Used

| Service | Purpose |
|---------|---------|
| **Firebase Authentication** | Email/password sign-up and login |
| **Cloud Firestore** | NoSQL document database — all data storage |

---

## Runtime & Language

| Aspect | Detail |
|--------|--------|
| **Language** | JavaScript (JSX) — no TypeScript in app code |
| **Module System** | ES Modules (`"type": "module"` in package.json) |
| **Runtime** | Browser (client-side only) |
| **Node.js** | Required for dev/build tooling only |

---

## Project Structure

```
splitwise-clone/
├── index.html              # Vite entry HTML
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite config (React + Tailwind plugins)
├── firestore.rules         # Firestore security rules
├── .env                    # Firebase config (VITE_FIREBASE_* env vars)
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── dist/                   # Production build output
│   ├── index.html
│   └── assets/
│       ├── index-{hash}.js
│       └── index-{hash}.css
└── src/
    ├── main.jsx            # React entry point (StrictMode, createRoot)
    ├── App.jsx             # Root component with all routes
    ├── firebase.js         # Firebase initialization + exports
    ├── index.css           # Tailwind import
    ├── contexts/           # React Context (auth state)
    ├── hooks/              # Custom hooks (useAuth)
    ├── utils/              # Business logic utilities
    ├── components/         # Reusable UI components
    └── pages/              # Route-level page components
```

---

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start dev server with HMR |
| `build` | `vite build` | Production build to `dist/` |
| `lint` | `oxlint` | Run linter on source files |
| `preview` | `vite preview` | Preview production build locally |

---

## Environment Variables

Defined in `.env` (loaded via `import.meta.env`):

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase analytics measurement ID |

---

## Key Dependencies

### Production

| Package | Purpose |
|---------|---------|
| `firebase` | Firebase SDK for auth and Firestore |
| `react` | UI framework |
| `react-dom` | React DOM renderer |
| `react-router-dom` | Client-side routing |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@tailwindcss/vite` | Tailwind CSS Vite plugin |
| `@vitejs/plugin-react` | Vite plugin for React |
| `@types/react` | TypeScript types for React (IDE support) |
| `@types/react-dom` | TypeScript types for React DOM |
| `oxlint` | Rust-based linter |
| `vite` | Build tool and dev server |

---

## Deployment

| App | Platform | URL |
|-----|----------|-----|
| Main App | Vercel | https://splitwise-clone-gold.vercel.app |
| Admin Dashboard | Vercel | https://splitwise-admin.vercel.app |

- **CI/CD:** Auto-deploy on push to GitHub (`sohails/splitwise-clone`)
- **PWA:** Service worker + manifest for offline support and home screen install
- **Environment:** Firebase config stored as Vercel environment variables

---

## Architecture Patterns

| Pattern | Implementation |
|---------|---------------|
| **SPA** | Single-page application with client-side routing |
| **Context API** | Auth state management via React Context |
| **Custom Hooks** | `useAuth()` for accessing auth context |
| **Protected Routes** | `ProtectedRoute` component wraps authenticated routes |
| **Component Composition** | Pages compose smaller components |
| **Utility Functions** | Business logic extracted to `utils/` |
| **Firebase Backend** | No custom server — Firebase handles auth, data, security |
