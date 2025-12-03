import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { feedbackAPI } from "../services/api";
import Navbar from "../components/Navbar";

const Analytics = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await feedbackAPI.getStats();
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err) {
        setError("Failed to load analytics data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const sentimentColors = {
    positive: {
      bg: "bg-green-100",
      text: "text-green-800",
      bar: "bg-green-500",
    },
    negative: { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
    neutral: { bg: "bg-gray-100", text: "text-gray-800", bar: "bg-gray-500" },
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
      <Navbar user={user} />

      <div className={`max-w-7xl mx-auto px-6 py-8 ${darkMode ? "bg-gray-900" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>📊 Analytics</h1>
            <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              View detailed feedback analytics and sentiment trends
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${
            darkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"
          }`}>
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Feedback"
            value={stats?.total || 0}
            icon="📝"
            color="blue"
            darkMode={darkMode}
          />
          <StatCard
            title="Positive"
            value={stats?.breakdown?.positive?.count || 0}
            percentage={stats?.breakdown?.positive?.percentage || 0}
            icon="😊"
            color="green"
            darkMode={darkMode}
          />
          <StatCard
            title="Neutral"
            value={stats?.breakdown?.neutral?.count || 0}
            percentage={stats?.breakdown?.neutral?.percentage || 0}
            icon="😐"
            color="gray"
            darkMode={darkMode}
          />
          <StatCard
            title="Negative"
            value={stats?.breakdown?.negative?.count || 0}
            percentage={stats?.breakdown?.negative?.percentage || 0}
            icon="😞"
            color="red"
            darkMode={darkMode}
          />
        </div>

        {/* Sentiment Distribution */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
            Sentiment Distribution
          </h2>

          {stats?.total > 0 ? (
            <div className="space-y-4">
              {["positive", "neutral", "negative"].map((sentiment) => {
                const data = stats?.breakdown?.[sentiment];
                const percentage = parseFloat(data?.percentage || 0);
                const colors = sentimentColors[sentiment];

                return (
                  <div key={sentiment} className="flex items-center">
                    <span className={`w-24 text-sm font-medium capitalize ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {sentiment}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className={`h-6 rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                        <div
                          className={`h-full ${colors.bar} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span
                      className={`w-20 text-sm font-semibold ${darkMode ? (sentiment === "positive" ? "text-green-300" : sentiment === "negative" ? "text-red-300" : "text-gray-300") : colors.text}`}
                    >
                      {percentage}%
                    </span>
                    <span className={`w-16 text-sm text-right ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      ({data?.count || 0})
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              <p className="text-lg">No feedback data yet</p>
              <p className="text-sm mt-2">
                Submit some feedback to see analytics
              </p>
              <button
                onClick={() => navigate("/feedback")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>

        {/* Average Confidence */}
        {stats?.total > 0 && (
          <div className={`rounded-lg shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Analysis Confidence
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {["positive", "neutral", "negative"].map((sentiment) => {
                const data = stats?.breakdown?.[sentiment];
                const confidence = parseFloat(data?.avgConfidence || 0) * 100;
                const colors = sentimentColors[sentiment];

                return (
                  <div
                    key={sentiment}
                    className={`${darkMode ? (sentiment === "positive" ? "bg-green-900 border border-green-700" : sentiment === "negative" ? "bg-red-900 border border-red-700" : "bg-gray-700 border border-gray-600") : colors.bg} rounded-lg p-4`}
                  >
                    <h3 className={`font-semibold capitalize ${darkMode ? (sentiment === "positive" ? "text-green-300" : sentiment === "negative" ? "text-red-300" : "text-gray-300") : colors.text}`}>
                      {sentiment}
                    </h3>
                    <p className={`text-2xl font-bold mt-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {confidence.toFixed(1)}%
                    </p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Avg. Confidence</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, percentage, icon, color, darkMode }) => {
  const colorClasses = {
    blue: darkMode ? "bg-blue-900 border-blue-700" : "bg-blue-50 border-blue-200",
    green: darkMode ? "bg-green-900 border-green-700" : "bg-green-50 border-green-200",
    gray: darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200",
    red: darkMode ? "bg-red-900 border-red-700" : "bg-red-50 border-red-200",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        {percentage !== undefined && (
          <span className={`text-sm font-medium ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}>
            {percentage}%
          </span>
        )}
      </div>
      <h3 className={`text-2xl font-bold mt-3 ${
        darkMode ? "text-white" : "text-gray-800"
      }`}>{value}</h3>
      <p className={`text-sm ${
        darkMode ? "text-gray-400" : "text-gray-600"
      }`}>{title}</p>
    </div>
  );
};

export default Analytics;
