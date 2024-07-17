// src/components/chat/Encryption.js

import { fireDB } from "../config/firebaseConfig"; // Import Firestore database from Firebase config
import { doc, getDoc, setDoc } from "firebase/firestore"; // Import Firestore methods for document operations

// Function to generate a pair of RSA keys for encryption and decryption
const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP", // Algorithm name
      modulusLength: 2048, // Length of the key
      publicExponent: new Uint8Array([1, 0, 1]), // Public exponent
      hash: "SHA-256", // Hash function
    },
    true, // Whether the key is extractable
    ["encrypt", "decrypt"] // Key usages
  );
  return keyPair; // Return the generated key pair
};

// Function to export a public key to a Base64 encoded string
const exportPublicKey = async (publicKey) => {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey); // Export the public key
  return btoa(String.fromCharCode.apply(null, new Uint8Array(exported))); // Convert to Base64 string and return
};

// Function to export a private key to a JSON Web Key (JWK) string
const exportPrivateKey = async (privateKey) => {
  const exported = await window.crypto.subtle.exportKey("jwk", privateKey); // Export the private key
  return JSON.stringify(exported); // Convert to JSON string and return
};

// Function to import a public key from a Base64 encoded string
const importPublicKey = async (publicKeyString) => {
  try {
    const binaryDerString = atob(publicKeyString); // Decode Base64 string
    const binaryDer = new Uint8Array(binaryDerString.length); // Create Uint8Array
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i); // Convert each character to a byte
    }
    return await window.crypto.subtle.importKey(
      "spki", // Format of the key
      binaryDer, // Key data
      {
        name: "RSA-OAEP", // Algorithm name
        hash: "SHA-256", // Hash function
      },
      true, // Whether the key is extractable
      ["encrypt"] // Key usage
    );
  } catch (error) {
    console.error("Error importing public key:", error); // Log error
    throw new Error("Invalid public key format"); // Throw error
  }
};

// Function to import a private key from a JWK string
const importPrivateKey = async (privateKeyString) => {
  try {
    const jwk = JSON.parse(privateKeyString); // Parse JSON string
    return await window.crypto.subtle.importKey(
      "jwk", // Format of the key
      jwk, // Key data
      {
        name: "RSA-OAEP", // Algorithm name
        hash: "SHA-256", // Hash function
      },
      true, // Whether the key is extractable
      ["decrypt"] // Key usage
    );
  } catch (error) {
    console.error("Error importing private key:", error); // Log error
    throw new Error("Invalid private key format"); // Throw error
  }
};

// Function to generate a random AES key
const generateAESKey = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM", // Algorithm name
      length: 256, // Key length
    },
    true, // Whether the key is extractable
    ["encrypt", "decrypt"] // Key usages
  );
};

// Updated encryptMessageForMultipleRecipients function
const encryptMessageForMultipleRecipients = async (
  message,
  recipientPublicKeys
) => {
  try {
    // Generate a single AES key for the message
    const aesKey = await generateAESKey();

    // Encrypt the message once with AES
    const encoder = new TextEncoder(); // Create a new TextEncoder
    const data = encoder.encode(message); // Encode message to Uint8Array
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate random IV
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM", // Algorithm name
        iv: iv, // Initialization vector
      },
      aesKey, // AES key
      data // Data to encrypt
    );

    // Encrypt the AES key for each recipient
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey); // Export AES key
    const encryptedAesKeys = await Promise.all(
      recipientPublicKeys.map(async (publicKey) => {
        const encryptedKey = await window.crypto.subtle.encrypt(
          {
            name: "RSA-OAEP", // Algorithm name
          },
          publicKey, // Public key
          exportedAesKey // AES key
        );
        return btoa(
          String.fromCharCode.apply(null, new Uint8Array(encryptedKey)) // Convert to Base64 string
        );
      })
    );

    // Create the encrypted package
    const encryptedPackage = {
      encryptedContent: btoa(
        String.fromCharCode.apply(null, new Uint8Array(encryptedContent)) // Convert encrypted content to Base64 string
      ),
      encryptedAesKeys: encryptedAesKeys, // List of encrypted AES keys
      iv: btoa(String.fromCharCode.apply(null, iv)), // Convert IV to Base64 string
    };
    return JSON.stringify(encryptedPackage); // Return encrypted package as JSON string
  } catch (error) {
    console.error("Error in encryptMessageForMultipleRecipients:", error); // Log error
    throw new Error("Failed to encrypt message for multiple recipients"); // Throw error
  }
};

// Function to decrypt the message
const decryptMessage = async (privateKey, encryptedMessage) => {
  try {
    let encryptedPackage;
    try {
      encryptedPackage = JSON.parse(encryptedMessage); // Parse encrypted message JSON
    } catch (parseError) {
      console.error("Failed to parse encrypted message:", parseError); // Log error
      throw new Error("Invalid encrypted message format: not a valid JSON"); // Throw error
    }

    if (
      !encryptedPackage.encryptedContent || // Check for encrypted content
      !encryptedPackage.encryptedAesKeys || // Check for encrypted AES keys
      !encryptedPackage.iv // Check for IV
    ) {
      throw new Error("Invalid encrypted package structure"); // Throw error if structure is invalid
    }

    // Decrypt the AES key
    let decryptedAesKey;
    for (const encryptedAesKey of encryptedPackage.encryptedAesKeys) {
      try {
        const encryptedKeyData = new Uint8Array(
          atob(encryptedAesKey)
            .split("")
            .map((char) => char.charCodeAt(0)) // Convert Base64 string to Uint8Array
        );
        decryptedAesKey = await window.crypto.subtle.decrypt(
          { name: "RSA-OAEP" }, // Algorithm name
          privateKey, // Private key
          encryptedKeyData // Encrypted AES key
        );
        break; // If decryption succeeds, exit the loop
      } catch (error) {
        console.error("Failed to decrypt AES key, trying next one"); // Log error
      }
    }

    if (!decryptedAesKey) {
      throw new Error("Failed to decrypt any AES key"); // Throw error if no AES key could be decrypted
    }

    // Import the decrypted AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedAesKey,
      { name: "AES-GCM" }, // Algorithm name
      false, // Whether the key is extractable
      ["decrypt"] // Key usage
    );

    // Decrypt the content
    const encryptedContent = new Uint8Array(
      atob(encryptedPackage.encryptedContent)
        .split("")
        .map((char) => char.charCodeAt(0)) // Convert Base64 string to Uint8Array
    );
    const iv = new Uint8Array(
      atob(encryptedPackage.iv)
        .split("")
        .map((char) => char.charCodeAt(0)) // Convert Base64 string to Uint8Array
    );

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM", // Algorithm name
        iv: iv, // Initialization vector
      },
      aesKey, // AES key
      encryptedContent // Encrypted content
    );

    const decoder = new TextDecoder(); // Create a new TextDecoder
    const decodedMessage = decoder.decode(decryptedContent); // Decode decrypted content
    return decodedMessage; // Return decoded message
  } catch (error) {
    console.error("Detailed error in decryptMessage:", error); // Log error
    throw new Error("Failed to decrypt message: " + error.message); // Throw error
  }
};

// Function to encrypt the private key with a password
const encryptPrivateKey = async (privateKeyString, password) => {
  const encoder = new TextEncoder(); // Create a new TextEncoder
  const data = encoder.encode(privateKeyString); // Encode private key to Uint8Array
  const salt = window.crypto.getRandomValues(new Uint8Array(16)); // Generate random salt
  const key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password), // Encode password
    { name: "PBKDF2" }, // Algorithm name
    false, // Whether the key is extractable
    ["deriveKey"] // Key usage
  );
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2", // Algorithm name
      salt: salt, // Salt
      iterations: 100000, // Number of iterations
      hash: "SHA-256", // Hash function
    },
    key, // Key
    { name: "AES-GCM", length: 256 }, // Derived key algorithm and length
    false, // Whether the key is extractable
    ["encrypt"] // Key usage
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate random IV
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM", // Algorithm name
      iv: iv, // Initialization vector
    },
    derivedKey, // Derived key
    data // Data to encrypt
  );
  const encryptedData = new Uint8Array(encrypted); // Convert encrypted data to Uint8Array
  const result = new Uint8Array(salt.length + iv.length + encryptedData.length); // Create result array
  result.set(salt, 0); // Set salt
  result.set(iv, salt.length); // Set IV
  result.set(encryptedData, salt.length + iv.length); // Set encrypted data
  return btoa(String.fromCharCode.apply(null, result)); // Convert to Base64 string and return
};

// Function to decrypt the encrypted private key with a password
const decryptPrivateKey = async (encryptedPrivateKey, password) => {
  const encoder = new TextEncoder(); // Create a new TextEncoder
  const encryptedData = new Uint8Array(
    atob(encryptedPrivateKey)
      .split("")
      .map((char) => char.charCodeAt(0)) // Convert Base64 string to Uint8Array
  );
  const salt = encryptedData.slice(0, 16); // Extract salt
  const iv = encryptedData.slice(16, 28); // Extract IV
  const data = encryptedData.slice(28); // Extract encrypted data
  const key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password), // Encode password
    { name: "PBKDF2" }, // Algorithm name
    false, // Whether the key is extractable
    ["deriveKey"] // Key usage
  );
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2", // Algorithm name
      salt: salt, // Salt
      iterations: 100000, // Number of iterations
      hash: "SHA-256", // Hash function
    },
    key, // Key
    { name: "AES-GCM", length: 256 }, // Derived key algorithm and length
    false, // Whether the key is extractable
    ["decrypt"] // Key usage
  );
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM", // Algorithm name
      iv: iv, // Initialization vector
    },
    derivedKey, // Derived key
    data // Data to decrypt
  );
  const decoder = new TextDecoder(); // Create a new TextDecoder
  return decoder.decode(decrypted); // Decode and return decrypted data
};

// Function to set up user keys
const setupUserKeys = async (uid) => {
  if (!uid) {
    throw new Error("User ID is required to set up keys"); // Throw error if user ID is not provided
  }

  try {
    const keyPair = await generateKeyPair(); // Generate key pair
    const publicKeyString = await exportPublicKey(keyPair.publicKey); // Export public key
    const privateKeyString = await exportPrivateKey(keyPair.privateKey); // Export private key

    const userDocRef = doc(fireDB, "users", uid); // Get user document reference
    await setDoc(
      userDocRef,
      {
        publicKey: publicKeyString, // Set public key
        privateKey: privateKeyString, // Set private key
      },
      { merge: true } // Merge with existing document
    );

    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }; // Return key pair
  } catch (error) {
    console.error("Error setting up user keys:", error); // Log error
    throw error; // Throw error
  }
};

// Function to retrieve user keys
const getUserKeys = async (userId) => {
  const userDocRef = doc(fireDB, "users", userId); // Get user document reference
  const userDoc = await getDoc(userDocRef); // Get user document

  if (
    userDoc.exists() &&
    userDoc.data().publicKey &&
    userDoc.data().privateKey
  ) {
    try {
      const publicKey = await importPublicKey(userDoc.data().publicKey); // Import public key
      const privateKey = await importPrivateKey(userDoc.data().privateKey); // Import private key
      return { publicKey, privateKey }; // Return keys
    } catch (error) {
      console.error("Error importing keys:", error); // Log error
      throw new Error("Failed to import user keys"); // Throw error
    }
  } else {
    throw new Error("User keys not found"); // Throw error if keys are not found
  }
};

// Function to initialize user keys
const initializeKeys = async (uid, publicKeyString, privateKeyString) => {
  if (!uid) {
    throw new Error("User ID is required to initialize keys"); // Throw error if user ID is not provided
  }

  try {
    const userDocRef = doc(fireDB, "users", uid); // Get user document reference
    await setDoc(
      userDocRef,
      {
        publicKey: publicKeyString, // Set public key
        privateKey: privateKeyString, // Set private key
      },
      { merge: true } // Merge with existing document
    );

    // Store the public key in local storage or state management
    localStorage.setItem(`publicKey_${uid}`, publicKeyString); // Store public key in local storage
    return { publicKey: publicKeyString, privateKey: privateKeyString }; // Return keys
  } catch (error) {
    console.error("Error initializing keys:", error); // Log error
    throw error; // Throw error
  }
};

export {
  generateKeyPair, // Export generateKeyPair function
  exportPublicKey, // Export exportPublicKey function
  exportPrivateKey, // Export exportPrivateKey function
  importPublicKey, // Export importPublicKey function
  importPrivateKey, // Export importPrivateKey function
  generateAESKey, // Export generateAESKey function
  encryptMessageForMultipleRecipients, // Export encryptMessageForMultipleRecipients function
  decryptMessage, // Export decryptMessage function
  encryptPrivateKey, // Export encryptPrivateKey function
  decryptPrivateKey, // Export decryptPrivateKey function
  setupUserKeys, // Export setupUserKeys function
  getUserKeys, // Export getUserKeys function
  initializeKeys, // Export initializeKeys function
};
