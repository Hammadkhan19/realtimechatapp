import Group from "../models/group.js"; // Make sure to use the correct file path and extension
import User from "../models/user.model.js"; // Ensure this import matches your project structure

// Create a new group
export const createGroup = async (req, res) => {
  const { groupName, participants } = req.body;

  try {
    const newGroup = new Group({ groupName, participants });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating group", error: error.message });
  }
};

// Get all groups for a user
export const getUserGroups = async (req, res) => {
  const { userId } = req.params;

  try {
    const groups = await Group.find({
      participants: { $in: [userId] },
    }).populate("participants", "username avatar");
    res.json(groups);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching groups", error: error.message });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 20 } = req.query; // Default to page 1 with 20 messages per page

  try {
    // Find the group by ID and populate the sender field in messages
    const group = await Group.findById(groupId)
      .populate({
        path: 'messages.sender',
        select: 'fullName profilePic'
      })
      .exec();

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Pagination logic
    const startIndex = (page - 1) * limit;
    const paginatedMessages = group.messages.slice(
      startIndex,
      startIndex + Number(limit)
    );

    res.json({
      messages: paginatedMessages,
      totalMessages: group.messages.length,
      currentPage: Number(page),
      totalPages: Math.ceil(group.messages.length / limit),
    });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Endpoint to get group participants
export const getGroupParticipants = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate(
      "participants",
      "username email fullName"
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.json({ participants: group.participants });
  } catch (error) {
    console.error("Error fetching group participants:", error);
    res.status(500).json({ error: "Server error" });
  }
};
