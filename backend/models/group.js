// models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: String,
      fullName: String,
      profilePic: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Group = mongoose.model("Group", groupSchema);
export default Group;
