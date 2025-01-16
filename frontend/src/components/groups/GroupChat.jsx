import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";

import MessageSkeleton from "../skeletons/MessageSkeleton";
import axios from "axios";

const GroupChat = () => {
  const chatBoxRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [participants, setParticipants] = useState([]);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const socket = useAuthStore.getState().socket;
  const { selectedGroup } = useChatStore();
  const currentUser = () => useAuthStore.getState().authUser?._id;
  const currentUserdata = () => useAuthStore.getState().authUser;
  const joinGroup = useChatStore((state) => state.joinGroup);
  const leaveGroup = useChatStore((state) => state.leaveGroup);
  const handleUserLeft = useChatStore((state) => state.handleUserLeft);
  const sendMessage = useChatStore((state) => state.sendGroupMessage);

  console.log("Selected Group ID:", selectedGroup?._id);
  console.log("currrent user data:", currentUserdata());
  useEffect(() => {
    if (!selectedGroup) {
      console.log("No group selected.");
      return;
    }

    console.log("Joining group:", selectedGroup._id);

    joinGroup(selectedGroup._id, currentUser());

    const fetchGroupMessages = async () => {
      try {
        console.log("Fetching group messages for group:", selectedGroup._id);
        const response = await axios.get(
          `http://localhost:5001/api/groups/${selectedGroup._id}/messages`
        );
        console.log("Group messages fetched:", response.data.messages);
        setMessages(
          response.data.messages.map((msg) => ({
            message: msg.message,
            sender: {
              _id: msg._id,
              fullName: msg.fullName,
              profilePic: msg.profilePic,
            },
            timestamp: msg.timestamp,
          }))
        );
      } catch (error) {
        console.error("Error fetching group messages:", error);
      }
    };

    const fetchParticipants = async () => {
      try {
        console.log("Fetching participants for group:", selectedGroup._id);
        const response = await axios.get(
          `http://localhost:5001/api/groups/${selectedGroup._id}/participants`
        );
        console.log("Participants fetched:", response.data.participants);
        setParticipants(response.data.participants);
      } catch (error) {
        console.error("Error fetching group participants:", error);
      }
    };

    fetchGroupMessages();
    fetchParticipants();

    const handleMessageReceived = (data) => {
      console.log("Received group message:", data);
      if (data.groupId === selectedGroup._id) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            message: data.message,
            sender: {
              _id: data.senderId,
              fullName: data.fullName,
              profilePic: data.profilePic,
            },
            timestamp: data.timestamp,
          },
        ]);
        scrollToBottom();
      }
    };

    socket.on("receive-group-message", handleMessageReceived);
    socket.on("user-left-group", (data) =>
      handleUserLeft(data, selectedGroup, setParticipants, setCanSendMessage)
    );

    return () => {
      console.log("Cleaning up listeners for group:", selectedGroup._id);
      socket.off("receive-group-message", handleMessageReceived);
      socket.off("user-left-group");
    };
  }, [selectedGroup, joinGroup, handleUserLeft, currentUser()]);

  const handleSendMessage = () => {
    if (!canSendMessage) {
      console.log("You can't send messages, you left the group.");
      return;
    }

    if (!selectedGroup || !messageInput.trim()) {
      console.log(
        "Cannot send message. Either no group selected or message input is empty."
      );
      return;
    }
    const userData = currentUserdata();

    const messageData = {
      groupId: selectedGroup._id,
      senderId: userData._id,
      fullName: userData.fullName, // Include fullName
      profilePic: userData.profilePic, // Include profilePic
      message: messageInput,
      timestamp: new Date().toISOString(),
    };

    console.log("Sending message data:", messageData);

    // Emit the message using the store
    sendMessage(messageData);
    console.log("Message sent:", messageData);
    // Update local state for messages
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message: messageInput,
        sender: {
          _id: userData._id,
          fullName: userData.fullName,
          profilePic: userData.profilePic,
        },
        timestamp: new Date().toISOString(),
      },
    ]);
    scrollToBottom();
    setMessageInput("");
  };

  const handleLeaveGroup = () => {
    console.log("Leaving group:", selectedGroup._id);
    leaveGroup(selectedGroup._id, currentUser());
    setCanSendMessage(false);
  };
  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom(); // Scroll to bottom on initial load or when messages update
  }, [messages]);

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <MessageSkeleton />
        <CustomMessageInput
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onSend={handleSendMessage}
          disabled={!canSendMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      
      <div className="flex items-center justify-between p-4 bg-base-200 border-b border-base-300">
        <h2 className="text-xl font-semibold">{selectedGroup.groupName}</h2>
        <button onClick={handleLeaveGroup} className="btn btn-error">
          Leave Group
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatBoxRef}>
        <div className="participants-list mb-4">
          <h3 className="text-lg font-semibold">Participants</h3>
          {participants.length > 0 ? (
            <ul className="list-disc pl-5">
              {participants.map((participant) => (
                <li key={participant._id}>
                  <strong>{participant.fullName}</strong> ({participant.email})
                </li>
              ))}
            </ul>
          ) : (
            <p>No participants found.</p>
          )}
        </div>

        {Array.isArray(messages) &&
          messages.map((msg, index) => (
            <div key={index} className="chat chat-start">
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={msg.sender?.profilePic || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <span className="font-semibold">
                  {msg.sender?.fullName || "Unknown"}
                </span>
                <time className="text-xs opacity-50 ml-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {msg.message && <p>{msg.message}</p>}
              </div>
            </div>
          ))}
      </div>

      <div className="p-4 border-t border-base-300">
        <CustomMessageInput
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onSend={handleSendMessage}
          disabled={!canSendMessage}
        />
      </div>
    </div>
  );
};

const CustomMessageInput = ({ value, onChange, onSend, disabled }) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder="Type your message"
        className="input input-bordered flex-1"
        disabled={disabled}
      />
      <button onClick={onSend} className="btn btn-primary" disabled={disabled}>
        Send
      </button>
    </div>
  );
};

export default GroupChat;
