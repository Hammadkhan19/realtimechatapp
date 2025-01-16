import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  groups: [],
  users: [],
  selectedGroup: null,
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Selectors
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  getCurrentUser: () => useAuthStore.getState().authUser?._id,

  // Fetch Users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users.");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch Messages
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages.");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send Messages
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message.");
    }
  },

  // Socket Listeners
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Group Management
  fetchGroups: async () => {
    const currentUser = get().getCurrentUser();
    if (!currentUser) {
      console.error("Current user is not available.");
      return;
    }
    try {
      const response = await axiosInstance.get(
        `/api/groups/user-groups/${currentUser}`
      );
      set({ groups: response.data });
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  },

  handleGroupCreated: (newGroup) =>
    set((state) => ({ groups: [...state.groups, newGroup] })),

  createGroup: async (groupData) => {
    try {
      const response = await axiosInstance.post("/api/groups/create", groupData);
      set((state) => ({
        groups: [...state.groups, response.data],
      }));
    } catch (err) {
      console.error("Error creating group:", err);
    }
  },

  joinGroup: (groupId, userId) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("join-group", { groupId, userId });
  },

  leaveGroup: (groupId, userId) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("leave-group", { groupId, userId });
  },

  handleUserLeft: (
    data,
    selectedGroup,
    setParticipants,
    setCanSendMessage,
    currentUser
  ) => {
    if (data.groupId === selectedGroup._id) {
      setParticipants((prev) => prev.filter((p) => p._id !== data.userId));
      if (data.userId === currentUser) {
        setCanSendMessage(false);
      }
    }
  },

  // Real-time User Status
  initializeSocket: () => {
    const socket = useAuthStore.getState().socket;
    socket.on("update-status", ({ userId, status }) => {
      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId ? { ...user, status } : user
        ),
      }));
    });

    // Cleanup socket listeners
    return () => {
      socket.off("update-status");
    };
  },

  // Group Messaging
  sendGroupMessage: (data) => {
    const socket = useAuthStore.getState().socket;
    console.log("Sending group message:", data);
    socket.emit("send-group-message", data);
  },
}));
