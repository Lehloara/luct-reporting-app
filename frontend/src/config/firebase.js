import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAmvAQZ6-sWL2tSPGqTkgKvQyJQi9nHi4Q",
  authDomain: "luct-reporting.firebaseapp.com",
  projectId: "luct-reporting",
  storageBucket: "luct-reporting.firebasestorage.app",
  messagingSenderId: "650639806635",
  appId: "1:650639806635:web:861df5489fe69823a327ee",
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}
const db = getFirestore(app);
export { auth, db };