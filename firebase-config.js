// Firebase Configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyAC5lbYLars62g4NuXyWGIQr4W_2eTKvK0",
    authDomain: "creathon-2026.firebaseapp.com",
    projectId: "creathon-2026",
    storageBucket: "creathon-2026.firebasestorage.app",
    messagingSenderId: "1039055640790",
    appId: "1:1039055640790:web:d631c5ea9779529d23d177",
    measurementId: "G-MMKQ9ZX5Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
