import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import GroupRoutes from "./routes/group.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;

const allowedOrigins = [// Production URL
  "http://localhost:5173", // Local development URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Always allow the origin if credentials are involved
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true); // Accept the origin
      }
      return callback(new Error("Not allowed by CORS")); // Reject the origin
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies and authentication headers
    preflightContinue: false, // Stop preflight requests from being processed by this middleware
  })
);

app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.status(200).send("Backend is running successfully.");
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", GroupRoutes);

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
