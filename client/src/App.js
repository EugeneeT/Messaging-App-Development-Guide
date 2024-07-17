// src/App.jsx
// Import the React library to use JSX and create components
import React from "react";
// Import Routes and Route from react-router-dom to define the application's routes
import { Routes, Route } from "react-router-dom";
// Import the AuthProvider component to provide authentication context to the app
import { AuthProvider } from "./components/context/AuthContext.jsx";
// Import the NotificationProvider component to provide notification context to the app
import { NotificationProvider } from "./components/context/NotificationContext";
// Import the HomePage component which will be displayed on the home route
import HomePage from "./components/HomePage.jsx";
// Import the NotFound component which will be displayed for any undefined routes
import NotFound from "./components/NotFound.jsx";

// Define the main App component
function App() {
  return (
    // Wrap the application in AuthProvider to provide authentication context to all components
    <AuthProvider>
      {/* Wrap the application in NotificationProvider to provide notification context to all components */}
      <NotificationProvider>
        {/* Define the application's routes using Routes */}
        <Routes>
          {/* Define the home route, which renders the HomePage component */}
          <Route path="/" element={<HomePage />} />
          {/* Define a catch-all route, which renders the NotFound component for any undefined paths */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

// Export the App component as the default export
export default App;
