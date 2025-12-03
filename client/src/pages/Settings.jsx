import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { userAPI } from "../services/api";
import Navbar from "../components/Navbar";

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
    }
  }, [user]);

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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className={`mt-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "password", label: "Password", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}>
      <Navbar user={user} />

      <div className={`max-w-4xl mx-auto px-6 py-8 ${darkMode ? "bg-gray-900" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>⚙️ Settings</h1>
            <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Configure your account preferences
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            ← Back to Dashboard
          </button>
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
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          {/* Tabs */}
          <div className={`flex border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-medium transition ${
                  activeTab === tab.id
                    ? darkMode
                      ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700"
                      : "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : darkMode
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-50"
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
                <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Profile Information
                </h2>

                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mr-6">
                    <span className="text-3xl font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {user?.name}
                    </h3>
                    <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{user?.email}</p>
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
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
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
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
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
                    <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
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
                <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Change Password
                </h2>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
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
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
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
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
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

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div>
                <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
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
                        <h3 className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                          {item.label}
                        </h3>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{item.desc}</p>
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
                        <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          darkMode
                            ? "bg-gray-600 peer-focus:ring-blue-300 after:bg-gray-700 peer-checked:bg-blue-600"
                            : "bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 after:bg-white after:border-gray-300 after:border peer-checked:bg-blue-600"
                        }`}></div>
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
                <h2 className={`text-xl font-semibold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Appearance Settings
                </h2>

                <div className={`flex items-center justify-between p-6 border rounded-lg ${
                  darkMode
                    ? "border-gray-700 bg-gray-700"
                    : "border-gray-200 bg-white"
                }`}>
                  <div>
                    <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      🌙 Dark Mode
                    </h3>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
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
                    <div className={`w-14 h-8 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:rounded-full after:h-6 after:w-6 after:transition-all ${
                      darkMode
                        ? "bg-blue-600 after:bg-white"
                        : "bg-gray-300 after:bg-white after:border-gray-300 after:border"
                    }`}></div>
                  </label>
                </div>

                <div className={`mt-6 p-4 rounded-lg ${
                  darkMode
                    ? "bg-blue-900 text-blue-100"
                    : "bg-blue-50 text-blue-800"
                }`}>
                  <p className="text-sm">
                    <strong>💡 Tip:</strong> Dark mode is easier on the eyes during night time. Your preference will be saved automatically.
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
