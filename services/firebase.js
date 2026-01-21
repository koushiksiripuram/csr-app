

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // ⚠️ KEEP YOUR EXISTING FIREBASE CONFIG HERE
    apiKey: "AIzaSyBognYnMKE_dCG3V_KASmESaNJ4tYsb_rw",
  authDomain: "csr-contribution-app.firebaseapp.com",
  projectId: "csr-contribution-app",
  storageBucket: "csr-contribution-app.firebasestorage.app",
  messagingSenderId: "319786114508",
  appId: "1:319786114508:web:9ddfe7158b59094c0ed169"
};

const app = initializeApp(firebaseConfig);

// ✅ Correct initialization for React Native (Expo)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
