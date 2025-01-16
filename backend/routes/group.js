import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  getGroupParticipants,
} from "../controllers/groupController.js"; // Ensure to add `.js` to the imports for ES module

const router = express.Router();

// Create a new group
router.post("/create", createGroup);

// Get all groups for a user
router.get("/user-groups/:userId", getUserGroups);

// Get messages for a specific group
router.get("/:groupId/messages", getGroupMessages);

// Get participants for a specific group
router.get("/:groupId/participants", getGroupParticipants);

export default router;
