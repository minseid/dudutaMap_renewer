import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {

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