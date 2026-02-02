import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvkzbzyMLAE8daV_m76b8AI9WtwUsgpNY",
  authDomain: "aabhira-fashion-8c18f.firebaseapp.com",
  databaseURL: "https://aabhira-fashion-8c18f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aabhira-fashion-8c18f",
  storageBucket: "aabhira-fashion-8c18f.firebasestorage.app",
  messagingSenderId: "1096926871024",
  appId: "1:1096926871024:web:77b00a182f23794d93f135",
  measurementId: "G-GFKHXVNW71"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);


