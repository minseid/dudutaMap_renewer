import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDr7LrmmwqNl2x5pDF3TJB--I6KFC9CE_s",
  authDomain: "dudutamap.firebaseapp.com",
  databaseURL: "https://dudutamap-default-rtdb.firebaseio.com",
  projectId: "dudutamap",
  storageBucket: "dudutamap.firebasestorage.app",
  messagingSenderId: "535034604314",
  appId: "1:535034604314:web:2438f9e8bfc0bc0261daa3",
  measurementId: "G-J60NQDST6C"
};

const app = initializeApp(firebaseConfig);

// Optional: analytics는 브라우저 환경에서만 활성화
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const storage = getStorage(app);
const db = getDatabase(app);

export { app, analytics, storage, db };