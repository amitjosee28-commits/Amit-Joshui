import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAFGM_fG8LaniWIqQqDA0Lb3B9zlaYzdPI",
  authDomain: "mitweb-dfec3.firebaseapp.com",
  databaseURL: "https://mitweb-dfec3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mitweb-dfec3",
  storageBucket: "mitweb-dfec3.firebasestorage.app",
  messagingSenderId: "798290228395",
  appId: "1:798290228395:web:ccdcc4191102a788b273ee",
  measurementId: "G-ERBS9JLDY9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
