import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDu3R__EopL-s9SR5EHTh2dKoIbJfjsPgs',
  authDomain: 'dudu-map.firebaseapp.com',
  databaseURL: 'https://dudu-map-default-rtdb.firebaseio.com',
  projectId: 'dudu-map',
  storageBucket: 'dudu-map.firebasestorage.app',
  messagingSenderId: '609154023850',
  appId: '1:609154023850:web:ee444fcf700164b51dabd3',
  measurementId: 'G-4505Z6PW6J',
};

const app = initializeApp(firebaseConfig);

// Optional: analytics는 브라우저 환경에서만 활성화
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const storage = getStorage(app);

export { app, analytics, storage };