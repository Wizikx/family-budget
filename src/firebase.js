import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCMXzYKMdMrC1Y-P1US5iGT468SYh8DC1g",
  authDomain: "family-budget-f21f1.firebaseapp.com",
  databaseURL: "https://family-budget-f21f1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "family-budget-f21f1",
  storageBucket: "family-budget-f21f1.firebasestorage.app",
  messagingSenderId: "377570587401",
  appId: "1:377570587401:web:0d3c05dcb9429593dad9d8"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Auto sign-in anonymously
signInAnonymously(auth).catch(console.error);
