import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { feedbackAPI } from "../services/api";
import Navbar from "../components/Navbar";

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 1000, suffix = "" }) => {
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

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

// Circular Progress Component
const CircularProgress = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "#3B82F6",
  darkMode,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={darkMode ? "#374151" : "#E5E7EB"}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-2xl font-bold ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ icon, title, time, type, darkMode }) => {
  const typeColors = {
    success: "bg-green-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
    neutral: "bg-gray-500",
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:scale-[1.02] ${
        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full ${typeColors[type]} flex items-center justify-center text-white text-lg flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </p>
        <p
          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {time}
        </p>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ icon, label, onClick, gradient }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg ${gradient}`}
  >
    <div className="relative z-10 flex flex-col items-center gap-2">
      <span className="text-3xl transform group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <span className="text-sm font-medium text-white">{label}</span>
    </div>
  </button>
);

// Stat Card Component
const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  color,
  darkMode,
  onClick,
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    pink: "from-pink-500 to-pink-600",
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
        darkMode ? "bg-gray-800" : "bg-white shadow-md"
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorClasses[color]} opacity-20 rounded-bl-full`}
      ></div>
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-3xl font-bold mt-1 ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            <AnimatedCounter end={value} />
          </p>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trendUp ? "text-green-500" : "text-red-500"
              }`}
            >
              <span>{trendUp ? "↑" : "↓"}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`text-4xl p-3 rounded-full bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// Feature Card Component with Hover Effects
const FeatureCard = ({
  icon,
  title,
  description,
  path,
  color,
  darkMode,
  navigate,
}) => {
  const gradients = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600",
  };

  return (
    <div
      onClick={() => navigate(path)}
      className={`group relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all duration-500 hover:shadow-2xl ${
        darkMode
          ? "bg-gray-800 hover:bg-gray-750"
          : "bg-white hover:bg-gray-50 shadow-lg"
      }`}
    >
      {/* Animated Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradients[color]} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      ></div>

      {/* Floating Icon */}
      <div
        className={`relative z-10 w-14 h-14 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center text-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
      >
        {icon}
      </div>

      <h3
        className={`relative z-10 text-xl font-bold mt-4 ${
          darkMode ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h3>

      <p
        className={`relative z-10 text-sm mt-2 ${
          darkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {description}
      </p>

      {/* Arrow Indicator */}
      <div
        className={`absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br ${gradients[color]} flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300`}
      >
        <span className="text-white text-sm">→</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const { darkMode } = useTheme();
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    // Update greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const response = await feedbackAPI.getStats();
      if (response.data.success) {
        setFeedbackStats(response.data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Helper function to get sentiment value from API response
  const getSentimentValue = (sentiment) => {
    // Feedback API returns breakdown.sentiment.count format
    if (feedbackStats?.breakdown?.[sentiment]?.count !== undefined) {
      return feedbackStats.breakdown[sentiment].count;
    }
    return 0;
  };

  const totalFeedback = feedbackStats?.total || 0;
  const positiveCount = getSentimentValue("positive");
  const neutralCount = getSentimentValue("neutral");
  const negativeCount = getSentimentValue("negative");

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode
            ? "dark bg-gray-900"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      >
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const baseFeatures = [
    {
      icon: "📊",
      title: "Analytics",
      description: "View detailed feedback analytics and insights",
      path: "/analytics",
      color: "purple",
    },
    {
      icon: "💬",
      title: "Feedback",
      description: "Manage and analyze customer feedback",
      path: "/feedback",
      color: "blue",
    },
    {
      icon: "⚙️",
      title: "Settings",
      description: "Configure your preferences and profile",
      path: "/settings",
      color: "orange",
    },
  ];

  const adminFeatures = [
    {
      icon: "👥",
      title: "Users",
      description: "Manage team members and roles",
      path: "/users",
      color: "green",
    },
    {
      icon: "🛡️",
      title: "Admin Panel",
      description: "System administration & monitoring",
      path: "/admin",
      color: "red",
    },
  ];

  const features =
    user?.role === "admin" ? [...baseFeatures, ...adminFeatures] : baseFeatures;

  // Mock recent activity for demo
  const recentActivity = [
    {
      icon: "📝",
      title: "New feedback submitted",
      time: "5 minutes ago",
      type: "success",
    },
    {
      icon: "📊",
      title: "Analytics report generated",
      time: "1 hour ago",
      type: "info",
    },
    {
      icon: "✅",
      title: "Feedback marked as resolved",
      time: "2 hours ago",
      type: "success",
    },
    {
      icon: "👤",
      title: "Profile updated",
      time: "Yesterday",
      type: "neutral",
    },
  ];

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "dark bg-gray-900"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
      }`}
    >
      <Navbar user={user} />

      <div className={`max-w-7xl mx-auto px-6 py-8`}>
        {/* Hero Welcome Section */}
        <div
          className={`relative overflow-hidden rounded-2xl p-8 mb-8 ${
            darkMode
              ? "bg-gradient-to-r from-gray-800 via-gray-800 to-gray-700"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
          }`}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full animate-pulse"></div>
            <div
              className="absolute bottom-0 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full animate-bounce"
              style={{ animationDuration: "3s" }}
            ></div>
            <div
              className="absolute top-1/2 right-1/3 w-20 h-20 bg-white opacity-10 rounded-full animate-ping"
              style={{ animationDuration: "4s" }}
            ></div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {greeting}, {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Welcome back to your feedback management dashboard
              </p>
            </div>

            {/* Profile Quick View */}
            <div
              className={`flex items-center gap-4 px-6 py-4 rounded-xl ${
                darkMode ? "bg-gray-700/50" : "bg-white/20"
              } backdrop-blur-sm`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white/30">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {user?.name}
                </h3>
                <p className="text-blue-200 text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user?.isAccountVerified
                        ? "bg-green-500/30 text-green-200"
                        : "bg-yellow-500/30 text-yellow-200"
                    }`}
                  >
                    {user?.isAccountVerified ? "✓ Verified" : "⏳ Pending"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/30 text-blue-200 capitalize">
                    {user?.role || "Member"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Feedback"
            value={totalFeedback}
            icon="💬"
            trend="+12% this week"
            trendUp={true}
            color="blue"
            darkMode={darkMode}
            onClick={() => navigate("/feedback")}
          />
          <StatCard
            title="Positive"
            value={positiveCount}
            icon="😊"
            trend="+8% growth"
            trendUp={true}
            color="green"
            darkMode={darkMode}
            onClick={() => navigate("/analytics")}
          />
          <StatCard
            title="Neutral"
            value={neutralCount}
            icon="😐"
            color="orange"
            darkMode={darkMode}
            onClick={() => navigate("/analytics")}
          />
          <StatCard
            title="Negative"
            value={negativeCount}
            icon="😞"
            trend="-5% reduced"
            trendUp={false}
            color="pink"
            darkMode={darkMode}
            onClick={() => navigate("/analytics")}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Features */}
          <div className="lg:col-span-2">
            <h2
              className={`text-xl font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              🚀 Quick Access
            </h2>
            <div
              className={`grid sm:grid-cols-2 ${
                user?.role === "admin" ? "lg:grid-cols-3" : "lg:grid-cols-3"
              } gap-4`}
            >
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  path={feature.path}
                  color={feature.color}
                  darkMode={darkMode}
                  navigate={navigate}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2
                className={`text-xl font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <QuickActionButton
                  icon="➕"
                  label="New Feedback"
                  onClick={() => navigate("/feedback")}
                  gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <QuickActionButton
                  icon="📊"
                  label="View Reports"
                  onClick={() => navigate("/analytics")}
                  gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <QuickActionButton
                  icon="⭐"
                  label="Rate Us"
                  onClick={() => navigate("/settings")}
                  gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
                />
                <QuickActionButton
                  icon="⚙️"
                  label="Settings"
                  onClick={() => navigate("/settings")}
                  gradient="bg-gradient-to-br from-gray-500 to-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Feedback Progress */}
            <div
              className={`rounded-xl p-6 ${
                darkMode ? "bg-gray-800" : "bg-white shadow-lg"
              }`}
            >
              <h3
                className={`text-lg font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                📈 Sentiment Overview
              </h3>
              <div className="flex justify-center mb-4">
                <CircularProgress
                  value={positiveCount}
                  max={totalFeedback || 1}
                  color="#10B981"
                  darkMode={darkMode}
                />
              </div>
              <p
                className={`text-center text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Positive feedback rate
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    😊 Positive
                  </span>
                  <span
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {positiveCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    😐 Neutral
                  </span>
                  <span
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {neutralCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    😞 Negative
                  </span>
                  <span
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {negativeCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className={`rounded-xl p-6 ${
                darkMode ? "bg-gray-800" : "bg-white shadow-lg"
              }`}
            >
              <h3
                className={`text-lg font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                🕐 Recent Activity
              </h3>
              <div className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <ActivityItem
                    key={index}
                    icon={activity.icon}
                    title={activity.title}
                    time={activity.time}
                    type={activity.type}
                    darkMode={darkMode}
                  />
                ))}
              </div>
              <button
                onClick={() => navigate("/analytics")}
                className={`w-full mt-4 py-2 text-sm font-medium rounded-lg transition ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                View All Activity →
              </button>
            </div>

            {/* Tip of the Day */}
            <div
              className={`rounded-xl p-6 bg-gradient-to-br ${
                darkMode
                  ? "from-blue-900/50 to-purple-900/50"
                  : "from-blue-50 to-purple-50"
              } border ${darkMode ? "border-blue-800" : "border-blue-200"}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4
                    className={`font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Tip of the Day
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Regular feedback analysis helps identify trends and improve
                    customer satisfaction!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
