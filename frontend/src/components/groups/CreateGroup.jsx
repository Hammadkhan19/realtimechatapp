import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";

const CreateGroup = () => {
  const { users, createGroup, getUsers } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const currentUser = useChatStore.getState().getCurrentUser();
  if (!currentUser) {
    console.log("Current user is undefined");
  }
  console.log("Current user is:", currentUser);
  const handleCreateGroup = async () => {
    if (!groupName) {
      console.error("Group name is required");
      return;
    }

    if (selectedUsers.length === 0) {
      console.error("At least one member is required to create a group");
      return;
    }

    createGroup({
      groupName,
      participants: [...selectedUsers, currentUser],
    });
    setGroupName("");
    setSelectedUsers([]);
  };

  return (
    <div className="create-group-container p-4 rounded-lg shadow-md flex flex-col gap-4 bg-base-100">
      <h3 className="text-lg font-semibold text-base-content">
        Create New Group
      </h3>

      <input
        type="text"
        placeholder="Enter Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="input input-bordered w-full"
      />
{/* 
      <button onClick={getUsers} className="btn btn-primary">
        Load Users
      </button> */}

      <div className="users-selection">
        <h4 className="text-sm font-medium text-base-content mb-2">
          Select Users
        </h4>
        <div className="users-list max-h-40 overflow-y-auto border border-base-300 rounded-md p-2">
          {users.map((user) => (
            <div
              key={user._id}
              className="user-checkbox flex items-center gap-2 mb-2"
            >
              <input
                type="checkbox"
                id={`user-${user._id}`}
                checked={selectedUsers.includes(user._id)}
                onChange={() => {
                  if (selectedUsers.includes(user._id)) {
                    setSelectedUsers(
                      selectedUsers.filter((id) => id !== user._id)
                    );
                  } else {
                    setSelectedUsers([...selectedUsers, user._id]);
                  }
                }}
                className="checkbox checkbox-primary"
              />
              <label
                htmlFor={`user-${user._id}`}
                className="text-sm text-base-content"
              >
                {user.fullName}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleCreateGroup} className="btn btn-success">
        Create Group
      </button>
    </div>
  );
};

export default CreateGroup;
