import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = { //got this from firebase itself
  apiKey: "AIzaSyDVacSBZgKaCcNHh3d1L2nZNWJPlmsEdPk",
  authDomain: "king-of-audio.firebaseapp.com",
  projectId: "king-of-audio",
  storageBucket: "king-of-audio.firebasestorage.app",
  messagingSenderId: "771588287532",
  appId: "1:771588287532:web:9610226c39ac9b1b26f589",
  measurementId: "G-WBPFSES26Y",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth }; //exported to main.tsx file
