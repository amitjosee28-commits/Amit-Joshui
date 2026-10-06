import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAFGM_fG8LaniWIqQqDA0Lb3B9zlaYzdPI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mitweb-dfec3.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://mitweb-dfec3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mitweb-dfec3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mitweb-dfec3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "798290228395",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:798290228395:web:ccdcc4191102a788b273ee",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ERBS9JLDY9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
