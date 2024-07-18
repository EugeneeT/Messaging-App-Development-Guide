// src/components/NotFound.jsx

// Import Dependencies
import React from "react"; // Import the React library to use JSX and create components
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom to navigate programmatically

// Styling
import "./style/StyleSheet.css"; // Import the CSS file for styling

// Define the NotFound functional component
const NotFound = () => {
  const navigate = useNavigate(); // Initialize the navigate function to handle navigation

  // Define a function to navigate to the home page when the button is clicked
  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="not-found">
      <div className="not-found-container">
        <h1 className="not-found-title">404 - Page Not Found</h1>
        <p className="not-found-message">
          Sorry, the page you are looking for does not exist.
        </p>
        <button className="not-found-button" onClick={handleGoHome}>
          Go to Home
        </button>
      </div>
    </div>
  );
};

// Export the NotFound component as the default export
export default NotFound;

// return with comments
// return (
//   // Render the NotFound component's UI
//   <div className="not-found">
//     {/* Container for the not-found message and button */}
//     <div className="not-found-container">
//       {/* Title for the 404 error */}
//       <h1 className="not-found-title">404 - Page Not Found</h1>
//       {/* Message explaining that the page was not found */}
//       <p className="not-found-message">
//         Sorry, the page you are looking for does not exist.
//       </p>
//       {/* Button to navigate back to the home page */}
//       <button className="not-found-button" onClick={handleGoHome}>
//         Go to Home
//       </button>
//     </div>
//   </div>
// );
