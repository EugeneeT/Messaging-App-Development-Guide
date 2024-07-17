// Import the mongoose library to interact with MongoDB.
import mongoose from "mongoose";

// Import the dotenv library to load environment variables from a .env file.
import dotenv from "dotenv";

// Load environment variables from the .env file into process.env.
dotenv.config();

// Define an asynchronous function to establish a connection to MongoDB.
const MongoDB = async () => {
  try {
    // Use mongoose to connect to MongoDB using the URI provided in the environment variables.
    await mongoose.connect(process.env.MONGODB_URI);
    // If the connection is successful, log a success message to the console.
    console.log("DB connected");
  } catch (error) {
    // If there is an error during the connection, log the error message to the console.
    console.error("Error connecting to database:", error);
    // Exit the process with a failure code (1) to indicate the error.
    process.exit(1);
  }
};

// Export the MongoDB function as the default export of this module.
export default MongoDB;
