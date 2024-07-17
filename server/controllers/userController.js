// Controller file for handling user-related logic.

// Importing necessary dependencies
import User from "../models/userModel.js"; // Importing the user model
import jwt from "jsonwebtoken"; // Importing JWT for token generation and verification
import bcryptjs from "bcryptjs"; // Importing bcryptjs for password hashing and comparison
import dotenv from "dotenv"; // Importing dotenv for environment variables
import admin from "firebase-admin"; // Importing Firebase Admin SDK
import { getAuth } from "firebase-admin/auth"; // Importing Firebase Auth functions from Admin SDK

// Loading environment variables from .env file
dotenv.config(); // Specifying the path to the .env file

// Define controller methods
const UserController = {
  // Register controller
  register: async (req, res) => {
    try {
      const userData = req.body; // Extracting user data from the request body
      const existingUser = await User.findOne({ email: userData.email }); // Checking if a user with the same email already exists
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "This email is already registered" }); // Sending error response if email is already registered
      }

      // Create new user in MongoDB
      const newUser = new User(userData); // Creating a new user instance with the provided data
      const savedUser = await newUser.save(); // Saving the new user to the database

      // Create corresponding user in Firebase Admin
      const firebaseUserInfo = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
      }); // Creating a new user in Firebase with email and password
      const firebaseId = firebaseUserInfo.uid; // Getting the Firebase user ID

      savedUser.firebaseId = firebaseId; // Assigning the Firebase user ID to the MongoDB user document
      await savedUser.save(); // Saving the updated user document

      res
        .status(201)
        .json({ message: "You registered successfully", user: savedUser }); // Sending success response with the saved user data
    } catch (error) {
      console.error("Error registering this user", error); // Logging any error that occurs during registration
      res
        .status(500)
        .json({ message: "An error occurred while registering user" }); // Sending error response
    }
  },

  // Login controller
  login: async (req, res) => {
    const { email, password, fcmToken } = req.body; // Extracting login data from the request body

    try {
      // Step 1: Verify user's credentials with MongoDB
      const user = await User.findOne({ email }); // Finding user by email in MongoDB
      if (!user) {
        return res.status(404).json({ message: "User not found" }); // Sending error response if user is not found
      }

      const passwordMatch = await bcryptjs.compare(password, user.password); // Comparing provided password with stored hash
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" }); // Sending error response if password does not match
      }

      // Step 2: Authenticate with Firebase
      let firebaseUser;
      try {
        firebaseUser = await getAuth().getUserByEmail(email); // Getting user by email from Firebase
      } catch (firebaseError) {
        // If user doesn't exist in Firebase, create one
        if (firebaseError.code === "auth/user-not-found") {
          firebaseUser = await getAuth().createUser({
            email: email,
            password: password,
          }); // Creating a new user in Firebase
        } else {
          console.error("Error authenticating with Firebase:", firebaseError); // Logging any Firebase authentication error
          return res
            .status(500)
            .json({ message: "Firebase authentication failed" }); // Sending error response
        }
      }

      // Step 3: Update Firestore
      const userRef = admin
        .firestore()
        .collection("users")
        .doc(firebaseUser.uid); // Getting reference to Firestore document
      const userDoc = await userRef.get(); // Getting the user document
      const userData = userDoc.data(); // Extracting user data from the document

      let updatedDisplayName =
        user.displayName || userData?.displayName || email.split("@")[0]; // Determining display name

      await userRef.set(
        {
          email: email,
          displayName: updatedDisplayName,
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          online: true,
          lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      ); // Updating Firestore document with new data

      // Step 4: Generate JWT token
      const payload = {
        id: user._id,
        firebaseId: firebaseUser.uid,
      }; // Creating JWT payload
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3h",
      }); // Generating JWT token with expiration

      // Step 5: Update FCM token in MongoDB
      user.fcmToken = fcmToken; // Updating FCM token in user document
      await user.save(); // Saving updated user document

      res.status(200).json({
        token,
        fcmToken,
        displayName: updatedDisplayName,
        mongoId: user._id,
        firebaseId: firebaseUser.uid,
      }); // Sending success response with token and user data
    } catch (error) {
      console.error(error); // Logging any error that occurs during login
      res.status(500).json({ message: "Internal server error" }); // Sending error response
    }
  },

  // Firebase Login controller
  fireLogin: async (req, res) => {
    const { email, uid, fcmToken, displayName } = req.body; // Extracting login data from request body

    try {
      // Firestore operations
      const userRef = admin.firestore().collection("users").doc(uid); // Getting reference to Firestore document
      const userDoc = await userRef.get(); // Getting the user document
      const userData = userDoc.data(); // Extracting user data from the document

      let updatedDisplayName =
        displayName || userData?.displayName || email.split("@")[0]; // Determining display name

      await userRef.set(
        {
          email: email,
          displayName: updatedDisplayName,
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          online: true,
          lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      ); // Updating Firestore document with new data

      // MongoDB operations
      let user = await User.findOne({ firebaseId: uid }); // Finding user by Firebase ID in MongoDB
      if (!user) {
        // If the user doesn't exist in MongoDB, create a new user
        const newUser = new User({
          email,
          firebaseId: uid,
          fcmToken,
          displayName: updatedDisplayName,
        }); // Creating a new user instance with provided data
        user = await newUser.save(); // Saving new user to MongoDB
      } else {
        // Update the user in MongoDB
        user.fcmToken = fcmToken; // Updating FCM token in user document
        user.displayName = updatedDisplayName; // Updating display name in user document
        await user.save(); // Saving updated user document
      }

      const payload = { uid: uid }; // Creating JWT payload
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3h",
      }); // Generating JWT token with expiration

      res
        .status(200)
        .json({ token, fcmToken, displayName: updatedDisplayName }); // Sending success response with token and user data
    } catch (error) {
      console.error(error); // Logging any error that occurs during Firebase login
      res.status(500).json({ message: "Internal server error" }); // Sending error response
    }
  },

  // Logout user
  // logout: async (req, res) => {
  //   try {
  //     const { userId } = req.body; // Extracting user ID from the request body

  //     const user = await User.findById(userId); // Finding the user by user ID in MongoDB
  //     if (!user) {
  //       return res.status(404).json({ message: "User not found" }); // Sending error response if user is not found
  //     }

  //     // Clear the FCM token from the user
  //     user.fcmToken = null; // Clearing the FCM token from the user document
  //     await user.save(); // Saving the updated user document
  // },
};

export default UserController; // Exporting the UserController object as the default export
