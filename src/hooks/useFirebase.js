// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);