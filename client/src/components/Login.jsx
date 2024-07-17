// src/components/Login.jsx

// Import Dependencies
import React, { useState } from "react"; // Import React and useState hook for managing state in the component
import { useNavigate } from "react-router-dom"; // Import useNavigate hook for navigation
import axios from "axios"; // Import axios for making HTTP requests
import {
  signInWithEmailAndPassword, // Method for signing in with email and password
  signInWithPopup, // Method for signing in with a popup (e.g., Google)
  GoogleAuthProvider, // Google authentication provider
} from "firebase/auth";
import { firebaseAuth } from "./config/firebaseConfig"; // Import custom Firebase authentication module

// Styling
import "./style/StyleSheet.css"; // Importing Styling component

// Define the LoginForm component
const LoginForm = () => {
  // Define state variables for managing form inputs and authentication states
  const [email, setEmail] = useState(""); // State to store the user's email input
  const [password, setPassword] = useState(""); // State to store the user's password input
  const [wrongCredential, setWrongCredential] = useState(""); // State to manage error messages for incorrect credentials
  const [authError, setAuthError] = useState(""); // State to manage error messages for authentication failures

  // useNavigate hook for navigating to different routes after successful authentication
  const navigate = useNavigate(); // Initialize the navigate function to handle navigation

  // Function to handle the form submission for email/password login
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    try {
      // Authenticate the user with Firebase using email and password
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      const user = userCredential.user; // Get the authenticated user

      // Get the Firebase Cloud Messaging token for the authenticated user
      const fcmToken = await user.getIdToken(); // Fetch the user's ID token

      // Log the current displayName from Firebase Auth for debugging
      console.log("Current displayName from Firebase Auth:", user.displayName);

      // Send a POST request to the server to log in the user and get a token
      const response = await axios.post(
        "http://localhost:5001/api/users/login",
        {
          email: user.email, // Include email in the request body
          password, // Include password for verification on server side
          fcmToken, // Include the Firebase Cloud Messaging token
          displayName: user.displayName, // Include the user's display name
          uid: user.uid, // Include the user's unique ID
        }
      );

      // Store the received token in localStorage for maintaining the session
      localStorage.setItem("userToken", response.data.token); // Save the token to local storage
      navigate("/"); // Navigate to the home page upon successful login
    } catch (error) {
      // Handle errors during authentication
      setWrongCredential("Incorrect email or password! Please try again."); // Set error message for incorrect credentials
      setEmail(""); // Clear email input field
      setPassword(""); // Clear password input field
    }
  };

  // Function to handle Google login using a popup
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider(); // Create a new GoogleAuthProvider instance
      const result = await signInWithPopup(firebaseAuth, provider); // Sign in with Google using a popup
      const user = result.user; // Get the authenticated user

      // Get the Firebase Cloud Messaging token for the authenticated user
      const fcmToken = await user.getIdToken(); // Fetch the user's ID token

      // Log the current displayName from Google Auth for debugging
      console.log("Current displayName from Google Auth:", user.displayName);

      // Send a POST request to the server to log in the user and get a token
      const response = await axios.post(
        "http://localhost:5001/api/users/firelogin",
        {
          email: user.email, // Include email in the request body
          uid: user.uid, // Include the user's unique ID
          fcmToken, // Include the Firebase Cloud Messaging token
          displayName: user.displayName, // Include the user's display name
        }
      );

      // Store the received token in localStorage for maintaining the session
      localStorage.setItem("userToken", response.data.token); // Save the token to local storage
      navigate("/"); // Navigate to the home page upon successful login
    } catch (error) {
      // Handle errors during Google authentication
      setAuthError("Failed to login with Google."); // Set error message for failed Google login
    }
  };

  return (
    <div className="form-container">
      <h2>Sign in to your account</h2>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {wrongCredential && <p className="error">{wrongCredential}</p>}
        {authError && <p className="error">{authError}</p>}
        <button type="submit">Continue</button>
      </form>
      <button onClick={handleGoogleLogin} className="google-login-btn">
        Continue with Google
      </button>
    </div>
  );
};

export default LoginForm; // Export the LoginForm component as the default export

// return with comments
// return (
//   <div className="form-container">
//     {/* Container for the login form */}
//     <h2>Sign in to your account</h2> {/* Heading for the login form */}
//     <form onSubmit={handleLogin}>
//       {/* Form submission handled by handleLogin */}
//       <label>Email</label> {/* Label for email input */}
//       <input
//         type="email"
//         value={email} // Bind email input value to state
//         onChange={(e) => setEmail(e.target.value)} // Update email state on input change
//         required // Make the field required
//       />
//       <label>Password</label> {/* Label for password input */}
//       <input
//         type="password"
//         value={password} // Bind password input value to state
//         onChange={(e) => setPassword(e.target.value)} // Update password state on input change
//         required // Make the field required
//       />
//       {wrongCredential && <p className="error">{wrongCredential}</p>}
//       {/* Display wrong credential error if it exists */}
//       {authError && <p className="error">{authError}</p>}
//       {/* Display authentication error if it exists */}
//       <button type="submit">Continue</button>
//       {/* Button to submit the form */}
//     </form>
//     <button onClick={handleGoogleLogin} className="google-login-btn">
//       Continue with Google {/* Button to trigger Google login */}
//     </button>
//   </div>
// );
