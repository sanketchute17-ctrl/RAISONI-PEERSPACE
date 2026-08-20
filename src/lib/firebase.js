import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read Firebase config from environment or fallback to demo config to prevent white screen crash
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAbbqBQoEsaBo9wt7j8yu52Muw94BCuBRA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "peerspace-hackathon.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "peerspace-hackathon",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "peerspace-hackathon.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "245486818342",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:245486818342:web:0dc523ad4e3b9d741cc2e7"
};

let app;
let auth;
let db;
let storage;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase initialization warning:", error);
}

export { auth, db, storage };

