// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDu3R__EopL-s9SR5EHTh2dKoIbJfjsPgs",
  authDomain: "dudu-map.firebaseapp.com",
  databaseURL: "https://dudu-map-default-rtdb.firebaseio.com",
  projectId: "dudu-map",
  storageBucket: "dudu-map.firebasestorage.app",
  messagingSenderId: "609154023850",
  appId: "1:609154023850:web:ee444fcf700164b51dabd3",
  measurementId: "G-4505Z6PW6J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);