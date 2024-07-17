// userRoutes.js

// Importing dependencies
// Importing the Express framework to create router
import express from "express";

// Importing controllers
// Importing UserController to handle user-related operations
import UserController from "../controllers/userController.js";

// Creating a new router object
const router = express.Router();

// User registration route
// Route for user registration, which calls the register method from the UserController
router.post("/register", UserController.register);

// User login route
// Route for user login, which calls the login method from the UserController
router.post("/login", UserController.login);

// Firebase login route
// Route for Firebase user login, which calls the fireLogin method from the UserController
router.post("/firelogin", UserController.fireLogin);

// User logout route
// Route for user logout, which calls the logout method from UserController
// router.post("/logout", UserController.logout);

// Exporting the router object to be used in other parts of the application
export default router;
