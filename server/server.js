// server.js

// Importing dependencies
import express from "express"; // Importing Express framework
import dotenv from "dotenv"; // Importing dotenv for environment variables
import cors from "cors"; // Importing CORS middleware for cross-origin requests
import admin from "firebase-admin"; //

// Importing modules
import MongoDB from "./database/mongoConnect.js";
import UserRoutes from "./routes/userRoutes.js"; // Importing userRoutes.js

// Loading environment variables from .env file
dotenv.config();

// Initializing Express app
const app = express();

// Setting the port for the server to listen on
const PORT = process.env.PORT || 5000;

// Middleware
// Enabling CORS middleware for cross-origin requests
app.use(cors());
// Parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Parsing JSON bodies
app.use(express.json());

// Routes
// Using UserRoutes for user-related routes
app.use("/api/users", UserRoutes);

// Path to your service account key JSON file
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Optional databaseURL. If not specified, it tries to use your project's default database.
    databaseURL: "",
  });
  console.log("Firebase Admin initialized");
} catch (error) {
  // Firebase error message
  console.error("Firebase Admin initialization error:", error);
}

// MongoDB connection
MongoDB()
  .then(() => {
    app.listen(PORT, () => {
      // Logging that the server is listening on the specified port
      console.log(`The server is listening to port: ${PORT}`);
    });
  })
  .catch((error) => {
    // Error message in case of connection issues
    console.error("Error starting server:", error);
  });
