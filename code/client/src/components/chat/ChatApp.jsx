// src/components//chat/ChatApp.jsx

// Import Dependencies
import React, { useState, useContext, useRef, useEffect } from "react"; // Import necessary dependencies from React
import AuthContext from "../context/AuthContext.jsx"; // Import the AuthContext for user authentication
import ChatUserList from "./UserList.jsx"; // Import ChatUserList component
import Message from "./Messages.jsx"; // Import Message component
import SendMessage from "./Input.jsx"; // Import SendMessage component

// Styling
import "../style/StyleSheet.css"; // Importing Styling component

const MessageApp = () => {
  // Define the main MessageApp component
  const [selectedConversation, setSelectedConversation] = useState(null); // State for currently selected conversation
  const [otherUserId, setOtherUserId] = useState(null); // State for the ID of the user we're chatting with
  const [otherUserName, setOtherUserName] = useState(null); // State for the name of the user we're chatting with
  const { currentUser, userKeys } = useContext(AuthContext); // Get current user and user keys from AuthContext
  const scrollRef = useRef(null); // Create a ref for scrolling to the bottom of the chat

  const selectChat = (conversationId, otherUser, isNew = false) => {
    // Function to select a chat conversation
    if (otherUser && otherUser.uid) {
      // Check if the other user is valid
      setSelectedConversation(conversationId); // Set the selected conversation ID
      setOtherUserId(otherUser.uid); // Set the ID of the other user
      setOtherUserName(otherUser.displayName); // Set the name of the other user
    } else {
      console.error("Invalid user selected:", otherUser); // Log an error if the user is invalid
      alert("Please select a valid user to start a conversation."); // Alert the user to select a valid user
    }
  };

  useEffect(() => {
    // Effect to scroll to the bottom of the chat when the conversation changes
    if (scrollRef.current) {
      // Check if the scroll ref is available
      scrollRef.current.scrollIntoView({ behavior: "smooth" }); // Scroll to the bottom of the chat smoothly
    }
  }, [selectedConversation]); // This effect runs when selectedConversation changes

  if (!currentUser) {
    // If there's no current user, show a login message
    return <div>Please log in to see your chats.</div>;
  }

  if (!userKeys) {
    // If user keys are not loaded, show a loading message
    return <div>Loading encryption keys...</div>;
  }

  return (
    <div className="message-page">
      <div className="user-chats-container">
        <ChatUserList selectChat={selectChat} />
      </div>
      <div className="message-area">
        {otherUserId ? (
          <>
            <div className="message-display">
              <Message
                conversationId={selectedConversation}
                scrollRef={scrollRef}
                privateKey={userKeys.privateKey}
                otherUserName={otherUserName}
              />
              <div ref={scrollRef}></div>
            </div>
            <div className="message-input">
              <SendMessage
                scroll={scrollRef}
                recipientId={otherUserId}
                conversationId={selectedConversation}
                publicKey={userKeys.publicKey}
                selectChat={selectChat}
              />
            </div>
          </>
        ) : (
          <div className="no-conversation">
            Select a conversation or user to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageApp; // Export the MessageApp component as the default export

// return with comments
// return ( // Begin the JSX return statement for the component
//   <div className="message-page"> // Main container for the entire chat application
//     <div className="user-chats-container"> // Container for the list of user chats
//       <ChatUserList selectChat={selectChat} /> // Render ChatUserList component, passing selectChat function as prop
//     </div>
//     <div className="message-area"> // Container for the active chat area
//       {otherUserId ? ( // Conditional rendering based on whether a chat is selected
//         <> // React Fragment to group multiple elements without adding extra nodes to the DOM
//           <div className="message-display"> // Container for displaying messages
//             <Message // Render the Message component
//               conversationId={selectedConversation} // Pass the ID of the selected conversation
//               scrollRef={scrollRef} // Pass the scroll reference for automatic scrolling
//               privateKey={userKeys.privateKey} // Pass the user's private key for decryption
//               otherUserName={otherUserName} // Pass the name of the other user in the conversation
//             />
//             <div ref={scrollRef}></div> // Empty div with scroll reference for scrolling to bottom of messages
//           </div>
//           <div className="message-input"> // Container for the message input area
//             <SendMessage // Render the SendMessage component
//               scroll={scrollRef} // Pass the scroll reference for automatic scrolling after sending
//               recipientId={otherUserId} // Pass the ID of the message recipient
//               conversationId={selectedConversation} // Pass the ID of the current conversation
//               publicKey={userKeys.publicKey} // Pass the user's public key for encryption
//               selectChat={selectChat} // Pass the selectChat function for creating new conversations
//             />
//           </div>
//         </>
//       ) : ( // If no chat is selected (otherUserId is null)
//         <div className="no-conversation"> // Container for the "no conversation selected" message
//           Select a conversation or user to start messaging // Instructional text for the user
//         </div>
//       )}
//     </div>
//   </div>
// );
