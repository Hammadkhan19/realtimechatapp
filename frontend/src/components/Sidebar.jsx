import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroup from "./groups/CreateGroup";
import GroupList from "./groups/GroupList";

import { Users } from "lucide-react";
import { GrGroup } from "react-icons/gr";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [view, setView] = useState("contacts"); // State to manage current view

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (

      <aside className="h-full w-full sm:w-64 md:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        <div className="border-b border-base-300 w-full p-5 flex justify-between">
          <div
            className={`flex items-center gap-2 cursor-pointer ${
              view === "contacts" ? "border-b-2 border-primary " : ""
            }`}
            onClick={() => setView("contacts")}
          >
            <Users className="size-6" />
            <span className="font-medium hidden sm:block  ">Contacts</span>
          </div>
          <div
            className={`flex items-center gap-2 cursor-pointer ${
              view === "groups" ? "border-b-2 border-primary" : ""
            }`}
            onClick={() => setView("groups")}
          >
            <GrGroup className="size-6" />
            <span className="font-medium hidden sm:block">Groups</span>
          </div>
        </div>
        {view === "contacts" && (
          <div className="overflow-y-auto w-full py-3">
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  setSelectedUser(user);
   // Hide sidebar on mobile when a user is selected
                }}
                className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${
                  selectedUser?._id === user._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
              >
                <div className="relative mx-auto sm:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                <div className="hidden sm:block text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                No online users
              </div>
            )}
          </div>
        )}

        {view === "groups" && (
          <div className="overflow-y-auto w-full py-3">
            <CreateGroup />
            <GroupList/>
          </div>
        )}
      </aside>
    
  );
};

export default Sidebar;