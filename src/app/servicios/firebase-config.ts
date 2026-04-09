import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBkRy5-S-usXZuOMtUk9NZoGPnb2WR2JL0",
  authDomain: "alahiabeautyapp-734f4.firebaseapp.com",
  projectId: "alahiabeautyapp-734f4",
  storageBucket: "alahiabeautyapp-734f4.firebasestorage.app",
  messagingSenderId: "157619934939",
  appId: "1:157619934939:web:d5336efb2c765fca445efe",
  measurementId: "G-FGX2M9LXKX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
