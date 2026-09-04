// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAOZnxtCoDaeL8_W0z2lIRSQu4lXBPl5OE",
  authDomain: "ptrenapsi.firebaseapp.com",
  projectId: "ptrenapsi",
  storageBucket: "ptrenapsi.firebasestorage.app",
  messagingSenderId: "1009359187333",
  appId: "1:1009359187333:web:b4d1a4428e6a403bc428ec",
  measurementId: "G-KWV9LSEE3X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
