// src/index.js
// Import the React library to use JSX and create components
import React from "react";
// Import the ReactDOM library for rendering the React components to the DOM
import ReactDOM from "react-dom/client";
// Import BrowserRouter from react-router-dom to enable routing in the app
import { BrowserRouter } from "react-router-dom";
// Import the global CSS file for styling the application
import "./index.css";
// Import the main App component
import App from "./App";
// Import reportWebVitals for measuring performance metrics of the app
import reportWebVitals from "./reportWebVitals";

// Create a root DOM node to render the React application
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the React application
root.render(
  // Wrap the App component in BrowserRouter to enable routing
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Call reportWebVitals to log performance metrics of the app
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
