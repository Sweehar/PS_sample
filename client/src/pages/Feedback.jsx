import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { feedbackAPI } from "../services/api";
import Navbar from "../components/Navbar";

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
      positive: darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800",
      negative: darkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800",
      neutral: darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800",
    };
    return badges[sentiment] || badges.neutral;
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading...</p>
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
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>💬 Feedback</h1>
            <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Submit and manage customer feedback with AI sentiment analysis
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Submit Feedback Form */}
          <div className="lg:col-span-1">
            <div className={`rounded-lg shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
                Submit New Feedback
              </h2>

              <form onSubmit={handleSubmit}>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter customer feedback here... Our AI will analyze the sentiment."
                  className={`w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    darkMode
                      ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-black"
                  }`}
                  maxLength={5000}
                />
                <div className={`flex justify-between items-center mt-2 text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  <span>{feedbackText.length}/5000 characters</span>
                </div>

                {message.text && (
                  <div
                    className={`mt-4 p-3 rounded-lg text-sm ${
                      message.type === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !feedbackText.trim()}
                  className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Analyzing with AI...
                    </span>
                  ) : (
                    "🚀 Analyze Feedback"
                  )}
                </button>
              </form>

              {/* Immediate Analysis Result */}
              {lastAnalysis && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📊 Analysis Result
                    {lastAnalysis.analysis?.aiProcessed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        AI Powered
                      </span>
                    )}
                  </h3>

                  {/* Main Sentiment */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`text-4xl ${
                        lastAnalysis.analysis?.sentiment === "positive"
                          ? "text-green-500"
                          : lastAnalysis.analysis?.sentiment === "negative"
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {lastAnalysis.analysis?.sentiment === "positive"
                        ? "😊"
                        : lastAnalysis.analysis?.sentiment === "negative"
                        ? "😞"
                        : "😐"}
                    </div>
                    <div>
                      <p className="text-2xl font-bold capitalize">
                        {lastAnalysis.analysis?.sentiment}
                      </p>
                      <p className="text-sm text-gray-600">
                        Confidence: {lastAnalysis.analysis?.confidencePercent}
                      </p>
                    </div>
                  </div>

                  {/* All Scores */}
                  {lastAnalysis.analysis?.allScores?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Sentiment Breakdown:
                      </p>
                      <div className="space-y-2">
                        {lastAnalysis.analysis.allScores.map((score, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs w-20 text-gray-600">
                              {score.label}:
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full ${
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
                                style={{ width: score.percentage }}
                              />
                            </div>
                            <span className="text-xs w-14 text-right font-medium">
                              {score.percentage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Intents */}
                  {lastAnalysis.analysis?.intents?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Detected Intents:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {lastAnalysis.analysis.intents.map((intent, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {intent.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-blue-100">
                    <span>📝 {lastAnalysis.metrics?.wordCount} words</span>
                    <span>🔤 {lastAnalysis.metrics?.charCount} chars</span>
                    <span>
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
            <div className={`rounded-lg shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Feedback History
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {pagination.total} total
                  </span>
                  {feedbackList.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <p className="text-lg">No feedback submitted yet</p>
                  <p className="text-sm mt-2">
                    Submit your first feedback to see it here
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {feedbackList.map((item, index) => (
                      <div
                        key={item.jobId || index}
                        className={`border rounded-lg p-4 hover:shadow-md transition ${
                          darkMode
                            ? "border-gray-600 bg-gray-800"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Header with sentiment badge and emoji */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-2xl">
                              {item.sentiment === "positive"
                                ? "😊"
                                : item.sentiment === "negative"
                                ? "😞"
                                : "😐"}
                            </span>
                            <p className={`${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.text}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSentimentBadge(
                                item.sentiment
                              )}`}
                            >
                              {item.sentiment?.toUpperCase() || "PROCESSING"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.confidencePercent ||
                                `${(item.confidence * 100).toFixed(1)}%`}
                            </span>
                          </div>
                        </div>

                        {/* All Sentiment Scores with bars */}
                        {item.allScores && item.allScores.length > 0 && (
                          <div className={`mt-3 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                            <p className={`text-xs font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              Sentiment Analysis:
                            </p>
                            <div className="space-y-1">
                              {item.allScores.map((score, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2"
                                >
                                  <span className={`text-xs w-20 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    {score.label}:
                                  </span>
                                  <div className={`flex-1 rounded-full h-2 ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>
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
                                  <span className={`text-xs w-12 text-right ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
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
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Detected Intents:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {item.intents.map((intent, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                >
                                  {intent.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer with timestamp and metrics */}
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2">
                          <div className="flex items-center gap-3">
                            <span>
                              {item.processedAt
                                ? new Date(item.processedAt).toLocaleString()
                                : "Pending"}
                            </span>
                            {item.metadata?.wordCount > 0 && (
                              <span>📝 {item.metadata.wordCount} words</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.aiProcessed !== undefined && (
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  item.aiProcessed
                                    ? "bg-green-100 text-green-600"
                                    : "bg-yellow-100 text-yellow-600"
                                }`}
                              >
                                {item.aiProcessed ? "🤖 AI" : "📋 Fallback"}
                              </span>
                            )}
                            {item.metadata?.source && (
                              <span className="text-gray-400">
                                {item.metadata.source}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => fetchFeedback(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => fetchFeedback(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
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
