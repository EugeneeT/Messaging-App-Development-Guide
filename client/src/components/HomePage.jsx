// src/components/HomePage.jsx

// Import Dependencies
import React, { useContext, useState } from "react"; // Import React and useState hook for managing state in the component
import AuthContext from "./context/AuthContext.jsx"; // Importing the AuthContext to access authentication state
import { useNavigate } from "react-router-dom"; // Importing useNavigate hook for programmatic navigation
import LoginForm from "./Login.jsx"; // Importing the LoginForm component
import SignupForm from "./Signup.jsx"; // Importing the SignupForm component
import MessageApp from "./chat/ChatApp.jsx"; // Importing the ChatApp component

// Styling
import "./style/StyleSheet.css"; // Importing Styling component

// Define the HomePage functional component
const HomePage = () => {
  const { currentUser, logout } = useContext(AuthContext); // Accessing currentUser state from AuthContext
  const [selectedTab, setSelectedTab] = useState("Login"); // State to track selected tab (Login or Signup)
  const navigate = useNavigate(); // Initializing the useNavigate hook for navigation

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("userToken"); // Removing userToken from localStorage
      setSelectedTab("Login"); // Resetting selectedTab to "Login"
      navigate("/"); // Navigating back to the homepage
    } catch (error) {
      console.error("Error signing out: ", error); // Logging error if logout fails
    }
  };

  // Function to handle tab clicks (Login or Signup)
  const handleTabClick = (tab) => {
    setSelectedTab(tab); // Setting selectedTab state based on clicked tab
  };

  return (
    <div className="home-container">
      <header className="home-nav">
        <div className="logo">LOGO</div>
        <div className="name">CHAT APP</div>
        {currentUser && (
          <button className="custom-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>
      <main className="home-main">
        {currentUser ? (
          <MessageApp />
        ) : (
          <div className="landing-container">
            <div className="landing-box">
              <nav className="landing-nav">
                <ul>
                  <li
                    className={`login-tab ${
                      selectedTab === "Login" ? "active" : ""
                    }`}
                    onClick={() => handleTabClick("Login")}
                  >
                    Login
                  </li>
                  <li
                    className={`signup-tab ${
                      selectedTab === "Signup" ? "active" : ""
                    }`}
                    onClick={() => handleTabClick("Signup")}
                  >
                    Signup
                  </li>
                </ul>
              </nav>
              <main>
                {selectedTab === "Login" ? (
                  <LoginForm />
                ) : (
                  <SignupForm setSelectedTab={setSelectedTab} />
                )}
              </main>
            </div>
          </div>
        )}
      </main>
      <footer className="home-footer">
        <p className="footer-text">
          Educational sample: MERN Stack - Firebase Messaging App | Guide &
          Development by Eugen Taranowski
        </p>
      </footer>
    </div>
  );
};

export default HomePage; // Exporting HomePage component as default

// return with comments
/*
<div className="home-container"> // Main container for the homepage 
      <nav className="home-nav"> // Navigation section 
        <div className="logo">LOGO</div> // Application logo 
        <div className="name">CHAT APP</div> // Application name 
        {currentUser && <button onClick={handleLogout}>Logout</button>} // Logout button if user is logged in 
      </nav>

      <main> // Main content section 
        {currentUser ? ( // Conditional rendering based on currentUser state 
          <NotFound /> // Display NotFound component if user is authenticated 
        ) : (
          <div className="landing-container"> // Landing container for login and signup 
            <div className="landing-box"> // Landing box containing login/signup forms 
              <nav className="landing-nav"> // Navigation within landing box 
                <ul>
                  <li
                    className="login-tab" // Class for login tab styling
                    onClick={() => handleTabClick("Login")} // Click handler for login tab
                  >
                    Login // Login tab text 
                  </li>
                  <li
                    className="signup-tab" // Class for signup tab styling
                    onClick={() => handleTabClick("Signup")} // Click handler for signup tab
                  >
                    Signup // Signup tab text 
                  </li>
                </ul>
              </nav>
              <main> // Main section for rendering login/signup forms 
                {selectedTab === "Login" ? ( // Conditional rendering based on selectedTab state 
                  <LoginForm /> // Render LoginForm if selectedTab is "Login" 
                ) : (
                  <SignupForm setSelectedTab={setSelectedTab} /> // Render SignupForm if selectedTab is "Signup" 
                )}
              </main>
            </div>
          </div>
        )}
      </main>

      <footer className="home-footer"> // Footer section 
        <p>Credits or About information</p> // Placeholder text for credits or about information 
      </footer>
    </div>
    */
