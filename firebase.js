// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJP_3biVQBnyISLQh7E-jlQrtj-3ypd3A",
  authDomain: "personal-finance-dashboa-65bea.firebaseapp.com",
  projectId: "personal-finance-dashboa-65bea",
  storageBucket: "personal-finance-dashboa-65bea.firebasestorage.app",
  messagingSenderId: "513139959112",
  appId: "1:513139959112:web:0a807db058d39fe141ff7d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);