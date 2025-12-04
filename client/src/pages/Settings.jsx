import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { userAPI } from "../services/api";
import Navbar from "../components/Navbar";

// Enhanced Star Rating Component
const StarRating = ({
  rating,
  setRating,
  readonly = false,
  size = "text-3xl",
  darkMode = false,
}) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && setRating(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${size} transition-all duration-200 ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-125"
          }`}
        >
          <span
            className={`drop-shadow-lg transition-all duration-200 ${
              star <= (hover || rating)
                ? "text-yellow-400"
                : darkMode
                ? "text-gray-600"
                : "text-gray-300"
            }`}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    feedbackAlerts: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  // User Rating & Message state
  const [userRating, setUserRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [existingRating, setExistingRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
      });
      // Fetch existing rating
      fetchUserRating();
    }
  }, [user]);

  const fetchUserRating = async () => {
    try {
      const response = await userAPI.getMyRating();
      if (response.data.success && response.data.rating) {
        setExistingRating(response.data.rating);
        setUserRating(response.data.rating.rating);
        setRatingMessage(response.data.rating.message || "");
      }
    } catch (err) {
      console.error("Failed to fetch rating:", err);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (userRating === 0) {
      setMessage({ type: "error", text: "Please select a rating" });
      return;
    }

    setRatingLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await userAPI.submitRating(userRating, ratingMessage);
      if (response.data.success) {
        setExistingRating(response.data.rating);
        setMessage({
          type: "success",
          text: "Thank you for your feedback! Your rating has been saved.",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to submit rating",
      });
    } finally {
      setRatingLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await userAPI.updateProfile(profileForm);
      if (response.data.success) {
        updateUser(response.data.user);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await userAPI.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      if (response.data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      const response = await userAPI.updateNotifications(notifications);
      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Notification preferences saved!",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update notifications" });
    } finally {
      setLoading(false);
    }
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
              <span className="text-white text-lg">⚙️</span>
            </div>
          </div>
          <p
            className={`text-lg font-medium ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "password", label: "Password", icon: "🔒" },
    { id: "rating", label: "Rate Us", icon: "⭐" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
  ];

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "dark bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl mb-8 p-8 ${
            darkMode
              ? "bg-gradient-to-r from-gray-800 via-gray-800 to-gray-700"
              : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-16 translate-y-16"></div>

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                ⚙️ Settings
              </h1>
              <p className="text-purple-100 text-lg">
                Configure your account preferences and personalize your
                experience
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

        <div
          className={`rounded-2xl shadow-xl overflow-hidden ${
            darkMode
              ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
              : "bg-white border border-gray-100"
          }`}
        >
          {/* Tabs */}
          <div
            className={`flex overflow-x-auto border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 text-center font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? darkMode
                      ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700/50"
                      : "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : darkMode
                    ? "text-gray-400 hover:bg-gray-700/50 hover:text-gray-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate}>
                <h2
                  className={`text-xl font-semibold mb-6 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Profile Information
                </h2>

                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mr-6">
                    <span className="text-3xl font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {user?.name}
                    </h3>
                    <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                      {user?.email}
                    </p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        user?.isAccountVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user?.isAccountVerified
                        ? "✓ Verified"
                        : "Pending Verification"}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode
                          ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                          : "border-gray-300 bg-white text-black"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          email: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode
                          ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400 disabled:bg-gray-800"
                          : "border-gray-300 bg-white text-black"
                      }`}
                      disabled
                    />
                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordChange}>
                <h2
                  className={`text-xl font-semibold mb-6 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Change Password
                </h2>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode
                          ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                          : "border-gray-300 bg-white text-black"
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode
                          ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                          : "border-gray-300 bg-white text-black"
                      }`}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode
                          ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
                          : "border-gray-300 bg-white text-black"
                      }`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}

            {/* Rating Tab */}
            {activeTab === "rating" && (
              <div>
                <h2
                  className={`text-xl font-semibold mb-6 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Rate Your Experience ⭐
                </h2>

                {existingRating && (
                  <div
                    className={`mb-6 p-4 rounded-lg ${
                      darkMode
                        ? "bg-green-900 border border-green-700"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        darkMode ? "text-green-300" : "text-green-700"
                      }`}
                    >
                      ✅ You have already submitted a rating. You can update it
                      below.
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}
                    >
                      Last updated:{" "}
                      {new Date(
                        existingRating.updatedAt || existingRating.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <form onSubmit={handleRatingSubmit}>
                  <div
                    className={`p-6 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                    }`}
                  >
                    <div className="text-center mb-6">
                      <p
                        className={`text-lg mb-4 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        How would you rate our platform?
                      </p>
                      <div className="flex justify-center">
                        <StarRating
                          rating={userRating}
                          setRating={setUserRating}
                          darkMode={darkMode}
                        />
                      </div>
                      {userRating > 0 && (
                        <p
                          className={`mt-2 text-sm font-medium ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {userRating === 1
                            ? "😞 Poor"
                            : userRating === 2
                            ? "😐 Fair"
                            : userRating === 3
                            ? "🙂 Good"
                            : userRating === 4
                            ? "😊 Very Good"
                            : "🤩 Excellent!"}
                        </p>
                      )}
                    </div>

                    <div className="mt-6">
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Share your feedback (optional)
                      </label>
                      <textarea
                        value={ratingMessage}
                        onChange={(e) => setRatingMessage(e.target.value)}
                        placeholder="Tell us what you think about our platform... What do you like? What can we improve?"
                        rows={4}
                        maxLength={1000}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none ${
                          darkMode
                            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                            : "border-gray-300 bg-white text-black"
                        }`}
                      />
                      <p
                        className={`text-xs mt-1 text-right ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {ratingMessage.length}/1000 characters
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={ratingLoading || userRating === 0}
                    className="mt-6 bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {ratingLoading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        ⭐ {existingRating ? "Update Rating" : "Submit Rating"}
                      </>
                    )}
                  </button>
                </form>

                <div
                  className={`mt-6 p-4 rounded-lg ${
                    darkMode
                      ? "bg-blue-900 text-blue-100"
                      : "bg-blue-50 text-blue-800"
                  }`}
                >
                  <p className="text-sm">
                    <strong>💡 Note:</strong> Your rating helps us improve the
                    platform. Thank you for your feedback!
                  </p>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div>
                <h2
                  className={`text-xl font-semibold mb-6 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {[
                    {
                      key: "emailNotifications",
                      label: "Email Notifications",
                      desc: "Receive important updates via email",
                    },
                    {
                      key: "feedbackAlerts",
                      label: "Feedback Alerts",
                      desc: "Get notified when new feedback is received",
                    },
                    {
                      key: "weeklyDigest",
                      label: "Weekly Digest",
                      desc: "Receive a weekly summary of feedback analytics",
                    },
                    {
                      key: "marketingEmails",
                      label: "Marketing Emails",
                      desc: "Receive product updates and announcements",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        darkMode
                          ? "border-gray-700 bg-gray-700"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div>
                        <h3
                          className={`font-medium ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {item.label}
                        </h3>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {item.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div
                          className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all ${
                            darkMode
                              ? "bg-gray-600 peer-focus:ring-blue-300 after:bg-gray-700 peer-checked:bg-blue-600"
                              : "bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 after:bg-white after:border-gray-300 after:border peer-checked:bg-blue-600"
                          }`}
                        ></div>
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleNotificationUpdate}
                  disabled={loading}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div>
                <h2
                  className={`text-xl font-semibold mb-6 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Appearance Settings
                </h2>

                <div
                  className={`flex items-center justify-between p-6 border rounded-lg ${
                    darkMode
                      ? "border-gray-700 bg-gray-700"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div>
                    <h3
                      className={`text-lg font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      🌙 Dark Mode
                    </h3>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Toggle between light and dark theme
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-14 h-8 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:rounded-full after:h-6 after:w-6 after:transition-all ${
                        darkMode
                          ? "bg-blue-600 after:bg-white"
                          : "bg-gray-300 after:bg-white after:border-gray-300 after:border"
                      }`}
                    ></div>
                  </label>
                </div>

                <div
                  className={`mt-6 p-4 rounded-lg ${
                    darkMode
                      ? "bg-blue-900 text-blue-100"
                      : "bg-blue-50 text-blue-800"
                  }`}
                >
                  <p className="text-sm">
                    <strong>💡 Tip:</strong> Dark mode is easier on the eyes
                    during night time. Your preference will be saved
                    automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
