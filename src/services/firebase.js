// Firebase App Initialization — MedTrack AI
// Uses Vite environment variables (VITE_FIREBASE_*)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config at startup (helpful for debugging missing env vars)
const missingVars = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => `VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

if (missingVars.length > 0) {
  console.error(
    '[MedTrack AI] Missing Firebase environment variables:\n',
    missingVars.join('\n'),
    '\n\nCopy .env.example → .env and fill in your Firebase project values.'
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;
