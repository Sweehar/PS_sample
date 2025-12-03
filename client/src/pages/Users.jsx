import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { userAPI } from "../services/api";
import Navbar from "../components/Navbar";

const Users = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Check if user is admin
        if (user?.role !== "admin") {
          setError("Access denied. Only admins can view all users.");
          setLoading(false);
          return;
        }

        const response = await userAPI.getAllUsers();
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load users");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    // Check if user is admin
    if (user?.role !== "admin") {
      setMessage({
        type: "error",
        text: "Only admins can invite users",
      });
      return;
    }

    setInviting(true);
    try {
      const response = await userAPI.inviteUser(inviteEmail, inviteRole);
      if (response.data.success) {
        setMessage({ type: "success", text: "Invitation sent successfully!" });
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteRole("member");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to send invitation",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Check if user is admin
      if (user?.role !== "admin") {
        setMessage({
          type: "error",
          text: "Only admins can change user roles",
        });
        return;
      }

      const response = await userAPI.updateUserRole(userId, newRole);
      if (response.data.success) {
        setUsers(
          users.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        setMessage({ type: "success", text: "Role updated successfully" });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update role",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
      <Navbar user={user} />

      <div className={`max-w-7xl mx-auto px-6 py-8 ${darkMode ? "bg-gray-900" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>👥 Users</h1>
            <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage team members and their roles
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>+</span> Invite User
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="float-right"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${
            darkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"
          }`}>
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <table className="w-full">
            <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  User
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Email
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Role
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Status
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Joined
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className={`px-6 py-12 text-center ${darkMode ? "text-gray-500" : "text-gray-500"}`}
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((member) => (
                  <tr key={member._id} className={`${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-semibold">
                            {member.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {member.name}
                        </span>
                        {member._id === user?._id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{member.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role || "member"}
                        onChange={(e) =>
                          handleRoleChange(member._id, e.target.value)
                        }
                        disabled={member._id === user?._id}
                        className={`border rounded px-2 py-1 text-sm ${
                          darkMode
                            ? "bg-gray-900 border-gray-600 text-white disabled:bg-gray-800"
                            : "border-gray-300 bg-white text-black disabled:bg-gray-100"
                        }`}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          member.isAccountVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {member.isAccountVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {member._id !== user?._id && (
                        <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Invite Team Member
            </h2>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-black"
                  }`}
                  required
                />
              </div>
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? "bg-gray-900 border-gray-600 text-white"
                      : "border-gray-300 bg-white text-black"
                  }`}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg ${
                    darkMode
                      ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
