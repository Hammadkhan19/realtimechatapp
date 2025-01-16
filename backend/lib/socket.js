import { Server } from "socket.io";
import http from "http";
import express from "express";
import Group from "../models/group.js";
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Local environment
      "https://hellochat-eta.vercel.app", // Replace with your Vercel frontend domain
    ],
    methods: ["GET", "POST"], // Allowed HTTP methods
    credentials: true, // Allow cookies and authorization headers
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Used to store online users
const userSocketMap = {}; // {userId: socketId}
const groupMembers = new Map(); // {userId: [socketId]}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Group Logic

  // Join group
  socket.on("join-group", async ({ groupId, userId }) => {
    console.log("Received groupId:", groupId, "userId:", userId);
    try {
      const group = await Group.findById(groupId);
      const userIdStr = userId.toString(); // Ensure userId is a string
      if (group && group.participants.includes(userIdStr)) {
        // Map userId to the socket.id
        if (!groupMembers.has(userIdStr)) {
          groupMembers.set(userIdStr, []);
        }
        groupMembers.get(userIdStr).push(socket.id);

        console.log(`User ${userId} joined group ${groupId}`);
        console.log("Current group members map:", groupMembers);
      } else {
        console.log(`User ${userId} is not part of group ${groupId}`);
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  });

  // Leave group
  socket.on("leave-group", async ({ groupId, userId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        console.error("Group not found");
        return;
      }

      // Remove user from participants
      const userIndex = group.participants.indexOf(userId);
      if (userIndex !== -1) {
        group.participants.splice(userIndex, 1); // Remove user from participants
        await group.save();

        // Remove user's socket from the groupMembers map
        const userSockets = groupMembers.get(userId.toString()) || [];
        userSockets.forEach((socketId) => {
          io.sockets.sockets.get(socketId)?.leave(groupId); // Remove socket from group
        });

        // Remove user from the map entirely if no sockets are left
        groupMembers.delete(userId.toString());

        console.log(`User ${userId} left the group ${groupId}`);
      }

      // Notify others that the user left
      socket.broadcast.to(groupId).emit("user-left-group", { userId, groupId });
    } catch (error) {
      console.error("Error handling user leaving group:", error);
    }
  });

  // Send message to group
  socket.on("send-group-message", async (data) => {
    const {
      groupId,
      sender: senderId,
      message,
      fullName,
      profilePic,
      timestamp,
    } = data;
    console.log("Received send-group-message event:", data); // Incoming data
    // Validate or replace timestamp
    const messageTimestamp = timestamp ? new Date(timestamp) : new Date();
    console.log("Received message data:", data); // Debug log for incoming message

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        console.error("Group not found for ID:", groupId);
        return; // Exit if group is not found
      }

      // Save the message to the group's messages array
      group.messages.push({
        sender: senderId,
        message,
        fullName,
        profilePic,
        timestamp: messageTimestamp,
      });
      await group.save();
      console.log("Message saved to group:", group.groupName);

      // Broadcast message to group members
      group.participants.forEach((userId) => {
        const userIdStr = userId.toString();
        console.log("Raw userId:", userId);
        console.log("Stringified userId:", userId.toString()); // Log for each participant
        const sockets = groupMembers.get(userIdStr) || [];
        console.log("Sockets for user:", userIdStr, sockets);
        sockets.forEach((socketId) => {
          console.log("Sending message to socket:", socketId);
          if (socketId !== socket.id) {
            // Log for each socket
            io.to(socketId).emit("receive-group-message", {
              senderId,
              message,
              timestamp: messageTimestamp.toISOString(),
              groupId,
              fullName,
              profilePic,
            });
          }
        });
      });
    } catch (error) {
      console.error("Error handling group message:", error);
    }
  });

  // Disconnect Logic
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    // Remove the socket from userSocketMap
    let userId = null;
    for (const [key, value] of Object.entries(userSocketMap)) {
      if (value === socket.id) {
        userId = key;
        delete userSocketMap[key];
        break;
      }
    }

    // Broadcast updated online users list
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Remove the socket from all group members
    groupMembers.forEach((members, groupId) => {
      const updatedMembers = members.filter((id) => id !== socket.id);
      groupMembers.set(groupId, updatedMembers);

      // Optionally log updated group members
      console.log(`Updated members of group ${groupId}:`, updatedMembers);
    });

    console.log("Socket cleanup complete for:", socket.id);
  });
});

export { io, app, server };
