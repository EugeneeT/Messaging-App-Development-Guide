# Backend:

## Step 1. Setting Up the Backend Server

### Prerequisites

Before we begin, make sure you have the following installed on your machine:

- **Node.js and npm (Node Package Manager)**  
  To verify the installation, open your terminal or command prompt and run the following commands:

  ```bash
  node -v
  npm -v
  ```

- **MongoDB (Compass or Atlas)**  
  You can download it [here](https://www.mongodb.com/) and also create your account to access the database. After creating your account, go to create an organization: first, name your organization, choose MongoDB Atlas, and hit next.

  Check members and set yourself as the owner, then create the organization. Next, create a project and do the same: give it a name and set permissions.

  To proceed, we need to create a cluster that we will then use for our server.
  Deploy your cluster with the M0 (free) option, as this is just a test and learn environment. Give your cluster a name, choose a provider and a region; you can also just leave everything as is for now. You will then see a popup with the connection method. You have to create a user with a username and password first to then move on. Hit "choose connection method" and click on "Drivers" on the next page. This will provide you with the access URI that you can copy in step 3 of the next page. We need this to connect our server with the database. You can always come back to this by visiting the overview of your project on MongoDB Atlas and clicking on the "Connect" button for your cluster.

I've created a separate documentation file named `MONGODB-ATLAS-SETUP-GUIDE.md` in the `docs` directory of this GitHub Repository.

- **Firebase Account (for Authentication)**  
  If you haven't already created a Firebase project, head over to the Firebase Console and create a new project. Follow the prompts to set up your project.  
  We also need the Firebase Admin SDK private key for our backend server later on, which we can get at this point. In the Firebase Console, go to your project settings and then navigate to the "Service Accounts" tab. Click on "Generate new private key" to download a JSON file containing your service account credentials. This file will include sensitive information, so keep it secure and do not expose it publicly. You can later store the contents of `serviceAccountKey.json` as a multiline string in an environment variable named something like `FIREBASE_SERVICE_ACCOUNT`.

I've created also a separate documentation file named `FIREBASE-SETUP-GUIDE.md` in the `docs` directory. This file provides comprehensive instructions for setting up Firebase Authentication and obtaining the necessary credentials for your project.

### Directory and Node.js Project

1. **Create a new directory for your project:**  
   If you're starting from scratch and want to follow my guide, please create a new project folder first. Otherwise, skip forward to the part on how to integrate the features.

   ```bash
   mkdir react-firebase-messaging && cd react-firebase-messaging
   ```

   ```bash
   npm init -y
   ```

   Before we proceed, I always like to plan and create the folder structure first.

2. **Create Frontend and Backend Folder Structures**  
   I normally separate my frontend into a `client` folder and my backend into a `server` folder. I think about the files I need so I can create the necessary files and folders before I start with the code.

   This is a simple example folder structure:

   ```
   root/ (react-firebase-messaging)
   ├── package.json
   ├── README.md
   │
   ├── server/
   │ ├── config/
   │ ├── controllers/
   │ ├── database/
   │ ├── middleware/
   │ ├── models/
   │ ├── routes/
   │ │
   │ └── server.js
   │
   └── client/
   ```

   Most of the client folders and files will be created with Create React App later on.

   To quickly set up the same folder structure for the backend as I did, please use this code:

   ```bash
   mkdir server && mkdir server/config server/controllers server/database server/middleware server/models server/routes
   ```

   Now we jump into the `/server` folder for the next step. You can do it with this command:

   ```bash
   cd server/
   ```

   Here again, we initialize the folder first so we can install our needed dependencies in the folder.

   ```bash
   npm init -y
   ```

   Before we move on, we jump to the newly created `package.json` file inside the `server` folder and add this line `"type": "module"` somewhere after `"main"`, for example, and add `"start": "nodemon ."` inside scripts.

   ```json
   "main": "server.js",
   "type": "module",
   "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1",
      "start": "nodemon ."
   },
   ```

   - `"type": "module"`: This line indicates that the project is using ECMAScript modules, allowing you to use `import` and `export` statements instead of CommonJS `require` and `module.exports`.
   - `"start": "nodemon ."`: This script tells npm to use `nodemon` to run your application.

### Required Dependencies

- **Express:** Fast, minimalist web framework for Node.js.
- **Mongoose:** MongoDB object modeling tool designed to work in an asynchronous environment.
- **dotenv:** Module to load environment variables from a `.env` file.
- **cors:** Middleware for enabling Cross-Origin Resource Sharing (CORS).
- **bcryptjs:** Library for hashing passwords.
- **jsonwebtoken:** Implementation of JSON Web Tokens (JWT) for authentication.
- **nodemon:** Automatically restarts a Node.js application when file changes in the directory are detected.
- **Firebase Admin:** Server-side access to Firebase services like Authentication, Realtime Database, and Cloud Messaging.

I am using `bcryptjs` instead of `bcrypt` for personal reasons, such as having an outdated MacBook Pro from 2013 that just doesn't want to work with bcrypt.

You can install all of them in one go with the following command:

```bash
npm install express mongoose dotenv cors bcryptjs jsonwebtoken nodemon firebase-admin
```

Your `package.json` will look like this after the installation of the dependencies:

```json
{
  "name": "react-firebase-messaging",
  "version": "1.0.0",
  "description": "## Introduction",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon ."
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "firebase-admin": "^12.1.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.1",
    "nodemon": "^3.1.3"
  }
}
```

### MongoDB Connection

Next, we set up a connection to our MongoDB database using Mongoose.

#### Creating Component Files

As you remember, I already mentioned that I like to create separate components to keep my code structured and clean. So for this, we first create a new file inside the `database` folder.

```bash
touch database/mongoConnect.js
```

#### Dependencies

We populate the file with the function to connect to MongoDB using Mongoose. We start by importing the dependencies:

```javascript
import mongoose from "mongoose";
import dotenv from "dotenv";
```

- **mongoose from "mongoose"**: Object Data Modeling for MongoDB, used to manage data schemas and models.
- **dotenv from "dotenv"**: dotenv for environment variables.

We load our environment variables from the `.env` file:

```javascript
dotenv.config();
```

#### MongoDB Component

Create an async function that helps us connect to our database. We export the function at the end of the code block so that we can import it later in our server's main file.

```javascript
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
```

**Guide Tip**
As you can see, I have many comments in my code initiated with two forward slashes `//`. I like to have short explanations to remember the purpose and function of those code lines. I will add detailed comments to my code and files but keep the guide code clean from here on out. If you need more information, click on the file link at the end of each section and check out the final code with all the comments. Here is the [MongoDB file](/server/database/mongoConnect.js).

I access the database with `process.env.MONGODB_URI`. `process.env` finds the `.env` file, and the `MONGODB_URI` variable gives us the connection URI that we set up earlier after creating our MongoDB Account, Project, and Cluster.

#### .ENV

Next, let's go back to MongoDB Atlas to grab our connection URI and start creating the `.env` file in our server folder.

Create the file and then populate it with the first variable.

```bash
touch .env
```

The variable that we used before `MONGODB_URI`, followed by `=` and the URI that you copied. Make sure you add the password and username if they are missing. You can create another subfolder if you add something between the slash and question mark.

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@messageapp.raiieuf.mongodb.net/SUBFOLDER?retryWrites=true&w=majority&appName=MessageApp
```

## Step 2. The C of CRUD (Create)

Now that we have our database connection all set, we can move on and create the user model (schema) and user controller. With this, we can control or specify how the user will be stored in our database and what information will be available.

#### Creating Component Files

Let's start by creating the needed files for the schema and controller.

```bash
touch models/userModel.js controllers/userController.js
```

Quick reminder: I like to use camel case for naming my files and try to give them names that are as self-explanatory as possible. You are also free to name them as you see fit.

### User Model

We start with our User Model.

#### Dependencies

First import the necessary dependencies:

```javascript
// Importing dependencies
import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
```

We import `mongoose` and `{ Schema }` from "mongoose". Schema is in curly braces because there are two types of exports in JavaScript ES6 modules:

- **Default Export:** A module can export one default value. When you import it, you don't use curly braces.
- **Named Exports:** A module can export multiple named values. When you import these, you use curly braces.

In the case of `mongoose`, the module has both a default export and several named exports:

- The default export `mongoose` includes the core functionality of Mongoose, including the ability to connect to a database and create models.
- Named exports like `Schema` are additional features or utilities provided by the module.

We also import `bcryptjs` or `bcrypt` (depending on your choice) for password hashing prior to saving the password in our database.

#### Schema Component

Next, we define the schema and add important keys and rules that we need from our users or that we think can be useful information to the schema.

Here's a breakdown of these fields:

- `email`: User's email address, required and unique.
- `password`: User's password (will be hashed before storage).
- `firebaseId`: Unique identifier for Firebase authentication, optional but unique if provided.
- `fcmToken`: Firebase Cloud Messaging token for sending notifications.
- `displayName`: User's display name.
- `lastLogin`: Timestamp of the user's last login.
- `timestamps`: Automatic timestamps for user creation and modification (built-in feature of Mongoose).

You can add more keys like name, address, or social media links if they are important for your application.

The schema definition looks like this:

```javascript
const UserSchema = new Schema(
  {
    email: {
      type: String,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address format"],
      required: true,
      unique: true,
    },
    password: { type: String },
    firebaseId: { type: String, unique: true, sparse: true },
    fcmToken: String,
    displayName: { type: String },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);
```

#### Password hashing

We then add the bcrypt function to hash our password before storing the user in the database:

```javascript
UserSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const hashedPassword = await bcryptjs.hash(this.password, 10);
      this.password = hashedPassword;
    }
    next();
  } catch (error) {
    next(error);
  }
});
```

Finally, we create the User model using the schema and export it for use in other components like the controller:

```javascript
const User = mongoose.model("User", UserSchema);

export default User;
```

The [file userModel.js](/server/models/userModel.js) has detailed inline comments to explain everything further.

### Firebase Admin SDK Key

Now before we proceed with the controller, let's grab the `serviceAccountKey.json` that we downloaded earlier from the Firebase Console and add it to our `config/` folder. Just make sure you don't upload this file to GitHub. If you add the whole file to your project, ensure that you have a `.gitignore` file at the root of your project and add the path of the file to it.

`.gitignore file:`

```gitignore
# Ignore service account key
/server/config/serviceAccountKey.json
```

### User Controller

The User Controller in your Node.js project centralizes the logic for handling user-related operations, integrating with models to interact with data, and orchestrating responses back to clients. It helps maintain clean, modular code and facilitates the separation of concerns, making your application more scalable and maintainable.

#### Dependencies

We begin by importing our necessary dependencies:

```javascript
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
```

- **User from "../models/userModel.js"**: Our User Model.
- **jwt from "jsonwebtoken"**: For token generation and verification.
- **bcryptjs from "bcryptjs"**: For password hashing and comparison.
- **dotenv from "dotenv"**: For environment variables.
- **admin from "firebase-admin"**: Firebase Admin SDK.
- **{ getAuth } from "firebase-admin/auth"**: Firebase Auth functions from Admin SDK.

#### .ENV

Next, we load our environment variables from the `.env` file and define our UserController.

```javascript
dotenv.config();

const UserController = {
  // Functionality here
};
```

#### Implement Functionality

The `UserController` should include the following main functions:

1. **register**: Allows new users to create an account.

- Checks if a user with the given email already exists in MongoDB.
- Creates a new user in MongoDB if the email is not registered.
- Creates a corresponding user in Firebase Authentication.
- Assigns the Firebase UID to the MongoDB user document.

```javascript
register: async (req, res) => {
    try {
      const userData = req.body;
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "This email is already registered" });
      }

      const newUser = new User(userData);
      const savedUser = await newUser.save();

      const firebaseUserInfo = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
      });
      const firebaseId = firebaseUserInfo.uid;

      savedUser.firebaseId = firebaseId
      await savedUser.save();
      res
        .status(201)
        .json({ message: "You registered successfully", user: savedUser });
    } catch (error) {
      console.error("Error registering this user", error);
      res
        .status(500)
        .json({ message: "An error occurred while registering user" });
    }
  },
```

2. **login**: Handles user login with enhanced Firebase integration.

- Verifies user credentials against MongoDB.
- Authenticates with Firebase, creating a new Firebase user if necessary.
- Updates user information in Firestore.
- Generates a JWT token.
- Updates the FCM token in MongoDB.
- Returns the JWT token, FCM token, display name, MongoDB ID, and Firebase UID.

```javascript
login: async (req, res) => {
    const { email, password, fcmToken } = req.body;

    try {
      // Verify user's credentials with MongoDB
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const passwordMatch = await bcryptjs.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Authenticate with Firebase
      let firebaseUser;
      try {
        firebaseUser = await getAuth().getUserByEmail(email);
      } catch (firebaseError) {
        if (firebaseError.code === "auth/user-not-found") {
          firebaseUser = await getAuth().createUser({
            email: email,
            password: password,
          });
        } else {
          console.error("Error authenticating with Firebase:", firebaseError);
          return res
            .status(500)
            .json({ message: "Firebase authentication failed" });
        }
      }

      // Update Firestore
      const userRef = admin
        .firestore()
        .collection("users")
        .doc(firebaseUser.uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      let updatedDisplayName =
        user.displayName || userData?.displayName || email.split("@")[0];

      await userRef.set(
        {
          email: email,
          displayName: updatedDisplayName,
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          online: true,
          lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Generate JWT token
      const payload = {
        id: user._id,
        firebaseId: firebaseUser.uid,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3h",
      });

      // Update FCM token in MongoDB
      user.fcmToken = fcmToken;
      await user.save();

      res.status(200).json({
        token,
        fcmToken,
        displayName: updatedDisplayName,
        mongoId: user._id,
        firebaseId: firebaseUser.uid,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
```

3. **fireLogin**: Handles login specifically for Firebase authentication (Google Login).

- Updates or creates user document in Firestore.
- Checks for an existing user in MongoDB using the Firebase UID.
- Creates a new MongoDB user if one doesn't exist, or updates the existing user.
- Generates a JWT token.
- Returns the JWT token, FCM token, and display name.

```javascript
fireLogin: async (req, res) => {
    const { email, uid, fcmToken, displayName } = req.body;

    try {
      // Firestore operations
      const userRef = admin.firestore().collection("users").doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      let updatedDisplayName =
        displayName || userData?.displayName || email.split("@")[0];

      await userRef.set(
        {
          email: email,
          displayName: updatedDisplayName,
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          online: true,
          lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // MongoDB operations
      let user = await User.findOne({ firebaseId: uid });
      if (!user) {
        const newUser = new User({
          email,
          firebaseId: uid,
          fcmToken,
          displayName: updatedDisplayName,
        });
        user = await newUser.save();
      } else {
        user.fcmToken = fcmToken;
        user.displayName = updatedDisplayName;
        await user.save();
      }

      const payload = { uid: uid };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3h",
      });

      res
        .status(200)
        .json({ token, fcmToken, displayName: updatedDisplayName });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
```

4. **logout**: Handles user logout.

**(We will handle our logout in the frontend, but I added a sample code for better understanding.)**

- Finds the user in MongoDB by user ID.
- Clears the FCM token from the user document in MongoDB.

The finished code should look like this, with inline comments to further explain each part of the code.

```javascript
// Logout user can be added if necessary
   logout: async (req, res) => {
     try {
       const { userId } = req.body;
       const user = await User.findById(userId);
       if (!user) {
         return res.status(404).json({ message: "User not found" });     }
       user.fcmToken = null;
       await user.save();
   }
   },
```

#### Export Component

Export the component:

```javascript
export default UserController;
```

#### JWT

Don't forget to add the `JWT_SECRET` to our `.env` file. The `JWT_SECRET` is a secret key used to sign and verify JSON Web Tokens (JWTs). It ensures that the tokens are authentic and haven't been tampered with, providing a secure way to transmit information between parties in a compact and self-contained manner.

- The secret should be long and complex enough to be resistant to brute force attacks.
- The secret should be unique and not easily guessable.
- Use a secure random string generator to create the secret.
- Keep the secret secure and do not expose it in your code Repository.

Example for a strong secret:

```env
JWT_SECRET="aS$4d#2!98_FghqL#A1szT6l8@!pLkEwB9cD7iU"
```

If your secret key contains special characters `(e.g., !, #, $, etc.)` or `spaces`, it's a good practice to enclose it in double quotes to ensure it's read correctly.

The [file userController.js](/server/controllers/userController.js) has detailed inline comments to explain everything further.

### User Routes

Routes define the endpoints at which requests can be made by a client. They specify what should happen when a particular URL is accessed, typically mapping HTTP methods (GET, POST, PUT, DELETE, etc.) to specific functions or handlers in your application.

#### Creating Component Files

To create the routes, we create a new file inside the `/routes` folder:

```bash
touch routes/userRoutes.js
```

#### Dependencies

We start by importing our dependencies and the controller that we prepared earlier.

```javascript
import express from "express";
import UserController from "../controllers/userController.js";
```

- **express from "express"**: A web framework for Node.js, used to create server-side applications.
- **UserController from "../controllers/userController.js"**: UserController handles user-related operations and logic.

#### Routes Component

We create our router with the `express.Router()` function that we imported.

```javascript
const router = express.Router();
```

And write out our routes needed to create a new user, login, and (logout if necessary).

```javascript
router.post("/register", UserController.register);

router.post("/login", UserController.login);

router.post("/firelogin", UserController.fireLogin);

// router.post("/logout", UserController.logout);
```

#### Export Component

Finally, we export our router for further use in the main `server.js` file that we will create next to integrate all our components into one Express Server Application.

Export the component:

```javascript
export default router;
```

The [file userRoutes.js](/server/routes/userRoutes.js) with detailed inline comments.

## Step 3. The Server

We now combine all our components and set up the Express server that will make our backend API work as intended.

#### Creating Component Files

First, create the file. I like to call it `server.js`. Some use `index.js`, and there are other names you can use as well. If you give it any other name or follow my example with `server.js`, please make sure to change the name inside the `package.json` from `"main": "index.js",` to `"main": "YOUR-FILE-NAME.js",`.

```bash
touch server.js
```

#### Dependencies

First, we import all necessary dependencies and components:

```javascript
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
```

I have already explained all of them in detail in previous steps.

And we import the modules that we created earlier:

```javascript
import MongoDB from "./database/mongoConnect.js";
import UserRoutes from "./routes/userRoutes.js";
```

#### Express Server

Let's start our Express server now, connect it to MongoDB, and integrate Firebase.

Load environment variables from the `.env` file, initialize the Express app and set the port.

```javascript
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
```

Add the variable to our `.env` file. I am using 5001 on my Mac, but you can also use 5000. This is for testing and developing on your local machine and will be replaced with the server port later on deployment.

```env
PORT=5000
```

#### Middleware

Now we enable some of the middleware in our app: `CORS` for cross-origin requests, and `urlencoded` and `json` to be able to parse `URL-encoded` and `JSON` bodies.

```javascript
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
```

#### Routes

Next up, the routes that we are going to use. In this case, it's just the user route for now.

```javascript
app.use("/api/users", UserRoutes);
```

#### Firebase SDK

Integrate the Firebase Admin SDK. Set the `databaseURL` for the Firebase integration if you need to interact with the Firebase Realtime Database. You don't need this if you're only using Firestore.

```javascript
import serviceAccount from "./config/serviceAccountKey.json" assert { type: "json" };

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "", // optional
  });
  console.log("Firebase Admin initialized");
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}
```

#### MongoDB

Connect MongoDB and make it listen to our server.

```javascript
MongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`The server is listening to port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error starting server:", error);
  });
```

Make it a habit to always add detailed error messages so that you know what is happening in case of issues.

Check out the final code with detailed comments on the [server.js file](/server/server.js).

## Step 4. Server Test

Let's try to start the server app with `npm start`. The first thing that might happen is a `MongooseServerSelectionError` if our IP isn't whitelisted yet on MongoDB Atlas. To whitelist your IP or allow access from anywhere, follow these steps:

1. Go to the MongoDB Atlas login page and log in to your account.
2. Find the cluster you are working with, and click on it.
3. In the left-hand menu, click on "Network Access".
4. Click on "Add IP Address".

Now you have two options:

**Allow Access from Anywhere:** This will add `0.0.0.0/0` to the IP whitelist, allowing connections from any IP address. This is not recommended for production due to security concerns but is useful for development.
**Add Your Current IP Address:** Click on "Add Current IP Address" to automatically add your current IP address.

5. Save changes.

Now you can start your server again and you should get this response in your terminal window:

```bash
Firebase Admin initialized
DB connected
The server is listening to port: 5000
```

To provide a clear overview of our API endpoints, I've created a separate API documentation file. This documentation summarizes all available endpoints, request/response formats, and authentication requirements. You can find this documentation here [`API_DOCUMENTATION.md`](/docs/API_DOCUMENTATION.md).

I also created a new documentation file named [`POSTMAN-API-TESTING-GUIDE.md`](/docs/POSTMAN-API-TESTING-GUIDE.md). This guide provides step-by-step instructions on how to test our API endpoints using Postman, including setup, request details for each endpoint, and tips for effective API testing.

That concludes our backend part for now and we move on with the [frontend](frontend.md).
