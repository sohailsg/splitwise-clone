# Phase 1: Project Setup + Authentication

## Status: COMPLETE ✓

## Setup Commands
npm create vite@latest splitwise-clone -- --template react
cd splitwise-clone
npm install firebase react-router-dom react-firebase-hooks
npm install -D tailwindcss @tailwindcss/vite

## Files to Create
1. src/firebase.js - Firebase config + init
2. src/contexts/AuthContext.jsx - Auth state provider
3. src/components/ProtectedRoute.jsx - Auth guard
4. src/pages/Signup.jsx - Registration form
5. src/pages/Login.jsx - Login form
6. src/pages/Dashboard.jsx - Placeholder home
7. src/App.jsx - Router with auth routes
8. src/index.css - Tailwind import

## Firebase Console Setup
1. Create project at console.firebase.google.com
2. Enable Authentication > Email/Password
3. Create Firestore Database (test mode)
4. Copy web app config to src/firebase.js

## Auth Flow
App Load -> onAuthStateChanged
  -> No user -> /login page
  -> User logged in -> /dashboard

Signup: createUserWithEmailAndPassword -> save profile to Firestore
Login: signInWithEmailAndPassword
