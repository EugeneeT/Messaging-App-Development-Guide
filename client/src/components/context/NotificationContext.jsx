// src/components/context/NotificationContext.jsx

// Import Dependencies
import React, { createContext, useState, useEffect, useContext } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Import Firestore functions for querying
import { fireDB } from "../config/firebaseConfig"; // Import Firebase database instance
import AuthContext from "./AuthContext"; // Import AuthContext for accessing current user information

// Create a new context instance for notifications
const NotificationContext = createContext();

// Custom hook to use the NotificationContext
const useNotification = () => useContext(NotificationContext);

// Provider component for managing notification-related state and data fetching
const NotificationProvider = ({ children }) => {
  const [unreadConversations, setUnreadConversations] = useState({}); // State to hold unread conversation statuses

  const { currentUser } = useContext(AuthContext); // Access the currentUser object from AuthContext using useContext

  // Effect hook to subscribe to conversation updates when currentUser changes
  useEffect(() => {
    if (!currentUser) return; // If no currentUser is available, return early (no operations)

    const { uid } = currentUser; // Extract the uid (user ID) from currentUser

    // Create a Firestore query to fetch conversations where current user is a participant
    const conversationsQuery = query(
      collection(fireDB, "conversations"), // Reference to 'conversations' collection in Firestore
      where("participantIds", "array-contains", uid) // Filter conversations where participantIds array contains uid
    );

    // Subscribe to snapshot changes in the conversationsQuery
    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const unreadStatus = {}; // Initialize an object to track unread status of conversations

      // Iterate over each document in the snapshot
      snapshot.docs.forEach((doc) => {
        const data = doc.data(); // Extract document data
        unreadStatus[doc.id] = !data.readStatus[uid]; // Determine unread status based on readStatus for current user
      });

      setUnreadConversations(unreadStatus); // Update unreadConversations state with the new unreadStatus object
    });

    // Cleanup function to unsubscribe from snapshot listener when component unmounts or currentUser changes
    return () => unsubscribe();
  }, [currentUser]); // Dependency array ensures useEffect runs when currentUser changes

  // Compute whether there are any unread messages based on unreadConversations state
  const hasUnreadMessages = Object.values(unreadConversations).some(
    (status) => status
  );

  // Provide NotificationContext.Provider to wrap children components with access to notification state
  return (
    <NotificationContext.Provider
      value={{ unreadConversations, hasUnreadMessages }} // Provide unreadConversations and hasUnreadMessages as context values
    >
      {children} {/* Render children components */}
    </NotificationContext.Provider>
  );
};

// Export NotificationProvider and useNotification hook for use in other components
export { NotificationProvider, useNotification };
export default NotificationContext; // Export the NotificationContext itself as default
