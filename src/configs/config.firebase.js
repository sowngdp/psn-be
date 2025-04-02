// Import the functions you need from the SDKs you need
/*
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
*/

'use strict';

require('dotenv').config();

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};
*/

// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.FIREBASE_DATABASE_URL,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.FIREBASE_APP_ID,
//   measurementId: process.env.FIREBASE_MEASUREMENT_ID
// };

/*
const firebaseConfig = {
  apiKey: "AIzaSyBJbLGSxOD7WXrnl8z703XCEea_TNbL7Lg",
  authDomain: "tour-booking-62e68.firebaseapp.com",
  projectId: "tour-booking-62e68",
  storageBucket: "tour-booking-62e68.firebasestorage.app",
  messagingSenderId: "972699415296",
  appId: "1:972699415296:web:ce7b2f21faf4abe5cab9e5",
  measurementId: "G-CHSJBX4N4T"
};
*/

const firebaseConfig = {
  apiKey: "AIzaSyBLMG4Qh98crk72trlnDrcxlm7aZtu8Nqw",
  authDomain: "rare-animals.firebaseapp.com",
  databaseURL: "https://rare-animals-default-rtdb.firebaseio.com",
  projectId: "rare-animals",
  storageBucket: "rare-animals.appspot.com",
  messagingSenderId: "159269615182",
  appId: "1:159269615182:web:e705494cfdf87e0d7bb51f",
  measurementId: "G-TV60MHH5M4",
};

// Initialize Firebase
/*
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
*/

module.exports = firebaseConfig;
