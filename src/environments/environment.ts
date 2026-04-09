export const environment = {
  production: false,
  apiUrl: "http://localhost:5000/api",   // 👉 tu backend local
  firebaseConfig: {
    apiKey: "AIzaSyBkRy5-S-usXZuOMtUk9NZoGPnb2WR2JL0",
    authDomain: "alahiabeautyapp-734f4.firebaseapp.com",
    projectId: "alahiabeautyapp-734f4",
    storageBucket: "alahiabeautyapp-734f4.appspot.com",
    messagingSenderId: "157619934939",
    appId: "1:157619934939:web:d5336efb2c765fca445efe",
    measurementId: "G-FGX2M9LXKX",
    vapidKey: "BF7HINsyrNbvdnEgnZFfq266DDgWMyHAqy0wU7a6UIhn-TPkp1lFYQLqY_x-fvZubX8ahCvRxL1bnFtS1ovB0Wk"   // 👈 este lo sacas de Certificados push web (Firebase)
  }
};
