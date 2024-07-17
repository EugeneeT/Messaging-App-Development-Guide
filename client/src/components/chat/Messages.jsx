import React, { useEffect, useState, useContext } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { fireDB } from "../config/firebaseConfig";
import AuthContext from "../context/AuthContext";
import { decryptMessage } from "../utils/Encryption";

import "../style/StyleSheet.css";

const Message = ({ conversationId, scrollRef, otherUserName }) => {
  const [messages, setMessages] = useState([]);
  const { currentUser, userKeys } = useContext(AuthContext);

  useEffect(() => {
    if (!conversationId || !currentUser || !userKeys) {
      setMessages([]); // Reset messages when changing conversations
      return;
    }

    const q = query(
      collection(fireDB, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messageList = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let decryptedMessage = "";
          let decryptionError = null;
          try {
            decryptedMessage = await decryptMessage(
              userKeys.privateKey,
              data.message
            );
          } catch (error) {
            console.error(
              "Error decrypting message for doc ID:",
              doc.id,
              error
            );
            decryptionError = error.message;
          }
          return {
            id: doc.id,
            ...data,
            decryptedMessage,
            decryptionError,
          };
        })
      );
      setMessages(messageList);

      // Mark messages as delivered and read
      messageList.forEach((message) => {
        if (message.senderId !== currentUser.uid) {
          updateDoc(doc(fireDB, "messages", message.id), {
            delivered: true,
            readBy: message.readBy.includes(currentUser.uid)
              ? message.readBy
              : [...message.readBy, currentUser.uid],
          });
        }
      });

      if (scrollRef && scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    });

    return () => unsubscribe();
  }, [conversationId, currentUser, userKeys, scrollRef]);

  const getMessageStatus = (message) => {
    if (message.senderId === currentUser.uid) {
      if (message.readBy.includes(message.recipientId)) return "Read";
      if (message.delivered) return "Delivered";
      return "Sent";
    }
    return "";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const formattedDate = date.toLocaleDateString("en-GB").replace(/\//g, ".");
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} ${formattedTime}`;
  };

  if (messages.length === 0) {
    return (
      <div className="new-conversation-prompt">
        Start a conversation with {otherUserName}
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message ${
            msg.senderId === currentUser.uid ? "sent" : "received"
          }`}
        >
          <div className="message-content">
            {msg.decryptionError ? (
              <span style={{ color: "red" }}>Error: {msg.decryptionError}</span>
            ) : (
              msg.decryptedMessage
            )}
          </div>
          <div className="message-timestamp">
            {formatTimestamp(msg.timestamp)}
          </div>
          <div className="message-status">{getMessageStatus(msg)}</div>
        </div>
      ))}
    </div>
  );
};

export default Message;
