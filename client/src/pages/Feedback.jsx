import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { feedbackAPI } from "../services/api";
import Navbar from "../components/Navbar";

// Animated Typing Indicator
const TypingIndicator = () => (
  <div className="flex items-center gap-1">
    <div
      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    ></div>
    <div
      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
      style={{ animationDelay: "300ms" }}
    ></div>
  </div>
);

// Sentiment Emoji Component
const SentimentEmoji = ({ sentiment, size = "md" }) => {
  const sizes = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" };
  const emojis = { positive: "😊", negative: "😞", neutral: "😐" };
  const colors = {
    positive: "from-green-400 to-emerald-500",
    negative: "from-red-400 to-rose-500",
    neutral: "from-gray-400 to-gray-500",
  };
  return (
    <div
      className={`${sizes[size]} bg-gradient-to-br ${
        colors[sentiment] || colors.neutral
      } p-3 rounded-2xl shadow-lg`}
    >
      {emojis[sentiment] || emojis.neutral}
    </div>
  );
};

const Feedback = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [lastAnalysis, setLastAnalysis] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchFeedback = async (page = 1) => {
    try {
      const response = await feedbackAPI.getHistory(page, 10);
      if (response.data.success) {
        setFeedbackList(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedback();
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setMessage({ type: "error", text: "Please enter feedback text" });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });
    setLastAnalysis(null);

    try {
      const response = await feedbackAPI.submit(feedbackText.trim());
      if (response.data.success) {
        // Store the analysis result to display
        setLastAnalysis(response.data);
        setMessage({
          type: "success",
          text: `✅ Feedback analyzed successfully!`,
        });
        setFeedbackText("");
        // Refresh the list
        fetchFeedback();
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to submit feedback";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearHistory = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all your feedback history? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await feedbackAPI.clearHistory();
      if (response.data.success) {
        setFeedbackList([]);
        setPagination({ page: 1, pages: 1, total: 0 });
        setLastAnalysis(null);
        setMessage({
          type: "success",
          text: `✅ Cleared ${response.data.deletedCount} feedback entries`,
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to clear history",
      });
    }
  };

  const getSentimentBadge = (sentiment) => {
    const badges = {
      positive: darkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800",
      negative: darkMode
        ? "bg-red-900 text-red-300"
        : "bg-red-100 text-red-800",
      neutral: darkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-800",
    };
    return badges[sentiment] || badges.neutral;
  };

  if (authLoading) {
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
              <span className="text-white text-lg">💬</span>
            </div>
          </div>
          <p
            className={`text-lg font-medium ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Loading feedback...
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
              : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-16 translate-y-16"></div>

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                💬 AI Feedback Analysis
              </h1>
              <p className="text-purple-100 text-lg">
                Submit customer feedback and get instant AI-powered sentiment
                analysis
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2 border border-white/20"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Submit Feedback Form */}
          <div className="lg:col-span-1">
            <div
              className={`rounded-2xl shadow-xl p-6 ${
                darkMode
                  ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                  : "bg-white border border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg">
                  ✍️
                </div>
                <div>
                  <h2
                    className={`text-xl font-bold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    New Feedback
                  </h2>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    AI-powered analysis
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Enter customer feedback here... Our AI will analyze the sentiment, detect emotions, and identify key topics."
                    className={`w-full h-44 p-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition ${
                      darkMode
                        ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-200 bg-gray-50 text-black placeholder-gray-500"
                    }`}
                    maxLength={5000}
                  />
                  {feedbackText.length > 0 && (
                    <div
                      className={`absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs ${
                        feedbackText.length > 4500
                          ? "bg-red-100 text-red-600"
                          : darkMode
                          ? "bg-gray-700 text-gray-400"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {feedbackText.length}/5000
                    </div>
                  )}
                </div>

                {message.text && (
                  <div
                    className={`mt-4 p-4 rounded-xl text-sm flex items-center gap-3 ${
                      message.type === "error"
                        ? darkMode
                          ? "bg-red-900/50 border border-red-700 text-red-300"
                          : "bg-red-100 border border-red-300 text-red-700"
                        : darkMode
                        ? "bg-green-900/50 border border-green-700 text-green-300"
                        : "bg-green-100 border border-green-300 text-green-700"
                    }`}
                  >
                    <span className="text-lg">
                      {message.type === "error" ? "❌" : "✅"}
                    </span>
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !feedbackText.trim()}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <TypingIndicator />
                      <span>Analyzing with AI...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>🚀</span> Analyze Feedback
                    </span>
                  )}
                </button>
              </form>

              {/* Immediate Analysis Result */}
              {lastAnalysis && (
                <div
                  className={`mt-6 p-5 rounded-2xl border-2 ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600"
                      : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-bold flex items-center gap-2 ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      📊 Analysis Result
                    </h3>
                    {lastAnalysis.analysis?.aiProcessed && (
                      <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full font-medium">
                        🤖 AI Powered
                      </span>
                    )}
                  </div>

                  {/* Main Sentiment with enhanced display */}
                  <div
                    className={`flex items-center gap-4 mb-5 p-4 rounded-xl ${
                      darkMode ? "bg-gray-800/50" : "bg-white/80"
                    } shadow-sm`}
                  >
                    <SentimentEmoji
                      sentiment={lastAnalysis.analysis?.sentiment}
                      size="lg"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-2xl font-bold capitalize ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {lastAnalysis.analysis?.sentiment}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`flex-1 h-2 rounded-full ${
                            darkMode ? "bg-gray-600" : "bg-gray-200"
                          }`}
                        >
                          <div
                            className={`h-2 rounded-full ${
                              lastAnalysis.analysis?.sentiment === "positive"
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : lastAnalysis.analysis?.sentiment ===
                                  "negative"
                                ? "bg-gradient-to-r from-red-400 to-rose-500"
                                : "bg-gradient-to-r from-gray-400 to-gray-500"
                            }`}
                            style={{
                              width:
                                lastAnalysis.analysis?.confidencePercent ||
                                "0%",
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {lastAnalysis.analysis?.confidencePercent}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* All Scores */}
                  {lastAnalysis.analysis?.allScores?.length > 0 && (
                    <div className="mb-4">
                      <p
                        className={`text-sm font-semibold mb-3 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Sentiment Breakdown:
                      </p>
                      <div className="space-y-2">
                        {lastAnalysis.analysis.allScores.map((score, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span
                              className={`text-xs w-20 font-medium ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {score.label}:
                            </span>
                            <div
                              className={`flex-1 rounded-full h-3 ${
                                darkMode ? "bg-gray-600" : "bg-gray-200"
                              }`}
                            >
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  score.label
                                    ?.toLowerCase()
                                    .includes("positive") ||
                                  score.label === "LABEL_2"
                                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                    : score.label
                                        ?.toLowerCase()
                                        .includes("negative") ||
                                      score.label === "LABEL_0"
                                    ? "bg-gradient-to-r from-red-400 to-rose-500"
                                    : "bg-gradient-to-r from-gray-400 to-gray-500"
                                }`}
                                style={{ width: score.percentage }}
                              />
                            </div>
                            <span
                              className={`text-xs w-14 text-right font-bold ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {score.percentage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intents */}
                  {lastAnalysis.analysis?.intents?.length > 0 && (
                    <div className="mb-4">
                      <p
                        className={`text-sm font-semibold mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        🎯 Detected Intents:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lastAnalysis.analysis.intents.map((intent, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-medium shadow-sm"
                          >
                            {intent.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div
                    className={`flex flex-wrap gap-4 text-xs pt-3 border-t ${
                      darkMode
                        ? "border-gray-600 text-gray-400"
                        : "border-blue-200 text-gray-500"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      📝 {lastAnalysis.metrics?.wordCount} words
                    </span>
                    <span className="flex items-center gap-1">
                      🔤 {lastAnalysis.metrics?.charCount} chars
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱️{" "}
                      {new Date(
                        lastAnalysis.metrics?.processedAt
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback History */}
          <div className="lg:col-span-2">
            <div
              className={`rounded-2xl shadow-xl p-6 ${
                darkMode
                  ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                  : "bg-white border border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg">
                    📜
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      History
                    </h2>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {pagination.total} feedback entries
                    </p>
                  </div>
                </div>
                {feedbackList.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className={`px-4 py-2 text-sm rounded-xl transition flex items-center gap-2 ${
                      darkMode
                        ? "bg-red-900/50 text-red-300 hover:bg-red-800/50"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                  >
                    🗑️ Clear All
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <p
                    className={`mt-4 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Loading history...
                  </p>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">📭</span>
                  <p
                    className={`text-xl font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    No feedback yet
                  </p>
                  <p
                    className={`text-sm mt-2 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Submit your first feedback to see the magic happen!
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {feedbackList.map((item, index) => (
                      <div
                        key={item.jobId || index}
                        className={`border-2 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                          darkMode
                            ? "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                            : "border-gray-100 bg-white hover:border-gray-200"
                        }`}
                      >
                        {/* Header with sentiment badge and emoji */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`p-2 rounded-xl ${
                                item.sentiment === "positive"
                                  ? "bg-green-100"
                                  : item.sentiment === "negative"
                                  ? "bg-red-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <span className="text-2xl">
                                {item.sentiment === "positive"
                                  ? "😊"
                                  : item.sentiment === "negative"
                                  ? "😞"
                                  : "😐"}
                              </span>
                            </div>
                            <p
                              className={`${
                                darkMode ? "text-gray-200" : "text-gray-700"
                              } leading-relaxed`}
                            >
                              {item.text}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                                item.sentiment === "positive"
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                  : item.sentiment === "negative"
                                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                              }`}
                            >
                              {item.sentiment?.toUpperCase() || "PROCESSING"}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {item.confidencePercent ||
                                `${(item.confidence * 100).toFixed(1)}%`}{" "}
                              confidence
                            </span>
                          </div>
                        </div>

                        {/* All Sentiment Scores with bars */}
                        {item.allScores && item.allScores.length > 0 && (
                          <div
                            className={`mt-4 p-4 rounded-xl ${
                              darkMode ? "bg-gray-700/50" : "bg-gray-50"
                            }`}
                          >
                            <p
                              className={`text-xs font-bold mb-3 ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              📊 Sentiment Breakdown:
                            </p>
                            <div className="space-y-2">
                              {item.allScores.map((score, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2"
                                >
                                  <span
                                    className={`text-xs w-20 ${
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {score.label}:
                                  </span>
                                  <div
                                    className={`flex-1 rounded-full h-2 ${
                                      darkMode ? "bg-gray-600" : "bg-gray-200"
                                    }`}
                                  >
                                    <div
                                      className={`h-2 rounded-full ${
                                        score.label
                                          ?.toLowerCase()
                                          .includes("positive") ||
                                        score.label === "LABEL_2"
                                          ? "bg-green-500"
                                          : score.label
                                              ?.toLowerCase()
                                              .includes("negative") ||
                                            score.label === "LABEL_0"
                                          ? "bg-red-500"
                                          : "bg-gray-500"
                                      }`}
                                      style={{ width: `${score.score * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs w-12 text-right ${
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {score.percentage ||
                                      `${(score.score * 100).toFixed(1)}%`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detected Intents */}
                        {item.intents && item.intents.length > 0 && (
                          <div className="mt-3">
                            <p
                              className={`text-xs font-semibold mb-2 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              🎯 Detected Intents:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.intents.map((intent, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xs font-medium"
                                >
                                  {intent.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer with timestamp and metrics */}
                        <div
                          className={`flex items-center justify-between mt-4 text-xs pt-3 border-t ${
                            darkMode
                              ? "border-gray-700 text-gray-400"
                              : "border-gray-100 text-gray-500"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              🕐{" "}
                              {item.processedAt
                                ? new Date(item.processedAt).toLocaleString()
                                : "Pending"}
                            </span>
                            {item.metadata?.wordCount > 0 && (
                              <span className="flex items-center gap-1">
                                📝 {item.metadata.wordCount} words
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.aiProcessed !== undefined && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.aiProcessed
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                    : darkMode
                                    ? "bg-yellow-900/50 text-yellow-300"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {item.aiProcessed ? "🤖 AI" : "📋 Fallback"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                      <button
                        onClick={() => fetchFeedback(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                          darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:hover:bg-gray-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100"
                        }`}
                      >
                        ← Previous
                      </button>
                      <span
                        className={`text-sm font-medium px-4 py-2 rounded-xl ${
                          darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => fetchFeedback(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                          darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:hover:bg-gray-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100"
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
