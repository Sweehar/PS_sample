import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    if (end > 0) requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

// Pulse Dot Component
const PulseDot = ({ color = "green", size = "w-2 h-2" }) => (
  <span className={`${size} rounded-full bg-${color}-500 animate-pulse`}></span>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, pages: 1 });
  const [feedbackPagination, setFeedbackPagination] = useState({
    page: 1,
    pages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [metricsData, setMetricsData] = useState(null);
  const [dockerLoading, setDockerLoading] = useState(false);
  const [dockerMessage, setDockerMessage] = useState("");
  const [copiedCommand, setCopiedCommand] = useState(null);

  // Control Docker monitoring services
  const controlDocker = async (action) => {
    setDockerLoading(true);
    setDockerMessage("");
    try {
      const res = await adminAPI.controlDocker(action);
      if (res.data.success) {
        setDockerMessage(`✅ ${res.data.message}`);
        // Refresh health status after 3 seconds to give containers time to start
        setTimeout(() => {
          fetchData();
          setDockerMessage("");
        }, 3000);
      }
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = `❌ ${
        errorData?.message || `Failed to ${action} services`
      }`;

      // Add details if available
      if (errorData?.details) {
        errorMessage += `\n${errorData.details}`;
      }

      setDockerMessage(errorMessage);
    } finally {
      setDockerLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!authLoading && user && user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getHealth(),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (healthRes.data.success) setHealth(healthRes.data.health);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      console.log("Fetching users - Page:", page, "Search:", searchTerm);
      const res = await adminAPI.getUsers(page, 10, searchTerm);
      console.log("Users API response:", res.data);
      if (res.data.success) {
        setUsers(res.data.users);
        setUserPagination(res.data.pagination);
        console.log(
          "Users fetched successfully:",
          res.data.users.length,
          "users"
        );
      } else {
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      console.error("Error details:", err.response?.data || err.message);
    }
  };

  const fetchFeedback = async (page = 1) => {
    try {
      const res = await adminAPI.getFeedback(page, 10);
      if (res.data.success) {
        setFeedback(res.data.feedback);
        setFeedbackPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await adminAPI.deleteUser(userId);
      if (res.data.success) {
        fetchUsers(userPagination.page);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await adminAPI.updateUserRole(userId, newRole);
      if (res.data.success) {
        // Update local state
        setUsers(
          users.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        fetchData(); // Refresh stats
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "feedback") fetchFeedback();
  }, [activeTab]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-gray-700 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <div
              className="absolute top-2 left-2 w-16 h-16 border-4 border-purple-500 rounded-full animate-spin border-b-transparent"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="mt-6 text-gray-300 font-medium">
            Loading Admin Dashboard...
          </p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Enhanced Admin Navbar */}
      <nav className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-xl">🛡️</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  System Online
                </div>
              </div>
            </div>
            {/* Quick Links */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                  activeTab === "analytics"
                    ? "bg-purple-600/20 text-purple-400"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-purple-400"
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab("monitoring")}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                  activeTab === "monitoring"
                    ? "bg-green-600/20 text-green-400"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-green-400"
                }`}
              >
                📈 Monitoring
              </button>
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-blue-400 transition flex items-center gap-2"
              >
                🏠 Main Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-700/50 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg shadow-red-600/20 flex items-center gap-2"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Tabs */}
        <div className="flex gap-2 mb-8 p-2 bg-gray-800/50 rounded-2xl overflow-x-auto backdrop-blur-sm">
          {[
            { id: "overview", icon: "🏠", label: "Overview" },
            { id: "analytics", icon: "📊", label: "Analytics" },
            { id: "users", icon: "👥", label: "Users" },
            { id: "feedback", icon: "💬", label: "Feedback" },
            { id: "monitoring", icon: "📈", label: "Monitoring" },
            { id: "system", icon: "⚙️", label: "System" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                  : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl p-6 mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full animate-pulse"></div>
                <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back, {user?.name}! 👋
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Here's what's happening with your platform today.
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <p className="text-2xl font-bold">
                      <AnimatedCounter end={stats?.users?.online || 0} />
                    </p>
                    <p className="text-xs text-blue-200">Online Now</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <p className="text-2xl font-bold">
                      <AnimatedCounter end={stats?.feedback?.total || 0} />
                    </p>
                    <p className="text-xs text-blue-200">Total Feedback</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              <button
                onClick={() => setActiveTab("analytics")}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 hover:scale-105 transition-all duration-300 text-left shadow-lg shadow-purple-600/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h4 className="font-bold text-lg">Analytics</h4>
                  <p className="text-purple-200 text-xs mt-1">
                    View charts & trends
                  </p>
                </div>
                <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-xs">→</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("monitoring")}
                className="group relative overflow-hidden bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 hover:scale-105 transition-all duration-300 text-left shadow-lg shadow-green-600/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📈</span>
                  </div>
                  <h4 className="font-bold text-lg">Monitoring</h4>
                  <p className="text-green-200 text-xs mt-1">
                    Prometheus & Grafana
                  </p>
                </div>
                <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-xs">→</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 hover:scale-105 transition-all duration-300 text-left shadow-lg shadow-blue-600/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h4 className="font-bold text-lg">Manage Users</h4>
                  <p className="text-blue-200 text-xs mt-1">
                    View & edit users
                  </p>
                </div>
                <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-xs">→</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className="group relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-5 hover:scale-105 transition-all duration-300 text-left shadow-lg shadow-orange-600/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h4 className="font-bold text-lg">All Feedback</h4>
                  <p className="text-orange-200 text-xs mt-1">
                    View all submissions
                  </p>
                </div>
                <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-xs">→</span>
                </div>
              </button>
              <Link
                to="/admin/user-ratings"
                className="group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl p-5 hover:scale-105 transition-all duration-300 text-left shadow-lg shadow-yellow-600/20"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <h4 className="font-bold text-lg">User Ratings</h4>
                  <p className="text-yellow-100 text-xs mt-1">
                    View all ratings
                  </p>
                </div>
                <div className="absolute bottom-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-xs">→</span>
                </div>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-5 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats?.users?.total || 0}
                icon="👥"
                color="blue"
              />
              <StatCard
                title="Online Now"
                value={stats?.users?.online || 0}
                icon="🟢"
                color="green"
              />
              <StatCard
                title="Verified Users"
                value={stats?.users?.verified || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Total Feedback"
                value={stats?.feedback?.total || 0}
                icon="💬"
                color="purple"
              />
              <StatCard
                title="Admins"
                value={stats?.users?.byRole?.admin || 0}
                icon="🛡️"
                color="yellow"
              />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* User Roles */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
                <div className="space-y-3">
                  {Object.entries(stats?.users?.byRole || {}).map(
                    ([role, count]) => (
                      <div
                        key={role}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize text-gray-400">{role}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (count / (stats?.users?.total || 1)) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-white font-medium w-8">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Sentiment Breakdown */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Feedback Sentiment
                </h3>
                <div className="space-y-3">
                  {["positive", "neutral", "negative"].map((sentiment) => {
                    const count =
                      stats?.feedback?.bySentiment?.[sentiment] || 0;
                    const colors = {
                      positive: "bg-green-500",
                      neutral: "bg-gray-500",
                      negative: "bg-red-500",
                    };
                    const icons = {
                      positive: "😊",
                      neutral: "😐",
                      negative: "😞",
                    };
                    return (
                      <div
                        key={sentiment}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize text-gray-400 flex items-center gap-2">
                          <span>{icons[sentiment]}</span>
                          {sentiment}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div
                              className={`${colors[sentiment]} h-2 rounded-full transition-all duration-500`}
                              style={{
                                width: `${
                                  (count / (stats?.feedback?.total || 1)) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-white font-medium w-8">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Online</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {stats?.recentUsers?.map((u) => (
                      <tr key={u._id} className="text-gray-300">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.isOnline ? "bg-green-500" : "bg-gray-500"
                              }`}
                              title={u.isOnline ? "Online" : "Offline"}
                            />
                            {u.name}
                          </div>
                        </td>
                        <td className="py-3">{u.email}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              u.role === "admin"
                                ? "bg-yellow-600"
                                : "bg-gray-600"
                            }`}
                          >
                            {u.role || "member"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                              u.isOnline
                                ? "bg-green-600/20 text-green-400"
                                : "bg-gray-600/20 text-gray-400"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.isOnline
                                  ? "bg-green-500 animate-pulse"
                                  : "bg-gray-500"
                              }`}
                            />
                            {u.isOnline
                              ? "Online"
                              : u.lastActive
                              ? `Last seen ${new Date(
                                  u.lastActive
                                ).toLocaleDateString()}`
                              : "Offline"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              u.isAccountVerified
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                          >
                            {u.isAccountVerified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3 text-sm">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab - Embedded Analytics Dashboard */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">📊 Analytics Dashboard</h2>
              <button
                onClick={fetchData}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                🔄 Refresh Data
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
                <p className="text-blue-200 text-sm">Total Users</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.users?.total || 0}
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  Registered accounts
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6">
                <p className="text-green-200 text-sm">Online Now</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.users?.online || 0}
                </p>
                <p className="text-green-200 text-xs mt-1">Active sessions</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
                <p className="text-purple-200 text-sm">Total Feedback</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.feedback?.total || 0}
                </p>
                <p className="text-purple-200 text-xs mt-1">Submissions</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg p-6">
                <p className="text-orange-200 text-sm">Avg Confidence</p>
                <p className="text-4xl font-bold mt-2">
                  {stats?.feedback?.avgConfidence
                    ? `${(stats.feedback.avgConfidence * 100).toFixed(0)}%`
                    : "N/A"}
                </p>
                <p className="text-orange-200 text-xs mt-1">AI accuracy</p>
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  📈 Sentiment Distribution
                </h3>
                <div className="space-y-4">
                  {stats?.feedback?.bySentiment &&
                    Object.entries(stats.feedback.bySentiment).map(
                      ([sentiment, count]) => {
                        const total = stats?.feedback?.total || 1;
                        const percentage = ((count / total) * 100).toFixed(1);
                        const colors = {
                          positive: "bg-green-500",
                          negative: "bg-red-500",
                          neutral: "bg-gray-500",
                        };
                        return (
                          <div key={sentiment}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{sentiment}</span>
                              <span>
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                              <div
                                className={`h-full ${
                                  colors[sentiment] || "bg-blue-500"
                                } transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  {(!stats?.feedback?.bySentiment ||
                    Object.keys(stats.feedback.bySentiment).length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No sentiment data yet
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  🎯 User Roles Distribution
                </h3>
                <div className="space-y-4">
                  {stats?.users?.byRole &&
                    Object.entries(stats.users.byRole).map(([role, count]) => {
                      const total = stats?.users?.total || 1;
                      const percentage = ((count / total) * 100).toFixed(1);
                      const colors = {
                        admin: "bg-yellow-500",
                        manager: "bg-purple-500",
                        member: "bg-blue-500",
                      };
                      return (
                        <div key={role}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{role}</span>
                            <span>
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full ${
                                colors[role] || "bg-blue-500"
                              } transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {(!stats?.users?.byRole ||
                    Object.keys(stats.users.byRole).length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No role data yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity & Intents */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  🕐 Recent Activity
                </h3>
                <div className="space-y-3">
                  {stats?.recentUsers?.slice(0, 5).map((user, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-700 ${
                              user.isOnline ? "bg-green-500" : "bg-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.isOnline ? "bg-green-600" : "bg-gray-600"
                        }`}
                      >
                        {user.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  ))}
                  {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No recent users
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  🏷️ Top Intents Detected
                </h3>
                <div className="space-y-3">
                  {stats?.feedback?.topIntents &&
                  stats.feedback.topIntents.length > 0 ? (
                    stats.feedback.topIntents.map((intent, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                      >
                        <span className="capitalize">
                          {intent._id?.replace(/_/g, " ") || "Unknown"}
                        </span>
                        <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                          {intent.count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No intents detected yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links to External Dashboards */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                🔗 External Dashboards
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <a
                  href="http://localhost:4000/metrics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center transition"
                >
                  <span className="text-3xl">📊</span>
                  <p className="font-semibold mt-2">Prometheus Metrics</p>
                  <p className="text-orange-200 text-xs">
                    Raw metrics endpoint
                  </p>
                </a>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-center transition"
                >
                  <span className="text-3xl">📈</span>
                  <p className="font-semibold mt-2">Grafana Dashboard</p>
                  <p className="text-green-200 text-xs">Visual analytics</p>
                </a>
                <a
                  href="http://localhost:9090"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 text-center transition"
                >
                  <span className="text-3xl">🔍</span>
                  <p className="font-semibold mt-2">Prometheus Query</p>
                  <p className="text-blue-200 text-xs">Query explorer</p>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">All Users</h3>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-700">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Online</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((u) => (
                    <tr key={u._id} className="text-gray-300">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${
                                u.isOnline ? "bg-green-500" : "bg-gray-500"
                              }`}
                            />
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3">
                        {u._id === user?._id ? (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-600">
                            {u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role || "member"}
                            onChange={(e) =>
                              handleRoleChange(u._id, e.target.value)
                            }
                            className={`px-2 py-1 rounded text-xs cursor-pointer border-0 outline-none ${
                              u.role === "admin"
                                ? "bg-yellow-600 text-white"
                                : u.role === "manager"
                                ? "bg-purple-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            <option value="member" className="bg-gray-800">
                              Member
                            </option>
                            <option value="manager" className="bg-gray-800">
                              Manager
                            </option>
                            <option value="admin" className="bg-gray-800">
                              Admin
                            </option>
                          </select>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                            u.isOnline
                              ? "bg-green-600/20 text-green-400"
                              : "bg-gray-600/20 text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.isOnline
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-500"
                            }`}
                          />
                          {u.isOnline
                            ? "Online"
                            : u.lastActive
                            ? `${new Date(u.lastActive).toLocaleDateString()}`
                            : "Offline"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            u.isAccountVerified ? "bg-green-600" : "bg-red-600"
                          }`}
                        >
                          {u.isAccountVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-3">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userPagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchUsers(userPagination.page - 1)}
                  disabled={userPagination.page === 1}
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {userPagination.page} of {userPagination.pages}
                </span>
                <button
                  onClick={() => fetchUsers(userPagination.page + 1)}
                  disabled={userPagination.page === userPagination.pages}
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6">All Feedback</h3>

            <div className="space-y-4">
              {feedback.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No feedback yet
                </p>
              ) : (
                feedback.map((f, idx) => (
                  <div
                    key={f.jobId || idx}
                    className="bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Feedback Text */}
                        <p className="text-gray-200">{f.text}</p>

                        {/* User Info */}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                f.user?.isOnline
                                  ? "bg-green-500"
                                  : "bg-gray-500"
                              }`}
                            />
                            <span className="text-white font-medium">
                              {f.user?.name || "Unknown"}
                            </span>
                          </span>
                          <span className="text-gray-400">{f.user?.email}</span>
                          <span className="text-gray-400">
                            {f.user?.role || "member"}
                          </span>
                        </div>

                        {/* Intents */}
                        {f.intents && f.intents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {f.intents.map((intent, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-xs"
                              >
                                {intent.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Scores */}
                        {f.allScores && f.allScores.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {f.allScores.map((score, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  score.label
                                    ?.toLowerCase()
                                    .includes("positive") ||
                                  score.label === "LABEL_2"
                                    ? "bg-green-600/30 text-green-300"
                                    : score.label
                                        ?.toLowerCase()
                                        .includes("negative") ||
                                      score.label === "LABEL_0"
                                    ? "bg-red-600/30 text-red-300"
                                    : "bg-gray-600/30 text-gray-300"
                                }`}
                              >
                                {score.label}:{" "}
                                {score.percentage ||
                                  `${(score.score * 100).toFixed(1)}%`}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            {f.processedAt
                              ? new Date(f.processedAt).toLocaleString()
                              : "Pending"}
                          </span>
                          {f.metadata?.wordCount && (
                            <span>📝 {f.metadata.wordCount} words</span>
                          )}
                          <span
                            className={
                              f.aiProcessed
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {f.aiProcessed ? "🤖 AI" : "📋 Fallback"}
                          </span>
                          <span>Confidence: {f.confidencePercent}</span>
                        </div>
                      </div>

                      {/* Sentiment Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl">
                          {f.sentiment === "positive"
                            ? "😊"
                            : f.sentiment === "negative"
                            ? "😞"
                            : "😐"}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            f.sentiment === "positive"
                              ? "bg-green-600"
                              : f.sentiment === "negative"
                              ? "bg-red-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {f.sentiment?.toUpperCase() || "PROCESSING"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {feedbackPagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => fetchFeedback(feedbackPagination.page - 1)}
                  disabled={feedbackPagination.page === 1}
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {feedbackPagination.page} of {feedbackPagination.pages}
                </span>
                <button
                  onClick={() => fetchFeedback(feedbackPagination.page + 1)}
                  disabled={
                    feedbackPagination.page === feedbackPagination.pages
                  }
                  className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* System Tab */}
        {activeTab === "system" && (
          <div>
            {/* Health Status */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <HealthCard title="Server" status={health?.server} />
              <HealthCard title="Database" status={health?.database} />
              <HealthCard title="Redis" status={health?.redis} />
            </div>

            {/* System Info */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">System Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Uptime</p>
                  <p className="text-xl font-semibold">
                    {health?.uptime ? formatUptime(health.uptime) : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Memory Usage</p>
                  <p className="text-xl font-semibold">
                    {health?.memory
                      ? `${Math.round(health.memory.heapUsed / 1024 / 1024)} MB`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Grafana Integration */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                📊 Quick Monitoring Links
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="http://localhost:4000/metrics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition block"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <p className="font-medium">Prometheus Metrics</p>
                      <p className="text-sm text-gray-400">
                        View raw metrics data
                      </p>
                    </div>
                  </div>
                </a>
                <button
                  onClick={() => setActiveTab("monitoring")}
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-medium">Full Monitoring Dashboard</p>
                      <p className="text-sm text-gray-400">
                        View detailed analytics
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === "monitoring" && (
          <div className="space-y-6">
            {/* Service Status Cards - Top Row */}
            <div className="grid md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">📊</span>
                  <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-semibold">
                    Active
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-2">Backend Metrics</h3>
                <p className="text-green-200 text-xs mt-1">
                  localhost:4000/metrics
                </p>
              </div>

              <div
                className={`bg-gradient-to-br ${
                  health?.prometheus
                    ? "from-orange-500 to-orange-700"
                    : "from-orange-900 to-orange-950"
                } rounded-lg p-4`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">🔥</span>
                  <span
                    className={`${
                      health?.prometheus
                        ? "bg-green-400 text-green-900"
                        : "bg-red-500 text-white"
                    } text-xs px-2 py-1 rounded-full font-semibold`}
                  >
                    {health?.prometheus ? "Running" : "Stopped"}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-2">Prometheus</h3>
                <p className="text-orange-200 text-xs mt-1">localhost:9090</p>
              </div>

              <div
                className={`bg-gradient-to-br ${
                  health?.grafana
                    ? "from-yellow-500 to-yellow-700"
                    : "from-yellow-900 to-yellow-950"
                } rounded-lg p-4`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">📈</span>
                  <span
                    className={`${
                      health?.grafana
                        ? "bg-green-400 text-green-900"
                        : "bg-red-500 text-white"
                    } text-xs px-2 py-1 rounded-full font-semibold`}
                  >
                    {health?.grafana ? "Running" : "Stopped"}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-2">Grafana</h3>
                <p className="text-yellow-200 text-xs mt-1">localhost:3001</p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">🗄️</span>
                  <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-semibold">
                    Connected
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-2">MongoDB</h3>
                <p className="text-blue-200 text-xs mt-1">Atlas Cluster</p>
              </div>

              <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">⚡</span>
                  <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-semibold">
                    Ready
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-2">Redis</h3>
                <p className="text-red-200 text-xs mt-1">localhost:6379</p>
              </div>
            </div>

            {/* Docker Control Section */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">🐳</span> Docker Monitoring
                  Services
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => controlDocker("start")}
                    disabled={
                      dockerLoading || (health?.prometheus && health?.grafana)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      dockerLoading || (health?.prometheus && health?.grafana)
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    ▶️ Start
                  </button>
                  <button
                    onClick={() => controlDocker("stop")}
                    disabled={
                      dockerLoading || (!health?.prometheus && !health?.grafana)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      dockerLoading || (!health?.prometheus && !health?.grafana)
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    ⏹️ Stop
                  </button>
                  <button
                    onClick={() => controlDocker("restart")}
                    disabled={dockerLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                      dockerLoading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-yellow-600 hover:bg-yellow-700"
                    }`}
                  >
                    🔄 Restart
                  </button>
                </div>
              </div>

              {dockerMessage && (
                <div
                  className={`mb-4 p-4 rounded-lg whitespace-pre-wrap text-sm ${
                    dockerMessage.includes("✅")
                      ? "bg-green-900/50 border border-green-700 text-green-100"
                      : "bg-red-900/50 border border-red-700 text-red-100"
                  }`}
                >
                  {dockerMessage}
                </div>
              )}

              {dockerLoading && (
                <div className="mb-4 p-3 rounded-lg bg-blue-900/50 border border-blue-700 flex items-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Starting Docker services...
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Option 1: Docker Compose */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <span>✅</span> Option 1: Docker Compose (Recommended)
                  </h4>

                  <div className="space-y-3">
                    <div className="bg-gray-900 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">
                          Step 1: Navigate to monitoring folder
                        </span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText("cd monitoring")
                          }
                          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <code className="text-green-400">cd monitoring</code>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">
                          Step 2: Start all services
                        </span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              "docker-compose up -d"
                            )
                          }
                          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <code className="text-green-400">
                        docker-compose up -d
                      </code>
                    </div>

                    <p className="text-gray-400 text-sm">
                      This starts: Prometheus (9090), Grafana (3001), Redis
                      (6379)
                    </p>
                  </div>
                </div>

                {/* Option 2: Individual Commands */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                    <span>🔧</span> Option 2: Individual Docker Commands
                  </h4>

                  <div className="space-y-3">
                    <div className="bg-gray-900 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">
                          Start Prometheus
                        </span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              "docker run -d --name prometheus -p 9090:9090 prom/prometheus"
                            )
                          }
                          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <code className="text-purple-400 text-sm">
                        docker run -d --name prometheus -p 9090:9090
                        prom/prometheus
                      </code>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">
                          Start Grafana
                        </span>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              "docker run -d --name grafana -p 3001:3000 grafana/grafana"
                            )
                          }
                          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <code className="text-purple-400 text-sm">
                        docker run -d --name grafana -p 3001:3000
                        grafana/grafana
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafana Credentials */}
              <div className="mt-4 bg-gradient-to-r from-pink-900/50 to-purple-900/50 border border-pink-700 rounded-lg p-4">
                <h4 className="text-pink-400 font-semibold mb-2 flex items-center gap-2">
                  <span>🔐</span> Grafana Login Credentials
                </h4>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">URL: </span>
                    <a
                      href="http://localhost:3001"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      http://localhost:3001
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400">Username: </span>
                    <code className="text-white bg-gray-700 px-2 py-0.5 rounded">
                      team.808.test@gmail.com
                    </code>
                  </div>
                  <div>
                    <span className="text-gray-400">Password: </span>
                    <code className="text-white bg-gray-700 px-2 py-0.5 rounded">
                      team@808
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Grafana Dashboard (when running) */}
            {health?.grafana && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="text-2xl">📈</span> Live Grafana Dashboard
                  </h3>
                  <a
                    href="http://localhost:3001/d/crm-dashboard/crm-metrics?orgId=1&refresh=5s"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
                  >
                    🔗 Open in Full Screen
                  </a>
                </div>
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                  <iframe
                    src="http://localhost:3001/d/crm-dashboard/crm-metrics?orgId=1&refresh=5s&theme=dark"
                    width="100%"
                    height="700"
                    frameBorder="0"
                    title="Grafana Dashboard"
                    className="rounded-lg"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  💡 Tip: If the dashboard shows no data, make sure your backend
                  is running and sending metrics to Prometheus. The dashboard
                  refreshes every 5 seconds.
                </p>
              </div>
            )}

            {/* Live System Gauges */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-2xl">📊</span> Real-Time System Metrics
                </h3>
                <button
                  onClick={fetchData}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Gauge Charts */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* CPU Gauge */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    CPU Usage
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10B981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(health?.cpu || 15) * 3.52} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-400">
                        {health?.cpu || 15}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Memory Gauge */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    Memory
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${Math.min(
                          (health?.memory?.heapUsed / 1024 / 1024 / 512) *
                            352 || 88,
                          352
                        )} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xl font-bold text-blue-400">
                        {health?.memory
                          ? Math.round(health.memory.heapUsed / 1024 / 1024)
                          : 45}
                      </span>
                      <span className="text-xs text-gray-400">MB</span>
                    </div>
                  </div>
                </div>

                {/* Uptime */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    Uptime
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#8B5CF6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray="352 352"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-lg font-bold text-purple-400">
                        {health?.uptime ? formatUptime(health.uptime) : "0m"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2 text-center">
                    Avg Response
                  </p>
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#F59E0B"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${Math.min(
                          (stats?.avgResponseTime || 45) / 2,
                          352
                        )} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xl font-bold text-yellow-400">
                        {stats?.avgResponseTime || 45}
                      </span>
                      <span className="text-xs text-gray-400">ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Analytics */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="text-2xl">👥</span> User Analytics
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                {/* User Status Pie Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-4 text-center">
                    Online vs Offline
                  </p>
                  <div className="relative w-40 h-40 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="20"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="20"
                        strokeDasharray={`${
                          ((stats?.users?.online || 0) /
                            (stats?.users?.total || 1)) *
                          251.2
                        } 251.2`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold">
                        {stats?.users?.total || 0}
                      </span>
                      <span className="text-xs text-gray-400">Total</span>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span>Online ({stats?.users?.online || 0})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                      <span>
                        Offline (
                        {(stats?.users?.total || 0) -
                          (stats?.users?.online || 0)}
                        )
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Bar Chart */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-4 text-center">
                    Verification Status
                  </p>
                  <div className="h-40 flex items-end justify-center gap-8">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-16 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${Math.max(
                            ((stats?.users?.verified || 0) /
                              (stats?.users?.total || 1)) *
                              120,
                            20
                          )}px`,
                        }}
                      />
                      <span className="text-xs text-gray-400 mt-2">
                        Verified
                      </span>
                      <span className="text-lg font-bold text-green-400">
                        {stats?.users?.verified || 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-16 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${Math.max(
                            (((stats?.users?.total || 0) -
                              (stats?.users?.verified || 0)) /
                              (stats?.users?.total || 1)) *
                              120,
                            20
                          )}px`,
                        }}
                      />
                      <span className="text-xs text-gray-400 mt-2">
                        Pending
                      </span>
                      <span className="text-lg font-bold text-yellow-400">
                        {(stats?.users?.total || 0) -
                          (stats?.users?.verified || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-4 text-center">
                    Activity Overview
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>🟢 Active Users</span>
                        <span className="font-bold">
                          {stats?.users?.online || 0}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              ((stats?.users?.online || 0) /
                                (stats?.users?.total || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>✅ Verified</span>
                        <span className="font-bold">
                          {stats?.users?.verified || 0}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              ((stats?.users?.verified || 0) /
                                (stats?.users?.total || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>👤 Total Users</span>
                        <span className="font-bold">
                          {stats?.users?.total || 0}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Analytics */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="text-2xl">💬</span> Feedback Analytics
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Sentiment Distribution */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Sentiment Distribution
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-400">😊 Positive</span>
                        <span>
                          {stats?.feedback?.bySentiment?.positive || 0} (
                          {stats?.feedback?.total
                            ? Math.round(
                                ((stats?.feedback?.bySentiment?.positive || 0) /
                                  stats.feedback.total) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.feedback?.total
                                ? ((stats?.feedback?.bySentiment?.positive ||
                                    0) /
                                    stats.feedback.total) *
                                  100
                                : 33
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">😐 Neutral</span>
                        <span>
                          {stats?.feedback?.bySentiment?.neutral || 0} (
                          {stats?.feedback?.total
                            ? Math.round(
                                ((stats?.feedback?.bySentiment?.neutral || 0) /
                                  stats.feedback.total) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gray-500 to-gray-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.feedback?.total
                                ? ((stats?.feedback?.bySentiment?.neutral ||
                                    0) /
                                    stats.feedback.total) *
                                  100
                                : 33
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-400">😞 Negative</span>
                        <span>
                          {stats?.feedback?.bySentiment?.negative || 0} (
                          {stats?.feedback?.total
                            ? Math.round(
                                ((stats?.feedback?.bySentiment?.negative || 0) /
                                  stats.feedback.total) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.feedback?.total
                                ? ((stats?.feedback?.bySentiment?.negative ||
                                    0) /
                                    stats.feedback.total) *
                                  100
                                : 33
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700 rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-blue-400">
                      {stats?.feedback?.total || 0}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Total Feedback</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700 rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-green-400">
                      {stats?.feedback?.bySentiment?.positive || 0}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Positive Feedback
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700 rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-purple-400">
                      {stats?.feedback?.bySentiment?.negative || 0}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Negative Feedback
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700 rounded-lg p-4 text-center">
                    <p className="text-4xl font-bold text-yellow-400">
                      {stats?.feedback?.bySentiment?.neutral || 0}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Neutral Feedback
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span> System Status
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">
                    {stats?.users?.total || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Total Users</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {stats?.users?.online || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Online Now</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {stats?.feedback?.total || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Total Feedback</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">
                    {health?.server === "healthy" ? "✅" : "⚠️"}
                  </p>
                  <p className="text-gray-400 text-sm">System Health</p>
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    📊 Full Analytics Dashboard
                  </h3>
                  <p className="text-gray-300 mt-1">
                    View detailed charts, sentiment trends, and user activity
                    over time
                  </p>
                </div>
                <Link
                  to="/analytics"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
                >
                  Open Analytics →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-blue-800/20",
    green:
      "border-green-500/30 bg-gradient-to-br from-green-900/40 to-green-800/20",
    purple:
      "border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-purple-800/20",
    yellow:
      "border-yellow-500/30 bg-gradient-to-br from-yellow-900/40 to-yellow-800/20",
    red: "border-red-500/30 bg-gradient-to-br from-red-900/40 to-red-800/20",
  };

  const iconBg = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <div
      className={`${colors[color]} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${iconBg[color]} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
        >
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-4xl font-bold">
        <AnimatedCounter
          end={typeof value === "number" ? value : parseInt(value) || 0}
        />
      </h3>
      <p className="text-gray-400 text-sm mt-1">{title}</p>
    </div>
  );
};

const HealthCard = ({ title, status }) => {
  const statusColors = {
    healthy: "bg-green-600",
    unhealthy: "bg-red-600",
    unavailable: "bg-yellow-600",
    unknown: "bg-gray-600",
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span
          className={`${
            statusColors[status] || statusColors.unknown
          } px-3 py-1 rounded-full text-xs font-semibold`}
        >
          {status || "unknown"}
        </span>
      </div>
    </div>
  );
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const MetricCard = ({ name, type, description }) => {
  const typeColors = {
    Counter: "bg-blue-600",
    Gauge: "bg-green-600",
    Histogram: "bg-purple-600",
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm text-yellow-400">{name}</code>
        <span
          className={`${
            typeColors[type] || "bg-gray-600"
          } px-2 py-0.5 rounded text-xs`}
        >
          {type}
        </span>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default AdminDashboard;
