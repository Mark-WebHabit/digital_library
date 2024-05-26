// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBP462VtR_cOm9mBWTFc40ym2ZEQLTlqSc",
  authDomain: "caps-cba13.firebaseapp.com",
  projectId: "caps-cba13",
  storageBucket: "caps-cba13.appspot.com",
  messagingSenderId: "438096022702",
  appId: "1:438096022702:web:f5d447ed4287fc2940713f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
