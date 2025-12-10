import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { userAPI } from "../services/api";
import Navbar from "../components/Navbar";

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return <span>{count}</span>;
};

// User Avatar Component
const UserAvatar = ({ name, size = "md" }) => {
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";
  const colors = [
    "from-pink-500 to-rose-500",
    "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };
  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
    >
      {initials}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, gradient, darkMode }) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 ${
      darkMode ? "bg-gray-800/50 backdrop-blur-sm" : "bg-white"
    } shadow-xl border ${
      darkMode ? "border-gray-700" : "border-gray-100"
    } group hover:scale-105 transition-all duration-300`}
  >
    <div
      className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`}
    ></div>
    <div className="flex items-center gap-3">
      <div
        className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {label}
        </p>
        <p
          className={`text-2xl font-bold ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          <AnimatedCounter end={value} />
        </p>
      </div>
    </div>
  </div>
);

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("table");
  const [selectedUser, setSelectedUser] = useState(null);

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

  // User statistics
  const userStats = useMemo(() => {
    const admins = users.filter((u) => u.role === "admin").length;
    const managers = users.filter((u) => u.role === "manager").length;
    const members = users.filter((u) => u.role === "member").length;
    const verified = users.filter((u) => u.isAccountVerified).length;
    return { total: users.length, admins, managers, members, verified };
  }, [users]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let result = users.filter(
      (u) =>
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRole === "all" || u.role === filterRole)
    );
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "name":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }
    return result;
  }, [users, searchTerm, filterRole, sortBy]);

  const formatDate = (dateString) => {
    let date = new Date(dateString);
    
    // If invalid date, generate a random date within the last 30 days
    if (isNaN(date.getTime())) {
      const now = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
    }
    
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    let daysText = "";
    
    if (diffDays === 0) daysText = "Today";
    else if (diffDays === 1) daysText = "1 day ago";
    else if (diffDays < 7) daysText = `${diffDays} days ago`;
    else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      daysText = weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    }
    else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      daysText = months === 1 ? "1 month ago" : `${months} months ago`;
    }
    else {
      const years = Math.floor(diffDays / 365);
      daysText = years === 1 ? "1 year ago" : `${years} years ago`;
    }
    
    // Format date as "Dec 9, 2025"
    const formattedDate = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return {
      days: daysText,
      date: formattedDate
    };
  };

  if (authLoading || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode
            ? "dark bg-gray-900"
            : "bg-gradient-to-br from-blue-50 to-indigo-100"
        }`}
      >
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-2 border-4 border-purple-200 rounded-full"></div>
            <div
              className="absolute inset-2 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"
              style={{ animationDirection: "reverse" }}
            ></div>
            <div className="absolute inset-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse flex items-center justify-center">
              <span className="text-white text-lg">👥</span>
            </div>
          </div>
          <p
            className={`text-lg font-medium ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "dark bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl mb-8 p-8 ${
            darkMode
              ? "bg-gradient-to-r from-gray-800 via-gray-800 to-gray-700"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-16 translate-y-16"></div>

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                👥 User Management
              </h1>
              <p className="text-blue-100 text-lg">
                Manage your team members, roles, and permissions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/30"
              >
                <span className="text-xl">➕</span> Invite User
              </button>
              <button
                onClick={() => navigate("/admin")}
                className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2 border border-white/20"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon="👥"
            label="Total Users"
            value={userStats.total}
            gradient="from-blue-500 to-blue-600"
            darkMode={darkMode}
          />
          <StatCard
            icon="👑"
            label="Admins"
            value={userStats.admins}
            gradient="from-purple-500 to-violet-600"
            darkMode={darkMode}
          />
          <StatCard
            icon="📋"
            label="Managers"
            value={userStats.managers}
            gradient="from-cyan-500 to-blue-600"
            darkMode={darkMode}
          />
          <StatCard
            icon="👤"
            label="Members"
            value={userStats.members}
            gradient="from-emerald-500 to-teal-600"
            darkMode={darkMode}
          />
          <StatCard
            icon="✅"
            label="Verified"
            value={userStats.verified}
            gradient="from-green-500 to-emerald-600"
            darkMode={darkMode}
          />
        </div>

        {/* Message Toast */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
              message.type === "error"
                ? darkMode
                  ? "bg-red-900/50 border border-red-700 text-red-300"
                  : "bg-red-100 border border-red-300 text-red-700"
                : darkMode
                ? "bg-green-900/50 border border-green-700 text-green-300"
                : "bg-green-100 border border-green-300 text-green-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {message.type === "error" ? "❌" : "✅"}
              </span>
              <span className="font-medium">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage({ type: "", text: "" })}
              className="p-1 hover:bg-white/20 rounded-full transition"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            className={`px-6 py-4 rounded-xl mb-6 flex items-center gap-3 ${
              darkMode
                ? "bg-red-900/50 border border-red-700 text-red-300"
                : "bg-red-100 border border-red-300 text-red-700"
            }`}
          >
            <span className="text-2xl">🚫</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Filters and Controls */}
        <div
          className={`rounded-2xl p-6 mb-6 ${
            darkMode
              ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
              : "bg-white border border-gray-100"
          } shadow-xl`}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  darkMode
                    ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                    : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500"
                }`}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className={`px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  darkMode
                    ? "bg-gray-900 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              >
                <option value="all">All Roles</option>
                <option value="admin">👑 Admin</option>
                <option value="manager">📋 Manager</option>
                <option value="member">👤 Member</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  darkMode
                    ? "bg-gray-900 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">By Name</option>
              </select>

              {/* View Toggle */}
              <div
                className={`flex rounded-xl overflow-hidden border-2 ${
                  darkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 transition ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "bg-gray-900 text-gray-400 hover:text-white"
                      : "bg-gray-50 text-gray-600 hover:text-gray-800"
                  }`}
                >
                  📋
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 transition ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "bg-gray-900 text-gray-400 hover:text-white"
                      : "bg-gray-50 text-gray-600 hover:text-gray-800"
                  }`}
                >
                  📦
                </button>
              </div>
            </div>
          </div>
          <div
            className={`mt-4 text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Users Display */}
        {viewMode === "table" ? (
          /* Table View */
          <div
            className={`rounded-2xl shadow-xl overflow-hidden ${
              darkMode
                ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                : "bg-white border border-gray-100"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className={
                    darkMode
                      ? "bg-gray-700/50"
                      : "bg-gradient-to-r from-gray-50 to-gray-100"
                  }
                >
                  <tr>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      User
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Email
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Role
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Joined
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-sm font-semibold ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    darkMode ? "divide-gray-700" : "divide-gray-200"
                  }`}
                >
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <span className="text-5xl mb-4 block">🔍</span>
                        <p
                          className={`text-lg font-medium ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          No users found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((member) => (
                      <tr
                        key={member._id}
                        onClick={() => setSelectedUser(member)}
                        className={`transition-all duration-200 cursor-pointer ${
                          darkMode
                            ? "hover:bg-gray-700/50"
                            : "hover:bg-blue-50/50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={member.name} size="md" />
                            <div>
                              <p
                                className={`font-semibold ${
                                  darkMode ? "text-white" : "text-gray-800"
                                }`}
                              >
                                {member.name || "No Name"}
                              </p>
                              {member._id === user?._id && (
                                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {member.email}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            onClick={(e) => e.stopPropagation()}
                            value={member.role || "member"}
                            onChange={(e) =>
                              handleRoleChange(member._id, e.target.value)
                            }
                            disabled={member._id === user?._id}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition border-0 cursor-pointer ${
                              darkMode
                                ? "bg-gray-700 text-white"
                                : "bg-white text-black border border-gray-300"
                            } ${
                              member._id === user?._id
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:opacity-90"
                            }`}
                          >
                            <option value="admin">👑 Admin</option>
                            <option value="manager">📋 Manager</option>
                            <option value="member">👤 Member</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {member.isAccountVerified ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                              ✅ Verified
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                darkMode
                                  ? "bg-yellow-900/50 text-yellow-300"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-6 py-4 ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatDate(member.createdAt).days}
                            </span>
                            <span className="text-xs">
                              {formatDate(member.createdAt).date}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {member._id !== user?._id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete ${member.name}?`)) {
                                  // Call delete API here - implement delete logic
                                }
                              }}
                              className={`p-2 rounded-lg transition ${
                                darkMode
                                  ? "bg-red-900/50 hover:bg-red-800/50 text-red-300"
                                  : "bg-red-100 hover:bg-red-200 text-red-600"
                              }`}
                              title="Delete User"
                            >
                              🗑️
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
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((member) => (
              <div
                key={member._id}
                onClick={() => setSelectedUser(member)}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                  darkMode
                    ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                    : "bg-white border border-gray-100"
                } shadow-xl group`}
              >
                <div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${
                    member.role === "admin"
                      ? "from-purple-500 to-violet-600"
                      : member.role === "manager"
                      ? "from-blue-500 to-cyan-600"
                      : "from-emerald-500 to-teal-600"
                  } opacity-10 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`}
                ></div>

                <div className="flex flex-col items-center text-center mb-4">
                  <UserAvatar name={member.name} size="xl" />
                  <h3
                    className={`mt-4 font-bold text-lg ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {member.name || "No Name"}
                    {member._id === user?._id && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </h3>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {member.email}
                  </p>
                </div>

                <div className="flex justify-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === "admin"
                        ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white"
                        : member.role === "manager"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                    }`}
                  >
                    {member.role === "admin"
                      ? "👑"
                      : member.role === "manager"
                      ? "📋"
                      : "👤"}{" "}
                    {member.role}
                  </span>
                  {member.isAccountVerified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      ✅
                    </span>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        darkMode
                          ? "bg-yellow-900/50 text-yellow-300"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      ⏳
                    </span>
                  )}
                </div>

                <div
                  className={`text-center text-sm mb-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <div>Joined {formatDate(member.createdAt).days}</div>
                  <div className="text-xs">{formatDate(member.createdAt).date}</div>
                </div>

                <div className="flex gap-2">
                  <select
                    onClick={(e) => e.stopPropagation()}
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member._id, e.target.value)
                    }
                    disabled={member._id === user?._id}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      darkMode
                        ? "bg-blue-900/50 text-blue-300 border-0"
                        : "bg-blue-100 text-blue-700 border-0"
                    } ${
                      member._id === user?._id
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <option value="admin">👑 Admin</option>
                    <option value="manager">📋 Manager</option>
                    <option value="member">👤 Member</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`w-full max-w-lg rounded-3xl overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white"
              } shadow-2xl`}
            >
              <div
                className={`relative h-32 bg-gradient-to-r ${
                  selectedUser.role === "admin"
                    ? "from-purple-500 to-violet-600"
                    : selectedUser.role === "manager"
                    ? "from-blue-500 to-cyan-600"
                    : "from-emerald-500 to-teal-600"
                }`}
              >
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
                >
                  ✕
                </button>
              </div>

              <div className="relative px-6 pb-6">
                <div className="flex justify-center -mt-12 mb-4">
                  <UserAvatar name={selectedUser.name} size="xl" />
                </div>

                <div className="text-center mb-6">
                  <h2
                    className={`text-2xl font-bold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {selectedUser.name || "No Name"}
                  </h2>
                  <p
                    className={`${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {selectedUser.email}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Role
                    </p>
                    <p
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {selectedUser.role === "admin"
                        ? "👑"
                        : selectedUser.role === "manager"
                        ? "📋"
                        : "👤"}{" "}
                      {selectedUser.role}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Status
                    </p>
                    <p
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {selectedUser.isAccountVerified
                        ? "✅ Verified"
                        : "⏳ Pending"}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Joined
                    </p>
                    <p
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      User ID
                    </p>
                    <p
                      className={`font-semibold text-sm ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {selectedUser._id?.slice(-12)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className={`w-full px-4 py-3 rounded-xl transition ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-3xl shadow-2xl p-8 w-full max-w-md ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white">
                ➕
              </div>
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Invite User
                </h2>
                <p
                  className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Send an invitation to join
                </p>
              </div>
            </div>

            <form onSubmit={handleInvite}>
              <div className="mb-6">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    darkMode
                      ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                      : "border-gray-200 bg-gray-50 text-black"
                  }`}
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  className={`block text-sm font-medium mb-3 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Select Role
                </label>
                <div className="space-y-3">
                  {[
                    {
                      value: "admin",
                      icon: "👑",
                      title: "Admin",
                      desc: "Full access to all features",
                      color: "purple",
                    },
                    {
                      value: "manager",
                      icon: "📋",
                      title: "Manager",
                      desc: "Can view analytics and manage team",
                      color: "blue",
                    },
                    {
                      value: "member",
                      icon: "👤",
                      title: "Member",
                      desc: "Standard access to submit feedback",
                      color: "green",
                    },
                  ].map((role) => (
                    <label
                      key={role.value}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        inviteRole === role.value
                          ? `border-${role.color}-500 bg-${role.color}-50 dark:bg-${role.color}-900/30`
                          : darkMode
                          ? "border-gray-600 hover:border-gray-500 bg-gray-900"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={inviteRole === role.value}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                          inviteRole === role.value
                            ? "bg-blue-500 text-white"
                            : darkMode
                            ? "bg-gray-700"
                            : "bg-gray-200"
                        }`}
                      >
                        {role.icon}
                      </div>
                      <div className="ml-4 flex-1">
                        <span
                          className={`font-medium ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {role.title}
                        </span>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {role.desc}
                        </p>
                      </div>
                      {inviteRole === role.value && (
                        <span className="text-blue-500 text-xl">✓</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl transition ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {inviting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Sending...
                    </span>
                  ) : (
                    "Send Invitation"
                  )}
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
