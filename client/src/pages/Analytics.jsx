import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { feedbackAPI, adminAPI } from "../services/api";
import Navbar from "../components/Navbar";

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 1000, decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(progress * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    if (end > 0) requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span>{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}</span>
  );
};

// Circular Progress Ring
const CircularProgress = ({
  value,
  max,
  size = 100,
  strokeWidth = 8,
  color = "#3B82F6",
  label,
  darkMode,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-xl font-bold ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {Math.round(progress)}%
        </span>
      </div>
      {label && (
        <span
          className={`mt-2 text-sm font-medium ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ data, darkMode }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-around h-48 gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="relative w-full flex justify-center mb-2">
            <div
              className={`w-8 md:w-12 rounded-t-lg transition-all duration-700 ${item.color}`}
              style={{
                height: `${(item.value / maxValue) * 150}px`,
                minHeight: item.value > 0 ? "20px" : "4px",
              }}
            >
              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">
                {item.value}
              </span>
            </div>
          </div>
          <span
            className={`text-xs text-center ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Trend Indicator
const TrendIndicator = ({ value, isPositive }) => (
  <div
    className={`flex items-center gap-1 text-sm ${
      isPositive ? "text-green-500" : "text-red-500"
    }`}
  >
    <span>{isPositive ? "↑" : "↓"}</span>
    <span>{value}%</span>
  </div>
);

const Analytics = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchStats = async (forceRefresh = false) => {
    try {
      setRefreshing(true);
      const [feedbackRes, adminRes] = await Promise.all([
        feedbackAPI.getStats(forceRefresh),
        user?.role === "admin"
          ? adminAPI.getStats(forceRefresh)
          : Promise.resolve(null),
      ]);

      if (feedbackRes.data.success) {
        setStats(feedbackRes.data.stats);
      }
      if (adminRes?.data?.success) {
        setAdminStats(adminRes.data.stats);
      }
    } catch (err) {
      setError("Failed to load analytics data");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats(false); // Use cache on initial load
    }
  }, [isAuthenticated, user]);

  if (authLoading || loading) {
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
          <p
            className={`mt-4 font-medium ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // Use breakdown from feedback API or bySentiment from admin API
  const getSentimentValue = (sentiment) => {
    // Try feedback API format first (breakdown.sentiment.count)
    if (stats?.breakdown?.[sentiment]?.count !== undefined) {
      return stats.breakdown[sentiment].count;
    }
    // Try admin API format (bySentiment.sentiment)
    if (adminStats?.feedback?.bySentiment?.[sentiment] !== undefined) {
      return adminStats.feedback.bySentiment[sentiment];
    }
    return 0;
  };

  const sentimentData = [
    {
      label: "Positive",
      value: getSentimentValue("positive"),
      color: "bg-green-500",
    },
    {
      label: "Neutral",
      value: getSentimentValue("neutral"),
      color: "bg-gray-500",
    },
    {
      label: "Negative",
      value: getSentimentValue("negative"),
      color: "bg-red-500",
    },
  ];

  // Get total from feedback API or admin API
  const totalFeedback = stats?.total || adminStats?.feedback?.total || 0;
  const positiveCount = getSentimentValue("positive");
  const negativeCount = getSentimentValue("negative");
  const positiveRate =
    totalFeedback > 0 ? (positiveCount / totalFeedback) * 100 : 0;
  const negativeRate =
    totalFeedback > 0 ? (negativeCount / totalFeedback) * 100 : 0;

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
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1
              className={`text-3xl font-bold flex items-center gap-3 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              <span className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                📊
              </span>
              Analytics Dashboard
            </h1>
            <p
              className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Real-time insights from your feedback data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                darkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-md"
              } ${refreshing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-xl hover:from-gray-700 hover:to-gray-800 transition shadow-lg"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div
            className={`px-4 py-3 rounded-xl mb-6 flex items-center gap-3 ${
              darkMode
                ? "bg-red-900/50 text-red-300 border border-red-700"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Feedback"
            value={totalFeedback}
            icon="📝"
            color="blue"
            darkMode={darkMode}
          />
          <StatCard
            title="Positive"
            value={positiveCount}
            percentage={positiveRate.toFixed(1)}
            icon="😊"
            color="green"
            trend="+12%"
            trendUp={true}
            darkMode={darkMode}
          />
          <StatCard
            title="Neutral"
            value={getSentimentValue("neutral")}
            percentage={
              totalFeedback > 0
                ? (
                    (getSentimentValue("neutral") / totalFeedback) *
                    100
                  ).toFixed(1)
                : 0
            }
            icon="😐"
            color="gray"
            darkMode={darkMode}
          />
          <StatCard
            title="Negative"
            value={negativeCount}
            percentage={negativeRate.toFixed(1)}
            icon="😞"
            color="red"
            trend="-5%"
            trendUp={false}
            darkMode={darkMode}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Sentiment Distribution Chart */}
          <div
            className={`lg:col-span-2 rounded-2xl shadow-lg p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                📈 Sentiment Distribution
              </h2>
              <div className="flex gap-2">
                {["all", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      selectedTimeRange === range
                        ? "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {range === "all"
                      ? "All Time"
                      : range === "week"
                      ? "This Week"
                      : "This Month"}
                  </button>
                ))}
              </div>
            </div>

            {totalFeedback > 0 ? (
              <>
                <BarChart data={sentimentData} darkMode={darkMode} />

                {/* Sentiment Progress Bars */}
                <div className="mt-8 space-y-4">
                  {sentimentData.map((item) => {
                    const percentage =
                      totalFeedback > 0
                        ? (item.value / totalFeedback) * 100
                        : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-4">
                        <span
                          className={`w-20 text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {item.label}
                        </span>
                        <div className="flex-1">
                          <div
                            className={`h-4 rounded-full overflow-hidden ${
                              darkMode ? "bg-gray-700" : "bg-gray-200"
                            }`}
                          >
                            <div
                              className={`h-full ${item.color} transition-all duration-1000 ease-out rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span
                          className={`w-16 text-right text-sm font-bold ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {percentage.toFixed(1)}%
                        </span>
                        <span
                          className={`w-12 text-right text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          ({item.value})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                className={`text-center py-12 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <span className="text-5xl mb-4 block">📭</span>
                <p className="text-lg font-medium">No feedback data yet</p>
                <p className="text-sm mt-2">
                  Submit some feedback to see analytics
                </p>
                <button
                  onClick={() => navigate("/feedback")}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                >
                  Submit Feedback →
                </button>
              </div>
            )}
          </div>

          {/* Circular Progress Cards */}
          <div className="space-y-6">
            <div
              className={`rounded-2xl shadow-lg p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-lg font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                🎯 Satisfaction Rate
              </h3>
              <div className="flex justify-center">
                <CircularProgress
                  value={positiveCount}
                  max={totalFeedback || 1}
                  size={140}
                  strokeWidth={12}
                  color="#10B981"
                  label="Positive"
                  darkMode={darkMode}
                />
              </div>
              <div
                className={`mt-4 text-center ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <p className="text-sm">
                  {positiveCount} out of {totalFeedback} feedbacks
                </p>
              </div>
            </div>

            <div
              className={`rounded-2xl shadow-lg p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-lg font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                ⚡ Quick Stats
              </h3>
              <div className="space-y-4">
                <div
                  className={`flex justify-between items-center p-3 rounded-xl ${
                    darkMode ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Avg Confidence
                  </span>
                  <span
                    className={`font-bold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {(() => {
                      // Get avg confidence from admin API or calculate from feedback breakdown
                      const adminAvg = adminStats?.feedback?.avgConfidence;
                      if (adminAvg) return `${(adminAvg * 100).toFixed(0)}%`;

                      // Calculate from breakdown avgConfidence values
                      const breakdownConfs = ["positive", "neutral", "negative"]
                        .map((s) =>
                          parseFloat(stats?.breakdown?.[s]?.avgConfidence || 0)
                        )
                        .filter((v) => v > 0);
                      if (breakdownConfs.length > 0) {
                        const avg =
                          breakdownConfs.reduce((a, b) => a + b, 0) /
                          breakdownConfs.length;
                        return `${(avg * 100).toFixed(0)}%`;
                      }
                      return "N/A";
                    })()}
                  </span>
                </div>
                {user?.role === "admin" && adminStats && (
                  <>
                    <div
                      className={`flex justify-between items-center p-3 rounded-xl ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Total Users
                      </span>
                      <span
                        className={`font-bold ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {adminStats?.users?.total || 0}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between items-center p-3 rounded-xl ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Online Now
                      </span>
                      <span className="font-bold text-green-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {adminStats?.users?.online || 0}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Analysis */}
        {totalFeedback > 0 && (
          <div
            className={`rounded-2xl shadow-lg p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              🧠 AI Confidence Analysis
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {["positive", "neutral", "negative"].map((sentiment) => {
                const count = getSentimentValue(sentiment);
                const colors = {
                  positive: {
                    bg: darkMode
                      ? "from-green-900/50 to-green-800/30"
                      : "from-green-50 to-green-100",
                    border: "border-green-500",
                    text: "text-green-500",
                  },
                  neutral: {
                    bg: darkMode
                      ? "from-gray-700/50 to-gray-600/30"
                      : "from-gray-50 to-gray-100",
                    border: "border-gray-500",
                    text: "text-gray-500",
                  },
                  negative: {
                    bg: darkMode
                      ? "from-red-900/50 to-red-800/30"
                      : "from-red-50 to-red-100",
                    border: "border-red-500",
                    text: "text-red-500",
                  },
                };
                const icons = { positive: "😊", neutral: "😐", negative: "😞" };

                return (
                  <div
                    key={sentiment}
                    className={`bg-gradient-to-br ${colors[sentiment].bg} rounded-xl p-5 border-l-4 ${colors[sentiment].border} hover:scale-105 transition-transform cursor-pointer`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{icons[sentiment]}</span>
                      <h3
                        className={`font-bold capitalize ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {sentiment}
                      </h3>
                    </div>
                    <p
                      className={`text-3xl font-bold ${colors[sentiment].text}`}
                    >
                      <AnimatedCounter end={count} />
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {totalFeedback > 0
                        ? ((count / totalFeedback) * 100).toFixed(1)
                        : 0}
                      % of total
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin Stats Section */}
        {user?.role === "admin" && adminStats && (
          <div
            className={`mt-8 rounded-2xl shadow-lg p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-6 flex items-center gap-2 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              🛡️ Admin Insights
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div
                className={`p-4 rounded-xl ${
                  darkMode
                    ? "bg-gradient-to-br from-blue-900/50 to-blue-800/30"
                    : "bg-gradient-to-br from-blue-50 to-blue-100"
                }`}
              >
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Total Users
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <AnimatedCounter end={adminStats?.users?.total || 0} />
                </p>
              </div>
              <div
                className={`p-4 rounded-xl ${
                  darkMode
                    ? "bg-gradient-to-br from-green-900/50 to-green-800/30"
                    : "bg-gradient-to-br from-green-50 to-green-100"
                }`}
              >
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Verified Users
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <AnimatedCounter end={adminStats?.users?.verified || 0} />
                </p>
              </div>
              <div
                className={`p-4 rounded-xl ${
                  darkMode
                    ? "bg-gradient-to-br from-purple-900/50 to-purple-800/30"
                    : "bg-gradient-to-br from-purple-50 to-purple-100"
                }`}
              >
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Admins
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <AnimatedCounter
                    end={adminStats?.users?.byRole?.admin || 0}
                  />
                </p>
              </div>
              <div
                className={`p-4 rounded-xl ${
                  darkMode
                    ? "bg-gradient-to-br from-yellow-900/50 to-yellow-800/30"
                    : "bg-gradient-to-br from-yellow-50 to-yellow-100"
                }`}
              >
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Managers
                </p>
                <p
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <AnimatedCounter
                    end={adminStats?.users?.byRole?.manager || 0}
                  />
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  percentage,
  icon,
  color,
  trend,
  trendUp,
  darkMode,
}) => {
  const colorClasses = {
    blue: {
      bg: darkMode
        ? "from-blue-900/50 to-blue-800/30 border-blue-700"
        : "from-blue-50 to-blue-100 border-blue-200",
      icon: "from-blue-500 to-blue-600",
    },
    green: {
      bg: darkMode
        ? "from-green-900/50 to-green-800/30 border-green-700"
        : "from-green-50 to-green-100 border-green-200",
      icon: "from-green-500 to-green-600",
    },
    gray: {
      bg: darkMode
        ? "from-gray-700/50 to-gray-600/30 border-gray-600"
        : "from-gray-50 to-gray-100 border-gray-200",
      icon: "from-gray-500 to-gray-600",
    },
    red: {
      bg: darkMode
        ? "from-red-900/50 to-red-800/30 border-red-700"
        : "from-red-50 to-red-100 border-red-200",
      icon: "from-red-500 to-red-600",
    },
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color].bg} border rounded-2xl p-5 hover:scale-105 transition-all duration-300 cursor-pointer group`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color].icon} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
        >
          <span className="text-xl">{icon}</span>
        </div>
        {percentage !== undefined && (
          <span
            className={`text-sm font-medium px-2 py-1 rounded-lg ${
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-white/80 text-gray-600"
            }`}
          >
            {percentage}%
          </span>
        )}
      </div>
      <h3
        className={`text-3xl font-bold ${
          darkMode ? "text-white" : "text-gray-800"
        }`}
      >
        <AnimatedCounter end={value} />
      </h3>
      <div className="flex items-center justify-between mt-1">
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          {title}
        </p>
        {trend && (
          <TrendIndicator
            value={trend.replace(/[^0-9]/g, "")}
            isPositive={trendUp}
          />
        )}
      </div>
    </div>
  );
};

export default Analytics;
