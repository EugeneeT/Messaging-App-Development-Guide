// src/components/config/firebaseConfig.jsx

// Import necessary functions from the Firebase SDKs
import { initializeApp } from "firebase/app"; // Import the function to initialize a Firebase app
import { getAuth } from "firebase/auth"; // Import the function to get the Firebase Auth instance
import { getFirestore } from "firebase/firestore"; // Import the function to get the Firestore instance

// Define the Firebase configuration object using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY, // API key for Firebase project
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN, // Auth domain for Firebase Authentication
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID, // Project ID for Firebase project
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // Storage bucket for Firebase Storage
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID, // Sender ID for Firebase Cloud Messaging
  appId: process.env.REACT_APP_FIREBASE_APP_ID, // App ID for Firebase project
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // Measurement ID for Firebase Analytics (optional)
};

// Initialize the Firebase app with the provided configuration
const firebaseApp = initializeApp(firebaseConfig); // Initialize the Firebase app with the config object
const firebaseAuth = getAuth(firebaseApp); // Get the Auth instance for the initialized app
const fireDB = getFirestore(firebaseApp); // Get the Firestore instance for the initialized app

// Export the Auth and Firestore instances for use in other parts of the application
export { firebaseAuth, fireDB }; // Export the Auth and Firestore instances for easy import
