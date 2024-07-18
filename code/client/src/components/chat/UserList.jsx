// src/components/chat/UserList.jsx

// Import Dependencies
import React, { useEffect, useState, useContext } from "react"; // Import necessary dependencies from React
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore"; // Import Firestore functions from Firebase
import { fireDB } from "../config/firebaseConfig.jsx"; // Import Firebase database instance
import AuthContext from "../context/AuthContext.jsx"; // Import authentication context
import { useNotification } from "../context/NotificationContext.jsx"; // Import notification context
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import FontAwesome icon component
import { faEnvelope, faBars } from "@fortawesome/free-solid-svg-icons"; // Import specific FontAwesome icons

// Styling
import "../style/StyleSheet.css"; // Import component styles

const OFFLINE_THRESHOLD = 180000; // Define offline threshold (3 minutes in milliseconds)

const ChatUserList = ({ selectChat }) => {
  // Define ChatUserList component, accepting selectChat prop
  const [conversations, setConversations] = useState([]); // State for storing conversations
  const [allUsers, setAllUsers] = useState([]); // State for storing all users
  const [selectedChatId, setSelectedChatId] = useState(null); // State for storing selected chat ID
  const [error, setError] = useState(null); // State for storing error messages
  const [loading, setLoading] = useState(true); // State for tracking loading status
  const { currentUser } = useContext(AuthContext); // Get current user from AuthContext
  const { unreadConversations } = useNotification(); // Get unread conversations from NotificationContext
  const [showOverlay, setShowOverlay] = useState(false); // State for controlling overlay visibility

  useEffect(() => {
    // Use effect hook for side effects
    if (!currentUser) {
      // If no current user, set loading to false and return
      setLoading(false);
      return;
    }

    const fetchAllUsers = () => {
      // Function to fetch all users
      const usersQuery = query(collection(fireDB, "users")); // Create query for users collection
      return onSnapshot(
        // Set up real-time listener for users
        usersQuery,
        (snapshot) => {
          // On successful snapshot
          const userList = snapshot.docs // Map snapshot to user list
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((user) => user.id !== currentUser.uid); // Filter out current user
          setAllUsers(userList); // Update allUsers state
          setLoading(false); // Set loading to false
        },
        (error) => {
          // On error
          console.error("Error fetching users:", error); // Log error
          setError("Failed to load user list. Please try again later."); // Set error message
          setLoading(false); // Set loading to false
        }
      );
    };

    const fetchConversations = () => {
      // Function to fetch conversations
      const conversationsQuery = query(
        // Create query for conversations
        collection(fireDB, "conversations"),
        where("participantIds", "array-contains", currentUser.uid),
        orderBy("lastUpdatedAt", "desc")
      );

      return onSnapshot(
        // Set up real-time listener for conversations
        conversationsQuery,
        (snapshot) => {
          // On successful snapshot
          const conversationList = snapshot.docs.map((doc) => ({
            // Map snapshot to conversation list
            id: doc.id,
            ...doc.data(),
            otherUser: doc
              .data()
              .participants.find((p) => p.uid !== currentUser.uid),
          }));
          setConversations(conversationList); // Update conversations state
          setError(null); // Clear any existing errors
        },
        (error) => {
          // On error
          console.error("Error fetching conversations:", error); // Log error
          setError("Failed to load conversations. Please try again later."); // Set error message
        }
      );
    };

    const unsubscribeUsers = fetchAllUsers(); // Fetch users and store unsubscribe function
    const unsubscribeConversations = fetchConversations(); // Fetch conversations and store unsubscribe function

    return () => {
      // Cleanup function
      unsubscribeUsers(); // Unsubscribe from users listener
      unsubscribeConversations(); // Unsubscribe from conversations listener
    };
  }, [currentUser]); // Dependency array, effect runs when currentUser changes

  const isUserOnline = (user) => {
    // Function to check if a user is online
    if (!user || !user.lastHeartbeat) return false; // If no user or heartbeat, return false
    const lastHeartbeat = // Get last heartbeat timestamp
      user.lastHeartbeat.toDate?.().getTime() || user.lastHeartbeat;
    return (
      // Return true if user is online and last heartbeat is within threshold
      user.online &&
      lastHeartbeat &&
      Date.now() - lastHeartbeat < OFFLINE_THRESHOLD
    );
  };

  const handleSelectChat = async (chat) => {
    // Function to handle chat selection
    setSelectedChatId(chat.id); // Set selected chat ID
    selectChat(chat.id, chat.otherUser, false); // Call selectChat prop function
    setShowOverlay(false); // Hide overlay

    // Update read status
    if (unreadConversations[chat.id]) {
      // If conversation is unread
      const conversationRef = doc(fireDB, "conversations", chat.id); // Get conversation reference
      await updateDoc(conversationRef, {
        // Update conversation document
        [`readStatus.${currentUser.uid}`]: true, // Set read status to true for current user
      });
    }
  };

  const handleSelectUser = async (user) => {
    // Function to handle user selection
    const existingConversation = conversations.find(
      // Find existing conversation with user
      (conv) => conv.otherUser.uid === user.id
    );
    if (existingConversation) {
      // If conversation exists
      handleSelectChat(existingConversation); // Select existing chat
    } else {
      // If no existing conversation
      try {
        const newConversationRef = await addDoc(
          // Create new conversation document
          collection(fireDB, "conversations"),
          {
            participantIds: [currentUser.uid, user.id], // Set participant IDs
            participants: [
              // Set participant details
              { uid: currentUser.uid, displayName: currentUser.displayName },
              { uid: user.id, displayName: user.displayName },
            ],
            lastUpdatedAt: serverTimestamp(), // Set last updated timestamp
            createdAt: serverTimestamp(), // Set creation timestamp
            readStatus: { [currentUser.uid]: true, [user.id]: true }, // Set initial read status
          }
        );

        const newConversation = {
          // Create new conversation object
          id: newConversationRef.id,
          otherUser: { uid: user.id, displayName: user.displayName },
          participantIds: [currentUser.uid, user.id],
          participants: [
            { uid: currentUser.uid, displayName: currentUser.displayName },
            { uid: user.id, displayName: user.displayName },
          ],
          lastUpdatedAt: new Date(),
          createdAt: new Date(),
          unread: false,
        };

        setConversations([newConversation, ...conversations]); // Add new conversation to state
        selectChat(
          // Call selectChat prop function with new conversation
          newConversationRef.id,
          { uid: user.id, displayName: user.displayName },
          true
        );
      } catch (error) {
        // If error occurs
        console.error("Error creating new conversation:", error); // Log error
        setError("Failed to create new conversation. Please try again."); // Set error message
      }
    }
    setShowOverlay(false); // Hide overlay
  };

  const toggleOverlay = () => {
    // Function to toggle overlay visibility
    setShowOverlay(!showOverlay); // Toggle showOverlay state
  };

  const sortedUsers = [...allUsers].sort((a, b) => {
    // Sort users by online status and name
    const aOnline = isUserOnline(a);
    const bOnline = isUserOnline(b);
    if (aOnline === bOnline) {
      return a.displayName.localeCompare(b.displayName);
    }
    return aOnline ? -1 : 1;
  });

  if (loading) {
    // If loading, render loading message
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // If no current user, render login message
    return <div>Please log in to see your chats.</div>;
  }

  if (error) {
    // If error, render error message with refresh button
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  return (
    <div
      className={`user-chats-container ${showOverlay ? "show-overlay" : ""}`}
    >
      <div className="user-chats">
        <div className="half-container">
          <h3>Your Conversations</h3>
          <div className="list-container">
            {conversations.length > 0 ? (
              conversations.map((chat) => {
                const otherUser = allUsers.find(
                  (user) => user.id === chat.otherUser?.uid
                );
                return (
                  <div
                    key={chat.id}
                    className={`chat-item ${
                      chat.id === selectedChatId ? "selected" : ""
                    } ${
                      otherUser && isUserOnline(otherUser)
                        ? "online"
                        : "offline"
                    }`}
                    onClick={() => handleSelectChat(chat)}
                  >
                    {chat.otherUser?.displayName || "Unknown User"}
                    {unreadConversations[chat.id] && (
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="unread-icon"
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <p>No conversations yet.</p>
            )}
          </div>
        </div>
        <div className="half-container">
          <h3>All Users</h3>
          <div className="list-container">
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <div
                  key={user.id}
                  className={`user-item ${
                    isUserOnline(user) ? "online" : "offline"
                  }`}
                  onClick={() => handleSelectUser(user)}
                >
                  {user.displayName || "Unknown User"}
                </div>
              ))
            ) : (
              <p>No other users found.</p>
            )}
          </div>
        </div>
      </div>
      <div className="mobile-button-container">
        <button className="mobile-button" onClick={toggleOverlay}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>
    </div>
  );
};

export default ChatUserList;

// return with comments
// return (
//   <div className={`user-chats-container ${showOverlay ? "show-overlay" : ""}`}>
//     {/* Main container for the entire chat application */}
//     <div className="user-chats">
//       {/* Container for the user chats */}
//       <div className="half-container">
//         <h3>Your Conversations</h3>
//         {/* Header for the user's conversations */}
//         <div className="list-container">
//           {/* Container for the list of conversations */}
//           {conversations.length > 0 ? (
//             // Conditional rendering: Render if there are conversations
//             conversations.map((chat) => {
//               const otherUser = allUsers.find(
//                 (user) => user.id === chat.otherUser?.uid
//               );
//               return (
//                 <div
//                   key={chat.id}
//                   className={`chat-item ${chat.id === selectedChatId ? "selected" : ""} ${otherUser && isUserOnline(otherUser) ? "online" : "offline"}`}
//                   // Chat item representing each conversation
//                   onClick={() => handleSelectChat(chat)}
//                 >
//                   {chat.otherUser?.displayName || "Unknown User"}
//                   {/* Display the name of the other user in the conversation */}
//                   {unreadConversations[chat.id] && (
//                     <FontAwesomeIcon icon={faEnvelope} className="unread-icon" />
//                     // Show unread icon if there are unread messages
//                   )}
//                 </div>
//               );
//             })
//           ) : (
//             // Render if there are no conversations
//             <p>No conversations yet.</p>
//           )}
//         </div>
//       </div>
//       <div className="half-container">
//         <h3>All Users</h3>
//         {/* Header for all users */}
//         <div className="list-container">
//           {/* Container for the list of all users */}
//           {sortedUsers.length > 0 ? (
//             // Conditional rendering: Render if there are sorted users
//             sortedUsers.map((user) => (
//               <div
//                 key={user.id}
//                 className={`user-item ${isUserOnline(user) ? "online" : "offline"}`}
//                 // User item representing each user
//                 onClick={() => handleSelectUser(user)}
//               >
//                 {user.displayName || "Unknown User"}
//                 {/* Display the name of the user */}
//               </div>
//             ))
//           ) : (
//             // Render if there are no sorted users
//             <p>No other users found.</p>
//           )}
//         </div>
//       </div>
//     </div>
//     <div className="mobile-button-container">
//       {/* Container for the mobile button */}
//       <button className="mobile-button" onClick={toggleOverlay}>
//         {/* Button to toggle overlay */}
//         <FontAwesomeIcon icon={faBars} />
//         {/* Font Awesome icon for bars (hamburger menu) */}
//       </button>
//     </div>
//   </div>
// );
