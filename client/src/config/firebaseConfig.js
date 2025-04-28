import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "crackitai.firebaseapp.com",
  projectId: "crackitai",
  storageBucket: "crackitai.firebasestorage.app",
  messagingSenderId: "102928797113",
  appId: "1:102928797113:web:c41ec2908b4f858040ba68",
  measurementId: "G-SXGSJ1HP45"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default firebaseConfig;
