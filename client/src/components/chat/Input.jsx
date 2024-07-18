import React, { useState, useContext, useEffect } from "react";
import { fireDB } from "../config/firebaseConfig.jsx";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import AuthContext from "../context/AuthContext.jsx";
import {
  encryptMessageForMultipleRecipients,
  importPublicKey,
} from "../utils/Encryption.jsx";

import "../style/StyleSheet.css";

const SendMessage = ({ scroll, recipientId, conversationId, selectChat }) => {
  const [message, setMessage] = useState("");
  const [recipientDisplayName, setRecipientDisplayName] = useState("");
  const [recipientPublicKey, setRecipientPublicKey] = useState(null);
  const { currentUser, userKeys } = useContext(AuthContext);

  useEffect(() => {
    const fetchRecipientInfo = async () => {
      if (recipientId) {
        try {
          const userDocRef = doc(fireDB, "users", recipientId);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            setRecipientDisplayName(userData.displayName);
            setRecipientPublicKey(await importPublicKey(userData.publicKey));
          } else {
            console.error("Recipient user document not found");
          }
        } catch (error) {
          console.error("Error fetching recipient info:", error);
        }
      }
    };
    fetchRecipientInfo();
  }, [recipientId]);

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!recipientId || !recipientPublicKey) {
      alert("Please select a valid recipient before sending a message.");
      return;
    }

    if (message.trim() === "") {
      alert("Please enter a message before sending.");
      return;
    }

    try {
      // Encrypt the message for both the sender and recipient
      const encryptedMessage = await encryptMessageForMultipleRecipients(
        message,
        [userKeys.publicKey, recipientPublicKey]
      );

      let convId = conversationId;
      if (!conversationId) {
        const newConversationRef = doc(collection(fireDB, "conversations"));
        await setDoc(newConversationRef, {
          documentId: newConversationRef.id,
          initiatedAt: serverTimestamp(),
          initiatedBy: currentUser.uid,
          lastMessage: {
            message: "Encrypted message",
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
          },
          lastUpdatedAt: serverTimestamp(),
          participants: [
            { uid: currentUser.uid, displayName: currentUser.displayName },
            { uid: recipientId, displayName: recipientDisplayName },
          ],
          participantIds: [currentUser.uid, recipientId],
          readStatus: { [currentUser.uid]: true, [recipientId]: false },
        });
        convId = newConversationRef.id;

        selectChat(convId, {
          uid: recipientId,
          displayName: recipientDisplayName,
        });
      }

      const messagesCollectionRef = collection(fireDB, "messages");
      await addDoc(messagesCollectionRef, {
        conversationId: convId,
        message: encryptedMessage, // Store the entire encrypted message package
        senderId: currentUser.uid,
        senderDisplayName: currentUser.displayName,
        recipientId,
        status: "sent",
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        delivered: false,
      });

      const conversationRef = doc(fireDB, "conversations", convId);
      await updateDoc(conversationRef, {
        lastMessage: {
          message: "Encrypted message",
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
        },
        lastUpdatedAt: serverTimestamp(),
        [`readStatus.${recipientId}`]: false,
      });

      setMessage("");
      if (scroll && scroll.current) {
        scroll.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        "Failed to send message. Please try again or contact support if the issue persists."
      );
    }
  };

  return (
    <form onSubmit={sendMessage} className="send-message">
      <label htmlFor="messageInput" hidden>
        Enter Message
      </label>
      <input
        id="messageInput"
        name="messageInput"
        type="text"
        className="form-input__input"
        placeholder={`Message ${recipientDisplayName}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button className="custom-button" type="submit">
        Send
      </button>
    </form>
  );
};

export default SendMessage;
