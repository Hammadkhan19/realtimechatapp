import { useChatStore } from "../../store/useChatStore";
import { useEffect } from "react";
import { MdGroups } from "react-icons/md";
const GroupList = () => {
  const { groups, fetchGroups, setSelectedGroup } = useChatStore();
  const currentUser = useChatStore().getCurrentUser(); // Get the current user dynamically

  useEffect(() => {
    if (currentUser) {
      fetchGroups(); // Fetch groups when the component mounts
    }
  }, [currentUser, fetchGroups]); // Dependency array to ensure fetching is tied to currentUser availability

  return (
    <div className="w-full md:w-64 bg-base-100 rounded-lg shadow-md">
      <h3 className="text-xl font-bold p-4 bg-base-200 text-base-content">
        Your Groups
      </h3>
      <ul className="p-4 space-y-4">
        {groups.map((group) => (
          <li
            className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-base-300 transition"
            key={group._id}
            onClick={() => {
             setSelectedGroup(group);
             // Hide sidebar on mobile when a user is selected
            }}
          >
            <MdGroups className="w-10 h-10 text-base-content mr-4" />
            <span className="font-medium text-base-content">
              {group.groupName}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupList;
