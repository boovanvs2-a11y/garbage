// ═══════════════════════════════════════════════════════════════
//  FIREBASE CONFIGURATION — Urban Pulse Walkability App
//  Replace the values below with your Firebase project credentials
//  Get them from: https://console.firebase.google.com/
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Export for use in app.js
if (typeof module !== 'undefined') module.exports = firebaseConfig;
