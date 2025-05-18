// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 
import { getStorage } from 'firebase/storage';  

const firebaseConfig = {
  apiKey: "",
  authDomain: "complaint-app-b089d.firebaseapp.com",
  projectId: "complaint-app-b089d",
  storageBucket: "complaint-app-b089d.appspot.com",
  messagingSenderId: "552149238891",
  appId: "1:552149238891:android:3a26480ac7d6d61b85dd2e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Authentication if needed
export const auth = getAuth(app);
