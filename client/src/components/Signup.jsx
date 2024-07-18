// src/components/Signup.jsx

// Import necessary modules and hooks
import React, { useState } from "react"; // Import React and the useState hook
import axios from "axios"; // Import axios for making HTTP requests
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom for navigation

// Styling
import "./style/StyleSheet.css"; // Importing Styling component

// Define the SignupForm component, receiving setSelectedTab as a prop
const SignupForm = ({ setSelectedTab }) => {
  // State variables to manage form inputs and messages
  const [email, setEmail] = useState(""); // State to store the email input
  const [password, setPassword] = useState(""); // State to store the password input
  const [confirmPassword, setConfirmPassword] = useState(""); // State to store the confirm password input
  const [passwordError, setPasswordError] = useState(""); // State to store password mismatch error
  const [errorMessage, setErrorMessage] = useState(""); // State to store other error messages
  const [successMessage, setSuccessMessage] = useState(""); // State to store success message

  const navigate = useNavigate(); // Hook for navigation

  // Function to handle signup form submission
  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // In case we used the function prior with an error, clear all before proceeding
    setPasswordError(""); // Clear password mismatch error
    setSuccessMessage(""); // Clear success message from previous attempts
    setErrorMessage(""); // Clear any previous error messages

    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match"); // Set password mismatch error
      setConfirmPassword(""); // Clear confirm password input field
      return; // Exit the function if passwords don't match
    }

    try {
      const newUser = { email, password }; // Create a new user object with email and password
      const response = await axios.post("/api/users/register", newUser); // Send POST request to register the new user

      if (
        response.data && // Check if response data exists
        response.data.user && // Check if user data exists in the response
        response.data.user.firebaseId // Check if Firebase ID exists in the user data
      ) {
        // Clear form fields and show success message on successful registration
        setEmail(""); // Clear email input field
        setPassword(""); // Clear password input field
        setConfirmPassword(""); // Clear confirm password input field
        setSuccessMessage(response.data.message); // Set success message from the response
        setErrorMessage(""); // Clear any previous error messages
      } else {
        throw new Error("User registration failed: Missing user data"); // Throw an error if user data is missing in the response
      }
    } catch (error) {
      // Handle errors from the backend
      if (error.response && error.response.status === 400) {
        setErrorMessage("Email already exists!"); // Set error message if email is already registered
        setEmail(""); // Clear email input field to try again
      } else {
        console.error("Signup failed:", error); // Log other errors for debugging purposes
        setErrorMessage("Registration failed. Please try again."); // Set a generic error message
        setEmail(""); // Clear email input field
        setPassword(""); // Clear password input field
        setConfirmPassword(""); // Clear confirm password input field
      }
    }
  };

  return (
    <div className="credentials-form">
      {!successMessage ? (
        <>
          <h2>Create a New Account</h2>
          <form className="signup-form" onSubmit={handleSignup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordError && <p className="signup-error">{passwordError}</p>}{" "}
            {errorMessage && <p className="signup-error">{errorMessage}</p>}
            <button
              type="submit"
              className="signup-form-btn"
              disabled={!email || !password || !confirmPassword}
            >
              Continue
            </button>
          </form>
        </>
      ) : (
        <div className="signup-success">
          <h2>{successMessage}!</h2>
          <p className="signup-email-message">
            An email has been sent to your email address for confirmation.
          </p>
          <button
            onClick={() => {
              setSuccessMessage("");
              setSelectedTab("Login");
              navigate("/");
            }}
            className="signup-email-message-btn"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default SignupForm; // Export SignupForm component

/* return with comments 
return (
  <div className="credentials-form">
    {!successMessage ? ( // Conditional rendering based on successMessage state
      <>
        <h2>Create a New Account</h2>
        <form className="signup-form" onSubmit={handleSignup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email} // Bind email input value to state
            onChange={(e) => setEmail(e.target.value)} // Update state on email input change
            required // Make email input required
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password} // Bind password input value to state
            onChange={(e) => setPassword(e.target.value)} // Update state on password input change
            required // Make password input required
          />
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword} // Bind confirm password input value to state
            onChange={(e) => setConfirmPassword(e.target.value)} // Update state on confirm password input change
            required // Make confirm password input required
          />
          {passwordError && <p className="signup-error">{passwordError}</p>}{" "}
          // Display password mismatch error if exists
          {errorMessage && <p className="signup-error">{errorMessage}</p>} //
          Display other error messages if exist
          <button
            type="submit"
            className="signup-form-btn"
            disabled={!email || !password || !confirmPassword} // Disable button if any input is empty
          >
            Continue
          </button>
        </form>
      </>
    ) : (
      <div className="signup-success">
        <h2>{successMessage}!</h2> // Display success message
        <p className="signup-email-message">
          An email has been sent to your email address for confirmation.
        </p>
        <button
          onClick={() => {
            setSuccessMessage(""); // Clear success message
            setSelectedTab("Login"); // Switch to Login tab
            navigate("/"); // Navigate to home page
          }}
          className="signup-email-message-btn"
        >
          Close
        </button>
      </div>
    )}
  </div>
);*/
