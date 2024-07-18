// src/components/context/AuthContext.jsx

// Import React and necessary hooks from the 'react' package
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
// Import Firebase authentication functions
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
// Import Firestore functions for database operations
import { doc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore";
// Import custom utility functions for user key management
import { getUserKeys, setupUserKeys } from "../utils/Encryption.jsx";

// Create a new context for authentication
const AuthContext = createContext();

// Define constants for timing-related operations
const HEARTBEAT_INTERVAL = 45000; // 45 seconds between each heartbeat
const INACTIVITY_THRESHOLD = 180000; // 3 minutes of inactivity before user is considered offline
const STATUS_UPDATE_THROTTLE = 10000; // 10 seconds minimum between status updates

// Define the AuthProvider component
const AuthProvider = ({ children }) => {
  // State hook for storing the current user
  const [currentUser, setCurrentUser] = useState(null);
  // State hook for storing user encryption keys
  const [userKeys, setUserKeys] = useState(null);
  // State hook for storing the timestamp of the last heartbeat
  const [lastHeartbeat, setLastHeartbeat] = useState(null);

  // Ref for storing the inactivity timer
  const inactivityTimerRef = useRef(null);
  // Ref for storing the timestamp of the last status update
  const lastStatusUpdateRef = useRef(0);

  // Function to update user status in Firestore
  const updateUserStatus = useCallback(
    async (isOnline, bypassThrottle = false) => {
      // Check if there is a current user
      if (currentUser) {
        // Get the current timestamp
        const now = Date.now();
        // Check if we should update (either bypassing throttle or enough time has passed)
        if (
          bypassThrottle ||
          now - lastStatusUpdateRef.current > STATUS_UPDATE_THROTTLE
        ) {
          try {
            // Get Firestore instance
            const db = getFirestore();
            // Create a reference to the user document
            const userRef = doc(db, "users", currentUser.uid);
            // Prepare user status object
            const userStatus = {
              online: isOnline,
              lastHeartbeat: serverTimestamp(),
            };
            // Update user status in Firestore
            await setDoc(userRef, userStatus, { merge: true });
            // Log success message
            console.log("User status updated successfully.");
            // Update last heartbeat state
            setLastHeartbeat(now);
            // Update last status update timestamp
            lastStatusUpdateRef.current = now;
          } catch (error) {
            // Log error if status update fails
            console.error("Error updating user status: ", error);
          }
        }
      }
    },
    [currentUser] // Dependency array for useCallback
  );

  // Function to reset the inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer if it exists
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Set new timer
    inactivityTimerRef.current = setTimeout(() => {
      updateUserStatus(false);
    }, INACTIVITY_THRESHOLD);
  }, [updateUserStatus]); // Dependency array for useCallback

  // Function to handle user activity
  const handleUserActivity = useCallback(() => {
    // Check if there is a current user
    if (currentUser) {
      // Update user status to online
      updateUserStatus(true);
      // Reset inactivity timer
      resetInactivityTimer();
    }
  }, [currentUser, updateUserStatus, resetInactivityTimer]); // Dependency array for useCallback

  // Function to handle user logout
  const logout = useCallback(async () => {
    // Get Firebase Auth instance
    const auth = getAuth();
    try {
      // Update user status to offline immediately, bypassing the throttle
      await updateUserStatus(false, true);
      // Clear the inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      // Sign out from Firebase
      await signOut(auth);
      // Clear the current user state
      setCurrentUser(null);
      // Clear last heartbeat state
      setLastHeartbeat(null);
      // Clear user keys state
      setUserKeys(null);
    } catch (error) {
      // Log error if logout fails
      console.error("Error during logout:", error);
    }
  }, [updateUserStatus]); // Dependency array for useCallback

  // Effect for auth state changes
  useEffect(() => {
    // Get Firebase Auth instance
    const auth = getAuth();
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Set current user state
        setCurrentUser(user);
        try {
          // Attempt to fetch user keys
          const keys = await getUserKeys(user.uid);
          // Set user keys state
          setUserKeys(keys);
        } catch (error) {
          // Log error if fetching keys fails
          console.error("Error fetching user keys:", error);
          // Set up new keys if fetching fails
          const newKeys = await setupUserKeys(user.uid);
          // Set new user keys state
          setUserKeys(newKeys);
        }
        // Update user status to online
        await updateUserStatus(true);
      } else {
        // If there was a previous user, update their status to offline
        if (currentUser) {
          await updateUserStatus(false);
        }
        // Clear current user state
        setCurrentUser(null);
        // Clear user keys state
        setUserKeys(null);
        // Clear last heartbeat state
        setLastHeartbeat(null);
      }
    });
    // Return cleanup function
    return () => unsubscribe();
  }, [updateUserStatus, currentUser]); // Dependency array for useEffect

  // Effect for heartbeat and activity listeners
  useEffect(() => {
    // Variable to store interval ID
    let heartbeatInterval;
    // Check if there is a current user
    if (currentUser) {
      // Set up interval for heartbeat
      heartbeatInterval = setInterval(() => {
        // Only update status if the document is visible
        if (!document.hidden) {
          updateUserStatus(true);
        }
      }, HEARTBEAT_INTERVAL);
      // Add event listener for user activity
      window.addEventListener("keydown", handleUserActivity);
      // Reset inactivity timer
      resetInactivityTimer();
    }
    // Cleanup function
    return () => {
      // Clear heartbeat interval
      clearInterval(heartbeatInterval);
      // Remove event listener
      window.removeEventListener("keydown", handleUserActivity);
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentUser, handleUserActivity, resetInactivityTimer, updateUserStatus]); // Dependency array for useEffect

  // Memoized value for user online status
  const isOnline = useMemo(() => {
    return (
      !!currentUser && // Check if current user exists
      lastHeartbeat && // Check if there's a last heartbeat
      Date.now() - lastHeartbeat < INACTIVITY_THRESHOLD // Check if last heartbeat is within the inactivity threshold
    );
  }, [currentUser, lastHeartbeat]); // Dependency array for useMemo

  // Memoized value for the context
  const value = useMemo(
    () => ({
      currentUser, // Current user object
      userKeys, // User encryption keys
      setUserKeys, // Function to set user keys
      lastHeartbeat, // Timestamp of last heartbeat
      isOnline, // Boolean indicating if user is online
      logout, // Function to logout user
    }),
    [currentUser, userKeys, lastHeartbeat, isOnline, logout] // Dependency array for useMemo
  );

  // Render the AuthContext.Provider with the memoized value
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the AuthProvider component
export { AuthProvider };
// Export the AuthContext as the default export
export default AuthContext;
