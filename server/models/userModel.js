// userModel.js

// Importing dependencies
import mongoose, { Schema } from "mongoose"; // Importing mongoose and Schema from mongoose package.
import bcryptjs from "bcryptjs"; // Importing bcryptjs for password hashing.

// Defining the user schema using the Schema constructor.
const UserSchema = new Schema(
  {
    email: {
      // Data type for email field.
      type: String,
      // Validation for email format.
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address format"],
      // Email field is required.
      required: true,
      // Email field must be unique.
      unique: true,
    },

    password: { type: String }, // Password field with String data type

    // Additional fields for user schema
    firebaseId: { type: String, unique: true, sparse: true }, // Firebase ID, must be unique and can be sparse (not all users may have it)
    fcmToken: String, // FCM token for push notifications
    displayName: { type: String }, // Display name field
    lastLogin: { type: Date }, // Last login date field
  },
  {
    // Automatic timestamps for user creation and modification.
    timestamps: true,
  }
);

// Middleware function to hash the user's password before saving it to the database.
UserSchema.pre("save", async function (next) {
  try {
    // Hashing Password
    if (this.isModified("password")) {
      // Hashing the password using bcryptjs if the password field is modified.
      const hashedPassword = await bcryptjs.hash(this.password, 10);
      // Assigning the hashed password to the password field.
      this.password = hashedPassword;
    }
    next(); // Calling next middleware or save function
  } catch (error) {
    next(error); // Passing error to the next middleware
  }
});

// Creating the User model using the schema.
const User = mongoose.model("User", UserSchema);

export default User; // Exporting the User model.
